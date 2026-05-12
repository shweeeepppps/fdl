/* ═══════════════════════════════════════════════════════
   FDL CHEMICALS — CLIENT JS
   GSAP + ScrollTrigger animations, cursor, contact form
   ═══════════════════════════════════════════════════════ */
'use strict';

(function () {

  /* ── GSAP setup ─────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  /* ════════════════════════════════════════════════════
     1. CUSTOM CURSOR
  ════════════════════════════════════════════════════ */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (dot && ring) {
    let mx = 0, my = 0;   // mouse target
    let dx = 0, dy = 0;   // dot current
    let rx = 0, ry = 0;   // ring current

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
    });

    (function animateCursor() {
      // dot: snappy
      dx += (mx - dx) * 0.18;
      dy += (my - dy) * 0.18;
      dot.style.left = dx + 'px';
      dot.style.top  = dy + 'px';

      // ring: sluggish
      rx += (mx - rx) * 0.09;
      ry += (my - ry) * 0.09;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';

      requestAnimationFrame(animateCursor);
    })();

    // Expand on interactive elements
    document.querySelectorAll('.hover-el, a, button, input, textarea, select, .lang-btn')
      .forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
      });

    // Hide when leaving window
    document.addEventListener('mouseleave', () => {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    });
  }

  /* ════════════════════════════════════════════════════
     2. NAV — scroll state
  ════════════════════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ════════════════════════════════════════════════════
     3. HERO ENTRANCE ANIMATION
  ════════════════════════════════════════════════════ */
  const heroLabel    = document.getElementById('hero-label');
  const heroHeadline = document.getElementById('hero-headline');
  const heroSubrow   = document.getElementById('hero-subrow');

  if (heroLabel && heroHeadline) {
    const tl = gsap.timeline({ delay: 0.1 });

    tl.from(heroLabel, {
      opacity: 0, x: -32, duration: 0.7, ease: 'power3.out'
    })
    .from(heroHeadline, {
      opacity: 0, y: 70, duration: 0.9, ease: 'power3.out'
    }, '-=0.4')
    .from(heroSubrow, {
      opacity: 0, y: 32, duration: 0.7, ease: 'power3.out'
    }, '-=0.5');
  }

  /* ── Hero counter (runs on load) ─────────────────── */
  document.querySelectorAll('#hero .count-up').forEach(el => {
    animateCount(el, 900, 1800);
  });

  /* ── Hero background parallax ───────────────────── */
  gsap.to('.hero-bg', {
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
    y: 140,
    ease: 'none',
  });

  /* ════════════════════════════════════════════════════
     4. SCROLL REVEAL — generic classes
  ════════════════════════════════════════════════════ */
  // .rev  → fade up
  gsap.utils.toArray('.rev').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
    });
  });

  // .rev-r → slide in from right
  gsap.utils.toArray('.rev-r').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
    });
  });

  // .rev-s → scale up
  gsap.utils.toArray('.rev-s').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
    });
  });

  /* ── Product cards stagger ──────────────────────── */
  const productGrid = document.querySelector('.products-grid');
  if (productGrid) {
    gsap.from('.product-card', {
      scrollTrigger: { trigger: productGrid, start: 'top 82%' },
      opacity: 0, y: 52, stagger: 0.055, duration: 0.7, ease: 'power3.out',
    });
  }

  /* ── Cert cards stagger ─────────────────────────── */
  const certsGrid = document.querySelector('.certs-grid');
  if (certsGrid) {
    gsap.from('.cert-card', {
      scrollTrigger: { trigger: certsGrid, start: 'top 82%' },
      opacity: 0, y: 40, stagger: 0.05, duration: 0.65, ease: 'power3.out',
    });
  }

  /* ════════════════════════════════════════════════════
     5. COUNT-UP ON SCROLL (stat section)
  ════════════════════════════════════════════════════ */
  document.querySelectorAll('.count-up-scroll').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => animateCount(el, 0, 1600),
    });
  });

  /* ── Shared count-up helper ─────────────────────── */
  function animateCount(el, startDelay, duration) {
    const target = parseInt(el.dataset.target, 10);
    const t0 = Date.now() + startDelay;

    (function tick() {
      const elapsed  = Math.max(0, Date.now() - t0);
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    })();
  }

  /* ════════════════════════════════════════════════════
     6. WORLD MAP — animated trade routes
  ════════════════════════════════════════════════════ */
  const mapWrap = document.querySelector('.map-wrap');
  if (mapWrap) {
    ScrollTrigger.create({
      trigger: mapWrap,
      start: 'top 80%',
      once: true,
      onEnter: () => animateMapRoutes(),
    });
  }

  function animateMapRoutes() {
    const routes = ['#route-de', '#route-be', '#route-es', '#route-us', '#route-cn', '#route-in'];

    routes.forEach((sel, i) => {
      const line = document.querySelector(sel);
      if (!line) return;

      const length = line.getTotalLength ? line.getTotalLength() : 200;
      gsap.set(line, {
        strokeDasharray: length,
        strokeDashoffset: length,
        opacity: 1,
        stroke: '#2e3d2e',
      });
      gsap.to(line, {
        strokeDashoffset: 0,
        stroke: '#7aff4f',
        opacity: 0.6,
        duration: 1.2,
        delay: i * 0.15,
        ease: 'power2.out',
      });
    });

    // Pulse the hub ring after routes draw
    setTimeout(() => {
      const pulse = document.querySelector('.hub-pulse');
      if (pulse) {
        gsap.set(pulse, { opacity: 1 });
      }
    }, routes.length * 150 + 400);
  }

  /* ════════════════════════════════════════════════════
     7. CONTACT FORM — AJAX submission
  ════════════════════════════════════════════════════ */
  const form       = document.getElementById('contact-form');
  const successBox = document.getElementById('form-success');
  const errorBox   = document.getElementById('form-error');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const btn = form.querySelector('.form-submit');
      const originalText = btn.textContent;

      // UI: loading state
      btn.disabled = true;
      btn.textContent = '...';
      successBox.style.display = 'none';
      errorBox.style.display   = 'none';

      // Gather form data
      const data = Object.fromEntries(new FormData(form));

      try {
        const res = await fetch(window.FDL.contactUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });

        const json = await res.json();

        if (json.success) {
          successBox.textContent   = window.FDL.i18n.success;
          successBox.style.display = 'block';
          form.reset();

          // Animate success box in
          gsap.from(successBox, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out' });
        } else {
          throw new Error(json.message || window.FDL.i18n.error);
        }
      } catch (err) {
        errorBox.textContent   = err.message || window.FDL.i18n.error;
        errorBox.style.display = 'block';
        gsap.from(errorBox, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out' });
      } finally {
        btn.disabled    = false;
        btn.textContent = originalText;
      }
    });
  }

  /* ════════════════════════════════════════════════════
     8. SMOOTH ANCHOR SCROLLING (nav links)
  ════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();
