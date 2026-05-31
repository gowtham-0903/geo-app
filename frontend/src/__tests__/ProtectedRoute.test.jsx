import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

// Provide a controlled auth context value
function renderWithAuth(authValue, initialRoute = '/dashboard', adminOnly = false) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/"      element={<div>Home Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly={adminOnly}>
                <div>Dashboard Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('shows AppLoader while auth is loading', () => {
    renderWithAuth({ user: null, isLoading: true });
    // AppLoader renders an img with alt "GEO Packs"
    expect(screen.getByAltText('GEO Packs')).toBeInTheDocument();
  });

  it('redirects to /login when user is null and not loading', () => {
    renderWithAuth({ user: null, isLoading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    renderWithAuth({
      user: { id: 'u1', role: 'admin' },
      isLoading: false,
    });
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('redirects to / when supervisor accesses adminOnly route', () => {
    renderWithAuth(
      { user: { id: 'u1', role: 'supervisor' }, isLoading: false },
      '/dashboard',
      true
    );
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders children when admin accesses adminOnly route', () => {
    renderWithAuth(
      { user: { id: 'u1', role: 'admin' }, isLoading: false },
      '/dashboard',
      true
    );
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
