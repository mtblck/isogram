/* Jack-o'-lantern on a crypt altar: cut the lid, scoop the seeds, draw a face, carve it, light a candle.
   The pumpkin is built from lobes (patches between meridians) so its ribs read in every look;
   the face is drawn in surface coordinates (s across, t up) and wrapped onto the front lobes. */
ISOGRAM.define({
  id: 'pumpkin',
  title: "Carving a jack-o'-lantern",
  aria: "Isometric diagram of carving a jack-o'-lantern: a lid is cut around the stem, the seeds are scooped out onto a stone altar, a face is drawn and carved, and a candle inside lights the face while the altar candles flare and bats circle overhead.",
  theme: 'dark',     // a night scene: the light themes lose the mood
  duration: 14000,
  still: 12900,
  beats: [
    { at: 0,     id: 'lid',    caption: 'Cut a lid around the stem',     show: 1900 },
    { at: 2600,  id: 'scoop',  caption: 'Scoop out the seeds',           show: 3900 },
    { at: 5200,  id: 'draw',   caption: 'Draw a face',                   show: 7300 },
    { at: 7800,  id: 'carve',  caption: 'Carve along the lines',         show: 9900 },
    { at: 10400, id: 'light',  caption: 'Drop in a candle and light it', show: 12900 },
  ],
  draw(g, k) {
    const t = k.t, PI = Math.PI;
    // ---- model ----
    const ZT = 75, CX = 140, CY = 122, ZB = ZT, R = 56, HH = 42, ZC = ZB + HH, ZCUT = ZB + 2 * HH - 13, SEEDS = 48;
    const rAt = z => R * Math.sqrt(Math.max(0, 1 - ((z - ZC) / HH) ** 2));
    const tLid = k.at('lid'), tScoop = k.at('scoop'), tDraw = k.at('draw'), tCarve = k.at('carve'), tLight = k.at('light');
    const cut = k.ramp(tLid + 300, tLid + 1500);                                   // knife around the lid
    const lift = k.spring(tLid + 1600, { stiffness: 90, damping: 14 }) * (1 - k.ramp(tLight + 900, tLight + 1600, k.easeInOut));
    const scoopU = k.ramp(tScoop + 200, tScoop + 2300);
    // one scoop: dip in, lift out heaped, swing over the altar, tip everything onto a pile
    const ph = (a, b) => k.easeInOut((scoopU - a) / (b - a));
    const dip = ph(0, 0.25), carry = ph(0.3, 0.72), drop = ph(0.76, 0.92);
    const seedsOut = drop >= 1 ? SEEDS : 0;
    const drawU = k.ramp(tDraw + 200, tDraw + 2300);
    const carveU = k.ramp(tCarve + 200, tCarve + 2300);
    const candleZ = ZCUT + 50 - 80 * k.ramp(tLight + 100, tLight + 900, k.easeInOut);    // lowered through the opening
    const flame = k.env(tLight + 1200, k.duration - 60, 400, 500) * (0.88 + 0.12 * Math.sin(t / 70) * Math.sin(t / 113));
    const altarFlame = k.env(tLight + 1700, k.duration - 60, 300, 500);            // the altar candles flare after the pumpkin

    // ---- crypt floor and gravestones (behind the altar, at the left and right) ----
    const floor = g.box(0, 0, 0, 270, 250, 8, { r: 6, tone: 'lo' });
    floor.top.slits(30, 240, 30, 4, 246, true, { op: 0.7 }).slits(30, 220, 30, 4, 266, false, { op: 0.7 });
    const stoneR = g.box(196, 4, 8, 40, 9, 96, { r: 3, tone: 'mid' });
    stoneR.front.recess(6, 8, 28, 30, { r: 3 }).text(20, 30, 'RIP', { size: 11, align: 'center' }).slits(8, 32, 4, 50, 80, true, { op: 0.6 });
    const stoneL = g.box(4, 82, 8, 9, 40, 84, { r: 3, tone: 'mid' });
    stoneL.side.recess(6, 8, 28, 26, { r: 3 }).text(20, 27, '1897', { size: 8, align: 'center' });

    // ---- the altar: two steps, a carved body, an overhanging slab ----
    g.box(26, 30, 8, 230, 196, 8, { r: 3, tone: 'lo', shadow: true });
    g.box(36, 40, 16, 210, 176, 8, { r: 3, tone: 'lo' });
    const altar = g.box(50, 54, 24, 182, 148, 44, { r: 2, tone: 'mid' });
    altar.front.recess(10, 8, 162, 28, { r: 3 }).text(81, 26, 'MEMENTO MORI', { size: 9, align: 'center' });
    altar.side.recess(10, 8, 128, 28, { r: 3 }).slits(18, 130, 8, 12, 32, true, { op: 0.6 });
    const slab = g.box(42, 46, 68, 198, 164, 7, { r: 3, tone: 'lo' });
    slab.top.rect(6, 6, 186, 152, { r: 3, role: 'detail-rect' });
    const Z0 = ZT;

    // pillar candles on the altar's left and right corners, wax running down
    const pillar = (x, y, h, lit) => {
      g.cyl(x, y, ZT, 8, 3, { tone: 'mid' });
      const c = g.cyl(x, y, ZT + 3, 6, h, { tone: 'hi' });
      g.cyl(x + 3, y + 4, ZT + 3 + h - 9, 2, 9, { tone: 'hi' });                    // a drip
      g.line([[x, y, ZT + 3 + h], [x, y, ZT + 7 + h]], { role: 'detail', w: 1.4 });
      if (lit > 0.02) {
        const f = lit * (0.9 + 0.1 * Math.sin(t / 53 + x));
        const pl = g.front(x - 4, y, ZT + 18 + h);
        g.poly([[0, 0], [3.2, 7], [4, 11], [2, 14], [0, 13], [-2, 14], [-4, 11], [-3.2, 7]].map(([a, b]) => [x + a * 0.7 + b * 0, y - a * 0.7, ZT + 6 + h + b * f]), { role: 'led', lit: f });
        g.bloom([x, y, ZT + 13 + h], 34, f);
      }
      return c;
    };
    pillar(60, 194, 30, altarFlame);
    pillar(224, 62, 40, altarFlame);

    // ---- pumpkin surface helpers ----
    const N = 14, lobeA = i => -PI / 4 + (i / N) * 2 * PI;
    const surf = (a, z, out = 0) => { const r = rAt(z) * (1 + 0.035 * Math.cos(N * (a + PI / 4) / 2) ** 2) + out; return [CX + r * Math.cos(a), CY + r * Math.sin(a), z]; };
    const meridian = (a, z0, z1, n = 10) => Array.from({ length: n + 1 }, (_, j) => surf(a, z0 + (z1 - z0) * j / n));
    const facing = a => Math.cos(a - PI / 4);                                       // 1 = toward the viewer
    const roleOf = a => { const d = ((a % (2 * PI)) + 2 * PI) % (2 * PI); return facing(a) < -0.2 ? 'top' : (d < PI / 4 || d > 7 * PI / 4) ? 'side' : 'front'; };
    const lobes = (z0, z1, off = [0, 0, 0], tone) => Array.from({ length: N }, (_, i) => i)
      .map(i => ({ i, a0: lobeA(i), a1: lobeA(i + 1), f: facing((lobeA(i) + lobeA(i + 1)) / 2) }))
      .sort((p, q) => p.f - q.f)
      .map(L => ({ ...L, pts: [...meridian(L.a0, z0, z1), ...meridian(L.a1, z0, z1).reverse()].map(p => [p[0] + off[0], p[1] + off[1], p[2] + off[2]]),
        role: roleOf((L.a0 + L.a1) / 2), tone: tone || (L.i % 2 ? 'lo' : 'mid') }));
    const ring = (z, out = 0, off = [0, 0, 0]) => Array.from({ length: 40 }, (_, j) => surf(j / 40 * 2 * PI, z, out)).map(p => [p[0] + off[0], p[1] + off[1], p[2] + off[2]]);

    // ---- body: back lobes, the opening, the candle, then front lobes ----
    g.shadow(CX - R, CY - R, 2 * R, 2 * R, { r: R, z: Z0, lift: 4 });
    const body = lobes(ZB, ZCUT);
    body.filter(L => L.f < 0.15).forEach(L => g.poly(L.pts, { role: L.role, tone: L.tone }));
    const open = lift > 0.02;
    if (open) {
      g.poly(ring(ZCUT), { role: 'recess' });
      g.poly(ring(ZCUT, -3.5), { role: 'recess', op: 0.9 });
      // seeds still inside while scooping
      if (t < tScoop || dip < 1) for (let s = 0; s < 6; s++) g.cube(CX - 14 + (s % 3) * 10, CY - 6 + Math.floor(s / 3) * 10, ZCUT - 3, 3.2, { tone: 'hi' });
    }
    if (t > tLight && candleZ > ZCUT - 30) {                                        // candle going in
      g.cyl(CX, CY, candleZ, 7, 16, { tone: 'hi' });
      g.line([[CX, CY, candleZ + 16], [CX, CY, candleZ + 20]], { role: 'detail' });
    }
    body.filter(L => L.f >= 0.15).forEach(L => g.poly(L.pts, { role: L.role, tone: L.tone }));

    // ---- face, in surface coordinates (s across the front, t up from the equator) ----
    const at = (s, tt, out = 0.6) => surf(PI / 4 + s / R, ZC + tt, out);
    const dense = pts => pts.flatMap((p, i) => { const q = pts[(i + 1) % pts.length]; return [0, 1, 2, 3].map(j => [p[0] + (q[0] - p[0]) * j / 4, p[1] + (q[1] - p[1]) * j / 4]); });
    const FACE = [
      [[-28, 6], [-8, 6], [-18, 24]],                                                                   // left eye
      [[8, 6], [28, 6], [18, 24]],                                                                      // right eye
      [[-5, -4], [5, -4], [0, 6]],                                                                      // nose
      [[-34, -10], [-22, -14], [-15, -9], [-7, -15], [7, -15], [15, -9], [22, -14], [34, -10], [24, -25], [0, -31], [-24, -25]], // grin
    ];
    const lightUp = flame;
    FACE.forEach((shape, fi) => {
      const pts = dense(shape).map(([s, tt]) => at(s, tt));
      const drawn = Math.min(1, Math.max(0, drawU * FACE.length - fi));            // marker traces each in turn
      const carved = Math.min(1, Math.max(0, carveU * FACE.length - fi));
      if (carved > 0) {
        g.poly(pts, { role: 'recess', op: Math.min(1, carved * 1.4) });
        if (lightUp > 0.02) g.poly(pts, { role: 'led', lit: lightUp });   // solid, so pixel art snaps to the accent, not a blend
      }
      if (drawn > 0 && carved < 1) {
        const rt = g.route([...pts, pts[0]]);
        const seg = rt.part(0, drawn);
        if (seg) g.line(seg, { role: 'detail', w: 1.6, lit: t > tCarve ? 0.6 * (1 - carved) : 0, op: 1 - carved });
      }
    });
    if (lightUp > 0) g.bloom(at(0, 0, 6), 70, lightUp);

    // ---- lid with stem (lifted, set down beside, then back on) ----
    const lidOff = [-60 * lift, 44 * lift, (26 + 4 * Math.sin(t / 420)) * lift];   // the lid floats beside, bobbing
    // the cut seam: bright while the knife makes it, then dark, then leaking candlelight once the lid is back on
    // knife and seam share one angle, so the blade is always at the end of the cut
    const CUT0 = PI / 4 - 1.6, CUT1 = PI / 4 + 1.6, cutA = CUT0 + (CUT1 - CUT0) * cut;
    const seam = to => Array.from({ length: 33 }, (_, j) => surf(CUT0 + (to - CUT0) * j / 32, ZCUT, 0.8));
    if (cut > 0 && lift < 0.02) g.line(seam(cutA), { role: 'detail', w: 1.4, lit: t < tScoop ? 1 - cut * 0.5 : flame * 0.7 });
    lobes(ZCUT, ZB + 2 * HH, lidOff, null).forEach(L => g.poly(L.pts, { role: L.role, tone: L.tone }));
    g.cyl(CX + lidOff[0], CY + lidOff[1], ZB + 2 * HH - 4 + lidOff[2], 6, 14, { tone: 'lo' });   // stem
    g.cyl(CX + 2 + lidOff[0], CY + 1 + lidOff[1], ZB + 2 * HH + 10 + lidOff[2], 3, 4, { tone: 'lo' });

    // ---- seeds pile up on the altar, beside a skull ----
    const PILE = [176, 196], SPOON_HI = ZCUT + 34;
    if (t > tScoop && drop > 0) for (let sd = 0; sd < 16; sd++) {
      const a = sd * 2.4, r = 2 + (sd % 5) * 3, fall = Math.min(1, Math.max(0, drop * 1.3 - (sd % 4) * 0.08));
      const zRest = Z0 + (sd > 10 ? 3 : 0), z = SPOON_HI + 2 + (zRest - SPOON_HI - 2) * fall * fall;
      g.cube(PILE[0] + r * fall * Math.cos(a) - 1.6, PILE[1] + r * fall * Math.sin(a) * 0.6 - 1.6, z, 3.2, { tone: 'hi' });
    }
    g.box(209, 183, ZT, 13, 11, 5, { r: 3, tone: 'hi' });                            // jaw
    const skull = g.box(206, 176, ZT + 4, 19, 16, 15, { r: 7, tone: 'hi' });           // cranium
    skull.front.circle(5.5, 7, 3).circle(13.5, 7, 3);
    skull.front.circle(9.5, 11.5, 1.2);
    g.front(209, 194, ZT + 5, 13, 5).slits(2, 11, 2.2, 0, 4);                         // teeth on the jaw

    // ---- tools (above everything) ----
    if (t > tLid && t < tLid + 1700) {                                                // knife rides the cut
      const p = surf(cutA, ZCUT, 2);
      g.box(p[0] - 1, p[1] - 4, ZCUT - 6, 2, 8, 18, { material: 'silhouette' });
      g.box(p[0] - 3, p[1] - 4, ZCUT + 12, 6, 8, 16, { r: 2, material: 'silhouette' });
    }
    if (t > tScoop && t < tScoop + 2500 && drop < 1) {                                // one big scoop to the pile
      const up = ZCUT + 10 + (SPOON_HI - ZCUT - 10) * (1 - Math.cos(PI * carry)) / 2 + (1 - dip) * 20;
      const x = CX + (PILE[0] - CX) * carry, y = CY + (PILE[1] - CY) * carry, z = carry > 0 ? Math.max(up, ZCUT + 10 + 30 * Math.sin(PI * carry)) : ZCUT + 30 - 22 * dip;
      g.cyl(x, y, z, 9, 4, { material: 'silhouette' });                               // bowl of the scoop
      g.box(x + 6, y - 2, z + 2, 34, 4, 3, { r: 1.5, material: 'silhouette' });       // handle
      if (dip >= 1 && drop <= 0) for (let sd = 0; sd < 6; sd++) g.cube(x - 5 + (sd % 3) * 3.5, y - 4 + Math.floor(sd / 3) * 4, z + 4 + (sd === 1 || sd === 4 ? 2 : 0), 3.2, { tone: 'hi' });   // heaped seeds
    }
    if (t > tDraw && t < tDraw + 2500 && drawU < 1) {                                  // marker on the face
      const fi = Math.min(FACE.length - 1, Math.floor(drawU * FACE.length)), u = drawU * FACE.length - fi;
      const pts = dense(FACE[fi]).map(([s, tt]) => at(s, tt)), p = g.route([...pts, pts[0]]).at(u);
      g.box(p[0] - 2, p[1] + 2, p[2], 4, 4, 30, { r: 1.5, material: 'silhouette' });
    }
    if (t > tCarve && t < tCarve + 2500 && carveU < 1) {                               // knife works the openings
      const fi = Math.min(FACE.length - 1, Math.floor(carveU * FACE.length)), u = carveU * FACE.length - fi;
      const pts = dense(FACE[fi]).map(([s, tt]) => at(s, tt, 2)), p = g.route([...pts, pts[0]]).at(u);
      g.box(p[0] - 1, p[1] + 1, p[2] - 4, 2, 8, 18, { material: 'silhouette' });
      g.box(p[0] - 3, p[1] + 1, p[2] + 14, 6, 8, 16, { r: 2, material: 'silhouette' });
    }
    // carved pieces drop onto the altar in front
    FACE.forEach((_, fi) => { if (carveU * FACE.length - fi > 1) g.box(92 + fi * 13, 196, Z0, 9, 7, 3, { r: 2, tone: 'hi' }); });

    // ---- bats circling overhead ----
    for (let b = 0; b < 3; b++) {
      const a = t / 2600 + b * 2.1, flap = Math.sin(t / 90 + b * 1.7);
      const c = [CX + 84 * Math.cos(a), CY + 70 * Math.sin(a), 188 + 12 * Math.sin(a * 2 + b)], S = 0.9 + 0.15 * b;
      const U = [0.707, -0.707, 0], V = [0, 0, -1];
      const P = (u, v) => [c[0] + (U[0] * u + V[0] * v) * S, c[1] + (U[1] * u + V[1] * v) * S, c[2] + (U[2] * u + V[2] * v) * S];
      const tip = -5 * flap;
      g.poly([[-16, tip], [-11, tip - 1], [-8, 1], [-5, -1], [-2, -3], [0, -1], [2, -3], [5, -1], [8, 1], [11, tip - 1], [16, tip], [10, 3], [5, 2], [0, 5], [-5, 2], [-10, 3]].map(([u, v]) => P(u, v)), { role: 'silhouette' });
    }

    // ---- readout from the model ----
    g.readout(t < tScoop ? (lift > 0.02 ? 'lid off · ' + Math.round(2 * rAt(ZCUT) / 4) + ' cm across' : 'cutting · ' + Math.round(cut * 100) + '%')
      : t < tDraw ? (seedsOut ? 'seeds · ' + SEEDS + ' out' : dip < 1 ? 'scooping…' : 'lifting · ' + SEEDS + ' seeds')
      : t < tCarve ? 'face · ' + Math.min(FACE.length, Math.floor(drawU * FACE.length + 0.001)) + ' / ' + FACE.length + ' drawn'
      : t < tLight ? 'carved · ' + Math.min(FACE.length, Math.floor(carveU * FACE.length + 0.001)) + ' / ' + FACE.length
      : flame > 0.05 ? 'lit · candle burning' : 'candle going in');
  },
});
