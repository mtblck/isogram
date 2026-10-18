/* isogram runtime — animated isometric feature diagrams in several looks.
   One scene description (a pure draw(g, k) function of time) renders as:
     glow (hairline + accent glow), vector (clean flat fills), pixel (2:1 pixel art), blueprint.
   Delivers a <iso-gram> custom element (shadow DOM, drop into any page) and exports
   PNG, GIF, SVG, WebM and a contact sheet from the same renderer.
   Kernel and glow vocabulary after iso-glow / iso-figure (MIT). */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.ISOGRAM) return;

  /* ---------------- colour ---------------- */
  const hexRgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgbHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const MIX = new Map();
  const mix = (a, b, t) => {
    if (!(t > 0)) return a; if (t >= 1) return b;
    t = Math.round(t * 48) / 48; const key = a + b + t; let v = MIX.get(key);
    if (!v) { const A = hexRgb(a), B = hexRgb(b); v = rgbHex(A.map((x, i) => x + (B[i] - x) * t)); MIX.set(key, v); }
    return v;
  };
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---------------- projection ---------------- */
  const PROJ = {
    iso: { C: Math.cos(Math.PI / 6), S: 0.5, Z: 1 },        // true isometric, 30°
    dimetric: { C: 1, S: 0.5, Z: 1.1 },                     // 2:1 pixel-art isometric
  };
  const proj = (pr, p) => [(p[0] - p[1]) * pr.C, (p[0] + p[1]) * pr.S - p[2] * pr.Z];

  /* ---------------- 3x5 bitmap font (pixel look) ---------------- */
  const FONT = {};
  'A2575 B6565 C3444 D6555 E7464 F7464 G3455 H5575 I7227 J1115 K5565 L4444 M5775 N6555 O2555 P6564 Q2556 R6565 S3421 T7222 U5555 V5555 W5577 X5525 Y5522 Z7124 07555 12622 26124 36121 45571 57461 63475 77122 87575 97571'
    .split(' ').forEach(s => { FONT[s[0]] = s.slice(1).split('').map(Number); });
  // last rows (5th) for the glyphs above
  const LAST = { A:5,B:6,C:3,D:6,E:7,F:4,G:3,H:5,I:7,J:2,K:5,L:7,M:5,N:5,O:2,P:4,Q:3,R:5,S:6,T:2,U:7,V:2,W:5,X:5,Y:2,Z:7,
    0:7,1:7,2:7,3:6,4:1,5:6,6:7,7:2,8:7,9:6 };
  Object.keys(LAST).forEach(k => FONT[k].push(LAST[k]));
  Object.assign(FONT, { ' ': [0,0,0,0,0], '.': [0,0,0,0,2], ':': [0,2,0,2,0], '-': [0,0,7,0,0], '+': [0,2,7,2,0], '/': [1,1,2,4,4],
    '>': [4,2,1,2,4], '<': [1,2,4,2,1], '%': [5,1,2,4,5], '#': [5,7,5,7,5], '!': [2,2,2,0,2], '?': [6,1,2,0,2], '(': [1,2,2,2,1],
    ')': [4,2,2,2,4], '=': [0,7,0,7,0], '_': [0,0,0,0,7], ',': [0,0,0,2,4], "'": [2,2,0,0,0], '*': [5,2,7,2,5], '·': [0,0,2,0,0],
    '@': [7,5,7,4,3], '$': [3,6,2,3,6], '&': [2,5,2,5,3], '[': [3,2,2,2,3], ']': [6,2,2,2,6], '"': [5,5,0,0,0], '→': [0,2,7,2,0] });
  FONT['→'] = [0, 1, 7, 1, 0]; FONT['…'] = [0, 0, 0, 0, 5];
  const glyph = c => FONT[c] || FONT[String(c).toUpperCase()] || FONT['?'];
  const bitmapWidth = s => Math.max(0, s.length * 4 - 1);

  /* ---------------- looks (styles) ---------------- */
  // Each look: projection, fonts, line widths, and themes. Theme colours are hex only.
  // face: tone -> [top, front(+y, lower-left), side(+x, lower-right)]
  const LOOKS = {
    glow: {
      label: 'Glow', proj: 'iso', font: '"DM Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace', caps: true,
      stroke: true, lw: 1, wireW: 1.1, packetW: 2.4, seam: false, default: 'dark',
      themes: {
        dark: { glow: true, bg: '#0c0d0e', panel: '#141516', line: '#222426', edge: '#3d4144', edgeHi: '#5c6166', detail: '#2b2e30',
          recess: '#0e0f10', glass: '#0f1011', ink: '#868b8f', inkHi: '#e6e8e9', wire: '#3d4144', term: '#4a4e52', shadow: null,
          face: { lo: ['#18191b', '#151617', '#151617'], mid: ['#1b1d1f', '#17181a', '#17181a'], hi: ['#212326', '#1b1c1e', '#1b1c1e'] },
          accent: '#ff7a1a', accentHi: '#ffb070', glassOn: 0.16, halo: 0.24 },
        light: { glow: false, bg: '#e9eaea', panel: '#f6f6f5', line: '#d6d8d8', edge: '#8e9397', edgeHi: '#5d6266', detail: '#c3c6c8',
          recess: '#e2e4e4', glass: '#dcdede', ink: '#6a6f73', inkHi: '#16181a', wire: '#8e9397', term: '#8e9397', shadow: null,
          face: { lo: ['#efefee', '#e6e7e6', '#e6e7e6'], mid: ['#f3f3f2', '#ececeb', '#ececeb'], hi: ['#fafaf9', '#f1f1f0', '#f1f1f0'] },
          accent: '#ff7a1a', accentHi: '#ffb070', glassOn: 0.14, halo: 0 },
      },
    },
    vector: {
      label: 'Vector', proj: 'iso', font: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', caps: false,
      stroke: false, rim: true, lw: 1, wireW: 2.6, packetW: 3.4, seam: true, soft: true, default: 'light',
      themes: {
        light: { glow: false, bg: '#f3f2ee', panel: '#fbfaf7', line: '#e6e3dc', edge: '#d9d5cc', edgeHi: '#c9c4b9', detail: '#d3cfc6',
          recess: '#d9d5cb', glass: '#2a2e37', ink: '#7a7d84', inkHi: '#1d2026', wire: '#d0ccc2', term: '#bdb8ad', shadow: '#2a2418', shadowA: 0.13,
          face: { lo: ['#ebe8e1', '#dcd8cf', '#cdc8bd'], mid: ['#ffffff', '#ebe9e3', '#dad6ce'], hi: ['#ffffff', '#efede8', '#e0ddd6'] },
          accent: '#5b5bf0', accentHi: '#9d9dff', glassOn: 0.22, halo: 0.18, rim: '#ffffff' },
        dark: { glow: false, bg: '#101217', panel: '#15181e', line: '#232731', edge: '#323845', edgeHi: '#454d5d', detail: '#2c313c',
          recess: '#0f1116', glass: '#0b0d11', ink: '#7d8491', inkHi: '#eef0f4', wire: '#343a47', term: '#454c5a', shadow: '#000000', shadowA: 0.35,
          face: { lo: ['#262a33', '#1e222a', '#181b22'], mid: ['#323743', '#272b35', '#1f222a'], hi: ['#3c4250', '#2e333e', '#252932'] },
          accent: '#7c7cff', accentHi: '#b7b7ff', glassOn: 0.25, halo: 0.22, rim: '#58607a' },
      },
    },
    pixel: {
      label: 'Pixel', proj: 'dimetric', font: 'bitmap', caps: true, pixel: { width: 320 },
      stroke: true, lw: 1, wireW: 1, packetW: 2, seam: false, default: 'dark',
      themes: {   // after the Sweetie 16 palette by GrafxKid
        dark: { glow: false, bg: '#1a1c2c', panel: '#1a1c2c', line: '#333c57', edge: '#0d0e17', edgeHi: '#0d0e17', detail: '#333c57',
          recess: '#29366f', glass: '#1a1c2c', label: '#1a1c2c', ink: '#94b0c2', inkHi: '#f4f4f4', wire: '#566c86', term: '#94b0c2', shadow: '#10111c', shadowA: 1,
          face: { lo: ['#566c86', '#333c57', '#29366f'], mid: ['#94b0c2', '#566c86', '#333c57'], hi: ['#f4f4f4', '#94b0c2', '#566c86'] },
          accent: '#ef7d57', accentHi: '#ffcd75', litSide: '#b13e53', glassOn: 0.35, halo: 0.5 },
        light: { glow: false, bg: '#f4f4f4', panel: '#f4f4f4', line: '#94b0c2', edge: '#1a1c2c', edgeHi: '#1a1c2c', detail: '#94b0c2',
          recess: '#566c86', glass: '#333c57', label: '#1a1c2c', ink: '#566c86', inkHi: '#1a1c2c', wire: '#566c86', term: '#333c57', shadow: '#94b0c2', shadowA: 1,
          face: { lo: ['#94b0c2', '#566c86', '#333c57'], mid: ['#f4f4f4', '#94b0c2', '#566c86'], hi: ['#ffffff', '#c9d6de', '#94b0c2'] },
          accent: '#ef7d57', accentHi: '#ffcd75', litSide: '#b13e53', glassOn: 0.35, halo: 0.5 },
      },
    },
    blueprint: {
      label: 'Blueprint', proj: 'iso', font: '"DM Mono", ui-monospace, Menlo, Consolas, monospace', caps: true,
      stroke: true, lw: 1, wireW: 1.1, packetW: 2.4, seam: false, default: 'dark',
      themes: {
        dark: { glow: false, bg: '#0f3460', panel: '#123d70', line: '#2a5a92', edge: '#cfe0f5', edgeHi: '#ffffff', detail: '#4f7fb8',
          recess: '#0f3460', glass: '#0f3460', ink: '#9fbde3', inkHi: '#ffffff', wire: '#9fbde3', term: '#cfe0f5', shadow: null,
          face: { lo: ['#123d70', '#123d70', '#123d70'], mid: ['#143f74', '#123d70', '#123d70'], hi: ['#174479', '#143f74', '#143f74'] },
          accent: '#ffd166', accentHi: '#fff1c4', glassOn: 0.25, halo: 0 },
        light: { glow: false, bg: '#eef3fa', panel: '#f8fbff', line: '#d3e0f0', edge: '#1f4f8f', edgeHi: '#0f3460', detail: '#9ab6da',
          recess: '#e3ecf7', glass: '#e3ecf7', ink: '#4f6f99', inkHi: '#0f3460', wire: '#1f4f8f', term: '#1f4f8f', shadow: null,
          face: { lo: ['#f2f6fc', '#f2f6fc', '#f2f6fc'], mid: ['#f8fbff', '#f8fbff', '#f8fbff'], hi: ['#ffffff', '#ffffff', '#ffffff'] },
          accent: '#e4572e', accentHi: '#f39a7c', glassOn: 0.15, halo: 0 },
      },
    },
  };

  // resolve a theme: derive lit tones from the accent (optionally overridden by the page)
  function themeOf(lookName, themeName, accent) {
    const L = LOOKS[lookName] || LOOKS.glow, base = L.themes[themeName] || L.themes[L.default];
    const T = Object.assign({}, base);
    if (accent) { T.accent = accent; T.accentHi = mix(accent, '#ffffff', 0.45); T.litSide = null; }
    T.litTop = T.litTop || mix(T.accent, T.accentHi, 0.75);
    T.litFront = T.litFront || T.accent;
    T.litSide = T.litSide || mix(T.accent, '#000000', 0.2);
    T.glassLit = mix(T.glass, T.accent, T.glassOn);
    // text engraved into a lit part: whichever of the page bg / white contrasts more with the lit top
    const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
    const con = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    T.engraveLit = T.engraveLit || (con(T.bg, T.litTop) >= con('#ffffff', T.litTop) ? T.bg : '#ffffff');
    return T;
  }
  function paletteOf(T) {   // every colour a pixel-look frame may use
    const out = new Set();
    const walk = v => { if (typeof v === 'string' && v[0] === '#') out.add(v.toLowerCase()); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(T); return [...out];
  }

  /* ---------------- scene builder (the `g` a diagram draws with) ---------------- */
  const H = Math.PI / 2, Q = Math.PI / 4;
  const arc = (cx, cy, r, a0, a1, n = 8) => { if (r <= 0) return [[cx, cy]]; const o = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
  const rr2 = (x, y, w, h, r, n = 5) => { r = Math.min(r, w / 2, h / 2); if (r <= 0) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    return [...arc(x + w - r, y + r, r, -H, 0, n), ...arc(x + w - r, y + h - r, r, 0, H, n), ...arc(x + r, y + h - r, r, H, 2 * H, n), ...arc(x + r, y + r, r, 2 * H, 3 * H, n)]; };
  const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function route(pts) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    const len = cum[cum.length - 1] || 1;
    const at = u => { const s = Math.max(0, Math.min(1, u)) * len; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const seg = cum[i] - cum[i - 1] || 1; return lerp3(pts[i - 1], pts[i], (s - cum[i - 1]) / seg); };
    const part = (u0, u1) => { u0 = Math.max(0, u0); u1 = Math.min(1, u1); if (u1 <= u0) return null;
      const s0 = u0 * len, s1 = u1 * len, o = [at(u0)]; for (let i = 1; i < pts.length - 1; i++) if (cum[i] > s0 && cum[i] < s1) o.push(pts[i]); o.push(at(u1)); return o; };
    return { pts, len, at, part, start: pts[0], end: pts[pts.length - 1] };
  }
  // round the corners of a 3D polyline (radius in world units)
  function fillet(pts, r) {
    if (!r || pts.length < 3) return pts; const o = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], a = pts[i - 1], b = pts[i + 1], la = dist(a, p), lb = dist(p, b), rr = Math.min(r, la / 2, lb / 2);
      const A = lerp3(p, a, rr / la), B = lerp3(p, b, rr / lb);
      for (let k = 0; k <= 6; k++) { const t = k / 6; o.push(lerp3(lerp3(A, p, t), lerp3(p, B, t), t)); }
    }
    o.push(pts[pts.length - 1]); return o;
  }

  function builder(look) {
    const L = []; let readout = '';
    const push = p => { L.push(p); return p; };
    const opt = o => o || {};
    const sty = o => ({ tone: o.tone || 'mid', lit: o.lit || 0, op: o.op == null ? 1 : o.op });

    function plane(kind, O, W, Hh) {
      const U = kind === 'top' ? [1, 0, 0] : kind === 'front' ? [1, 0, 0] : [0, -1, 0];
      const V = kind === 'top' ? [0, 1, 0] : [0, 0, -1];
      const P3 = (u, v) => add(add(O, U, u), V, v);
      const pl = {
        kind, w: W, h: Hh, O, U, V, at: P3,
        rect(u, v, w, h, o) { o = opt(o); push({ k: 'poly', pts: rr2(u, v, w, h, o.r || 0).map(([a, b]) => P3(a, b)), role: o.role || kind, ...sty(o), edge: o.edge }); return pl; },
        recess(u, v, w, h, o) { return pl.rect(u, v, w, h, Object.assign({ role: 'recess' }, o)); },
        glass(u, v, w, h, o) { o = opt(o); if (o.lit && o.halo !== false) push({ k: 'halo', pts: rr2(u - 2, v - 2, w + 4, h + 4, (o.r || 0) + 2).map(([a, b]) => P3(a, b)), lit: o.lit });
          return pl.rect(u, v, w, h, Object.assign({}, o, { role: 'glass' })); },
        circle(u, v, r, o) { o = opt(o); push({ k: 'poly', pts: arc(u, v, r, 0, 4 * H, 20).map(([a, b]) => P3(a, b)), role: o.role || 'recess', ...sty(o) }); return pl; },
        led(u, v, r, lit) { if (lit) push({ k: 'bloom', p: P3(u, v), r: r * 5, lit }); return pl.circle(u, v, r, { role: 'led', lit }); },
        line(u0, v0, u1, v1, o) { o = opt(o); push({ k: 'line', pts: [P3(u0, v0), P3(u1, v1)], role: o.role || 'detail', ...sty(o), w: o.w }); return pl; },
        slits(a0, a1, step, b0, b1, vertical = true, o) { for (let a = a0; a <= a1 + 1e-6; a += step) vertical ? pl.line(a, b0, a, b1, o) : pl.line(b0, a, b1, a, o); return pl; },
        text(u, v, str, o) { o = opt(o); const room = o.max || (W > 0 ? (o.align === 'center' ? 2 * Math.min(u, W - u) : o.align === 'right' ? u : W - u) - 2 : 0);
          push({ k: 'text', O: P3(u, v), U, V, str: String(str), max: room > 0 ? room : 0, pixel: o.pixel, size: o.size || 7, align: o.align || 'left', weight: o.weight || 500, role: o.role || 'ink', lit: o.lit || 0, op: o.op == null ? 1 : o.op }); return pl; },
        screws(inset = 6, r = 1.6) { [[inset, inset], [W - inset, inset], [inset, Hh - inset], [W - inset, Hh - inset]].forEach(([a, b]) => { pl.circle(a, b, r, { role: 'screw' }); }); return pl; },
        clip(u, v, w, h, r, fn) { push({ k: 'clip', pts: rr2(u, v, w, h, r || 0).map(([a, b]) => P3(a, b)) }); fn(pl); push({ k: 'unclip' }); return pl; },
        sub(u, v, w, h) { return plane(kind, P3(u, v), w, h); },
      };
      return pl;
    }
    const handle = (x, y, z, w, d, h) => ({
      x, y, z, w, d, h, c: [x + w / 2, y + d / 2, z + h / 2],
      top: plane('top', [x, y, z + h], w, d), front: plane('front', [x, y + d, z + h], w, h), side: plane('side', [x + w, y + d, z + h], d, h),
      at: (fx, fy, fz) => [x + w * fx, y + d * fy, z + h * fz],
    });

    function box(x, y, z, w, d, h, o) {
      o = opt(o); const r = Math.min(o.r || 0, w / 2, d / 2), z1 = z + h, s = sty(o);
      let side, front, ring;
      if (r > 0) {
        side = [...arc(x + w - r, y + r, r, -Q, 0, 5), ...arc(x + w - r, y + d - r, r, 0, Q, 5)];
        front = [...arc(x + w - r, y + d - r, r, Q, H, 5), ...arc(x + r, y + d - r, r, H, 3 * Q, 5)];
        ring = rr2(x, y, w, d, r);
      } else { side = [[x + w, y], [x + w, y + d]]; front = [[x + w, y + d], [x, y + d]]; ring = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]]; }
      const wall = pts => [...pts.map(([a, b]) => [a, b, z]), ...pts.slice().reverse().map(([a, b]) => [a, b, z1])];
      if (o.shadow) shadow(x, y, w, d, { r, z, lift: o.shadow === true ? 0 : o.shadow });
      if (h > 0) {
        push({ k: 'poly', pts: wall(side), role: 'side', ...s, edge: false });
        push({ k: 'poly', pts: wall(front), role: 'front', ...s, edge: false });
        push({ k: 'poly', pts: wall([...side, ...front.slice(1)]), role: 'edge', ...s });
        if (r === 0) push({ k: 'line', pts: [[x + w, y + d, z], [x + w, y + d, z1]], role: 'edge', ...s });
      }
      push({ k: 'poly', pts: ring.map(([a, b]) => [a, b, z1]), role: o.topRole || 'top', ...s });
      if (h > 0) push({ k: 'line', pts: [...side, ...front.slice(1)].map(([a, b]) => [a, b, z1]), role: 'rim', ...s });
      return handle(x, y, z, w, d, h);
    }
    function cyl(cx, cy, z, r, h, o) {
      o = opt(o); const s = sty(o), z1 = z + h;
      const wall = pts => [...pts.map(([a, b]) => [a, b, z]), ...pts.slice().reverse().map(([a, b]) => [a, b, z1])];
      if (o.shadow) shadow(cx - r, cy - r, 2 * r, 2 * r, { r, z });
      if (h > 0) {
        push({ k: 'poly', pts: wall(arc(cx, cy, r, -Q, Q, 12)), role: 'side', ...s, edge: false });
        push({ k: 'poly', pts: wall(arc(cx, cy, r, Q, 3 * Q, 12)), role: 'front', ...s, edge: false });
        push({ k: 'poly', pts: wall(arc(cx, cy, r, -Q, 3 * Q, 24)), role: 'edge', ...s });
      }
      push({ k: 'poly', pts: arc(cx, cy, r, 0, 4 * H, 40).map(([a, b]) => [a, b, z1]), role: o.topRole || 'top', ...s });
      if (h > 0) push({ k: 'line', pts: arc(cx, cy, r, -Q, 3 * Q, 24).map(([a, b]) => [a, b, z1]), role: 'rim', ...s });
      const hd = handle(cx - r, cy - r, z, 2 * r, 2 * r, h); hd.r = r; hd.top = plane('top', [cx - r, cy - r, z1], 2 * r, 2 * r);
      hd.ring = (rad, o2) => { o2 = opt(o2); push({ k: 'poly', pts: arc(cx, cy, rad, 0, 4 * H, 40).map(([a, b]) => [a, b, z1]), role: o2.role || 'recess', ...sty(o2) }); };
      return hd;
    }
    function shadow(x, y, w, d, o) {
      o = opt(o); const z = o.z || 0, off = 4 + (o.lift || 0) * 0.5;
      push({ k: 'shadow', pts: rr2(x + off, y + off, w, d, o.r || 0).map(([a, b]) => [a, b, z]), blur: 6 + (o.lift || 0) * 0.3 });
    }
    function plate(x, y, z, w, d, h, o) {
      o = Object.assign({ r: 12, tone: 'lo' }, opt(o)); const b = box(x, y, z, w, d, h, o);
      const ins = o.inset == null ? 8 : o.inset;
      if (ins) b.top.rect(ins, ins, w - 2 * ins, d - 2 * ins, { r: Math.max(0, o.r - ins / 2), role: 'detail-rect' });
      if (o.screws !== false) b.top.screws(ins + 7, 2);
      return b;
    }
    function wire(pts, o) {
      o = opt(o); const p = fillet(pts, o.round == null ? 6 : o.round);
      push({ k: 'line', pts: p, role: 'wire', lit: o.lit || 0, w: o.w, op: o.op == null ? 1 : o.op, under: o.under !== false });
      if (o.ends !== false) { term(p[0], o.lit); term(p[p.length - 1], o.lit); }
      return route(p);
    }
    function term(p, lit, r) { push({ k: 'dot', p, r: r || 1.8, role: 'term', lit: lit || 0 }); }
    function packet(rt, u, o) {
      o = opt(o); const len = (o.len || 26) / rt.len, seg = rt.part(u - len, u);
      if (!seg) return; const fade = Math.min(1, u / 0.04, (1.04 - u) / 0.04) * (o.lit == null ? 1 : o.lit);
      if (fade <= 0) return;
      push({ k: 'line', pts: seg, role: 'packet', lit: fade, op: fade });
      if (u >= 0 && u <= 1) push({ k: 'dot', p: rt.at(u), r: o.head || 2.2, role: 'packet-head', lit: fade, op: fade });
    }
    function bloom(p, r, lit) { if (lit > 0) push({ k: 'bloom', p, r, lit }); }
    // draw boxes that move past each other in true depth order. items: [{ b:[x,y,z,w,d,h], draw() }]
    function sorted(items) {
      const n = items.length, behind = (A, B) => {   // A must be painted before B
        const [ax, ay, az, aw, ad, ah] = A.b, [bx, by, bz, bw, bd, bh] = B.b;
        if (ax + aw <= bx + 1e-6) return true; if (bx + bw <= ax + 1e-6) return false;
        if (ay + ad <= by + 1e-6) return true; if (by + bd <= ay + 1e-6) return false;
        if (az + ah <= bz + 1e-6) return true; if (bz + bh <= az + 1e-6) return false;
        return (ax + ay + az) < (bx + by + bz);
      };
      const indeg = new Array(n).fill(0), out = items.map(() => []);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (behind(items[i], items[j])) { out[i].push(j); indeg[j]++; } else { out[j].push(i); indeg[i]++; } }
      const done = new Array(n).fill(false);
      for (let c = 0; c < n; c++) {
        let pick = -1, best = Infinity;
        for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0) { const s = items[i].b[0] + items[i].b[1] + items[i].b[2]; if (s < best) { best = s; pick = i; } }
        if (pick < 0) for (let i = 0; i < n; i++) if (!done[i]) { const s = items[i].b[0] + items[i].b[1] + items[i].b[2]; if (s < best) { best = s; pick = i; } }
        done[pick] = true; out[pick].forEach(j => indeg[j]--); items[pick].draw();
      }
    }
    return {
      list: L, look, get readoutText() { return readout; },
      readout: s => { readout = String(s); },
      box, cyl, plate, wire, term, packet, bloom, shadow, sorted, route, fillet,
      cube: (x, y, z, s, o) => box(x, y, z, s, s, s, Object.assign({ r: s * 0.12 }, o)),
      top: (x, y, z, w = 0, d = 0) => plane('top', [x, y, z], w, d),
      front: (x, y, z, w = 0, h = 0) => plane('front', [x, y, z], w, h),
      side: (x, y, z, d = 0, h = 0) => plane('side', [x, y, z], d, h),
      line: (pts, o) => { o = opt(o); push({ k: 'line', pts, role: o.role || 'detail', ...sty(o), w: o.w }); },
      // any 3D polygon (curved surfaces built from patches, carved shapes): role picks the paint
      poly: (pts, o) => { o = opt(o); push({ k: 'poly', pts, role: o.role || 'top', ...sty(o), edge: o.edge }); },
      lerp: lerp3, mix,
    };
  }

  /* ---------------- timeline helpers (the `k` a diagram gets) ---------------- */
  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const easeInOut = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function clock(def, t) {
    const beats = def.beats && def.beats.length ? def.beats : [{ at: 0 }];
    let i = 0; while (i + 1 < beats.length && t >= beats[i + 1].at) i++;
    const start = beats[i].at, end = i + 1 < beats.length ? beats[i + 1].at : def.duration;
    const atOf = b => typeof b === 'number' ? (beats[b] ? beats[b].at : def.duration) : (beats.find(x => x.id === b) || { at: 0 }).at;
    const k = {
      t, i, beat: beats[i], u: (t - start) / Math.max(1, end - start), duration: def.duration, beats,
      at: atOf,                                                  // start time (ms) of a beat by index or id
      ramp: (t0, t1, ease = smooth) => ease((t - t0) / Math.max(1, t1 - t0)),
      env: (t0, t1, a = 300, d = 300) => Math.min(smooth((t - t0) / a), 1 - smooth((t - (t1 - d)) / d)),  // attack + decay, never pops
      pulse: (at, len = 400) => { const x = (t - at) / len; return x < 0 || x > 1 ? 0 : Math.sin(Math.PI * x); },
      cycle: (period, phase = 0) => (((t + phase) % period) + period) % period / period,
      since: b => t - atOf(b),
      smooth, easeInOut,
      spring: (t0, { stiffness = 120, damping = 12 } = {}) => {   // 0 -> 1 with a small overshoot, time in ms from t0
        const s = Math.max(0, (t - t0) / 1000), w = Math.sqrt(stiffness), z = damping / (2 * w);
        if (z >= 1) return 1 - Math.exp(-w * s) * (1 + w * s);
        const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * s) * (Math.cos(wd * s) + z * w / wd * Math.sin(wd * s));
      },
    };
    return k;
  }

  /* ---------------- registry & fitting ---------------- */
  const DEFS = new Map(), WAIT = new Map();
  function define(def) {
    def = Object.assign({ duration: 6000, aspect: 4 / 3, margin: 0.07, beats: [{ at: 0 }] }, def);
    if (def.still == null) def.still = Math.round(def.duration * 0.6);
    DEFS.set(def.id, def); (WAIT.get(def.id) || []).forEach(fn => fn(def)); WAIT.delete(def.id);
    return def;
  }
  const whenDefined = (id, fn) => { if (DEFS.has(id)) fn(DEFS.get(id)); else { if (!WAIT.has(id)) WAIT.set(id, []); WAIT.get(id).push(fn); } };
  function scene(def, t, lookName) {
    const g = builder(lookName); const k = clock(def, ((t % def.duration) + def.duration) % def.duration);
    def.draw(g, k); return { list: g.list, readout: g.readoutText, k };
  }
  const FITS = new Map();
  function fit(def, lookName) {
    const L = LOOKS[lookName] || LOOKS.glow, pr = PROJ[L.proj], key = def.id + '|' + L.proj;
    if (FITS.has(key)) return FITS.get(key);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = p => { const q = proj(pr, p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); };
    if (def.bounds) def.bounds.forEach(take);
    else {
      const ts = []; for (let i = 0; i < 16; i++) ts.push(def.duration * i / 16); def.beats.forEach(b => ts.push(b.at + 1)); ts.push(def.still);
      ts.forEach(t => scene(def, t, lookName).list.forEach(p => {
        if (p.k === 'halo' || p.k === 'bloom' || p.k === 'shadow' || p.k === 'clip') return;
        if (p.pts) p.pts.forEach(take); if (p.p) take(p.p); if (p.O) take(p.O);
      }));
    }
    const m = def.margin * Math.max(x1 - x0, y1 - y0); x0 -= m; x1 += m; y0 -= m; y1 += m;
    let w = x1 - x0, h = y1 - y0; const a = def.aspect;
    if (w / h < a) { const nw = h * a; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / a; y0 -= (nh - h) / 2; h = nh; }
    const f = { x0, y0, w, h, pr }; FITS.set(key, f); return f;
  }

  /* ---------------- paint: role + tone + lit -> colours ---------------- */
  function paint(p, T, L) {
    const lit = p.lit || 0, tone = T.face[p.tone] || T.face.mid, edge = p.tone === 'hi' ? T.edgeHi : T.edge;
    const r = { fill: null, stroke: null, lw: L.lw, glow: 0, alpha: p.op == null ? 1 : p.op, blur: 0 };
    switch (p.role) {
      case 'top': case 'front': case 'side': {
        const i = p.role === 'top' ? 0 : p.role === 'front' ? 1 : 2;
        r.fill = mix(tone[i], [T.litTop, T.litFront, T.litSide][i], lit);
        if (L.stroke && p.edge !== false) r.stroke = mix(edge, T.accentHi, lit);
        r.glow = lit; break; }
      case 'rim': if (!L.rim) return null; r.stroke = mix(T.rim || '#ffffff', T.accentHi, lit); r.lw = 1; break;
      case 'edge': if (!L.stroke) return null; r.stroke = mix(edge, T.accentHi, lit); r.glow = lit; break;
      case 'detail-rect': if (L.stroke) r.stroke = T.detail; else r.fill = mix(tone[0], T.detail, 0.35); break;
      case 'recess': r.fill = T.recess; if (L.stroke) r.stroke = T.edge; break;
      case 'screw': r.fill = T.recess; if (L.stroke) r.stroke = T.detail; break;
      case 'glass': r.fill = mix(T.glass, T.glassLit, lit); r.stroke = L.stroke ? mix(T.edge, T.accent, lit) : (lit ? T.accent : null); r.lw = L.stroke ? L.lw : 1.4; r.glow = lit * 0.6; break;
      case 'led': r.fill = mix(T.detail, T.accent, lit); r.glow = lit; break;
      case 'detail': r.stroke = mix(T.detail, T.accent, lit); r.lw = p.w || L.lw; break;
      case 'wire': r.stroke = mix(T.wire, T.accent, lit); r.lw = p.w || L.wireW; r.glow = lit * 0.5; r.under = p.under; break;
      case 'packet': r.stroke = T.accentHi; r.lw = L.packetW; r.glow = 1; break;
      case 'packet-head': r.fill = T.accentHi; r.glow = 1; break;
      case 'term': r.fill = mix(T.term, T.accent, lit); r.glow = lit; break;
      case 'ink': r.fill = mix(T.label || T.ink, T.accentHi, lit); r.glow = lit * 0.5; break;
      case 'engrave': r.fill = mix(T.label || T.ink, T.engraveLit, lit); break;   // label on a part that lights up
      case 'ink-hi': r.fill = mix(T.inkHi, T.accentHi, lit); break;
      case 'accent': r.fill = T.accent; r.glow = 1; break;
      default: r.fill = tone[0];
    }
    if (!T.glow) r.glow = 0;
    return r;
  }

  /* ---------------- canvas backend ---------------- */
  // view: { pr, scale, x0, y0, px (pixel mode), unit (device px per css px), T, L }
  function drawList(ctx, list, view) {
    const { T, L } = view, px = view.px;
    const S = p => { const q = proj(view.pr, p); let x = (q[0] - view.x0) * view.scale, y = (q[1] - view.y0) * view.scale;
      if (px) { x = Math.round(x); y = Math.round(y); } return [x, y]; };
    const pathOf = (pts, close) => { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = S(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (close) ctx.closePath(); };
    const unit = view.unit, glowK = 9 * unit;
    let ditherPat = null;
    const dither = color => { if (!ditherPat || ditherPat.c !== color) { const c = document.createElement('canvas'); c.width = c.height = 2; const x = c.getContext('2d');
      x.fillStyle = color; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1); ditherPat = { c: color, p: ctx.createPattern(c, 'repeat') }; } return ditherPat.p; };
    let clips = 0;
    for (const p of list) {
      if (p.k === 'clip') { ctx.save(); pathOf(p.pts, true); ctx.clip(); clips++; continue; }
      if (p.k === 'unclip') { if (clips) { ctx.restore(); clips--; } continue; }
      if (p.k === 'shadow') {
        if (!T.shadow) continue; ctx.save(); ctx.globalAlpha = T.shadowA == null ? 0.2 : T.shadowA;
        if (px) { ctx.fillStyle = T.shadow; pathOf(p.pts, true); ctx.fill(); }
        else if (L.soft) { ctx.shadowColor = T.shadow; ctx.shadowBlur = p.blur * view.scale; ctx.shadowOffsetX = 20000; ctx.fillStyle = '#000';
          ctx.translate(-20000, 0); pathOf(p.pts, true); ctx.fill(); }
        else { ctx.fillStyle = T.shadow; pathOf(p.pts, true); ctx.fill(); }
        ctx.restore(); continue;
      }
      if (p.k === 'halo') {
        const a = (p.lit || 0) * (T.halo || 0); if (a <= 0.01) continue; ctx.save();
        if (px) { if (p.lit > 0.5) { ctx.fillStyle = dither(T.accent); pathOf(p.pts.map(q => q), true); ctx.fill(); } }
        else { ctx.globalAlpha = Math.min(1, a); ctx.shadowColor = T.accent; ctx.shadowBlur = 14 * view.scale; ctx.shadowOffsetX = 20000; ctx.fillStyle = '#000';
          ctx.translate(-20000, 0); pathOf(p.pts, true); ctx.fill(); }
        ctx.restore(); continue;
      }
      if (p.k === 'bloom') {
        const a = (p.lit || 0) * (T.halo || 0); if (a <= 0.01 || px) continue;
        const [x, y] = S(p.p), r = p.r * view.scale, gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, rgba(T.accent, Math.min(1, a * 1.6))); gr.addColorStop(1, rgba(T.accent, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); continue;
      }
      const pt = paint(p, T, L); if (!pt) continue;
      ctx.globalAlpha = pt.alpha;
      if (pt.glow > 0 && !px) { ctx.shadowColor = T.accent; ctx.shadowBlur = glowK * pt.glow; } else { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
      const lw = px ? 1 : pt.lw * unit;
      if (p.k === 'poly') {
        pathOf(p.pts, true);
        if (pt.fill) { ctx.fillStyle = pt.fill; ctx.fill(); if (L.seam && !pt.stroke) { ctx.shadowBlur = 0; ctx.strokeStyle = pt.fill; ctx.lineWidth = 0.6 * unit; ctx.lineJoin = 'round'; ctx.stroke(); } }
        if (pt.stroke) { ctx.strokeStyle = pt.stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
      } else if (p.k === 'line') {
        pathOf(p.pts, false); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (pt.under && !px) { const sb = ctx.shadowBlur; ctx.shadowBlur = 0; ctx.strokeStyle = T.panel; ctx.lineWidth = lw + 2.6 * unit; ctx.stroke(); ctx.shadowBlur = sb; }
        ctx.strokeStyle = pt.stroke; ctx.lineWidth = px ? Math.max(1, Math.round(pt.lw)) : lw; ctx.stroke();
      } else if (p.k === 'dot') {
        const [x, y] = S(p.p), r = px ? Math.max(1, Math.round(p.r * view.scale * 0.8)) : p.r * view.scale;
        ctx.fillStyle = pt.fill; if (px) ctx.fillRect(x - Math.floor(r / 2), y - Math.floor(r / 2), Math.max(1, r), Math.max(1, r));
        else { ctx.beginPath(); ctx.arc(x, y, Math.max(r, 1.2 * unit), 0, 7); ctx.fill(); }
      } else if (p.k === 'text') {
        if (px || L.font === 'bitmap') bitmapText(ctx, p, pt.fill, view, S);
        else {
          const [ox, oy] = S(p.O), u = proj(view.pr, p.U), v = proj(view.pr, p.V), s = view.scale;
          ctx.save(); ctx.setTransform(u[0] * s, u[1] * s, v[0] * s, v[1] * s, ox, oy);
          ctx.font = `${p.weight} ${p.size}px ${L.font}`; ctx.textAlign = p.align; ctx.textBaseline = 'alphabetic';
          const str = L.caps ? p.str.toUpperCase() : p.str, tw = ctx.measureText(str).width;
          if (p.max && tw > p.max) ctx.font = `${p.weight} ${(p.size * p.max / tw).toFixed(2)}px ${L.font}`;   // shrink to fit its face
          ctx.fillStyle = pt.fill; ctx.fillText(str, 0, 0); ctx.restore();
        }
      }
    }
    while (clips--) ctx.restore();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  // Pixel-look text on a face, drawn the way pixel artists do it on a 2:1 grid:
  //  - it follows the face: one pixel along u steps by the face's pixel slope (1 across, 1/2 down on
  //    FRONT, 1/2 up on SIDE), with integer stepping from an even start so every copy of a glyph is identical;
  //  - big enough labels use the 3x5 font; labels too small for it are "greeked": a slanted row of
  //    2-px marks per character, gaps between words, which reads as print without pretending to be letters.
  //  p.pixel: 'auto' (default) | 'text' (always the font) | 'greek' (always marks)
  function bitmapText(ctx, p, fill, view, S) {
    const s = view.scale, u2 = proj(view.pr, p.U), v2 = proj(view.pr, p.V);
    const snap = d => Math.abs(d[0]) < 1e-6 ? [0, Math.sign(d[1])] : [Math.sign(d[0]), Math.round(d[1] / Math.abs(d[0]) * 2) / 2];
    const du = snap(u2), dv = snap(v2);
    const pxPerUnitU = (Math.abs(u2[0]) > 1e-6 ? Math.abs(u2[0]) : Math.abs(u2[1])) * s;   // screen px per world unit along u
    const capPx = p.size * 0.72 * Math.hypot(v2[0], v2[1]) * s;                              // cap height on screen
    const maxPx = p.max ? Math.floor(p.max * pxPerUnitU) : Infinity;
    // auto: real letters whenever the whole label fits its face (even if the 5-px font is larger than asked);
    // otherwise greek (a cut-off word reads worse than marks)
    const fits = bitmapWidth(p.str) * Math.max(1, Math.round(capPx / 5)) <= maxPx;
    const mode = p.pixel === 'text' || p.pixel === 'greek' ? p.pixel : capPx >= 2 && fits ? 'text' : 'greek';
    const [ox, oy] = S(p.O);
    const put = (a, b, n) => ctx.fillRect(ox + a * du[0] + b * dv[0], oy + Math.floor(a * du[1]) + Math.floor(b * dv[1]), n, n);
    const even = v => Math.round(v / 2) * 2;
    ctx.fillStyle = fill;
    if (mode === 'text') {
      const n = Math.max(1, Math.round(capPx / 5));
      let str = p.str.toUpperCase(); while (str.length > 1 && bitmapWidth(str) * n > maxPx) str = str.slice(0, -1);   // can't shrink: trim
      const w = bitmapWidth(str) * n, a0 = even(p.align === 'center' ? -w / 2 : p.align === 'right' ? -w : 0);
      [...str].forEach((ch, ci) => glyph(ch).forEach((row, ry) => { for (let cx = 0; cx < 3; cx++) if (row & (4 >> cx)) put(a0 + (ci * 4 + cx) * n, (ry - 5) * n, n); }));
      return;
    }
    // greeked: 2 px per character, 2 px between words, 2 px tall, texture from the letters themselves
    const words = p.str.trim().split(/\s+/).filter(Boolean); let total = 0; const kept = [];
    for (const wd of words) { const add = (kept.length ? 2 : 0) + wd.length * 2; if (total + add > maxPx) { const room = Math.floor((maxPx - total - (kept.length ? 2 : 0)) / 2); if (room >= 2) { kept.push(wd.slice(0, room)); total += (kept.length > 1 ? 2 : 0) + room * 2; } break; } kept.push(wd); total += add; }
    let a = even(p.align === 'center' ? -total / 2 : p.align === 'right' ? -total : 0);
    kept.forEach((wd, wi) => { if (wi) a += 2; [...wd].forEach(ch => { const c = ch.charCodeAt(0);
      put(a, -2, 1); put(a, -1, 1); put(a + 1, (c & 1) ? -2 : -1, 1); a += 2; }); });
  }
  function screenText(ctx, str, x, y, size, color, align, font, caps) {   // card text for exports
    if (font === 'bitmap') {
      const n = Math.max(1, Math.round(size / 6)), s = str.toUpperCase(), w = bitmapWidth(s) * n;
      let x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x; x0 = Math.round(x0); const y0 = Math.round(y - 5 * n);
      ctx.fillStyle = color;
      [...s].forEach((ch, ci) => glyph(ch).forEach((row, ry) => { for (let c = 0; c < 3; c++) if (row & (4 >> c)) ctx.fillRect(x0 + (ci * 4 + c) * n, y0 + ry * n, n, n); }));
      return;
    }
    ctx.font = `500 ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    if (caps) { try { ctx.letterSpacing = (size * 0.12) + 'px'; } catch (e) {} }
    ctx.fillText(caps ? str.toUpperCase() : str, x, y);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
  }
  function quantize(ctx, w, h, palette) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data, P = palette.map(hexRgb), cache = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const key = (d[i] >> 2) << 12 | (d[i + 1] >> 2) << 6 | (d[i + 2] >> 2); let c = cache.get(key);
      if (c === undefined) { let best = 1e9; c = 0; for (let j = 0; j < P.length; j++) { const dr = d[i] - P[j][0], dg = d[i + 1] - P[j][1], db = d[i + 2] - P[j][2], e = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (e < best) { best = e; c = j; } } cache.set(key, c); }
      const q = P[c]; d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // Render one frame of the drawing (no card) into ctx at w x h device px.
  function renderStage(ctx, def, t, opts) {
    const L = LOOKS[opts.look] || LOOKS.glow, T = opts.T, F = fit(def, opts.look), sc = scene(def, t, opts.look);
    const W = ctx.canvas.width, Hh = ctx.canvas.height;
    if (L.pixel) {
      const f = Math.max(1, opts.pixelFactor || Math.round(W / (L.pixel.width || 320)));
      const lw = Math.ceil(W / f), lh = Math.ceil(Hh / f);
      const low = opts._low && opts._low.width === lw && opts._low.height === lh ? opts._low : Object.assign(document.createElement('canvas'), { width: lw, height: lh });
      opts._low = low; const lx = low.getContext('2d', { willReadFrequently: true });
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.shadowBlur = 0;
      lx.fillStyle = opts.transparent ? T.bg : T.panel; lx.fillRect(0, 0, lw, lh);
      const scale = Math.min(lw / F.w, lh / F.h);
      drawList(lx, sc.list, { pr: F.pr, scale, x0: F.x0 - (lw / scale - F.w) / 2, y0: F.y0 - (lh / scale - F.h) / 2, px: true, unit: 1, T, L });
      quantize(lx, lw, lh, opts.palette || (opts.palette = paletteOf(T)));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
      if (opts.clear) ctx.clearRect(0, 0, W, Hh);
      ctx.drawImage(low, 0, 0, lw * f, lh * f); ctx.restore();
    } else {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (opts.clear) ctx.clearRect(0, 0, W, Hh);
      if (!opts.transparent) { ctx.fillStyle = T.panel; ctx.fillRect(0, 0, W, Hh); }
      const scale = Math.min(W / F.w, Hh / F.h);
      drawList(ctx, sc.list, { pr: F.pr, scale, x0: F.x0 - (W / scale - F.w) / 2, y0: F.y0 - (Hh / scale - F.h) / 2, px: false, unit: opts.unit || 1, T, L });
      ctx.restore();
    }
    return sc;
  }

  /* ---------------- SVG backend (static frames) ---------------- */
  function toSVG(def, t, opts) {
    const L = LOOKS[opts.look] || LOOKS.glow, T = opts.T, F = fit(def, opts.look), sc = scene(def, t, opts.look);
    const W = 800, Hh = Math.round(W / def.aspect), scale = W / F.w;
    const x0 = F.x0, y0 = F.y0 - (Hh / scale - F.h) / 2, n = v => v.toFixed(2);
    const S = p => { const q = proj(F.pr, p); return [(q[0] - x0) * scale, (q[1] - y0) * scale]; };
    const d = (pts, c) => 'M' + pts.map(p => S(p).map(n).join(' ')).join('L') + (c ? 'Z' : '');
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let body = '', defs = '', clipN = 0, open = 0;
    if (T.glow) defs += `<filter id="gl" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    defs += `<filter id="bl" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n(7 * scale)}"/></filter>`;
    for (const p of sc.list) {
      if (p.k === 'clip') { const id = 'c' + clipN++; defs += `<clipPath id="${id}"><path d="${d(p.pts, 1)}"/></clipPath>`; body += `<g clip-path="url(#${id})">`; open++; continue; }
      if (p.k === 'unclip') { if (open) { body += '</g>'; open--; } continue; }
      if (p.k === 'shadow') { if (T.shadow) body += `<path d="${d(p.pts, 1)}" fill="${T.shadow}" opacity="${T.shadowA == null ? .2 : T.shadowA}"${L.soft ? ' filter="url(#bl)"' : ''}/>`; continue; }
      if (p.k === 'halo') { const a = (p.lit || 0) * (T.halo || 0); if (a > 0.01) body += `<path d="${d(p.pts, 1)}" fill="${T.accent}" opacity="${n(Math.min(1, a * 2.2))}" filter="url(#bl)"/>`; continue; }
      if (p.k === 'bloom') { const a = (p.lit || 0) * (T.halo || 0); if (a > 0.01) { const [x, y] = S(p.p); body += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(p.r * scale * .5)}" fill="${T.accent}" opacity="${n(Math.min(1, a * 1.5))}" filter="url(#bl)"/>`; } continue; }
      const pt = paint(p, T, L); if (!pt) continue;
      const fl = pt.glow > 0.05 ? ' filter="url(#gl)"' : '', op = pt.alpha < 1 ? ` opacity="${n(pt.alpha)}"` : '';
      const sw = `stroke-width="${pt.lw}" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"`;
      if (p.k === 'poly') {
        const st = pt.stroke ? ` stroke="${pt.stroke}" ${sw}` : (L.seam && pt.fill ? ` stroke="${pt.fill}" stroke-width=".6" stroke-linejoin="round"` : '');
        body += `<path d="${d(p.pts, 1)}" fill="${pt.fill || 'none'}"${st}${op}${fl}/>`;
      } else if (p.k === 'line') {
        if (pt.under) body += `<path d="${d(p.pts)}" fill="none" stroke="${T.panel}" stroke-width="${pt.lw + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
        body += `<path d="${d(p.pts)}" fill="none" stroke="${pt.stroke}" ${sw}${op}${fl}/>`;
      } else if (p.k === 'dot') { const [x, y] = S(p.p); body += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(Math.max(1.2, p.r * scale))}" fill="${pt.fill}"${op}${fl}/>`; }
      else if (p.k === 'text') {
        const [ox, oy] = S(p.O), u = proj(F.pr, p.U), v = proj(F.pr, p.V);
        body += `<text transform="matrix(${n(u[0] * scale)} ${n(u[1] * scale)} ${n(v[0] * scale)} ${n(v[1] * scale)} ${n(ox)} ${n(oy)})" font-family='${L.font === 'bitmap' ? 'ui-monospace, monospace' : L.font}' font-size="${p.size}" font-weight="${p.weight}" text-anchor="${p.align === 'center' ? 'middle' : p.align === 'right' ? 'end' : 'start'}" fill="${pt.fill}"${op}>${esc(L.caps ? p.str.toUpperCase() : p.str)}</text>`;
      }
    }
    while (open--) body += '</g>';
    const bg = opts.transparent ? '' : `<rect width="${W}" height="${Hh}" fill="${T.panel}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${esc(def.aria || def.title || def.id)}"><defs>${defs}</defs>${bg}${body}</svg>`;
  }

  /* ---------------- GIF encoder (LZW, global palette) ---------------- */
  function buildPalette(frames, forced) {
    const hist = new Map();
    frames.forEach(d => { for (let i = 0; i < d.length; i += 8) { const k = (d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | (d[i + 2] >> 3); hist.set(k, (hist.get(k) || 0) + 1); } });
    const pal = forced.map(hexRgb); const seen = new Set(pal.map(c => (c[0] >> 3) << 10 | (c[1] >> 3) << 5 | (c[2] >> 3)));
    [...hist.entries()].sort((a, b) => b[1] - a[1]).forEach(([k]) => { if (pal.length < 256 && !seen.has(k)) { seen.add(k); pal.push([(k >> 10 & 31) * 8 + 4, (k >> 5 & 31) * 8 + 4, (k & 31) * 8 + 4]); } });
    while (pal.length < 256) pal.push([0, 0, 0]);
    return pal.slice(0, 256);
  }
  function indexFrame(d, pal, cache) {
    const out = new Uint8Array(d.length / 4);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const key = (d[i] >> 2) << 12 | (d[i + 1] >> 2) << 6 | (d[i + 2] >> 2); let c = cache.get(key);
      if (c === undefined) { let best = 1e9; c = 0; for (let q = 0; q < pal.length; q++) { const dr = d[i] - pal[q][0], dg = d[i + 1] - pal[q][1], db = d[i + 2] - pal[q][2], e = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (e < best) { best = e; c = q; } } cache.set(key, c); }
      out[j] = c;
    }
    return out;
  }
  function lzw(minCode, idx, out) {
    const clear = 1 << minCode, eoi = clear + 1; let size = minCode + 1, next = eoi + 1, cur = 0, bits = 0;
    let table = new Map(); const bytes = [];
    const emit = c => { cur |= c << bits; bits += size; while (bits >= 8) { bytes.push(cur & 255); cur >>>= 8; bits -= 8; } };
    emit(clear); let code = idx[0];
    for (let i = 1; i < idx.length; i++) {
      const k = idx[i], key = code << 8 | k, v = table.get(key);
      if (v !== undefined) { code = v; continue; }
      emit(code);
      if (next === 4096) { emit(clear); next = eoi + 1; size = minCode + 1; table = new Map(); }
      else { if (next >= (1 << size)) size++; table.set(key, next++); }
      code = k;
    }
    emit(code); emit(eoi); if (bits > 0) bytes.push(cur & 255);
    out.push(minCode);
    for (let i = 0; i < bytes.length; i += 255) { const n = Math.min(255, bytes.length - i); out.push(n); for (let j = 0; j < n; j++) out.push(bytes[i + j]); }
    out.push(0);
  }
  // Frames after the first store only the rectangle that changed; identical frames extend the previous delay.
  function encodeGIF(w, h, frames, pal, delays) {
    const dl = i => Array.isArray(delays) ? delays[i] : delays;
    const o = [], s = str => { for (const c of str) o.push(c.charCodeAt(0)); }, u16 = v => o.push(v & 255, v >> 8 & 255);
    s('GIF89a'); u16(w); u16(h); o.push(0xf7, 0, 0);
    pal.forEach(c => o.push(c[0], c[1], c[2]));
    o.push(0x21, 0xff, 11); s('NETSCAPE2.0'); o.push(3, 1, 0, 0, 0);
    const out = [];   // { x, y, w, h, idx, delay }
    frames.forEach((f, n) => {
      if (!n) { out.push({ x: 0, y: 0, w, h, idx: f, delay: dl(0) }); return; }
      const p = frames[n - 1]; let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) { const r = y * w; for (let x = 0; x < w; x++) if (f[r + x] !== p[r + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
      if (x1 < 0) { out[out.length - 1].delay += dl(n); return; }
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1, sub = new Uint8Array(cw * ch);
      for (let y = 0; y < ch; y++) sub.set(f.subarray((y0 + y) * w + x0, (y0 + y) * w + x0 + cw), y * cw);
      out.push({ x: x0, y: y0, w: cw, h: ch, idx: sub, delay: dl(n) });
    });
    out.forEach(F => { o.push(0x21, 0xf9, 4, 0x04); u16(Math.min(65535, F.delay)); o.push(0, 0); o.push(0x2c); u16(F.x); u16(F.y); u16(F.w); u16(F.h); o.push(0); lzw(8, F.idx, o); });
    o.push(0x3b); return new Uint8Array(o);
  }

  /* ---------------- card (frame) for exports ---------------- */
  // labels: the four corner texts (Fig n, title, caption, readout); progress: the step bars
  function cardMetrics(W, def, frame, labels = true, progress = true) {
    if (!frame) return { W, H: Math.round(W / def.aspect), pad: 0, head: 0, foot: 0, stageX: 0, stageY: 0, stageW: W, stageH: Math.round(W / def.aspect) };
    const bars = progress && def.beats.length > 1;
    const pad = Math.round(W * 0.035), head = labels ? Math.round(W * 0.05) : 0,
      foot = labels ? Math.round(W * 0.062) : bars ? Math.round(W * 0.03) : 0, stageW = W - 2 * pad, stageH = Math.round(stageW / def.aspect);
    return { W, H: pad + head + stageH + foot + pad, pad, head, foot, stageX: pad, stageY: pad + head, stageW, stageH };
  }
  function drawCard(ctx, M, def, sc, opts) {
    const L = LOOKS[opts.look], T = opts.T, fs = Math.max(9, Math.round(M.W * 0.019)), font = L.font, caps = L.caps;
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, M.W, M.H);
    const r = Math.round(M.W * 0.03); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0.5, 0.5, M.W - 1, M.H - 1, L.pixel ? 0 : r) : ctx.rect(0.5, 0.5, M.W - 1, M.H - 1);
    ctx.fillStyle = T.panel; ctx.fill(); ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.stroke();
    const yH = M.pad + M.head * 0.55, yF = M.stageY + M.stageH + M.foot * 0.72;
    const bi = sc.k.i, nb = def.beats.length, cap = (def.beats[bi] && def.beats[bi].caption) || def.hint || '';
    const labels = opts.labels !== false, progress = opts.progress !== false;
    if (labels) {
    screenText(ctx, `Fig ${opts.fig || 1}`, M.pad, yH, fs, T.inkHi, 'left', font, caps);
    screenText(ctx, def.title || '', M.W - M.pad, yH, fs, T.ink, 'right', font, caps);
    const meas = s => { if (font === 'bitmap') return bitmapWidth(s) * Math.max(1, Math.round(fs / 6)); ctx.font = `500 ${fs}px ${font}`;
      try { ctx.letterSpacing = caps ? (fs * 0.12) + 'px' : '0px'; } catch (e) {} const w = ctx.measureText(caps ? s.toUpperCase() : s).width; try { ctx.letterSpacing = '0px'; } catch (e) {} return w; };
    const room = M.W - 2 * M.pad - (sc.readout ? meas(sc.readout) + fs * 2 : 0);
    let line = (nb > 1 ? String(bi + 1).padStart(2, '0') + '  ' : '') + cap;
    if (meas(line) > room) { while (line.length > 4 && meas(line + '…') > room) line = line.slice(0, -1); line = line.trimEnd() + '…'; }
    screenText(ctx, line, M.pad, yF, fs, T.ink, 'left', font, caps);
    if (sc.readout) screenText(ctx, sc.readout, M.W - M.pad, yF, fs, T.inkHi, 'right', font, caps);
    }
    if (progress && nb > 1) {   // step bars
      const y = M.stageY + M.stageH + Math.round(M.foot * (labels ? 0.18 : 0.4)), gap = Math.max(2, Math.round(M.W * 0.004)), bw = (M.stageW - gap * (nb - 1)) / nb, bh = Math.max(2, Math.round(M.W * 0.004));
      for (let i = 0; i < nb; i++) { const x = M.pad + i * (bw + gap); ctx.fillStyle = T.line; ctx.fillRect(Math.round(x), y, Math.round(bw), bh);
        const f = i < bi ? 1 : i > bi ? 0 : Math.max(0, Math.min(1, sc.k.u)); if (f > 0) { ctx.fillStyle = T.accent; ctx.fillRect(Math.round(x), y, Math.round(bw * f), bh); } }
    }
  }
  // Full export frame: card + stage. Returns { canvas, sc }.
  function renderExport(def, t, opts, reuse) {
    const L = LOOKS[opts.look] || LOOKS.glow; let W = opts.width || 800;
    const M = cardMetrics(W, def, opts.frame !== false, opts.labels !== false, opts.progress !== false);
    const cv = reuse && reuse.width === M.W && reuse.height === M.H ? reuse : Object.assign(document.createElement('canvas'), { width: M.W, height: M.H });
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const st = opts._stage && opts._stage.width === M.stageW ? opts._stage : Object.assign(document.createElement('canvas'), { width: M.stageW, height: M.stageH });
    opts._stage = st; const sx = st.getContext('2d');
    if (L.pixel) opts.pixelFactor = opts.pixelSize ? Math.max(1, Math.round(opts.pixelSize)) : Math.max(1, Math.round(M.stageW / (L.pixel.width || 320)));
    const sc = renderStage(sx, def, t, Object.assign(opts, { unit: M.W / 800 * 1.25, clear: true }));
    if (opts.frame !== false) drawCard(ctx, M, def, sc, opts);
    ctx.imageSmoothingEnabled = !L.pixel; ctx.drawImage(st, M.stageX, M.stageY);
    return { canvas: cv, sc };
  }

  /* ---------------- the <iso-gram> element ---------------- */
  const CSS = `
    :host { display:block; --aspect:4/3; container-type:inline-size; }
    :host([hidden]) { display:none; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius,18px); padding:clamp(10px,3.2cqi,22px) clamp(12px,3.6cqi,26px);
      display:grid; gap:clamp(4px,1cqi,8px); color:var(--ink); font:500 clamp(10px,1.9cqi,13px)/1.35 var(--font); }
    .row { display:flex; flex-wrap:wrap; justify-content:space-between; gap:2px 16px; min-width:0; }
    .caps .row { text-transform:uppercase; letter-spacing:.13em; }
    .hi { color:var(--ink-hi); }
    .title { text-align:right; }
    .cap { min-width:0; flex:1 1 auto; } .cap b { font-weight:500; color:var(--accent); margin-right:.7em; }
    .read { white-space:nowrap; color:var(--ink-hi); }
    .stage { position:relative; aspect-ratio:var(--aspect); border-radius:10px; outline:none; cursor:pointer; }
    .stage:focus-visible { box-shadow:0 0 0 1px var(--line), 0 0 0 3px var(--accent); }
    canvas { position:absolute; inset:0; width:100%; height:100%; display:block; }
    .px canvas { image-rendering:pixelated; image-rendering:crisp-edges; }
    .steps { display:flex; gap:4px; }
    .steps button { flex:1; height:12px; padding:5px 0; border:0; background:none; cursor:pointer; }
    .steps button i { display:block; height:2px; border-radius:2px; background:var(--line); overflow:hidden; }
    .steps button i s { display:block; height:100%; width:0; background:var(--accent); }
    .steps button:focus-visible { outline:1px solid var(--accent); outline-offset:1px; }
    .play { position:absolute; right:8px; top:8px; width:28px; height:28px; border-radius:50%; border:1px solid var(--line); background:var(--panel);
      color:var(--ink-hi); display:grid; place-items:center; opacity:0; transition:opacity .2s; cursor:pointer; padding:0; }
    .stage:hover .play, .play:focus-visible, .paused .play { opacity:1; }
    .play svg { width:10px; height:10px; fill:currentColor; }
    .bare.card { background:none; border:0; padding:0; }
    .bare .row, .bare .steps, .nolabels .row, .noprogress .steps { display:none; }
    .clear.card { background:transparent; border-color:transparent; }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
    @media (prefers-reduced-motion: reduce) { .play { transition:none; } }
  `;
  const PLAY = '<svg viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9Z"/></svg>', PAUSE = '<svg viewBox="0 0 10 10"><rect x="2" y="1" width="2.2" height="8"/><rect x="5.8" y="1" width="2.2" height="8"/></svg>';

  class IsoDiagram extends HTMLElement {
    static get observedAttributes() { return ['name', 'look', 'theme', 'accent', 'frame', 'labels', 'progress', 'transparent', 'speed', 'fig', 'paused', 'pixel-size']; }
    constructor() { super(); this._t = 0; this._last = 0; this._raf = 0; this._vis = true; this._playing = true; this._opts = {}; }
    connectedCallback() {
      if (this._root) return this._start();
      const r = this._root = this.attachShadow({ mode: 'open' });
      r.innerHTML = `<style>${CSS}</style><figure class="card" part="card" style="margin:0">
        <div class="row" part="head"><span class="hi fig">Fig 1</span><span class="title"></span></div>
        <div class="stage" tabindex="0" part="stage"><canvas></canvas><button class="play" aria-label="Pause">${PAUSE}</button></div>
        <div class="steps" part="steps"></div>
        <div class="row" part="foot"><span class="cap"></span><span class="read"></span></div>
        <ol class="sr"></ol></figure>`;
      const $ = s => r.querySelector(s);
      this._el = { card: $('.card'), fig: $('.fig'), title: $('.title'), stage: $('.stage'), cv: $('canvas'), play: $('.play'), steps: $('.steps'), cap: $('.cap'), read: $('.read'), sr: $('.sr') };
      this._ctx = this._el.cv.getContext('2d');
      this._el.stage.addEventListener('click', e => { if (!e.target.closest('.play')) this.toggle(); });
      this._el.play.addEventListener('click', () => this.toggle());
      this._el.stage.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') { this.toggle(); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { this.step(1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { this.step(-1); e.preventDefault(); }
      });
      this._el.steps.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) this.goto(+b.dataset.i); });
      this._mq = matchMedia('(prefers-color-scheme: dark)'); this._rm = matchMedia('(prefers-reduced-motion: reduce)');
      const re = () => { this._applyTheme(); this._draw(); }; this._mq.addEventListener && this._mq.addEventListener('change', re);
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this._el.stage);
      this._io = new IntersectionObserver(es => { this._vis = es.some(e => e.isIntersecting); this._loop(); }); this._io.observe(this);
      this._start();
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); this._raf = 0; }
    attributeChangedCallback() { if (!this._root || !this._def) return; this._applyTheme(); this._applyFrame(); this._resize(); }
    _start() {
      const name = this.getAttribute('name') || (DEFS.size ? [...DEFS.keys()][DEFS.size - 1] : '');
      whenDefined(name, def => {
        this._def = def; const e = this._el;
        e.title.textContent = def.title || ''; this.style.setProperty('--aspect', String(def.aspect));
        e.stage.setAttribute('role', 'img'); e.stage.setAttribute('aria-label', (def.aria || def.title || '') + ' — click or press space to pause, arrow keys to step.');
        e.sr.innerHTML = def.beats.filter(b => b.caption).map(b => `<li>${String(b.caption).replace(/</g, '&lt;')}</li>`).join('');
        e.steps.innerHTML = def.beats.length > 1 ? def.beats.map((b, i) => `<button data-i="${i}" aria-label="Step ${i + 1}: ${String(b.caption || '').replace(/"/g, '&quot;')}"><i><s></s></i></button>`).join('') : '';
        this._bars = [...e.steps.querySelectorAll('s')];
        this._playing = !this.hasAttribute('paused') && !this._rm.matches;
        if (!this._playing) this._t = def.still;
        this._applyTheme(); this._applyFrame(); this._resize(); this._loop();
      });
    }
    get look() { const l = this.getAttribute('look'); return LOOKS[l] ? l : (this._def && LOOKS[this._def.look] ? this._def.look : 'glow'); }
    get theme() {
      const L = LOOKS[this.look], t = this.getAttribute('theme') || (this._def && this._def.theme) || 'auto';
      if (t === 'light' || t === 'dark') return L.themes[t] ? t : L.default;
      if (t === 'default') return L.default;
      return this._mq && this._mq.matches ? 'dark' : 'light';
    }
    _applyTheme() {
      const L = LOOKS[this.look], T = this._T = themeOf(this.look, this.theme, this.getAttribute('accent') || (this._def && this._def.accent));
      this._opts = { look: this.look, T, transparent: this.hasAttribute('transparent') };
      const s = this.style;
      [['--panel', T.panel], ['--line', T.line], ['--ink', T.ink], ['--ink-hi', T.inkHi], ['--accent', T.accent],
        ['--font', L.font === 'bitmap' ? 'var(--isogram-pixel, "Silkscreen", "Press Start 2P", ui-monospace, monospace)' : L.caps ? `var(--isogram-mono, ${L.font})` : `var(--isogram-sans, ${L.font})`], ['--radius', L.pixel ? '4px' : '18px']].forEach(([k, v]) => s.setProperty(k, v));
      this._el.card.classList.toggle('caps', !!L.caps); this._el.card.classList.toggle('px', !!L.pixel);
    }
    _applyFrame() {
      const e = this._el; e.fig.textContent = 'Fig ' + (this.getAttribute('fig') || 1);
      e.card.classList.toggle('bare', this.getAttribute('frame') === 'none');
      e.card.classList.toggle('clear', this.hasAttribute('transparent'));
      e.card.classList.toggle('nolabels', this.getAttribute('labels') === 'none');
      e.card.classList.toggle('noprogress', this.getAttribute('progress') === 'none');
    }
    _resize() {
      if (!this._def) return; const r = this._el.stage.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), cv = this._el.cv;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); this._dpr = dpr; this._opts._low = null; this._draw();
    }
    _draw() {
      if (!this._def || !this._el.cv.width) return;
      const L = LOOKS[this.look], o = this._opts;
      o.unit = this._dpr || 1; o.clear = true;
      const ps = parseFloat(this.getAttribute('pixel-size'));   // CSS px per art pixel; absent: about 320 art pixels across
      if (L.pixel) o.pixelFactor = ps > 0 ? Math.max(1, Math.round(ps * (this._dpr || 1))) : Math.max(1, Math.round(this._el.cv.width / (L.pixel.width || 320)));
      const sc = renderStage(this._ctx, this._def, this._t, o);
      const e = this._el, b = sc.k.beat, cap = b.caption || this._def.hint || '', nb = this._def.beats.length;
      const capHtml = (nb > 1 ? `<b>${String(sc.k.i + 1).padStart(2, '0')}</b>` : '') + String(cap).replace(/</g, '&lt;');
      if (capHtml !== this._capHtml) { e.cap.innerHTML = this._capHtml = capHtml; }
      if (sc.readout !== this._read) { e.read.textContent = this._read = sc.readout; }
      if (this._bars) this._bars.forEach((s, i) => { const f = i < sc.k.i ? 1 : i > sc.k.i ? 0 : sc.k.u; s.style.width = (f * 100).toFixed(1) + '%'; });
      e.card.classList.toggle('paused', !this._playing);
      e.play.innerHTML = this._playing ? PAUSE : PLAY; e.play.setAttribute('aria-label', this._playing ? 'Pause' : 'Play');
    }
    _loop() {
      cancelAnimationFrame(this._raf); this._raf = 0;
      if (!this._def || !this._playing || !this._vis || !this.isConnected) { this._draw(); return; }
      this._last = performance.now();
      const f = now => { const sp = parseFloat(this.getAttribute('speed')) || 1;
        this._t = (this._t + (now - this._last) * sp) % this._def.duration; this._last = now; this._draw();
        this._raf = requestAnimationFrame(f); };
      this._raf = requestAnimationFrame(f);
    }
    play() { this._playing = true; this._loop(); }
    pause() { this._playing = false; this._loop(); }
    toggle() { this._playing ? this.pause() : this.play(); }
    goto(i) { const d = this._def; if (!d) return; const n = d.beats.length; i = ((i % n) + n) % n;
      const b = d.beats[i], end = i + 1 < n ? d.beats[i + 1].at : d.duration; this._t = b.show != null ? b.show : b.at + (end - b.at) * (this._playing ? 0 : 0.7); this._draw(); }
    step(dir) { if (this._def) { const k = clock(this._def, this._t); this.goto(k.i + dir); } }
    seek(t) { this._t = t; this._draw(); }

    /* ---- exports ---- */
    _xopts(o) { o = o || {}; const look = o.look || this.look; const T = themeOf(look, o.theme || (o.look ? LOOKS[look].default : this.theme), o.accent || this.getAttribute('accent') || this._def.accent);
      return { look, T, width: o.width || 800, frame: o.frame == null ? this.getAttribute('frame') !== 'none' : o.frame,
        labels: o.labels == null ? this.getAttribute('labels') !== 'none' : o.labels, pixelSize: o.pixelSize || parseFloat(this.getAttribute('pixel-size')) || 0, progress: o.progress == null ? this.getAttribute('progress') !== 'none' : o.progress, transparent: !!o.transparent, fig: this.getAttribute('fig') || 1 }; }
    toCanvas(o = {}) { const x = this._xopts(o); return renderExport(this._def, o.t == null ? this._def.still : o.t, x).canvas; }
    toPNG(o = {}) { return new Promise(res => this.toCanvas(o).toBlob(res, 'image/png')); }
    toSVG(o = {}) { const x = this._xopts(o); return toSVG(this._def, o.t == null ? this._def.still : o.t, x); }
    async toGIF(o = {}) {
      const def = this._def, x = this._xopts(Object.assign({ width: 640 }, o)), fps = o.fps || 20, n = Math.max(1, Math.round(def.duration / 1000 * fps));
      const datas = []; let cv = null;
      for (let i = 0; i < n; i++) { const r = renderExport(def, i * def.duration / n, x, cv); cv = r.canvas;
        datas.push(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.slice()); if (o.onProgress) o.onProgress(i / n * 0.5); if (i % 8 === 7) await new Promise(r => setTimeout(r)); }
      const forced = [x.T.bg, x.T.panel, x.T.accent, x.T.accentHi, x.T.ink, x.T.inkHi, x.T.line];
      const pal = buildPalette(datas.filter((_, i) => i % 3 === 0), forced), cache = new Map(), idx = [];
      for (let i = 0; i < n; i++) { idx.push(indexFrame(datas[i], pal, cache)); if (o.onProgress) o.onProgress(0.5 + i / n * 0.4); if (i % 8 === 7) await new Promise(r => setTimeout(r)); }
      const cs = i => Math.round((i + 1) * def.duration / n / 10) - Math.round(i * def.duration / n / 10);   // exact loop length
      return new Blob([encodeGIF(cv.width, cv.height, idx, pal, idx.map((_, i) => cs(i)))], { type: 'image/gif' });
    }
    toWebM(o = {}) {   // real-time recording of one loop
      const def = this._def, x = this._xopts(o), fps = o.fps || 30;
      const first = renderExport(def, 0, x), cv = first.canvas, stream = cv.captureStream(fps);
      const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
      if (!type) return Promise.reject(new Error('MediaRecorder/WebM not supported in this browser'));
      const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6e6 }), chunks = [];
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      return new Promise(res => { rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
        rec.start(); const t0 = performance.now();
        const f = now => { const t = now - t0; if (t >= def.duration) { rec.stop(); return; } renderExport(def, t, x, cv); requestAnimationFrame(f); };
        requestAnimationFrame(f); });
    }
    toSheet(o = {}) {   // one still per beat, for review
      const def = this._def, cols = o.cols || 2, w = o.width || 520, x = this._xopts(Object.assign({}, o, { width: w }));
      const shots = def.beats.map((b, i) => { const end = i + 1 < def.beats.length ? def.beats[i + 1].at : def.duration;
        const c = renderExport(def, b.show != null ? b.show : b.at + (end - b.at) * 0.7, x).canvas; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.getContext('2d').drawImage(c, 0, 0); return k; });
      const rows = Math.ceil(shots.length / cols), sh = document.createElement('canvas'); sh.width = cols * w + (cols + 1) * 12; sh.height = rows * shots[0].height + (rows + 1) * 12;
      const c = sh.getContext('2d'); c.fillStyle = x.T.bg; c.fillRect(0, 0, sh.width, sh.height);
      shots.forEach((s, i) => c.drawImage(s, 12 + (i % cols) * (w + 12), 12 + Math.floor(i / cols) * (s.height + 12)));
      return new Promise(res => sh.toBlob(res, 'image/png'));
    }
  }
  if (!customElements.get('iso-gram')) customElements.define('iso-gram', IsoDiagram);

  window.ISOGRAM = { define, get: id => DEFS.get(id), list: () => [...DEFS.keys()], LOOKS, PROJ, themeOf, addLook: (name, spec) => { LOOKS[name] = spec; FITS.clear(); },
    mix, version: '1.0.0', _internal: { scene, fit, renderExport, toSVG, encodeGIF } };
})();
