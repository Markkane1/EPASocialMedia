/**
 * Formatting and Helper Utilities for EPA Punjab Dashboard
 */

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Number(num).toLocaleString('en-US');
}

export function formatCompact(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  const val = Number(num);
  if (val >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (val >= 1_000_000) {
    return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (val >= 1_000) {
    return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
