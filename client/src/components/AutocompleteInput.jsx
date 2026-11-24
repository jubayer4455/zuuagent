import React, { useState, useRef, useEffect } from 'react';

export default function AutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  options = [],
  labelKey = 'name',
  subKey = '',
  placeholder = '',
  disabled = false,
  readOnly = false,
  className = 'erp-input',
  style = {}
}) {
  const [open, setOpen] = useState(false);
  const [hiIdx, setHiIdx] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const term = String(value || '').trim().toLowerCase();
  const filtered = options.filter((opt) => {
    if (!term) return true;
    if (typeof opt === 'string') return opt.toLowerCase().includes(term);
    const main = String(opt[labelKey] || '').toLowerCase();
    const sub = subKey ? String(opt[subKey] || '').toLowerCase() : '';
    const extra1 = String(opt.barcode_id || opt.product_id || opt.mobile || opt.brand_name || '').toLowerCase();
    return main.includes(term) || sub.includes(term) || extra1.includes(term);
  }).slice(0, 30);

  const pickOption = (opt) => {
    const label = typeof opt === 'string' ? opt : opt[labelKey];
    onChange && onChange(label);
    onSelect && onSelect(opt);
    setOpen(false);
  };

  const renderSmartRow = (opt) => {
    if (typeof opt === 'string') {
      return <span>{opt}</span>;
    }

    // Smart Product Row (Name + Brand/Group + Live Stock Badge + Price)
    if (opt.product_id && opt.product_name && labelKey === 'product_name') {
      const stock = Number(opt.stock_qty || 0);
      const price = Number(opt.sales_price || opt.purchase_price || 0);
      return (
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {opt.product_name}
            </div>
            <div className="ac-muted" style={{ fontSize: '11px', color: '#64748b' }}>
              {opt.product_id}{opt.brand_name ? ` • ${opt.brand_name}` : ''}{opt.group_name ? ` • ${opt.group_name}` : ''}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <span className={`ac-badge-stock ${stock > 0 ? 'ac-badge-in' : 'ac-badge-out'}`}>
              Stk: {stock}
            </span>
            {price > 0 && (
              <span className="ac-badge-price">
                ৳{price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Smart Trader Row (Customer/Supplier Name + Mobile + Type/Balance)
    if (opt.cs_id && opt.cs_name && labelKey === 'cs_name') {
      const bal = Number(opt.current_balance ?? opt.opening_balance ?? 0);
      return (
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{opt.cs_name}</div>
            <div className="ac-muted" style={{ fontSize: '11px', color: '#64748b' }}>
              {opt.cs_id}{opt.mobile ? ` • ${opt.mobile}` : ''}{opt.group_name ? ` • ${opt.group_name}` : ''}
            </div>
          </div>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <span className={`ac-badge-stock ${opt.trader_type === 'S' ? 'ac-badge-out' : 'ac-badge-in'}`}>
              {opt.trader_type === 'S' ? 'Supplier' : 'Customer'}
            </span>
            {bal !== 0 && (
              <span className="ac-badge-price">
                ৳{Math.round(bal).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Smart Serial Row
    if (opt.serial_no && labelKey === 'serial_no') {
      return (
        <div className="d-flex justify-content-between align-items-center gap-2">
          <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{opt.serial_no}</span>
          <span className="ac-muted" style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
            {opt.product_name || opt.product_id}
          </span>
        </div>
      );
    }

    // Default Clean Two-Column Row
    const label = opt[labelKey];
    const sub = subKey ? opt[subKey] : '';
    return (
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span style={{ fontWeight: 500 }}>{label}</span>
        {sub !== '' && sub !== undefined && sub !== null && (
          <span className="ac-muted" style={{ fontSize: '11px', color: '#64748b' }}>{sub}</span>
        )}
      </div>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        style={style}
        autoComplete="off"
        onFocus={() => {
          if (!disabled && !readOnly && options.length > 0) {
            setOpen(true);
            setHiIdx(0);
          }
        }}
        onChange={(e) => {
          onChange && onChange(e.target.value);
          setOpen(true);
          setHiIdx(0);
        }}
        onKeyDown={(e) => {
          if (!open || filtered.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHiIdx(prev => Math.min(filtered.length - 1, prev + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHiIdx(prev => Math.max(0, prev - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pickOption(filtered[hiIdx] || filtered[0]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && !disabled && !readOnly && filtered.length > 0 && (
        <ul className="Sear">
          {filtered.map((opt, idx) => (
            <li
              key={idx}
              className={`listItem ${idx === hiIdx ? 'itemHighlighted' : ''}`}
              onMouseEnter={() => setHiIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                pickOption(opt);
              }}
            >
              {renderSmartRow(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
