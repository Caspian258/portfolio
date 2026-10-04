/*
  Line field: thin lines on a 2D canvas that ripple with scroll velocity.
  `converge` (0..1) pulls every line into one horizontal thread at `targetY`,
  flattening the waves; Contact uses it to close the page.
  With reduced motion the field is drawn once, still.
*/
import { gsap } from 'gsap';

interface FieldOptions {
  lines: number;
  color: string;
  alpha: number;
  getVelocity: () => number;
  still: boolean;
}

export class LineField {
  converge = 0;
  targetY = 0.5; // fraction of the canvas height
  opacity = 1;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private amp = 0;
  private visible = false;
  private running = false;
  private t = 0;
  private readonly tick = (_time: number, dt: number) => this.frame(dt);

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: FieldOptions,
  ) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.sync();
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => this.sync());
  }

  private sync() {
    const go = this.visible && !document.hidden && !this.opts.still;
    if (go && !this.running) gsap.ticker.add(this.tick);
    if (!go && this.running) gsap.ticker.remove(this.tick);
    this.running = go;
    if (!go) this.draw();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = Math.max(1, Math.round(r.width));
    this.h = Math.max(1, Math.round(r.height));
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.draw();
  }

  /** Redraw now (used when converge or opacity change while still). */
  draw() {
    const { ctx, w, h, dpr, opts } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (this.opacity <= 0.001) return;
    const n = opts.lines;
    const c = this.converge;
    const ty = this.targetY * h;
    const base = Math.min(26, h * 0.05) * (1 - c);
    const amp = base + this.amp * (1 - c);
    const steps = Math.max(24, Math.round(w / 24));
    ctx.lineWidth = 1;
    ctx.strokeStyle = opts.color;
    ctx.globalAlpha = opts.alpha * this.opacity;
    for (let i = 0; i < n; i++) {
      const y0 = h * (0.06 + (0.88 * i) / Math.max(1, n - 1));
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const x = u * w;
        // a soft bulge in the middle, like a surface under tension
        const bulge = Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(i * 0.9 + this.t * 0.25));
        const wave = Math.sin(u * 5.2 + this.t * 0.6 + i * 0.55) * 0.35;
        const pull = c * (u * u * (3 - 2 * u)); // smoothstep: lines meet on the right
        const y = y0 + (bulge + wave) * amp * (0.6 + i / n);
        const yy = y + (ty - y) * Math.min(1, pull + c * 0.35);
        if (s === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private frame(dt: number) {
    const v = Math.min(Math.abs(this.opts.getVelocity()), 60);
    // the field only moves with the scroll: no velocity, no motion, no redraw
    if (v < 0.05 && this.amp < 0.05) return;
    this.amp += (v * 1.6 - this.amp) * Math.min(1, dt / 220);
    this.t += (dt / 1000) * Math.min(1, v / 6 + 0.15);
    this.draw();
  }
}
