import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import DateRangePicker from '../components/Common/DateRangePicker';
import PageHeader from '../components/Common/PageHeader';
import StatCard from '../components/Common/StatCard';
import DataTable from '../components/Common/DataTable';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const txTypeConfig = {
  SALE:             { cls: 'badge-success', label: 'Sale' },
  CUSTOMER_RECEIPT: { cls: 'badge-info',    label: 'Receipt' },
  PURCHASE:         { cls: 'badge-warning', label: 'Purchase' },
  FARMER_PAYMENT:   { cls: 'badge-purple',  label: 'F.Payment' },
  EXPENSE:          { cls: 'badge-danger',  label: 'Expense' },
};

export default function Dashboard() {
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [summary, setSummary]     = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [recentData, setRecentData] = useState(null);
  const [loading, setLoading]     = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = { start_date: startDate, end_date: endDate };
      const [resSummary, resCharts, resRecent] = await Promise.all([
        dashboardService.getSummary(params),
        dashboardService.getCharts(params),
        dashboardService.getRecent(),
      ]);
      if (resSummary.success) setSummary(resSummary.data);
      if (resCharts.success)  setChartsData(resCharts.data);
      if (resRecent.success)  setRecentData(resRecent.data);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [startDate, endDate]);

  const handleDateChange = (start, end) => { setStartDate(start); setEndDate(end); };

  /* ── Charts config ── */
  const barData = {
    labels: chartsData?.labels || [],
    datasets: [
      { label: 'Sales',            data: chartsData?.sales     || [], backgroundColor: 'rgba(16,185,129,0.8)',  borderRadius: 4 },
      { label: 'Farmer Purchases', data: chartsData?.purchases || [], backgroundColor: 'rgba(245,158,11,0.8)', borderRadius: 4 },
      { label: 'Expenses',         data: chartsData?.expenses  || [], backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 4 },
      { label: 'Net Profit',       data: chartsData?.profit    || [], backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 4 },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 16 } },
      title: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${formatCurrency(c.raw)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 }, callback: (v) => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v) }
      },
    },
  };

  const doughnutData = {
    labels: chartsData?.categories?.labels || [],
    datasets: [{
      data: chartsData?.categories?.values || [],
      backgroundColor: ['#10b981','#f59e0b','#ef4444','#6366f1','#8b5cf6','#06b6d4','#f97316','#14b8a6','#3b82f6','#ec4899'],
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 10, family: 'Inter' }, boxWidth: 10, padding: 10 } },
      tooltip: { callbacks: { label: (c) => ` ${formatCurrency(c.raw)}` } },
    },
    cutout: '65%',
  };

  /* ── Recent Transactions table columns ── */
  const txColumns = [
    { key: 'transaction_date', label: 'Date',   render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{formatDate(v)}</span> },
    { key: 'party_name',       label: 'Party',  render: (v) => <span style={{ fontWeight: 600 }}>{v || '—'}</span> },
    { key: 'transaction_type', label: 'Type',   render: (v) => {
      const cfg = txTypeConfig[v] || { cls: 'badge-gray', label: v };
      return <span className={`badge-pill ${cfg.cls}`}>{cfg.label}</span>;
    }},
    { key: 'amount', label: 'Amount', align: 'right', render: (v) => <span className="amount-positive">{formatCurrency(v)}</span> },
    { key: 'payment_mode', label: 'Mode', render: (v) => <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{v || '—'}</span> },
  ];

  /* ── Payment modes table columns ── */
  const modeColumns = [
    { key: 'mode',    label: 'Mode',    render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'inflow',  label: 'Inflow',  align: 'right', render: (v) => <span className="amount-positive">{formatCurrency(v)}</span> },
    { key: 'outflow', label: 'Outflow', align: 'right', render: (v) => <span className="amount-negative">{formatCurrency(v)}</span> },
  ];

  const paymentModeRows = summary?.payment_modes
    ? Object.entries(summary.payment_modes).map(([mode, vals]) => ({ mode, ...vals }))
    : [];

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        icon="bi-grid-1x2-fill"
        subtitle="Real-time business income, plant purchases, expenses & ledger balances"
        actions={
          <>
            <Link to="/farmer-payments" className="btn btn-sm btn-warning fw-semibold">
              <i className="bi bi-plus-circle me-1" /> Farmer Payment
            </Link>
            <Link to="/sales" className="btn btn-sm btn-success fw-semibold">
              <i className="bi bi-plus-circle me-1" /> Sale / Receipt
            </Link>
            <Link to="/expenses" className="btn btn-sm btn-danger fw-semibold">
              <i className="bi bi-plus-circle me-1" /> Expense
            </Link>
          </>
        }
      />

      <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateChange} />

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span className="loading-text">Calculating ledger data…</span>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <Row className="g-3 mb-4">
            {[
              { title: 'Total Sales',           value: summary?.total_sales,          icon: 'bi-cart-check-fill',  color: 'success' },
              { title: 'Farmer Purchases',       value: summary?.farmer_purchases,     icon: 'bi-flower2',          color: 'warning' },
              { title: 'Farmer Payments Made',   value: summary?.farmer_payments,      icon: 'bi-cash-coin',        color: 'info' },
              { title: 'Customer Receipts',      value: summary?.customer_receipts,    icon: 'bi-wallet2',          color: 'primary' },
              { title: 'Total Expenses',         value: summary?.total_expenses,       icon: 'bi-truck',            color: 'danger' },
              { title: 'Net Profit',             value: summary?.net_profit,           icon: 'bi-graph-up-arrow',   color: summary?.net_profit >= 0 ? 'success' : 'danger', subtitle: 'Sales − Purchases − Expenses' },
              { title: 'Customer Outstanding',   value: summary?.customer_outstanding, icon: 'bi-people-fill',      color: 'danger',  subtitle: 'Total Sales − Receipts' },
              { title: 'Farmer Outstanding',     value: summary?.farmer_outstanding,   icon: 'bi-person-badge',     color: 'warning', subtitle: 'Total Purchases − Payments' },
            ].map((card) => (
              <Col key={card.title} xs={6} md={3}>
                <StatCard {...card} />
              </Col>
            ))}
          </Row>

          {/* ── Charts ── */}
          <Row className="g-3 mb-4">
            <Col lg={8}>
              <div className="data-card h-100">
                <div className="data-card-header">
                  <span className="data-card-title">
                    <i className="bi bi-bar-chart-line-fill" />
                    Monthly Performance Comparison
                  </span>
                </div>
                <div className="data-card-body">
                  <Bar data={barData} options={barOptions} height={130} />
                </div>
              </div>
            </Col>

            <Col lg={4}>
              <div className="data-card h-100">
                <div className="data-card-header">
                  <span className="data-card-title">
                    <i className="bi bi-pie-chart-fill" style={{ color: '#ef4444' }} />
                    Expense Category Breakdown
                  </span>
                </div>
                <div className="data-card-body d-flex align-items-center justify-content-center">
                  {chartsData?.categories?.values?.length ? (
                    <div style={{ maxWidth: '240px', width: '100%' }}>
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-pie-chart" style={{ fontSize: 32, color: '#cbd5e1', display: 'block', marginBottom: 8 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No expense categories found.</span>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* ── Payment Modes + Recent Transactions ── */}
          <Row className="g-3">
            <Col lg={4}>
              <DataTable
                title="Cash / Bank / UPI Movement"
                titleIcon="bi-bank"
                columns={modeColumns}
                data={paymentModeRows}
                emptyIcon="bi-credit-card"
                emptyText="No payment movement logged."
                rowKey="mode"
              />
            </Col>

            <Col lg={8}>
              <DataTable
                title="Recent Transactions"
                titleIcon="bi-clock-history"
                columns={txColumns}
                data={recentData?.recent_transactions || []}
                emptyIcon="bi-journal-text"
                emptyText="No transactions found."
                actions={
                  <Link to="/transactions" className="btn btn-sm btn-outline-success">
                    View All <i className="bi bi-arrow-right ms-1" />
                  </Link>
                }
              />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
