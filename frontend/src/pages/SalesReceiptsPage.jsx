import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import customerService from '../services/customerService';
import transactionService from '../services/transactionService';
import PageHeader from '../components/Common/PageHeader';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';
import PrintLayout, { pTH, pTD, pTDRight, pAmt } from '../components/Common/PrintLayout';
import ThermalPrintModal from '../components/Common/ThermalPrintModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, dateToInput } from '../utils/formatters';

export default function SalesReceiptsPage() {
  const { showToast } = useToast();
  const { canCreate, canEdit, canDelete } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [allForPrint, setAllForPrint] = useState([]);
  const [thermalTx, setThermalTx] = useState(null);
  const printRef = useRef(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SALE' | 'RECEIPT'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('SALE'); // 'SALE' | 'RECEIPT'
  const [selectedTx, setSelectedTx] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    transaction_date: dateToInput(),
    customer_id: '',
    customer_name: '',
    customer_type: 'CUSTOMER',
    money_type: 'Plant Sale',
    amount: '',
    payment_mode: 'Credit / On Bill',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTx, resCust] = await Promise.all([
        transactionService.getAll({
          party_type: 'CUSTOMER',
          search,
          start_date: startDate,
          end_date: endDate,
          limit: 200
        }),
        customerService.getAll()
      ]);

      if (resTx.success) setTransactions(resTx.data?.items || []);
      if (resCust.success) setCustomers(resCust.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch sales data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, startDate, endDate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add-sale' || action === 'add') {
      handleOpenAddSaleModal();
      navigate('/sales', { replace: true });
    } else if (action === 'add-payment' || action === 'add-receipt') {
      handleOpenAddReceiptModal();
      navigate('/sales', { replace: true });
    }
  }, [location.search]);

  // Open modal for Plant Sale (Bill)
  const handleOpenAddSaleModal = () => {
    setSelectedTx(null);
    setModalMode('SALE');
    setFormData({
      transaction_date: dateToInput(),
      customer_id: customers.length ? customers[0].id : '',
      customer_name: '',
      customer_type: 'CUSTOMER',
      money_type: 'Plant Sale',
      amount: '',
      payment_mode: 'Credit / On Bill',
      remarks: ''
    });
    setIsNewCustomer(false);
    setShowModal(true);
  };

  // Open modal for Customer Receipt (Collection)
  const handleOpenAddReceiptModal = () => {
    setSelectedTx(null);
    setModalMode('RECEIPT');
    setFormData({
      transaction_date: dateToInput(),
      customer_id: customers.length ? customers[0].id : '',
      customer_name: '',
      customer_type: 'CUSTOMER',
      money_type: 'Balance Received',
      amount: '',
      payment_mode: 'Bank Transfer',
      remarks: ''
    });
    setIsNewCustomer(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (tx) => {
    setSelectedTx(tx);
    const isSale = tx.transaction_type === 'SALE';
    setModalMode(isSale ? 'SALE' : 'RECEIPT');
    setFormData({
      transaction_date: tx.transaction_date || dateToInput(),
      customer_id: tx.party_id || '',
      customer_name: tx.party_name || '',
      customer_type: tx.customer_type || 'CUSTOMER',
      money_type: isSale ? 'Plant Sale' : 'Balance Received',
      amount: tx.amount || '',
      payment_mode: tx.payment_mode || (isSale ? 'Credit / On Bill' : 'Bank Transfer'),
      remarks: tx.remarks || ''
    });
    setIsNewCustomer(false);
    setShowModal(true);
  };

  const handleCustomerSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setIsNewCustomer(true);
      setFormData({ ...formData, customer_id: 0, customer_name: '' });
    } else {
      setIsNewCustomer(false);
      setFormData({ ...formData, customer_id: val, customer_name: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid amount.', 'danger');
      return;
    }

    if (!isNewCustomer && !formData.customer_id) {
      showToast('Please select a customer.', 'danger');
      return;
    }

    if (isNewCustomer && !formData.customer_name.trim()) {
      showToast('Please enter the new customer name.', 'danger');
      return;
    }

    const txType = modalMode === 'SALE' ? 'SALE' : 'CUSTOMER_RECEIPT';

    try {
      setSubmitting(true);
      let res;
      const payMode = modalMode === 'SALE' ? 'Credit / On Bill' : formData.payment_mode;

      if (selectedTx && selectedTx.id) {
        res = await transactionService.update({
          id: selectedTx.id,
          transaction_date: formData.transaction_date,
          party_type: 'CUSTOMER',
          party_id: formData.customer_id,
          transaction_type: txType,
          amount: amountNum,
          payment_mode: payMode,
          remarks: formData.remarks
        });
      } else {
        res = await transactionService.create({
          transaction_date: formData.transaction_date,
          party_type: 'CUSTOMER',
          party_id: isNewCustomer ? 0 : formData.customer_id,
          party_name: isNewCustomer ? formData.customer_name.trim() : '',
          customer_type: formData.customer_type,
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
            : modalMode === 'SALE'
            ? 'Plant Sale bill saved!'
            : 'Customer Payment Receipt recorded!',
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
    if (activeTab === 'SALE') return tx.transaction_type === 'SALE';
    if (activeTab === 'RECEIPT') return tx.transaction_type === 'CUSTOMER_RECEIPT';
    return true;
  });

  /* ── Calculations ── */
  const totalSales    = transactions.filter(t => t.transaction_type === 'SALE').reduce((s,t) => s + Number(t.amount), 0);
  const totalReceipts = transactions.filter(t => t.transaction_type === 'CUSTOMER_RECEIPT').reduce((s,t) => s + Number(t.amount), 0);
  const netReceivable = totalSales - totalReceipts;

  /* ── Print handlers ── */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Gangadhara_Sales_${new Date().toISOString().slice(0,10)}`,
    onBeforePrint: async () => {
      try {
        setPrintLoading(true);
        const res = await transactionService.getAll({ party_type: 'CUSTOMER', search, start_date: startDate, end_date: endDate, limit: 9999 });
        setAllForPrint(res.success ? (res.data?.items || []) : transactions);
      } catch { setAllForPrint(transactions); } finally { setPrintLoading(false); }
    },
  });

  const printData = allForPrint.length > 0 ? allForPrint : filteredTransactions;

  return (
    <div>
      <PageHeader
        title="Sales & Customer Payments"
        icon="bi-cart-check-fill"
        subtitle="Manage customer plant sales bills and payments collected"
        actions={
          <>
            {canCreate && (
              <>
                <Button variant="success" size="sm" className="fw-bold me-2" onClick={handleOpenAddSaleModal}>
                  <i className="bi bi-cart-plus-fill me-1"></i> + Record Plant Sale
                </Button>
                <Button variant="primary" size="sm" className="fw-bold me-2" onClick={handleOpenAddReceiptModal}>
                  <i className="bi bi-cash-coin me-1"></i> + Collect Customer Payment
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
          <Card className="border-0 shadow-sm rounded-3 bg-success-subtle text-success-emphasis">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-uppercase fw-bold text-muted d-block" style={{ fontSize: '0.7rem' }}>Total Plant Sales (Bills)</small>
                <span className="fs-4 fw-bold">{formatCurrency(totalSales)}</span>
              </div>
              <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-cart-check fs-5"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 bg-primary-subtle text-primary-emphasis">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-uppercase fw-bold text-muted d-block" style={{ fontSize: '0.7rem' }}>Total Receipts Collected</small>
                <span className="fs-4 fw-bold">{formatCurrency(totalReceipts)}</span>
              </div>
              <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-cash-stack fs-5"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 bg-danger-subtle text-danger">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-uppercase fw-bold text-muted d-block" style={{ fontSize: '0.7rem' }}>Net Outstanding Receivables</small>
                <span className="fs-4 fw-bold">{formatCurrency(netReceivable)}</span>
              </div>
              <div className="bg-danger text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-exclamation-circle fs-5"></i>
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
                  variant={activeTab === 'SALE' ? 'success' : 'outline-secondary'}
                  onClick={() => setActiveTab('SALE')}
                >
                  🌱 Sales / Bills ({transactions.filter(t => t.transaction_type === 'SALE').length})
                </Button>
                <Button
                  variant={activeTab === 'RECEIPT' ? 'primary' : 'outline-secondary'}
                  onClick={() => setActiveTab('RECEIPT')}
                >
                  💰 Receipts Collected ({transactions.filter(t => t.transaction_type === 'CUSTOMER_RECEIPT').length})
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
                      placeholder="Search customer name..."
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
              <p className="mt-2 text-muted">Loading sales records...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle small mobile-card-table">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Customer / Exporter</th>
                  <th>Category</th>
                  <th className="text-end">Sale Bill</th>
                  <th className="text-end">Receipt Collected</th>
                  <th>Payment Mode / Status</th>
                  <th>Remarks</th>
                  {(canEdit || canDelete) && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const isSale = tx.transaction_type === 'SALE';
                    return (
                      <tr key={tx.id}>
                        <td data-label="Date" className="fw-semibold">{formatDate(tx.transaction_date)}</td>
                        <td data-label="Customer / Exporter">
                          <span className="fw-bold text-dark">{tx.party_name}</span>
                          {tx.customer_type && (
                            <Badge bg={tx.customer_type === 'EXPORTER' ? 'secondary' : 'light'} className="text-dark border ms-2">
                              {tx.customer_type}
                            </Badge>
                          )}
                        </td>
                        <td data-label="Category">
                          <Badge bg={isSale ? 'success' : 'primary'} className="px-2 py-1">
                            {isSale ? '🌱 Plant Sale' : '💰 Customer Payment'}
                          </Badge>
                        </td>
                        <td data-label="Sale Bill" className="text-end fw-bold text-success fs-6">
                          {isSale ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td data-label="Receipt Collected" className="text-end fw-bold text-primary fs-6">
                          {!isSale ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td data-label="Payment Mode">{tx.payment_mode || 'Credit / On Bill'}</td>
                        <td data-label="Remarks" className="text-muted">{tx.remarks || '-'}</td>
                        {(canEdit || canDelete) && (
                          <td data-label="Actions" className="text-center">
                            <div className="btn-group btn-group-sm">
                              <Button
                                variant="outline-success"
                                title="Thermal BT Print Receipt"
                                onClick={() => setThermalTx({
                                  bill_no: `INV-${tx.id}`,
                                  date: formatDate(tx.transaction_date),
                                  customer_name: tx.party_name,
                                  payment_mode: tx.payment_mode,
                                  total_amount: tx.amount,
                                  paid_amount: tx.amount,
                                  items: [
                                    { plant_name: tx.remarks || (isSale ? 'Plant Purchase' : 'Customer Payment'), quantity: 1, rate: Number(tx.amount), amount: Number(tx.amount) }
                                  ]
                                })}
                              >
                                <i className="bi bi-printer-fill text-success"></i>
                              </Button>
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
                      No matching sales or receipts found.
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
        <Modal.Header closeButton className={modalMode === 'SALE' ? 'bg-success-subtle' : 'bg-primary-subtle'}>
          <Modal.Title className={`h6 fw-bold ${modalMode === 'SALE' ? 'text-success' : 'text-primary'}`}>
            <i className={`bi ${modalMode === 'SALE' ? 'bi-cart-check' : 'bi-cash-coin'} me-2`}></i>
            {selectedTx
              ? 'EDIT TRANSACTION'
              : modalMode === 'SALE'
              ? 'RECORD PLANT SALE (CUSTOMER BILL)'
              : 'RECORD CUSTOMER PAYMENT RECEIPT'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            {/* Context Notice */}
            <div className={`alert ${modalMode === 'SALE' ? 'alert-success' : 'alert-primary'} py-2 px-3 mb-3 small fw-semibold`}>
              {modalMode === 'SALE'
                ? '🌱 PLANT SALE: Records plant sales order bill. (Increases customer outstanding receivable balance).'
                : '💰 CUSTOMER PAYMENT: Records payment collected from customer via Cash, UPI, or Bank. (Reduces customer outstanding balance).'}
            </div>

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
                  <Form.Label className="fw-semibold small">Customer / Exporter *</Form.Label>
                  {!isNewCustomer ? (
                    <Form.Select value={formData.customer_id} onChange={handleCustomerSelectChange}>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.city || 'City N/A'})</option>
                      ))}
                      {!selectedTx && <option value="NEW">➕ Direct Entry (Add New Customer)</option>}
                    </Form.Select>
                  ) : (
                    <div className="border p-2 rounded bg-light">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge bg-primary text-white">New Customer</span>
                        <Button variant="link" size="sm" className="p-0 text-secondary" onClick={() => setIsNewCustomer(false)}>
                          Select Existing
                        </Button>
                      </div>
                      <Row className="g-2">
                        <Col xs={8}>
                          <Form.Control
                            type="text"
                            required
                            placeholder="Enter Customer / Exporter Name"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          />
                        </Col>
                        <Col xs={4}>
                          <Form.Select
                            value={formData.customer_type}
                            onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                          >
                            <option value="CUSTOMER">Domestic</option>
                            <option value="EXPORTER">Exporter</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    {modalMode === 'SALE' ? 'Sale Amount (Bill Total ₹) *' : 'Payment Received Amount (₹) *'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    required
                    placeholder={modalMode === 'SALE' ? 'e.g. 150000 (Bill amount)' : 'e.g. 50000 (Payment collected)'}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {modalMode === 'RECEIPT' ? (
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
                      value="Credit / On Bill (No money received now)"
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
                    placeholder={modalMode === 'SALE' ? 'e.g. 500 Lemon saplings, Truck AP05 X 1234' : 'e.g. Part payment received via PhonePe'}
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
              variant={modalMode === 'SALE' ? 'success' : 'primary'}
              size="sm"
              type="submit"
              disabled={submitting}
              className="fw-bold px-4"
            >
              {submitting ? (
                <Spinner size="sm" animation="border" />
              ) : selectedTx ? (
                'Update Transaction'
              ) : modalMode === 'SALE' ? (
                'Save Plant Sale Bill'
              ) : (
                'Save Customer Payment'
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
          title="Sales & Customer Payments"
          subtitle="Plant sales and customer payment transactions"
          meta={[
            startDate ? { label: 'From', value: formatDate(startDate) } : { label: 'Period', value: 'All Time' },
            endDate   ? { label: 'To',   value: formatDate(endDate) }   : null,
          ].filter(Boolean)}
          summary={[
            { label: 'Total Sales',    value: formatCurrency(totalSales),    color: 'green' },
            { label: 'Total Receipts', value: formatCurrency(totalReceipts), color: 'green' },
            { label: 'Records',        value: printData.length },
          ]}
          landscape
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <thead>
              <tr>
                {['#','Date','Customer','Type','Sale Bill','Payment Collected','Mode / Status','Remarks'].map((h,i) => (
                  <th key={i} style={{ ...pTH, textAlign: ['Sale Bill', 'Payment Collected'].includes(h) ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printData.map((tx, i) => {
                const isS = tx.transaction_type === 'SALE';
                return (
                  <tr key={tx.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={pTD}>{i + 1}</td>
                    <td style={pTD}>{formatDate(tx.transaction_date)}</td>
                    <td style={{ ...pTD, fontWeight: 600 }}>{tx.party_name}</td>
                    <td style={pTD}>{isS ? 'Plant Sale' : 'Customer Payment'}</td>
                    <td style={{ ...pTDRight, color: '#059669' }}>{isS ? formatCurrency(tx.amount) : '—'}</td>
                    <td style={{ ...pTDRight, color: '#2563eb' }}>{!isS ? formatCurrency(tx.amount) : '—'}</td>
                    <td style={pTD}>{tx.payment_mode || 'Credit / On Bill'}</td>
                    <td style={{ ...pTD, color: '#64748b' }}>{tx.remarks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
                <td colSpan={4} style={{ ...pTD, textAlign: 'right' }}>TOTALS</td>
                <td style={{ ...pTDRight, color: '#059669' }}>{formatCurrency(totalSales)}</td>
                <td style={{ ...pTDRight, color: '#2563eb' }}>{formatCurrency(totalReceipts)}</td>
                <td colSpan={2} style={pTD} />
              </tr>
            </tfoot>
          </table>
        </PrintLayout>
      </div>

      {/* Mobile Thermal BT Printer Modal */}
      <ThermalPrintModal
        show={!!thermalTx}
        onHide={() => setThermalTx(null)}
        receiptData={thermalTx}
      />
    </div>
  );
}
