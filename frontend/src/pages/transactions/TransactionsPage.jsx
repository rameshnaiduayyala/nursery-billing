import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Badge, Spinner, InputGroup, Pagination } from 'react-bootstrap';
import transactionService from '../../services/transactionService';
import DateRangePicker from '../../components/Common/DateRangePicker';
import PageHeader from '../../components/Common/PageHeader';
import DeleteConfirmModal from '../../components/Common/DeleteConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';

export default function TransactionsPage() {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [partyType, setPartyType] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getAll({
        start_date: startDate,
        end_date: endDate,
        party_type: partyType,
        transaction_type: transactionType,
        payment_mode: paymentMode,
        search,
        page,
        limit
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
  };

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, partyType, transactionType, paymentMode, search, page]);

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

  const handleExportCsv = () => {
    const headers = [
      { key: 'id', label: 'Tx ID' },
      { key: 'transaction_date', label: 'Date' },
      { key: 'party_name', label: 'Party Name' },
      { key: 'party_type', label: 'Party Type' },
      { key: 'transaction_type', label: 'Transaction Type' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'remarks', label: 'Remarks' }
    ];
    exportToCsv('gangadhara_all_transactions', transactions, headers);
  };

  return (
    <div>
      <PageHeader
        title="All Business Transactions"
        subtitle="Master audit ledger of plant purchases, sales, payments, and receipts"
        actions={
          <Button variant="outline-secondary" size="sm" onClick={handleExportCsv}>
            <i className="bi bi-download me-1"></i> Export CSV
          </Button>
        }
      />

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={(s, e) => { setStartDate(s); setEndDate(e); setPage(1); }}
      />

      <Card className="shadow-sm border-0 rounded-3 mb-4">
        <Card.Header className="bg-white border-0 pt-3 px-3">
          <Row className="g-2">
            <Col md={3}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light"><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search party or remarks..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>

            <Col xs={6} md={3}>
              <Form.Select
                size="sm"
                value={partyType}
                onChange={(e) => { setPartyType(e.target.value); setPage(1); }}
              >
                <option value="">All Party Types</option>
                <option value="FARMER">Farmers</option>
                <option value="CUSTOMER">Customers / Exporters</option>
              </Form.Select>
            </Col>

            <Col xs={6} md={3}>
              <Form.Select
                size="sm"
                value={transactionType}
                onChange={(e) => { setTransactionType(e.target.value); setPage(1); }}
              >
                <option value="">All Transaction Types</option>
                <option value="SALE">Plant Sale</option>
                <option value="CUSTOMER_RECEIPT">Customer Receipt</option>
                <option value="PURCHASE">Plant Purchase</option>
                <option value="FARMER_PAYMENT">Farmer Payment</option>
              </Form.Select>
            </Col>

            <Col xs={6} md={3}>
              <Form.Select
                size="sm"
                value={paymentMode}
                onChange={(e) => { setPaymentMode(e.target.value); setPage(1); }}
              >
                <option value="">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading transactions...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Party Type</th>
                  <th>Transaction Type</th>
                  <th className="text-end text-success">Money In</th>
                  <th className="text-end text-danger">Money Out</th>
                  <th>Mode</th>
                  <th>Remarks</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const isInflow = tx.transaction_type === 'SALE' || tx.transaction_type === 'CUSTOMER_RECEIPT';
                    return (
                      <tr key={tx.id}>
                        <td>{formatDate(tx.transaction_date)}</td>
                        <td className="fw-bold text-dark">{tx.party_name}</td>
                        <td>
                          <Badge bg={tx.party_type === 'FARMER' ? 'warning' : 'primary'} className="text-dark">
                            {tx.party_type}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={
                            tx.transaction_type === 'SALE' ? 'success' :
                            tx.transaction_type === 'CUSTOMER_RECEIPT' ? 'info' :
                            tx.transaction_type === 'PURCHASE' ? 'warning' : 'secondary'
                          }>
                            {tx.transaction_type}
                          </Badge>
                        </td>
                        <td className="text-end fw-bold text-success">
                          {isInflow ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="text-end fw-bold text-danger">
                          {!isInflow ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td>{tx.payment_mode || 'Cash'}</td>
                        <td className="text-muted">{tx.remarks || '-'}</td>
                        <td className="text-center">
                          <Button variant="outline-danger" size="sm" onClick={() => setDeleteTarget(tx)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No transaction records found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>

        {totalPages > 1 && (
          <Card.Footer className="bg-white border-0 d-flex align-items-center justify-content-between py-3 px-3">
            <span className="small text-muted">Showing {transactions.length} of {totalRecords} transactions</span>
            <Pagination size="sm" className="mb-0">
              <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
              <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item key={i + 1} active={i + 1 === page} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
              <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Delete transaction for "${deleteTarget?.party_name}" of amount ${formatCurrency(deleteTarget?.amount)}?`}
      />
    </div>
  );
}
