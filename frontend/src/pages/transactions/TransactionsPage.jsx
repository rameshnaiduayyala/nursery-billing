import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Form, Pagination } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import transactionService from '../../services/transactionService';
import DateRangePicker from '../../components/Common/DateRangePicker';
import PageHeader from '../../components/Common/PageHeader';
import DeleteConfirmModal from '../../components/Common/DeleteConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import useDebounce from '../../hooks/useDebounce';

/* ── Transaction type config ─────────────────────────────── */
const TX_CONFIG = {
  SALE:             { label: 'Plant Sale',       cls: 'badge-success', inflow: true  },
  CUSTOMER_RECEIPT: { label: 'Customer Receipt', cls: 'badge-info',    inflow: true  },
  PURCHASE:         { label: 'Plant Purchase',   cls: 'badge-warning', inflow: false },
  FARMER_PAYMENT:   { label: 'Farmer Payment',   cls: 'badge-purple',  inflow: false },
  EXPENSE:          { label: 'Expense',          cls: 'badge-danger',  inflow: false },
};

const PARTY_BADGE = {
  FARMER:   'badge-warning',
  CUSTOMER: 'badge-primary',
};

/* ── Printable Ledger Component ──────────────────────────── */
const PrintableLedger = React.forwardRef(function PrintableLedger(
  { transactions, startDate, endDate, partyType, transactionType, paymentMode, totalRecords },
  ref
) {
  const totalInflow  = transactions.reduce((s, tx) => TX_CONFIG[tx.transaction_type]?.inflow  ? s + Number(tx.amount) : s, 0);
  const totalOutflow = transactions.reduce((s, tx) => !TX_CONFIG[tx.transaction_type]?.inflow ? s + Number(tx.amount) : s, 0);

  const filterDesc = [
    startDate && endDate ? `Period: ${formatDate(startDate)} – ${formatDate(endDate)}` : startDate ? `From: ${formatDate(startDate)}` : endDate ? `To: ${formatDate(endDate)}` : 'Period: All Time',
    partyType       ? `Party: ${partyType}`            : '',
    transactionType ? `Type: ${transactionType}`       : '',
    paymentMode     ? `Payment Mode: ${paymentMode}`   : '',
  ].filter(Boolean).join('   |   ');

  return (
    <div ref={ref} style={{ fontFamily: "'Inter', Arial, sans-serif", padding: '28px 36px', color: '#0f172a', background: '#fff', minWidth: '800px' }}>
      {/* Print header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #10b981', paddingBottom: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', letterSpacing: '-0.5px' }}>Gangadhara Nursery</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Business Transaction Ledger</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Printed: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Records: {totalRecords}</div>
        </div>
      </div>

      {/* Filter summary */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '10px', color: '#15803d', marginBottom: '16px', fontWeight: 500 }}>
        <i>Filter: </i>{filterDesc || 'No filters applied — All transactions'}
      </div>

      {/* Summary totals */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total Money In',  value: totalInflow,             color: '#059669', bg: '#f0fdf4' },
          { label: 'Total Money Out', value: totalOutflow,            color: '#dc2626', bg: '#fef2f2' },
          { label: 'Net Flow',        value: totalInflow - totalOutflow, color: totalInflow >= totalOutflow ? '#059669' : '#dc2626', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b' }}>{s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['#', 'Date', 'Party Name', 'Party Type', 'Transaction Type', 'Money In', 'Money Out', 'Mode', 'Remarks'].map((h) => (
              <th key={h} style={{
                padding: '7px 8px',
                borderBottom: '1.5px solid #e2e8f0',
                textAlign: h === 'Money In' || h === 'Money Out' ? 'right' : 'left',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                fontSize: '8.5px', color: '#64748b', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '11px' }}>
                No transactions found.
              </td>
            </tr>
          ) : transactions.map((tx, idx) => {
            const cfg     = TX_CONFIG[tx.transaction_type] ?? { inflow: false };
            const isInflow = cfg.inflow;
            const rowBg   = idx % 2 === 0 ? '#fff' : '#fafafa';
            return (
              <tr key={tx.id} style={{ background: rowBg }}>
                <td style={tdc}>{idx + 1}</td>
                <td style={tdc}>{formatDate(tx.transaction_date)}</td>
                <td style={{ ...tdc, fontWeight: 600 }}>{tx.party_name || '—'}</td>
                <td style={tdc}>{tx.party_type || '—'}</td>
                <td style={tdc}>{cfg.label || tx.transaction_type}</td>
                <td style={{ ...tdc, textAlign: 'right', color: '#059669', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {isInflow ? formatCurrency(tx.amount) : '—'}
                </td>
                <td style={{ ...tdc, textAlign: 'right', color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {!isInflow ? formatCurrency(tx.amount) : '—'}
                </td>
                <td style={tdc}>{tx.payment_mode || '—'}</td>
                <td style={{ ...tdc, color: '#64748b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.remarks || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
            <td colSpan={5} style={{ ...tdc, fontWeight: 700, textAlign: 'right', paddingRight: '12px' }}>TOTAL</td>
            <td style={{ ...tdc, textAlign: 'right', color: '#059669', fontWeight: 800 }}>{formatCurrency(totalInflow)}</td>
            <td style={{ ...tdc, textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>{formatCurrency(totalOutflow)}</td>
            <td colSpan={2} style={tdc} />
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
        <span>Gangadhara Nursery — Confidential Business Record</span>
        <span>Generated by Nursery Management System</span>
      </div>

      {/* Print-only CSS */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
});

// Shared table cell style
const tdc = {
  padding: '6px 8px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '10.5px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

/* ── Main TransactionsPage ───────────────────────────────── */
export default function TransactionsPage() {
  const { showToast } = useToast();
  const { canDelete } = useAuth();

  const [transactions, setTransactions]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [printLoading, setPrintLoading]     = useState(false);
  const [allForPrint, setAllForPrint]       = useState([]);

  // Filters
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [partyType, setPartyType]           = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [paymentMode, setPaymentMode]       = useState('');
  const [search, setSearch]                 = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Pagination
  const [page, setPage]         = useState(1);
  const [limit]                 = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Delete
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Print ref
  const printRef = useRef(null);

  /* ── Fetch paginated list ── */
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionService.getAll({
        start_date: startDate, end_date: endDate,
        party_type: partyType, transaction_type: transactionType,
        payment_mode: paymentMode, search: debouncedSearch,
        page, limit,
      });
      if (res.success) {
        setTransactions(res.data?.items || []);
        setTotalPages(res.data?.pages || 1);
        setTotalRecords(res.data?.total || 0);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch transactions', 'danger');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, partyType, transactionType, paymentMode, debouncedSearch, page, limit]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  /* ── Fetch ALL records for print (no pagination) ── */
  const fetchAllForPrint = useCallback(async () => {
    try {
      setPrintLoading(true);
      const res = await transactionService.getAll({
        start_date: startDate, end_date: endDate,
        party_type: partyType, transaction_type: transactionType,
        payment_mode: paymentMode, search: debouncedSearch,
        page: 1, limit: 9999,
      });
      return res.success ? (res.data?.items || []) : [];
    } catch {
      showToast('Failed to fetch all records for print', 'danger');
      return [];
    } finally {
      setPrintLoading(false);
    }
  }, [startDate, endDate, partyType, transactionType, paymentMode, debouncedSearch]);

  /* ── react-to-print hook ── */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Gangadhara_Transactions_${new Date().toISOString().slice(0, 10)}`,
    onBeforePrint: async () => {
      const all = await fetchAllForPrint();
      setAllForPrint(all);
    },
    pageStyle: `
      @page { size: A4 landscape; margin: 10mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `,
  });

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await transactionService.delete(deleteTarget.id);
      if (res.success) {
        showToast('Transaction deleted successfully', 'success');
        setDeleteTarget(null);
        fetchTransactions();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── CSV export ── */
  const handleExportCsv = () => {
    const headers = [
      { key: 'id',               label: 'Tx ID' },
      { key: 'transaction_date', label: 'Date' },
      { key: 'party_name',       label: 'Party Name' },
      { key: 'party_type',       label: 'Party Type' },
      { key: 'transaction_type', label: 'Transaction Type' },
      { key: 'amount',           label: 'Amount (INR)' },
      { key: 'payment_mode',     label: 'Payment Mode' },
      { key: 'remarks',          label: 'Remarks' },
    ];
    exportToCsv('gangadhara_all_transactions', transactions, headers);
  };

  /* ── Filter change helpers ── */
  const handleFilterChange = (setter) => (e) => { setter(e.target.value); setPage(1); };

  /* ── Totals for current page ── */
  const pageInflow  = transactions.reduce((s, tx) => TX_CONFIG[tx.transaction_type]?.inflow  ? s + Number(tx.amount) : s, 0);
  const pageOutflow = transactions.reduce((s, tx) => !TX_CONFIG[tx.transaction_type]?.inflow ? s + Number(tx.amount) : s, 0);

  /* ── Render ── */
  return (
    <div>
      <PageHeader
        title="All Transactions"
        icon="bi-journal-text"
        subtitle="Master audit ledger of plant purchases, sales, payments & receipts"
        actions={
          <>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleExportCsv}>
              <i className="bi bi-download me-1" /> Export CSV
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={handlePrint}
              disabled={printLoading}
              title="Print or save as PDF"
            >
              {printLoading
                ? <><span className="spinner-border spinner-border-sm me-1" />Preparing…</>
                : <><i className="bi bi-printer-fill me-1" />Print / PDF</>
              }
            </button>
          </>
        }
      />

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={(s, e) => { setStartDate(s); setEndDate(e); setPage(1); }}
      />

      {/* Filters + Table */}
      <div className="data-card mb-4">
        {/* Filter row */}
        <div className="data-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Search */}
          <div className="search-input-wrap" style={{ flex: '1 1 180px', minWidth: '160px' }}>
            <i className="bi bi-search" />
            <input
              type="text"
              className="form-control"
              placeholder="Search party or remarks…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Party Type */}
          <Form.Select size="sm" style={{ flex: '1 1 140px', minWidth: '130px', height: '34px' }} value={partyType} onChange={handleFilterChange(setPartyType)}>
            <option value="">All Party Types</option>
            <option value="FARMER">Farmers</option>
            <option value="CUSTOMER">Customers / Exporters</option>
          </Form.Select>

          {/* Transaction Type */}
          <Form.Select size="sm" style={{ flex: '1 1 160px', minWidth: '150px', height: '34px' }} value={transactionType} onChange={handleFilterChange(setTransactionType)}>
            <option value="">All Tx Types</option>
            <option value="SALE">Plant Sale</option>
            <option value="CUSTOMER_RECEIPT">Customer Receipt</option>
            <option value="PURCHASE">Plant Purchase</option>
            <option value="FARMER_PAYMENT">Farmer Payment</option>
            <option value="EXPENSE">Expense</option>
          </Form.Select>

          {/* Payment Mode */}
          <Form.Select size="sm" style={{ flex: '1 1 140px', minWidth: '130px', height: '34px' }} value={paymentMode} onChange={handleFilterChange(setPaymentMode)}>
            <option value="">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </Form.Select>

          {/* Record count */}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {totalRecords} record{totalRecords !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span className="loading-text">Loading transactions…</span>
            </div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Party Type</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right', color: '#059669' }}>Money In</th>
                  <th style={{ textAlign: 'right', color: '#dc2626' }}>Money Out</th>
                  <th>Mode</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((tx) => {
                  const cfg     = TX_CONFIG[tx.transaction_type] ?? { inflow: false, label: tx.transaction_type, cls: 'badge-gray' };
                  const isInflow = cfg.inflow;
                  const ptCls   = PARTY_BADGE[tx.party_type] ?? 'badge-gray';
                  return (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(tx.transaction_date)}</td>
                      <td><span style={{ fontWeight: 600 }}>{tx.party_name || '—'}</span></td>
                      <td><span className={`badge-pill ${ptCls}`}>{tx.party_type || '—'}</span></td>
                      <td><span className={`badge-pill ${cfg.cls}`}>{cfg.label}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={isInflow ? 'amount-positive' : 'amount-neutral'}>
                          {isInflow ? formatCurrency(tx.amount) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={!isInflow ? 'amount-negative' : 'amount-neutral'}>
                          {!isInflow ? formatCurrency(tx.amount) : '—'}
                        </span>
                      </td>
                      <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tx.payment_mode || '—'}</span></td>
                      <td><span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{tx.remarks || '—'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        {canDelete && (
                          <button
                            className="btn btn-sm"
                            style={{ border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '6px', padding: '4px 10px' }}
                            onClick={() => setDeleteTarget(tx)}
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={9} className="table-empty">
                      <i className="bi bi-journal-text" />
                      <span className="table-empty-text">No transactions found matching the current filters.</span>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Page subtotals */}
              {transactions.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Page {page} subtotal ({transactions.length} records)
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <span className="amount-positive">{formatCurrency(pageInflow)}</span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <span className="amount-negative">{formatCurrency(pageOutflow)}</span>
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border-light)', background: '#fafbfc', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)} of {totalRecords} records
            </span>
            <Pagination size="sm" className="mb-0" style={{ gap: '2px' }}>
              <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
              <Pagination.Prev  disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
                return p <= totalPages ? (
                  <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>{p}</Pagination.Item>
                ) : null;
              })}
              <Pagination.Next disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
            </Pagination>
          </div>
        )}
      </div>

      {/* Hidden printable ledger — rendered off-screen, captured by react-to-print */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintableLedger
          ref={printRef}
          transactions={allForPrint.length > 0 ? allForPrint : transactions}
          startDate={startDate}
          endDate={endDate}
          partyType={partyType}
          transactionType={transactionType}
          paymentMode={paymentMode}
          totalRecords={allForPrint.length > 0 ? allForPrint.length : totalRecords}
        />
      </div>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Delete transaction for "${deleteTarget?.party_name}" of ${formatCurrency(deleteTarget?.amount)}? This cannot be undone.`}
      />
    </div>
  );
}
