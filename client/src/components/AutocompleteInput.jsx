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
    const main = typeof opt === 'string' ? opt : String(opt[labelKey] || '');
    const sub = typeof opt === 'object' && subKey ? String(opt[subKey] || '') : '';
    if (!term) return true;
    return main.toLowerCase().includes(term) || sub.toLowerCase().includes(term);
  }).slice(0, 25);

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
          if (!disabled && !readOnly && options.length > 0) setOpen(true);
        }}
        onChange={(e) => {
          onChange && onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && !disabled && !readOnly && filtered.length > 0 && (
        <ul className="Sear">
          {filtered.map((opt, idx) => {
            const label = typeof opt === 'string' ? opt : opt[labelKey];
            const sub = typeof opt === 'object' && subKey ? opt[subKey] : '';
            return (
              <li
                key={idx}
                className="listItem"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange && onChange(label);
                  onSelect && onSelect(opt);
                  setOpen(false);
                }}
              >
                <div className="d-flex justify-content-between">
                  <span>{label}</span>
                  {sub && <span style={{ opacity: 0.75, fontSize: '11.5px' }}>{sub}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
