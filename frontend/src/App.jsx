import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/Layout/MainLayout';
import GlobalLoadingBar from './components/Common/GlobalLoadingBar';

// ── Route-level code splitting: each page loads only when navigated to ──
const Login                = lazy(() => import('./pages/Login'));
const Dashboard            = lazy(() => import('./pages/Dashboard'));
const FarmersPage          = lazy(() => import('./pages/farmers/FarmersPage'));
const FarmerLedger         = lazy(() => import('./pages/farmers/FarmerLedger'));
const FarmerPaymentsPage   = lazy(() => import('./pages/FarmerPaymentsPage'));
const CustomersPage        = lazy(() => import('./pages/customers/CustomersPage'));
const CustomerLedger       = lazy(() => import('./pages/customers/CustomerLedger'));
const SalesReceiptsPage    = lazy(() => import('./pages/SalesReceiptsPage'));
const ExpensesPage         = lazy(() => import('./pages/expenses/ExpensesPage'));
const TransactionsPage     = lazy(() => import('./pages/transactions/TransactionsPage'));
const RemindersPage        = lazy(() => import('./pages/RemindersPage'));
const UsersPage            = lazy(() => import('./pages/users/UsersPage'));
const ProfitLossPage       = lazy(() => import('./pages/ProfitLossPage'));
const ReportsPage          = lazy(() => import('./pages/reports/ReportsPage'));
const BackupRestorePage    = lazy(() => import('./pages/settings/BackupRestorePage'));
const ExpenseCategoriesPage = lazy(() => import('./pages/settings/ExpenseCategoriesPage'));
const PaymentModesPage     = lazy(() => import('./pages/settings/PaymentModesPage'));

// ── Page loading fallback ──
function PageLoader() {
  return (
    <div className="loading-state" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner" />
      <span className="loading-text">Loading…</span>
    </div>
  );
}

// ── Auth loading fallback ──
function AuthLoader() {
  return (
    <div className="loading-state" style={{ minHeight: '100vh' }}>
      <div className="loading-spinner" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return <MainLayout><Suspense fallback={<PageLoader />}>{children}</Suspense></MainLayout>;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading)        return <AuthLoader />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <MainLayout><Suspense fallback={<PageLoader />}>{children}</Suspense></MainLayout>;
}

function App() {
  return (
    <ToastProvider>
      <GlobalLoadingBar />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Suspense fallback={<AuthLoader />}><Login /></Suspense>} />

            <Route path="/"                      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/farmers"               element={<ProtectedRoute><FarmersPage /></ProtectedRoute>} />
            <Route path="/farmers/ledger/:id"    element={<ProtectedRoute><FarmerLedger /></ProtectedRoute>} />
            <Route path="/farmer-payments"       element={<ProtectedRoute><FarmerPaymentsPage /></ProtectedRoute>} />
            <Route path="/customers"             element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/customers/ledger/:id"  element={<ProtectedRoute><CustomerLedger /></ProtectedRoute>} />
            <Route path="/sales"                 element={<ProtectedRoute><SalesReceiptsPage /></ProtectedRoute>} />
            <Route path="/expenses"              element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
            <Route path="/transactions"          element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/reminders"             element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/profit-loss"           element={<ProtectedRoute><ProfitLossPage /></ProtectedRoute>} />
            <Route path="/reports"               element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

            <Route path="/users"                         element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/settings/backup"               element={<AdminRoute><BackupRestorePage /></AdminRoute>} />
            <Route path="/settings/expense-categories"   element={<AdminRoute><ExpenseCategoriesPage /></AdminRoute>} />
            <Route path="/settings/payment-modes"        element={<AdminRoute><PaymentModesPage /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;