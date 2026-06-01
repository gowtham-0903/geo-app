import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLoader from './components/AppLoader';

const Login          = lazy(() => import('./pages/Login'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Production     = lazy(() => import('./pages/Production'));
const Purchase       = lazy(() => import('./pages/Purchase'));
const Sales          = lazy(() => import('./pages/Sales'));
const Outstanding    = lazy(() => import('./pages/Outstanding'));
const Costing        = lazy(() => import('./pages/Costing'));
const Expenses       = lazy(() => import('./pages/Expenses'));
const Masters        = lazy(() => import('./pages/Masters'));
const Invoices       = lazy(() => import('./pages/Invoices'));
const Stock          = lazy(() => import('./pages/Stock'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/production"  element={<ProtectedRoute><Production /></ProtectedRoute>} />
            <Route path="/purchase"    element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
            <Route path="/sales"       element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/invoices"    element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/outstanding" element={<ProtectedRoute adminOnly><Outstanding /></ProtectedRoute>} />
            <Route path="/costing"     element={<ProtectedRoute adminOnly><Costing /></ProtectedRoute>} />
            <Route path="/expenses"    element={<ProtectedRoute adminOnly><Expenses /></ProtectedRoute>} />
            <Route path="/masters"     element={<ProtectedRoute adminOnly><Masters /></ProtectedRoute>} />
            <Route path="/admin/users" element={<Navigate to="/masters" replace />} />
            <Route path="/stock"       element={<ProtectedRoute><Stock /></ProtectedRoute>} />
            <Route path="*"            element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
