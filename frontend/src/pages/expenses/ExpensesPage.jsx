import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import expenseService from '../../services/expenseService';
import DateRangePicker from '../../components/Common/DateRangePicker';
import PageHeader from '../../components/Common/PageHeader';
import DeleteConfirmModal from '../../components/Common/DeleteConfirmModal';
import StatCard from '../../components/Common/StatCard';
import PrintLayout, { pTH, pTD, pTDRight, pAmt } from '../../components/Common/PrintLayout';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, dateToInput } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';

const EXPENSE_TYPES = [
  'Travel', 'Fuel', 'Loading', 'Unloading', 'Labour',
  'Packing', 'Commission', 'Vehicle', 'Other'
];

export default function ExpensesPage() {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ total_amount: 0, travel_total: 0, fuel_total: 0, transport_total: 0 });
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const printRef = useRef(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    expense_date: dateToInput(),
    expense_type: 'Travel',
    description: '',
    amount: '',
    payment_mode: 'Cash',
    remarks: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseService.getAll({
        start_date: startDate,
        end_date: endDate,
        expense_type: expenseTypeFilter,
        search
      });
      if (res.success) {
        setExpenses(res.data?.items || []);
        setTotals({
          total_amount: res.data?.total_amount || 0,
          travel_total: res.data?.travel_total || 0,
          fuel_total: res.data?.fuel_total || 0,
          transport_total: res.data?.transport_total || 0
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch expenses', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, expenseTypeFilter, search]);

  const handleOpenAdd = () => {
    setSelectedExpense(null);
    setFormData({
      expense_date: dateToInput(),
      expense_type: 'Travel',
      description: '',
      amount: '',
      payment_mode: 'Cash',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (exp) => {
    setSelectedExpense(exp);
    setFormData({
      expense_date: exp.expense_date || dateToInput(),
      expense_type: exp.expense_type || 'Travel',
      description: exp.description || '',
      amount: exp.amount || '',
      payment_mode: exp.payment_mode || 'Cash',
      remarks: exp.remarks || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid expense amount.', 'danger');
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (selectedExpense && selectedExpense.id) {
        res = await expenseService.update({ ...formData, id: selectedExpense.id, amount: amountNum });
      } else {
        res = await expenseService.create({ ...formData, amount: amountNum });
      }

      if (res.success) {
        showToast(selectedExpense ? 'Expense updated successfully' : 'Expense saved successfully', 'success');
        setShowModal(false);
        fetchExpenses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save expense', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await expenseService.delete(deleteTarget.id);
      if (res.success) {
        showToast('Expense deleted successfully', 'success');
        setDeleteTarget(null);
        fetchExpenses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'expense_date', label: 'Date' },
      { key: 'expense_type', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'remarks', label: 'Remarks' },
    ];
    exportToCsv('gangadhara_expenses', expenses, headers);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Gangadhara_Expenses_${new Date().toISOString().slice(0,10)}`,
    onBeforePrint: async () => {
      setPrintLoading(true);
      await fetchExpenses();
      setPrintLoading(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Business & Transport Expenses"
        icon="bi-truck"
        subtitle="Track travel, fuel, loading, unloading, labour, packing and vehicle expenses"
        actions={
          <>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleExportCsv}>
              <i className="bi bi-download me-1" /> Export CSV
            </button>
            <button className="btn btn-sm btn-outline-primary" onClick={handlePrint} disabled={printLoading}>
              {printLoading ? <><span className="spinner-border spinner-border-sm me-1" />Preparing…</> : <><i className="bi bi-printer-fill me-1" />Print</>}
            </button>
            <Button variant="danger" size="sm" className="fw-bold" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i> Add Expense
            </Button>
          </>
        }
      />

      <Row className="g-3 mb-3">
        <Col sm={6} md={3}>
          <StatCard title="Total Travel Expense" value={totals.travel_total} icon="bi-airplane" color="primary" />
        </Col>
        <Col sm={6} md={3}>
          <StatCard title="Total Fuel Expense" value={totals.fuel_total} icon="bi-fuel-pump" color="warning" />
        </Col>
        <Col sm={6} md={3}>
          <StatCard title="Total Transport Expense" value={totals.transport_total} icon="bi-truck" color="info" />
        </Col>
        <Col sm={6} md={3}>
          <StatCard title="Total All Expenses" value={totals.total_amount} icon="bi-wallet2" color="danger" />
        </Col>
      </Row>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
      />

      <Card className="shadow-sm border-0 rounded-3">
        <Card.Header className="bg-white border-0 pt-3 px-3">
          <Row className="g-2">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light"><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search description, remarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={3}>
              <Form.Select
                size="sm"
                value={expenseTypeFilter}
                onChange={(e) => setExpenseTypeFilter(e.target.value)}
              >
                <option value="">All Expense Types</option>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-2 text-muted">Loading expenses...</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-end">Amount</th>
                  <th>Payment Mode</th>
                  <th>Remarks</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="fw-semibold">{formatDate(exp.expense_date)}</td>
                      <td>
                        <Badge bg="danger" className="px-2 py-1">{exp.expense_type}</Badge>
                      </td>
                      <td className="fw-bold text-dark">{exp.description || exp.expense_type}</td>
                      <td className="text-end fw-bold fs-6 text-danger">{formatCurrency(exp.amount)}</td>
                      <td>{exp.payment_mode}</td>
                      <td className="text-muted">{exp.remarks || '-'}</td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Button variant="outline-secondary" onClick={() => handleOpenEdit(exp)}>
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button variant="outline-danger" onClick={() => setDeleteTarget(exp)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No expense records found. Click <strong>+ Expense</strong> to add one.
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
          <Modal.Title className="h6 fw-bold text-danger">
            <i className="bi bi-truck me-2"></i>{selectedExpense ? 'EDIT EXPENSE' : 'ADD BUSINESS EXPENSE'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Expense Date *</Form.Label>
              <Form.Control
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Expense Type *</Form.Label>
                  <Form.Select
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
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
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Diesel for plant transport truck"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Payment Mode *</Form.Label>
              <Form.Select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Driver name, bill number, notes..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="danger" size="sm" type="submit" disabled={submitting} className="fw-bold px-4">
              {submitting ? <Spinner size="sm" animation="border" /> : 'Save Expense'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        message={`Are you sure you want to delete this expense of ${formatCurrency(deleteTarget?.amount)}?`}
      />

      {/* Hidden printable document */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintLayout
          ref={printRef}
          title="Business & Transport Expenses"
          subtitle="Categorized expense report"
          meta={[
            startDate ? { label: 'From', value: formatDate(startDate) } : { label: 'Period', value: 'All Time' },
            endDate   ? { label: 'To',   value: formatDate(endDate) }   : null,
            expenseTypeFilter ? { label: 'Category', value: expenseTypeFilter } : null,
          ].filter(Boolean)}
          summary={[
            { label: 'Total Expenses', value: formatCurrency(totals.total_amount), color: 'red' },
            { label: 'Records',        value: expenses.length },
          ]}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <thead>
              <tr>
                {['#','Date','Category','Description','Amount','Mode','Remarks'].map((h,i) => (
                  <th key={i} style={{ ...pTH, textAlign: h === 'Amount' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={exp.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={pTD}>{i + 1}</td>
                  <td style={pTD}>{formatDate(exp.expense_date)}</td>
                  <td style={{ ...pTD, fontWeight: 600 }}>{exp.expense_type}</td>
                  <td style={pTD}>{exp.description || '—'}</td>
                  <td style={{ ...pTDRight, ...pAmt(false) }}>{formatCurrency(exp.amount)}</td>
                  <td style={pTD}>{exp.payment_mode}</td>
                  <td style={{ ...pTD, color: '#64748b' }}>{exp.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#fef2f2', fontWeight: 800 }}>
                <td colSpan={4} style={{ ...pTD, textAlign: 'right' }}>TOTAL</td>
                <td style={{ ...pTDRight, color: '#dc2626' }}>{formatCurrency(totals.total_amount)}</td>
                <td colSpan={2} style={pTD} />
              </tr>
            </tfoot>
          </table>
        </PrintLayout>
      </div>
    </div>
  );
}
