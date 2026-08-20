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

  // Determine current active preset label for dropdown select
  const currentVal = !startDate && !endDate ? 'clear' : 'custom';

  return (
    <div className="filter-bar p-3 mb-3 bg-white rounded-3 shadow-sm border">
      <div className="w-100 d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-2">

        {/* ── Mobile Dropdown (< md) ── */}
        <div className="d-md-none w-100 mb-1">
          <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
            Quick Filter
          </label>
          <select
            className="form-select form-select-sm"
            style={{ height: '36px', fontSize: '0.82rem', borderRadius: '8px' }}
            value={currentVal}
            onChange={(e) => handlePreset(e.target.value)}
          >
            <option value="clear">📅 All Time (Show All)</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        {/* ── Desktop / Tablet Presets (≥ md) ── */}
        <div className="d-none d-md-flex flex-column gap-1">
          <span className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
            Quick Presets
          </span>
          <div className="d-flex flex-wrap gap-1">
            {PRESETS.map((p) => {
              const isActive = p.key === 'clear' && !startDate && !endDate;
              return (
                <button
                  key={p.key}
                  type="button"
                  className={`filter-preset-btn ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    borderRadius: '20px',
                    fontWeight: 500
                  }}
                  onClick={() => handlePreset(p.key)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Date Inputs (Side by side on mobile) ── */}
        <div className="w-100 w-md-auto d-flex align-items-end gap-2 ms-md-auto mt-2 mt-md-0">
          <div className="flex-fill" style={{ minWidth: '120px' }}>
            <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              Start Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ height: '36px', fontSize: '0.82rem', borderRadius: '8px' }}
              value={startDate || ''}
              onChange={(e) => onChange(e.target.value, endDate)}
            />
          </div>

          <div className="flex-fill" style={{ minWidth: '120px' }}>
            <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              End Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ height: '36px', fontSize: '0.82rem', borderRadius: '8px' }}
              value={endDate || ''}
              onChange={(e) => onChange(startDate, e.target.value)}
            />
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center"
              style={{ height: '36px', borderRadius: '8px', padding: '0 10px', fontSize: '0.78rem' }}
              onClick={() => handlePreset('clear')}
              title="Clear Filter"
            >
              <i className="bi bi-x-lg me-1" /> Clear
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
