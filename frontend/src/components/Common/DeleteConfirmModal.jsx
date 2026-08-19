import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

export default function DeleteConfirmModal({ show, onHide, onConfirm, title = 'Confirm Delete', message, loading = false }) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="h6 text-danger fw-bold">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="small text-secondary py-3">
        {message || 'Are you sure you want to delete this record?'}
      </Modal.Body>
      <Modal.Footer className="py-2">
        <Button variant="secondary" size="sm" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={loading} className="fw-bold px-3">
          {loading ? <Spinner size="sm" animation="border" /> : 'Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
