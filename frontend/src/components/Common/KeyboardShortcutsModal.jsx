import React, { useEffect, useState } from 'react';
import { Modal, Badge, Table, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const SHORTCUTS = [
  { key: 'F2 / Alt + S', label: 'Record New Plant Sale Bill', category: 'Sales & Receipts', route: '/sales?action=add-sale' },
  { key: 'F3 / Alt + C', label: 'Collect Customer Payment', category: 'Sales & Receipts', route: '/sales?action=add-payment' },
  { key: 'F4 / Alt + P', label: 'Record New Plant Purchase Bill', category: 'Farmer Payments', route: '/farmer-payments?action=add-purchase' },
  { key: 'F5 / Alt + F', label: 'Pay Farmer (Cash / UPI / Bank)', category: 'Farmer Payments', route: '/farmer-payments?action=add-payment' },
  { key: 'F6 / Alt + E', label: 'Add Business Expense', category: 'Expenses', route: '/expenses?action=add' },
  { key: 'Alt + D', label: 'Go to Dashboard', category: 'Navigation', route: '/' },
  { key: 'Alt + T', label: 'Go to Master Transactions', category: 'Navigation', route: '/transactions' },
  { key: 'Alt + R', label: 'Go to Reports', category: 'Navigation', route: '/reports' },
  { key: '? or Alt + /', label: 'Open Keyboard Shortcuts Help', category: 'Help', route: null },
];

export default function KeyboardShortcutsModal({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="h6 fw-bold text-success d-flex align-items-center gap-2">
          <i className="bi bi-keyboard-fill fs-5"></i>
          <span>GLOBAL KEYBOARD SHORTCUTS CHEAT SHEET</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <p className="text-muted small mb-3">
          Use these high-speed keyboard shortcuts anywhere in the application to record bills, collect payments, and navigate instantly:
        </p>

        <Table responsive hover bordered className="align-middle small mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '160px' }}>Shortcut Key</th>
              <th>Action / Function</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s, idx) => (
              <tr key={idx}>
                <td>
                  <Badge bg="dark" className="px-2 py-1 font-monospace fs-6">
                    {s.key}
                  </Badge>
                </td>
                <td className="fw-semibold text-dark">{s.label}</td>
                <td>
                  <Badge bg="secondary" className="px-2 py-1">
                    {s.category}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" size="sm" onClick={onHide} className="fw-bold px-3">
          Close (Esc)
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * Custom Hook for registering global keyboard shortcuts
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key shortcuts if user is typing inside an input/textarea/select element
      const tagName = e.target.tagName;
      const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || e.target.isContentEditable;

      // Question mark (?) to toggle shortcuts help
      if (!isInput && e.key === '?') {
        e.preventDefault();
        setShowHelpModal((prev) => !prev);
        return;
      }

      // Alt + / to toggle shortcuts help
      if (e.altKey && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setShowHelpModal((prev) => !prev);
        return;
      }

      // Ignore other shortcuts when focused in form inputs unless Alt/F-keys used
      if (isInput && !e.altKey && !e.key.startsWith('F')) {
        return;
      }

      // F2 or Alt + S -> Add Sale
      if (e.key === 'F2' || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        navigate('/sales?action=add-sale');
        return;
      }

      // F3 or Alt + C -> Collect Customer Payment
      if (e.key === 'F3' || (e.altKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        navigate('/sales?action=add-payment');
        return;
      }

      // F4 or Alt + P -> Add Purchase
      if (e.key === 'F4' || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        navigate('/farmer-payments?action=add-purchase');
        return;
      }

      // F5 or Alt + F -> Pay Farmer
      if (e.key === 'F5' || (e.altKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        navigate('/farmer-payments?action=add-payment');
        return;
      }

      // F6 or Alt + E -> Add Expense
      if (e.key === 'F6' || (e.altKey && e.key.toLowerCase() === 'e')) {
        e.preventDefault();
        navigate('/expenses?action=add');
        return;
      }

      // Alt + D -> Dashboard
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigate('/');
        return;
      }

      // Alt + T -> Master Transactions
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        navigate('/transactions');
        return;
      }

      // Alt + R -> Reports
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        navigate('/reports');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location]);

  return {
    showHelpModal,
    setShowHelpModal,
  };
}
