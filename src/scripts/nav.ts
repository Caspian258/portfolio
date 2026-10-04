/*
  Top bar. Each item (logo, section counter, language + menu) reads the
  theme of whatever is drawn behind its own centre, so no item is ever dark
  on dark or light on light during a transition. When the translucent bar is
  showing, every item follows the bar instead.
*/
import { gsap } from 'gsap';

type Theme = 'light' | 'dark';

function themeAt(x: number, y: number, nav: HTMLElement): Theme {
  for (const n of document.elementsFromPoint(x, y)) {
    if (nav.contains(n)) continue;
    const owner = (n as HTMLElement).closest<HTMLElement>('[data-theme]');
    if (owner) return owner.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  return 'light';
}

interface NavOptions {
  reduce: boolean;
  /** Show the translucent bar? (false while a full-bleed moment is pinned) */
  barAllowed?: () => boolean;
  onScroll?: (cb: () => void) => void;
}

export function initNav({ reduce, barAllowed = () => true, onScroll }: NavOptions) {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return () => {};
  const items = [...nav.querySelectorAll<HTMLElement>('[data-nav-item]')];
  const num = nav.querySelector<HTMLElement>('[data-nav-num]');
  const title = nav.querySelector<HTMLElement>('[data-nav-title]');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  let current = -1;
  let ticking = false;

  const update = () => {
    ticking = false;
    const bar = window.scrollY > 40 && barAllowed();
    nav.classList.toggle('is-scrolled', bar);
    const navRect = nav.getBoundingClientRect();
    const cy = navRect.top + navRect.height / 2;
    if (bar) {
      const t = themeAt(navRect.left + navRect.width / 2, navRect.bottom + 1, nav);
      nav.classList.toggle('is-bar-dark', t === 'dark');
      items.forEach((it) => it.classList.toggle('is-dark', t === 'dark'));
    } else {
      nav.classList.remove('is-bar-dark');
      items.forEach((it) => {
        if (!it.offsetParent) return; // hidden on small screens
        const r = it.getBoundingClientRect();
        it.classList.toggle('is-dark', themeAt(r.left + r.width / 2, cy, nav) === 'dark');
      });
    }

    if (!num || !title || !sections.length) return;
    const probe = window.innerHeight * 0.45;
    let idx = 0;
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) idx = i;
    });
    if (idx === current) return;
    current = idx;
    const s = sections[idx];
    num.textContent = String(idx + 1).padStart(2, '0');
    if (reduce) {
      title.textContent = s.dataset.title ?? '';
      return;
    }
    gsap
      .timeline()
      .to(title, { yPercent: -50, opacity: 0, duration: 0.15, ease: 'power2.out' })
      .add(() => void (title.textContent = s.dataset.title ?? ''))
      .fromTo(title, { yPercent: 50, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'expo.out' });
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  onScroll?.(request);
  update();
  return request;
}
