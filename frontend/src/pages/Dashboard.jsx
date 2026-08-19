import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import DateRangePicker from '../components/Common/DateRangePicker';
import PageHeader from '../components/Common/PageHeader';
import StatCard from '../components/Common/StatCard';
import dashboardService from '../services/dashboardService';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [recentData, setRecentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = { start_date: startDate, end_date: endDate };

      const [resSummary, resCharts, resRecent] = await Promise.all([
        dashboardService.getSummary(params),
        dashboardService.getCharts(params),
        dashboardService.getRecent()
      ]);

      if (resSummary.success) setSummary(resSummary.data);
      if (resCharts.success) setChartsData(resCharts.data);
      if (resRecent.success) setRecentData(resRecent.data);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const barChartData = {
    labels: chartsData?.labels || [],
    datasets: [
      {
        label: 'Sales',
        data: chartsData?.sales || [],
        backgroundColor: 'rgba(25, 135, 84, 0.85)',
      },
      {
        label: 'Farmer Purchases',
        data: chartsData?.purchases || [],
        backgroundColor: 'rgba(255, 193, 7, 0.85)',
      },
      {
        label: 'Expenses',
        data: chartsData?.expenses || [],
        backgroundColor: 'rgba(220, 53, 69, 0.85)',
      },
      {
        label: 'Net Profit',
        data: chartsData?.profit || [],
        backgroundColor: 'rgba(13, 202, 240, 0.85)',
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Performance Comparison' },
    },
  };

  const doughnutData = {
    labels: chartsData?.categories?.labels || [],
    datasets: [
      {
        data: chartsData?.categories?.values || [],
        backgroundColor: [
          '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545',
          '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
        ],
      }
    ]
  };

  return (
    <div>
      <PageHeader
        title="Gangadhara Nursery Executive Dashboard"
        subtitle="Real-time business income, plant purchases, expenses & ledger balances"
        actions={
          <>
            <Button as={Link} to="/farmer-payments" variant="warning" size="sm" className="fw-semibold">
              <i className="bi bi-plus-circle me-1"></i> Farmer Payment
            </Button>
            <Button as={Link} to="/sales" variant="success" size="sm" className="fw-semibold">
              <i className="bi bi-plus-circle me-1"></i> Sale / Receipt
            </Button>
            <Button as={Link} to="/expenses" variant="danger" size="sm" className="fw-semibold">
              <i className="bi bi-plus-circle me-1"></i> Expense
            </Button>
          </>
        }
      />

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateChange}
      />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Calculating ledger data...</p>
        </div>
      ) : (
        <>
          {/* 8 Primary Cards */}
          <Row className="g-3 mb-4">
            <Col sm={6} md={3}>
              <StatCard title="Total Sales" value={summary?.total_sales} icon="bi-cart-check-fill" color="success" />
            </Col>
            <Col sm={6} md={3}>
              <StatCard title="Farmer Purchases" value={summary?.farmer_purchases} icon="bi-flower2" color="warning" />
            </Col>
            <Col sm={6} md={3}>
              <StatCard title="Farmer Payments" value={summary?.farmer_payments} icon="bi-cash-coin" color="info" />
            </Col>
            <Col sm={6} md={3}>
              <StatCard title="Customer Receipts" value={summary?.customer_receipts} icon="bi-wallet2" color="primary" />
            </Col>

            <Col sm={6} md={3}>
              <StatCard title="Total Expenses" value={summary?.total_expenses} icon="bi-truck" color="danger" />
            </Col>
            <Col sm={6} md={3}>
              <StatCard title="Net Profit" value={summary?.net_profit} icon="bi-graph-up-arrow" color={summary?.net_profit >= 0 ? "success" : "danger"} subtitle="Sales - Purchases - Expenses" />
            </Col>
            <Col sm={6} md={3}>
              <StatCard title="Customer Outstanding" value={summary?.customer_outstanding} icon="bi-people-fill" color="danger" subtitle="Total Sales - Receipts" />
            </Col>
            <Col sm={6} md={3}>
              <StatCard title="Farmer Outstanding" value={summary?.farmer_outstanding} icon="bi-person-badge" color="warning" subtitle="Total Purchases - Payments" />
            </Col>
          </Row>

          {/* Cash / Bank / UPI Movement & Charts */}
          <Row className="g-3 mb-4">
            <Col lg={8}>
              <Card className="shadow-sm border-0 rounded-3 h-100">
                <Card.Body className="p-3">
                  <Bar data={barChartData} options={barChartOptions} height={130} />
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm border-0 rounded-3 h-100">
                <Card.Header className="bg-white border-0 pt-3 px-3">
                  <h6 className="fw-bold text-dark mb-0"><i className="bi bi-pie-chart-fill me-2 text-danger"></i>Expense Category Breakdown</h6>
                </Card.Header>
                <Card.Body className="p-3 d-flex align-items-center justify-content-center">
                  {chartsData?.categories?.values?.length ? (
                    <div style={{ maxWidth: '260px' }}>
                      <Doughnut data={doughnutData} />
                    </div>
                  ) : (
                    <span className="text-muted small">No category expense records found.</span>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Money Movement & Recent Activity */}
          <Row className="g-3">
            <Col lg={4}>
              <Card className="shadow-sm border-0 rounded-3 h-100">
                <Card.Header className="bg-white border-0 pt-3 px-3">
                  <h6 className="fw-bold text-dark mb-0"><i className="bi bi-bank me-2 text-primary"></i>Cash / Bank / UPI Movement</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0 align-middle small">
                    <thead className="bg-light">
                      <tr>
                        <th>Mode</th>
                        <th className="text-end text-success">Inflow</th>
                        <th className="text-end text-danger">Outflow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.payment_modes && Object.keys(summary.payment_modes).length > 0 ? (
                        Object.entries(summary.payment_modes).map(([mode, vals]) => (
                          <tr key={mode}>
                            <td className="fw-semibold">{mode}</td>
                            <td className="text-end text-success fw-bold">{formatCurrency(vals.inflow)}</td>
                            <td className="text-end text-danger fw-bold">{formatCurrency(vals.outflow)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" className="text-center text-muted py-3">No payment movement logged.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8}>
              <Card className="shadow-sm border-0 rounded-3 h-100">
                <Card.Header className="bg-white border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history me-2 text-success"></i>Recent Transactions</h6>
                  <Button as={Link} to="/transactions" variant="outline-success" size="sm">View All</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0 align-middle small">
                    <thead className="bg-light">
                      <tr>
                        <th>Date</th>
                        <th>Party</th>
                        <th>Type</th>
                        <th className="text-end">Amount</th>
                        <th>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentData?.recent_transactions?.length ? (
                        recentData.recent_transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td>{formatDate(tx.transaction_date)}</td>
                            <td className="fw-semibold">{tx.party_name}</td>
                            <td>
                              <Badge bg={
                                tx.transaction_type === 'SALE' ? 'success' :
                                tx.transaction_type === 'CUSTOMER_RECEIPT' ? 'primary' :
                                tx.transaction_type === 'PURCHASE' ? 'warning' : 'info'
                              }>
                                {tx.transaction_type}
                              </Badge>
                            </td>
                            <td className="text-end fw-bold">{formatCurrency(tx.amount)}</td>
                            <td><small className="text-muted">{tx.payment_mode}</small></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="text-center text-muted py-3">No transactions found.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
