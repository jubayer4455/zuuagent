import React from 'react';
import { useErp } from '../context/ErpContext.jsx';

export default function PrintModal() {
  const { modalDoc, closePrint, session } = useErp();
  if (!modalDoc) return null;

  const {
    title = 'Report Preview',
    subtitle = '',
    meta = {},
    columns = [],
    rows = [],
    summary = {},
    mode = 'report', // 'report' | 'invoice' | 'challan' | 'a5' | 'barcode' | 'qr' | 'pad'
    excelParams = null,
    customContent = null
  } = modalDoc;

  const handleDownloadExcel = async () => {
    if (excelParams) {
      const res = await fetch('/api/reports/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excelParams)
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${String(title).replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    }
    // Client-side CSV/XLS fallback
    const lines = [
      ['HAZI TRADERS'],
      [title],
      columns,
      ...rows
    ].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${String(title).replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    const content = document.getElementById('erp-print-area')?.innerHTML || '';
    const html = `<html><head><meta charset="utf-8"><title>${title}</title></head><body>${content}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${String(title).replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 5000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '6px',
        width: mode === 'a5' ? '640px' : '1120px',
        maxWidth: '98vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        fontFamily: "'Arial Narrow', Arial, sans-serif"
      }}>
        {/* Top Action Bar */}
        <div className="no-print d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ backgroundColor: '#e9ecef' }}>
          <div className="fw-bold" style={{ fontSize: '16px' }}>
            Crystal Report / Voucher Viewer — {title}
          </div>
          <div className="d-flex gap-2">
            <button className="erp-btn" onClick={() => window.print()}>Print Now</button>
            <button className="erp-btn" onClick={handleDownloadExcel}>Export Excel (.xlsx)</button>
            <button className="erp-btn" onClick={handleDownloadWord}>Convert Word (.doc)</button>
            <button className="erp-btn" style={{ background: '#dc3545', color: '#fff', borderColor: '#b02a37' }} onClick={closePrint}>Close [X]</button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="erp-print-area" style={{ padding: '20px 26px', overflowY: 'auto', flex: 1 }}>
          {mode !== 'pad' && (
            <div className="text-center border-bottom pb-2 mb-3">
              <div style={{ fontSize: '23px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                {session?.branchName || 'HAZI TRADERS'}
              </div>
              <div style={{ fontSize: '13.5px' }}>
                Motijheel Commercial Area, Dhaka | Mobile: 01818524712, 01402338209
              </div>
              <div style={{
                display: 'inline-block',
                marginTop: '4px',
                padding: '2px 16px',
                backgroundColor: '#cfe2ff',
                border: '1px solid #9ec5fe',
                borderRadius: '3px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {title}
              </div>
              {subtitle && <div className="mt-1 fw-bold" style={{ fontSize: '13.5px', color: '#333' }}>{subtitle}</div>}
            </div>
          )}

          {mode === 'pad' && (
            <div style={{ marginTop: '75px', borderBottom: '1px solid #000', paddingBottom: '6px', marginBottom: '12px' }} className="text-center">
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{title} (Company Letterhead Pad Print)</div>
            </div>
          )}

          {/* Meta Key-Value Header */}
          {meta && Object.keys(meta).length > 0 && (
            <div className="row g-2 mb-3 p-2 border rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '13.5px' }}>
              {Object.entries(meta).map(([k, v]) => (
                <div key={k} className="col-md-4 col-6">
                  <span className="fw-bold">{k}: </span>
                  <span>{v || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom Barcode / QR View */}
          {customContent && <div className="my-3">{customContent}</div>}

          {/* Data Table */}
          {columns.length > 0 && (
            <table className="erp-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  {columns.map((c, i) => (
                    <th key={i}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-3">No records found for the selected criteria.</td>
                  </tr>
                ) : (
                  rows.map((r, rIdx) => (
                    <tr key={rIdx}>
                      {r.map((cell, cIdx) => (
                        <td key={cIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Summary Box */}
          {summary && Object.keys(summary).length > 0 && (
            <div className="d-flex justify-content-end mt-3">
              <div className="border rounded p-2" style={{ minWidth: '280px', backgroundColor: '#f8f9fa' }}>
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k} className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '14px' }}>
                    <span className="fw-bold">{k}:</span>
                    <span className="fw-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="d-flex justify-content-between mt-5 pt-4" style={{ fontSize: '13px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '3px', minWidth: '140px', textAlign: 'center' }}>
              Received By / Customer
            </div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '3px', minWidth: '140px', textAlign: 'center' }}>
              Prepared By ({session?.userName || 'JUBAYER'})
            </div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '3px', minWidth: '140px', textAlign: 'center' }}>
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
