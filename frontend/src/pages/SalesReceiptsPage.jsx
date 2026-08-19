import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Badge, Spinner, InputGroup } from 'react-bootstrap';
import customerService from '../services/customerService';
import transactionService from '../services/transactionService';
import PageHeader from '../components/Common/PageHeader';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, dateToInput } from '../utils/formatters';

export default function SalesReceiptsPage() {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    transaction_date: dateToInput(),
    customer_id: '',
    customer_name: '',
    customer_type: 'CUSTOMER',
    money_type: 'Plant Sale',
    amount: '',
    payment_mode: 'Bank Transfer',
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
          limit: 100
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

  const handleOpenModal = () => {
    setFormData({
      transaction_date: dateToInput(),
      customer_id: customers.length ? customers[0].id : '',
      customer_name: '',
      customer_type: 'CUSTOMER',
      money_type: 'Plant Sale',
      amount: '',
      payment_mode: 'Bank Transfer',
      remarks: ''
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

    const txType = formData.money_type === 'Plant Sale' ? 'SALE' : 'CUSTOMER_RECEIPT';

    try {
      setSubmitting(true);
      const res = await transactionService.create({
        transaction_date: formData.transaction_date,
        party_type: 'CUSTOMER',
        party_id: isNewCustomer ? 0 : formData.customer_id,
        party_name: isNewCustomer ? formData.customer_name.trim() : '',
        customer_type: formData.customer_type,
        transaction_type: txType,
        money_type: formData.money_type,
        amount: amountNum,
        payment_mode: formData.payment_mode,
        remarks: formData.remarks
      });

      if (res.success) {
        showToast('Sale / Receipt saved successfully!', 'success');
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sales & Customer Receipts"
        subtitle="Record plant sales to customers/exporters and track receipts"
        actions={
          <Button variant="success" size="sm" className="fw-bold" onClick={handleOpenModal}>
            <i className="bi bi-plus-lg me-1"></i> + Sale / Receipt
          </Button>
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
                  placeholder="Search customer, exporter or remarks..."
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
              <p className="mt-2 text-muted">Loading sales records...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Customer / Exporter</th>
                  <th>Transaction Type</th>
                  <th className="text-end">Amount</th>
                  <th>Payment Mode</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="fw-semibold">{formatDate(tx.transaction_date)}</td>
                      <td>
                        <span className="fw-bold text-dark">{tx.party_name}</span>
                        {tx.customer_type && (
                          <Badge bg={tx.customer_type === 'EXPORTER' ? 'secondary' : 'light'} className="text-dark border ms-2">
                            {tx.customer_type}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={tx.transaction_type === 'SALE' ? 'success' : 'primary'} className="px-2 py-1">
                          {tx.transaction_type === 'SALE' ? 'Plant Sale' : 'Customer Receipt'}
                        </Badge>
                      </td>
                      <td className="text-end fw-bold fs-6">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td>{tx.payment_mode}</td>
                      <td className="text-muted">{tx.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No sales or receipts found. Click <strong>+ Sale / Receipt</strong> to record one.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold text-success">
            <i className="bi bi-cart-check me-2"></i>ADD SALE / CUSTOMER RECEIPT
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
              <Form.Label className="fw-semibold small">Customer / Exporter *</Form.Label>
              {!isNewCustomer ? (
                <Form.Select value={formData.customer_id} onChange={handleCustomerSelectChange}>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.city || 'City N/A'})</option>
                  ))}
                  <option value="NEW">➕ Direct Entry (Add New Customer)</option>
                </Form.Select>
              ) : (
                <div className="border p-2 rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="badge bg-primary text-white">New Customer Detected</span>
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Transaction Type *</Form.Label>
                  <Form.Select
                    value={formData.money_type}
                    onChange={(e) => setFormData({ ...formData, money_type: e.target.value })}
                  >
                    <option value="Plant Sale">Plant Sale (Income)</option>
                    <option value="Advance Received">Advance Received</option>
                    <option value="Balance Received">Balance Received</option>
                    <option value="Other Income">Other Income</option>
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
                    placeholder="e.g. 150000"
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
                placeholder="Bulk plants, invoice number, transport reference..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={submitting} className="fw-bold px-4">
              {submitting ? <Spinner size="sm" animation="border" /> : 'Save Sale / Receipt'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
