/*
  Loader (shown once per session): a text ring wound on the common thread,
  with the real loading percentage. At 100 % the ring rushes towards the
  camera and its centre opens onto the Intro.
*/
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { ScrollApi } from './ui';

gsap.registerPlugin(SplitText);

export function runLoader(scroll: ScrollApi, reduce: boolean): Promise<void> {
  const el = document.querySelector<HTMLElement>('[data-loader]');
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
    /* storage blocked: show the full loader */
  }

  const ringEl = el.querySelector<HTMLElement>('[data-ring]');
  const text = el.querySelector<HTMLElement>('[data-ring-text]');
  const pct = el.querySelector<HTMLElement>('[data-loader-pct]');
  const bar = el.querySelector<HTMLElement>('[data-loader-bar]');
  const tail = el.querySelector<SVGPathElement>('.loader__tail path');

  // Wind the characters around the ring
  let chars: HTMLElement[] = [];
  let spin: gsap.core.Tween | null = null;
  if (ringEl && text) {
    const split = SplitText.create(text, { type: 'chars', charsClass: 'ring-ch' });
    text.style.visibility = 'visible';
    chars = split.chars as HTMLElement[];
    const orbit = ringEl.querySelector<HTMLElement>('.loader__orbit');
    const r = (orbit?.offsetWidth ?? 320) / 2;
    const step = 360 / chars.length;
    chars.forEach((c, i) => {
      // SplitText leaves inline positioning; every character sits on the ring centre
      c.style.position = 'absolute';
      c.style.left = '0';
      c.style.top = '0';
      c.style.transform = `rotateY(${i * step}deg) translateZ(${r}px) translate(-50%, -50%)`;
    });
    const state = { a: 0 };
    let frame = 0;
    const shade = () => {
      if (frame++ % 3) return;
      chars.forEach((c, i) => {
        // characters on the far side of the ring are dimmer
        const z = Math.cos(((state.a + i * step) * Math.PI) / 180);
        c.style.opacity = String(0.28 + 0.72 * Math.max(0, z));
      });
    };
    spin = gsap.to(state, {
      a: -360,
      duration: 9,
      ease: 'none',
      repeat: -1,
      onUpdate: () => {
        gsap.set(ringEl, { rotationY: state.a });
        shade();
      },
    });
  }

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
    new Promise((res) => setTimeout(res, 3500)), // never wait too long
  ]);

  scroll.stop();
  // the tail uses a non-scaling stroke, so it is revealed with a clip, not a dash
  const tailSvg = tail?.ownerSVGElement;
  if (tailSvg) gsap.fromTo(tailSvg, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power2.inOut' });
  if (chars.length) gsap.from(chars, { opacity: 0, duration: 0.6, stagger: 0.012, ease: 'power1.out' });

  return new Promise((resolve) => {
    const ramp = gsap.to(state, { p: 88, duration: seen ? 0.4 : 0.9, ease: 'power2.out', onUpdate: render });
    Promise.all([ready, ramp.then()]).then(() => {
      gsap.to(state, {
        p: 100,
        duration: 0.25,
        ease: 'power1.inOut',
        onUpdate: render,
        onComplete: () => {
          const big = Math.hypot(window.innerWidth, window.innerHeight);
          gsap
            .timeline({
              onComplete: () => {
                spin?.kill();
                finish();
                scroll.start();
              },
            })
            .to(ringEl, { scale: 6, opacity: 0, duration: 0.8, ease: 'expo.inOut' }, 0)
            .to(el.querySelectorAll('.loader__meta, .loader__bar, .loader__tail'), { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0)
            .to(el, { '--hole': `${big}px`, duration: 0.8, ease: 'expo.inOut' }, 0.05)
            .add(() => resolve(), 0.15);
        },
      });
    });
  });
}
