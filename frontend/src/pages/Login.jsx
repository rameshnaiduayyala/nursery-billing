import React, { useState } from 'react';
import { Card, Form, Button, Container, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/Gangadhara_logo.png';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast('Welcome back to Gangadhara Nursery!', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Invalid email or password', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <Container style={{ maxWidth: '440px' }}>
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <img
                src={logoImg}
                alt="Gangadhara Nursery Logo"
                className="mb-3 rounded-circle shadow-sm"
                style={{ width: '84px', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', padding: '4px' }}
              />
              <h3 className="fw-bold text-dark mb-1">Gangadhara Nursery</h3>
              <p className="text-muted small">Business Management & Tally Ledger</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                  <Form.Control
                    type="email"
                    required
                    className="border-start-0 ps-0"
                    placeholder="admin@nursery.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                  <Form.Control
                    type="password"
                    required
                    className="border-start-0 ps-0"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </Form.Group>

              <Button variant="success" type="submit" size="lg" className="w-100 fw-bold shadow-sm" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" /> Logging in...
                  </>
                ) : (
                  'Login to Dashboard'
                )}
              </Button>
            </Form>

            <div className="mt-4 pt-3 border-top text-center text-muted small">
              Admin Seed Login: <strong>admin@nursery.com</strong> / <strong>admin123</strong>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
