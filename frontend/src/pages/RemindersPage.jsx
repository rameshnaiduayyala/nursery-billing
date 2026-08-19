import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Row, Col, Badge, Spinner, Form, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import reportService from '../services/reportService';
import PageHeader from '../components/Common/PageHeader';
import StatCard from '../components/Common/StatCard';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function RemindersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [minAmount, setMinAmount] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await reportService.getRemindersReport({ min_amount: minAmount });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load reminders data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [minAmount]);

  const handleSendWhatsAppCustomer = (customer) => {
    const rawPhone = (customer.phone || '').replace(/\D/g, '');
    if (!rawPhone) {
      showToast(`Phone number missing for ${customer.name}`, 'danger');
      return;
    }

    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `Dear ${customer.name},\n\nGreetings from *Gangadhara Nursery*! 🌱\n\nThis is a polite reminder regarding your pending balance statement:\n\n* Total Sales: ${formatCurrency(customer.total_sales)}\n* Total Paid: ${formatCurrency(customer.total_received)}\n* *Outstanding Balance: ${formatCurrency(customer.outstanding)}*\n\nKindly arrange the payment at your earliest convenience via Bank Transfer or UPI (PhonePe/GPay).\n\nThank you for doing business with Gangadhara Nursery!`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsAppFarmer = (farmer) => {
    const rawPhone = (farmer.phone || '').replace(/\D/g, '');
    if (!rawPhone) {
      showToast(`Phone number missing for ${farmer.name}`, 'danger');
      return;
    }

    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `Dear ${farmer.name},\n\nGreetings from *Gangadhara Nursery*! 🌱\n\nHere is your current plant purchase ledger update:\n\n* Total Purchases: ${formatCurrency(farmer.total_purchase)}\n* Total Paid: ${formatCurrency(farmer.total_paid)}\n* *Pending Balance to Pay: ${formatCurrency(farmer.outstanding)}*\n\nWe appreciate your continued partnership. Feel free to reach out for payment details.\n\nThank you!\nGangadhara Nursery`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = (name, amount, type = 'customer') => {
    const msg = type === 'customer'
      ? `Dear ${name}, Greetings from Gangadhara Nursery! Your pending balance is ${formatCurrency(amount)}. Kindly arrange payment at your earliest convenience. Thank you!`
      : `Dear ${name}, Greetings from Gangadhara Nursery! Your pending balance to pay is ${formatCurrency(amount)}. Thank you for your support!`;

    navigator.clipboard.writeText(msg);
    showToast('Reminder text copied to clipboard!', 'success');
  };

  const customersList = data?.customers_outstanding || [];
  const farmersList = data?.farmers_outstanding || [];

  return (
    <div>
      <PageHeader
        title="Overdue Payment Reminders & Alerts"
        subtitle="Track pending receivables, aging balances, and send instant WhatsApp payment reminders"
      />

      <Row className="g-3 mb-4">
        <Col sm={6} md={4}>
          <StatCard
            title="Total Customer Receivables"
            value={data?.total_customer_receivables || 0}
            icon="bi-cash-stack"
            color="danger"
            subtitle={`${customersList.length} Customer Accounts`}
          />
        </Col>
        <Col sm={6} md={4}>
          <StatCard
            title="Total Farmer Payables"
            value={data?.total_farmer_payables || 0}
            icon="bi-flower2"
            color="warning"
            subtitle={`${farmersList.length} Farmer Accounts`}
          />
        </Col>
        <Col sm={6} md={4}>
          <StatCard
            title="Critical Overdue (> 30 Days)"
            value={customersList.filter(c => c.days_idle > 30).reduce((acc, c) => acc + parseFloat(c.outstanding), 0)}
            icon="bi-exclamation-triangle-fill"
            color="danger"
            subtitle={`${customersList.filter(c => c.days_idle > 30).length} Overdue Accounts`}
          />
        </Col>
      </Row>

      <Card className="shadow-sm border-0 rounded-3 mb-4">
        <Card.Header className="bg-white border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
          <h6 className="fw-bold text-dark mb-0">
            <i className="bi bi-funnel me-2 text-primary"></i>Filter Threshold
          </h6>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted fw-semibold">Min Outstanding Amount:</span>
            <Form.Select
              size="sm"
              style={{ width: '180px' }}
              value={minAmount}
              onChange={(e) => setMinAmount(parseFloat(e.target.value))}
            >
              <option value="0">All Balances (&gt; ₹0)</option>
              <option value="10000">&gt; ₹10,000</option>
              <option value="50000">&gt; ₹50,000</option>
              <option value="100000">&gt; ₹1,000,000</option>
            </Form.Select>
          </div>
        </Card.Header>

        <Card.Body className="p-3">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Calculating overdue accounts...</p>
            </div>
          ) : (
            <Tabs defaultActiveKey="customers" id="reminders-tabs" className="mb-3">
              <Tab
                eventKey="customers"
                title={
                  <span>
                    <i className="bi bi-people-fill me-2 text-danger"></i>
                    Customer Receivables ({customersList.length})
                  </span>
                }
              >
                <Table hover responsive className="mb-0 align-middle small">
                  <thead className="bg-light">
                    <tr>
                      <th>Customer / Exporter</th>
                      <th>Phone / City</th>
                      <th className="text-end">Total Sales</th>
                      <th className="text-end">Total Received</th>
                      <th className="text-end text-danger">Outstanding Balance</th>
                      <th>Last Activity</th>
                      <th>Aging Status</th>
                      <th className="text-center">Action / Reminder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.length > 0 ? (
                      customersList.map((cust) => {
                        const isOverdue = cust.days_idle > 30;
                        return (
                          <tr key={cust.id} className={isOverdue ? 'table-danger-subtle' : ''}>
                            <td>
                              <div className="fw-bold text-dark">{cust.name}</div>
                              <Badge bg={cust.customer_type === 'EXPORTER' ? 'purple' : 'primary'} style={cust.customer_type === 'EXPORTER' ? { backgroundColor: '#6f42c1' } : {}}>
                                {cust.customer_type}
                              </Badge>
                            </td>
                            <td>
                              <div className="fw-semibold">{cust.phone || 'Phone N/A'}</div>
                              <small className="text-muted">{cust.city || 'City N/A'}</small>
                            </td>
                            <td className="text-end fw-semibold">{formatCurrency(cust.total_sales)}</td>
                            <td className="text-end text-success fw-semibold">{formatCurrency(cust.total_received)}</td>
                            <td className="text-end fw-bold text-danger fs-6">{formatCurrency(cust.outstanding)}</td>
                            <td>
                              <div>{formatDate(cust.last_transaction_date)}</div>
                              <small className="text-muted">{cust.days_idle} days ago</small>
                            </td>
                            <td>
                              <Badge bg={cust.days_idle > 30 ? 'danger' : cust.days_idle > 15 ? 'warning' : 'success'}>
                                {cust.days_idle > 30 ? 'Overdue (>30 Days)' : cust.days_idle > 15 ? 'Due Soon' : 'Recent'}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="success"
                                  title="Send WhatsApp Reminder"
                                  onClick={() => handleSendWhatsAppCustomer(cust)}
                                  className="fw-semibold"
                                >
                                  <i className="bi bi-whatsapp me-1"></i> WhatsApp
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  title="Copy Reminder Text"
                                  onClick={() => handleCopyText(cust.name, cust.outstanding, 'customer')}
                                >
                                  <i className="bi bi-copy"></i>
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  title="View Ledger Statement"
                                  onClick={() => navigate(`/customers/ledger/${cust.id}`)}
                                >
                                  <i className="bi bi-journal-text"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No customer receivables found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Tab>

              <Tab
                eventKey="farmers"
                title={
                  <span>
                    <i className="bi bi-flower2 me-2 text-warning"></i>
                    Farmer Payables ({farmersList.length})
                  </span>
                }
              >
                <Table hover responsive className="mb-0 align-middle small">
                  <thead className="bg-light">
                    <tr>
                      <th>Farmer Name</th>
                      <th>Phone / Location</th>
                      <th className="text-end">Total Purchases</th>
                      <th className="text-end">Total Paid</th>
                      <th className="text-end text-warning-emphasis">Pending Payable</th>
                      <th>Last Activity</th>
                      <th className="text-center">Action / Reminder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmersList.length > 0 ? (
                      farmersList.map((f) => (
                        <tr key={f.id}>
                          <td><div className="fw-bold text-dark">{f.name}</div></td>
                          <td>
                            <div className="fw-semibold">{f.phone || 'Phone N/A'}</div>
                            <small className="text-muted">{f.location || 'Location N/A'}</small>
                          </td>
                          <td className="text-end fw-semibold">{formatCurrency(f.total_purchase)}</td>
                          <td className="text-end text-info fw-semibold">{formatCurrency(f.total_paid)}</td>
                          <td className="text-end fw-bold text-danger fs-6">{formatCurrency(f.outstanding)}</td>
                          <td>
                            <div>{formatDate(f.last_transaction_date)}</div>
                            <small className="text-muted">{f.days_idle} days ago</small>
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <Button
                                variant="success"
                                title="Send WhatsApp Update"
                                onClick={() => handleSendWhatsAppFarmer(f)}
                                className="fw-semibold"
                              >
                                <i className="bi bi-whatsapp me-1"></i> WhatsApp
                              </Button>
                              <Button
                                variant="outline-secondary"
                                title="Copy Text"
                                onClick={() => handleCopyText(f.name, f.outstanding, 'farmer')}
                              >
                                <i className="bi bi-copy"></i>
                              </Button>
                              <Button
                                variant="outline-primary"
                                title="View Farmer Ledger"
                                onClick={() => navigate(`/farmers/ledger/${f.id}`)}
                              >
                                <i className="bi bi-journal-text"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          No farmer payables found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Tab>
            </Tabs>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
