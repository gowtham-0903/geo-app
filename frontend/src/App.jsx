import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Masters from './pages/Masters';

// Placeholders — replaced in coming modules
function Dashboard()   { return <div className="py-4 text-gray-400 text-sm">Dashboard — Module 5</div>; }
function Production()  { return <div className="py-4 text-gray-400 text-sm">Production — Module 4</div>; }
function Purchase()    { return <div className="py-4 text-gray-400 text-sm">Purchase — Module 4</div>; }
function Sales()       { return <div className="py-4 text-gray-400 text-sm">Sales — Module 5</div>; }
function Outstanding() { return <div className="py-4 text-gray-400 text-sm">Outstanding — Module 5</div>; }
function Costing()     { return <div className="py-4 text-gray-400 text-sm">Costing — Module 4</div>; }
function Expenses()    { return <div className="py-4 text-gray-400 text-sm">Expenses — Module 5</div>; }

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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}