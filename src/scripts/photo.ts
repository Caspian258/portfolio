/*
  Passport photo carousel. One element, several images: every few seconds
  the next image fades in. It stops with the Pause button (mouse or keyboard),
  while keyboard focus or the pointer is on the controls, when the tab is
  hidden, and as soon as the visitor starts scrolling the intro.
*/
export interface Carousel {
  /** Freeze on the current image (scroll started) or release it. */
  freeze(on: boolean): void;
}

const INTERVAL = 3200;

export function initCarousel(): Carousel {
  const photo = document.querySelector<HTMLElement>('[data-photo]');
  const items = photo ? [...photo.querySelectorAll<HTMLImageElement>('[data-photo-item]')] : [];
  const noop: Carousel = { freeze: () => {} };
  if (!photo || items.length < 2) return noop;

  const idx = document.querySelector<HTMLElement>('[data-photo-idx]');
  const btn = document.querySelector<HTMLButtonElement>('[data-photo-toggle]');
  const glyph = document.querySelector<HTMLElement>('[data-photo-glyph]');
  const label = document.querySelector<HTMLElement>('[data-photo-label]');
  const ctrl = btn?.closest<HTMLElement>('.photo-ctrl') ?? null;

  let current = 0;
  let userPaused = false;
  let frozen = false;
  let hovered = false;
  let timer = 0;

  const show = (next: number) => {
    items[current].classList.remove('is-active');
    items[current].setAttribute('aria-hidden', 'true');
    current = next;
    items[current].classList.add('is-active');
    items[current].removeAttribute('aria-hidden');
    if (idx) idx.textContent = String(current + 1).padStart(2, '0');
  };

  const running = () => !userPaused && !frozen && !hovered && !document.hidden;
  const schedule = () => {
    window.clearTimeout(timer);
    if (running()) timer = window.setTimeout(() => (show((current + 1) % items.length), schedule()), INTERVAL);
  };

  const render = () => {
    if (!btn || !glyph || !label) return;
    label.textContent = (userPaused ? btn.dataset.labelResume : btn.dataset.labelPause) ?? '';
    glyph.textContent = userPaused ? '▶' : '‖';
  };

  btn?.addEventListener('click', () => {
    userPaused = !userPaused;
    render();
    schedule();
  });
  // Keyboard focus or pointer on the controls holds the current photo
  ctrl?.addEventListener('focusin', () => ((hovered = true), schedule()));
  ctrl?.addEventListener('focusout', () => ((hovered = false), schedule()));
  ctrl?.addEventListener('pointerenter', () => ((hovered = true), schedule()));
  ctrl?.addEventListener('pointerleave', () => ((hovered = false), schedule()));
  document.addEventListener('visibilitychange', schedule);

  schedule();
  return {
    freeze(on) {
      if (on === frozen) return;
      frozen = on;
      schedule();
    },
  };
}
