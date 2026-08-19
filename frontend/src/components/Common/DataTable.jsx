/**
 * DataTable - Premium reusable table component.
 *
 * Props:
 *  columns    - Array<{ key, label, align?, render? }>
 *  data       - Array of row objects
 *  loading    - bool
 *  emptyIcon  - bootstrap icon class (default: bi-inbox)
 *  emptyText  - string (default: 'No records found.')
 *  title      - Card title
 *  titleIcon  - bootstrap icon class
 *  actions    - ReactNode (header right-side actions)
 *  footer     - ReactNode (below table)
 *  className  - extra class on outer wrapper
 *  rowKey     - key field for React key (default: 'id')
 */
import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyIcon = 'bi-inbox',
  emptyText = 'No records found.',
  title,
  titleIcon,
  actions,
  footer,
  className = '',
  rowKey = 'id',
}) {
  return (
    <div className={`data-card ${className}`}>
      {/* Card header */}
      {(title || actions) && (
        <div className="data-card-header">
          {title && (
            <span className="data-card-title">
              {titleIcon && <i className={`bi ${titleIcon}`} />}
              {title}
            </span>
          )}
          {actions && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span className="loading-text">Loading data…</span>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="table-empty">
                    <i className={`bi ${emptyIcon}`} />
                    <span className="table-empty-text">{emptyText}</span>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row[rowKey] ?? idx}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                        data-label={col.label}
                      >
                        {col.render ? col.render(row[col.key], row, idx) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer slot */}
      {footer && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-light)',
          background: '#fafbfc',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}
