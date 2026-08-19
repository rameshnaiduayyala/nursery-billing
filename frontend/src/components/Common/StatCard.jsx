import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const iconMap = {
  success: 'stat-icon-success',
  warning: 'stat-icon-warning',
  danger:  'stat-icon-danger',
  info:    'stat-icon-info',
  primary: 'stat-icon-primary',
  purple:  'stat-icon-purple',
};

export default function StatCard({ title, value, icon, color = 'primary', subtitle, rawValue = false }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-card-label">{title}</div>
        <div className="stat-card-value">
          {rawValue ? value : formatCurrency(value)}
        </div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      </div>
      <div className={`stat-card-icon ${iconMap[color] ?? 'stat-icon-primary'}`}>
        <i className={`bi ${icon}`} />
      </div>
    </div>
  );
}
