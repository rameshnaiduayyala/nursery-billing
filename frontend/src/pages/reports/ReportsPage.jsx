import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Nav, Spinner, Badge } from 'react-bootstrap';
import reportService from '../../services/reportService';
import DateRangePicker from '../../components/Common/DateRangePicker';
import PageHeader from '../../components/Common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import logoImg from '../../assets/Gangadhara_logo.png';

export default function ReportsPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let res;
      const params = { start_date: startDate, end_date: endDate, search };

      if (activeTab === 'sales' || activeTab === 'daily_sales' || activeTab === 'monthly_sales') {
        res = await reportService.getSalesReport(params);
      } else if (activeTab === 'purchases' || activeTab === 'farmer_payments') {
        res = await reportService.getPurchasesReport(params);
      } else if (activeTab === 'expenses' || activeTab === 'travel' || activeTab === 'fuel') {
        const typeParam = activeTab === 'travel' ? 'Travel' : activeTab === 'fuel' ? 'Fuel' : '';
        res = await reportService.getExpensesReport({ ...params, expense_type: typeParam });
      } else if (activeTab === 'farmers_outstanding') {
        res = await reportService.getFarmersReport(params);
      } else if (activeTab === 'customers_outstanding') {
        res = await reportService.getCustomersReport(params);
      } else if (activeTab === 'profit_loss') {
        res = await reportService.getProfitLossReport(params);
      }

      if (res && res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load report', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, startDate, endDate, search]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    const items = reportData.items || [];
    exportToCsv(`gangadhara_report_${activeTab}`, items);
  };

  return (
    <div>
      <div className="d-print-none">
        <PageHeader
          title="Reports & Analytics Hub"
          subtitle="Generate, print, and export ledger and financial reports"
          actions={
            <>
              <Button variant="outline-primary" size="sm" onClick={handleExportCsv}>
                <i className="bi bi-download me-1"></i> Export CSV
              </Button>
              <Button variant="success" size="sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Print Report
              </Button>
            </>
          }
        />

        <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="bg-light p-2 rounded mb-3 gap-1">
          <Nav.Item><Nav.Link eventKey="sales">Sales & Receipts</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="purchases">Farmer Purchases</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="expenses">Expenses</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="travel">Travel Expenses</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="fuel">Fuel Expenses</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="farmers_outstanding">Farmer Outstanding</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="customers_outstanding">Customer Outstanding</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="profit_loss">Profit & Loss</Nav.Link></Nav.Item>
        </Nav>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        />

        <Row className="mb-3">
          <Col md={4}>
            <Form.Control
              type="text"
              size="sm"
              placeholder="Search in report..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
        </Row>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Generating report data...</p>
        </div>
      ) : reportData ? (
        <Card className="shadow-sm border-0 rounded-3 print-card">
          <Card.Header className="bg-white p-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <img
                src={logoImg}
                alt="Gangadhara Nursery"
                className="me-3 rounded"
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              />
              <div>
                <h5 className="fw-bold text-dark mb-0">Gangadhara Nursery - Business Report</h5>
                <small className="text-muted">Type: <strong>{activeTab.replace('_', ' ').toUpperCase()}</strong></small>
              </div>
            </div>
            <div className="text-end small text-muted">
              Report Date: {new Date().toLocaleDateString('en-IN')}
            </div>
          </Card.Header>

          <Card.Body className="p-3">
            {(activeTab === 'sales' || activeTab === 'purchases') && (
              <>
                <Row className="g-3 mb-3 text-center">
                  <Col md={4}>
                    <div className="p-2 bg-light border rounded">
                      <small className="text-muted d-block">Total Transactions</small>
                      <strong className="fs-5">{reportData.items?.length || 0}</strong>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2 bg-success-subtle border border-success rounded">
                      <small className="text-success d-block">Total Amount</small>
                      <strong className="fs-5 text-success">
                        {formatCurrency(activeTab === 'sales' ? reportData.total_sales : reportData.total_purchases)}
                      </strong>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2 bg-danger-subtle border border-danger rounded">
                      <small className="text-danger d-block">Net Outstanding</small>
                      <strong className="fs-5 text-danger">{formatCurrency(reportData.net_outstanding)}</strong>
                    </div>
                  </Col>
                </Row>

                <Table hover responsive bordered className="align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Party Name</th>
                      <th>Type</th>
                      <th className="text-end">Amount</th>
                      <th>Payment Mode</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items?.length ? (
                      reportData.items.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDate(r.transaction_date)}</td>
                          <td className="fw-bold">{r.customer_name || r.farmer_name || r.party_name}</td>
                          <td><Badge bg="secondary">{r.transaction_type}</Badge></td>
                          <td className="text-end fw-bold">{formatCurrency(r.amount)}</td>
                          <td>{r.payment_mode}</td>
                          <td className="text-muted">{r.remarks || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">No records found.</td></tr>
                    )}
                  </tbody>
                </Table>
              </>
            )}

            {(activeTab === 'expenses' || activeTab === 'travel' || activeTab === 'fuel') && (
              <>
                <Row className="g-3 mb-3 text-center">
                  <Col md={3}>
                    <div className="p-2 bg-light border rounded">
                      <small className="text-muted d-block">Total Travel Expense</small>
                      <strong className="fs-5 text-primary">{formatCurrency(reportData.travel_total)}</strong>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-2 bg-light border rounded">
                      <small className="text-muted d-block">Total Fuel Expense</small>
                      <strong className="fs-5 text-warning">{formatCurrency(reportData.fuel_total)}</strong>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-2 bg-light border rounded">
                      <small className="text-muted d-block">Total Transport</small>
                      <strong className="fs-5 text-info">{formatCurrency(reportData.transport_total)}</strong>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-2 bg-danger-subtle border border-danger rounded">
                      <small className="text-danger d-block">Total Expenses</small>
                      <strong className="fs-5 text-danger">{formatCurrency(reportData.total_expenses)}</strong>
                    </div>
                  </Col>
                </Row>

                <Table hover responsive bordered className="align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                      <th>Payment Mode</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items?.length ? (
                      reportData.items.map((e) => (
                        <tr key={e.id}>
                          <td>{formatDate(e.expense_date)}</td>
                          <td><Badge bg="danger">{e.expense_type}</Badge></td>
                          <td className="fw-semibold">{e.description || e.expense_type}</td>
                          <td className="text-end fw-bold text-danger">{formatCurrency(e.amount)}</td>
                          <td>{e.payment_mode}</td>
                          <td className="text-muted">{e.remarks || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">No expense records found.</td></tr>
                    )}
                  </tbody>
                </Table>
              </>
            )}

            {(activeTab === 'farmers_outstanding' || activeTab === 'customers_outstanding') && (
              <>
                <Row className="g-3 mb-3 text-center">
                  <Col md={4}>
                    <div className="p-2 bg-light border rounded">
                      <small className="text-muted d-block">Total Parties</small>
                      <strong className="fs-5">{reportData.items?.length || 0}</strong>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2 bg-danger-subtle border border-danger rounded">
                      <small className="text-danger d-block">Grand Total Outstanding</small>
                      <strong className="fs-4 text-danger">{formatCurrency(reportData.grand_outstanding)}</strong>
                    </div>
                  </Col>
                </Row>

                <Table hover responsive bordered className="align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone / Location</th>
                      <th className="text-end">Period Activity</th>
                      <th className="text-end">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items?.length ? (
                      reportData.items.map((party) => (
                        <tr key={party.id}>
                          <td>#{party.id}</td>
                          <td className="fw-bold">{party.name}</td>
                          <td>{party.phone || party.location || party.city || '-'}</td>
                          <td className="text-end">
                            {formatCurrency(party.period_purchases || party.period_sales || 0)}
                          </td>
                          <td className="text-end fw-bold text-danger">
                            {formatCurrency(party.outstanding)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No party records found.</td></tr>
                    )}
                  </tbody>
                </Table>
              </>
            )}

            {activeTab === 'profit_loss' && (
              <Table bordered hover responsive className="align-middle fs-6 mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Financial Particulars</th>
                    <th className="text-end">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-success fw-bold">
                    <td>Gross Sales</td>
                    <td className="text-end text-success">{formatCurrency(reportData.gross_sales)}</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Less: Plant Purchase Cost</td>
                    <td className="text-end text-danger">({formatCurrency(reportData.plant_purchases)})</td>
                  </tr>
                  <tr className="table-light fw-bold">
                    <td>Gross Margin</td>
                    <td className="text-end">{formatCurrency(reportData.gross_margin)}</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Less: Operating Expenses</td>
                    <td className="text-end text-danger">({formatCurrency(reportData.total_expenses)})</td>
                  </tr>
                  <tr className={reportData.net_profit >= 0 ? "table-success fw-bold fs-5" : "table-danger fw-bold fs-5"}>
                    <td>Net Profit / (Loss)</td>
                    <td className="text-end">{formatCurrency(reportData.net_profit)}</td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
}
