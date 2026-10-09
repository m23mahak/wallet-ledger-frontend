import { useState, useEffect, useCallback, useMemo } from 'react';
import { holdService, walletService } from '../services/api';
import {
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  X,
  Copy,
  Check,
  Search,
  IndianRupee,
  Calendar,
  Hash,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso) => {
  if (!iso) return 'None';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All Holds' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'CAPTURED', label: 'Captured' },
  { key: 'RELEASED', label: 'Released' },
  { key: 'EXPIRED', label: 'Expired' },
];

const statusConfig = {
  ACTIVE: {
    cls: 'text-[#CA8A04] bg-yellow-50 border-yellow-200',
    icon: Lock,
    label: 'Active',
    desc: 'Funds reserved from available balance',
  },
  CAPTURED: {
    cls: 'text-[#2563EB] bg-blue-50 border-blue-200',
    icon: ShieldCheck,
    label: 'Captured',
    desc: 'Settled permanently into escrow',
  },
  RELEASED: {
    cls: 'text-[#16A34A] bg-green-50 border-green-200',
    icon: Unlock,
    label: 'Released',
    desc: 'Funds returned to available balance',
  },
  EXPIRED: {
    cls: 'text-[#64748B] bg-slate-50 border-slate-200',
    icon: Clock,
    label: 'Expired',
    desc: 'Hold reached expiry time',
  },
};

export default function Holds() {
  // Wallet context
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Holds list state
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [selectedHold, setSelectedHold] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Action states (Capture / Release)
  const [actionConfirm, setActionConfirm] = useState(null); // { type: 'capture' | 'release', hold }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Create form state
  const [createAmount, setCreateAmount] = useState('');
  const [createReason, setCreateReason] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── Fetch wallet for balance details ───────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch {
      // Handled silently
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // ── Fetch holds from backend ───────────────────────────────────────────────
  const fetchHolds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Backend supports filtering by status or omitting to get all holds
      const statusParam = activeTab === 'ALL' ? null : activeTab;
      const data = await holdService.listHolds(statusParam);
      setHolds(data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load holds');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchHolds();
  }, [fetchHolds]);

  // Keep selected hold updated when holds list changes
  useEffect(() => {
    if (selectedHold) {
      const updated = holds.find((h) => h.id === selectedHold.id);
      if (updated) setSelectedHold(updated);
    }
  }, [holds, selectedHold]);

  // ── Filtered & Searched Holds ──────────────────────────────────────────────
  const displayedHolds = useMemo(() => {
    if (!searchQuery.trim()) return holds;
    const q = searchQuery.toLowerCase().trim();
    return holds.filter(
      (h) =>
        h.hold_reference.toLowerCase().includes(q) ||
        (h.reason && h.reason.toLowerCase().includes(q))
    );
  }, [holds, searchQuery]);

  // ── Copy to clipboard helper ───────────────────────────────────────────────
  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // ── Create Hold Handler ────────────────────────────────────────────────────
  const handleCreateHold = async (e) => {
    e.preventDefault();
    setCreateError('');

    const parsedAmount = Number(createAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setCreateError('Please enter a valid amount greater than 0');
      return;
    }

    if (wallet && parsedAmount > wallet.available_balance) {
      setCreateError(
        `Amount ₹${fmt(parsedAmount)} exceeds available balance of ₹${fmt(wallet.available_balance)}`
      );
      return;
    }

    if (!createReason.trim() || createReason.trim().length < 2) {
      setCreateError('Reason must be at least 2 characters long');
      return;
    }

    setCreateLoading(true);
    try {
      const newHold = await holdService.createHold(parsedAmount, createReason.trim());

      // Update state with actual backend response
      setHolds((prev) => [newHold, ...prev]);
      setSuccessMessage(`Hold ${newHold.hold_reference} created for ₹${fmt(newHold.amount)}`);
      setTimeout(() => setSuccessMessage(''), 4000);

      // Reset form & close modal
      setCreateAmount('');
      setCreateReason('');
      setIsCreateOpen(false);

      // Refresh wallet & broadcast balance change
      const updatedWallet = await walletService.getMyWallet();
      setWallet(updatedWallet);
      window.dispatchEvent(
        new CustomEvent('walletledger_balance_updated', { detail: updatedWallet })
      );
    } catch (err) {
      setCreateError(err.friendlyMessage || 'Failed to create hold');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Capture Hold Handler ───────────────────────────────────────────────────
  const handleCaptureHold = async (hold) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updatedHold = await holdService.captureHold(hold.id);

      // Update local state with real backend object
      setHolds((prev) => prev.map((h) => (h.id === updatedHold.id ? updatedHold : h)));
      if (selectedHold && selectedHold.id === updatedHold.id) {
        setSelectedHold(updatedHold);
      }

      setSuccessMessage(
        `Hold ${updatedHold.hold_reference} captured successfully. Funds settled.`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      setActionConfirm(null);

      // Refresh wallet & broadcast balance change
      const updatedWallet = await walletService.getMyWallet();
      setWallet(updatedWallet);
      window.dispatchEvent(
        new CustomEvent('walletledger_balance_updated', { detail: updatedWallet })
      );
    } catch (err) {
      setActionError(err.friendlyMessage || 'Failed to capture hold');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Release Hold Handler ───────────────────────────────────────────────────
  const handleReleaseHold = async (hold) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updatedHold = await holdService.releaseHold(hold.id);

      // Update local state with real backend object
      setHolds((prev) => prev.map((h) => (h.id === updatedHold.id ? updatedHold : h)));
      if (selectedHold && selectedHold.id === updatedHold.id) {
        setSelectedHold(updatedHold);
      }

      setSuccessMessage(
        `Hold ${updatedHold.hold_reference} released. Funds restored to available balance.`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      setActionConfirm(null);

      // Refresh wallet & broadcast balance change
      const updatedWallet = await walletService.getMyWallet();
      setWallet(updatedWallet);
      window.dispatchEvent(
        new CustomEvent('walletledger_balance_updated', { detail: updatedWallet })
      );
    } catch (err) {
      setActionError(err.friendlyMessage || 'Failed to release hold');
    } finally {
      setActionLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Fund Holds & Escrow</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Reserve funds for merchant pre-authorizations and escrow, or capture/release active reservations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchWallet();
              fetchHolds();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setCreateError('');
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Hold
          </button>
        </div>
      </div>

      {/* ── Balance Summary Cards ─────────────────────────────────────────── */}
      {wallet && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Held Balance</span>
              <Lock className="w-4 h-4 text-[#CA8A04]" />
            </div>
            <p className="text-2xl font-bold text-[#CA8A04]">₹{fmt(wallet.held_balance)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">Currently locked by active holds</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Balance</span>
              <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            </div>
            <p className="text-2xl font-bold text-[#16A34A]">₹{fmt(wallet.available_balance)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">Ready to reserve or transfer</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Balance</span>
              <IndianRupee className="w-4 h-4 text-[#0F172A]" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">₹{fmt(wallet.balance)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">Available + Held balance</p>
          </div>
        </div>
      )}

      {/* ── Success Toast Banner ─────────────────────────────────────────── */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-[#16A34A] flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#DC2626] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={fetchHolds} className="text-xs font-semibold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Status Tabs & Search Bar ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] self-start">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or reason…"
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Holds List / Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {/* Table summary header */}
        <div className="px-6 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            <span>
              {displayedHolds.length > 0
                ? `${displayedHolds.length} hold${displayedHolds.length !== 1 ? 's' : ''}`
                : 'Holds'}
            </span>
          </div>
          <span className="text-xs text-[#94A3B8]">
            {activeTab === 'ALL' ? 'All records' : `Filtered: ${activeTab}`}
          </span>
        </div>

        {/* Loading skeleton */}
        {loading && holds.length === 0 ? (
          <div className="divide-y divide-[#F1F5F9]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-20 ml-auto" />
                  <div className="h-3 bg-slate-100 rounded w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedHolds.length === 0 && !error ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
            <Lock className="w-12 h-12 mb-3 text-[#CBD5E1]" />
            <p className="text-sm font-semibold text-[#475569]">No holds found</p>
            <p className="text-xs mt-1 text-[#94A3B8]">
              {searchQuery
                ? 'No holds match your search query.'
                : activeTab === 'ALL'
                ? 'You have not created any fund holds yet.'
                : `No holds found with status "${activeTab}".`}
            </p>
            {activeTab === 'ALL' && !searchQuery ? (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition"
              >
                Create Your First Hold
              </button>
            ) : null}
          </div>
        ) : (
          /* Holds Rows */
          <div className={`divide-y divide-[#F1F5F9] ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {displayedHolds.map((hold) => {
              const cfg = statusConfig[hold.status] || statusConfig.ACTIVE;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={hold.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition"
                >
                  {/* Left: Info */}
                  <div
                    onClick={() => setSelectedHold(hold)}
                    className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                      <StatusIcon className="w-5 h-5 text-[#CA8A04]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#0F172A] truncate">
                          {hold.reason}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.cls}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                        <span className="font-mono">{hold.hold_reference}</span>
                        <span>·</span>
                        <span>{formatDate(hold.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-[#0F172A]">₹{fmt(hold.amount)}</p>
                      <p className="text-[10px] text-[#94A3B8] uppercase">{hold.currency || 'INR'}</p>
                    </div>

                    {/* Action buttons (only for ACTIVE holds) */}
                    {hold.status === 'ACTIVE' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActionError('');
                            setActionConfirm({ type: 'capture', hold });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition"
                          title="Capture and permanently settle hold"
                        >
                          Capture
                        </button>
                        <button
                          onClick={() => {
                            setActionError('');
                            setActionConfirm({ type: 'release', hold });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#DC2626] hover:bg-red-50 hover:border-red-200 transition"
                          title="Release funds back into available balance"
                        >
                          Release
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedHold(hold)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CREATE HOLD MODAL                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !createLoading && setIsCreateOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-[#CA8A04]">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-[#0F172A] text-lg">Create Fund Hold</h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                disabled={createLoading}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHold} className="mt-4 space-y-4">
              {/* Available balance indicator */}
              {wallet && (
                <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Available to Reserve:</span>
                  <span className="font-bold text-[#16A34A]">₹{fmt(wallet.available_balance)}</span>
                </div>
              )}

              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Amount to Reserve (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={wallet ? wallet.available_balance : undefined}
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={createLoading}
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Reason for Hold
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={createReason}
                  onChange={(e) => setCreateReason(e.target.value)}
                  placeholder="e.g. Hotel Escrow, Rental Pre-Auth"
                  disabled={createLoading}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                  required
                />
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Reserves funds temporarily without deducting your total balance.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition disabled:opacity-50"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Reserving…
                    </>
                  ) : (
                    'Confirm Hold'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOLD DETAILS SLIDE-OVER DRAWER                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedHold && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedHold(null)}
          />

          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0F172A] text-lg">Hold Details</h2>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">{selectedHold.hold_reference}</p>
              </div>
              <button
                onClick={() => setSelectedHold(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Hero Banner */}
              {(() => {
                const cfg = statusConfig[selectedHold.status] || statusConfig.ACTIVE;
                const StatusIcon = cfg.icon;

                return (
                  <div className="text-center py-5 px-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <StatusIcon className="w-6 h-6 text-[#CA8A04]" />
                    </div>
                    <p className="text-3xl font-extrabold text-[#0F172A]">
                      ₹{fmt(selectedHold.amount)}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1 font-medium">{selectedHold.currency || 'INR'}</p>
                    <div className="mt-2.5 flex items-center justify-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${cfg.cls}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Status Explanation Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
                {selectedHold.status === 'ACTIVE' && (
                  <p>
                    <strong className="text-[#0F172A]">Active Reservation:</strong> This ₹{fmt(selectedHold.amount)} is
                    currently reserved. You can capture it (settling payment) or release it back to available funds.
                  </p>
                )}
                {selectedHold.status === 'CAPTURED' && (
                  <p>
                    <strong className="text-[#0F172A]">Captured & Settled:</strong> This hold was finalized and ₹
                    {fmt(selectedHold.amount)} has been permanently deducted from your wallet balance.
                  </p>
                )}
                {selectedHold.status === 'RELEASED' && (
                  <p>
                    <strong className="text-[#0F172A]">Released:</strong> The reservation was cancelled and ₹
                    {fmt(selectedHold.amount)} was restored into your available balance.
                  </p>
                )}
                {selectedHold.status === 'EXPIRED' && (
                  <p>
                    <strong className="text-[#0F172A]">Expired:</strong> This hold reached its designated expiry timestamp.
                  </p>
                )}
              </div>

              {/* Metadata list */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#2563EB]" /> Information
                </h3>

                <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] text-xs">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[#64748B]">Hold Reference</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-[#0F172A]">{selectedHold.hold_reference}</span>
                      <button
                        onClick={() => copyToClipboard(selectedHold.hold_reference, 'ref')}
                        className="p-1 hover:text-[#2563EB]"
                      >
                        {copiedKey === 'ref' ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[#64748B]">Hold ID</span>
                    <span className="font-mono text-[#0F172A]">#{selectedHold.id}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[#64748B]">Reason</span>
                    <span className="font-medium text-[#0F172A] text-right">{selectedHold.reason}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[#64748B]">Wallet ID</span>
                    <span className="font-mono text-[#0F172A]">{selectedHold.wallet_id}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[#64748B]">Created At</span>
                    <span className="text-[#0F172A]">{formatDate(selectedHold.created_at)}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[#64748B]">Last Updated</span>
                    <span className="text-[#0F172A]">{formatDate(selectedHold.updated_at)}</span>
                  </div>

                  {selectedHold.expires_at && (
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-[#64748B]">Expires At</span>
                      <span className="text-[#0F172A]">{formatDate(selectedHold.expires_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Only for ACTIVE status) */}
              {selectedHold.status === 'ACTIVE' && (
                <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
                  <button
                    onClick={() => {
                      setActionError('');
                      setActionConfirm({ type: 'capture', hold: selectedHold });
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" /> Capture Hold (Settle ₹{fmt(selectedHold.amount)})
                  </button>

                  <button
                    onClick={() => {
                      setActionError('');
                      setActionConfirm({ type: 'release', hold: selectedHold });
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#DC2626] hover:bg-red-50 hover:border-red-200 transition flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4" /> Release Hold (Refund to Available)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ACTION CONFIRMATION MODAL (CAPTURE / RELEASE)                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {actionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setActionConfirm(null)}
          />

          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                  actionConfirm.type === 'capture' ? 'bg-blue-50 text-[#2563EB]' : 'bg-red-50 text-[#DC2626]'
                }`}
              >
                {actionConfirm.type === 'capture' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <Unlock className="w-6 h-6" />
                )}
              </div>

              <h3 className="font-bold text-base text-[#0F172A]">
                {actionConfirm.type === 'capture' ? 'Capture Hold' : 'Release Hold'}
              </h3>

              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                {actionConfirm.type === 'capture' ? (
                  <>
                    Are you sure you want to capture hold{' '}
                    <strong className="text-[#0F172A] font-mono">{actionConfirm.hold.hold_reference}</strong>?
                    This will permanently settle ₹{fmt(actionConfirm.hold.amount)} from your account into escrow.
                  </>
                ) : (
                  <>
                    Are you sure you want to release hold{' '}
                    <strong className="text-[#0F172A] font-mono">{actionConfirm.hold.hold_reference}</strong>?
                    This will release ₹{fmt(actionConfirm.hold.amount)} back into your available balance.
                  </>
                )}
              </p>

              {actionError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] text-left">
                  {actionError}
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionConfirm(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    if (actionConfirm.type === 'capture') {
                      handleCaptureHold(actionConfirm.hold);
                    } else {
                      handleReleaseHold(actionConfirm.hold);
                    }
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 ${
                    actionConfirm.type === 'capture'
                      ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                      : 'bg-[#DC2626] hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing…
                    </>
                  ) : actionConfirm.type === 'capture' ? (
                    'Confirm Capture'
                  ) : (
                    'Confirm Release'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
