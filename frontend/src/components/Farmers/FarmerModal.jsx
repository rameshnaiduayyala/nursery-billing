import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import farmerService from '../../services/farmerService';

export default function FarmerModal({ show, onHide, farmer, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    address: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (farmer) {
      setFormData({
        name: farmer.name || '',
        phone: farmer.phone || '',
        location: farmer.location || farmer.village || '',
        address: farmer.address || '',
        notes: farmer.notes || ''
      });
    } else {
      setFormData({ name: '', phone: '', location: '', address: '', notes: '' });
    }
    setError('');
  }, [farmer, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Farmer Name is required.');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (farmer && farmer.id) {
        res = await farmerService.update({ ...formData, id: farmer.id });
      } else {
        res = await farmerService.create(formData);
      }

      if (res.success) {
        onSuccess(res.data || res);
        onHide();
      }
    } catch (err) {
      setError(err.message || 'Failed to save farmer details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <i className="bi bi-person-plus-fill text-success me-2"></i>
          {farmer ? 'Edit Farmer' : 'Add New Farmer'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Farmer Name *</Form.Label>
            <Form.Control
              type="text"
              required
              placeholder="e.g. Ravi Nursery"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Village / Location</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Kadiyam"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Full Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Street address, landmark, PIN code"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Notes / Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Additional farmer notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="success" type="submit" disabled={loading} className="fw-bold">
            {loading ? <Spinner size="sm" animation="border" /> : (farmer ? 'Update Farmer' : 'Save Farmer')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
