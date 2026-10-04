/*
  Interacciones de interfaz que no dependen del scroll:
  menú, desplegables, diálogos de proyecto y huecos con foto.
*/
import { gsap } from 'gsap';

export const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface ScrollApi {
  stop(): void;
  start(): void;
  scrollTo(target: HTMLElement | number, opts?: { immediate?: boolean }): void;
  refresh(): void;
}

/** API de scroll por defecto (sin Lenis). */
export const nativeScroll: ScrollApi = {
  stop: () => document.documentElement.classList.add('no-scroll'),
  start: () => document.documentElement.classList.remove('no-scroll'),
  scrollTo: (target, opts) => {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: opts?.immediate || prefersReduced() ? 'auto' : 'smooth' });
  },
  refresh: () => {},
};

/* ───────── Menú ───────── */
export function initMenu(scroll: ScrollApi) {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const closeBtn = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (!menu || !openBtn || !closeBtn) return;
  const links = [...menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]')];

  const open = () => {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    scroll.stop();
    if (!prefersReduced()) {
      gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' });
      gsap.fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.04, delay: 0.25 });
    }
    links[0]?.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey);
  };
  const close = (after?: () => void) => {
    const finish = () => {
      menu.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      scroll.start();
      document.removeEventListener('keydown', onKey);
      after?.();
    };
    if (prefersReduced()) return finish();
    gsap.to(menu, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.55, ease: 'expo.inOut', onComplete: finish });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close(() => openBtn.focus());
    } else if (e.key === 'Tab') {
      // Mantener el foco dentro del menú
      const focusables = [...links, closeBtn];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', () => close(() => openBtn.focus()));
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      const hash = a.hash;
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (!target) return; // enlace a otra página
      e.preventDefault();
      close(() => {
        scroll.scrollTo(target);
        history.replaceState(null, '', hash);
      });
    }),
  );
}

/* ───────── Desplegables <details> animados ───────── */
export function initExpand(scroll: ScrollApi) {
  document.querySelectorAll<HTMLDetailsElement>('details[data-expand]').forEach((det) => {
    const summary = det.querySelector('summary');
    const body = det.querySelector<HTMLElement>('.x-expand__body');
    if (!summary || !body) return;
    let busy = false;
    summary.addEventListener('click', (e) => {
      if (prefersReduced()) {
        requestAnimationFrame(() => scroll.refresh());
        return;
      }
      e.preventDefault();
      if (busy) return;
      busy = true;
      if (!det.open) {
        det.open = true;
        gsap.fromTo(
          body,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: 0.6,
            ease: 'expo.out',
            onComplete: () => {
              gsap.set(body, { clearProps: 'height,opacity' });
              busy = false;
              scroll.refresh();
            },
          },
        );
      } else {
        gsap.to(body, {
          height: 0,
          opacity: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          onComplete: () => {
            det.open = false;
            gsap.set(body, { clearProps: 'height,opacity' });
            busy = false;
            scroll.refresh();
          },
        });
      }
    });
  });
}

/* ───────── Diálogos de detalle de proyecto ───────── */
export function initDialogs(scroll: ScrollApi) {
  document.querySelectorAll<HTMLButtonElement>('[data-dialog-open]').forEach((btn) => {
    const dlg = document.getElementById(btn.dataset.dialogOpen ?? '') as HTMLDialogElement | null;
    if (!dlg) return;
    const inner = dlg.querySelector<HTMLElement>('.dlg__inner');

    const close = () => {
      const done = () => {
        dlg.close();
        scroll.start();
        btn.focus();
      };
      if (prefersReduced()) return done();
      gsap.to(dlg, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.5, ease: 'expo.inOut', onComplete: done });
    };

    btn.addEventListener('click', () => {
      dlg.showModal();
      scroll.stop();
      if (!prefersReduced()) {
        gsap.fromTo(dlg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut' });
        if (inner) gsap.fromTo(inner.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.3 });
      }
    });
    dlg.querySelector('[data-dialog-close]')?.addEventListener('click', close);
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) close(); // clic en el fondo
    });
  });
}

/* ───────── Hueco que revela fotos ───────── */
export function initSlots() {
  document.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach((slot) => {
    const items = [...slot.querySelectorAll<HTMLElement>('[data-slot-item]')];
    let i = 0;
    slot.addEventListener('click', () => {
      slot.classList.add('is-open');
      items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    });
    slot.addEventListener('mouseleave', () => slot.classList.remove('is-open'));
  });
}
