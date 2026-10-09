import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { walletService, transactionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  TrendingUp,
  Lock,
  IndianRupee,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  Loader2,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
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

// ─── Component ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState('');

  // ── Fetch wallet ────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError('');
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch (err) {
      setWalletError(err.friendlyMessage || 'Failed to load wallet');
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // ── Fetch recent transactions ───────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError('');
    try {
      const data = await transactionService.listTransactions({ page: 1, page_size: 5 });
      setTransactions(data.items || []);
    } catch (err) {
      setTxError(err.friendlyMessage || 'Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  // ── Listen for balance updates from DepositModal (via Layout) ───────────
  useEffect(() => {
    const handleBalanceUpdate = (e) => {
      if (e.detail) {
        // Optimistic: use the wallet data from the deposit response
        setWallet(e.detail);
      }
      // Also re-fetch transactions so the new deposit shows up
      fetchTransactions();
    };

    window.addEventListener('walletledger_balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('walletledger_balance_updated', handleBalanceUpdate);
  }, [fetchTransactions]);

  // ── Refresh all ─────────────────────────────────────────────────────────
  const refreshAll = () => {
    fetchWallet();
    fetchTransactions();
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Here's an overview of your wallet and recent activity.
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={walletLoading}
          className="flex items-center gap-1.5 self-start px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${walletLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Wallet Cards ─────────────────────────────────────────────────── */}
      {walletError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{walletError}</span>
          <button onClick={fetchWallet} className="ml-auto text-xs font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {walletLoading && !wallet ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse">
              <div className="h-3 bg-[#E2E8F0] rounded w-24 mb-3" />
              <div className="h-7 bg-[#E2E8F0] rounded w-32" />
            </div>
          ))}
        </div>
      ) : wallet ? (
        <>
          {/* Status banner if wallet is frozen */}
          {wallet.status === 'FROZEN' && (
            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-sm text-[#CA8A04] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Your wallet is currently frozen. Contact support for assistance.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-[#0B1F3A] to-[#1E3A5F] rounded-2xl p-5 text-white shadow-lg col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3 text-white/70">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Balance</span>
              </div>
              <p className="text-2xl font-bold">₹{fmt(wallet.balance)}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                <Hash className="w-3 h-3" />
                <span>{wallet.wallet_number}</span>
                <span className="mx-1">·</span>
                <span>{wallet.currency}</span>
              </div>
            </div>

            {/* Available Balance */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
              <div className="flex items-center gap-2 mb-3 text-[#64748B]">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Available</span>
              </div>
              <p className="text-2xl font-bold text-[#16A34A]">₹{fmt(wallet.available_balance)}</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Spendable right now</p>
            </div>

            {/* Held Balance */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
              <div className="flex items-center gap-2 mb-3 text-[#64748B]">
                <Lock className="w-4 h-4 text-[#CA8A04]" />
                <span className="text-xs font-semibold uppercase tracking-wider">On Hold</span>
              </div>
              <p className="text-2xl font-bold text-[#CA8A04]">₹{fmt(wallet.held_balance)}</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Reserved by active holds</p>
            </div>

            {/* Wallet Status */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
              <div className="flex items-center gap-2 mb-3 text-[#64748B]">
                <IndianRupee className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    wallet.status === 'ACTIVE'
                      ? 'bg-green-100 text-[#16A34A]'
                      : 'bg-yellow-100 text-[#CA8A04]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    wallet.status === 'ACTIVE' ? 'bg-[#16A34A]' : 'bg-[#CA8A04]'
                  }`} />
                  {wallet.status}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2">Wallet ID: {wallet.id}</p>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Recent Transactions ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="font-semibold text-[#0F172A]">Recent Transactions</h2>
          {transactions.length > 0 && (
            <Link
              to="/transactions"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              View all →
            </Link>
          )}
        </div>

        {txError && (
          <div className="px-6 py-4 text-sm text-[#DC2626] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{txError}</span>
            <button onClick={fetchTransactions} className="ml-auto text-xs font-semibold underline">
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
            <p className="text-xs mt-1">Use the "Add Money" button to make your first deposit.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {transactions.map((tx) => {
              const info = typeLabel[tx.type] || {
                label: tx.type,
                icon: Clock,
                cls: 'text-[#64748B]',
              };
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
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-green-50' : 'bg-blue-50'
                    }`}
                  >
                    <TxIcon className={`w-4 h-4 ${info.cls}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {tx.description || info.label}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {tx.reference_id && ` · ${tx.reference_id.slice(0, 12)}…`}
                    </p>
                  </div>

                  {/* Amount + Status */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                      {isCredit ? '+' : '−'}₹{fmt(tx.amount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stColor}`}
                    >
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
        )}
      </div>
    </div>
  );
}
