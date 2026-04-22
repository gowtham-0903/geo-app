import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Production  from './pages/Production';
import Purchase    from './pages/Purchase';
import Sales       from './pages/Sales';
import Outstanding from './pages/Outstanding';
import Costing     from './pages/Costing';
import Expenses    from './pages/Expenses';
import Masters     from './pages/Masters';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/production"  element={<ProtectedRoute><Production /></ProtectedRoute>} />
          <Route path="/purchase"    element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
          <Route path="/sales"       element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/outstanding" element={<ProtectedRoute adminOnly><Outstanding /></ProtectedRoute>} />
          <Route path="/costing"     element={<ProtectedRoute adminOnly><Costing /></ProtectedRoute>} />
          <Route path="/expenses"    element={<ProtectedRoute adminOnly><Expenses /></ProtectedRoute>} />
          <Route path="/masters"     element={<ProtectedRoute adminOnly><Masters /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}