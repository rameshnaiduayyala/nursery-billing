import React, { useState } from 'react';
import { Navbar, Container, Button, Dropdown, Modal, Form, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import logoImg from '../../assets/Gangadhara_logo.png';

export default function TopNavbar({ collapsed, onToggleCollapse, onToggleMobileMenu }) {
  const { user, logout, role, isAdmin, isViewer } = useAuth();
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
        new_password: passwordData.new_password
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

  const getRoleBadge = (r) => {
    switch (r) {
      case 'ADMIN':
        return <Badge bg="danger" className="ms-1 px-2 py-1">ADMIN</Badge>;
      case 'MANAGER':
        return <Badge bg="primary" className="ms-1 px-2 py-1">MANAGER</Badge>;
      case 'VIEWER':
        return <Badge bg="warning" text="dark" className="ms-1 px-2 py-1">VIEWER (Read-Only)</Badge>;
      default:
        return <Badge bg="secondary" className="ms-1 px-2 py-1">{r}</Badge>;
    }
  };

  return (
    <>
      <Navbar bg="white" className="shadow-sm border-bottom px-3 py-2 sticky-top">
        <Container fluid className="px-0 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            {/* Mobile Menu Button */}
            <Button
              variant="outline-secondary"
              className="d-lg-none me-2 p-1 px-2"
              onClick={onToggleMobileMenu}
            >
              <i className="bi bi-list fs-4"></i>
            </Button>

            <img
              src={logoImg}
              alt="Gangadhara Nursery"
              className="me-2 rounded"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
            <div>
              <span className="fw-bold fs-5 text-success me-2">Gangadhara Nursery</span>
              <span className="text-muted small border-start ps-2 d-none d-md-inline">Management System</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="user-dropdown" className="border d-flex align-items-center gap-2 py-1 px-3 rounded-pill">
                  <i className={`bi ${isAdmin ? 'bi-shield-lock-fill text-danger' : isViewer ? 'bi-eye-fill text-warning' : 'bi-person-badge-fill text-primary'} fs-5`}></i>
                  <div className="d-flex align-items-center">
                    <span className="fw-semibold text-dark me-1">{user.name}</span>
                    {getRoleBadge(role)}
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow border-0">
                  <Dropdown.Header>
                    Logged in as <strong>{user.email}</strong>
                    <div className="mt-1">{getRoleBadge(role)}</div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setShowPasswordModal(true)}>
                    <i className="bi bi-key me-2 text-primary"></i>Change Password
                  </Dropdown.Item>
                  <Dropdown.Item onClick={logout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button variant="outline-success" size="sm" href="/login">Login</Button>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold"><i className="bi bi-key me-2 text-primary"></i>Change Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Current Password *</Form.Label>
              <Form.Control
                type="password"
                required
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">New Password *</Form.Label>
              <Form.Control
                type="password"
                required
                minLength={6}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Confirm New Password *</Form.Label>
              <Form.Control
                type="password"
                required
                minLength={6}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={loading} className="fw-bold px-3">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
