import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService, transactionService } from '../services/api';
import {
  Wallet as WalletIcon,
  TrendingUp,
  Lock,
  IndianRupee,
  Hash,
  Calendar,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusColor = {
  COMPLETED: 'text-[#16A34A] bg-green-50 border-green-200',
  PENDING: 'text-[#CA8A04] bg-yellow-50 border-yellow-200',
  FAILED: 'text-[#DC2626] bg-red-50 border-red-200',
  REVERSED: 'text-[#64748B] bg-slate-50 border-slate-200',
};

const typeLabel = {
  DEPOSIT: { label: 'Deposit', icon: ArrowDownRight, cls: 'text-[#16A34A]' },
  TRANSFER: { label: 'Transfer', icon: ArrowUpRight, cls: 'text-[#2563EB]' },
  HOLD_CAPTURE: { label: 'Hold Capture', icon: Lock, cls: 'text-[#CA8A04]' },
  HOLD_RELEASE: { label: 'Hold Release', icon: Lock, cls: 'text-[#8B5CF6]' },
};

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState('');
  const pageSize = 10;

  // ── Fetch wallet ────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch transactions (paginated) ──────────────────────────────────────
  const fetchTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    setTxError('');
    try {
      const data = await transactionService.listTransactions({ page, page_size: pageSize });
      setTransactions(data.items || []);
      setTxTotal(data.total || 0);
      setTxPage(data.page || page);
    } catch (err) {
      setTxError(err.friendlyMessage || 'Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
  }, [fetchWallet, fetchTransactions]);

  // Listen for balance updates from DepositModal
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setWallet(e.detail);
      fetchTransactions(1);
    };
    window.addEventListener('walletledger_balance_updated', handleUpdate);
    return () => window.removeEventListener('walletledger_balance_updated', handleUpdate);
  }, [fetchTransactions]);

  const copyWalletNumber = () => {
    if (wallet?.wallet_number) {
      navigator.clipboard.writeText(wallet.wallet_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const totalPages = Math.ceil(txTotal / pageSize);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading && !wallet) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-[#E2E8F0] rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse">
              <div className="h-3 bg-[#E2E8F0] rounded w-20 mb-4" />
              <div className="h-8 bg-[#E2E8F0] rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-[#DC2626] mb-4" />
        <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Unable to load wallet</h2>
        <p className="text-sm text-[#64748B] mb-4">{error}</p>
        <button
          onClick={fetchWallet}
          className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">My Wallet</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage your wallet, view balances and transaction history.
          </p>
        </div>
        <button
          onClick={() => { fetchWallet(); fetchTransactions(1); }}
          disabled={loading}
          className="flex items-center gap-1.5 self-start px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Frozen banner */}
      {wallet.status === 'FROZEN' && (
        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-sm text-[#CA8A04] font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Your wallet is currently frozen. Transactions are disabled.
        </div>
      )}

      {/* ── Wallet Detail Card ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F3A] to-[#1E3A5F] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
              <WalletIcon className="w-4 h-4" />
              Total Balance
            </div>
            <p className="text-3xl sm:text-4xl font-bold">₹{fmt(wallet.balance)}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                wallet.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-yellow-500/20 text-yellow-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                wallet.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              {wallet.status}
            </span>
          </div>
        </div>

        {/* Wallet metadata */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-white/40 uppercase tracking-wider block mb-1">Wallet Number</span>
            <button
              onClick={copyWalletNumber}
              className="flex items-center gap-1 text-white/80 hover:text-white transition"
            >
              <span className="font-mono">{wallet.wallet_number}</span>
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div>
            <span className="text-white/40 uppercase tracking-wider block mb-1">Currency</span>
            <span className="text-white/80 font-semibold">{wallet.currency}</span>
          </div>
          <div>
            <span className="text-white/40 uppercase tracking-wider block mb-1">Wallet ID</span>
            <span className="text-white/80 font-mono">{wallet.id}</span>
          </div>
          <div>
            <span className="text-white/40 uppercase tracking-wider block mb-1">Created</span>
            <span className="text-white/80">
              {new Date(wallet.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Balance Breakdown ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <IndianRupee className="w-4 h-4 text-[#0F172A]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Balance</span>
          </div>
          <p className="text-xl font-bold text-[#0F172A]">₹{fmt(wallet.balance)}</p>
          <p className="text-[11px] text-[#94A3B8] mt-1">Sum of available + held</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Available</span>
          </div>
          <p className="text-xl font-bold text-[#16A34A]">₹{fmt(wallet.available_balance)}</p>
          <p className="text-[11px] text-[#94A3B8] mt-1">Ready to spend or transfer</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <Lock className="w-4 h-4 text-[#CA8A04]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Held</span>
          </div>
          <p className="text-xl font-bold text-[#CA8A04]">₹{fmt(wallet.held_balance)}</p>
          <p className="text-[11px] text-[#94A3B8] mt-1">Locked by active holds</p>
        </div>
      </div>

      {/* ── Transaction History ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="font-semibold text-[#0F172A]">Transaction History</h2>
          {txTotal > 0 && (
            <span className="text-xs text-[#94A3B8]">
              {txTotal} total transaction{txTotal !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {txError && (
          <div className="px-6 py-3 text-sm text-[#DC2626] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{txError}</span>
            <button onClick={() => fetchTransactions(txPage)} className="ml-auto text-xs font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {txLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[#64748B]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading transactions…</span>
          </div>
        ) : transactions.length === 0 && !txError ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#94A3B8]">
            <Clock className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs mt-1">Deposit funds to see your first transaction.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#F1F5F9]">
              {transactions.map((tx) => {
                const info = typeLabel[tx.type] || { label: tx.type, icon: Clock, cls: 'text-[#64748B]' };
                const TxIcon = info.icon;
                const stColor = statusColor[tx.status] || statusColor.PENDING;
                const isCredit =
                  tx.type === 'DEPOSIT' ||
                  (tx.type === 'TRANSFER' && tx.to_wallet_id && wallet && tx.to_wallet_id === wallet.id) ||
                  tx.type === 'HOLD_RELEASE';

                return (
                  <button
                    key={tx.id}
                    onClick={() => navigate(`/transactions?id=${tx.id}`)}
                    className="w-full px-6 py-3.5 flex items-center gap-4 hover:bg-[#F8FAFC] transition text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <TxIcon className={`w-4 h-4 ${info.cls}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {tx.description || info.label}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {tx.reference_id && ` · ${tx.reference_id.slice(0, 16)}…`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                        {isCredit ? '+' : '−'}₹{fmt(tx.amount)}
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stColor}`}>
                        {tx.status === 'COMPLETED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {tx.status === 'FAILED' && <XCircle className="w-2.5 h-2.5" />}
                        {tx.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                        {tx.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  onClick={() => fetchTransactions(txPage - 1)}
                  disabled={txPage <= 1 || txLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                <span className="text-xs text-[#94A3B8]">
                  Page {txPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchTransactions(txPage + 1)}
                  disabled={txPage >= totalPages || txLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
