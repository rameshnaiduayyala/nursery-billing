import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Badge, Spinner } from 'react-bootstrap';
import userService from '../../services/userService';
import PageHeader from '../../components/Common/PageHeader';
import DeleteConfirmModal from '../../components/Common/DeleteConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    status: 1
  });

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      if (res.success) {
        setUsersList(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch users list', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
      status: 1
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '', // Blank unless updating
      role: (u.role || 'viewer').toLowerCase(),
      status: parseInt(u.status) === 1 ? 1 : 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter the user name.', 'danger');
      return;
    }

    if (!formData.email.trim()) {
      showToast('Please enter a valid email address.', 'danger');
      return;
    }

    if (!selectedUser && (!formData.password || formData.password.length < 6)) {
      showToast('Password must be at least 6 characters.', 'danger');
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (selectedUser && selectedUser.id) {
        res = await userService.update({
          id: selectedUser.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password ? formData.password.trim() : '',
          role: formData.role,
          status: formData.status
        });
      } else {
        res = await userService.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
          status: formData.status
        });
      }

      if (res.success) {
        showToast(selectedUser ? 'User details updated successfully!' : 'New user created successfully!', 'success');
        setShowModal(false);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save user', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (parseInt(deleteTarget.id) === parseInt(currentUser?.id)) {
      showToast('You cannot delete your own logged-in admin account.', 'danger');
      setDeleteTarget(null);
      return;
    }

    try {
      setDeleteLoading(true);
      const res = await userService.delete(deleteTarget.id);
      if (res.success) {
        showToast('User account deleted successfully', 'success');
        setDeleteTarget(null);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete user account', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadge = (r) => {
    const roleUpper = (r || '').toUpperCase();
    switch (roleUpper) {
      case 'ADMIN':
        return <Badge bg="danger" className="px-2 py-1">ADMIN</Badge>;
      case 'MANAGER':
        return <Badge bg="primary" className="px-2 py-1">MANAGER</Badge>;
      case 'VIEWER':
        return <Badge bg="warning" text="dark" className="px-2 py-1">VIEWER (Read-Only)</Badge>;
      default:
        return <Badge bg="secondary" className="px-2 py-1">{roleUpper}</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="User & Staff Management"
        subtitle="Manage system accounts, set permissions (Admin, Manager, Viewer)"
        actions={
          <Button variant="success" size="sm" className="fw-bold" onClick={handleOpenAddModal}>
            <i className="bi bi-person-plus-fill me-1"></i> + Create New User
          </Button>
        }
      />

      <Card className="shadow-sm border-0 rounded-3">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading user accounts...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle mobile-card-table">
              <thead className="bg-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length > 0 ? (
                  usersList.map((u) => (
                    <tr key={u.id}>
                      <td data-label="ID" className="fw-bold text-secondary">#{u.id}</td>
                      <td data-label="Name" className="fw-bold text-dark">
                        {u.name}
                        {parseInt(u.id) === parseInt(currentUser?.id) && (
                          <Badge bg="info" className="ms-2">You</Badge>
                        )}
                      </td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="Role">{getRoleBadge(u.role)}</td>
                      <td data-label="Status">
                        <Badge bg={parseInt(u.status) === 1 ? 'success' : 'secondary'}>
                          {parseInt(u.status) === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td data-label="Created Date" className="text-muted">{formatDate(u.created_at)}</td>
                      <td data-label="Actions" className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-secondary"
                            title="Edit User"
                            onClick={() => handleOpenEditModal(u)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          {parseInt(u.id) !== parseInt(currentUser?.id) && (
                            <Button
                              variant="outline-danger"
                              title="Delete User"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No user accounts found. Click <strong>+ Create New User</strong> to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold text-success">
            <i className="bi bi-person-gear me-2"></i>
            {selectedUser ? 'EDIT USER ACCOUNT' : 'CREATE NEW USER ACCOUNT'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Full Name *</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. Ramesh Naidu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Email Address *</Form.Label>
              <Form.Control
                type="email"
                required
                placeholder="e.g. user@nursery.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">
                {selectedUser ? 'New Password (Leave blank to keep existing)' : 'Password *'}
              </Form.Label>
              <Form.Control
                type="password"
                required={!selectedUser}
                minLength={6}
                placeholder={selectedUser ? '••••••••' : 'Min 6 characters'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">User Role *</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="admin">ADMIN (Full Access)</option>
                    <option value="manager">MANAGER (View, Create, Edit)</option>
                    <option value="viewer">VIEWER (Read-Only)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Account Status *</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive / Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={submitting} className="fw-bold px-4">
              {submitting ? <Spinner size="sm" animation="border" /> : (selectedUser ? 'Update User' : 'Create User')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Are you sure you want to delete user account "${deleteTarget?.name}" (${deleteTarget?.email})?`}
      />
    </div>
  );
}
