/* Rocket round trip, seen from the rocket: drones stack four stages on a construction platform that fills
   the view; at lift-off the platform falls away and the stars stream past; another platform rises to meet
   it, the rocket settles onto its pad, and drones unstack it into the same row the build started from.
   The end state is the start state, so the loop is seamless. */
ISOGRAM.define({
  id: 'rocket',
  title: 'A rocket round trip',
  aria: 'Isometric diagram of a rocket being stacked by drones on a construction platform, lifting off as the platform falls away, flying through streaming stars, landing on another platform and being unstacked there into parts.',
  theme: 'dark',
  duration: 15000,
  still: 2200,
  bounds: [[0, 0, -14], [164, 0, -14], [0, 164, -14], [164, 164, -14], [0, 0, 176], [164, 164, 176], [164, 0, 176], [0, 164, 176]],
  margin: 0.03,
  beats: [
    { at: 0,     id: 'build',   caption: 'Drones stack the stages',            show: 2200 },
    { at: 3700,  id: 'launch',  caption: 'Lift-off: the platform falls away',  show: 5100 },
    { at: 5800,  id: 'coast',   caption: 'Sail through the stars',             show: 7300 },
    { at: 8600,  id: 'land',    caption: 'A new platform rises to meet it',    show: 10200 },
    { at: 10700, id: 'unstack', caption: 'Unstack it for parts',               show: 14200 },
  ],
  draw(g, k) {
    const t = k.t, PI = Math.PI;
    const hash = n => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
    // ---- model ----
    const W = 164, PAD = [80, 74], PAD_Z = 20, CRUISE = 64;          // platform size, pad centre and top, flying height
    const H = [22, 46, 20, 24];                                      // engine, tank, upper stage, nose
    const stackZ = i => H.slice(0, i).reduce((a, b) => a + b, 0);
    const ROW = [[26, 146], [64, 146], [102, 146], [136, 146]];      // parts wait along the front edge
    const tBuild = k.at('build'), tLaunch = k.at('launch'), tCoast = k.at('coast'), tLand = k.at('land'), tUn = k.at('unstack');
    const tIgn = tLaunch + 800;                                      // after a three-step countdown
    const pickU = i => k.ramp(tBuild + 250 + i * 840, tBuild + 250 + i * 840 + 800, x => x);         // building, bottom first
    const dropU = i => k.ramp(tUn + 300 + (3 - i) * 800, tUn + 300 + (3 - i) * 800 + 760, x => x);   // unstacking, top first
    // the camera rides with the rocket: lift-off moves the platform down, not the rocket up (after a short climb)
    const climb = k.ramp(tIgn, tIgn + 1600, k.easeInOut), settle = k.ramp(tLand + 300, tLand + 1700, x => 1 - (1 - x) ** 2);
    const fall = k.ramp(tIgn + 200, tIgn + 2000, x => x * x), rise = k.ramp(tLand - 200, tLand + 1700, x => 1 - (1 - x) ** 3);
    const platZ = t < tCoast ? -150 * fall : t < tLand - 200 ? -150 : -150 * (1 - rise);
    const platOp = t < tCoast ? 1 - k.ramp(tIgn + 900, tIgn + 2000) : t < tLand - 200 ? 0 : k.ramp(tLand - 200, tLand + 700);
    const rz = t < tLand ? PAD_Z + (CRUISE - PAD_Z) * climb : CRUISE + (PAD_Z + 0 - CRUISE) * settle;   // rocket base, in view
    const bob = t > tIgn + 1600 && t < tLand + 300 ? 1.5 * Math.sin((t - tIgn) / 260) : 0;
    const base = [PAD[0], PAD[1], rz + bob];
    const flying = t > tIgn && (t < tLand + 1700);
    const burn = !flying ? 0 : t < tLand ? k.ramp(tIgn - 60, tIgn + 80) : 0.75 * (1 - k.ramp(tLand + 1500, tLand + 1750));
    const flick = 0.85 + 0.15 * Math.sin(t / 37) * Math.sin(t / 61);
    // star speed: 0 on the ground, up through lift-off, full while coasting, down for the landing
    const speed = tt => tt < tIgn ? 0 : tt < tCoast ? k.smooth((tt - tIgn) / (tCoast - tIgn)) : tt < tLand - 200 ? 1 : 1 - k.smooth((tt - tLand + 200) / 1900);
    let scroll = 0; for (let s = tIgn; s < t; s += 40) scroll += speed(s) * 40 * 0.22;            // distance flown, in scene units
    const v = speed(t);

    // ---- stars: dots at rest, streaks while flying (drawn first, behind everything) ----
    for (let s = 0; s < 46; s++) {
      const x = hash(s) * 190 - 10, y = hash(s + 50) * 190 - 10, span = 200;
      const z = ((hash(s + 99) * span - scroll) % span + span) % span - 20;
      const tw = 0.9 + 0.7 * hash(s + 7) * (0.5 + 0.5 * Math.sin(t / 300 + s));
      if (v > 0.08) g.line([[x, y, z], [x, y, z + 3 + 26 * v * (0.6 + 0.4 * hash(s + 3))]], { role: 'wire', under: false, op: 0.55 + 0.35 * hash(s + 5) });
      else g.term([x, y, z], 0, tw);
    }

    // ---- one stage, standing on z0 ----
    const part = (i, x, y, z0, op = 1) => {
      const o = { op, material: 'silhouette' };                     // pale rocket against the dark stage
      if (i === 0) {
        [[11, -1.5, 8, 3], [-19, -1.5, 8, 3], [-1.5, -19, 3, 8]].forEach(([dx, dy, w, d]) => g.box(x + dx, y + dy, z0, w, d, 18, { tone: 'lo', ...o }));
        g.cyl(x, y, z0, 8, 6, { tone: 'lo', ...o });                // nozzle
        g.cyl(x, y, z0 + 6, 13, 16, { tone: 'mid', ...o });
        g.box(x - 1.5, y + 11, z0, 3, 8, 18, { tone: 'lo', ...o }); // front fin last
      } else if (i === 1) {
        g.cyl(x, y, z0, 13, 46, { tone: 'hi', ...o });
        [8, 38].forEach(z => g.line(Array.from({ length: 13 }, (_, j) => { const a = -PI / 4 + j / 12 * PI; return [x + 13.2 * Math.cos(a), y + 13.2 * Math.sin(a), z0 + z]; }), { role: 'detail', op }));
      } else if (i === 2) {
        g.cyl(x, y, z0, 11, 20, { tone: 'mid', ...o });
        g.term([x + 11.3 * Math.cos(PI / 4), y + 11.3 * Math.sin(PI / 4), z0 + 11], flying ? 0.8 : 0, 3.2);   // porthole lit in flight
      } else {
        [[11, 4], [9.5, 5], [7.5, 5], [5, 5], [2.5, 5]].reduce((z, [r, h]) => { g.cyl(x, y, z, r, h, { tone: 'hi', ...o }); return z + h; }, z0);
      }
    };

    // ---- the construction platform (falls away at lift-off, a new one rises for the landing) ----
    if (platOp > 0.01) {
      const z0 = platZ, op = platOp;
      const plat = g.box(0, 0, z0 - 14, W, W, 14, { r: 6, tone: 'lo', op });
      plat.top.slits(14, W - 14, 12, 10, W - 10, true, { op: 0.3 * op });
      plat.front.slits(4, W - 4, 8, 3, 11, true, { op: 0.5 * op });
      plat.side.slits(4, W - 4, 8, 3, 11, true, { op: 0.5 * op });
      [[6, 6], [W - 6, 6], [6, W - 6], [W - 6, W - 6]].forEach(([x, y], j) => g.term([x, y, z0], (Math.floor(t / 400) + j) % 2 ? 0.9 : 0.2, 1.8));   // corner beacons
      const pad = g.cyl(PAD[0], PAD[1], z0, 30, PAD_Z, { tone: 'mid', op });
      pad.ring(20, { role: 'detail' });
      for (let j = 0; j < 8; j++) { const a = j / 8 * 2 * PI; g.term([PAD[0] + 25 * Math.cos(a), PAD[1] + 25 * Math.sin(a), z0 + PAD_Z], t > tLand && settle < 1 ? (Math.floor(t / 150) + j) % 2 : 0, 1.5); }
      // launch tower on the left with an umbilical arm that swings clear before ignition
      const tower = g.box(18, 66, z0, 14, 14, 128, { r: 2, tone: 'mid', op });
      tower.front.slits(3, 11, 4, 6, 122, true, { op: 0.6 * op }); tower.side.slits(3, 11, 4, 6, 122, true, { op: 0.6 * op });
      [44, 88, 124].forEach((z, j) => g.term([25, 80, z0 + z], 0.5 + 0.5 * Math.sin(t / 250 + j), 1.8));
      const swing = k.ramp(tLaunch + 100, tLaunch + 600) * (1 - k.ramp(tUn - 400, tUn));
      g.box(32, 70 - 22 * swing, z0 + 96, 33 - 18 * swing, 5, 5, { r: 1, tone: 'mid', op });
      // parts waiting in the row
      ROW.forEach(([x, y], i) => { if ((t < tLaunch && pickU(i) <= 0) || (t > tUn && dropU(i) >= 1)) part(i, x, y, z0, op); });
      // smoke rolling off the pad at ignition, carried down with the platform
      const smoke = k.env(tIgn, tIgn + 2000, 150, 900);
      if (smoke > 0.02) for (let s = 0; s < 12; s++) {
        const a = s / 12 * 2 * PI + 0.3, r = 24 + 34 * k.ramp(tIgn, tIgn + 2000) * (0.7 + 0.3 * hash(s)), sz = 7 + 7 * hash(s + 3);
        g.box(PAD[0] + r * Math.cos(a) - sz / 2, PAD[1] + r * Math.sin(a) - sz / 2, z0 + PAD_Z * 0.5, sz, sz, sz * 0.7, { r: sz / 2, material: 'silhouette', op: smoke * 0.8 * op });
      }
    }

    // ---- the rocket and its flame ----
    if (burn > 0) {
      const L = (t < tLand ? 28 + 10 * v : 18) * flick * burn, U = [0.707, -0.707, 0];
      const P = (u, d) => [base[0] + U[0] * u, base[1] + U[1] * u, base[2] - d];
      g.poly([[-6, 0], [6, 0], [4.5, L * 0.45], [0, L], [-4.5, L * 0.45]].map(([u, d]) => P(u, d)), { role: 'led', lit: Math.min(1, burn * flick) });
      g.bloom([base[0], base[1], base[2] - L * 0.4], 44, burn);
    }
    const onRocket = i => (t < tUn ? pickU(i) >= 1 : dropU(i) <= 0);
    [0, 1, 2, 3].forEach(i => { if (onRocket(i)) part(i, base[0], base[1], base[2] + stackZ(i)); });

    // ---- drones carrying stages ----
    const carry = (from, to, u) => {                                 // up, across, down
      const s = k.smooth, top = Math.max(from[2], to[2]) + 30;
      if (u < 0.3) return [from[0], from[1], from[2] + (top - from[2]) * s(u / 0.3)];
      if (u < 0.7) { const w = s((u - 0.3) / 0.4); return [from[0] + (to[0] - from[0]) * w, from[1] + (to[1] - from[1]) * w, top]; }
      return [to[0], to[1], top + (to[2] - top) * s((u - 0.7) / 0.3)];
    };
    const drone = p => {
      g.line([[p[0], p[1], p[2]], [p[0], p[1], p[2] + 14]], { role: 'detail' });
      g.box(p[0] - 6, p[1] - 6, p[2] + 14, 12, 12, 4, { r: 3, material: 'silhouette' });
      [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([dx, dy]) => g.cyl(p[0] + dx, p[1] + dy, p[2] + 18, 4.5, 1, { material: 'silhouette' }));
      g.term([p[0] + 6, p[1] + 6, p[2] + 16], 1, 1.4);
    };
    [0, 1, 2, 3].forEach(i => {
      const u = pickU(i), w = dropU(i);
      const p = u > 0 && u < 1 ? carry([...ROW[i], 0], [PAD[0], PAD[1], PAD_Z + stackZ(i)], u)
        : w > 0 && w < 1 ? carry([PAD[0], PAD[1], PAD_Z + stackZ(i)], [...ROW[i], 0], w) : null;
      if (p) { part(i, p[0], p[1], p[2]); drone([p[0], p[1], p[2] + H[i]]); }
    });

    // ---- readout from the model ----
    const stacked = [0, 1, 2, 3].filter(i => pickU(i) >= 1).length, off = [0, 1, 2, 3].filter(i => dropU(i) >= 1).length;
    g.readout(t < tLaunch ? 'stages · ' + stacked + ' / 4'
      : t < tIgn ? 'T-' + Math.max(1, 3 - Math.floor((t - tLaunch) / 267))
      : t < tCoast ? 'lift-off · ' + Math.round(scroll * 2) + ' km'
      : t < tLand ? 'cruising · ' + Math.round(v * 28) + ' km/s'
      : t < tUn ? (settle < 1 ? 'landing · ' + Math.round((rz - PAD_Z) * 3) + ' m' : 'touchdown')
      : 'unstacked · ' + off + ' / 4');
  },
});
