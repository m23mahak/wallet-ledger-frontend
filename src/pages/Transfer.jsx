import { useState, useEffect, useCallback } from 'react';
import { transferService, walletService } from '../services/api';
import {
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  User,
  IndianRupee,
  FileText,
  Hash,
  Clock,
  RefreshCw,
  Shield,
} from 'lucide-react';

const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Generate a UUID-v4 idempotency key
const generateIdempotencyKey = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// Steps: FORM → REVIEW → RESULT
const STEP = { FORM: 'FORM', REVIEW: 'REVIEW', RESULT: 'RESULT' };

export default function Transfer() {
  // Wallet (for showing available balance context)
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Form fields
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Flow state
  const [step, setStep] = useState(STEP.FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());

  // ── Fetch wallet for balance context ────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch {
      // Wallet fetch is supplementary — don't block the form
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Listen for balance updates from deposits
  useEffect(() => {
    const handler = (e) => { if (e.detail) setWallet(e.detail); };
    window.addEventListener('walletledger_balance_updated', handler);
    return () => window.removeEventListener('walletledger_balance_updated', handler);
  }, []);

  // ── Validate form ───────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const trimmed = recipient.trim();

    if (!trimmed) {
      errs.recipient = 'Recipient wallet number or email is required';
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Enter a valid amount greater than ₹0';
    } else if (wallet && numAmount > wallet.available_balance) {
      errs.amount = `Insufficient balance. Available: ₹${fmt(wallet.available_balance)}`;
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Go to review step ──────────────────────────────────────────────────
  const handleReview = (e) => {
    e.preventDefault();
    setError('');
    if (validate()) {
      setStep(STEP.REVIEW);
    }
  };

  // ── Confirm and send transfer ──────────────────────────────────────────
  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await transferService.transfer(
        recipient.trim(),
        Number(amount),
        description.trim() || undefined,
        idempotencyKey
      );
      setResult(data);
      setStep(STEP.RESULT);

      // Notify other components that the balance changed
      // Re-fetch wallet to get updated balance
      try {
        const updatedWallet = await walletService.getMyWallet();
        setWallet(updatedWallet);
        window.dispatchEvent(
          new CustomEvent('walletledger_balance_updated', { detail: updatedWallet })
        );
      } catch {
        // Non-critical
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Transfer failed. Please try again.');
      // Stay on review step so user can retry or go back
    } finally {
      setLoading(false);
    }
  };

  // ── Reset for new transfer ─────────────────────────────────────────────
  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setDescription('');
    setError('');
    setValidationErrors({});
    setResult(null);
    setIdempotencyKey(generateIdempotencyKey());
    setStep(STEP.FORM);
    fetchWallet();
  };

  // ── Go back to form from review ────────────────────────────────────────
  const goBackToForm = () => {
    setError('');
    setStep(STEP.FORM);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RESULT STEP
  // ═══════════════════════════════════════════════════════════════════════
  if (step === STEP.RESULT && result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          {/* Success header */}
          <div className="bg-gradient-to-br from-[#16A34A] to-[#15803D] px-6 py-8 text-center text-white">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Transfer Successful</h2>
            <p className="text-sm text-white/80 mt-1">
              ₹{fmt(result.amount)} sent to {result.to_wallet_number}
            </p>
          </div>

          {/* Details */}
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Transaction ID</span>
              <span className="font-mono text-[#0F172A] font-medium">#{result.transaction_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Reference</span>
              <span className="font-mono text-[#0F172A] text-xs">{result.reference_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">From</span>
              <span className="font-mono text-[#0F172A]">{result.from_wallet_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">To</span>
              <span className="font-mono text-[#0F172A]">{result.to_wallet_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Amount</span>
              <span className="font-bold text-[#0F172A]">₹{fmt(result.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Currency</span>
              <span className="text-[#0F172A]">{result.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Status</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                result.status === 'COMPLETED'
                  ? 'bg-green-100 text-[#16A34A]'
                  : 'bg-yellow-100 text-[#CA8A04]'
              }`}>
                {result.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                {result.status === 'PENDING' && <Clock className="w-3 h-3" />}
                {result.status}
              </span>
            </div>
            {result.description && (
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Description</span>
                <span className="text-[#0F172A]">{result.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Date</span>
              <span className="text-[#0F172A]">
                {new Date(result.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Updated balance */}
          {wallet && (
            <div className="mx-6 mb-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-xs text-[#64748B]">Updated Available Balance</span>
              <p className="text-lg font-bold text-[#0F172A]">₹{fmt(wallet.available_balance)}</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              New Transfer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REVIEW STEP
  // ═══════════════════════════════════════════════════════════════════════
  if (step === STEP.REVIEW) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <button
              onClick={goBackToForm}
              disabled={loading}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-semibold text-[#0F172A] text-lg">Review Transfer</h2>
              <p className="text-xs text-[#64748B]">Please confirm the details below</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Summary card */}
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#2563EB]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Recipient</p>
                  <p className="text-sm font-semibold text-[#0F172A] font-mono">{recipient.trim()}</p>
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0]" />

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-[#16A34A]">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Amount</p>
                  <p className="text-lg font-bold text-[#0F172A]">₹{fmt(amount)}</p>
                </div>
              </div>

              {description.trim() && (
                <>
                  <div className="h-px bg-[#E2E8F0]" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#64748B]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Description</p>
                      <p className="text-sm text-[#0F172A]">{description.trim()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Idempotency notice */}
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <Shield className="w-3 h-3" />
              <span>Protected by idempotency key — safe against duplicate submissions</span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Transfer…</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm & Send ₹{fmt(amount)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FORM STEP
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Transfer Funds</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Send money to another WalletLedger user by wallet number or email.
        </p>
      </div>

      {/* Available balance context */}
      {wallet && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A]">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Available Balance</p>
              <p className="text-lg font-bold text-[#0F172A]">₹{fmt(wallet.available_balance)}</p>
            </div>
          </div>
          <button
            onClick={fetchWallet}
            disabled={walletLoading}
            className="p-2 rounded-lg text-[#64748B] hover:bg-[#F8FAFC] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Frozen wallet warning */}
      {wallet?.status === 'FROZEN' && (
        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-sm text-[#CA8A04] font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Your wallet is frozen. Transfers are disabled.
        </div>
      )}

      {/* Transfer form */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#2563EB]">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0F172A] text-lg">Send Funds</h3>
            <p className="text-xs text-[#64748B]">
              Transfer to a wallet number (e.g. WLT-0001) or email
            </p>
          </div>
        </div>

        <form onSubmit={handleReview} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Recipient
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  if (validationErrors.recipient) setValidationErrors((v) => ({ ...v, recipient: '' }));
                }}
                placeholder="WLT-0001 or user@example.com"
                className={`w-full h-12 pl-10 pr-4 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition ${
                  validationErrors.recipient ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0]'
                }`}
                required
                disabled={wallet?.status === 'FROZEN'}
              />
            </div>
            {validationErrors.recipient && (
              <p className="mt-1 text-xs text-[#DC2626]">{validationErrors.recipient}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#64748B]">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (validationErrors.amount) setValidationErrors((v) => ({ ...v, amount: '' }));
                }}
                placeholder="0.00"
                className={`w-full h-12 pl-9 pr-4 rounded-xl border text-lg font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition ${
                  validationErrors.amount ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0]'
                }`}
                required
                disabled={wallet?.status === 'FROZEN'}
              />
            </div>
            {validationErrors.amount && (
              <p className="mt-1 text-xs text-[#DC2626]">{validationErrors.amount}</p>
            )}
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
              {[500, 1000, 5000, 10000].map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => {
                    setAmount(String(q));
                    if (validationErrors.amount) setValidationErrors((v) => ({ ...v, amount: '' }));
                  }}
                  disabled={wallet?.status === 'FROZEN'}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-blue-50 hover:border-blue-200 transition disabled:opacity-50"
                >
                  ₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Description <span className="text-[#94A3B8] normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              placeholder="e.g. Lunch split, Rent payment"
              className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
              disabled={wallet?.status === 'FROZEN'}
            />
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={wallet?.status === 'FROZEN'}
              className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Review Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
