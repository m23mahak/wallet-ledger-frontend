import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DepositModal from './DepositModal';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  Lock,
  Shield,
  LogOut,
  Plus,
  Coins,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';

export default function Layout({ children, onWalletUpdated }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Transfer', path: '/transfer', icon: ArrowLeftRight },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Holds', path: '/holds', icon: Lock },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Operations', path: '/admin', icon: Shield, badge: 'ADMIN' });
  }

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1F3A] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/15">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                W
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base tracking-tight text-white">WalletLedger</span>
                <span className="text-[10px] uppercase tracking-wider text-[#38BDF8] font-semibold mt-0.5">
                  Financial OS
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
              Menu
            </div>
            <nav className="flex flex-col gap-1 mt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                      active
                        ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#38BDF8] text-[#0B1F3A]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/15">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#64748B]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>Double-Entry Core Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
              <Coins className="w-4 h-4 text-[#2563EB]" />
              <span>₹ INR</span>
            </div>

            {/* Quick Add Money Button */}
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Money</span>
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositSuccess={(wallet) => {
          if (onWalletUpdated) onWalletUpdated(wallet);
          window.dispatchEvent(new CustomEvent('walletledger_balance_updated', { detail: wallet }));
        }}
      />
    </div>
  );
}
