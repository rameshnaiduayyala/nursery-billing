import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import customerService from '../../services/customerService';
import DateRangePicker from '../../components/Common/DateRangePicker';
import PageHeader from '../../components/Common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import logoImg from '../../assets/Gangadhara_logo.png';

export default function CustomerLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    customerService.getAll().then((res) => {
      if (res.success) {
        setAllCustomers(res.data || []);
        if (!selectedCustomerId && res.data?.length > 0) {
          setSelectedCustomerId(res.data[0].id);
        }
      }
    });
  }, []);

  const fetchStatement = async () => {
    if (!selectedCustomerId) return;
    try {
      setLoading(true);
      const res = await customerService.getStatement({
        id: selectedCustomerId,
        start_date: startDate,
        end_date: endDate
      });
      if (res.success) {
        setStatement(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load customer statement', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      fetchStatement();
    }
  }, [selectedCustomerId, startDate, endDate]);

  const handleCustomerChange = (e) => {
    const val = e.target.value;
    setSelectedCustomerId(val);
    if (val) navigate(`/customers/ledger/${val}`, { replace: true });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!statement || !statement.transactions) return;
    const headers = [
      { key: 'transaction_date', label: 'Date' },
      { key: 'transaction_type', label: 'Transaction Type' },
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'remarks', label: 'Remarks' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'running_balance', label: 'Running Balance (INR)' }
    ];
    exportToCsv(`customer_ledger_${statement.customer?.name}`, statement.transactions, headers);
  };

  return (
    <div>
      {/* ── Control Header & Filters ── */}
      <div className="d-print-none mb-3">
        <PageHeader
          title="Customer / Exporter Ledger"
          subtitle="Detailed sales & receipt statement and receivables balance"
          actions={
            <>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/customers')}>
                <i className="bi bi-arrow-left me-1"></i> Back to Customers
              </Button>
              <Button variant="outline-primary" size="sm" onClick={handleExportCsv} disabled={!statement}>
                <i className="bi bi-download me-1"></i> Export CSV
              </Button>
              <Button variant="success" size="sm" onClick={handlePrint} disabled={!statement}>
                <i className="bi bi-printer me-1"></i> Print Statement
              </Button>
            </>
          }
        />

        {/* Integrated Filter Bar */}
        <Card className="shadow-sm border-0 rounded-3 mb-2">
          <Card.Body className="p-3">
            <Row className="g-2 align-items-center">
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary mb-1">Select Customer / Exporter</Form.Label>
                  <Form.Select value={selectedCustomerId} onChange={handleCustomerChange} size="sm" style={{ height: '36px' }}>
                    <option value="">-- Choose Customer --</option>
                    {allCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.city || 'No City'})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading customer statement...</p>
        </div>
      ) : statement ? (
        <Card className="shadow-sm border-0 rounded-3 print-card">
          {/* Formal Letterhead Header (PRINT ONLY) */}
          <div className="d-none d-print-block p-4 border-bottom">
            <Row className="align-items-center">
              <Col sm={8} className="d-flex align-items-center">
                <img
                  src={logoImg}
                  alt="Gangadhara Nursery"
                  className="me-3 rounded"
                  style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                />
                <div>
                  <h4 className="fw-bold text-dark mb-0">Gangadhara Nursery</h4>
                  <p className="text-muted small mb-1">Customer Account Statement</p>
                  <div className="mt-2">
                    <h5 className="fw-bold text-primary mb-0">
                      {statement.customer?.name}
                      <span className="badge bg-light text-primary border ms-2 small">{statement.customer?.type}</span>
                    </h5>
                    <small className="text-secondary me-3">Phone: {statement.customer?.phone || 'N/A'}</small>
                    <small className="text-secondary">City: {statement.customer?.city || 'N/A'} | GST: {statement.customer?.gst_number || 'N/A'}</small>
                  </div>
                </div>
              </Col>
              <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
                <span className="badge bg-light text-dark border px-3 py-2 fs-6 mb-2">CUSTOMER LEDGER</span>
                <div className="small text-muted">Statement Date: {new Date().toLocaleDateString('en-IN')}</div>
                {(startDate || endDate) && (
                  <div className="small text-primary fw-semibold mt-1">
                    Period: {formatDate(startDate) || 'Beginning'} to {formatDate(endDate) || 'Today'}
                  </div>
                )}
              </Col>
            </Row>
          </div>

          {/* On-Screen Compact Header */}
          <Card.Header className="bg-white p-3 border-bottom d-print-none">
            <Row className="align-items-center g-2">
              <Col md={7}>
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary-subtle text-primary p-2 rounded-circle me-2">
                    <i className="bi bi-person-fill fs-5"></i>
                  </span>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">
                      {statement.customer?.name}
                      <span className="badge bg-light text-primary border ms-2 small">{statement.customer?.type}</span>
                    </h5>
                    <div className="small text-muted">
                      <span className="me-3"><i className="bi bi-telephone me-1"></i>{statement.customer?.phone || 'N/A'}</span>
                      <span className="me-3"><i className="bi bi-geo-alt me-1"></i>{statement.customer?.city || 'N/A'}</span>
                      {statement.customer?.gst_number && <span>GST: {statement.customer?.gst_number}</span>}
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={5} className="text-md-end">
                <span className="badge bg-light text-dark border me-2">Statement Date: {new Date().toLocaleDateString('en-IN')}</span>
                {(startDate || endDate) && (
                  <span className="badge bg-primary-subtle text-primary border">
                    {formatDate(startDate) || 'Start'} – {formatDate(endDate) || 'Today'}
                  </span>
                )}
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-3">
            {/* KPI Summary Row */}
            <Row className="g-2 mb-3 text-center">
              <Col xs={6} md={3}>
                <div className="p-2 bg-light rounded border">
                  <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Opening Balance</small>
                  <strong className="fs-6 text-dark">{formatCurrency(statement.opening_balance)}</strong>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-2 bg-success-subtle rounded border border-success">
                  <small className="text-success-emphasis d-block" style={{ fontSize: '0.72rem' }}>Total Sales</small>
                  <strong className="fs-6 text-success-emphasis">{formatCurrency(statement.total_sales)}</strong>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-2 bg-primary-subtle rounded border border-primary">
                  <small className="text-primary-emphasis d-block" style={{ fontSize: '0.72rem' }}>Total Payments Collected</small>
                  <strong className="fs-6 text-primary-emphasis">{formatCurrency(statement.total_receipts)}</strong>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-2 bg-danger-subtle rounded border border-danger">
                  <small className="text-danger d-block" style={{ fontSize: '0.72rem' }}>Outstanding Due</small>
                  <strong className="fs-5 text-danger">{formatCurrency(statement.closing_balance)}</strong>
                </div>
              </Col>
            </Row>

            {/* Main Ledger Table */}
            <Table hover responsive bordered className="align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '110px' }}>Date</th>
                  <th>Transaction / Details</th>
                  <th>Mode</th>
                  <th className="text-end" style={{ width: '130px' }}>Debit (Sale)</th>
                  <th className="text-end" style={{ width: '130px' }}>Credit (Payment)</th>
                  <th className="text-end" style={{ width: '140px' }}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {startDate && (
                  <tr className="bg-light fw-semibold">
                    <td colSpan={3}>Opening Balance (as of {formatDate(startDate)})</td>
                    <td className="text-end">-</td>
                    <td className="text-end">-</td>
                    <td className="text-end">{formatCurrency(statement.opening_balance)}</td>
                  </tr>
                )}

                {statement.transactions?.length > 0 ? (
                  statement.transactions.map((tx) => {
                    const isSale = tx.transaction_type === 'SALE';
                    return (
                      <tr key={tx.id}>
                        <td>{formatDate(tx.transaction_date)}</td>
                        <td>
                          <span className={`fw-semibold ${isSale ? 'text-success-emphasis' : 'text-primary-emphasis'}`}>
                            {isSale ? '🌱 Plant Sale' : '💰 Customer Payment'}
                          </span>
                          {tx.remarks && <small className="d-block text-muted">{tx.remarks}</small>}
                        </td>
                        <td>{tx.payment_mode || 'Credit / On Bill'}</td>
                        <td className="text-end fw-semibold text-success-emphasis">
                          {isSale ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="text-end fw-semibold text-primary-emphasis">
                          {!isSale ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="text-end fw-bold text-dark">
                          {formatCurrency(tx.running_balance)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No transaction records in selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="table-light fw-bold">
                <tr>
                  <td colSpan={3}>Totals</td>
                  <td className="text-end text-success-emphasis">{formatCurrency(statement.total_sales)}</td>
                  <td className="text-end text-primary-emphasis">{formatCurrency(statement.total_receipts)}</td>
                  <td className="text-end text-danger">{formatCurrency(statement.closing_balance)}</td>
                </tr>
              </tfoot>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info">Please select a customer to view statement.</Alert>
      )}
    </div>
  );
}
