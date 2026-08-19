import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastContainer, Toast } from 'react-bootstrap';

const ToastContext = createContext(null);

const EMPTY_TOAST = { show: false, message: '', variant: 'success', title: '' };

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(EMPTY_TOAST);
  const timerRef = useRef(null);

  // ── Stable function reference (never re-creates on render) ──
  const showToast = useCallback((message, variant = 'success', title = '') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({
      show: true,
      message,
      variant,
      title: title || (variant === 'success' ? 'Success' : variant === 'danger' ? 'Error' : 'Notice'),
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const iconCls = toast.variant === 'success'
    ? 'bi-check-circle-fill text-success'
    : toast.variant === 'danger'
    ? 'bi-exclamation-triangle-fill text-danger'
    : 'bi-info-circle-fill text-primary';

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          show={toast.show}
          onClose={hideToast}
          delay={4000}
          autohide
          className="border-0 shadow-lg"
          style={{ minWidth: '280px' }}
        >
          <Toast.Header closeButton style={{ background: '#fff', borderBottom: '1px solid var(--border-light)' }}>
            <i className={`bi ${iconCls} me-2`} style={{ fontSize: '15px' }} />
            <strong className="me-auto" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {toast.title}
            </strong>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>just now</small>
          </Toast.Header>
          <Toast.Body
            style={{
              fontSize: '0.83rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              padding: '10px 14px',
              background: toast.variant === 'success'
                ? 'rgba(16,185,129,0.06)'
                : toast.variant === 'danger'
                ? 'rgba(239,68,68,0.06)'
                : '#fff',
            }}
          >
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
