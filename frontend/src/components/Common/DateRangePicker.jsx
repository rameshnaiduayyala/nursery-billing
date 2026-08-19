import React from 'react';
import { Form, Row, Col, Button, ButtonGroup } from 'react-bootstrap';
import { getPresetDateRange } from '../../utils/formatters';

export default function DateRangePicker({ startDate, endDate, onChange, onApply }) {
  const handlePreset = (preset) => {
    const range = getPresetDateRange(preset);
    onChange(range.start_date, range.end_date);
    if (onApply) onApply(range.start_date, range.end_date);
  };

  return (
    <div className="bg-light p-3 rounded mb-3 border">
      <Row className="g-2 align-items-center">
        <Col xs={12} md="auto">
          <span className="fw-semibold text-secondary small d-block mb-1">Quick Presets:</span>
          <ButtonGroup size="sm" className="flex-wrap">
            <Button variant="outline-secondary" onClick={() => handlePreset('today')}>Today</Button>
            <Button variant="outline-secondary" onClick={() => handlePreset('this_week')}>This Week</Button>
            <Button variant="outline-secondary" onClick={() => handlePreset('this_month')}>This Month</Button>
            <Button variant="outline-secondary" onClick={() => handlePreset('last_month')}>Last Month</Button>
            <Button variant="outline-secondary" onClick={() => handlePreset('this_year')}>This Year</Button>
            <Button variant="outline-danger" onClick={() => handlePreset('clear')}>All Time</Button>
          </ButtonGroup>
        </Col>

        <Col xs={6} sm={4} md={3} className="ms-auto">
          <Form.Group>
            <Form.Label className="small fw-semibold text-secondary mb-1">Start Date</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={startDate || ''}
              onChange={(e) => onChange(e.target.value, endDate)}
            />
          </Form.Group>
        </Col>

        <Col xs={6} sm={4} md={3}>
          <Form.Group>
            <Form.Label className="small fw-semibold text-secondary mb-1">End Date</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={endDate || ''}
              onChange={(e) => onChange(startDate, e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
}
