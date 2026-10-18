/* Jack-o'-lantern: cut the lid, scoop the seeds, draw a face, carve it, light a candle.
   The pumpkin is built from lobes (patches between meridians) so its ribs read in every look;
   the face is drawn in surface coordinates (s across, t up) and wrapped onto the front lobes. */
ISOGRAM.define({
  id: 'pumpkin',
  title: "Carving a jack-o'-lantern",
  aria: "Isometric diagram of carving a jack-o'-lantern: a lid is cut around the stem, the seeds are scooped into a bowl, a face is drawn and carved out, and a candle inside lights the face.",
  duration: 14000,
  still: 12900,
  beats: [
    { at: 0,     id: 'lid',    caption: 'Cut a lid around the stem',     show: 1900 },
    { at: 2600,  id: 'scoop',  caption: 'Scoop out the seeds',           show: 4600 },
    { at: 5200,  id: 'draw',   caption: 'Draw a face',                   show: 7300 },
    { at: 7800,  id: 'carve',  caption: 'Carve along the lines',         show: 9900 },
    { at: 10400, id: 'light',  caption: 'Drop in a candle and light it', show: 12900 },
  ],
  draw(g, k) {
    const t = k.t, PI = Math.PI;
    // ---- model ----
    const CX = 118, CY = 100, ZB = 14, R = 60, HH = 46, ZC = ZB + HH, ZCUT = 92, SEEDS = 48;
    const rAt = z => R * Math.sqrt(Math.max(0, 1 - ((z - ZC) / HH) ** 2));
    const tLid = k.at('lid'), tScoop = k.at('scoop'), tDraw = k.at('draw'), tCarve = k.at('carve'), tLight = k.at('light');
    const cut = k.ramp(tLid + 300, tLid + 1500);                                   // knife around the lid
    const lift = k.spring(tLid + 1600, { stiffness: 90, damping: 14 }) * (1 - k.ramp(tLight + 900, tLight + 1600, k.easeInOut));
    const scoopU = k.ramp(tScoop + 200, tScoop + 2300);
    const seeds = Math.round(SEEDS * scoopU);
    const drawU = k.ramp(tDraw + 200, tDraw + 2300);
    const carveU = k.ramp(tCarve + 200, tCarve + 2300);
    const candleZ = 150 - 88 * k.ramp(tLight + 100, tLight + 900, k.easeInOut);    // lowered through the opening
    const flame = k.env(tLight + 1200, k.duration - 60, 400, 500) * (0.88 + 0.12 * Math.sin(t / 70) * Math.sin(t / 113));

    // ---- board ----
    g.plate(0, 0, 0, 240, 214, 8, { r: 14, inset: 6 });
    const board = g.box(16, 14, 8, 208, 184, 6, { r: 10, tone: 'mid' });
    board.top.slits(14, 194, 20, 10, 174, true, { op: 0.6 });                     // grain
    const Z0 = 14;

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
      if (seeds < SEEDS) for (let s = 0; s < 6 - Math.floor(6 * seeds / SEEDS); s++) g.cube(CX - 14 + (s % 3) * 10, CY - 6 + Math.floor(s / 3) * 10, ZCUT - 3, 3.2, { tone: 'hi' });
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
    const off = [-72 * lift, 60 * lift, 22 * Math.sin(PI * Math.min(1, lift)) - (ZCUT - Z0) * lift * 0];
    const lidDrop = lift > 0.5 ? (ZCUT - Z0 - 2) * (lift - 0.5) * 2 : 0;          // comes to rest on the board
    const lidOff = [off[0], off[1], off[2] - lidDrop];
    // the cut seam: bright while the knife makes it, then dark, then leaking candlelight once the lid is back on
    if (cut > 0 && lift < 0.02) g.line(ring(ZCUT, 0.8).filter(p => facing(Math.atan2(p[1] - CY, p[0] - CX)) > -0.1).slice(0, Math.max(2, Math.round(40 * cut))), { role: 'detail', w: 1.4, lit: t < tScoop ? 1 - cut * 0.5 : flame * 0.7 });
    lobes(ZCUT, ZB + 2 * HH, lidOff, null).forEach(L => g.poly(L.pts, { role: L.role, tone: L.tone }));
    g.cyl(CX + lidOff[0], CY + lidOff[1], ZB + 2 * HH - 4 + lidOff[2], 6, 14, { tone: 'lo' });   // stem
    g.cyl(CX + 2 + lidOff[0], CY + 1 + lidOff[1], ZB + 2 * HH + 10 + lidOff[2], 3, 4, { tone: 'lo' });

    // ---- seed bowl (front right) ----
    const bowl = g.cyl(190, 158, Z0, 22, 14, { tone: 'mid', shadow: true });
    bowl.ring(17, { role: 'recess' });
    for (let s = 0; s < Math.min(14, Math.round(14 * seeds / SEEDS)); s++) {
      const a = s * 2.4, r = 5 + (s % 4) * 3.2;
      g.cube(190 + r * Math.cos(a) - 1.6, 158 + r * Math.sin(a) - 1.6, Z0 + 14, 3.2, { tone: 'hi' });
    }

    // ---- tools (above everything) ----
    if (t > tLid && t < tLid + 1700) {                                                // knife rides the cut
      const a = PI / 4 + (cut - 0.5) * 2.4, p = surf(a, ZCUT, 2);
      g.box(p[0] - 1, p[1] - 4, ZCUT - 6, 2, 8, 18, { tone: 'hi' });
      g.box(p[0] - 3, p[1] - 4, ZCUT + 12, 6, 8, 16, { r: 2, tone: 'lo' });
    }
    if (t > tScoop && t < tScoop + 2500) {                                            // spoon shuttles seeds to the bowl
      const trip = (scoopU * 4) % 1, out = Math.sin(PI * trip);
      const x = CX + (190 - CX) * out, y = CY + (158 - CY) * out, z = ZCUT + 6 + 24 * Math.sin(PI * trip);
      g.cyl(x, y, z, 7, 3, { tone: 'hi' });
      g.box(x + 4, y - 2, z + 2, 30, 4, 3, { r: 1.5, tone: 'lo' });
      if (out > 0.05 && out < 0.95) g.cube(x - 2, y - 2, z + 3, 3.2, { tone: 'hi' });
    }
    if (t > tDraw && t < tDraw + 2500 && drawU < 1) {                                  // marker on the face
      const fi = Math.min(FACE.length - 1, Math.floor(drawU * FACE.length)), u = drawU * FACE.length - fi;
      const pts = dense(FACE[fi]).map(([s, tt]) => at(s, tt)), p = g.route([...pts, pts[0]]).at(u);
      g.box(p[0] - 2, p[1] + 2, p[2], 4, 4, 30, { r: 1.5, tone: 'lo' });
    }
    if (t > tCarve && t < tCarve + 2500 && carveU < 1) {                               // knife works the openings
      const fi = Math.min(FACE.length - 1, Math.floor(carveU * FACE.length)), u = carveU * FACE.length - fi;
      const pts = dense(FACE[fi]).map(([s, tt]) => at(s, tt, 2)), p = g.route([...pts, pts[0]]).at(u);
      g.box(p[0] - 1, p[1] + 1, p[2] - 4, 2, 8, 18, { tone: 'hi' });
      g.box(p[0] - 3, p[1] + 1, p[2] + 14, 6, 8, 16, { r: 2, tone: 'lo' });
    }
    // carved pieces land on the board in front
    FACE.forEach((_, fi) => { if (carveU * FACE.length - fi > 1) g.box(62 + fi * 15, 178, Z0, 10, 8, 3, { r: 2, tone: 'hi' }); });

    // ---- readout from the model ----
    g.readout(t < tScoop ? (lift > 0.02 ? 'lid off · ' + Math.round(2 * rAt(ZCUT) / 4) + ' cm across' : 'cutting · ' + Math.round(cut * 100) + '%')
      : t < tDraw ? 'seeds · ' + seeds + ' / ' + SEEDS
      : t < tCarve ? 'face · ' + Math.min(FACE.length, Math.floor(drawU * FACE.length + 0.001)) + ' / ' + FACE.length + ' drawn'
      : t < tLight ? 'carved · ' + Math.min(FACE.length, Math.floor(carveU * FACE.length + 0.001)) + ' / ' + FACE.length
      : flame > 0.05 ? 'lit · candle burning' : 'candle going in');
  },
});
