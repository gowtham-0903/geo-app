import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock the axios instance
vi.mock('../api/axios', () => ({
  default: {
    get:  vi.fn(),
    post: vi.fn(),
  },
}));
import api from '../api/axios';

// Helper component to read context values
function AuthReader() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="role">{user?.role ?? ''}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading then resolves user from /auth/me', async () => {
    api.get.mockResolvedValueOnce({
      data: { user: { id: 'u1', name: 'Admin', email: 'admin@geo.com', role: 'admin' } },
    });

    render(<AuthProvider><AuthReader /></AuthProvider>);

    expect(screen.getByText('loading')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('admin@geo.com')
    );
    expect(screen.getByTestId('role').textContent).toBe('admin');
  });

  it('sets user to null when /auth/me fails (unauthenticated)', async () => {
    api.get.mockRejectedValueOnce(new Error('401'));

    render(<AuthProvider><AuthReader /></AuthProvider>);

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('none')
    );
  });

  it('login() calls /auth/login and sets user', async () => {
    api.get.mockRejectedValueOnce(new Error('401')); // initial /me check

    const LoginTrigger = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <span data-testid="user">{user ? user.email : 'none'}</span>
          <button
            onClick={() =>
              login('admin@geo.com', 'pass').catch(() => {})
            }
          >
            login
          </button>
        </div>
      );
    };

    api.post.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'admin@geo.com', role: 'admin' } },
    });

    render(<AuthProvider><LoginTrigger /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));

    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('admin@geo.com')
    );
  });

  it('logout() calls /auth/logout and clears user', async () => {
    api.get.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'admin@geo.com', role: 'admin' } },
    });

    const LogoutTrigger = () => {
      const { user, logout } = useAuth();
      return (
        <div>
          <span data-testid="user">{user ? user.email : 'none'}</span>
          <button onClick={() => logout()}>logout</button>
        </div>
      );
    };

    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<AuthProvider><LogoutTrigger /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('admin@geo.com'));

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('none')
    );
  });
});
