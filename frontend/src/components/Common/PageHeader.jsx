import React from 'react';

export default function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">
          {icon && (
            <span className="page-header-title-icon">
              <i className={`bi ${icon}`} />
            </span>
          )}
          {title}
        </h1>
        {/* {subtitle && <p className="page-header-subtitle">{subtitle}</p>} */}
      </div>
      {actions && (
        <div className="page-header-actions">{actions}</div>
      )}
    </div>
  );
}
