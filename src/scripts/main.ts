/*
  Movimiento de la portada: carga, scroll suave, transiciones entre escenas,
  carrusel horizontal, hilo de la ruta, bandas de habilidades y letras que
  se apartan del cursor. Si el visitante pide menos movimiento, nada de esto
  se activa y el contenido queda visible tal cual.
*/
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initDialogs, initExpand, initMenu, initSlots, nativeScroll, prefersReduced, type ScrollApi } from './ui';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduce = prefersReduced();
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

/* ───────── Scroll suave ───────── */
let lenis: Lenis | null = null;
let scroll: ScrollApi = nativeScroll;
let velocity = 0;
let scrollDir = 1;

if (!reduce) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', (e: Lenis) => {
    velocity = e.velocity;
    if (e.direction) scrollDir = e.direction;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  const l = lenis;
  scroll = {
    stop: () => l.stop(),
    start: () => l.start(),
    scrollTo: (target, opts) => l.scrollTo(target, { immediate: opts?.immediate, duration: 1.4 }),
    refresh: () => ScrollTrigger.refresh(),
  };
} else {
  scroll = { ...nativeScroll, refresh: () => ScrollTrigger.refresh() };
}

/* Enlaces internos (#seccion) con scroll suave */
$$<HTMLAnchorElement>('a[href^="#"]:not([data-menu-link])').forEach((a) =>
  a.addEventListener('click', (e) => {
    const target = a.hash ? $(a.hash) : null;
    if (!target) return;
    e.preventDefault();
    scroll.scrollTo(target);
  }),
);

/* ───────── Ajustar el título al ancho ───────── */
function fitLines() {
  $$('[data-fit]').forEach((el) => {
    el.style.fontSize = '';
    const visual = $('.letters__visual', el);
    if (!visual) return;
    const avail = el.clientWidth;
    const w = visual.getBoundingClientRect().width;
    if (!w || !avail) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${(fs * avail * 0.985) / w}px`;
  });
}
fitLines();
ScrollTrigger.addEventListener('refreshInit', fitLines);

/* ───────── Pantalla de carga ───────── */
function runLoader(): Promise<void> {
  const el = $('[data-loader]');
  const root = document.documentElement;
  const finish = () => root.classList.add('is-loaded');
  if (!el || reduce || location.hash) {
    finish();
    return Promise.resolve();
  }

  let seen = false;
  try {
    seen = sessionStorage.getItem('be-intro') === '1';
    sessionStorage.setItem('be-intro', '1');
  } catch {
    /* almacenamiento bloqueado: se muestra la carga completa */
  }

  const pct = $('[data-loader-pct]', el);
  const bar = $('[data-loader-bar]', el);
  const state = { p: 0 };
  const render = () => {
    const v = Math.round(state.p);
    if (pct) pct.textContent = String(v).padStart(3, '0');
    if (bar) bar.style.transform = `scaleX(${state.p / 100})`;
  };
  const pageReady = new Promise<void>((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', () => res(), { once: true });
  });
  const ready = Promise.race([
    Promise.all([document.fonts.ready, pageReady]),
    new Promise((res) => setTimeout(res, 3500)), // nunca esperar de más
  ]);

  scroll.stop();
  return new Promise((resolve) => {
    gsap.from($$('.loader__line > span', el), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.09 });
    const ramp = gsap.to(state, { p: 88, duration: seen ? 0.5 : 1.7, ease: 'power2.out', onUpdate: render });
    Promise.all([ready, ramp.then()]).then(() => {
      gsap.to(state, {
        p: 100,
        duration: 0.4,
        ease: 'power1.inOut',
        onUpdate: render,
        onComplete: () => {
          gsap
            .timeline({
              onComplete: () => {
                finish();
                scroll.start();
              },
            })
            .to($('.loader__inner', el), { y: -30, opacity: 0, duration: 0.45, ease: 'power2.in' })
            .add(() => resolve(), '-=0.05')
            .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '<');
        },
      });
    });
  });
}

/* ───────── Entrada de la portada ───────── */
function heroIntro() {
  if (reduce) return;
  gsap.from($$('#entrada .ch'), {
    yPercent: 115,
    rotate: 6,
    opacity: 0,
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.03,
    delay: 0.15,
  });
  gsap.from(['#entrada .hero__kicker', '#entrada .hero__foot'], {
    y: 20,
    opacity: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.1,
    delay: 0.6,
  });
}

/* ───────── Costura que abre la portada hacia "Sobre mí" ───────── */
let heroProgress = 0;
function initSeam() {
  const section = $('#entrada');
  const stage = $('[data-hero-stage]');
  const seam = $('[data-seam]');
  const edges = $$('[data-seam-edge]');
  const lines = $$('[data-hero-line]');
  if (!section || !stage || !seam || reduce) return;

  gsap.set(stage, { '--o': 0 });
  gsap.set(seam, { visibility: 'visible' });
  gsap.set(edges, { visibility: 'visible', opacity: 0 });

  gsap
    .timeline({
      defaults: { ease: 'power2.inOut', duration: 1 },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=110%',
        scrub: 0.7,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => (heroProgress = self.progress),
      },
    })
    .to(edges, { opacity: 1, duration: 0.08 }, 0)
    .to(stage, { '--o': 1 }, 0.04)
    .to(lines[0], { xPercent: -42, opacity: 0, ease: 'power2.in', duration: 0.85 }, 0)
    .to(lines[1], { xPercent: 42, opacity: 0, ease: 'power2.in', duration: 0.85 }, 0)
    .to(['#entrada .hero__kicker', '#entrada .hero__foot'], { opacity: 0, y: -16, duration: 0.3 }, 0)
    .to(edges, { opacity: 0, duration: 0.1 }, 0.94);
}

/* ───────── Revelados al entrar en cada sección ───────── */
function initReveals() {
  if (reduce) return;
  $$('[data-reveal-lines]').forEach((h) => {
    gsap.from($$('.reveal-line > span', h), {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  });
  $$('[data-reveal-label]').forEach((l) => {
    const stitch = $('.label__stitch', l);
    if (stitch)
      gsap.from(stitch, {
        scaleX: 0,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: l, start: 'top 90%', once: true },
      });
  });
  $$('[data-reveal-fade]').forEach((el) =>
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
  );
  const rows = $$('[data-reveal-row]');
  if (rows.length)
    gsap.from(rows, {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: rows[0], start: 'top 90%', once: true },
    });
}

/* ───────── Proyectos: recorrido horizontal ───────── */
function initHorizontal() {
  const pin = $('[data-hscroll]');
  const track = $('[data-hscroll-track]');
  if (!pin || !track || reduce) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    pin.classList.add('is-hscroll');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    if (dist() < 40) {
      pin.classList.remove('is-hscroll');
      return;
    }
    const cards = $$('.card', track);
    const skew = cards.map((c) => gsap.quickTo(c, 'skewX', { duration: 0.5, ease: 'power3.out' }));
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-4, 4, self.getVelocity() / -400);
          skew.forEach((s) => s(v));
        },
        onLeave: () => skew.forEach((s) => s(0)),
        onLeaveBack: () => skew.forEach((s) => s(0)),
      },
    });
    return () => pin.classList.remove('is-hscroll');
  });
}

/* ───────── Ruta: el hilo se cose al bajar ───────── */
function initRoute() {
  const wrap = $('[data-route]');
  const thread = $('[data-route-thread]');
  if (!wrap || !thread || reduce) return;
  gsap.fromTo(
    thread,
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 70%', end: 'bottom 55%', scrub: 0.6 } },
  );
  $$('[data-route-step]', wrap).forEach((step) =>
    gsap.from(step, {
      x: -24,
      opacity: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: step, start: 'top 82%', once: true },
    }),
  );
}

/* ───────── Habilidades: bandas que corren con el scroll ───────── */
function initBands() {
  if (reduce) return;
  $$('[data-band]').forEach((band) => {
    const track = $('[data-band-track]', band);
    if (!track) return;
    const dir = Number(band.dataset.dir) || 1;
    let x = 0;
    let visible = false;
    let hover = 1;
    const setX = gsap.quickSetter(track, 'x', 'px');
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(band);
    band.addEventListener('mouseenter', () => gsap.to({ v: hover }, { v: 0.2, duration: 0.6, onUpdate() { hover = this.targets()[0].v; } }));
    band.addEventListener('mouseleave', () => gsap.to({ v: hover }, { v: 1, duration: 0.6, onUpdate() { hover = this.targets()[0].v; } }));
    gsap.ticker.add((_t, dt) => {
      if (!visible) return;
      const half = track.scrollWidth / 2;
      if (!half) return;
      const speed = (40 + Math.min(Math.abs(velocity) * 28, 900)) * hover;
      x -= dir * scrollDir * speed * (dt / 1000);
      x = gsap.utils.wrap(-half, 0, x);
      setX(x);
    });
  });
}

/* ───────── Letras que se apartan del cursor ───────── */
function initRepel() {
  if (reduce) return;
  $$('[data-repel]').forEach((box) => {
    const chars = $$('.ch', box);
    if (!chars.length) return;

    // Clic o toque: una ola recorre las letras
    box.addEventListener('click', (e) => {
      const rect = box.getBoundingClientRect();
      const px = (e as MouseEvent).clientX - rect.left;
      let nearest = 0;
      let best = Infinity;
      chars.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - px);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });
      const base = getComputedStyle(box).color;
      const stagger = { each: 0.025, from: nearest };
      gsap
        .timeline()
        .to(chars, { yPercent: -14, color: '#c08a2e', duration: 0.25, ease: 'power2.out', stagger })
        .to(chars, { yPercent: 0, color: base, duration: 0.8, ease: 'elastic.out(1, 0.5)', stagger }, 0.22)
        .add(() => gsap.set(chars, { clearProps: 'color' }));
    });

    if (!finePointer) return;
    box.style.position = 'relative';
    const qx = chars.map((c) => gsap.quickTo(c, 'x', { duration: 0.55, ease: 'power3.out' }));
    const qy = chars.map((c) => gsap.quickTo(c, 'y', { duration: 0.55, ease: 'power3.out' }));
    const qr = chars.map((c) => gsap.quickTo(c, 'rotation', { duration: 0.7, ease: 'power3.out' }));
    let centers: { x: number; y: number; r: number }[] = [];
    const measure = () => {
      centers = chars.map((c) => {
        let x = c.offsetWidth / 2;
        let y = c.offsetHeight / 2;
        let n: HTMLElement | null = c;
        while (n && n !== box) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        return { x, y, r: Math.max(90, c.offsetHeight * 0.9) };
      });
    };
    measure();
    ScrollTrigger.addEventListener('refresh', measure);
    document.fonts.ready.then(measure);

    let active = false;
    const reset = () => {
      if (!active) return;
      active = false;
      chars.forEach((c) => gsap.to(c, { x: 0, y: 0, rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' }));
    };
    window.addEventListener(
      'pointermove',
      (e) => {
        const rect = box.getBoundingClientRect();
        const pad = 120;
        if (e.clientX < rect.left - pad || e.clientX > rect.right + pad || e.clientY < rect.top - pad || e.clientY > rect.bottom + pad) {
          reset();
          return;
        }
        active = true;
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        centers.forEach((c, i) => {
          const dx = c.x - px;
          const dy = c.y - py;
          const d = Math.hypot(dx, dy) || 1;
          if (d < c.r) {
            const f = (1 - d / c.r) ** 2;
            const push = f * c.r * 0.6;
            qx[i]((dx / d) * push);
            qy[i]((dy / d) * push);
            qr[i](f * 28 * Math.sign(dx || 1));
          } else {
            qx[i](0);
            qy[i](0);
            qr[i](0);
          }
        });
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', reset);
  });
}

/* ───────── Barra superior: sección actual y color ───────── */
function initNavState() {
  const nav = $('[data-nav]');
  const num = $('[data-nav-num]');
  const title = $('[data-nav-title]');
  const sections = $$('[data-section]');
  if (!nav || !sections.length) return;
  let current = -1;
  let ticking = false;

  const update = () => {
    ticking = false;
    const probe = window.innerHeight * 0.45;
    const navY = nav.offsetHeight / 2;
    let idx = 0;
    let theme = 'light';
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) idx = i;
      if (r.top <= navY && r.bottom > navY) {
        theme = s.dataset.theme ?? 'light';
        if (s.id === 'entrada' && heroProgress > 0.5) theme = 'dark';
      }
    });
    nav.classList.toggle('is-dark', theme === 'dark');
    nav.classList.toggle('is-scrolled', window.scrollY > 40 && !(heroProgress > 0 && heroProgress < 1));
    if (idx !== current && num && title) {
      current = idx;
      const s = sections[idx];
      num.textContent = String(idx + 1).padStart(2, '0');
      if (reduce) {
        title.textContent = s.dataset.title ?? '';
      } else {
        gsap.timeline()
          .to(title, { yPercent: -60, opacity: 0, duration: 0.2, ease: 'power2.in' })
          .add(() => (title.textContent = s.dataset.title ?? ''))
          .fromTo(title, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'expo.out' });
      }
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  lenis?.on('scroll', onScroll);
  update();
}

/* ───────── Arranque ───────── */
initMenu(scroll);
initExpand(scroll);
initDialogs(scroll);
initSlots();
initNavState();

const loaderDone = runLoader();
// Pedir explícitamente las fuentes del título antes de medirlo
const titleFonts = Promise.all([
  document.fonts.load('italic 300 100px "Fraunces Variable"'),
  document.fonts.load('620 100px "Fraunces Variable"'),
]).catch(() => undefined);
document.fonts.addEventListener('loadingdone', () => {
  fitLines();
  ScrollTrigger.refresh();
});
Promise.all([titleFonts, document.fonts.ready]).then(() => {
  fitLines();
  initSeam();
  initReveals();
  initHorizontal();
  initRoute();
  initBands();
  initRepel();
  ScrollTrigger.refresh();
  if (location.hash) {
    const target = $(location.hash);
    if (target) requestAnimationFrame(() => scroll.scrollTo(target, { immediate: true }));
  }
});
loaderDone.then(heroIntro);
