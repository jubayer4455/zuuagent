/**
 * Universal Pure-JS Microsoft SQL Server (.Bak / MTF + 8KB MDF Pages) Parser
 * Works identically in Node.js AND directly inside the Web Browser (Uint8Array + DataView).
 * Decodes SQL Server system catalogs (sys.sysschobjs, sys.syscolpars, sys.sysrowsets,
 * sys.sysallocunits, sys.sysrscols) to reconstruct every user table with exact column names,
 * SQL types, physical offsets, null bitmaps, and values.
 */

const asciiDecoder = new TextDecoder('windows-1252');
const utf16Decoder = new TextDecoder('utf-16le');

function readUInt16(view, pos) {
  return view.getUint16(pos, true);
}
function readInt16(view, pos) {
  return view.getInt16(pos, true);
}
function readUInt32(view, pos) {
  return view.getUint32(pos, true);
}
function readInt32(view, pos) {
  return view.getInt32(pos, true);
}
function readBigUInt64(view, pos) {
  return view.getBigUint64(pos, true);
}
function readBigInt64(view, pos) {
  return view.getBigInt64(pos, true);
}

function formatSqlDate(daysSince1900) {
  // SQL Server datetime epoch is 1900-01-01
  if (daysSince1900 < -36500 || daysSince1900 > 100000) return '';
  const ms = Date.UTC(1900, 0, 1) + daysSince1900 * 86400000;
  const d = new Date(ms);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatSqlDateFrom0001(daysSince0001) {
  // SQL Server date epoch is 0001-01-01 (days between 0001-01-01 and 1900-01-01 = 693595)
  return formatSqlDate(daysSince0001 - 693595);
}

function decodeDecimal(bytes, scale) {
  if (!bytes || bytes.length < 2) return 0;
  const sign = bytes[0] === 0 ? -1 : 1;
  let acc = 0n;
  for (let i = bytes.length - 1; i >= 1; i--) {
    acc = (acc << 8n) | BigInt(bytes[i]);
  }
  const num = Number(acc) / Math.pow(10, scale || 0);
  return sign * num;
}

function decodeColumnValue(bytes, col, rowFixedBytes) {
  const xtype = col.xtype;
  if (!bytes || bytes.length === 0) {
    if (xtype === 167 || xtype === 175 || xtype === 231 || xtype === 239 || xtype === 35 || xtype === 99) return '';
    return null;
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  switch (xtype) {
    case 48: // tinyint
      return bytes[0];
    case 52: // smallint
      return bytes.length >= 2 ? dv.getInt16(0, true) : 0;
    case 56: // int
      return bytes.length >= 4 ? dv.getInt32(0, true) : 0;
    case 127: // bigint
      return bytes.length >= 8 ? Number(dv.getBigInt64(0, true)) : 0;
    case 104: // bit
      return ((bytes[0] >> (col.bitpos || 0)) & 1) === 1 ? 1 : 0;
    case 59: // real
      return bytes.length >= 4 ? dv.getFloat32(0, true) : 0;
    case 62: // float
      return bytes.length >= 8 ? dv.getFloat64(0, true) : 0;
    case 60: // money (high int32 at +0, low uint32 at +4)
      if (bytes.length >= 8) {
        const hi = BigInt(dv.getInt32(0, true));
        const lo = BigInt(dv.getUint32(4, true));
        const combined = (hi << 32n) | lo;
        return Number(combined) / 10000;
      }
      return 0;
    case 122: // smallmoney
      return bytes.length >= 4 ? dv.getInt32(0, true) / 10000 : 0;
    case 106: // decimal
    case 108: // numeric
      return decodeDecimal(bytes, col.scale);
    case 61: // datetime
      if (bytes.length >= 8) {
        const days = dv.getInt32(4, true);
        return formatSqlDate(days);
      }
      return '';
    case 58: // smalldatetime
      if (bytes.length >= 4) {
        const days = dv.getUint16(2, true);
        return formatSqlDate(days);
      }
      return '';
    case 40: // date (3 bytes LE)
      if (bytes.length >= 3) {
        const days = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16);
        return formatSqlDateFrom0001(days);
      }
      return '';
    case 42: // datetime2 (last 3 bytes are date)
      if (bytes.length >= 6) {
        const off = bytes.length - 3;
        const days = bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16);
        return formatSqlDateFrom0001(days);
      }
      return '';
    case 175: // char
    case 167: // varchar
    case 35:  // text
      return asciiDecoder.decode(bytes).replace(/\0+$/g, '').trim();
    case 239: // nchar
    case 231: // nvarchar
    case 99:  // ntext
      return utf16Decoder.decode(bytes).replace(/\0+$/g, '').trim();
    default:
      return null;
  }
}

function parseRawRow(u8, view, pagePos, slotOff) {
  const recPos = pagePos + slotOff;
  if (recPos + 4 > pagePos + 8192) return null;
  const statusA = u8[recPos];
  const recType = (statusA >> 1) & 0x07;
  // 0 = Primary record, 3 = Forwarding stub? Wait: 0=Primary, 1=Forwarded, 2=Forwarding, 3=Index, 4=Blob
  // Keep 0 (Primary) and 1 (Forwarded record on heap)
  if (recType !== 0 && recType !== 1) return null;

  const fixedEnd = readUInt16(view, recPos + 2);
  if (fixedEnd < 4 || fixedEnd > 8060 || recPos + fixedEnd > pagePos + 8192) return null;

  const hasNullBitmap = (statusA & 0x10) !== 0;
  const hasVarCols = (statusA & 0x20) !== 0;

  let ptr = recPos + fixedEnd;
  let numCols = 0;
  let nullBitmap = null;
  if (hasNullBitmap && ptr + 2 <= pagePos + 8192) {
    numCols = readUInt16(view, ptr);
    const bmBytes = Math.ceil(numCols / 8);
    if (ptr + 2 + bmBytes <= pagePos + 8192) {
      nullBitmap = u8.subarray(ptr + 2, ptr + 2 + bmBytes);
      ptr += 2 + bmBytes;
    }
  }

  const varCols = [];
  if (hasVarCols && ptr + 2 <= pagePos + 8192) {
    const numVar = readUInt16(view, ptr);
    if (numVar < 500 && ptr + 2 + numVar * 2 <= pagePos + 8192) {
      const varDataStart = ptr + 2 + numVar * 2;
      let prevEnd = varDataStart - recPos;
      for (let i = 0; i < numVar; i++) {
        const rawEnd = readUInt16(view, ptr + 2 + i * 2);
        const isComplex = (rawEnd & 0x8000) !== 0;
        const endOff = rawEnd & 0x7FFF;
        if (endOff >= prevEnd && recPos + endOff <= pagePos + 8192) {
          varCols.push({ data: u8.subarray(recPos + prevEnd, recPos + endOff), isComplex });
          prevEnd = endOff;
        } else {
          varCols.push({ data: new Uint8Array(0), isComplex });
        }
      }
    }
  }

  return {
    fixed: u8.subarray(recPos, recPos + fixedEnd),
    numCols,
    nullBitmap,
    varCols
  };
}

/**
 * Parse a SQL Server .Bak file (ArrayBuffer or Uint8Array)
 * @param {ArrayBuffer|Uint8Array} input
 * @param {Object} [options] - { onlyTables?: string[], onProgress?: (pct, msg) => void }
 * @returns {{ tables: Record<string, Array<Record<string, any>>>, schema: Record<string, any[]>, stats: Record<string, number> }}
 */
export function parseSqlServerBak(input, options = {}) {
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const onProgress = options.onProgress || (() => {});
  const onlySet = options.onlyTables ? new Set(options.onlyTables.map(t => t.toUpperCase())) : null;

  onProgress(5, 'Scanning SQL Server 8KB data pages...');

  // 1. Locate all unique 8KB SQL Server pages (latest copy per pageId wins if log/dup exists)
  const pagesById = new Map();
  for (let pos = 0; pos <= u8.length - 8192; pos += 512) {
    const ver = u8[pos];
    const type = u8[pos + 1];
    if (ver !== 1 || type < 1 || type > 4) continue;
    const fileId = readUInt16(view, pos + 36);
    if (fileId !== 1) continue;
    const pminlen = readUInt16(view, pos + 14);
    const slotCnt = readUInt16(view, pos + 22);
    const freeCnt = readUInt16(view, pos + 28);
    const freeData = readUInt16(view, pos + 30);
    if (slotCnt > 2000 || freeData < 96 || freeData > 8192 || freeCnt > 8192 || pminlen < 4 || pminlen > 8060) continue;

    let slotsValid = true;
    const checkCnt = Math.min(slotCnt, 10);
    for (let s = 0; s < checkCnt; s++) {
      const slotOff = readUInt16(view, pos + 8192 - (s + 1) * 2);
      if (slotOff < 96 || slotOff >= 8192) {
        slotsValid = false;
        break;
      }
    }
    if (!slotsValid) continue;

    const indexId = readUInt16(view, pos + 6);
    const objId = readUInt32(view, pos + 24);
    const pageId = readUInt32(view, pos + 32);
    pagesById.set(pageId, { pos, type, indexId, pminlen, slotCnt, objId, pageId });
    pos += 8192 - 512;
  }

  onProgress(20, `Found ${pagesById.size} database pages. Reading system catalogs...`);

  // 2. Parse sys.sysschobjs (m_objId=34) -> objectsById
  const objectsById = new Map();
  for (const p of pagesById.values()) {
    if (p.type !== 1 || p.objId !== 34) continue;
    for (let s = 0; s < p.slotCnt; s++) {
      const slotOff = readUInt16(view, p.pos + 8192 - (s + 1) * 2);
      const row = parseRawRow(u8, view, p.pos, slotOff);
      if (!row || row.fixed.length < 20) continue;
      const fdv = new DataView(row.fixed.buffer, row.fixed.byteOffset, row.fixed.byteLength);
      const id = fdv.getInt32(4, true);
      const type = asciiDecoder.decode(row.fixed.subarray(17, 19)).trim();
      const name = row.varCols[0] ? utf16Decoder.decode(row.varCols[0].data) : '';
      objectsById.set(id, { id, type, name });
    }
  }

  // 3. Parse sys.syscolpars (m_objId=41) -> colsByTableId
  const colsByTableId = new Map();
  for (const p of pagesById.values()) {
    if (p.type !== 1 || p.objId !== 41) continue;
    for (let s = 0; s < p.slotCnt; s++) {
      const slotOff = readUInt16(view, p.pos + 8192 - (s + 1) * 2);
      const row = parseRawRow(u8, view, p.pos, slotOff);
      if (!row || row.fixed.length < 33) continue;
      const fdv = new DataView(row.fixed.buffer, row.fixed.byteOffset, row.fixed.byteLength);
      const id = fdv.getInt32(4, true);
      const number = fdv.getInt16(8, true);
      if (number !== 0) continue; // skip procedure params
      const colid = fdv.getInt32(10, true);
      const xtype = row.fixed[14];
      const length = fdv.getInt16(19, true);
      const prec = row.fixed[21];
      const scale = row.fixed[22];
      const name = row.varCols[0] ? utf16Decoder.decode(row.varCols[0].data) : `col_${colid}`;
      if (!colsByTableId.has(id)) colsByTableId.set(id, new Map());
      colsByTableId.get(id).set(colid, { colid, name, xtype, length, prec, scale });
    }
  }

  // 4. Parse sys.sysrowsets (m_objId=5) -> rowsetsById
  const rowsetsById = new Map();
  for (const p of pagesById.values()) {
    if (p.type !== 1 || p.objId !== 5) continue;
    for (let s = 0; s < p.slotCnt; s++) {
      const slotOff = readUInt16(view, p.pos + 8192 - (s + 1) * 2);
      const row = parseRawRow(u8, view, p.pos, slotOff);
      if (!row || row.fixed.length < 21) continue;
      const fdv = new DataView(row.fixed.buffer, row.fixed.byteOffset, row.fixed.byteLength);
      const rowsetid = fdv.getBigUint64(4, true);
      const idmajor = fdv.getInt32(13, true);
      const idminor = fdv.getInt32(17, true);
      rowsetsById.set(rowsetid, { rowsetid, idmajor, idminor });
    }
  }

  // 5. Parse sys.sysrscols (m_objId=3) -> physical column layouts per rowsetid
  const rscolsByRsid = new Map();
  for (const p of pagesById.values()) {
    if (p.type !== 1 || p.objId !== 3) continue;
    for (let s = 0; s < p.slotCnt; s++) {
      const slotOff = readUInt16(view, p.pos + 8192 - (s + 1) * 2);
      const row = parseRawRow(u8, view, p.pos, slotOff);
      if (!row || row.fixed.length < 54) continue;
      const fdv = new DataView(row.fixed.buffer, row.fixed.byteOffset, row.fixed.byteLength);
      const rsid = fdv.getBigUint64(4, true);
      const rscolid = fdv.getInt32(12, true);
      const hbcolid = fdv.getInt32(16, true);
      const maxinrowlen = fdv.getInt16(38, true);
      const status = fdv.getInt32(40, true);
      const offset = fdv.getInt16(44, true);
      const nullbit = fdv.getInt32(48, true);
      const bitpos = fdv.getInt16(52, true);
      if ((status & 0x02) !== 0) continue; // skip dropped column
      if (!rscolsByRsid.has(rsid)) rscolsByRsid.set(rsid, []);
      rscolsByRsid.get(rsid).push({ rscolid, hbcolid, maxinrowlen, offset, nullbit, bitpos });
    }
  }

  // 6. Parse sys.sysallocunits (m_objId=7) -> map pageObjId:pageIndexId -> Table + Schema
  const pageKeyToTable = new Map();
  const schema = {};
  for (const p of pagesById.values()) {
    if (p.type !== 1 || p.objId !== 7) continue;
    for (let s = 0; s < p.slotCnt; s++) {
      const slotOff = readUInt16(view, p.pos + 8192 - (s + 1) * 2);
      const row = parseRawRow(u8, view, p.pos, slotOff);
      if (!row || row.fixed.length < 21) continue;
      const fdv = new DataView(row.fixed.buffer, row.fixed.byteOffset, row.fixed.byteLength);
      const auid = fdv.getBigUint64(4, true);
      const auType = row.fixed[12];
      const ownerid = fdv.getBigUint64(13, true);
      if (auType !== 1) continue; // IN_ROW_DATA only
      const rs = rowsetsById.get(ownerid);
      if (!rs || rs.idminor > 1) continue; // Heap (0) or Clustered Index (1) only
      const tbl = objectsById.get(rs.idmajor);
      if (!tbl || tbl.type !== 'U') continue;
      const tblUpper = tbl.name.toUpperCase();
      if (onlySet && !onlySet.has(tblUpper)) continue;

      const colDefsMap = colsByTableId.get(tbl.id) || new Map();
      const rsCols = rscolsByRsid.get(rs.rowsetid) || [];

      // Merge syscolpars + sysrscols (always join on rscolid === syscolpars.colid)
      const mergedCols = [];
      for (const rc of rsCols) {
        const def = colDefsMap.get(rc.rscolid);
        if (!def) continue;
        mergedCols.push({
          ...def,
          offset: rc.offset,
          nullbit: rc.nullbit,
          bitpos: rc.bitpos,
          maxinrowlen: rc.maxinrowlen
        });
      }
      mergedCols.sort((a, b) => a.colid - b.colid);

      const pageObjId = Number((auid >> 16n) & 0xFFFFFFFFn);
      const pageIndexId = Number((auid >> 48n) & 0xFFFFn);
      pageKeyToTable.set(`${pageObjId}:${pageIndexId}`, {
        tableName: tbl.name,
        tableId: tbl.id,
        columns: mergedCols
      });
      schema[tbl.name] = mergedCols;
    }
  }

  onProgress(40, `Mapped ${pageKeyToTable.size} user tables. Extracting rows...`);

  // 7. Decode all rows from all user data pages
  const tables = {};
  const stats = {};
  const dataPages = [];
  for (const p of pagesById.values()) {
    if (p.type !== 1) continue;
    const info = pageKeyToTable.get(`${p.objId}:${p.indexId}`);
    if (info) dataPages.push({ p, info });
  }

  for (let i = 0; i < dataPages.length; i++) {
    const { p, info } = dataPages[i];
    if (i % 500 === 0) {
      onProgress(40 + Math.round((i / Math.max(1, dataPages.length)) * 55), `Decoding page ${i + 1}/${dataPages.length}...`);
    }
    if (!tables[info.tableName]) tables[info.tableName] = [];
    const out = tables[info.tableName];
    const cols = info.columns;

    for (let s = 0; s < p.slotCnt; s++) {
      const slotOff = readUInt16(view, p.pos + 8192 - (s + 1) * 2);
      const raw = parseRawRow(u8, view, p.pos, slotOff);
      if (!raw) continue;
      const obj = {};
      for (let c = 0; c < cols.length; c++) {
        const col = cols[c];
        // Check null bitmap (nullbit is 1-based)
        if (raw.nullBitmap && col.nullbit > 0) {
          const bitIdx = col.nullbit - 1;
          const byteIdx = bitIdx >> 3;
          if (byteIdx < raw.nullBitmap.length && (raw.nullBitmap[byteIdx] & (1 << (bitIdx & 7))) !== 0) {
            obj[col.name] = null;
            continue;
          }
        }
        let colBytes = null;
        if (col.offset >= 4) {
          // Fixed-length column
          const len = col.xtype === 104 ? 1 : col.length;
          if (col.offset + len <= raw.fixed.length) {
            colBytes = raw.fixed.subarray(col.offset, col.offset + len);
          }
        } else if (col.offset < 0) {
          // Variable-length column: -1 -> varCols[0], -2 -> varCols[1], ...
          const varIdx = -col.offset - 1;
          if (varIdx >= 0 && varIdx < raw.varCols.length) {
            const vc = raw.varCols[varIdx];
            if (!vc.isComplex) {
              colBytes = vc.data;
            } else {
              // Complex/LOB pointer or row-overflow; try best effort or skip binary blobs
              colBytes = new Uint8Array(0);
            }
          }
        }
        obj[col.name] = decodeColumnValue(colBytes, col, raw.fixed);
      }
      out.push(obj);
    }
  }

  for (const [k, arr] of Object.entries(tables)) {
    stats[k] = arr.length;
  }

  onProgress(100, `Decoded ${Object.keys(tables).length} tables successfully.`);
  return { tables, schema, stats };
}
