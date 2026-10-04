/*
  Intro: the entrance after the loader, the thread, and the scroll from the
  Intro to About.

  The passport photo is ONE element whose DOM home is the dock in About.
  While the Intro is pinned, About scrolls up underneath it and the photo is
  carried from the Intro slot to its dock (geometry from GSAP Flip). There is
  never a second copy of the photo on screen.
*/
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import type { Carousel } from './photo';
import type { LineField } from './field';

gsap.registerPlugin(ScrollTrigger, Flip);

interface IntroOptions {
  reduce: boolean;
  finePointer: boolean;
  carousel: Carousel;
  field: LineField | null;
}

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

export function initIntro({ reduce, finePointer, carousel, field }: IntroOptions) {
  const hero = $('[data-hero]');
  const stage = $('[data-hero-stage]');
  const slot = $('[data-photo-home]');
  const dock = $('[data-photo-dock]');
  const photo = $('[data-photo]');
  const ring = $('[data-hero-ring]');
  const svg = $<SVGSVGElement>('[data-hero-thread]');
  const path = $<SVGPathElement>('[data-hero-thread-path]');
  if (!hero || !stage || !slot || !dock || !photo || !ring || !svg || !path) return { enter: () => {}, arm: () => {} };

  const frame = $('.photo__frame', photo);
  const l1 = $$('.hero__ch', $('[data-hero-l1]') ?? hero);
  const l2 = $$('.hero__ch', $('[data-hero-l2]') ?? hero);
  const dims = $$('[data-hero-dim]', hero);
  const fades = $$('[data-hero-fade]', hero);
  const anns = $$('.hero__dim-ann, .hero__photo-ann', hero);
  const circles = $$('.hero__circle', hero);
  const aboutText = $('.about__text');
  const aboutRule = $('[data-about-rule]');

  /* ── The thread leaving the ring: geometry + a little tension near the cursor ── */
  const pull = { x: 0, y: 0 };
  let geo = { sx: 0, sy: 0, ex: 0, ey: 0 };
  const drawThread = () => {
    const { sx, sy, ex, ey } = geo;
    const dx = ex - sx;
    const dy = ey - sy;
    const mx = sx + 0.42 * dx + pull.x;
    const my = sy + 0.54 * dy + pull.y;
    path.setAttribute(
      'd',
      `M${sx} ${sy} C${sx} ${sy + 0.27 * dy} ${sx + 0.25 * dx + pull.x * 0.6} ${sy + 0.4 * dy + pull.y * 0.6} ${mx} ${my} S${sx + 0.86 * dx} ${sy + 0.85 * dy} ${ex} ${ey}`,
    );
  };
  const measureThread = () => {
    const s = stage.getBoundingClientRect();
    const r = ring.getBoundingClientRect();
    const R = r.width / 2;
    const narrow = s.width < 768;
    const cx = r.left - s.left + R;
    const cy = r.top - s.top + R;
    // keep clear of the foot text: on small screens the thread leaves from the
    // ring's right side and meets the edge above the foot
    const foot = $('.hero__foot', hero)?.getBoundingClientRect();
    const footTop = foot ? foot.top - s.top : s.height;
    geo = narrow
      ? { sx: cx + R, sy: cy, ex: s.width, ey: footTop - 28 }
      : { sx: cx, sy: cy + R, ex: s.width * 0.74, ey: s.height };
    svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
    drawThread();
  };

  if (finePointer && !reduce) {
    const qx = gsap.quickTo(pull, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.55)', onUpdate: drawThread });
    const qy = gsap.quickTo(pull, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.55)', onUpdate: drawThread });
    stage.addEventListener(
      'pointermove',
      (e) => {
        const s = stage.getBoundingClientRect();
        const px = e.clientX - s.left;
        const py = e.clientY - s.top;
        const mx = geo.sx + 0.42 * (geo.ex - geo.sx);
        const my = geo.sy + 0.54 * (geo.ey - geo.sy);
        const d = Math.hypot(px - mx, py - my);
        const f = Math.max(0, 1 - d / 260) ** 2;
        qx((px - mx) * 0.35 * f);
        qy((py - my) * 0.35 * f);
      },
      { passive: true },
    );
    stage.addEventListener('pointerleave', () => (qx(0), qy(0)));
  }

  /* ── Reduced motion: no pin, no scrub; the photo crossfades between homes ── */
  if (reduce) {
    slot.appendChild(photo);
    if (frame) frame.style.opacity = '0';
    let inDock = false;
    let busy = false;
    const move = (toDock: boolean) => {
      if (busy || toDock === inDock) return;
      busy = true;
      gsap.to(photo, {
        opacity: 0,
        duration: 0.15,
        ease: 'none',
        onComplete: () => {
          (toDock ? dock : slot).appendChild(photo);
          if (frame) frame.style.opacity = toDock ? '1' : '0';
          inDock = toDock;
          carousel.freeze(toDock);
          gsap.to(photo, { opacity: 1, duration: 0.2, ease: 'none', onComplete: () => void (busy = false) });
        },
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === dock && e.isIntersecting) move(true);
          if (e.target === hero && e.isIntersecting && e.intersectionRatio > 0.6) move(false);
        }
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    io.observe(dock);
    io.observe(hero);
    measureThread();
    window.addEventListener('resize', measureThread);
    return { enter: () => void gsap.from(stage, { opacity: 0, duration: 0.3, ease: 'none' }), arm: () => {} };
  }

  /* ── Motion: pinned Intro, photo carried to About with the scroll ── */
  let ctx: gsap.Context | null = null;
  let armed = false;
  let entrance: gsap.core.Timeline | null = null;
  gsap.set(photo, { visibility: 'hidden' });

  // Before any scrolling only the photo needs placing: it sits on the Intro slot
  const place = () => {
    ctx?.revert();
    ctx = null;
    gsap.set(photo, { clearProps: 'x,y,width,height' });
    measureThread();
    const at = Flip.fit(photo, slot, { scale: false, getVars: true }) as { x: number; y: number; width: number; height: number };
    gsap.set(photo, { x: at.x, y: at.y, width: at.width, height: at.height, visibility: 'visible' });
    if (frame) frame.style.opacity = '0';
  };

  const build = () => {
    entrance?.progress(1); // never record a half-finished entrance as the start state
    ctx?.revert();
    gsap.set(photo, { clearProps: 'x,y,width,height' });
    measureThread();

    ctx = gsap.context(() => {
      const H = hero.offsetHeight;
      // Where the photo has to be to sit exactly on the Intro slot (scroll 0)
      const start = Flip.fit(photo, slot, { scale: false, getVars: true }) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      const endW = dock.clientWidth;
      const endH = dock.clientHeight;
      const carry = { e: 0 };
      const frameState = { o: 0 };

      const apply = (p: number) => {
        const e = carry.e;
        gsap.set(photo, {
          x: (1 - e) * start.x,
          y: (1 - e) * (start.y + H) - (1 - p) * H,
          width: start.width + (endW - start.width) * e,
          height: start.height + (endH - start.height) * e,
          visibility: 'visible',
        });
        if (frame) frame.style.opacity = String(frameState.o);
        if (field) {
          field.opacity = gsap.utils.clamp(0, 1, 1 - (p - 0.08) / 0.4);
          field.draw();
        }
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: () => `+=${hero.offsetHeight}`,
          pin: true,
          pinSpacing: false,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => carousel.freeze(self.progress > 0.01),
        },
        onUpdate: () => apply(tl.progress()),
      });

      const half1 = (l1.length - 1) / 2;
      const half2 = (l2.length - 1) / 2;
      const vw = window.innerWidth;
      // 0 → 0.18: letters open up, dimensions retract, the ring closes into a frame
      tl.to(l1, { x: (i) => ((i - half1) / half1) * vw * 0.1, opacity: 0.45, duration: 0.18 }, 0)
        .to(l2, { x: (i) => ((i - half2) / half2) * vw * 0.06, opacity: 0.3, duration: 0.18 }, 0)
        .to(dims, { scaleX: 0.62, duration: 0.18 }, 0)
        .to(anns, { opacity: 0, duration: 0.12 }, 0)
        .to($$('.hero__foot', hero), { opacity: 0, y: -12, duration: 0.14 }, 0)
        // the ring closes onto the photo: transform + opacity only, the frame takes over
        .to(ring, { scale: (start.height + 20) / ring.offsetWidth, opacity: 0, duration: 0.17, ease: 'power2.inOut' }, 0)
        .to(frameState, { o: 1, duration: 0.09, ease: 'power1.out' }, 0.09)
        // 0.18 → 1: the photo travels to About, the Intro clears out
        .to(carry, { e: 1, duration: 0.82, ease: 'power2.inOut' }, 0.18)
        .to(l1, { x: (i) => ((i - half1) / half1) * vw * 0.42, opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.18)
        .to(l2, { x: (i) => ((i - half2) / half2) * vw * 0.3, opacity: 0, duration: 0.26, ease: 'power1.in' }, 0.18)
        .to(dims, { scaleX: 0, opacity: 0, duration: 0.2 }, 0.18)
        .to(fades, { opacity: 0, duration: 0.18 }, 0.2)
        .to(circles, { opacity: 0, duration: 0.3 }, 0.1)
        .to(svg, { opacity: 0, duration: 0.2 }, 0.16);
      // About's words arrive once the photo is almost home
      if (aboutText) tl.fromTo(aboutText, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' }, 0.74);
      if (aboutRule) tl.fromTo(aboutRule, { scaleX: 0 }, { scaleX: 1, duration: 0.16, ease: 'power2.inOut' }, 0.84);

      apply(0);
    }, hero);
  };

  // The pinned timeline is built on the first sign of scrolling (see main.ts)
  const arm = () => {
    if (armed) return;
    armed = true;
    build();
  };
  if (window.scrollY > 0) arm();
  else place();

  let lastW = window.innerWidth;
  let t = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    window.clearTimeout(t);
    t = window.setTimeout(() => {
      if (!armed) return place();
      build();
      ScrollTrigger.refresh();
    }, 180);
  });

  /* Entrance, right after the loader */
  const enter = () => {
    const len = path.getTotalLength();
    entrance = gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .from(l1, { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.035 }, 0.05)
      .from(l2, { yPercent: 80, opacity: 0, duration: 1.1, stagger: 0.025 }, 0.25)
      .fromTo(dims, { scaleX: 0 }, { scaleX: 1, duration: 1.1, clearProps: 'transform' }, 0.35)
      .from(ring, { scale: 0.9, opacity: 0, duration: 1, clearProps: 'scale' }, 0.3)
      .fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, 0.6)
      .from([...new Set([...anns, ...fades])], { opacity: 0, y: 8, duration: 0.8, stagger: 0.05, clearProps: 'transform' }, 0.7)
      .from(photo, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0.45);
  };

  return { enter, arm };
}
