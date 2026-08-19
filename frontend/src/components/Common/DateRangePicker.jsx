import React from 'react';
import { getPresetDateRange } from '../../utils/formatters';

const PRESETS = [
  { key: 'today',      label: 'Today' },
  { key: 'this_week',  label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_year',  label: 'This Year' },
  { key: 'clear',      label: 'All Time' },
];

export default function DateRangePicker({ startDate, endDate, onChange, onApply }) {
  const handlePreset = (preset) => {
    const range = getPresetDateRange(preset);
    onChange(range.start_date, range.end_date);
    if (onApply) onApply(range.start_date, range.end_date);
  };

  return (
    <div className="filter-bar">
      {/* Quick Presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="form-label" style={{ margin: 0 }}>Quick Presets</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`filter-preset-btn${p.key === 'clear' && !startDate && !endDate ? ' active' : ''}`}
              onClick={() => handlePreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginLeft: 'auto', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ margin: 0 }}>Start Date</label>
          <input
            type="date"
            className="form-control"
            style={{ height: '34px', fontSize: '0.82rem', minWidth: '140px' }}
            value={startDate || ''}
            onChange={(e) => onChange(e.target.value, endDate)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ margin: 0 }}>End Date</label>
          <input
            type="date"
            className="form-control"
            style={{ height: '34px', fontSize: '0.82rem', minWidth: '140px' }}
            value={endDate || ''}
            onChange={(e) => onChange(startDate, e.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            className="filter-preset-btn"
            style={{ marginBottom: '1px' }}
            onClick={() => handlePreset('clear')}
          >
            <i className="bi bi-x" style={{ marginRight: '3px' }} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
