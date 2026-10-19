/* Robot assembly: the body flickers in as a hologram, the head spirals down and screws on,
   gantry claws bring the arms in from the sides, the legs rise through a floor hatch, and it powers on.
   The robot faces lower-left (its FRONT face); shoulders sit along x, so the claws ride rails along x. */
ISOGRAM.define({
  id: 'robot',
  title: 'Assembling a robot',
  aria: 'Isometric diagram of a robot being assembled: the body flickers into existence, the head spirals down and screws on, mechanical claws bring the arms in from the sides, the legs rise through a floor hatch, and the robot powers on.',
  theme: 'dark',
  duration: 14000,
  still: 12700,
  beats: [
    { at: 0,     id: 'body', caption: 'The body flickers into being',  show: 1450 },
    { at: 2600,  id: 'head', caption: 'Head spirals down, screws on',   show: 4500 },
    { at: 5400,  id: 'arms', caption: 'Claws bring in the arms',        show: 6800 },
    { at: 8000,  id: 'legs', caption: 'Legs rise up from below',        show: 9900 },
    { at: 10600, id: 'on',   caption: 'Power on',                       show: 12700 },
  ],
  draw(g, k) {
    const t = k.t, PI = Math.PI;
    const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    // ---- model ----
    const CX = 130, CY = 120, FZ = 8;                      // robot axis, floor top
    const T0 = 108, T1 = 152, TY0 = 104, TY1 = 136, TZ = 70, TH = 58;   // torso box
    const tBody = k.at('body'), tHead = k.at('head'), tArms = k.at('arms'), tLegs = k.at('legs'), tOn = k.at('on'), D = k.duration;
    const mat = k.ramp(tBody + 200, tBody + 2300);                                   // hologram -> solid
    const flick = mat >= 1 ? 1 : (hash(Math.floor(t / 70)) < 0.25 + 0.75 * mat ? 1 : 0);
    const out = k.ramp(D - 1000, D - 150);                                            // loop end: flicker back out
    const outFlick = out <= 0 ? 1 : (hash(Math.floor(t / 60) + 7) > out ? 1 - out * 0.7 : 0);
    const vis = t < tBody + 200 ? 0 : flick * (0.3 + 0.7 * mat) * outFlick;           // whole-robot opacity
    const holo = (1 - mat) * 0.9;                                                      // accent while it is still a hologram
    const headU = k.ramp(tHead + 150, tHead + 2100, k.easeInOut), screw = k.ramp(tHead + 2100, tHead + 2600);
    const armU = k.ramp(tArms + 150, tArms + 1500, k.easeInOut), armUL = k.ramp(tArms + 350, tArms + 1700, k.easeInOut);
    const grip = 1 - k.ramp(tArms + 1800, tArms + 2050), back = k.ramp(tArms + 2050, tArms + 2550, k.easeInOut);
    const hatch = k.env(tLegs + 50, D - 200, 450, 600);
    const rise = k.ramp(tLegs + 450, tLegs + 2200, k.easeInOut);
    const power = k.env(tOn + 200, D - 1000, 400, 300);
    const hover = rise < 1 ? 2 * Math.sin(t / 380) : 0;
    const bounce = 4 * k.pulse(tOn + 250, 500);
    const lift = hover + bounce;                                                        // everything above the hips rides this

    // ---- assembly floor ----
    const floor = g.box(22, 28, 0, 216, 184, FZ, { r: 8, tone: 'lo' });
    floor.top.rect(8, 8, 200, 168, { r: 6, role: 'detail-rect' }).screws(14, 2.2);
    // hatch frame with hazard stripes
    const hz = g.top(96, 96, FZ + 0.1, 68, 48);
    hz.rect(0, 0, 68, 48, { r: 3, role: 'recess' });
    for (let u = 3; u < 64; u += 7) { hz.line(u, 1.5, u + 4, 6.5, { lit: 0, op: 0.7 }); hz.line(u, 41.5, u + 4, 46.5, { op: 0.7 }); }   // hazard ticks
    const hole = g.top(106, 104, FZ + 0.2, 48, 32);
    hole.rect(0, 0, 48, 32, { r: 2, role: 'recess' }).rect(2, 2, 44, 28, { r: 2, role: 'recess', op: 0.8 });
    // hatch doors slide apart along x
    g.box(106 - 24 * hatch, 104, FZ, 24, 32, 2.5, { r: 1.5, tone: 'mid' }).top.slits(4, 20, 4, 4, 28, true, { op: 0.6 });
    g.box(130 + 24 * hatch, 104, FZ, 24, 32, 2.5, { r: 1.5, tone: 'mid' }).top.slits(4, 20, 4, 4, 28, true, { op: 0.6 });
    // the assembly field holding the body until the legs arrive
    const field = (t > tBody + 200 ? 1 : 0) * (1 - rise) * (1 - out) * 0.55;
    if (field > 0.02) g.top(CX - 30, CY - 22, FZ + 0.5, 60, 44).rect(0, 0, 60, 44, { r: 22, role: 'detail', lit: field });

    // ---- left gantry (behind) and left arm ----
    // Draw order follows depth: the left pillar sits behind its arm, so it goes first; the right pillar is
    // nearer than its rail, carriage and waiting arm, so it is drawn last (see the right side below).
    const pillar = px => g.box(px, 106, FZ, 18, 28, 150, { r: 3, tone: 'mid' }).front.slits(4, 14, 3, 10, 140, true, { op: 0.5 });
    const gantry = (side) => {                                                          // side -1 = left (small x), +1 = right
      const px = side < 0 ? 28 : 214, u = side < 0 ? armUL : armU;
      const armX = side < 0 ? T0 - 12 - 48 * (1 - u) : T1 + 2 + 48 * (1 - u);       // arm's inner x: waits just inside the pillar
      const home = side < 0 ? px + 18 + 9 : px - 9;                                     // carriage parks beside its pillar, not in it
      const carX = armX + 5 + (home - (armX + 5)) * back;                               // rides with the arm, then returns
      const r0 = side < 0 ? px + 18 : carX + 7, r1 = side < 0 ? carX - 7 : px;
      g.box(Math.min(r0, r1), 116, 146, Math.max(1, Math.abs(r1 - r0)), 8, 6, { r: 1, tone: 'mid' });   // rail boom out of the pillar
      g.box(carX - 7, 112, 136, 14, 16, 10, { r: 2, material: 'silhouette' });                       // carriage
      const open = 1 - grip;
      g.box(carX - 2, 112 - 4 * open, 120 + 6 * open, 4, 3, 16, { material: 'silhouette' });          // claw fingers
      g.box(carX - 2, 125 + 4 * open, 120 + 6 * open, 4, 3, 16, { material: 'silhouette' });
      return armX;
    };
    const arm = (x, side) => {
      const a = { op: outFlick * k.ramp(0, 600) };                                       // fades in at the loop start, out at its end
      g.box(x, 112, TZ + 26 + lift, 10, 16, 32, { r: 3, tone: 'mid', ...a }).front.slits(2, 8, 3, 6, 26, true, { op: 0.6 * outFlick });   // upper arm
      g.box(x + 1, 113, TZ + 4 + lift, 8, 14, 22, { r: 3, tone: 'hi', ...a });                     // forearm
      g.box(x, 112, TZ - 6 + lift, 10, 16, 10, { r: 4, tone: 'mid', ...a });                       // hand
      const shoulder = [side < 0 ? T0 : T1, CY, TZ + TH - 6 + lift];
      g.bloom(shoulder, 22, k.pulse(side < 0 ? tArms + 1750 : tArms + 1550, 400));
    };
    const showArms = t > tBody + 200;
    pillar(28); const lx = gantry(-1); if (showArms) arm(lx, -1);

    // ---- legs, rising through the hatch ----
    const legH = (TZ - FZ) * rise;
    if (legH > 0.5) {
      // each leg rises with its foot at the bottom: foot first (lower, wider, toe forward), the leg standing on it
      const FH = Math.min(6, legH);
      [112, 136].forEach(x => {
        g.box(x - 2, 110, FZ, 16, 24, FH, { r: 3, tone: 'hi', op: outFlick });
        if (legH > FH + 0.5) g.box(x, 112, FZ + FH, 12, 16, legH - FH, { r: 3, tone: 'mid', op: outFlick }).front.slits(2, 10, 4, 4, Math.max(4, legH - FH - 4), true, { op: 0.5 });
      });
      g.bloom([CX, CY, TZ], 30, k.pulse(tLegs + 2150, 450));
    }

    // ---- torso ----
    if (vis > 0.01) {
      const torso = g.box(T0, TY0, TZ + lift, T1 - T0, TY1 - TY0, TH, { r: 6, tone: 'mid', op: vis, lit: holo });
      torso.front.recess(8, 8, 28, 30, { r: 4, op: vis }).glass(12, 12, 20, 22, { r: 3, lit: power, op: vis })
        .slits(8, 36, 3.5, 44, 52, true, { op: 0.6 * vis });
      torso.front.led(40, 12, 1.8, power * (0.6 + 0.4 * Math.sin(t / 120)));
      torso.side.rect(5, 8, 22, 30, { r: 3, op: vis }).screws(3, 1.4);
      torso.top.circle(22, 16, 9, { role: 'recess', op: vis });                               // neck socket
      if (mat < 1) {                                                                         // hologram scan line climbing the body
        const sz = TZ + lift + TH * ((t / 520) % 1);
        g.line([[T0, TY1, sz], [T1, TY1, sz], [T1, TY0, sz]], { role: 'detail', lit: 1, w: 1.6 });
      }
    }

    // ---- neck and head ----
    if (vis > 0.01 && t > tHead) {
      const neckZ = TZ + TH + lift;
      g.cyl(CX, CY, neckZ, 7, 10, { tone: 'hi', op: vis });
      for (let i = 0; i < 3; i++) g.line(Array.from({ length: 13 }, (_, j) => { const a = j / 12 * 2 * PI - PI / 4; return [CX + 7.2 * Math.cos(a), CY + 7.2 * Math.sin(a), neckZ + 2 + i * 3 + j / 12 * 3]; }).filter(p => Math.cos(Math.atan2(p[1] - CY, p[0] - CX) - PI / 4) > 0), { role: 'detail', op: vis });
      const R = 40 * (1 - headU), phi = headU * 4 * PI;
      const hz0 = neckZ + 4 + 72 * (1 - headU) + 4 * (1 - screw);
      const hx = CX + R * Math.cos(phi), hy = CY + R * Math.sin(phi);
      const spin = PI / 4 + (1 - headU) * 6 * PI + (1 - screw) * PI;
      g.cyl(hx, hy, hz0, 16, 22, { tone: 'hi', op: vis });
      g.cyl(hx, hy, hz0 + 22, 11, 4, { tone: 'mid', op: vis });
      g.line([[hx, hy, hz0 + 26], [hx, hy, hz0 + 38]], { role: 'detail', op: vis });          // antenna
      g.term([hx, hy, hz0 + 38], power * (0.5 + 0.5 * Math.sin(t / 160)), 2.6);
      // visor: a glass band wrapped on the head's front, turning with it
      const vis0 = spin - 0.62, vis1 = spin + 0.62, band = (z, a) => [hx + 16.4 * Math.cos(a), hy + 16.4 * Math.sin(a), z];
      if (Math.cos(spin - PI / 4) > -0.35) {
        const arcPts = (z, rev) => { const o = Array.from({ length: 9 }, (_, j) => band(z, vis0 + (vis1 - vis0) * j / 8)).filter(p => Math.cos(Math.atan2(p[1] - hy, p[0] - hx) - PI / 4) > -0.05); return rev ? o.reverse() : o; };
        const top = arcPts(hz0 + 17), bot = arcPts(hz0 + 9, true);
        if (top.length > 1) g.poly([...top, ...bot], { role: 'glass', lit: power, op: vis });
      }
      [-0.38, 0.38].forEach(d => {                                                          // eyes, turning with the head
        const a = spin + d; if (Math.cos(a - PI / 4) < 0.15) return;
        g.term([hx + 16.8 * Math.cos(a), hy + 16.8 * Math.sin(a), hz0 + 13], power, 3);
      });
      if (power > 0.02) g.bloom([hx + 12, hy + 12, hz0 + 13], 26, power);
      g.bloom([CX, CY, neckZ + 4], 22, k.pulse(tHead + 2550, 400));                       // click
    }

    // ---- right arm and right gantry (in front) ----
    const rx = gantry(1); if (showArms) arm(rx, 1); pillar(214);

    // ---- readout from the model ----
    g.readout(t < tHead ? 'body · ' + Math.round(mat * 100) + '%'
      : t < tArms ? (screw >= 1 ? 'head · locked' : 'head · threading')
      : t < tLegs ? 'arms · ' + ((armU >= 1 ? 1 : 0) + (armUL >= 1 ? 1 : 0)) + ' / 2'
      : t < tOn ? 'legs · ' + Math.round(rise * 100) + '%'
      : power > 0.5 ? 'online · 4 / 4 modules' : 'booting…');
  },
});
