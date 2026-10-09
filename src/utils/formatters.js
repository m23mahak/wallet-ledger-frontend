/**
 * WalletLedger Frontend Formatting & Helper Utilities
 */

/**
 * Format a numeric amount to INR currency string.
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format an ISO date string into readable date and time.
 * @param {string|Date} isoString
 * @returns {string}
 */
export const formatDate = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format transaction/hold status into user-friendly badge styling.
 * @param {string} status
 * @returns {{ label: string, bg: string, text: string }}
 */
export const getStatusBadgeStyle = (status) => {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'COMPLETED':
    case 'ACTIVE':
    case 'SUCCESS':
      return { label: s, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'PENDING':
    case 'HOLD':
      return { label: s, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'RELEASED':
    case 'CANCELLED':
    case 'EXPIRED':
      return { label: s, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'FAILED':
    case 'REJECTED':
      return { label: s, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: s || 'UNKNOWN', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
};
