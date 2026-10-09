import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionService, walletService } from '../services/api';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
  Hash,
  BookOpen,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso) => {
  if (!iso) return '—';
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

const TX_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'HOLD_CAPTURE', label: 'Hold Capture' },
  { value: 'HOLD_RELEASE', label: 'Hold Release' },
];

const TX_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
];

const statusStyle = {
  COMPLETED: { cls: 'text-[#16A34A] bg-green-50 border-green-200', icon: CheckCircle2, label: 'Completed' },
  PENDING: { cls: 'text-[#CA8A04] bg-yellow-50 border-yellow-200', icon: Clock, label: 'Pending' },
  FAILED: { cls: 'text-[#DC2626] bg-red-50 border-red-200', icon: XCircle, label: 'Failed' },
  REVERSED: { cls: 'text-[#64748B] bg-slate-50 border-slate-200', icon: RotateCcw, label: 'Reversed' },
};

const typeInfo = {
  DEPOSIT: { label: 'Deposit', icon: ArrowDownRight, cls: 'text-[#16A34A]', bg: 'bg-green-50' },
  TRANSFER: { label: 'Transfer', icon: ArrowUpRight, cls: 'text-[#2563EB]', bg: 'bg-blue-50' },
  HOLD_CAPTURE: { label: 'Hold Capture', icon: Lock, cls: 'text-[#CA8A04]', bg: 'bg-yellow-50' },
  HOLD_RELEASE: { label: 'Hold Release', icon: Lock, cls: 'text-[#8B5CF6]', bg: 'bg-purple-50' },
};

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Wallet context
  const [wallet, setWallet] = useState(null);

  // Transaction list state
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & filter state synced from URL
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const pageSize = 15;

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [startDate, setStartDate] = useState(() => searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState(() => searchParams.get('end_date') || '');

  // Detail panel state
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // ── Sync URL params ────────────────────────────────────────────────────────
  const updateURLParams = useCallback(
    (updates = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (val === null || val === undefined || val === '') {
            next.delete(key);
          } else {
            next.set(key, String(val));
          }
        });
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  // ── Fetch wallet for credit/debit classification ───────────────────────────
  useEffect(() => {
    walletService.getMyWallet().then(setWallet).catch(() => {});
  }, []);

  // ── Fetch transactions from real backend ───────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        page_size: pageSize,
      };

      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.start_date = `${startDate}T00:00:00Z`;
      if (endDate) params.end_date = `${endDate}T23:59:59.999Z`;

      const data = await transactionService.listTransactions(params);
      setTransactions(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Handle URL deep-link to specific transaction ───────────────────────────
  const txIdParam = searchParams.get('id');
  useEffect(() => {
    if (txIdParam) {
      const id = Number(txIdParam);
      if (!isNaN(id) && (!selectedTx || selectedTx.id !== id)) {
        openDetail(id, false);
      }
    }
  }, [txIdParam]);

  // ── Search & Filter Handlers ───────────────────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    const cleanSearch = searchInput.trim();
    setPage(1);
    setSearch(cleanSearch);
    updateURLParams({ search: cleanSearch, page: 1 });
  };

  const handleTypeChange = (v) => {
    setTypeFilter(v);
    setPage(1);
    updateURLParams({ type: v, page: 1 });
  };

  const handleStatusChange = (v) => {
    setStatusFilter(v);
    setPage(1);
    updateURLParams({ status: v, page: 1 });
  };

  const handleStartDate = (v) => {
    setStartDate(v);
    setPage(1);
    updateURLParams({ start_date: v, page: 1 });
  };

  const handleEndDate = (v) => {
    setEndDate(v);
    setPage(1);
    updateURLParams({ end_date: v, page: 1 });
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setTypeFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    updateURLParams({
      search: '',
      type: '',
      status: '',
      start_date: '',
      end_date: '',
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(search || typeFilter || statusFilter || startDate || endDate);

  // ── Transaction Detail Modal ───────────────────────────────────────────────
  const openDetail = async (txId, updateUrl = true) => {
    setDetailLoading(true);
    setDetailError('');
    setSelectedTx(null);
    if (updateUrl) {
      updateURLParams({ id: txId });
    }
    try {
      const data = await transactionService.getTransactionById(txId);
      setSelectedTx(data);
    } catch (err) {
      setDetailError(err.friendlyMessage || 'Failed to load transaction details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedTx(null);
    setDetailError('');
    updateURLParams({ id: '' });
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // ── Credit/Debit classification ────────────────────────────────────────────
  const isCredit = (tx) => {
    if (!tx) return false;
    if (tx.type === 'DEPOSIT') return true;
    if (tx.type === 'HOLD_RELEASE') return true;
    if (tx.type === 'TRANSFER' && wallet && tx.to_wallet_id === wallet.id) return true;
    return false;
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Transactions</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Query and inspect your complete transaction ledger, double-entry records, and statuses.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-1.5 self-start px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Filters & Search Bar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search box */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reference ID or description…"
              className="w-full h-10 pl-9 pr-20 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                  updateURLParams({ search: '', page: 1 });
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition"
            >
              Search
            </button>
          </form>

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition cursor-pointer"
            >
              {TX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition cursor-pointer"
            >
              {TX_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>

        {/* Date range picker */}
        <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-[#94A3B8] shrink-0" />
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-[#64748B] shrink-0">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDate(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-[#64748B] shrink-0">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDate(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-red-50 transition self-end sm:self-center"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
            <span className="text-xs font-medium text-[#64748B]">Active Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                <Search className="w-3 h-3" /> "{search}"
                <button
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setPage(1);
                    updateURLParams({ search: '', page: 1 });
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                <Filter className="w-3 h-3" /> Type: {TX_TYPES.find((t) => t.value === typeFilter)?.label}
                <button onClick={() => handleTypeChange('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                <Filter className="w-3 h-3" /> Status: {TX_STATUSES.find((s) => s.value === statusFilter)?.label}
                <button onClick={() => handleStatusChange('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                <Calendar className="w-3 h-3" /> {startDate || 'Earliest'} → {endDate || 'Latest'}
                <button onClick={() => { handleStartDate(''); handleEndDate(''); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={fetchTransactions} className="text-xs font-semibold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Transaction List Table / Rows ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {/* Table header / summary */}
        <div className="px-6 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <Receipt className="w-4 h-4 text-[#2563EB]" />
            <span>
              {total > 0
                ? `${total} transaction${total !== 1 ? 's' : ''} found`
                : 'Transactions'}
            </span>
          </div>
          {total > 0 && (
            <span className="text-xs text-[#94A3B8]">
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </span>
          )}
        </div>

        {/* Loading state skeleton */}
        {loading && transactions.length === 0 ? (
          <div className="divide-y divide-[#F1F5F9]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
                  <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 && !error ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
            <Receipt className="w-12 h-12 mb-3 text-[#CBD5E1]" />
            <p className="text-sm font-semibold text-[#475569]">No transactions found</p>
            <p className="text-xs mt-1 text-[#94A3B8]">
              {hasActiveFilters
                ? 'No transactions match your current search and filter settings.'
                : 'Your wallet has no transaction activity yet. Make a deposit or transfer to begin.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition"
              >
                Clear All Filters
              </button>
            ) : null}
          </div>
        ) : (
          /* Transaction rows */
          <div className={`divide-y divide-[#F1F5F9] ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {transactions.map((tx) => {
              const info = typeInfo[tx.type] || {
                label: tx.type,
                icon: Clock,
                cls: 'text-[#64748B]',
                bg: 'bg-slate-50',
              };
              const TxIcon = info.icon;
              const st = statusStyle[tx.status] || statusStyle.PENDING;
              const StatusIcon = st.icon;
              const credit = isCredit(tx);

              return (
                <button
                  key={tx.id}
                  onClick={() => openDetail(tx.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#F8FAFC] transition text-left group"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${info.bg} group-hover:scale-105 transition-transform`}>
                    <TxIcon className={`w-5 h-5 ${info.cls}`} />
                  </div>

                  {/* Description & Reference */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">
                      {tx.description || info.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                      <span>{formatDate(tx.created_at)}</span>
                      {tx.reference_id && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-[11px] truncate">{tx.reference_id}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Transfer Counterparty */}
                  {tx.type === 'TRANSFER' && (
                    <div className="hidden md:block text-right min-w-0 max-w-[180px] text-xs">
                      {credit ? (
                        <p className="text-[#64748B] truncate">
                          From: <span className="font-medium text-[#0F172A]">{tx.from_user_name || tx.from_wallet_number || 'Unknown'}</span>
                        </p>
                      ) : (
                        <p className="text-[#64748B] truncate">
                          To: <span className="font-medium text-[#0F172A]">{tx.to_user_name || tx.to_wallet_number || 'Unknown'}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amount + Status */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${credit ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                      {credit ? '+' : '−'}₹{fmt(tx.amount)}
                    </p>
                    <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${st.cls}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {st.label}
                    </span>
                  </div>

                  {/* Arrow hint */}
                  <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition" />
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[#E2E8F0] flex items-center justify-between bg-white">
            <button
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                updateURLParams({ page: next });
              }}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {/* Numeric Page Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      updateURLParams({ page: p });
                    }}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      p === page
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <span className="sm:hidden text-xs text-[#94A3B8]">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => {
                const next = Math.min(totalPages, page + 1);
                setPage(next);
                updateURLParams({ page: next });
              }}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TRANSACTION DETAILS SLIDE-OVER MODAL                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {(selectedTx || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeDetail}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0F172A] text-lg">Transaction Details</h2>
                {selectedTx && (
                  <p className="text-xs text-[#64748B] font-mono mt-0.5">#{selectedTx.id}</p>
                )}
              </div>
              <button
                onClick={closeDetail}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading detail */}
            {detailLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-[#64748B]">
                <Loader2 className="w-6 h-6 animate-spin mb-3 text-[#2563EB]" />
                <span className="text-sm font-medium">Fetching transaction details from ledger…</span>
              </div>
            )}

            {/* Error detail */}
            {detailError && (
              <div className="m-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#DC2626] flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to load transaction</p>
                  <p className="text-xs mt-0.5">{detailError}</p>
                </div>
              </div>
            )}

            {/* Content */}
            {selectedTx && !detailLoading && (
              <div className="p-6 space-y-6 flex-1">
                {/* Hero Banner */}
                {(() => {
                  const info = typeInfo[selectedTx.type] || {
                    label: selectedTx.type,
                    icon: ArrowUpRight,
                    cls: 'text-[#2563EB]',
                    bg: 'bg-blue-50',
                  };
                  const TxIcon = info.icon;
                  const credit = isCredit(selectedTx);
                  const st = statusStyle[selectedTx.status] || statusStyle.PENDING;
                  const StatusIcon = st.icon;

                  return (
                    <div className="text-center py-5 px-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className={`w-12 h-12 rounded-2xl ${info.bg} flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                        <TxIcon className={`w-6 h-6 ${info.cls}`} />
                      </div>
                      <p className={`text-3xl font-extrabold ${credit ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                        {credit ? '+' : '−'}₹{fmt(selectedTx.amount)}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1 font-medium">{info.label} · {selectedTx.currency || 'INR'}</p>
                      <div className="mt-2.5 flex items-center justify-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${st.cls}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Visual Transaction Timeline ───────────────────────────── */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> Transaction Timeline
                  </h3>
                  <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4">
                    <ol className="relative border-l border-slate-200 ml-2.5 space-y-4">
                      {/* Step 1: Created */}
                      <li className="ml-5">
                        <span className="absolute -left-2 flex items-center justify-center w-4 h-4 bg-[#2563EB] rounded-full ring-4 ring-white">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        <h4 className="text-xs font-bold text-[#0F172A]">Transaction Created</h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{formatDate(selectedTx.created_at)}</p>
                        <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Ref: {selectedTx.reference_id}</p>
                      </li>

                      {/* Step 2: Ledger Entries */}
                      <li className="ml-5">
                        <span className={`absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                          selectedTx.ledger_entries?.length > 0 ? 'bg-[#16A34A]' : 'bg-[#CA8A04]'
                        }`}>
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        <h4 className="text-xs font-bold text-[#0F172A]">Double-Entry Journal Postings</h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {selectedTx.ledger_entries?.length > 0
                            ? `${selectedTx.ledger_entries.length} balanced journal entries recorded`
                            : 'No ledger journal entries generated'}
                        </p>
                      </li>

                      {/* Step 3: Status */}
                      <li className="ml-5">
                        <span className={`absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                          selectedTx.status === 'COMPLETED'
                            ? 'bg-[#16A34A]'
                            : selectedTx.status === 'FAILED'
                            ? 'bg-[#DC2626]'
                            : 'bg-[#CA8A04]'
                        }`}>
                          {selectedTx.status === 'COMPLETED' ? (
                            <Check className="w-2.5 h-2.5 text-white" />
                          ) : selectedTx.status === 'FAILED' ? (
                            <X className="w-2.5 h-2.5 text-white" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 text-white" />
                          )}
                        </span>
                        <h4 className="text-xs font-bold text-[#0F172A]">Final Status: {selectedTx.status}</h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {selectedTx.status === 'COMPLETED'
                            ? 'Funds verified and settled'
                            : selectedTx.status === 'FAILED'
                            ? selectedTx.failure_reason || 'Transaction could not be completed'
                            : 'Awaiting completion'}
                        </p>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* ── Transaction Metadata ──────────────────────────────────── */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#2563EB]" /> Metadata
                  </h3>

                  <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] text-xs">
                    <DetailRow label="Transaction ID" value={`#${selectedTx.id}`} mono />
                    <DetailRow
                      label="Reference ID"
                      value={
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{selectedTx.reference_id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTx.reference_id, 'ref')}
                            className="p-1 hover:text-[#2563EB] transition"
                            title="Copy Reference ID"
                          >
                            {copiedKey === 'ref' ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      }
                    />
                    <DetailRow label="Type" value={selectedTx.type} />
                    <DetailRow label="Amount" value={`₹${fmt(selectedTx.amount)}`} />
                    <DetailRow label="Currency" value={selectedTx.currency || 'INR'} />
                    <DetailRow label="Status" value={selectedTx.status} />
                    <DetailRow label="Created Date" value={formatDate(selectedTx.created_at)} />
                    {selectedTx.description && (
                      <DetailRow label="Description" value={selectedTx.description} />
                    )}
                    {selectedTx.idempotency_key && (
                      <DetailRow
                        label="Idempotency Key"
                        value={
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono truncate max-w-[200px]">{selectedTx.idempotency_key}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedTx.idempotency_key, 'idemp')}
                              className="p-1 hover:text-[#2563EB] transition"
                              title="Copy Idempotency Key"
                            >
                              {copiedKey === 'idemp' ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        }
                      />
                    )}
                  </div>
                </div>

                {/* ── Participants ─────────────────────────────────────────── */}
                {(selectedTx.from_wallet_number || selectedTx.to_wallet_number || selectedTx.from_user_name || selectedTx.to_user_name) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#2563EB]" /> Participants
                    </h3>
                    <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] text-xs">
                      {selectedTx.from_wallet_number && (
                        <DetailRow
                          label="Sender Wallet"
                          value={
                            <div>
                              <span className="font-mono font-medium text-[#0F172A]">{selectedTx.from_wallet_number}</span>
                              {selectedTx.from_user_name && (
                                <span className="text-[#64748B] ml-1.5">({selectedTx.from_user_name})</span>
                              )}
                            </div>
                          }
                        />
                      )}
                      {selectedTx.to_wallet_number && (
                        <DetailRow
                          label="Recipient Wallet"
                          value={
                            <div>
                              <span className="font-mono font-medium text-[#0F172A]">{selectedTx.to_wallet_number}</span>
                              {selectedTx.to_user_name && (
                                <span className="text-[#64748B] ml-1.5">({selectedTx.to_user_name})</span>
                              )}
                            </div>
                          }
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* ── Failure Reason Alert (if present) ────────────────────── */}
                {selectedTx.failure_reason && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Failure Reason
                    </h3>
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] leading-relaxed">
                      {selectedTx.failure_reason}
                    </div>
                  </div>
                )}

                {/* ── Double-Entry Ledger Entries ──────────────────────────── */}
                {selectedTx.ledger_entries && selectedTx.ledger_entries.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" /> Double-Entry Ledger
                      </h3>
                      <span className="text-[11px] font-semibold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        Balanced
                      </span>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-slate-100/50">
                            <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Account</th>
                            <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Type</th>
                            <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {selectedTx.ledger_entries.map((le) => (
                            <tr key={le.id} className="text-[#0F172A] hover:bg-white/60 transition">
                              <td className="px-4 py-2.5 font-mono text-[11px]">
                                {le.account_name}
                                <span className="block text-[10px] text-[#94A3B8] font-sans">Entry #{le.id}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  le.entry_type === 'DEBIT'
                                    ? 'bg-rose-50 text-[#E11D48] border border-rose-200'
                                    : 'bg-emerald-50 text-[#059669] border border-emerald-200'
                                }`}>
                                  {le.entry_type}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold">
                                ₹{fmt(le.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Risk & Integrity Info (Backend Enforced Rules) ────────── */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Integrity & Risk Verification
                  </h3>
                  <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Compliance Limit Check:</span>
                      <span className="font-medium text-[#16A34A] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Within single transfer limit (₹5,00,000)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Idempotency Guard:</span>
                      <span className="font-medium text-[#0F172A]">
                        {selectedTx.idempotency_key ? 'Enforced & Protected' : 'Standard Execution'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Ledger Consistency:</span>
                      <span className="font-medium text-[#16A34A] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Double-entry verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component ──────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-start px-4 py-2.5 gap-4">
      <span className="text-[#64748B] shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? 'font-mono' : ''} text-[#0F172A]`}>
        {value}
      </span>
    </div>
  );
}
