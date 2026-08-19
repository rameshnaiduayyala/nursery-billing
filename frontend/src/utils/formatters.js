// ── Cached Intl formatters (created once, reused on every call) ──
const _currencyFmtDecimals = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const _currencyFmtNoDecimals = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

/**
 * Format currency in Indian Rupees format (e.g., ₹1,50,000.00)
 */
export function formatCurrency(amount, includeDecimals = true) {
  const numeric = Number(amount) || 0;
  return includeDecimals
    ? _currencyFmtDecimals.format(numeric)
    : _currencyFmtNoDecimals.format(numeric);
}

/**
 * Format date string (YYYY-MM-DD or ISO) to display format (DD-MM-YYYY)
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format Date object to YYYY-MM-DD string for HTML input
 */
export function dateToInput(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range object { start_date, end_date } based on preset string
 */
export function getPresetDateRange(preset) {
  const now = new Date();
  const today = dateToInput(now);
  
  if (preset === 'today') {
    return { start_date: today, end_date: today };
  }
  
  if (preset === 'this_week') {
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    return { start_date: dateToInput(startOfWeek), end_date: today };
  }
  
  if (preset === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start_date: dateToInput(startOfMonth), end_date: today };
  }
  
  if (preset === 'last_month') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start_date: dateToInput(startOfLastMonth), end_date: dateToInput(endOfLastMonth) };
  }
  
  if (preset === 'this_year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return { start_date: dateToInput(startOfYear), end_date: today };
  }

  return { start_date: '', end_date: '' };
}
