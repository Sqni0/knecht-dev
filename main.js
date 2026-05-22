/* knecht.dev — shared JS */

/* ── Mobile nav ── */
const hbg  = document.getElementById('hbg');
const menu = document.getElementById('mob-menu');

hbg.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  hbg.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-hidden', !open);
});

function closeMenu() {
  menu.classList.remove('open');
  hbg.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const body   = item.querySelector('.faq-body');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-body').style.maxHeight = '0';
    });

    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

/* ── J · Scroll Progress Bar ── */
(function () {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.body.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    bar.style.width = Math.min((window.scrollY / total) * 100, 100) + '%';
  }, { passive: true });
})();

/* ── B · Nav scroll blur ── */
(function () {
  const nav = document.getElementById('gn');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ── A · Scroll Reveal (Intersection Observer) ── */
(function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const delay = parseInt(e.target.dataset.delay) || 0;
      setTimeout(() => e.target.classList.add('revealed'), delay);
      io.unobserve(e.target);
    });
  }, { threshold: 0.08 });

  /* Cards — staggered */
  document.querySelectorAll('.svc-card, .price-card, .info-card, .stack-group, .faq-item')
    .forEach((el, i) => {
      el.classList.add('reveal');
      el.dataset.delay = (i % 4) * 90;
      io.observe(el);
    });

  /* About grid columns — slide from left/right */
  document.querySelectorAll('.grid-about > div').forEach((el, i) => {
    el.classList.add(i === 0 ? 'reveal-left' : 'reveal-right');
    io.observe(el);
  });

  /* O · Split-Text Word Reveal on section headings */
  function splitTextWords(el) {
    if (el.children.length > 0) return false;
    const words = el.textContent.trim().split(' ');
    if (!words.length) return false;
    el.innerHTML = words.map((w, i) =>
      `<span class="st-wrap"><span class="st-inner" style="animation-delay:${(i * 0.07).toFixed(2)}s">${w}</span></span>`
    ).join(' ');
    return true;
  }
  const splitIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('revealed');
      splitIO.unobserve(e.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.tile:not(.page-hero) .t-lg, .tile:not(.page-hero) .t-md').forEach(el => {
    if (el.closest('#hero')) return;
    const split = splitTextWords(el);
    if (split) {
      el.classList.add('has-split');
      splitIO.observe(el);
    } else {
      el.classList.add('reveal');
      io.observe(el);
    }
  });

  /* Page-hero h1 */
  document.querySelectorAll('.page-hero h1').forEach(el => {
    el.classList.add('reveal');
    el.dataset.delay = 100;
    io.observe(el);
  });

  /* No-list boxes */
  document.querySelectorAll('.no-list').forEach(el => {
    el.classList.add('reveal');
    io.observe(el);
  });
})();

/* ── F · Text Scramble on section headings ── */
(function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';

  function scramble(el) {
    if (el.children.length > 0) return; /* skip headings with <br> or child tags */
    const original = el.textContent;
    if (!original.trim()) return;
    let iter = 0;
    const iv = setInterval(() => {
      el.textContent = original.split('').map((c, i) => {
        if (i < iter) return original[i];
        if (c === ' ') return ' ';
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      if (iter >= original.length) clearInterval(iv);
      iter += 0.6;
    }, 28);
  }

  const sio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      scramble(e.target);
      sio.unobserve(e.target);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.tile:not(.page-hero) .t-lg').forEach(el => {
    if (!el.closest('#hero')) sio.observe(el);
  });
})();

/* ── E · Stats Counter ── */
(function () {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    const cio = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let val = 0;
      const inc = Math.max(1, Math.ceil(target / 45));
      const step = () => {
        val = Math.min(val + inc, target);
        el.textContent = val + suffix;
        if (val < target) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
    cio.observe(el);
  });
})();

/* ── C · Custom Cursor ── */
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  document.body.style.cursor = 'none';

  let cx = -100, cy = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
  });

  (function animRing() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a, button, .btn, .faq-q, .svc-card, .price-card, .info-card, .stack-group').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();

/* ── C · Magnetic Buttons ── */
(function () {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.22;
      const y = (e.clientY - r.top  - r.height / 2) * 0.22;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ── L · Aurora Background Injection ── */
(function () {
  document.querySelectorAll('.tile-dark, .page-hero').forEach(section => {
    if (section.id === 'hero') return;
    section.style.position = 'relative';
    section.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.className = 'aurora-overlay';
    overlay.innerHTML = '<div class="ab ab-1"></div><div class="ab ab-2"></div><div class="ab ab-3"></div>';
    section.insertBefore(overlay, section.firstChild);
  });
})();

/* ── M · Holographic Card Shimmer ── */
(function () {
  document.querySelectorAll('.svc-card, .price-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--hx', ((e.clientX - r.left) / r.width).toFixed(3));
      card.style.setProperty('--hy', ((e.clientY - r.top)  / r.height).toFixed(3));
    });
    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--hx');
      card.style.removeProperty('--hy');
    });
  });
})();

/* ── N · Page Transitions ── */
(function () {
  const pt = document.getElementById('page-transition');
  if (!pt) return;
  pt.style.opacity = '1';
  pt.style.transition = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    pt.style.transition = 'opacity 0.4s ease';
    pt.style.opacity = '0';
  }));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || a.target === '_blank') return;
    e.preventDefault();
    pt.style.pointerEvents = 'all';
    pt.style.opacity = '1';
    setTimeout(() => { window.location.href = href; }, 400);
  });
})();
