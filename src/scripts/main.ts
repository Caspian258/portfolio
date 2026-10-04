/*
  Home page motion: smooth scroll, loader, the common thread from the Intro
  to About, section reveals, the Projects corridor, the Learning path signal,
  the Skills band and the Contact close. With reduced motion nothing scrubs
  or spins: transitions become short fades and the content stays put.
*/
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initDialogs, initExpand, initMenu, nativeScroll, prefersReduced, type ScrollApi } from './ui';
import { runLoader } from './loader';
import { LineField } from './field';
import { initCarousel } from './photo';
import { initIntro } from './intro';
import { initNav } from './nav';
import { initBand, initContact, initCorridor, initReveals, initRoute } from './sections';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduce = prefersReduced();
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);

/* ───────── Smooth scroll ───────── */
let lenis: Lenis | null = null;
let scroll: ScrollApi = nativeScroll;
let velocity = 0;

if (!reduce) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', (e: Lenis) => {
    velocity = e.velocity;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
    velocity *= 0.92; // settle when the wheel stops
  });
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
const getVelocity = () => velocity;

/* In-page links (#section) with smooth scroll */
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not([data-menu-link])').forEach((a) =>
  a.addEventListener('click', (e) => {
    const target = a.hash ? $(a.hash) : null;
    if (!target) return;
    e.preventDefault();
    scroll.scrollTo(target);
  }),
);

/* ───────── Start ───────── */
initMenu(scroll);
initExpand(scroll);
initDialogs(scroll);

const makeField = (sel: string, color: string, alpha: number, lines: number) => {
  const c = $<HTMLCanvasElement>(sel);
  return c ? new LineField(c, { lines, color, alpha, getVelocity, still: reduce }) : null;
};
const narrow = window.innerWidth < 768;
const heroField = makeField('[data-field="hero"]', '#3f5f8c', 0.26, narrow ? 6 : 9);
const contactField = makeField('[data-field="contact"]', '#9db3cf', 0.32, narrow ? 7 : 12);

const carousel = initCarousel();
let introPinned = false;
const loaderDone = runLoader(scroll, reduce);

// Run below-the-fold setup in short idle tasks so the main thread never blocks for long
const idle = (fn: () => void) =>
  new Promise<void>((resolve) => {
    const run = () => (fn(), resolve());
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 40);
  });

document.fonts.ready.then(async () => {
  const intro = initIntro({ reduce, finePointer, carousel, field: heroField });

  // No translucent bar while the Intro is pinned (it is a full-bleed moment)
  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: 'top top',
    end: () => `+=${$('[data-hero]')?.offsetHeight ?? 0}`,
    onToggle: (self) => (introPinned = self.isActive),
  });
  initNav({
    reduce,
    barAllowed: () => !introPinned,
    onScroll: (cb) => lenis?.on('scroll', cb),
  });
  loaderDone.then(() => intro.enter());

  // Below-the-fold sections are set up on the first sign of scrolling (or a
  // few seconds after the loader): a visitor who never scrolls pays nothing.
  let started = false;
  const setupSections = async () => {
    if (started) return;
    started = true;
    intro.arm();
    // The corridor goes first: its pin shifts everything below it, so the
    // triggers created afterwards already measure the final layout
    await idle(() => initCorridor(reduce));
    await idle(() => initRoute(reduce));
    await idle(() => initReveals(reduce));
    await idle(() => (initBand(reduce, getVelocity), initContact(contactField, reduce)));
    if (location.hash) {
      const target = $(location.hash);
      if (target) requestAnimationFrame(() => scroll.scrollTo(target, { immediate: true }));
    }
  };
  if (location.hash) {
    setupSections();
  } else {
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'] as const)
      window.addEventListener(type, setupSections, { once: true, passive: true });
    loaderDone.then(() => setTimeout(setupSections, 3500));
  }
});
