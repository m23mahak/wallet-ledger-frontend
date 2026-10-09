import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page the user was trying to visit, or dashboard
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.friendlyMessage || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0B1F3A] text-white font-bold text-xl mb-3">
            W
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back</h1>
          <p className="text-sm text-[#64748B] mt-1">Sign in to your WalletLedger account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-[#64748B]">Don't have an account? </span>
            <Link to="/register" className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
