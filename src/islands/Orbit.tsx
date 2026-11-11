/**
 * The Library Orbit: the home page's signature picture.
 * Each subject is a world circling the library; each small moon around it is one lesson.
 * A spotlight slowly tours the worlds; pointing at one (or at its name below) wakes it up,
 * and clicking it opens that subject.
 *
 * Plain 2D canvas, no libraries. It pauses when off screen or in a background tab,
 * caps the pixel ratio for phones, and draws one calm still frame for reduced motion.
 * The canvas is decorative (aria-hidden): the subject links beside it carry the same choices.
 */
import { useEffect, useRef } from 'react';
import type { FolderItem } from '@lib/catalogue';

interface Props {
  subjects: FolderItem[];
  active: string | null; // subject path chosen outside the canvas (hovered name)
  onActive: (path: string | null) => void;
}

interface World {
  s: FolderItem;
  r: number; // orbit radius as a share of the canvas half-width
  phase: number;
  speed: number;
  size: number;
  colour: string;
  moons: number;
  glow: number; // 0..1, eased towards 1 when active
  x: number; y: number; depth: number; px: number; // last drawn position and pixel radius
}

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Orbit({ subjects, active, onActive }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<string | null>(active);
  activeRef.current = active;
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;
  const redraw = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = canvas.current!, box = wrap.current!;
    const ctx = el.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = subjects.length;

    // Colours come from the design tokens, so the picture follows light/dark mode and subject accents.
    const probe = document.createElement('span');
    probe.style.display = 'none';
    box.appendChild(probe);
    const tokens = { ink: '', ink3: '', line: '', paper: '', font: '' };
    const readColours = () => {
      const cs = getComputedStyle(box);
      tokens.ink = cs.getPropertyValue('--ink').trim();
      tokens.ink3 = cs.getPropertyValue('--ink-3').trim();
      tokens.line = cs.getPropertyValue('--line-2').trim();
      tokens.paper = cs.getPropertyValue('--paper').trim();
      tokens.font = cs.getPropertyValue('--font-heading').trim();
      worlds.forEach((w) => { probe.dataset.accent = w.s.accent; w.colour = getComputedStyle(probe).getPropertyValue('--accent').trim(); });
    };

    const worlds: World[] = subjects.map((s, i) => {
      const r = 0.24 + (0.72 * i) / Math.max(1, n - 1);
      return {
        s, r,
        phase: (i * 2.399) % TAU, // golden angle: worlds start nicely spread out
        speed: 0.05 / Math.pow(r + 0.2, 1.5), // outer worlds move slower, like real orbits
        size: 6 + Math.sqrt(s.count) * 2.4,
        colour: '', moons: Math.min(s.count, 28), glow: 0, x: 0, y: 0, depth: 0, px: 0,
      };
    });
    readColours();
    const themeWatch = new MutationObserver(readColours);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // A few faint stars, fixed per visit.
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + 0.3, tw: Math.random() * TAU }));

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      const rect = box.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      if (reduce || !running) draw(0.016, true);
    };

    // Pointer: a gentle parallax tilt, and the nearest world wakes up.
    let hover: string | null = null, mx = 0.5, my = 0.5, tx = 0, ty = 0, touched = false;
    const pick = (cx: number, cy: number) => {
      let best: World | null = null, bestD = Infinity;
      for (const wd of worlds) { const d = Math.hypot(wd.x - cx, wd.y - cy) - wd.px; if (d < bestD) { bestD = d; best = wd; } }
      return best && bestD < 28 ? best : null;
    };
    const local = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e);
      mx = x / w; my = y / h;
      if (e.pointerType !== 'mouse') return;
      const hit = pick(x, y);
      el.style.cursor = hit ? 'pointer' : 'default';
      if ((hit?.s.path ?? null) !== hover) { hover = hit?.s.path ?? null; onActiveRef.current(hover); }
      if (reduce) draw(0, true);
    };
    const onLeave = () => { mx = 0.5; my = 0.5; if (hover) { hover = null; onActiveRef.current(null); } el.style.cursor = 'default'; };
    const onClick = (e: PointerEvent) => {
      const [x, y] = local(e);
      const hit = pick(x, y);
      if (!hit) { if (e.pointerType !== 'mouse') { hover = null; onActiveRef.current(null); } return; }
      // Touch: the first tap wakes a world, a second tap opens it. Mouse: one click opens it.
      if (e.pointerType === 'mouse' || activeRef.current === hit.s.path) location.assign(hit.s.href);
      else { touched = true; hover = hit.s.path; onActiveRef.current(hit.s.path); }
      if (reduce) draw(0, true);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerup', onClick);

    // The spotlight tour: when nobody is pointing, a different world wakes every few seconds.
    let tour = 0, tourClock = 0;

    let t = 0;
    function draw(dt: number, still = false) {
      if (!w) return;
      t += dt;
      const wanted = activeRef.current ?? hover ?? (touched || reduce ? null : worlds.filter((x) => x.s.count)[tour]?.s.path ?? null);
      tx = lerp(tx, (mx - 0.5) * 14, still ? 1 : 0.06);
      ty = lerp(ty, (my - 0.5) * 10, still ? 1 : 0.06);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2 + tx, cy = h / 2 + ty;
      const tilt = 0.52;
      const R = Math.min(w * 0.46, (h / 2 - 34) / tilt); // largest orbit, in pixels // how flat the orbits look: a gentle 3D view from above
      const small = w < 420;

      // Stars
      for (const s of stars) {
        ctx.globalAlpha = 0.18 + 0.22 * Math.sin(t * 1.3 + s.tw) ** 2;
        ctx.fillStyle = tokens.ink3;
        ctx.beginPath(); ctx.arc(s.x * w + tx * 0.3, s.y * h + ty * 0.3, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Rings
      for (const wd of worlds) {
        const on = wd.s.path === wanted;
        ctx.beginPath();
        ctx.ellipse(cx, cy, wd.r * R, wd.r * R * tilt, 0, 0, TAU);
        ctx.strokeStyle = on ? wd.colour : tokens.line;
        ctx.globalAlpha = on ? 0.75 : 0.55;
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.setLineDash(wd.s.count ? [] : [3, 5]);
        ctx.stroke();
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      // Positions, then draw back-to-front so nearer worlds pass in front of further ones.
      for (const wd of worlds) {
        const a = wd.phase + t * wd.speed;
        wd.depth = Math.sin(a);
        wd.x = cx + Math.cos(a) * wd.r * R;
        wd.y = cy + Math.sin(a) * wd.r * R * tilt;
        wd.glow = lerp(wd.glow, wd.s.path === wanted ? 1 : 0, still ? 1 : 0.08);
        wd.px = wd.size * (1 + 0.22 * wd.depth) * (1 + 0.45 * wd.glow) * (small ? 0.8 : 1);
      }
      const order = [...worlds].sort((p, q) => p.depth - q.depth);
      const anyOn = worlds.some((x) => x.glow > 0.05);
      const drawCore = () => {
        const pulse = 1 + 0.06 * Math.sin(t * 1.6);
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22 * pulse);
        halo.addColorStop(0, tokens.ink3); halo.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.25; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 0.22 * pulse, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = tokens.ink; ctx.beginPath(); ctx.arc(cx, cy, small ? 5 : 7, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.strokeStyle = tokens.ink; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, (small ? 5 : 7) + 5 + 2 * Math.sin(t * 1.6), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      };
      let coreDrawn = false;
      for (const wd of order) {
        if (!coreDrawn && wd.depth > 0) { drawCore(); coreDrawn = true; }
        const dim = anyOn ? 0.35 + 0.65 * wd.glow : 0.9;
        // Moons: one per lesson, on a little tilted ring of their own.
        const mr = wd.px + 7 + 10 * wd.glow;
        for (let k = 0; k < wd.moons; k++) {
          const ma = (k / wd.moons) * TAU + t * (0.5 + 0.4 * wd.glow);
          ctx.globalAlpha = dim * (0.45 + 0.4 * wd.glow);
          ctx.fillStyle = wd.colour;
          ctx.beginPath(); ctx.arc(wd.x + Math.cos(ma) * mr, wd.y + Math.sin(ma) * mr * 0.55, 1.4 + 0.6 * wd.glow, 0, TAU); ctx.fill();
        }
        // Halo when awake
        if (wd.glow > 0.02) {
          const hg = ctx.createRadialGradient(wd.x, wd.y, 0, wd.x, wd.y, wd.px * 3.2);
          hg.addColorStop(0, wd.colour); hg.addColorStop(1, 'transparent');
          ctx.globalAlpha = 0.35 * wd.glow; ctx.fillStyle = hg;
          ctx.beginPath(); ctx.arc(wd.x, wd.y, wd.px * 3.2, 0, TAU); ctx.fill();
        }
        // The world itself, lit from the top left
        ctx.globalAlpha = dim;
        const body = ctx.createRadialGradient(wd.x - wd.px * 0.35, wd.y - wd.px * 0.4, wd.px * 0.1, wd.x, wd.y, wd.px);
        body.addColorStop(0, tokens.paper); body.addColorStop(0.25, wd.colour); body.addColorStop(1, wd.colour);
        ctx.fillStyle = wd.s.count ? body : 'transparent';
        ctx.beginPath(); ctx.arc(wd.x, wd.y, wd.px, 0, TAU); ctx.fill();
        if (!wd.s.count) { ctx.strokeStyle = wd.colour; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]); }
        // Label: the awake world always; the others only on roomy screens
        if (wd.glow > 0.05 || (!small && !anyOn)) {
          const big = wd.glow > 0.05;
          ctx.globalAlpha = big ? Math.min(1, wd.glow * 1.4) : 0.55;
          ctx.fillStyle = tokens.ink;
          ctx.font = `${big ? 700 : 600} ${big ? (small ? 14 : 16) : 12}px ${tokens.font}`;
          ctx.textAlign = 'center';
          const ly = wd.y - mr - (big ? 12 : 6);
          ctx.fillText(wd.s.title, wd.x, ly);
          if (big) {
            ctx.font = `600 ${small ? 11 : 12}px ${tokens.font}`;
            ctx.fillStyle = tokens.ink3;
            ctx.fillText(wd.s.count ? `${wd.s.count} lesson${wd.s.count === 1 ? '' : 's'}` : 'coming soon', wd.x, ly + (small ? 15 : 17));
          }
        }
      }
      if (!coreDrawn) drawCore();
      ctx.globalAlpha = 1;
    }

    // Animation loop: runs only while visible.
    let raf = 0, last = 0, running = false, onScreen = true;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      tourClock += dt;
      const lit = worlds.filter((x) => x.s.count);
      if (tourClock > 3.6 && lit.length) { tourClock = 0; tour = (tour + 1) % lit.length; }
      draw(dt);
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (running || reduce || !onScreen || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); });
    io.observe(box);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();
    start();
    redraw.current = () => { if (!running) draw(0, true); };

    return () => {
      stop(); io.disconnect(); ro.disconnect(); themeWatch.disconnect(); probe.remove();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); el.removeEventListener('pointerup', onClick);
    };
  }, [subjects]);

  // When no animation loop is running (reduced motion), redraw once whenever the outside choice changes.
  useEffect(() => {
    redraw.current?.();
  }, [active]);

  return (
    <div className="orbit" ref={wrap} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
