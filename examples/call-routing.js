/* Call routing: a call arrives from the carrier tower, the router checks three rules,
   rings the Sales desk, waits out the 20 s ring timeout, then falls back to voicemail. */
ISOGRAM.define({
  id: 'call-routing',
  title: 'Call routing',
  aria: 'Isometric diagram of call routing: a call comes in, routing rules are checked, the Sales desk rings, and an unanswered call falls back to voicemail.',
  duration: 11000,
  still: 5600,
  look: 'glow',
  beats: [
    { at: 0,    id: 'in',    caption: 'A call reaches your tracking number' },
    { at: 1800, id: 'rules', caption: 'Routing rules check hours, caller and agents' },
    { at: 4200, id: 'ring',  caption: 'It rings the Sales desk' },
    { at: 7200, id: 'vm',    caption: 'No answer in 20 s, so it falls to voicemail' },
    { at: 9400, id: 'saved', caption: 'The message is saved and logged' },
  ],
  draw(g, k) {
    const t = k.t, RING_S = 20;
    // ---- model: everything below reads from these numbers ----
    const tIn = k.at('in'), tRules = k.at('rules'), tRing = k.at('ring'), tVm = k.at('vm'), tSaved = k.at('saved');
    const inPkt = k.ramp(tIn + 200, tRules - 100, k.easeInOut);                // call travelling to the router
    const rule = [0, 1, 2].map(i => k.env(tRules + 250 + i * 600, tVm - 200, 200, 400)); // rules light one by one
    const ringPkt = k.ramp(tRing, tRing + 900, k.easeInOut);
    const ringing = k.env(tRing + 800, tVm, 200, 300);
    const ringSecs = Math.min(RING_S, Math.max(0, (t - (tRing + 800)) / (tVm - tRing - 800) * RING_S));
    const vmPkt = k.ramp(tVm + 100, tVm + 1100, k.easeInOut);
    const recording = k.env(tVm + 1000, k.duration - 150, 300, 500);
    const routeTo = t < tRules + 2000 ? -1 : t < tVm ? 0 : 2;               // 0 sales, 1 support, 2 voicemail
    // dial: sweeps while rules run, settles on the route with a spring
    const DIAL = [-50, 0, 50];
    const sweep = k.env(tRules + 200, tRules + 2100, 300, 300) * Math.sin((t - tRules) / 260) * 40;
    const toSales = k.spring(tRules + 2000), toVm = k.spring(tVm + 50);
    const dialA = (sweep + DIAL[0] * toSales + (DIAL[2] - DIAL[0]) * toVm) * Math.PI / 180;
    const callLit = t < tSaved ? k.env(tIn + 100, tSaved, 300, 400) : 0;

    // ---- ground plate ----
    g.plate(0, 0, 0, 440, 340, 8, { r: 16 });
    const Z = 8, F = Z + 1;   // floor height, wire height on the floor

    // ---- carrier tower (back) ----
    const tower = g.box(30, 40, Z, 44, 44, 112, { r: 4, tone: 'lo' });
    tower.front.slits(8, 36, 4, 14, 60).text(22, 84, 'PSTN', { size: 9, align: 'center' });
    tower.side.slits(8, 36, 4, 14, 60);
    tower.front.led(22, 70, 1.6, k.env(tIn, tRules, 100, 300) * (0.6 + 0.4 * Math.sin(t / 90)));
    g.cyl(52, 62, Z + 112, 3, 34, { tone: 'lo' });
    g.cyl(52, 62, Z + 146, 5, 4, { tone: 'mid', lit: k.env(tIn, tIn + 1200, 100, 500) });
    g.bloom([52, 62, Z + 150], 26, k.env(tIn, tIn + 1200, 100, 500));
    const wIn = g.wire([[52, 84, 22], [52, 104, 22], [52, 104, F], [52, 168, F], [176, 168, F]], { lit: callLit * 0.9 });
    g.packet(wIn, inPkt, { lit: k.env(tIn + 200, tRules + 100, 150, 300) });

    // ---- router (the subject) ----
    const R = g.box(170, 120, Z, 130, 96, 54, { r: 8, tone: 'hi', shadow: true });
    const top = R.top, rz = Z + 54;
    top.rect(8, 8, 114, 80, { r: 6, role: 'detail-rect' });
    // rotary selector
    const dial = g.cyl(205, 168, rz, 24, 4, { tone: 'mid' });
    for (let a = -70; a <= 70; a += 10) {
      const r0 = a % 50 === 0 ? 17 : 20, rad = (a - 90 + 45) * Math.PI / 180;
      g.line([[205 + Math.cos(rad) * r0, 168 + Math.sin(rad) * r0, rz + 4], [205 + Math.cos(rad) * 22, 168 + Math.sin(rad) * 22, rz + 4]], { role: 'detail' });
    }
    const pa = dialA - Math.PI / 4;
    g.line([[205, 168, rz + 4], [205 + Math.cos(pa) * 18, 168 + Math.sin(pa) * 18, rz + 4]], { role: 'wire', lit: 1, w: 2 });
    g.cyl(205, 168, rz + 4, 4, 3, { tone: 'hi' });
    // three rule keys, each with an engraved label
    ['HOURS', 'CALLER', 'AGENTS'].forEach((name, i) => {
      const key = g.box(240, 134 + i * 22, rz, 48, 16, 4, { r: 3, tone: 'mid', lit: rule[i] });
      key.top.text(5, 11, name, { size: 6.5, role: 'engrave', lit: rule[i] });
    });
    // front: rule screen + route LEDs + engraved name
    const scrTxt = t < tRules ? (inPkt > 0.9 ? 'INCOMING' : '') : t < tRules + 2000 ? 'RULE ' + Math.min(3, 1 + Math.floor((t - tRules - 250) / 600)) + '/3'
      : t < tVm ? '> SALES' : t < tSaved ? '> VOICEMAIL' : 'SAVED';
    const scrOn = k.env(tIn + 1300, k.duration - 100, 200, 400);
    R.front.recess(10, 9, 76, 26, { r: 4 }).glass(13, 12, 70, 20, { r: 3, lit: scrOn });
    R.front.clip(13, 12, 70, 20, 3, p => p.text(18, 26, scrTxt, { size: 9, lit: scrOn }));
    ['S', 'T', 'V'].forEach((c, i) => { R.front.led(98 + i * 11, 16, 1.7, routeTo === i ? 1 : 0).text(98 + i * 11, 31, c, { size: 6.5, align: 'center' }); });
    R.front.text(10, 48, 'ROUTER', { size: 7.5 });
    R.front.slits(70, 120, 3.5, 40, 49);
    R.side.slits(10, 40, 3.5, 12, 40).recess(56, 18, 30, 10, { r: 3 });

    // ---- desk phones ----
    function phone(x, y, label, lit, ring, wireRoute) {
      const w = g.wire(wireRoute, { lit: lit * 0.9 });
      const b = g.box(x, y, Z, 70, 56, 18, { r: 6, tone: 'mid', shadow: true });
      b.top.rect(30, 8, 34, 40, { r: 3, role: 'recess' });
      const bounce = ring * Math.abs(Math.sin(k.t / 70)) * 3;   // handset jiggles while it rings
      g.box(x + 6, y + 6, Z + 18 + bounce, 18, 44, 7, { r: 6, tone: 'hi', lit: ring });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.box(x + 33 + c * 10.5, y + 11 + r * 9.4, Z + 18, 7.5, 6.4, 2, { r: 1.2, tone: 'hi' });
      b.front.text(7, 13, label, { size: 8 }).led(62, 9, 1.6, lit);
      g.bloom([x + 15, y + 28, Z + 26], 34, ring);
      return w;
    }
    const salesLit = k.env(tRing + 600, tVm + 300, 200, 400);
    const wSales = phone(340, 40, 'SALES', salesLit, ringing, [[300, 140, 34], [318, 140, 34], [318, 140, F], [318, 66, F], [346, 66, F]]);
    g.packet(wSales, ringPkt, { lit: k.env(tRing, tRing + 1000, 100, 200) });
    phone(340, 150, 'SUPPORT', 0, 0, [[300, 190, 34], [324, 190, 34], [324, 190, F], [324, 178, F], [346, 178, F]]);

    // ---- voicemail recorder (front) ----
    const wVm = g.wire([[252, 216, 24], [252, 238, 24], [252, 238, F], [214, 238, F], [214, 266, F]], { lit: k.env(tVm + 100, k.duration - 100, 200, 500) * 0.9 });
    g.packet(wVm, vmPkt, { lit: k.env(tVm, tVm + 1200, 100, 200) });
    const vm = g.box(150, 262, Z, 110, 58, 30, { r: 7, tone: 'mid', shadow: true });
    const vz = Z + 30, spin = (k.t / 1000) * 4 * recording;
    [[178, 288], [228, 288]].forEach(([cx, cy], i) => {
      const reel = g.cyl(cx, cy, vz, 15, 3, { tone: 'hi' });
      reel.ring(5);
      for (let s = 0; s < 3; s++) { const a = spin + s * 2.094 + i;
        g.line([[cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, vz + 3], [cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, vz + 3]], { role: 'detail', lit: recording }); }
    });
    g.line([[178, 303, vz + 1.5], [228, 303, vz + 1.5]], { role: 'wire', lit: recording, w: 1.4 });
    const msgs = t >= tSaved ? 4 : 3;
    vm.front.recess(8, 7, 40, 15, { r: 3 }).glass(10, 9, 36, 11, { r: 2, lit: recording });
    vm.front.text(28, 18, recording > 0.05 ? 'MSG ' + msgs : 'MSG', { size: 7, align: 'center', lit: recording });   // count shows only while lit, so the loop seam is clean
    vm.front.text(56, 13, 'VMAIL', { size: 7.5 }).led(100, 9, 1.6, recording);
    vm.front.slits(56, 104, 3.5, 18, 25);

    // ---- readout (from the model) ----
    g.readout(t < tRules ? 'incoming · +1 404 ··· 0142'
      : t < tRing ? 'rules ' + rule.filter(v => v > 0.5).length + '/3 passed'
      : t < tVm ? 'ringing sales · ' + ringSecs.toFixed(0) + ' s / ' + RING_S + ' s'
      : t < tSaved ? 'no answer · to voicemail'
      : 'saved · 4 messages');
  },
});
