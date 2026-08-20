import React, { useState } from 'react';
import { Dropdown, Modal, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import logoImg from '../../assets/Gangadhara_logo.png';

export default function TopNavbar({ collapsed, onToggleCollapse, onToggleMobileMenu, onShowShortcuts }) {
  const { user, logout, role, isAdmin, isViewer, canCreate } = useAuth();
  const { showToast } = useToast();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('New passwords do not match.', 'danger');
      return;
    }
    try {
      setLoading(true);
      const res = await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      if (res.success) {
        showToast('Password updated successfully!', 'success');
        setShowPasswordModal(false);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = {
    ADMIN: { cls: 'badge-danger', label: 'Admin', icon: 'bi-shield-lock-fill' },
    MANAGER: { cls: 'badge-primary', label: 'Manager', icon: 'bi-person-badge-fill' },
    VIEWER: { cls: 'badge-warning', label: 'Viewer', icon: 'bi-eye-fill' },
  };
  const rm = roleMeta[role] ?? { cls: 'badge-gray', label: role, icon: 'bi-person-fill' };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <>
      <nav
        className="navbar sticky-top"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          height: '62px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '12px' }}>
          {/* Mobile menu button */}
          <button
            className="d-lg-none"
            onClick={onToggleMobileMenu}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <i className="bi bi-list" style={{ fontSize: '18px' }} />
          </button>

          {/* Logo + Brand (mobile) */}
          <div className="d-flex d-lg-none align-items-center gap-2">
            <img src={logoImg} alt="Logo" style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Gangadhara Nursery</span>
          </div>

          {/* Desktop breadcrumb / page context */}
          <div className="d-none d-lg-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <i className="bi bi-house-fill" style={{ color: 'var(--emerald)' }} />
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Gangadhara Nursery</span>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Shortcuts button */}
          <button
            className="btn btn-sm btn-outline-secondary d-none d-md-flex align-items-center gap-1"
            style={{ borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}
            onClick={onShowShortcuts}
            title="Keyboard Shortcuts Cheat Sheet (? or Alt + /)"
          >
            <i className="bi bi-keyboard" />
            <span>Shortcuts (?)</span>
          </button>

          {/* Quick Add buttons */}
          {canCreate && (
            <div className="d-none d-sm-flex align-items-center gap-2 me-1">
              <Link to="/sales?action=add-sale" className="btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-1 shadow-sm">
                <i className="bi bi-cart-plus-fill" />
                <span>+ Sale</span>
              </Link>
              <Link to="/farmer-payments?action=add-purchase" className="btn btn-sm btn-warning fw-bold d-inline-flex align-items-center gap-1 shadow-sm">
                <i className="bi bi-flower2" />
                <span>+ Purchase</span>
              </Link>
            </div>
          )}

          {/* User dropdown */}
          {user && (
            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                id="user-menu"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '5px 12px 5px 5px',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                className="user-menu-toggle"
              >
                {/* Avatar */}
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div className="d-none d-sm-flex flex-column" style={{ lineHeight: 1.2, textAlign: 'left' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.name || user.email}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</span>
                </div>
                <i className="bi bi-chevron-down" style={{ fontSize: '11px', color: 'var(--text-muted)' }} />
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-sm border-0" style={{ minWidth: '210px', borderRadius: '12px', padding: '6px' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  <span className={`badge-pill ${rm.cls} mt-2`}><i className={`bi ${rm.icon}`} />{rm.label}</span>
                </div>
                <Dropdown.Item
                  onClick={() => setShowPasswordModal(true)}
                  style={{ borderRadius: '8px', fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <i className="bi bi-key me-2 text-primary" />Change Password
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={logout}
                  className="text-danger"
                  style={{ borderRadius: '8px', fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <i className="bi bi-box-arrow-right me-2" />Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </nav>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">
            <i className="bi bi-key me-2 text-primary" />Change Password
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body>
            {[
              { label: 'Current Password', key: 'current_password' },
              { label: 'New Password', key: 'new_password', min: 6 },
              { label: 'Confirm Password', key: 'confirm_password', min: 6 },
            ].map(({ label, key, min }) => (
              <Form.Group key={key} className="mb-3">
                <Form.Label>{label} *</Form.Label>
                <Form.Control
                  type="password"
                  required
                  minLength={min}
                  value={passwordData[key]}
                  onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                />
              </Form.Group>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-success fw-bold px-3" disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .user-menu-toggle:hover {
          background: var(--surface-card) !important;
          border-color: var(--emerald) !important;
        }
      `}</style>
    </>
  );
}
