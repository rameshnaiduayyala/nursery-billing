import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import farmerService from '../../services/farmerService';
import DateRangePicker from '../../components/Common/DateRangePicker';
import PageHeader from '../../components/Common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import logoImg from '../../assets/Gangadhara_logo.png';

export default function FarmerLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [allFarmers, setAllFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    farmerService.getAll().then((res) => {
      if (res.success) {
        setAllFarmers(res.data || []);
        if (!selectedFarmerId && res.data?.length > 0) {
          setSelectedFarmerId(res.data[0].id);
        }
      }
    });
  }, []);

  const fetchStatement = async () => {
    if (!selectedFarmerId) return;
    try {
      setLoading(true);
      const res = await farmerService.getStatement({
        id: selectedFarmerId,
        start_date: startDate,
        end_date: endDate
      });
      if (res.success) {
        setStatement(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load statement', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFarmerId) {
      fetchStatement();
    }
  }, [selectedFarmerId, startDate, endDate]);

  const handleFarmerChange = (e) => {
    const val = e.target.value;
    setSelectedFarmerId(val);
    if (val) navigate(`/farmers/ledger/${val}`, { replace: true });
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
    exportToCsv(`farmer_ledger_${statement.farmer?.name}`, statement.transactions, headers);
  };

  return (
    <div>
      <div className="d-print-none">
        <PageHeader
          title="Farmer Ledger Statement"
          subtitle="Detailed transaction statement and running balances"
          actions={
            <>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/farmers')}>
                <i className="bi bi-arrow-left me-1"></i> Back to Farmers
              </Button>
              <Button variant="outline-primary" size="sm" onClick={handleExportCsv}>
                <i className="bi bi-download me-1"></i> Export CSV
              </Button>
              <Button variant="success" size="sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Print Statement
              </Button>
            </>
          }
        />

        <Card className="shadow-sm border-0 rounded-3 mb-3">
          <Card.Body className="p-3">
            <Row className="g-2 align-items-center">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary mb-1">Select Farmer</Form.Label>
                  <Form.Select value={selectedFarmerId} onChange={handleFarmerChange}>
                    <option value="">-- Choose Farmer --</option>
                    {allFarmers.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.location || 'No Loc'})</option>
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
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Loading ledger statement...</p>
        </div>
      ) : statement ? (
        <Card className="shadow-sm border-0 rounded-3 print-card">
          <Card.Header className="bg-white p-4 border-bottom">
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
                  <p className="text-muted small mb-1">Farmer Account Statement</p>
                  <div className="mt-2">
                    <h5 className="fw-bold text-success mb-0">{statement.farmer?.name}</h5>
                    <small className="text-secondary me-3">Phone: {statement.farmer?.phone || 'N/A'}</small>
                    <small className="text-secondary">Location: {statement.farmer?.location || 'N/A'}</small>
                  </div>
                </div>
              </Col>
              <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
                <span className="badge bg-light text-dark border px-3 py-2 fs-6 mb-2">FARMER LEDGER</span>
                <div className="small text-muted">Statement Date: {new Date().toLocaleDateString('en-IN')}</div>
                {(startDate || endDate) && (
                  <div className="small text-primary fw-semibold mt-1">
                    Period: {formatDate(startDate) || 'Beginning'} to {formatDate(endDate) || 'Today'}
                  </div>
                )}
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-4">
            <Row className="g-3 mb-4 text-center">
              <Col xs={6} md={3}>
                <div className="p-3 bg-light rounded border">
                  <small className="text-muted d-block">Opening Balance</small>
                  <strong className="fs-5 text-dark">{formatCurrency(statement.opening_balance)}</strong>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-3 bg-warning-subtle rounded border border-warning">
                  <small className="text-warning-emphasis d-block">Total Purchases</small>
                  <strong className="fs-5 text-warning-emphasis">{formatCurrency(statement.total_purchases)}</strong>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-3 bg-info-subtle rounded border border-info">
                  <small className="text-info-emphasis d-block">Total Payments</small>
                  <strong className="fs-5 text-info-emphasis">{formatCurrency(statement.total_payments)}</strong>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-3 bg-danger-subtle rounded border border-danger">
                  <small className="text-danger d-block">Closing Outstanding</small>
                  <strong className="fs-4 text-danger">{formatCurrency(statement.closing_balance)}</strong>
                </div>
              </Col>
            </Row>

            <Table hover responsive bordered className="align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '110px' }}>Date</th>
                  <th>Transaction / Details</th>
                  <th>Mode</th>
                  <th className="text-end" style={{ width: '130px' }}>Debit (Purchase)</th>
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
                    const isPurchase = tx.transaction_type === 'PURCHASE';
                    return (
                      <tr key={tx.id}>
                        <td>{formatDate(tx.transaction_date)}</td>
                        <td>
                          <span className={`fw-semibold ${isPurchase ? 'text-warning-emphasis' : 'text-info-emphasis'}`}>
                            {isPurchase ? 'Plant Purchase' : 'Farmer Payment'}
                          </span>
                          {tx.remarks && <small className="d-block text-muted">{tx.remarks}</small>}
                        </td>
                        <td>{tx.payment_mode || 'Cash'}</td>
                        <td className="text-end fw-semibold text-warning-emphasis">
                          {isPurchase ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="text-end fw-semibold text-info-emphasis">
                          {!isPurchase ? formatCurrency(tx.amount) : '-'}
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
                  <td className="text-end text-warning-emphasis">{formatCurrency(statement.total_purchases)}</td>
                  <td className="text-end text-info-emphasis">{formatCurrency(statement.total_payments)}</td>
                  <td className="text-end text-danger">{formatCurrency(statement.closing_balance)}</td>
                </tr>
              </tfoot>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info">Please select a farmer to view statement.</Alert>
      )}
    </div>
  );
}
