import React, { useState, useEffect, useRef } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import reportService from '../services/reportService';
import DateRangePicker from '../components/Common/DateRangePicker';
import PageHeader from '../components/Common/PageHeader';
import PrintLayout, { pTH, pTD, pTDRight, pAmt } from '../components/Common/PrintLayout';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCsv } from '../utils/exportCsv';

export default function ProfitLossPage() {
  const { showToast } = useToast();
  const printRef = useRef(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(true);

  const fetchProfitLoss = async () => {
    try {
      setLoading(true);
      const res = await reportService.getProfitLossReport({ start_date: startDate, end_date: endDate });
      if (res.success) setReport(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to generate Profit & Loss statement', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfitLoss(); }, [startDate, endDate]);

  /* ── Print via react-to-print ── */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Gangadhara_ProfitLoss_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: '@page { size: A4 portrait; margin: 12mm; }',
  });

  const handleExportCsv = () => {
    if (!report) return;
    const csvData = [
      { Particulars: 'Gross Sales (Income)',          Amount: report.gross_sales },
      { Particulars: 'Less: Plant Purchase Cost',     Amount: report.plant_purchases },
      { Particulars: 'GROSS MARGIN',                  Amount: report.gross_margin },
      ...Object.entries(report.expenses || {}).map(([cat, val]) => ({
        Particulars: `Less: Expense - ${cat}`, Amount: val,
      })),
      { Particulars: 'TOTAL EXPENSES',                Amount: report.total_expenses },
      { Particulars: 'NET PROFIT / (LOSS)',            Amount: report.net_profit },
    ];
    exportToCsv('gangadhara_profit_and_loss_statement', csvData);
  };

  const isProfit = (report?.net_profit ?? 0) >= 0;

  /* ── P&L table rows ── */
  const plRows = report ? [
    { label: 'Gross Sales (Total Plant Sales)',            value: report.gross_sales,      type: 'income',   indent: false },
    { label: 'Less: Direct Plant Purchase Cost',          value: report.plant_purchases,  type: 'deduction',indent: true  },
    { label: 'GROSS MARGIN',                              value: report.gross_margin,     type: 'subtotal', indent: false },
    { label: 'Less: Business & Operating Expenses', value: null, type: 'section' },
    ...Object.entries(report.expenses || {}).map(([cat, val]) => ({
      label: `${cat} Expense`, value: val, type: 'expense', indent: true,
    })),
    { label: 'Total Business Expenses',                   value: report.total_expenses,   type: 'total_exp',indent: false },
    { label: isProfit ? 'NET PROFIT' : 'NET LOSS',        value: report.net_profit,       type: isProfit ? 'profit' : 'loss', indent: false },
  ] : [];

  const rowStyle = (type) => {
    const base = { padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '10.5px' };
    if (type === 'income')    return { ...base, background: '#f0fdf4', fontWeight: 700 };
    if (type === 'subtotal')  return { ...base, background: '#f8fafc', fontWeight: 700, borderTop: '1.5px solid #cbd5e1' };
    if (type === 'section')   return { ...base, background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.6px' };
    if (type === 'total_exp') return { ...base, background: '#fff7ed', fontWeight: 700 };
    if (type === 'profit')    return { ...base, background: '#dcfce7', fontWeight: 800, fontSize: '12px', borderTop: '2px solid #10b981' };
    if (type === 'loss')      return { ...base, background: '#fee2e2', fontWeight: 800, fontSize: '12px', borderTop: '2px solid #ef4444' };
    if (type === 'deduction') return { ...base, paddingLeft: '24px', color: '#64748b' };
    if (type === 'expense')   return { ...base, paddingLeft: '24px' };
    return base;
  };

  return (
    <div>
      <PageHeader
        title="Profit & Loss Statement"
        icon="bi-graph-up-arrow"
        subtitle="Financial P&L breakdown based on actual sales, purchases, and categorized expenses"
        actions={
          <>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleExportCsv}>
              <i className="bi bi-download me-1" /> Export CSV
            </button>
            <button className="btn btn-sm btn-outline-primary" onClick={handlePrint} disabled={loading || !report}>
              <i className="bi bi-printer-fill me-1" /> Print / PDF
            </button>
          </>
        }
      />

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
      />

      {loading ? (
        <div className="loading-state" style={{ minHeight: '60vh' }}>
          <div className="loading-spinner" />
          <span className="loading-text">Calculating financial statements…</span>
        </div>
      ) : report ? (
        <div className="data-card">
          <div className="data-card-header">
            <span className="data-card-title">
              <i className="bi bi-bar-chart-steps" />
              P&L Account
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {startDate || endDate
                ? `${formatDate(startDate) || 'Beginning'} → ${formatDate(endDate) || 'Today'}`
                : 'All Time'}
            </span>
          </div>

          {/* Summary row */}
          <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)' }}>
            {[
              { label: 'Gross Sales',     value: report.gross_sales,     color: 'success' },
              { label: 'Purchases',       value: report.plant_purchases,  color: 'warning' },
              { label: 'Total Expenses',  value: report.total_expenses,   color: 'danger'  },
              { label: isProfit ? 'Net Profit' : 'Net Loss', value: report.net_profit, color: isProfit ? 'success' : 'danger' },
            ].map((s) => (
              <div key={s.label} className={`stat-card stat-card-${s.color}`} style={{ flex: '1 1 140px', minWidth: '120px' }}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{formatCurrency(s.value)}</div>
              </div>
            ))}
          </div>

          {/* P&L Table */}
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Particulars / Financial Ledger Category</th>
                  <th style={{ textAlign: 'right', width: '200px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {plRows.map((row, i) => (
                  <tr key={i}>
                    {row.type === 'section' ? (
                      <td colSpan={2} style={{ padding: '8px 16px', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        {row.label}
                      </td>
                    ) : (
                      <>
                        <td style={{ paddingLeft: row.indent ? '32px' : '16px', color: row.type === 'deduction' || row.type === 'expense' ? 'var(--text-muted)' : 'inherit' }}>
                          {row.indent && <i className="bi bi-dash me-1" style={{ opacity: 0.4 }} />}
                          {row.label}
                        </td>
                        <td style={{
                          textAlign: 'right', fontWeight: row.type === 'profit' || row.type === 'loss' || row.type === 'subtotal' ? 800 : 600,
                          fontSize:  row.type === 'profit' || row.type === 'loss' ? '1.1rem' : '0.875rem',
                          color: row.type === 'income' || row.type === 'profit' || row.type === 'subtotal' ? 'var(--emerald)'
                               : row.type === 'loss' || row.type === 'deduction' || row.type === 'total_exp' ? '#dc2626'
                               : 'var(--text-secondary)',
                        }}>
                          {row.type === 'deduction' || row.type === 'total_exp'
                            ? `(${formatCurrency(row.value)})`
                            : formatCurrency(row.value)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Gangadhara Nursery • Accrual Ledger Accounting</span>
            <span>Prepared for Management Review</span>
          </div>
        </div>
      ) : null}

      {/* Hidden printable document */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintLayout
          ref={printRef}
          title="Profit & Loss Statement"
          subtitle="Financial P&L breakdown — Sales, Purchases & Expenses"
          meta={[
            startDate ? { label: 'From', value: formatDate(startDate) } : { label: 'Period', value: 'All Time' },
            endDate   ? { label: 'To',   value: formatDate(endDate) }   : null,
          ].filter(Boolean)}
          summary={report ? [
            { label: 'Gross Sales',    value: formatCurrency(report.gross_sales),    color: 'green'   },
            { label: 'Purchases',      value: formatCurrency(report.plant_purchases), color: 'red'     },
            { label: 'Expenses',       value: formatCurrency(report.total_expenses),  color: 'red'     },
            { label: isProfit ? 'Net Profit' : 'Net Loss', value: formatCurrency(report.net_profit), color: isProfit ? 'green' : 'red' },
          ] : []}
        >
          {report && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
              <thead>
                <tr>
                  <th style={pTH}>Particulars / Financial Ledger Category</th>
                  <th style={{ ...pTH, textAlign: 'right', width: '180px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {plRows.map((row, i) => (
                  <tr key={i} style={rowStyle(row.type)}>
                    {row.type === 'section' ? (
                      <td colSpan={2} style={rowStyle(row.type)}>{row.label}</td>
                    ) : (
                      <>
                        <td style={{ paddingLeft: row.indent ? '24px' : '12px', fontSize: '10.5px' }}>
                          {row.indent && '— '}{row.label}
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '10.5px',
                          color: row.type === 'profit' ? '#059669' : row.type === 'loss' ? '#dc2626' : row.type === 'deduction' || row.type === 'total_exp' ? '#dc2626' : '#0f172a' }}>
                          {row.type === 'deduction' || row.type === 'total_exp'
                            ? `(${formatCurrency(row.value)})`
                            : formatCurrency(row.value)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PrintLayout>
      </div>
    </div>
  );
}
