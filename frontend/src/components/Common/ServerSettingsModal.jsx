import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { getStoredApiBaseUrl, setStoredApiBaseUrl, showNativeToast } from '../../services/capacitorService';

export default function ServerSettingsModal({ show, onHide, onSaved }) {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      getStoredApiBaseUrl().then((stored) => setUrl(stored));
      setError('');
      setSuccess('');
    }
  }, [show]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!url.trim()) {
      setError('Please enter a valid API URL (e.g. http://192.168.1.100/backend/api)');
      return;
    }

    try {
      setSaving(true);
      const savedUrl = await setStoredApiBaseUrl(url);
      setSuccess(`Server URL updated to: ${savedUrl}`);
      showNativeToast('Server IP updated successfully');
      setTimeout(() => {
        if (onSaved) onSaved(savedUrl);
        onHide();
        window.location.reload(); // Reload to re-initialize axios instance
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save server URL settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetLocal = () => {
    setUrl('http://192.168.1.100/nursery-management/backend/api');
  };

  const handlePresetCloud = () => {
    setUrl('https://nursery.vanyxglobal.com/api');
  };

  return (
    <Modal show={show} onHide={onHide} centered className="server-settings-modal">
      <Form onSubmit={handleSave}>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title className="h6 mb-0">
            <i className="bi bi-hdd-network me-2 text-warning" />
            Mobile App Server Connection Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          {success && <Alert variant="success" className="py-2 small">{success}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Backend API Base URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. http://192.168.1.100/backend/api or https://nursery.vanyxglobal.com/api"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-monospace small"
              required
            />
            <Form.Text className="text-muted small">
              Specify your nursery shop local Wi-Fi IP address or live web domain.
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-2 mb-2">
            <Button variant="outline-secondary" size="sm" onClick={handlePresetLocal}>
              <i className="bi bi-wifi me-1" /> Set Local Wi-Fi Preset
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handlePresetCloud}>
              <i className="bi bi-cloud-check me-1" /> Set Cloud Server Preset
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-white">
          <Button variant="secondary" size="sm" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button variant="success" size="sm" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save & Connect'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
