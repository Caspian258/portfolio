/*
  Interface interactions that do not depend on scroll:
  menu, expandable details and project dialogs.
*/
import { gsap } from 'gsap';

export const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface ScrollApi {
  stop(): void;
  start(): void;
  scrollTo(target: HTMLElement | number, opts?: { immediate?: boolean }): void;
  refresh(): void;
}

/** Default scroll API (without Lenis). */
export const nativeScroll: ScrollApi = {
  stop: () => document.documentElement.classList.add('no-scroll'),
  start: () => document.documentElement.classList.remove('no-scroll'),
  scrollTo: (target, opts) => {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: opts?.immediate || prefersReduced() ? 'auto' : 'smooth' });
  },
  refresh: () => {},
};

/* ───────── Menu ───────── */
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
    if (prefersReduced()) {
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' });
    } else {
      gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'expo.inOut' });
      gsap.fromTo(links, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.035, delay: 0.15 });
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
    if (prefersReduced()) {
      gsap.to(menu, { opacity: 0, duration: 0.15, ease: 'none', onComplete: () => (gsap.set(menu, { clearProps: 'opacity' }), finish()) });
      return;
    }
    gsap.to(menu, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.35, ease: 'expo.inOut', onComplete: finish });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close(() => openBtn.focus());
    } else if (e.key === 'Tab') {
      // Keep focus inside the menu
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
      if (!target) return; // link to another page
      e.preventDefault();
      close(() => {
        scroll.scrollTo(target);
        history.replaceState(null, '', hash);
      });
    }),
  );
}

/* ───────── Animated <details> ───────── */
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
            duration: 0.35,
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
          duration: 0.25,
          ease: 'power3.out',
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

/* ───────── Project detail dialogs ───────── */
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
      if (prefersReduced()) {
        gsap.to(dlg, { opacity: 0, duration: 0.15, ease: 'none', onComplete: () => (gsap.set(dlg, { clearProps: 'opacity' }), done()) });
        return;
      }
      gsap.to(dlg, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.3, ease: 'expo.inOut', onComplete: done });
    };

    btn.addEventListener('click', () => {
      dlg.showModal();
      scroll.stop();
      if (prefersReduced()) {
        gsap.fromTo(dlg, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' });
      } else {
        gsap.fromTo(dlg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'expo.inOut' });
        if (inner) gsap.fromTo(inner.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.04, delay: 0.15 });
      }
    });
    dlg.querySelector('[data-dialog-close]')?.addEventListener('click', close);
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) close(); // click on the backdrop
    });
  });
}
