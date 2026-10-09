import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('walletledger_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('walletledger_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('walletledger_token');
    localStorage.removeItem('walletledger_user');
    setToken(null);
    setUser(null);
  }, []);

  // Initialize and verify user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('walletledger_token');
      if (storedToken) {
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          setToken(storedToken);
          localStorage.setItem('walletledger_user', JSON.stringify(currentUser));
        } catch {
          // Token is invalid or expired — clear auth state
          logout();
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for 401 events dispatched by the API interceptor
    const handleExpired = () => {
      logout();
    };

    window.addEventListener('walletledger_auth_expired', handleExpired);
    return () => window.removeEventListener('walletledger_auth_expired', handleExpired);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    // POST /auth/login → { access_token, token_type, expires_in }
    const tokenData = await authService.login(email, password);
    const accessToken = tokenData.access_token;
    localStorage.setItem('walletledger_token', accessToken);
    setToken(accessToken);

    // GET /auth/me → { id, name, email, role, status, created_at }
    const currentUser = await authService.getMe();
    setUser(currentUser);
    localStorage.setItem('walletledger_user', JSON.stringify(currentUser));
    return currentUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    // POST /auth/register → { id, name, email, role, status, created_at }
    await authService.register(name, email, password);
    // Automatically log in after successful registration
    return await login(email, password);
  }, [login]);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
