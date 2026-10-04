/*
  Section motion: heading reveals (SplitText), the Projects corridor,
  the Learning path signal, the Skills band and the Contact close.
*/
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { LineField } from './field';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

/* ───────── Headings and short texts ───────── */
export function initReveals(reduce: boolean) {
  if (reduce) {
    // Reduced motion: a plain fade, no movement
    $$('[data-split], [data-reveal], [data-reveal-row]').forEach((el) =>
      gsap.from(el, { opacity: 0, duration: 0.3, ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
    );
    return;
  }
  const owned = (el: Element) => Boolean(el.closest('[data-about]')); // the intro animates About
  // Split each heading only when it is about to enter, and undo the split afterwards
  $$('[data-split]').filter((el) => !owned(el)).forEach((el) => {
    gsap.set(el, { opacity: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
        gsap.set(el, { opacity: 1 });
        gsap.from(split.lines, {
          yPercent: 105,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          onComplete: () => split.revert(),
        });
      },
    });
  });
  $$('[data-reveal]').filter((el) => !owned(el)).forEach((el) =>
    gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
  );
  const rows = $$('[data-reveal-row]');
  ScrollTrigger.batch(rows, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 18, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06 }),
  });
}

/* ───────── Projects: the perspective box ───────── */
export function initCorridor(reduce: boolean) {
  const section = $('#proyectos');
  const stage = $('[data-corridor]');
  const items = $$('[data-corridor-item]');
  const zOut = $('[data-corridor-z]');
  const thread = $('.corridor__thread');
  if (!section || !stage || !items.length || reduce) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    section.classList.add('is-corridor');
    const n = items.length;
    gsap.set(items, { xPercent: -50, yPercent: -50, z: -1400, opacity: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => `+=${n * window.innerHeight * 0.9}`,
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (!zOut) return;
          // live depth of the item currently arriving
          const local = (self.progress * n) % 1;
          const z = Math.round(-1200 * Math.max(0, 1 - local / 0.45));
          zOut.textContent = z === 0 ? '0' : `−${String(Math.abs(z)).padStart(4, '0')}`;
        },
      },
    });
    items.forEach((item, i) => {
      // arrive from the depth, hold, then pass by the camera
      tl.to(item, { z: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, i)
        .to(item, { z: 0, duration: 0.3 }, i + 0.45)
        .to(item, { z: 520, opacity: 0, duration: 0.25, ease: 'power2.in' }, i + 0.75);
    });
    // the last item stays
    tl.to(items[n - 1], { z: 0, opacity: 1, duration: 0.25 }, n - 0.25);
    if (thread) tl.fromTo(thread, { scaleY: 0.3 }, { scaleY: 1, duration: n }, 0);
    return () => {
      section.classList.remove('is-corridor');
      gsap.set(items, { clearProps: 'all' });
    };
  });
  mm.add('(max-width: 767px)', () => {
    items.forEach((item) =>
      // scale and lift only: content keeps full contrast at every step
      gsap.fromTo(
        item,
        { scale: 0.94, y: 32 },
        { scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 55%', scrub: true } },
      ),
    );
  });
}

/* ───────── Learning path: the thread as a step signal ───────── */
export function initRoute(reduce: boolean) {
  const track = $('[data-route]');
  const svg = $<SVGSVGElement>('[data-route-svg]');
  const done = $<SVGPathElement>('[data-route-done]');
  const future = $<SVGPathElement>('[data-route-future]');
  const steps = $$('[data-route-step]');
  if (!track || !svg || !done || !future || !steps.length) return;
  const lastLive = steps.reduce((acc, s, i) => (s.matches('.is-done, .is-progress') ? i : acc), 0);

  const draw = () => {
    const t = track.getBoundingClientRect();
    const pts = steps.map((s) => {
      const r = $('[data-route-node]', s)?.getBoundingClientRect();
      return r ? { x: r.left - t.left + r.width / 2, y: r.top - t.top + r.height / 2 } : { x: 0, y: 0 };
    });
    svg.setAttribute('viewBox', `0 0 ${t.width} ${t.height}`);
    const vertical = window.innerWidth < 900;
    let a = '';
    let b = '';
    if (vertical) {
      a = `M${pts[0].x} ${pts[0].y - 24} V${pts[lastLive].y}`;
      b = `M${pts[lastLive].x} ${pts[lastLive].y} V${pts[pts.length - 1].y + 24}`;
    } else {
      const left = -t.left; // start at the viewport edge
      const right = t.width + (window.innerWidth - t.right);
      // the live step owns its riser and tread: solid up to the next node
      const solidTo = Math.min(lastLive + 1, pts.length - 1);
      a = `M${left} ${pts[0].y} H${pts[0].x}`;
      for (let i = 1; i <= solidTo; i++) a += ` V${pts[i].y} H${pts[i].x}`;
      b = `M${pts[solidTo].x} ${pts[solidTo].y}`;
      for (let i = solidTo + 1; i < pts.length; i++) b += ` V${pts[i].y} H${pts[i].x}`;
      const lastBox = steps[steps.length - 1].getBoundingClientRect();
      b += ` V${lastBox.top - t.top - 18} H${right}`;
    }
    done.setAttribute('d', a);
    future.setAttribute('d', b);
  };
  draw();
  new ResizeObserver(draw).observe(track);
  if (reduce) return;

  const len = () => done.getTotalLength();
  gsap.fromTo(
    done,
    { strokeDasharray: () => len(), strokeDashoffset: () => len() },
    {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: track, start: 'top 75%', end: 'center 50%', scrub: 0.6, invalidateOnRefresh: true },
    },
  );
  gsap.fromTo(
    future,
    { opacity: 0 },
    { opacity: 1, ease: 'none', scrollTrigger: { trigger: track, start: 'center 70%', end: 'bottom 50%', scrub: 0.6 } },
  );
  steps.forEach((s) =>
    gsap.from(s, { opacity: 0, y: 16, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 85%', once: true } }),
  );
}

/* ───────── Skills: one band that runs with the scroll ───────── */
export function initBand(reduce: boolean, getVelocity: () => number) {
  const band = $('[data-band]');
  const track = $('[data-band-track]');
  if (!band || !track || reduce) return;
  let x = 0;
  let visible = false;
  let dir = 1;
  const setX = gsap.quickSetter(track, 'x', 'px');
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(band);
  gsap.ticker.add((_t, dt) => {
    if (!visible) return;
    const half = track.scrollWidth / 2;
    if (!half) return;
    const v = getVelocity();
    if (Math.abs(v) > 0.2) dir = Math.sign(v);
    const speed = 36 + Math.min(Math.abs(v) * 30, 900);
    x = gsap.utils.wrap(-half, 0, x - dir * speed * (dt / 1000));
    setX(x);
  });
}

/* ───────── Contact: every line ends in one thread ───────── */
export function initContact(field: LineField | null, reduce: boolean) {
  const section = $('[data-contact]');
  const thread = $('[data-contact-thread]');
  if (!section || !thread || !field) return;
  const place = () => {
    const s = section.getBoundingClientRect();
    const t = thread.getBoundingClientRect();
    field.targetY = (t.top - s.top + t.height / 2) / s.height;
    field.draw();
  };
  place();
  new ResizeObserver(place).observe(section);
  if (reduce) {
    field.converge = 1;
    field.draw();
    return;
  }
  const state = { c: 0 };
  gsap.to(state, {
    c: 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 75%', end: 'center 55%', scrub: 0.6 },
    onUpdate: () => {
      field.converge = state.c;
      field.draw();
    },
  });
  gsap.from(thread, { scaleX: 0, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: thread, start: 'top 85%', once: true } });
}
