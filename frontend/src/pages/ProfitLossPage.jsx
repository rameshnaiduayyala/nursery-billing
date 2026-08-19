import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Row, Col, Spinner } from 'react-bootstrap';
import reportService from '../services/reportService';
import DateRangePicker from '../components/Common/DateRangePicker';
import PageHeader from '../components/Common/PageHeader';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCsv } from '../utils/exportCsv';
import logoImg from '../assets/Gangadhara_logo.png';

export default function ProfitLossPage() {
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfitLoss = async () => {
    try {
      setLoading(true);
      const res = await reportService.getProfitLossReport({
        start_date: startDate,
        end_date: endDate
      });
      if (res.success) {
        setReport(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate Profit & Loss statement', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!report) return;
    const csvData = [
      { Particulars: 'Gross Sales (Income)', Amount: report.gross_sales },
      { Particulars: 'Less: Plant Purchase Cost', Amount: report.plant_purchases },
      { Particulars: 'GROSS MARGIN', Amount: report.gross_margin },
      ...Object.entries(report.expenses || {}).map(([cat, val]) => ({
        Particulars: `Less: Expense - ${cat}`,
        Amount: val
      })),
      { Particulars: 'TOTAL EXPENSES', Amount: report.total_expenses },
      { Particulars: 'NET PROFIT / (LOSS)', Amount: report.net_profit }
    ];
    exportToCsv('gangadhara_profit_and_loss_statement', csvData);
  };

  return (
    <div>
      <div className="d-print-none">
        <PageHeader
          title="Profit & Loss Statement"
          subtitle="Financial P&L breakdown based on actual sales, purchases, and categorized expenses"
          actions={
            <>
              <Button variant="outline-primary" size="sm" onClick={handleExportCsv}>
                <i className="bi bi-download me-1"></i> Export CSV
              </Button>
              <Button variant="success" size="sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Print Statement
              </Button>
            </>
          }
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Calculating financial statements...</p>
        </div>
      ) : report ? (
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
                  <p className="text-muted small mb-0">PROFIT & LOSS ACCOUNT STATEMENT</p>
                </div>
              </Col>
              <Col sm={4} className="text-sm-end mt-3 mt-sm-0">
                <span className="badge bg-dark text-white px-3 py-2 fs-6 mb-2">FINANCIAL REPORT</span>
                <div className="small text-muted">Generated: {new Date().toLocaleDateString('en-IN')}</div>
                {(startDate || endDate) && (
                  <div className="small text-success fw-semibold mt-1">
                    Period: {formatDate(startDate) || 'Beginning'} to {formatDate(endDate) || 'Today'}
                  </div>
                )}
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-4">
            <Table bordered hover responsive className="align-middle fs-6 mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Particulars / Financial Ledger Category</th>
                  <th className="text-end" style={{ width: '220px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-success fw-bold">
                  <td>Gross Sales (Total Plant Sales)</td>
                  <td className="text-end fs-5 text-success">{formatCurrency(report.gross_sales)}</td>
                </tr>

                <tr>
                  <td className="ps-4 text-muted">Less: Direct Plant Purchase Cost (Bulk Farmers)</td>
                  <td className="text-end text-danger fw-semibold">({formatCurrency(report.plant_purchases)})</td>
                </tr>

                <tr className="table-light fw-bold border-top border-bottom">
                  <td>GROSS MARGIN (Sales - Plant Purchase Cost)</td>
                  <td className="text-end text-dark">{formatCurrency(report.gross_margin)}</td>
                </tr>

                <tr className="bg-light fw-bold text-secondary">
                  <td colSpan="2">Less: Business & Operating Expenses</td>
                </tr>

                {report.expenses && Object.entries(report.expenses).map(([category, val]) => (
                  <tr key={category}>
                    <td className="ps-4 text-dark">
                      <i className="bi bi-dash me-2 text-muted"></i>
                      {category} Expense
                    </td>
                    <td className="text-end text-secondary">{formatCurrency(val)}</td>
                  </tr>
                ))}

                <tr className="table-warning fw-bold">
                  <td>Total Business Expenses</td>
                  <td className="text-end text-danger">({formatCurrency(report.total_expenses)})</td>
                </tr>

                <tr className={report.net_profit >= 0 ? "table-success fw-bold fs-5" : "table-danger fw-bold fs-5"}>
                  <td className="py-3">
                    {report.net_profit >= 0 ? 'NET PROFIT (Income - Cost - Expenses)' : 'NET LOSS'}
                  </td>
                  <td className="text-end py-3">
                    {formatCurrency(report.net_profit)}
                  </td>
                </tr>
              </tbody>
            </Table>

            <div className="mt-4 pt-3 border-top text-muted small d-flex justify-content-between">
              <span>Gangadhara Nursery &bull; Accrual Ledger Accounting</span>
              <span>Prepared for Management Review</span>
            </div>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
}
