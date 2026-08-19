import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import farmerService from '../../services/farmerService';
import FarmerModal from '../../components/Farmers/FarmerModal';
import PageHeader from '../../components/Common/PageHeader';
import DeleteConfirmModal from '../../components/Common/DeleteConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';

export default function FarmersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const res = await farmerService.getAll({ search });
      if (res.success) {
        setFarmers(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch farmers', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [search]);

  const handleAddFarmer = () => {
    setSelectedFarmer(null);
    setShowModal(true);
  };

  const handleEditFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    showToast(selectedFarmer ? 'Farmer details updated successfully!' : 'New farmer added successfully!', 'success');
    fetchFarmers();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await farmerService.delete(deleteTarget.id);
      if (res.success) {
        showToast('Farmer deleted successfully', 'success');
        setDeleteTarget(null);
        fetchFarmers();
      }
    } catch (err) {
      showToast(err.message || 'Unable to delete farmer', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Farmer Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'location', label: 'Location' },
      { key: 'total_purchase', label: 'Total Purchase (INR)' },
      { key: 'total_paid', label: 'Total Paid (INR)' },
      { key: 'outstanding', label: 'Outstanding (INR)' },
    ];
    exportToCsv('gangadhara_farmers_list', farmers, headers);
  };

  return (
    <div>
      <PageHeader
        title="Farmer Management"
        subtitle="Track farmer bulk plant purchases, payments, and outstanding ledger balances"
        actions={
          <>
            <Button variant="outline-secondary" size="sm" onClick={handleExportCsv}>
              <i className="bi bi-download me-1"></i> Export CSV
            </Button>
            <Button variant="success" size="sm" className="fw-bold" onClick={handleAddFarmer}>
              <i className="bi bi-plus-lg me-1"></i> Add Farmer
            </Button>
          </>
        }
      />

      <Card className="shadow-sm border-0 rounded-3">
        <Card.Header className="bg-white border-0 pt-3 px-3">
          <InputGroup style={{ maxWidth: '360px' }}>
            <InputGroup.Text className="bg-light"><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by name, phone, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading farmers...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle mobile-card-table">
              <thead className="bg-light">
                <tr>
                  <th>ID</th>
                  <th>Farmer Name</th>
                  <th>Phone</th>
                  <th>Village / Location</th>
                  <th className="text-end">Total Purchase</th>
                  <th className="text-end">Total Paid</th>
                  <th className="text-end">Outstanding</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmers.length > 0 ? (
                  farmers.map((farmer) => (
                    <tr key={farmer.id}>
                      <td data-label="ID" className="fw-bold text-secondary">#{farmer.id}</td>
                      <td data-label="Farmer Name" className="fw-semibold text-dark">{farmer.name}</td>
                      <td data-label="Phone">{farmer.phone || '-'}</td>
                      <td data-label="Location">{farmer.location || '-'}</td>
                      <td data-label="Total Purchase" className="text-end fw-semibold text-warning">{formatCurrency(farmer.total_purchase)}</td>
                      <td data-label="Total Paid" className="text-end fw-semibold text-info">{formatCurrency(farmer.total_paid)}</td>
                      <td data-label="Outstanding" className="text-end fw-bold text-danger">
                        {formatCurrency(farmer.outstanding)}
                      </td>
                      <td data-label="Status">
                        <Badge bg={farmer.status === 1 ? 'success' : 'secondary'}>
                          {farmer.status === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td data-label="Actions" className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-primary"
                            title="View Ledger Statement"
                            onClick={() => navigate(`/farmers/ledger/${farmer.id}`)}
                          >
                            <i className="bi bi-journal-text me-1"></i> Ledger
                          </Button>
                          <Button
                            variant="outline-secondary"
                            title="Edit Farmer"
                            onClick={() => handleEditFarmer(farmer)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            title="Delete Farmer"
                            onClick={() => setDeleteTarget(farmer)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No farmers found. Click <strong>+ Add Farmer</strong> to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <FarmerModal
        show={showModal}
        onHide={() => setShowModal(false)}
        farmer={selectedFarmer}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Are you sure you want to delete farmer "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
