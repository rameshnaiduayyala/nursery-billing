import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';

export default function ExpenseCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsService.getExpenseCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load expense categories', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormStatus(1);
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormStatus(parseInt(category.status, 10));
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter category name', 'warning');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        const res = await settingsService.updateExpenseCategory({
          id: editingCategory.id,
          name: formName.trim(),
          status: formStatus,
        });
        if (res.success) {
          showToast('Expense category updated successfully', 'success');
        }
      } else {
        const res = await settingsService.createExpenseCategory({
          name: formName.trim(),
          status: formStatus,
        });
        if (res.success) {
          showToast('Expense category created successfully', 'success');
        }
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (category) => {
    const newStatus = category.status == 1 ? 0 : 1;
    try {
      const res = await settingsService.updateExpenseCategory({
        id: category.id,
        name: category.name,
        status: newStatus,
      });
      if (res.success) {
        showToast(`Category status updated to ${newStatus == 1 ? 'Active' : 'Inactive'}`, 'info');
        fetchCategories();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'danger');
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete expense category: "${category.name}"?`)) {
      return;
    }
    try {
      const res = await settingsService.deleteExpenseCategory(category.id);
      if (res.success) {
        showToast('Expense category deleted', 'success');
        fetchCategories();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'danger');
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h3 className="fw-bold mb-1 text-dark">
            <i className="bi bi-tags-fill text-success me-2"></i>
            EXPENSE CATEGORIES
          </h3>
          <p className="text-muted small mb-0">
            Manage operational expense classification categories for financial tracking
          </p>
        </div>
        <div className="mt-3 mt-md-0">
          <Button variant="success" size="sm" className="fw-bold" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i> Add Category
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-dark text-white fw-bold py-3">
          <i className="bi bi-list-nested me-2"></i>
          Category List ({categories.length})
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading Categories...</p>
            </div>
          ) : (
            <Table responsive hover align="middle" className="mb-0">
              <thead className="table-light text-uppercase small">
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      No expense categories found. Click "Add Category" to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr key={cat.id}>
                      <td className="fw-bold text-muted">{idx + 1}</td>
                      <td className="fw-semibold text-dark">{cat.name}</td>
                      <td>
                        <Badge
                          bg={cat.status == 1 ? 'success' : 'secondary'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(cat)}
                          title="Click to toggle status"
                        >
                          {cat.status == 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1 py-1 px-2"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="py-1 px-2"
                          onClick={() => handleDelete(cat)}
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
              <i className="bi bi-tags-fill me-2"></i>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Category Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Travel, Fuel, Labour, Packing..."
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
            <Button variant="success" type="submit" className="fw-bold" disabled={saving}>
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
