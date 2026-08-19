import React from 'react';
import { Card } from 'react-bootstrap';
import { formatCurrency } from '../../utils/formatters';

export default function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card className="h-100 shadow-sm border-0 rounded-3">
      <Card.Body className="p-3 d-flex align-items-center justify-content-between">
        <div>
          <span className="text-secondary small fw-semibold d-block mb-1">{title}</span>
          <h4 className="fw-bold mb-0 text-dark">{formatCurrency(value)}</h4>
          {subtitle && <small className="text-muted d-block mt-1">{subtitle}</small>}
        </div>
        <div
          className={`bg-${color}-subtle text-${color} rounded-circle p-3 d-flex align-items-center justify-content-center`}
          style={{ width: '54px', height: '54px' }}
        >
          <i className={`bi ${icon} fs-3`}></i>
        </div>
      </Card.Body>
    </Card>
  );
}
