import { useState } from 'react';
import { walletService } from '../services/api';
import { X, ArrowDownRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DepositModal({ isOpen, onClose, onDepositSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Account Top-up');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    setLoading(true);
    try {
      const updatedWallet = await walletService.deposit(numAmount, description);
      setSuccess(`Successfully deposited ₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      setTimeout(() => {
        onDepositSuccess(updatedWallet);
        onClose();
        setAmount('');
        setSuccess('');
      }, 900);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 25000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#2563EB]">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-lg">Add Demo Funds</h3>
              <p className="text-xs text-[#64748B]">Simulated instant wallet top-up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#E2E8F0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-[#16A34A] rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Deposit Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#64748B]">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 pl-9 pr-4 rounded-xl border border-[#E2E8F0] text-lg font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                required
              />
            </div>
            {/* Quick Amounts */}
            <div className="flex gap-2 mt-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-blue-50 hover:border-blue-200 transition"
                >
                  +₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Description / Source
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. UPI Instant Top-up or Salary"
              className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Ledger Deposit...</span>
                </>
              ) : (
                <span>Confirm Deposit</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
