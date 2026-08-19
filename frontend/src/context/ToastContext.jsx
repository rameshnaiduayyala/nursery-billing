import React, { createContext, useContext, useState } from 'react';
import { ToastContainer, Toast } from 'react-bootstrap';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success', title: 'Notification' });

  const showToast = (message, variant = 'success', title = '') => {
    setToast({
      show: true,
      message,
      variant,
      title: title || (variant === 'success' ? 'Success' : variant === 'danger' ? 'Error' : 'Notice')
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          show={toast.show}
          onClose={hideToast}
          delay={4000}
          autohide
          bg={toast.variant}
          className="text-white shadow-lg border-0"
        >
          <Toast.Header closeButton={true} className="bg-white text-dark">
            <i className={`bi ${toast.variant === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} me-2 fs-6`}></i>
            <strong className="me-auto">{toast.title}</strong>
            <small className="text-muted">just now</small>
          </Toast.Header>
          <Toast.Body className="fw-semibold">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
