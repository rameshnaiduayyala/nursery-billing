import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, InputGroup, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customerService from '../../services/customerService';
import CustomerModal from '../../components/Customers/CustomerModal';
import PageHeader from '../../components/Common/PageHeader';
import DeleteConfirmModal from '../../components/Common/DeleteConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { canCreate, canEdit, canDelete } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll({ search, type: typeFilter });
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch customers', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (cust) => {
    setSelectedCustomer(cust);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    showToast(selectedCustomer ? 'Customer updated successfully!' : 'Customer added successfully!', 'success');
    fetchCustomers();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await customerService.delete(deleteTarget.id);
      if (res.success) {
        showToast('Customer deleted successfully', 'success');
        setDeleteTarget(null);
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Unable to delete customer', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'phone', label: 'Phone' },
      { key: 'city', label: 'City' },
      { key: 'gst_number', label: 'GST Number' },
      { key: 'total_sales', label: 'Total Sales (INR)' },
      { key: 'total_received', label: 'Total Received (INR)' },
      { key: 'outstanding', label: 'Outstanding (INR)' },
    ];
    exportToCsv('gangadhara_customers_exporters', customers, headers);
  };

  return (
    <div>
      <PageHeader
        title="Customers & Exporters"
        subtitle="Track plant buyers, export clients, sales, receipts, and receivables"
        actions={
          <>
            <Button variant="outline-secondary" size="sm" onClick={handleExportCsv}>
              <i className="bi bi-download me-1"></i> Export CSV
            </Button>
            {canCreate && (
              <Button variant="primary" size="sm" className="fw-bold" onClick={handleAddCustomer}>
                <i className="bi bi-plus-lg me-1"></i> Add Customer / Exporter
              </Button>
            )}
          </>
        }
      />

      <Card className="shadow-sm border-0 rounded-3">
        <Card.Header className="bg-white border-0 pt-3 px-3">
          <Row className="g-2">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light"><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, phone, city, GST..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={3}>
              <Form.Select
                size="sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types (Customer & Exporter)</option>
                <option value="CUSTOMER">Domestic Customer</option>
                <option value="EXPORTER">Exporter</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading customers...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle mobile-card-table">
              <thead className="bg-light">
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone / City</th>
                  <th className="text-end">Total Sales</th>
                  <th className="text-end">Total Received</th>
                  <th className="text-end">Outstanding</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((cust) => (
                    <tr key={cust.id}>
                      <td data-label="Name">
                        <div className="fw-bold text-dark">{cust.name}</div>
                        {cust.gst_number && <small className="text-muted d-block">GST: {cust.gst_number}</small>}
                      </td>
                      <td data-label="Type">
                        <Badge bg={cust.type === 'EXPORTER' ? 'purple' : 'primary'} style={cust.type === 'EXPORTER' ? { backgroundColor: '#6f42c1' } : {}}>
                          {cust.type}
                        </Badge>
                      </td>
                      <td data-label="Phone / City">
                        <div>{cust.phone || '-'}</div>
                        <small className="text-muted">{cust.city || 'Location N/A'}</small>
                      </td>
                      <td data-label="Total Sales" className="text-end fw-semibold text-success">{formatCurrency(cust.total_sales)}</td>
                      <td data-label="Total Received" className="text-end fw-semibold text-primary">{formatCurrency(cust.total_received)}</td>
                      <td data-label="Outstanding" className="text-end fw-bold text-danger">
                        {formatCurrency(cust.outstanding)}
                      </td>
                      <td data-label="Actions" className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-primary"
                            title="View Customer Ledger"
                            onClick={() => navigate(`/customers/ledger/${cust.id}`)}
                          >
                            <i className="bi bi-journal-text me-1"></i> Ledger
                          </Button>
                          {canEdit && (
                            <Button
                              variant="outline-secondary"
                              title="Edit Customer"
                              onClick={() => handleEditCustomer(cust)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline-danger"
                              title="Delete Customer"
                              onClick={() => setDeleteTarget(cust)}
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
                      No customers/exporters found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <CustomerModal
        show={showModal}
        onHide={() => setShowModal(false)}
        customer={selectedCustomer}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Are you sure you want to delete customer "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
