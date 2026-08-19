import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';

export default function PaymentModesPage() {
  const { showToast } = useToast();
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchModes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsService.getPaymentModes();
      if (res.success) {
        setModes(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load payment modes', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchModes();
  }, [fetchModes]);

  const handleOpenAdd = () => {
    setEditingMode(null);
    setFormName('');
    setFormStatus(1);
    setShowModal(true);
  };

  const handleOpenEdit = (mode) => {
    setEditingMode(mode);
    setFormName(mode.name);
    setFormStatus(parseInt(mode.status, 10));
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter payment mode name', 'warning');
      return;
    }

    try {
      setSaving(true);
      if (editingMode) {
        const res = await settingsService.updatePaymentMode({
          id: editingMode.id,
          name: formName.trim(),
          status: formStatus,
        });
        if (res.success) {
          showToast('Payment mode updated successfully', 'success');
        }
      } else {
        const res = await settingsService.createPaymentMode({
          name: formName.trim(),
          status: formStatus,
        });
        if (res.success) {
          showToast('Payment mode created successfully', 'success');
        }
      }
      setShowModal(false);
      fetchModes();
    } catch (err) {
      showToast(err.message || 'Failed to save payment mode', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (mode) => {
    const newStatus = mode.status == 1 ? 0 : 1;
    try {
      const res = await settingsService.updatePaymentMode({
        id: mode.id,
        name: mode.name,
        status: newStatus,
      });
      if (res.success) {
        showToast(`Payment mode status updated to ${newStatus == 1 ? 'Active' : 'Inactive'}`, 'info');
        fetchModes();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'danger');
    }
  };

  const handleDelete = async (mode) => {
    if (!window.confirm(`Are you sure you want to delete payment mode: "${mode.name}"?`)) {
      return;
    }
    try {
      const res = await settingsService.deletePaymentMode(mode.id);
      if (res.success) {
        showToast('Payment mode deleted', 'success');
        fetchModes();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete payment mode', 'danger');
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h3 className="fw-bold mb-1 text-dark">
            <i className="bi bi-credit-card-2-front-fill text-primary me-2"></i>
            PAYMENT MODES
          </h3>
          <p className="text-muted small mb-0">
            Manage supported payment methods (Cash, UPI, Bank Transfer, Cheque, etc.)
          </p>
        </div>
        <div className="mt-3 mt-md-0">
          <Button variant="primary" size="sm" className="fw-bold" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i> Add Payment Mode
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-dark text-white fw-bold py-3">
          <i className="bi bi-wallet2 me-2"></i>
          Payment Modes List ({modes.length})
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading Payment Modes...</p>
            </div>
          ) : (
            <Table responsive hover align="middle" className="mb-0">
              <thead className="table-light text-uppercase small">
                <tr>
                  <th>#</th>
                  <th>Payment Mode Name</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      No payment modes found. Click "Add Payment Mode" to create one.
                    </td>
                  </tr>
                ) : (
                  modes.map((mode, idx) => (
                    <tr key={mode.id}>
                      <td className="fw-bold text-muted">{idx + 1}</td>
                      <td className="fw-semibold text-dark">{mode.name}</td>
                      <td>
                        <Badge
                          bg={mode.status == 1 ? 'success' : 'secondary'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(mode)}
                          title="Click to toggle status"
                        >
                          {mode.status == 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1 py-1 px-2"
                          onClick={() => handleOpenEdit(mode)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="py-1 px-2"
                          onClick={() => handleDelete(mode)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title className="fw-bold fs-5">
              <i className="bi bi-credit-card-2-front-fill me-2"></i>
              {editingMode ? 'Edit Payment Mode' : 'Add New Payment Mode'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Payment Mode Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Cash, UPI, Bank Transfer, Cheque..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select
                value={formStatus}
                onChange={(e) => setFormStatus(parseInt(e.target.value, 10))}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="fw-bold" disabled={saving}>
              {saving ? 'Saving...' : 'Save Payment Mode'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
