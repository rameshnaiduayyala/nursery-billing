import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 border-bottom pb-2">
      <div>
        <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          {title}
        </h3>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
      {actions && (
        <div className="mt-2 mt-md-0 d-flex gap-2 align-items-center">
          {actions}
        </div>
      )}
    </div>
  );
}
