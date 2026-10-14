/**
 * Formats a numeric price into Rwandan Francs (RWF)
 * Example: 15000 -> "15,000 RWF"
 */
export function formatRWF(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 RWF';
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(numeric);
  return `${formatted} RWF`;
}

/**
 * Formats ISO date string into readable concise datetime
 * Example: "13 Oct 2026, 09:30"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Returns date without time
 * Example: "13 Oct 2026"
 */
export function formatDateOnly(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}
