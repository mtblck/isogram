/* Rocket round trip: drones stack four stages on an Earth pad, it launches, coasts across space,
   lands tail-first on a deck on top of a small planet, and drones unstack it into a row there.
   At the loop's end the planet row fades out as the Earth row fades back in, so the build restarts cleanly. */
ISOGRAM.define({
  id: 'rocket',
  title: 'A rocket round trip',
  aria: 'Isometric diagram of a rocket being stacked by drones on a launch pad, launching, coasting through space, landing on a small planet, and being unstacked there into parts.',
  theme: 'dark',
  duration: 15000,
  still: 4900,
  beats: [
    { at: 0,     id: 'build', caption: 'Drones stack the stages',     show: 3000 },
    { at: 3600,  id: 'launch', caption: 'Ignition and lift-off',      show: 5000 },
    { at: 5600,  id: 'coast', caption: 'Coast through space',         show: 6700 },
    { at: 7600,  id: 'land',  caption: 'Land on a new world',         show: 9050 },
    { at: 9600,  id: 'unstack', caption: 'Unstack it for parts',      show: 12900 },
  ],
  draw(g, k) {
    const t = k.t, PI = Math.PI, D = k.duration;
    const hash = n => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
    // ---- model ----
    const PAD = [60, 185], PAD_Z = 18;                            // Earth pad centre, pad top
    const PL = [252, 44], PL_C = 70, PL_R = 56, DECK_Z = 126;     // planet centre, radius, deck top
    const H = [22, 46, 20, 24], NAMES = ['engine', 'tank', 'upper stage', 'nose'];
    const stackZ = i => H.slice(0, i).reduce((a, b) => a + b, 0);
    const ROW_E = [[22, 226], [52, 226], [82, 226], [112, 226]];                 // along the island's front edge
    const ROW_P = [-39, -13, 13, 39].map(o => [PL[0] + o * 0.707, PL[1] - o * 0.707]);                 // a row across the deck
    const tBuild = k.at('build'), tLaunch = k.at('launch'), tCoast = k.at('coast'), tLand = k.at('land'), tUn = k.at('unstack');
    const APEX = 168;
    const ign = k.ramp(tLaunch + 700, tLaunch + 900), liftU = k.ramp(tLaunch + 900, tCoast, x => x * x);
    const coastU = k.ramp(tCoast, tLand, k.easeInOut), landU = k.ramp(tLand, tLand + 1500, x => 1 - (1 - x) ** 2);
    const base = t < tCoast ? [PAD[0], PAD[1], PAD_Z + (APEX - PAD_Z) * liftU]
      : t < tLand ? [PAD[0] + (PL[0] - PAD[0]) * coastU, PAD[1] + (PL[1] - PAD[1]) * coastU, APEX + 6 * Math.sin(PI * coastU)]
      : [PL[0], PL[1], APEX + (DECK_Z - APEX) * landU];
    const burn = t < tCoast ? ign * (t > tLaunch + 700 ? 1 : 0) : (t > tLand && landU < 1 ? 0.8 : 0);
    const flick = 0.85 + 0.15 * Math.sin(t / 37) * Math.sin(t / 61);
    // a part moving between two points: up, across, down (u 0..1)
    const carry = (from, to, u) => {
      const s = x => k.smooth(x), top = Math.max(from[2], to[2]) + 46;
      if (u < 0.3) return [from[0], from[1], from[2] + (top - from[2]) * s(u / 0.3)];
      if (u < 0.7) { const v = s((u - 0.3) / 0.4); return [from[0] + (to[0] - from[0]) * v, from[1] + (to[1] - from[1]) * v, top]; }
      return [to[0], to[1], top + (to[2] - top) * s((u - 0.7) / 0.3)];
    };
    const pickU = i => k.ramp(tBuild + 250 + i * 820, tBuild + 250 + i * 820 + 780, x => x);        // building, bottom first
    const dropU = i => k.ramp(tUn + 300 + (3 - i) * 760, tUn + 300 + (3 - i) * 760 + 720, x => x);    // unstacking, top first
    const fadeP = 1 - k.ramp(D - 800, D - 150), fadeE = k.ramp(D - 800, D - 150);

    // ---- one stage, standing on z0 ----
    const part = (i, x, y, z0, op = 1) => {
      const o = { op, material: 'silhouette' };                  // pale rocket against the stone and the planet
      if (i === 0) {
        [[11, -1.5, 8, 3], [-19, -1.5, 8, 3], [-1.5, 11, 3, 8], [-1.5, -19, 3, 8]].forEach(([dx, dy, w, d], f) => { if (f < 2 || f === 3) g.box(x + dx, y + dy, z0, w, d, 18, { tone: 'lo', ...o }); });
        g.cyl(x, y, z0, 8, 6, { tone: 'lo', ...o });                               // nozzle
        g.cyl(x, y, z0 + 6, 13, 16, { tone: 'mid', ...o });
        g.box(x - 1.5, y + 11, z0, 3, 8, 18, { tone: 'lo', ...o });                // front fin last
      } else if (i === 1) {
        const c = g.cyl(x, y, z0, 13, 46, { tone: 'hi', ...o });
        [8, 38].forEach(z => g.line(Array.from({ length: 13 }, (_, j) => { const a = -PI / 4 + j / 12 * PI; return [x + 13.2 * Math.cos(a), y + 13.2 * Math.sin(a), z0 + z]; }), { role: 'detail', op }));
      } else if (i === 2) {
        g.cyl(x, y, z0, 11, 20, { tone: 'mid', ...o });
        const a = PI / 4, w = [x + 11.3 * Math.cos(a), y + 11.3 * Math.sin(a), z0 + 11];
        g.term(w, burn > 0 || t > tLand ? 0 : 0, 3.2);                              // porthole
      } else {
        [[11, 4], [9.5, 5], [7.5, 5], [5, 5], [2.5, 5]].reduce((z, [r, h]) => { g.cyl(x, y, z, r, h, { tone: 'hi', ...o }); return z + h; }, z0);
      }
    };

    // ---- stars (behind everything) ----
    for (let s = 0; s < 34; s++) {
      const p = [hash(s) * 300 - 20, hash(s + 50) * 260 - 40, 150 + hash(s + 99) * 150];
      g.term(p, 0, 0.9 + 0.7 * hash(s + 7) * (0.5 + 0.5 * Math.sin(t / 300 + s)));
    }

    // ---- Earth island: pad, tower, parts waiting in a row ----
    const isl = g.box(0, 110, 0, 130, 130, 12, { r: 10, tone: 'lo', shadow: true });
    isl.top.slits(10, 120, 10, 6, 124, true, { op: 0.35 });
    isl.front.slits(6, 124, 6, 3, 9, true, { op: 0.5 });
    const pad = g.cyl(PAD[0], PAD[1], 12, 26, 6, { tone: 'mid' });
    pad.ring(18, { role: 'detail' });
    ROW_E.forEach(([x, y], i) => { const u = pickU(i); if (u <= 0) part(i, x, y, 12, t < 200 ? 1 : 1 - 0); else if (fadeE > 0) part(i, x, y, 12, fadeE); });
    const tower = g.box(96, 150, 12, 14, 14, 112, { r: 2, tone: 'mid' });
    tower.front.slits(3, 11, 4, 6, 106, true, { op: 0.6 }); tower.side.slits(3, 11, 4, 6, 106, true, { op: 0.6 });
    [40, 80, 110].forEach((z, j) => g.term([103, 164, 12 + z], 0.5 + 0.5 * Math.sin(t / 250 + j), 1.8));        // tower lights blink
    g.box(74, 154, 104, 22, 6, 5, { r: 1, tone: 'mid', op: t < tLaunch + 700 ? 1 : 1 });                   // umbilical arm

    // ---- the planet, its deck, parts set down there ----
    const N = 16, surf = (a, z) => { const r = Math.sqrt(Math.max(0, PL_R * PL_R - (z - PL_C) ** 2)); return [PL[0] + r * Math.cos(a), PL[1] + r * Math.sin(a), z]; };
    const lat = th => PL_C - PL_R * Math.cos(th);                              // sample by latitude so the poles stay round
    const facing = a => Math.cos(a - PI / 4);
    const lobes = Array.from({ length: N }, (_, i) => ({ a0: -PI / 4 + i / N * 2 * PI, a1: -PI / 4 + (i + 1) / N * 2 * PI })).map(L => ({ ...L, f: facing((L.a0 + L.a1) / 2) })).sort((p, q) => p.f - q.f);
    g.line(Array.from({ length: 49 }, (_, j) => { const a = j / 48 * 2 * PI; return [PL[0] + 84 * Math.cos(a), PL[1] + 84 * Math.sin(a), PL_C]; }).filter(p => facing(Math.atan2(p[1] - PL[1], p[0] - PL[0])) < 0), { role: 'detail', op: 0.6 });   // orbit ring, back half
    lobes.forEach((L, i) => {
      const m = (a) => Array.from({ length: 13 }, (_, j) => surf(a, lat(j / 12 * PI)));
      const mid = (L.a0 + L.a1) / 2, d = ((mid % (2 * PI)) + 2 * PI) % (2 * PI);
      g.poly([...m(L.a0), ...m(L.a1).reverse()], { role: L.f < -0.2 ? 'top' : (d < PI / 4 || d > 7 * PI / 4) ? 'side' : 'front', tone: 'mid', lit: 0.5, edge: false });
    });
    [[0.55, 92, 7], [0.95, 60, 9], [0.25, 54, 5]].forEach(([a, z, r]) => {                     // craters on the near side
      const A = PI / 4 + (a - 0.55) * 2.2;
      g.poly(Array.from({ length: 14 }, (_, j) => { const q = j / 14 * 2 * PI; return surf(A + r / PL_R * Math.cos(q) * 1.2, z + r * 0.8 * Math.sin(q)); }), { role: 'recess', op: 0.55 });
    });
    g.line(Array.from({ length: 49 }, (_, j) => { const a = j / 48 * 2 * PI; return [PL[0] + 84 * Math.cos(a), PL[1] + 84 * Math.sin(a), PL_C]; }).filter(p => facing(Math.atan2(p[1] - PL[1], p[0] - PL[0])) >= 0), { role: 'detail', op: 0.6 });  // orbit ring, front half
    g.cyl(PL[0], PL[1], 104, 16, 16, { tone: 'mid' });                                                        // column up to the deck
    const deck = g.cyl(PL[0], PL[1], DECK_Z - 6, 54, 6, { tone: 'mid' });
    deck.ring(18, { role: 'detail' });
    const landed = t > tLand && landU >= 1 && t < tUn + 2000;
    for (let j = 0; j < 8; j++) { const a = j / 8 * 2 * PI; g.term([PL[0] + 21 * Math.cos(a), PL[1] + 21 * Math.sin(a), DECK_Z], t > tLand ? (landU < 1 ? (Math.floor(t / 150) + j) % 2 : landed ? 0.6 : 0) : 0, 1.6); }
    ROW_P.forEach(([x, y], i) => { if (dropU(i) >= 1) part(i, x, y, DECK_Z, fadeP); });

    // ---- the rocket: the stages it has right now ----
    const onRocket = i => (t < tUn ? pickU(i) >= 1 : dropU(i) <= 0);
    if (burn > 0) {                                                           // exhaust flame under the nozzle
      const L = (t < tCoast ? 30 : 18) * flick * burn, U = [0.707, -0.707, 0], V = [0, 0, -1];
      const P = (u, v) => [base[0] + U[0] * u, base[1] + U[1] * u, base[2] - v];
      g.poly([[-6, 0], [6, 0], [4.5, L * 0.45], [0, L], [-4.5, L * 0.45]].map(([u, v]) => P(u, v)), { role: 'led', lit: Math.min(1, burn * flick) });
      g.bloom([base[0], base[1], base[2] - L * 0.4], 40, burn);
    }
    const smoke = t > tLaunch + 700 ? k.env(tLaunch + 700, tLaunch + 2600, 200, 900) : 0;   // smoke rolling over the pad
    if (smoke > 0.02) for (let s = 0; s < 10; s++) {
      const a = s / 10 * 2 * PI + 0.3, r = 18 + 26 * k.ramp(tLaunch + 700, tLaunch + 2600) * (0.7 + 0.3 * hash(s));
      const sz = 6 + 6 * hash(s + 3);
      g.box(PAD[0] + r * Math.cos(a) - sz / 2, PAD[1] + r * Math.sin(a) - sz / 2, PAD_Z, sz, sz, sz * 0.7, { r: sz / 2, material: 'silhouette', op: smoke * 0.85 });
    }
    [0, 1, 2, 3].forEach(i => { if (onRocket(i)) part(i, base[0], base[1], base[2] + stackZ(i)); });

    // ---- drones carrying stages (always on top) ----
    const drone = (p, lit) => {
      g.line([[p[0], p[1], p[2]], [p[0], p[1], p[2] + 14]], { role: 'detail' });
      g.box(p[0] - 6, p[1] - 6, p[2] + 14, 12, 12, 4, { r: 3, material: 'silhouette' });
      [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([dx, dy]) => g.cyl(p[0] + dx, p[1] + dy, p[2] + 18, 4.5, 1, { material: 'silhouette' }));
      g.term([p[0] + 6, p[1] + 6, p[2] + 16], lit, 1.4);
    };
    [0, 1, 2, 3].forEach(i => {
      const u = pickU(i);
      if (u > 0 && u < 1) { const p = carry([...ROW_E[i], 12], [PAD[0], PAD[1], PAD_Z + stackZ(i)], u); part(i, p[0], p[1], p[2]); drone([p[0], p[1], p[2] + H[i]], 1); }
      const v = dropU(i);
      if (v > 0 && v < 1) { const p = carry([PL[0], PL[1], DECK_Z + stackZ(i)], [...ROW_P[i], DECK_Z], v); part(i, p[0], p[1], p[2]); drone([p[0], p[1], p[2] + H[i]], 1); }
    });

    // ---- readout from the model ----
    const stacked = [0, 1, 2, 3].filter(i => pickU(i) >= 1).length, off = [0, 1, 2, 3].filter(i => dropU(i) >= 1).length;
    const cd = 3 - Math.floor((t - tLaunch) / 240);
    g.readout(t < tLaunch ? 'stages · ' + stacked + ' / 4'
      : t < tLaunch + 720 ? 'T-' + Math.max(1, Math.min(3, cd))
      : t < tCoast ? 'lift-off · ' + Math.round(liftU * 120) + ' km'
      : t < tLand ? 'coasting · ' + Math.round(coastU * 100) + '%'
      : t < tUn ? (landU < 1 ? 'descent · ' + Math.round((1 - landU) * 120) + ' m' : 'touchdown')
      : 'unstacked · ' + off + ' / 4');
  },
});
