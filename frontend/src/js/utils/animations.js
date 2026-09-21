/**
 * animations.js — EPA Punjab Dashboard UI/UX Polish
 * 
 * Provides:
 * - animateCounter(el, targetValue, duration) — smooth count-up from 0
 * - initScrollReveal()                         — IntersectionObserver for .animate-row
 * - animateProgressBars()                      — animated fill with target width
 * - initRippleEffect()                         — CSS var ripple on platform cards
 * - initLivePulse()                            — pulse badge class on Live badges
 */

/**
 * Animate a numeric count-up from 0 to targetValue.
 * Uses easeOutExpo for a snappy deceleration effect.
 * @param {HTMLElement} el - The element whose textContent will be animated
 * @param {number}      targetValue
 * @param {number}      duration  - ms
 * @param {Function}    formatter - (number) => string
 */
export function animateCounter(el, targetValue, duration = 1200, formatter = (n) => n.toLocaleString('en-US')) {
  if (!el || isNaN(targetValue) || targetValue <= 0) {
    if (el) el.textContent = formatter(targetValue || 0);
    return;
  }

  el.classList.add('kpi-counter');
  const start = performance.now();
  const from = 0;
  const to = Number(targetValue);

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = formatter(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = formatter(to);
      // Flash on final value
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 500);
    }
  }

  requestAnimationFrame(tick);
}

/**
 * Initialize scroll-reveal using IntersectionObserver.
 * Adds .in-view to elements with .animate-row when they enter the viewport.
 * Falls back to immediately showing all elements if IO not supported.
 */
export function initScrollReveal() {
  const rows = document.querySelectorAll('.animate-row');

  if (!('IntersectionObserver' in window)) {
    rows.forEach(r => r.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  rows.forEach(r => io.observe(r));
}

/**
 * Animate all .progress-bar elements that have data-target attribute.
 * Progress bars start at 0 and animate to the percentage stored in
 * data-target (or their existing aria-valuenow attribute).
 */
export function animateProgressBars(containerEl = document) {
  const bars = containerEl.querySelectorAll('.progress-bar[aria-valuenow]');
  bars.forEach((bar, i) => {
    const target = bar.getAttribute('aria-valuenow') || '0';
    bar.style.setProperty('--target-width', `${target}%`);
    // Stagger each bar
    setTimeout(() => {
      bar.classList.add('animated');
    }, i * 150 + 200);
  });
}

/**
 * Add ripple CSS custom property on platform cards so the
 * ::before pseudo-element centres on the click/hover origin.
 */
export function initRippleEffect() {
  document.querySelectorAll('.platform-column').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--ripple-x', `${x}%`);
      card.style.setProperty('--ripple-y', `${y}%`);
    });
  });
}

/**
 * Add live-pulse class to all "Live Public" badges.
 */
export function initLivePulse() {
  document.querySelectorAll('.status-dot').forEach(badge => {
    if (badge.textContent.trim().startsWith('Live')) {
      badge.classList.add('live-pulse');
    }
  });
}

/**
 * Animate the admin portal button — remove pulse ring once authenticated.
 */
export function updateAdminButtonState(isAdmin) {
  const btn = document.getElementById('adminPortalBtn');
  if (!btn) return;
  if (isAdmin) {
    btn.classList.add('admin-active');
  } else {
    btn.classList.remove('admin-active');
  }
}
