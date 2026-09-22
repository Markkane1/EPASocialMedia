/**
 * animations.js — EPA Punjab Dashboard UI/UX Polish
 *
 * Exports:
 *   animateCounter(el, target, duration, formatter)
 *   animateAllCountersIn(containerEl)
 *   initScrollReveal()  — dual IO + scroll event, leak-free
 *   animateProgressBars(containerEl)
 *   initRippleEffect()
 *   initLivePulse()
 *   updateAdminButtonState(isAdmin)
 */

import { formatNumber } from './formatters.js';

/* ============================================================
   CORE COUNT-UP ENGINE
   ============================================================ */
export function animateCounter(el, targetValue, duration = 1200, formatter = formatNumber) {
  if (!el) return;
  const parsed = parseFloat(String(targetValue).replace(/[^0-9.-]/g, ''));
  if (isNaN(parsed) || parsed <= 0) return;

  el.classList.add('kpi-counter');
  const start = performance.now();
  const to = parsed;

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = formatter(Math.round(to * easeOutExpo(progress)));
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = formatter(to);
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 500);
    }
  }

  requestAnimationFrame(tick);
}

/* ============================================================
   BULK COUNTER TRIGGER
   Scans a container for [data-counter] and [data-counter-live].
   ============================================================ */
export function animateAllCountersIn(containerEl = document) {
  containerEl.querySelectorAll('[data-counter]').forEach(el => {
    const target   = parseFloat(el.dataset.counter) || 0;
    const duration = parseInt(el.dataset.counterDuration) || 1200;
    const prefix   = el.dataset.counterPrefix || '';
    const suffix   = el.dataset.counterSuffix || '';
    animateCounter(el, target, duration, n => prefix + n.toLocaleString('en-US') + suffix);
  });

  containerEl.querySelectorAll('[data-counter-live]').forEach(el => {
    const raw      = el.textContent.trim().replace(/[^0-9.]/g, '');
    const target   = parseFloat(raw) || 0;
    const duration = parseInt(el.dataset.counterLive) || 1200;
    if (target > 0) animateCounter(el, target, duration, formatNumber);
  });
}

/* ============================================================
   SCROLL REVEAL
   Dual strategy: IntersectionObserver + window scroll event.
   Stored references prevent listener leaks across calls.
   ============================================================ */
let _srIO       = null;   // singleton IO
let _srListener = null;   // singleton scroll listener

export function initScrollReveal() {
  // ── Tear down any previous observers ──────────────────────
  if (_srIO)       { _srIO.disconnect(); _srIO = null; }
  if (_srListener) { window.removeEventListener('scroll', _srListener); _srListener = null; }

  // ── Collect rows, reset state ─────────────────────────────
  const rows = Array.from(document.querySelectorAll('.animate-row'));
  rows.forEach(row => { row.classList.remove('in-view'); delete row.dataset.animated; });

  if (!rows.length) return;

  // ── Reveal helper (idempotent) ────────────────────────────
  function reveal(row) {
    if (row.dataset.animated) return;
    row.dataset.animated = '1';
    row.classList.add('in-view');
    animateAllCountersIn(row);
    animateProgressBars(row);
  }

  // ── Viewport check via getBoundingClientRect ──────────────
  // Reliable regardless of which element is the scroll container.
  function checkViewport() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    rows.forEach(row => {
      if (row.dataset.animated) return;
      const rect = row.getBoundingClientRect();
      // Reveal when the top of the row is within 95% of viewport height
      if (rect.top < vh * 0.95 && rect.bottom > 0) {
        reveal(row);
      }
    });
  }

  // ── IntersectionObserver (fires on 1% visibility) ─────────
  if ('IntersectionObserver' in window) {
    _srIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          _srIO && _srIO.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.01 });

    rows.forEach(row => _srIO.observe(row));
  }

  // ── Scroll event fallback (covers nested overflow / quirks) ─
  _srListener = () => requestAnimationFrame(checkViewport);
  window.addEventListener('scroll', _srListener, { passive: true });

  // ── Immediate check for rows already on screen ────────────
  requestAnimationFrame(() => {
    checkViewport();
    setTimeout(checkViewport, 250); // second pass after layout settles
  });
}

/* ============================================================
   PROGRESS BARS — animated fill
   ============================================================ */
export function animateProgressBars(containerEl = document) {
  const bars = (containerEl === document ? document : containerEl)
    .querySelectorAll('.progress-bar[aria-valuenow]');
  bars.forEach((bar, i) => {
    const target = bar.getAttribute('aria-valuenow') || '0';
    bar.style.setProperty('--target-width', `${target}%`);
    setTimeout(() => bar.classList.add('animated'), i * 150 + 150);
  });
}

/* ============================================================
   RIPPLE — cursor-centred gradient on platform cards
   ============================================================ */
export function initRippleEffect() {
  document.querySelectorAll('.platform-column').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--ripple-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--ripple-y', `${((e.clientY - rect.top)  / rect.height) * 100}%`);
    });
  });
}

/* ============================================================
   LIVE PULSE BADGES
   ============================================================ */
export function initLivePulse() {
  document.querySelectorAll('.status-dot').forEach(badge => {
    if (badge.textContent.trim().startsWith('Live')) {
      badge.classList.add('live-pulse');
    }
  });
}

/* ============================================================
   ADMIN BUTTON STATE
   ============================================================ */
export function updateAdminButtonState(isAdmin) {
  const btn = document.getElementById('adminPortalBtn');
  if (!btn) return;
  isAdmin ? btn.classList.add('admin-active') : btn.classList.remove('admin-active');
}
