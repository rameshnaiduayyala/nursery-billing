import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Badge, Spinner, InputGroup } from 'react-bootstrap';
import farmerService from '../services/farmerService';
import transactionService from '../services/transactionService';
import PageHeader from '../components/Common/PageHeader';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, dateToInput } from '../utils/formatters';

export default function FarmerPaymentsPage() {
  const { showToast } = useToast();
  const { canCreate, canEdit, canDelete } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isNewFarmer, setIsNewFarmer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    transaction_date: dateToInput(),
    farmer_id: '',
    farmer_name: '',
    money_type: 'Plant Purchase',
    amount: '',
    payment_mode: 'Bank Transfer',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTx, resFarmers] = await Promise.all([
        transactionService.getAll({
          party_type: 'FARMER',
          search,
          start_date: startDate,
          end_date: endDate,
          limit: 100
        }),
        farmerService.getAll()
      ]);

      if (resTx.success) setTransactions(resTx.data?.items || []);
      if (resFarmers.success) setFarmers(resFarmers.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, startDate, endDate]);

  const handleOpenAddModal = () => {
    setSelectedTx(null);
    setFormData({
      transaction_date: dateToInput(),
      farmer_id: farmers.length ? farmers[0].id : '',
      farmer_name: '',
      money_type: 'Plant Purchase',
      amount: '',
      payment_mode: 'Bank Transfer',
      remarks: ''
    });
    setIsNewFarmer(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (tx) => {
    setSelectedTx(tx);
    const mType = tx.transaction_type === 'PURCHASE' ? 'Plant Purchase' : 'Balance Payment';
    setFormData({
      transaction_date: tx.transaction_date || dateToInput(),
      farmer_id: tx.party_id || '',
      farmer_name: tx.party_name || '',
      money_type: mType,
      amount: tx.amount || '',
      payment_mode: tx.payment_mode || 'Bank Transfer',
      remarks: tx.remarks || ''
    });
    setIsNewFarmer(false);
    setShowModal(true);
  };

  const handleFarmerSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setIsNewFarmer(true);
      setFormData({ ...formData, farmer_id: 0, farmer_name: '' });
    } else {
      setIsNewFarmer(false);
      setFormData({ ...formData, farmer_id: val, farmer_name: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid amount.', 'danger');
      return;
    }

    if (!isNewFarmer && !formData.farmer_id) {
      showToast('Please select a farmer.', 'danger');
      return;
    }

    if (isNewFarmer && !formData.farmer_name.trim()) {
      showToast('Please enter the new farmer name.', 'danger');
      return;
    }

    const txType = formData.money_type === 'Plant Purchase' ? 'PURCHASE' : 'FARMER_PAYMENT';

    try {
      setSubmitting(true);
      let res;
      if (selectedTx && selectedTx.id) {
        res = await transactionService.update({
          id: selectedTx.id,
          transaction_date: formData.transaction_date,
          party_type: 'FARMER',
          party_id: formData.farmer_id,
          transaction_type: txType,
          amount: amountNum,
          payment_mode: formData.payment_mode,
          remarks: formData.remarks
        });
      } else {
        res = await transactionService.create({
          transaction_date: formData.transaction_date,
          party_type: 'FARMER',
          party_id: isNewFarmer ? 0 : formData.farmer_id,
          party_name: isNewFarmer ? formData.farmer_name.trim() : '',
          transaction_type: txType,
          money_type: formData.money_type,
          amount: amountNum,
          payment_mode: formData.payment_mode,
          remarks: formData.remarks
        });
      }

      if (res.success) {
        showToast(selectedTx ? 'Transaction updated successfully!' : 'Farmer transaction saved successfully!', 'success');
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await transactionService.delete(deleteTarget.id);
      if (res.success) {
        showToast('Farmer transaction deleted successfully!', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Farmer Payments & Purchases"
        subtitle="Record plant bulk purchases and payments made to farmers"
        actions={
          canCreate && (
            <Button variant="success" size="sm" className="fw-bold" onClick={handleOpenAddModal}>
              <i className="bi bi-plus-lg me-1"></i> + Farmer Payment / Purchase
            </Button>
          )
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
                  placeholder="Search farmer or remarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col xs={6} md={3}>
              <Form.Control
                type="date"
                size="sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col xs={6} md={3}>
              <Form.Control
                type="date"
                size="sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading farmer transactions...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle small mobile-card-table">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Farmer Name</th>
                  <th>Transaction Type</th>
                  <th className="text-end">Amount</th>
                  <th>Payment Mode</th>
                  <th>Remarks</th>
                  {(canEdit || canDelete) && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td data-label="Date" className="fw-semibold">{formatDate(tx.transaction_date)}</td>
                      <td data-label="Farmer Name" className="fw-bold text-dark">{tx.party_name}</td>
                      <td data-label="Transaction Type">
                        <Badge bg={tx.transaction_type === 'PURCHASE' ? 'warning' : 'info'} className="px-2 py-1">
                          {tx.transaction_type === 'PURCHASE' ? 'Plant Purchase' : 'Farmer Payment'}
                        </Badge>
                      </td>
                      <td data-label="Amount" className="text-end fw-bold fs-6">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td data-label="Payment Mode">{tx.payment_mode}</td>
                      <td data-label="Remarks" className="text-muted">{tx.remarks || '-'}</td>
                      {(canEdit || canDelete) && (
                        <td data-label="Actions" className="text-center">
                          <div className="btn-group btn-group-sm">
                            {canEdit && (
                              <Button
                                variant="outline-secondary"
                                title="Edit Transaction"
                                onClick={() => handleOpenEditModal(tx)}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline-danger"
                                title="Delete Transaction"
                                onClick={() => setDeleteTarget(tx)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No farmer transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold text-success">
            <i className="bi bi-wallet2 me-2"></i>
            {selectedTx ? 'EDIT FARMER TRANSACTION' : 'ADD FARMER PAYMENT / PURCHASE'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Date *</Form.Label>
              <Form.Control
                type="date"
                required
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Farmer *</Form.Label>
              {!isNewFarmer ? (
                <Form.Select value={formData.farmer_id} onChange={handleFarmerSelectChange}>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.location || 'Location N/A'})</option>
                  ))}
                  {!selectedTx && <option value="NEW">➕ Direct Entry (Add New Farmer)</option>}
                </Form.Select>
              ) : (
                <div className="border p-2 rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="badge bg-warning text-dark">New Farmer Detected</span>
                    <Button variant="link" size="sm" className="p-0 text-secondary" onClick={() => setIsNewFarmer(false)}>
                      Select Existing
                    </Button>
                  </div>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Enter New Farmer / Nursery Name"
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                  />
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Money Type *</Form.Label>
                  <Form.Select
                    value={formData.money_type}
                    onChange={(e) => setFormData({ ...formData, money_type: e.target.value })}
                  >
                    <option value="Plant Purchase">Plant Purchase (Outflow)</option>
                    <option value="Advance">Advance Payment</option>
                    <option value="Balance Payment">Balance Payment</option>
                    <option value="Other Payment">Other Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Amount (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Payment Mode *</Form.Label>
              <Form.Select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Bulk plants, vehicle details, lot numbers..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={submitting} className="fw-bold px-4">
              {submitting ? <Spinner size="sm" animation="border" /> : (selectedTx ? 'Update Transaction' : 'Save Payment / Purchase')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Are you sure you want to delete transaction for "${deleteTarget?.party_name}" of ${formatCurrency(deleteTarget?.amount)}?`}
      />
    </div>
  );
}
