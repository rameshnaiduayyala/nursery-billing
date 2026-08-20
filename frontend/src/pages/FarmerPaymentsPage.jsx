import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import farmerService from '../services/farmerService';
import transactionService from '../services/transactionService';
import PageHeader from '../components/Common/PageHeader';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';
import PrintLayout, { pTable, pTH, pTD, pTDRight, pAmt } from '../components/Common/PrintLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, dateToInput } from '../utils/formatters';

export default function FarmerPaymentsPage() {
  const { showToast } = useToast();
  const { canCreate, canEdit, canDelete } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [allForPrint, setAllForPrint] = useState([]);
  const printRef = useRef(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PURCHASE' | 'PAYMENT'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('PURCHASE'); // 'PURCHASE' | 'PAYMENT'
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
    payment_mode: 'Credit / On Bill',
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
          limit: 200
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      handleOpenAddPurchaseModal();
      navigate('/farmer-payments', { replace: true });
    }
  }, [location.search]);

  // Open modal for Plant Purchase (Bill)
  const handleOpenAddPurchaseModal = () => {
    setSelectedTx(null);
    setModalMode('PURCHASE');
    setFormData({
      transaction_date: dateToInput(),
      farmer_id: farmers.length ? farmers[0].id : '',
      farmer_name: '',
      money_type: 'Plant Purchase',
      amount: '',
      payment_mode: 'Credit / On Bill',
      remarks: ''
    });
    setIsNewFarmer(false);
    setShowModal(true);
  };

  // Open modal for Farmer Payment (Cash/Bank Outflow)
  const handleOpenAddPaymentModal = () => {
    setSelectedTx(null);
    setModalMode('PAYMENT');
    setFormData({
      transaction_date: dateToInput(),
      farmer_id: farmers.length ? farmers[0].id : '',
      farmer_name: '',
      money_type: 'Balance Payment',
      amount: '',
      payment_mode: 'Bank Transfer',
      remarks: ''
    });
    setIsNewFarmer(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (tx) => {
    setSelectedTx(tx);
    const isPurch = tx.transaction_type === 'PURCHASE';
    setModalMode(isPurch ? 'PURCHASE' : 'PAYMENT');
    setFormData({
      transaction_date: tx.transaction_date || dateToInput(),
      farmer_id: tx.party_id || '',
      farmer_name: tx.party_name || '',
      money_type: isPurch ? 'Plant Purchase' : 'Balance Payment',
      amount: tx.amount || '',
      payment_mode: tx.payment_mode || (isPurch ? 'Credit / On Bill' : 'Bank Transfer'),
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

    const txType = modalMode === 'PURCHASE' ? 'PURCHASE' : 'FARMER_PAYMENT';

    try {
      setSubmitting(true);
      let res;
      const payMode = modalMode === 'PURCHASE' ? 'Credit / On Bill' : formData.payment_mode;

      if (selectedTx && selectedTx.id) {
        res = await transactionService.update({
          id: selectedTx.id,
          transaction_date: formData.transaction_date,
          party_type: 'FARMER',
          party_id: formData.farmer_id,
          transaction_type: txType,
          amount: amountNum,
          payment_mode: payMode,
          remarks: formData.remarks
        });
      } else {
        res = await transactionService.create({
          transaction_date: formData.transaction_date,
          party_type: 'FARMER',
          party_id: isNewFarmer ? 0 : formData.farmer_id,
          party_name: isNewFarmer ? formData.farmer_name.trim() : '',
          transaction_type: txType,
          amount: amountNum,
          payment_mode: payMode,
          remarks: formData.remarks
        });
      }

      if (res.success) {
        showToast(
          selectedTx
            ? 'Transaction updated successfully!'
            : modalMode === 'PURCHASE'
              ? 'Plant Purchase bill saved!'
              : 'Farmer Payment recorded!',
          'success'
        );
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
        showToast('Transaction deleted successfully!', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Filtered list by Active Tab ── */
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'PURCHASE') return tx.transaction_type === 'PURCHASE';
    if (activeTab === 'PAYMENT') return tx.transaction_type === 'FARMER_PAYMENT';
    return true;
  });

  /* ── Calculation Summary ── */
  const totalPurchases = transactions.filter(t => t.transaction_type === 'PURCHASE').reduce((s, t) => s + Number(t.amount), 0);
  const totalPayments = transactions.filter(t => t.transaction_type === 'FARMER_PAYMENT').reduce((s, t) => s + Number(t.amount), 0);
  const netPayable = totalPurchases - totalPayments;

  /* ── Print handlers ── */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Gangadhara_FarmerTransactions_${new Date().toISOString().slice(0, 10)}`,
    onBeforePrint: async () => {
      try {
        setPrintLoading(true);
        const res = await transactionService.getAll({ party_type: 'FARMER', search, start_date: startDate, end_date: endDate, limit: 9999 });
        setAllForPrint(res.success ? (res.data?.items || []) : transactions);
      } catch { setAllForPrint(transactions); } finally { setPrintLoading(false); }
    },
  });

  const printData = allForPrint.length > 0 ? allForPrint : filteredTransactions;

  return (
    <div>
      <PageHeader
        title="Farmer Purchases & Payments"
        icon="bi-flower2"
        subtitle="Manage plant purchase bills and payments made to farmers"
        actions={
          <>
            {canCreate && (
              <>
                <Button variant="warning" size="sm" className="fw-bold me-2" onClick={handleOpenAddPurchaseModal}>
                  <i className="bi bi-bag-plus-fill me-1"></i> + Record Plant Purchase
                </Button>
                <Button variant="success" size="sm" className="fw-bold me-2" onClick={handleOpenAddPaymentModal}>
                  <i className="bi bi-cash-stack me-1"></i> + Pay Farmer
                </Button>
              </>
            )}
            <button className="btn btn-sm btn-outline-primary" onClick={handlePrint} disabled={printLoading}>
              {printLoading ? <><span className="spinner-border spinner-border-sm me-1" />Preparing…</> : <><i className="bi bi-printer-fill me-1" />Print</>}
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 bg-warning-subtle text-warning-emphasis">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-uppercase fw-bold text-muted d-block" style={{ fontSize: '0.7rem' }}>Total Plant Purchases (Bills)</small>
                <span className="fs-4 fw-bold">{formatCurrency(totalPurchases)}</span>
              </div>
              <div className="bg-warning text-dark rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-box-seam fs-5"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 bg-info-subtle text-info-emphasis">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-uppercase fw-bold text-muted d-block" style={{ fontSize: '0.7rem' }}>Total Payments Made</small>
                <span className="fs-4 fw-bold">{formatCurrency(totalPayments)}</span>
              </div>
              <div className="bg-info text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-wallet2 fs-5"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 bg-danger-subtle text-danger">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-uppercase fw-bold text-muted d-block" style={{ fontSize: '0.7rem' }}>Net Outstanding Due</small>
                <span className="fs-4 fw-bold">{formatCurrency(netPayable)}</span>
              </div>
              <div className="bg-danger text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-exclamation-triangle fs-5"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 rounded-3 mb-4">
        <Card.Header className="bg-white border-bottom p-3">
          <Row className="g-2 align-items-center">
            {/* Filter Tabs */}
            <Col md={6}>
              <div className="btn-group btn-group-sm">
                <Button
                  variant={activeTab === 'ALL' ? 'dark' : 'outline-secondary'}
                  onClick={() => setActiveTab('ALL')}
                >
                  All ({transactions.length})
                </Button>
                <Button
                  variant={activeTab === 'PURCHASE' ? 'warning' : 'outline-secondary'}
                  onClick={() => setActiveTab('PURCHASE')}
                >
                  📦 Purchases / Bills ({transactions.filter(t => t.transaction_type === 'PURCHASE').length})
                </Button>
                <Button
                  variant={activeTab === 'PAYMENT' ? 'success' : 'outline-secondary'}
                  onClick={() => setActiveTab('PAYMENT')}
                >
                  💵 Payments Made ({transactions.filter(t => t.transaction_type === 'FARMER_PAYMENT').length})
                </Button>
              </div>
            </Col>

            {/* Search & Dates */}
            <Col md={6}>
              <Row className="g-2">
                <Col xs={6}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light"><i className="bi bi-search"></i></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search farmer name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading transactions...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle small mobile-card-table">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Farmer Name</th>
                  <th>Category</th>
                  <th className="text-end">Bill Purchase</th>
                  <th className="text-end">Payment Paid</th>
                  <th>Payment Mode / Status</th>
                  <th>Remarks</th>
                  {(canEdit || canDelete) && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const isPurch = tx.transaction_type === 'PURCHASE';
                    return (
                      <tr key={tx.id}>
                        <td data-label="Date" className="fw-semibold">{formatDate(tx.transaction_date)}</td>
                        <td data-label="Farmer Name" className="fw-bold text-dark">{tx.party_name}</td>
                        <td data-label="Category">
                          <Badge bg={isPurch ? 'warning' : 'success'} className="px-2 py-1">
                            {isPurch ? '📦 Plant Purchase' : '💵 Farmer Payment'}
                          </Badge>
                        </td>
                        <td data-label="Bill Purchase" className="text-end fw-bold text-warning-emphasis fs-6">
                          {isPurch ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td data-label="Payment Paid" className="text-end fw-bold text-success fs-6">
                          {!isPurch ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td data-label="Payment Mode">{tx.payment_mode || 'Credit / On Bill'}</td>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No matching transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal with Explicit Mode */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className={modalMode === 'PURCHASE' ? 'bg-warning-subtle' : 'bg-success-subtle'}>
          <Modal.Title className={`h6 fw-bold ${modalMode === 'PURCHASE' ? 'text-warning-emphasis' : 'text-success'}`}>
            <i className={`bi ${modalMode === 'PURCHASE' ? 'bi-bag-plus-fill' : 'bi-cash-stack'} me-2`}></i>
            {selectedTx
              ? 'EDIT TRANSACTION'
              : modalMode === 'PURCHASE'
                ? 'RECORD PLANT PURCHASE (FARMER BILL)'
                : 'RECORD FARMER PAYMENT (CASH / BANK OUTFLOW)'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Date *</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
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
                        <span className="badge bg-warning text-dark">New Farmer</span>
                        <Button variant="link" size="sm" className="p-0 text-secondary" onClick={() => setIsNewFarmer(false)}>
                          Select Existing
                        </Button>
                      </div>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter Farmer / Nursery Name"
                        value={formData.farmer_name}
                        onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    {modalMode === 'PURCHASE' ? 'Purchase Amount (Bill Total ₹) *' : 'Payment Amount Paid (₹) *'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    required
                    placeholder={modalMode === 'PURCHASE' ? 'e.g. 50000 (Bill amount)' : 'e.g. 20000 (Amount paid)'}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {modalMode === 'PAYMENT' ? (
                <Col md={6}>
                  <Form.Group>
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
                </Col>
              ) : (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Bill Payment Status</Form.Label>
                    <Form.Control
                      type="text"
                      readOnly
                      className="bg-light text-muted fw-semibold"
                      value="Credit / On Bill (No money paid now)"
                    />
                  </Form.Group>
                </Col>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Remarks / Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder={modalMode === 'PURCHASE' ? 'e.g. 1000 Mango plants @ 50 Rs each, Lot #4' : 'e.g. Part payment for May lot via GPay'}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              variant={modalMode === 'PURCHASE' ? 'warning' : 'success'}
              size="sm"
              type="submit"
              disabled={submitting}
              className="fw-bold px-4 text-dark"
            >
              {submitting ? (
                <Spinner size="sm" animation="border" />
              ) : selectedTx ? (
                'Update Transaction'
              ) : modalMode === 'PURCHASE' ? (
                'Save Plant Purchase Bill'
              ) : (
                'Save Farmer Payment'
              )}
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

      {/* Hidden printable document */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintLayout
          ref={printRef}
          title="Farmer Purchases & Payments"
          subtitle="Plant purchase and payment transactions with farmers"
          meta={[
            startDate ? { label: 'From', value: formatDate(startDate) } : { label: 'Period', value: 'All Time' },
            endDate ? { label: 'To', value: formatDate(endDate) } : null,
          ].filter(Boolean)}
          summary={[
            { label: 'Plant Purchases', value: formatCurrency(totalPurchases), color: 'red' },
            { label: 'Payments Made', value: formatCurrency(totalPayments), color: 'green' },
            { label: 'Total Records', value: printData.length, color: 'neutral' },
          ]}
          landscape
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <thead>
              <tr>
                {['#', 'Date', 'Farmer Name', 'Type', 'Purchase Bill', 'Payment Paid', 'Mode / Status', 'Remarks'].map((h, i) => (
                  <th key={i} style={{ ...pTH, textAlign: ['Purchase Bill', 'Payment Paid'].includes(h) ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printData.length === 0 ? (
                <tr><td colSpan={8} style={{ ...pTD, textAlign: 'center', color: '#94a3b8' }}>No records.</td></tr>
              ) : printData.map((tx, i) => {
                const isP = tx.transaction_type === 'PURCHASE';
                return (
                  <tr key={tx.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={pTD}>{i + 1}</td>
                    <td style={pTD}>{formatDate(tx.transaction_date)}</td>
                    <td style={{ ...pTD, fontWeight: 600 }}>{tx.party_name}</td>
                    <td style={pTD}>{isP ? 'Plant Purchase' : 'Farmer Payment'}</td>
                    <td style={{ ...pTDRight, color: '#d97706' }}>{isP ? formatCurrency(tx.amount) : '—'}</td>
                    <td style={{ ...pTDRight, color: '#059669' }}>{!isP ? formatCurrency(tx.amount) : '—'}</td>
                    <td style={pTD}>{tx.payment_mode || 'Credit / On Bill'}</td>
                    <td style={{ ...pTD, color: '#64748b' }}>{tx.remarks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
                <td colSpan={4} style={{ ...pTD, textAlign: 'right' }}>TOTALS</td>
                <td style={{ ...pTDRight, color: '#d97706' }}>{formatCurrency(totalPurchases)}</td>
                <td style={{ ...pTDRight, color: '#059669' }}>{formatCurrency(totalPayments)}</td>
                <td colSpan={2} style={pTD} />
              </tr>
            </tfoot>
          </table>
        </PrintLayout>
      </div>
    </div>
  );
}
