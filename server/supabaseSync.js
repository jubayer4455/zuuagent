import zlib from 'zlib';
import fs from 'fs';
import { db, SEED_GZ_PATH, SUPABASE_URL, SUPABASE_KEY, exportDatabaseBuffer, reloadDatabaseFromBuffer } from './db.js';

const MANIFEST_KEY = 'hazi_erp_db_manifest';
const CHUNK_PREFIX = 'hazi_erp_db_chunk_';
const CHUNK_SIZE = 1_200_000; // ~1.2 MB base64 per chunk (safe for Supabase PostgREST)

let hydrated = false;
let localVersion = 0;

try {
  if (fs.existsSync(SEED_GZ_PATH)) {
    localVersion = Math.floor(fs.statSync(SEED_GZ_PATH).mtimeMs);
  }
} catch {}

function supaHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

export async function hydrateFromSupabase(force = false) {
  if (hydrated && !force) return;
  hydrated = true;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/erp_snapshots?snapshot_key=eq.${MANIFEST_KEY}&select=payload,updated_at`,
      { headers: supaHeaders() }
    );
    if (!res.ok) return;
    const rows = await res.json();
    const manifest = rows?.[0]?.payload;
    if (!manifest || !manifest.totalChunks || !manifest.version) return;

    // Only pull remote chunks if Supabase has a strictly newer snapshot than bundled local seed
    if (!force && manifest.version <= localVersion) {
      return;
    }

    const keys = [];
    for (let i = 0; i < manifest.totalChunks; i++) {
      keys.push(`${CHUNK_PREFIX}${i}`);
    }

    const chunkResults = await Promise.all(
      keys.map(async (k) => {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/erp_snapshots?snapshot_key=eq.${k}&select=payload`,
          { headers: supaHeaders() }
        );
        if (!r.ok) return null;
        const arr = await r.json();
        return arr?.[0]?.payload?.data || null;
      })
    );

    if (chunkResults.some(c => !c)) return;
    const fullB64 = chunkResults.join('');
    const gzBuf = Buffer.from(fullB64, 'base64');
    const sqliteBuf = zlib.gunzipSync(gzBuf);
    await reloadDatabaseFromBuffer(sqliteBuf);
    localVersion = manifest.version;
    console.log(`[Supabase] Hydrated DB snapshot v${manifest.version} (${(gzBuf.length / 1024 / 1024).toFixed(2)} MB gz)`);
  } catch (e) {
    console.error('Supabase hydration note:', e.message);
  }
}

let pushInFlight = false;

export async function pushSnapshotToSupabase(options = {}) {
  const { force = false } = options;
  if (pushInFlight && !force) return false;
  pushInFlight = true;
  try {
    const rawBuf = exportDatabaseBuffer();
    const gzBuf = zlib.gzipSync(rawBuf, { level: 6 });
    const b64 = gzBuf.toString('base64');
    const totalChunks = Math.ceil(b64.length / CHUNK_SIZE);
    const version = Date.now();
    const nowIso = new Date().toISOString();

    // Upload chunks sequentially/in small batches to stay gentle on PostgREST
    for (let i = 0; i < totalChunks; i++) {
      const slice = b64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/erp_snapshots`, {
        method: 'POST',
        headers: supaHeaders({ Prefer: 'resolution=merge-duplicates' }),
        body: JSON.stringify({
          snapshot_key: `${CHUNK_PREFIX}${i}`,
          payload: { index: i, version, data: slice },
          updated_at: nowIso
        })
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Chunk ${i} upload failed (${r.status}): ${txt.slice(0, 150)}`);
      }
    }

    // Remove legacy demo snapshot key so old demo data can never come back
    await fetch(`${SUPABASE_URL}/rest/v1/erp_snapshots?snapshot_key=eq.hazi_erp_live_state`, {
      method: 'DELETE',
      headers: supaHeaders()
    }).catch(() => {});

    // Publish manifest atomically last
    const prodCnt = db.prepare('SELECT COUNT(*) AS c FROM products').get()?.c || 0;
    const traderCnt = db.prepare('SELECT COUNT(*) AS c FROM traders').get()?.c || 0;
    const salesCnt = db.prepare('SELECT COUNT(*) AS c FROM sales').get()?.c || 0;
    const purCnt = db.prepare('SELECT COUNT(*) AS c FROM purchases').get()?.c || 0;

    const mRes = await fetch(`${SUPABASE_URL}/rest/v1/erp_snapshots`, {
      method: 'POST',
      headers: supaHeaders({ Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify({
        snapshot_key: MANIFEST_KEY,
        payload: {
          version,
          totalChunks,
          gzipBytes: gzBuf.length,
          rawBytes: rawBuf.length,
          stats: { products: prodCnt, traders: traderCnt, sales: salesCnt, purchases: purCnt },
          updatedAt: nowIso
        },
        updated_at: nowIso
      })
    });
    if (!mRes.ok) {
      throw new Error(`Manifest publish failed (${mRes.status})`);
    }
    localVersion = version;
    return true;
  } catch (e) {
    console.error('Supabase snapshot sync note:', e.message);
    return false;
  } finally {
    pushInFlight = false;
  }
}
