import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Login from '../pages/Login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin(authValue = {}) {
  const defaults = { user: null, isLoading: false, login: vi.fn(), logout: vi.fn() };
  return render(
    <AuthContext.Provider value={{ ...defaults, ...authValue }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  // ── Rendering ─────────────────────────────────────────────────
  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the GEO Packs logo', () => {
    renderLogin();
    expect(screen.getAllByAltText('Geo Packs').length).toBeGreaterThan(0);
  });

  // ── Form validation ───────────────────────────────────────────
  it('requires email field (HTML5 required)', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toBeRequired();
  });

  it('requires password field (HTML5 required)', () => {
    renderLogin();
    const pwInput = screen.getByPlaceholderText('••••••••');
    expect(pwInput).toBeRequired();
  });

  // ── Password visibility toggle ─────────────────────────────────
  it('toggles password visibility when eye button is clicked', async () => {
    renderLogin();
    const user = userEvent.setup();
    const pwInput = screen.getByPlaceholderText('••••••••');
    expect(pwInput).toHaveAttribute('type', 'password');

    const toggleBtn = pwInput.parentElement.querySelector('button');
    await user.click(toggleBtn);

    expect(pwInput).toHaveAttribute('type', 'text');
  });

  // ── Successful login ──────────────────────────────────────────
  it('calls login() and navigates to /dashboard for admin', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'admin' });
    renderLogin({ login });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'admin@geo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin@geo.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates to /production for supervisor', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'supervisor' });
    renderLogin({ login });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'sup@geo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/production'));
  });

  // ── Failed login ──────────────────────────────────────────────
  it('shows error message when login throws', async () => {
    const login = vi.fn().mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderLogin({ login });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@geo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    );
  });

  it('shows fallback error when response has no message', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Network error'));
    renderLogin({ login });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@y.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'x');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    );
  });

  // ── Loading state ─────────────────────────────────────────────
  it('shows "Signing in…" text while request is in flight', async () => {
    let resolveLogin;
    const login = vi.fn(() => new Promise(res => { resolveLogin = res; }));
    renderLogin({ login });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'admin@geo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    );

    resolveLogin({ role: 'admin' });
  });
});
