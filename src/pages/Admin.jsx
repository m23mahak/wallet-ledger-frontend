import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';
import {
  ShieldAlert,
  Users,
  Wallet,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Ban,
  UserCheck,
  Lock,
  Unlock,
  Activity,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  // Wallets state
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletsError, setWalletsError] = useState(null);
  const [walletSearch, setWalletSearch] = useState('');
  const [walletStatusFilter, setWalletStatusFilter] = useState('ALL');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState(null);
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  // Reconciliation state
  const [reconciliation, setReconciliation] = useState(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconError, setReconError] = useState(null);

  // Action status message
  const [actionMessage, setActionMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (err) {
      setStatsError(err.friendlyMessage || 'Failed to load system dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await adminService.listUsers();
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      setUsersError(err.friendlyMessage || 'Failed to load system users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch Wallets
  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true);
    setWalletsError(null);
    try {
      const data = await adminService.listWallets();
      setWallets(Array.isArray(data) ? data : data?.wallets || []);
    } catch (err) {
      setWalletsError(err.friendlyMessage || 'Failed to load system wallets');
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const params = {};
      if (txStatusFilter !== 'ALL') params.status = txStatusFilter;
      const data = await adminService.listAllTransactions(params);
      const items = Array.isArray(data) ? data : data?.items || [];
      setTransactions(items);
    } catch (err) {
      setTxError(err.friendlyMessage || 'Failed to load transactions history');
    } finally {
      setTxLoading(false);
    }
  }, [txStatusFilter]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const data = await adminService.listAuditLogs(100);
      setAuditLogs(Array.isArray(data) ? data : data?.logs || []);
    } catch (err) {
      setAuditError(err.friendlyMessage || 'Failed to fetch audit logs');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Run Reconciliation
  const runReconciliationCheck = async () => {
    setReconLoading(true);
    setReconError(null);
    try {
      const data = await adminService.runReconciliation();
      setReconciliation(data);
      setActionMessage({ type: 'success', text: 'Reconciliation audit completed successfully.' });
    } catch (err) {
      setReconError(err.friendlyMessage || 'Reconciliation process failed');
    } finally {
      setReconLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'wallets') fetchWallets();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'reconciliation' && !reconciliation) runReconciliationCheck();
  }, [activeTab, fetchUsers, fetchWallets, fetchTransactions, fetchAuditLogs]);

  // Handlers for User status update (ACTIVE / BLOCKED)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    setUpdatingId(userId);
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setActionMessage({ type: 'success', text: `User status updated to ${newStatus}` });
      fetchUsers();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.friendlyMessage || 'Failed to update user status' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Handlers for Wallet status update (ACTIVE / FROZEN)
  const handleToggleWalletStatus = async (walletId, currentStatus) => {
    const newStatus = currentStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    setUpdatingId(walletId);
    try {
      await adminService.updateWalletStatus(walletId, newStatus);
      setActionMessage({ type: 'success', text: `Wallet status updated to ${newStatus}` });
      fetchWallets();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.friendlyMessage || 'Failed to update wallet status' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper formatting functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      String(u.id || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWallets = wallets.filter((w) => {
    const matchesSearch =
      String(w.id || '').toLowerCase().includes(walletSearch.toLowerCase()) ||
      (w.wallet_number || '').toLowerCase().includes(walletSearch.toLowerCase()) ||
      String(w.user_id || '').toLowerCase().includes(walletSearch.toLowerCase());
    const matchesStatus = walletStatusFilter === 'ALL' || w.status === walletStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter((t) => {
    const query = txSearch.toLowerCase();
    return (
      String(t.id || '').toLowerCase().includes(query) ||
      (t.reference_id || '').toLowerCase().includes(query) ||
      (t.from_wallet_number || '').toLowerCase().includes(query) ||
      (t.to_wallet_number || '').toLowerCase().includes(query) ||
      (t.from_user_name || '').toLowerCase().includes(query) ||
      (t.to_user_name || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#0284C7] font-bold text-xs">
              ADMIN CONTROL CENTER
            </span>
            <span className="text-xs text-[#64748B]">Real-time Database Integrity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
            System Administration
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Monitor accounts, audit double-entry ledger entries, and enforce security policies.
          </p>
        </div>

        <button
          onClick={() => {
            fetchDashboardStats();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'wallets') fetchWallets();
            if (activeTab === 'transactions') fetchTransactions();
            if (activeTab === 'audit') fetchAuditLogs();
            if (activeTab === 'reconciliation') runReconciliationCheck();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] font-semibold text-xs hover:bg-[#F8FAFC] transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Global Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition ${
            actionMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {actionMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Tabs Navigation */}
      <div className="flex border-b border-[#E2E8F0] overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'dashboard', name: 'Overview Stats', icon: Activity },
          { id: 'users', name: 'User Directory', icon: Users },
          { id: 'wallets', name: 'Wallets Overview', icon: Wallet },
          { id: 'transactions', name: 'All Transactions', icon: Receipt },
          { id: 'audit', name: 'Audit Logs', icon: Clock },
          { id: 'reconciliation', name: 'Ledger Reconciliation', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition ${
                isActive
                  ? 'border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Loading system metrics...</p>
            </div>
          ) : statsError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
              <div className="flex items-center gap-2 font-bold text-base mb-1">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Failed to retrieve admin stats</span>
              </div>
              <p className="text-sm">{statsError}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total System Users</span>
                    <Users className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                    {stats?.total_users ?? 0}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                    <span className="font-semibold text-emerald-600">{stats?.active_users ?? 0} Active</span> | <span className="font-semibold text-rose-600">{stats?.blocked_users ?? 0} Blocked</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total System Wallets</span>
                    <Wallet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                    {stats?.total_wallets ?? 0}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {stats?.active_wallets ?? 0} Active | {stats?.frozen_wallets ?? 0} Frozen
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Volume (INR)</span>
                    <Receipt className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                    {formatCurrency(stats?.total_volume_inr ?? 0)}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {stats?.total_transactions ?? 0} txs ({stats?.success_rate_percent ?? 100}% success)
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Holds Volume</span>
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                    {formatCurrency(stats?.active_holds_amount_inr ?? 0)}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {stats?.active_holds_count ?? 0} active hold reservations
                  </div>
                </div>
              </div>

              {/* System Security & Integrity Banner */}
              <div className="p-6 rounded-2xl bg-[#0B1F3A] text-white space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Double-Entry Ledger Integrity Status</h3>
                      <p className="text-xs text-slate-300">
                        Zero-sum verification logic ensures debits equal credits across all balance transfers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('reconciliation')}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition shadow"
                  >
                    Run Full Audit
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by user name, email, or user ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="BLOCKED">Blocked Only</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Fetching system users...</p>
            </div>
          ) : usersError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium">
              {usersError}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No user accounts found</p>
              <p className="text-xs text-[#64748B] mt-1">Try adjusting search parameters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">User Info</th>
                      <th className="py-3.5 px-4">Wallet Info</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredUsers.map((u) => {
                      const isBlocked = u.status === 'BLOCKED';
                      return (
                        <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0F172A]">{u.name || 'User'}</div>
                            <div className="text-[11px] text-[#64748B]">{u.email}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {u.id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-[#0F172A] font-semibold">{u.wallet_number || 'N/A'}</div>
                            <div className="text-[11px] font-bold text-emerald-600">
                              {u.wallet_balance !== undefined ? formatCurrency(u.wallet_balance) : 'N/A'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                u.role === 'ADMIN'
                                  ? 'bg-[#38BDF8]/10 text-[#0284C7]'
                                  : 'bg-slate-100 text-[#475569]'
                              }`}
                            >
                              {u.role || 'USER'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit ${
                                isBlocked
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isBlocked ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              ></span>
                              {u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">{formatDate(u.created_at)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              disabled={updatingId === u.id || u.role === 'ADMIN'}
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                                isBlocked
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {updatingId === u.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isBlocked ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Unblock User</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Block User</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WALLETS OVERVIEW */}
      {activeTab === 'wallets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by wallet number, wallet ID, or user ID..."
                value={walletSearch}
                onChange={(e) => setWalletSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <select
                value={walletStatusFilter}
                onChange={(e) => setWalletStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Wallet States</option>
                <option value="ACTIVE">Active Wallets</option>
                <option value="FROZEN">Frozen Wallets</option>
              </select>
            </div>
          </div>

          {walletsLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Loading wallet records...</p>
            </div>
          ) : walletsError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium">
              {walletsError}
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <Wallet className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No wallet records match criteria</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Wallet Number</th>
                      <th className="py-3.5 px-4">User ID</th>
                      <th className="py-3.5 px-4">Balances (Total / Held / Available)</th>
                      <th className="py-3.5 px-4">State</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredWallets.map((w) => {
                      const isFrozen = w.status === 'FROZEN';
                      return (
                        <tr key={w.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-3.5 px-4 font-mono text-[#0F172A] font-semibold">
                            {w.wallet_number || `WLT-${w.id}`}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                            User #{w.user_id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0F172A]">{formatCurrency(w.balance)}</div>
                            <div className="text-[11px] text-[#64748B]">
                              Avail: {formatCurrency(w.available_balance)} | Held: {formatCurrency(w.held_balance)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isFrozen
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {w.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              disabled={updatingId === w.id}
                              onClick={() => handleToggleWalletStatus(w.id, w.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                                isFrozen
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              } disabled:opacity-50`}
                            >
                              {updatingId === w.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isFrozen ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Unfreeze Wallet</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Freeze Wallet</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ALL TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference ID, sender/recipient name..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {txLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Loading transaction records...</p>
            </div>
          ) : txError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium">
              {txError}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <Receipt className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No transactions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Reference</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">From → To</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">
                          {tx.reference_id || `TX-${tx.id}`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#64748B]">
                          {tx.type}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#0F172A]">
                            {tx.from_user_name || tx.from_wallet_number || 'External'} → {tx.to_user_name || tx.to_wallet_number || 'Self'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">{formatCurrency(tx.amount)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.status === 'FAILED'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0F172A]">System Audit Trails</h3>
            <span className="text-xs text-[#64748B]">Showing latest immutable activity logs</span>
          </div>

          {auditLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Retrieving audit logs...</p>
            </div>
          ) : auditError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium">
              {auditError}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <Clock className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No audit logs registered yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
              <div className="divide-y divide-[#E2E8F0]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-[#F8FAFC] transition flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#0B1F3A] text-white">
                          {log.action}
                        </span>
                        <span className="text-xs font-semibold text-[#0F172A]">
                          Entity: {log.entity_type} (#{log.entity_id})
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] mt-1 font-mono">
                        {log.details || 'No additional payload'}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Actor: {log.actor_email || `User #${log.actor_id}` || 'SYSTEM'} | IP: {log.ip_address || '127.0.0.1'}
                      </div>
                    </div>
                    <div className="text-right text-xs text-[#64748B] shrink-0 font-medium">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">Ledger Verification Engine</h3>
                <p className="text-xs text-[#64748B]">
                  Performs sum reconciliation comparing current wallet balances against double-entry transaction entries.
                </p>
              </div>
              <button
                disabled={reconLoading}
                onClick={runReconciliationCheck}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
              >
                {reconLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{reconLoading ? 'Running Check...' : 'Run Audit Reconciliation'}</span>
              </button>
            </div>

            {reconError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium">
                {reconError}
              </div>
            )}

            {reconciliation && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    reconciliation.status === 'MATCHED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                  <div>
                    <div className="font-bold text-sm">
                      Reconciliation Status: {reconciliation.status}
                    </div>
                    <div className="text-xs mt-0.5">
                      Verified {reconciliation.checked_wallets} active wallets. {reconciliation.discrepant_wallets} discrepancies detected.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-medium">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Total Debits</span>
                    <span className="font-bold text-[#0F172A] mt-1 block">
                      {formatCurrency(reconciliation.total_debits)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Total Credits</span>
                    <span className="font-bold text-[#0F172A] mt-1 block">
                      {formatCurrency(reconciliation.total_credits)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Net System Balance</span>
                    <span className="font-bold text-[#0F172A] mt-1 block">
                      {formatCurrency(reconciliation.net_system_balance)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Discrepant Wallets</span>
                    <span className="font-bold text-emerald-600 mt-1 block">
                      {reconciliation.discrepant_wallets}
                    </span>
                  </div>
                </div>

                {reconciliation.details && reconciliation.details.length > 0 && (
                  <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-xs text-[#0F172A] block mb-2">Audit Details</span>
                    <ul className="space-y-1 text-xs text-[#475569] font-mono">
                      {reconciliation.details.map((detail, idx) => (
                        <li key={idx}>• {detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
