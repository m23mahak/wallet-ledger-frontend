import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation matching backend constraints
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.friendlyMessage || 'Registration failed. Please try again.');
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
          <h1 className="text-2xl font-bold text-[#0F172A]">Create your account</h1>
          <p className="text-sm text-[#64748B] mt-1">Get started with WalletLedger</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                placeholder="Vikramaditya S."
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
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
                placeholder="Min. 8 characters"
                required
                minLength={8}
                disabled={loading}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-[#94A3B8]">Must be at least 8 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-[#64748B]">Already have an account? </span>
            <Link to="/login" className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
