import React from 'react';
import { Modal, Spinner } from 'react-bootstrap';

export default function DeleteConfirmModal({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Delete',
  message,
  loading = false,
}) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="h6">
          <span
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.12)', color: '#dc2626',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginRight: '8px', fontSize: '14px',
            }}
          >
            <i className="bi bi-trash3-fill" />
          </span>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          {message || 'Are you sure you want to delete this record? This action cannot be undone.'}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-sm"
          style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
          onClick={onHide}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-sm btn-danger fw-bold px-3"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-trash3 me-1" />Delete</>}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
