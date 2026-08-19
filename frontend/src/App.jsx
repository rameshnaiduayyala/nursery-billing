import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/Layout/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FarmersPage from './pages/farmers/FarmersPage';
import FarmerLedger from './pages/farmers/FarmerLedger';
import FarmerPaymentsPage from './pages/FarmerPaymentsPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerLedger from './pages/customers/CustomerLedger';
import SalesReceiptsPage from './pages/SalesReceiptsPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import RemindersPage from './pages/RemindersPage';
import UsersPage from './pages/users/UsersPage';
import ProfitLossPage from './pages/ProfitLossPage';
import ReportsPage from './pages/reports/ReportsPage';
import { Spinner } from 'react-bootstrap';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmers"
              element={
                <ProtectedRoute>
                  <FarmersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers/ledger/:id"
              element={
                <ProtectedRoute>
                  <FarmerLedger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer-payments"
              element={
                <ProtectedRoute>
                  <FarmerPaymentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <CustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/ledger/:id"
              element={
                <ProtectedRoute>
                  <CustomerLedger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <SalesReceiptsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <RemindersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />

            <Route
              path="/profit-loss"
              element={
                <ProtectedRoute>
                  <ProfitLossPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;