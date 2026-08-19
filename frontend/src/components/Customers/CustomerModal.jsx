import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import customerService from '../../services/customerService';

export default function CustomerModal({ show, onHide, customer, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CUSTOMER',
    phone: '',
    email: '',
    address: '',
    city: '',
    gst_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        type: customer.type || 'CUSTOMER',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        gst_number: customer.gst_number || '',
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'CUSTOMER',
        phone: '',
        email: '',
        address: '',
        city: '',
        gst_number: '',
        notes: ''
      });
    }
    setError('');
  }, [customer, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer Name is required.');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (customer && customer.id) {
        res = await customerService.update({ ...formData, id: customer.id });
      } else {
        res = await customerService.create(formData);
      }

      if (res.success) {
        onSuccess(res.data || res);
        onHide();
      }
    } catch (err) {
      setError(err.message || 'Failed to save customer details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <i className="bi bi-person-plus-fill text-primary me-2"></i>
          {customer ? 'Edit Customer / Exporter' : 'Add Customer / Exporter'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Name *</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. ABC Exports Pvt Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Party Type *</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="CUSTOMER">Customer (Domestic)</option>
                  <option value="EXPORTER">Exporter (Bulk/Export)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="e.g. sales@abcexports.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">City / Town</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Hyderabad / Kakinada"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">GST Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 37AAAAA0000A1Z5"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Billing Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Notes or preferred plant varieties"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading} className="fw-bold">
            {loading ? <Spinner size="sm" animation="border" /> : (customer ? 'Update Customer' : 'Save Customer')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
