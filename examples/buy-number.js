/* Buying a local number: search by area code at a console, a vending-style carrier
   inventory scans its stock and dispenses one numbered tile, a press provisions it,
   the tile slides into the call-flow box, and a test call rings the desk phone. */
ISOGRAM.define({
  id: 'buy-number',
  title: 'Buying a local number',
  aria: 'Isometric diagram of buying a local phone number: search by area code, pick a number from the carrier inventory, purchase and provision it, attach it to a call flow, and place a test call that rings a desk phone.',
  duration: 11000,
  still: 6200,
  look: 'vector',
  beats: [
    { at: 0,    id: 'search', caption: 'Search numbers by area code', show: 1400 },
    { at: 2400, id: 'pick',   caption: 'Pick one from carrier stock', show: 3800 },
    { at: 4400, id: 'buy',    caption: 'It is bought and provisioned', show: 6250 },
    { at: 6800, id: 'attach', caption: 'Attach it to a call flow', show: 8400 },
    { at: 8800, id: 'test',   caption: 'A test call rings through', show: 10000 },
  ],
  draw(g, k) {
    const t = k.t;
    // ---- model ----
    const AREA = '404', NUMS = ['0107', '0119', '0128', '0135', '0142', '0156', '0163', '0171', '0190'];
    const PICK = 4, PICKED = '404 555 ' + NUMS[PICK], RING_S = 2;
    const tS = k.at('search'), tP = k.at('pick'), tB = k.at('buy'), tA = k.at('attach'), tT = k.at('test');
    const END = k.duration - 200;
    // search: three key presses, then the query travels to the inventory
    const keyAt = [300, 700, 1100].map(v => tS + v);
    const typed = keyAt.filter(v => t >= v).length;
    const keyLit = keyAt.map(v => k.env(v, v + 260, 60, 200));
    const qPkt = k.ramp(tS + 1400, tP - 100, k.easeInOut);
    const qLit = k.env(tS + 1400, tP, 120, 250);
    const scrOn = k.env(tS + 200, tP + 300, 150, 300);
    // pick: a highlight scans the stock, then settles on one tile
    const SCAN = 220, scanT0 = tP + 150;
    const scanIdx = t < scanT0 ? -1 : Math.min(PICK, Math.floor((t - scanT0) / SCAN));
    const scanLit = NUMS.map((_, i) => i === PICK ? 0 : k.env(scanT0 + i * SCAN, scanT0 + (i + 1) * SCAN, 60, 140) * (i < PICK ? 1 : 0));
    const chosen = k.env(scanT0 + PICK * SCAN, tB + 300, 80, 300);
    // buy: the tile extrudes from the slot, rides to the press, gets stamped
    const out = k.ramp(tB + 100, tB + 600, k.easeInOut);
    const toPress = k.ramp(tB + 650, tB + 1400, k.easeInOut);
    const stamp = k.env(tB + 1450, tB + 2050, 220, 260);           // head travel 0..1..0
    const stamped = t >= tB + 1700;
    const toFlow = k.ramp(tA, tA + 900, k.easeInOut);
    const tileLit = k.env(tB + 100, tA + 900, 200, 250);
    const pressLit = k.env(tB + 1450, tB + 2200, 150, 300);
    // attach: socket shows the number, flow steps light in turn
    const socket = k.env(tA + 800, END, 200, 400);
    const step = [0, 1, 2].map(i => k.env(tA + 1100 + i * 300, tT + 200, 150, 300));
    // test: call travels to the phone and rings
    const callPkt = k.ramp(tT + 100, tT + 900, k.easeInOut);
    const callLit = k.env(tT + 100, tT + 1000, 120, 250);
    const ring = k.env(tT + 900, END, 200, 350);
    const ringSecs = Math.max(0, Math.min(RING_S, (t - tT - 900) / 500));

    const Z = 8, F = Z + 1;
    g.plate(0, 0, 0, 470, 296, 8, { r: 16 });

    // ---- console wire to the inventory (behind everything at the front) ----
    const wQ = g.wire([[80, 190, F], [80, 100, F]], { lit: qLit * 0.9 });
    g.packet(wQ, qPkt, { lit: qLit });

    // ---- carrier inventory: a vending machine of numbers ----
    const V = g.box(30, 30, Z, 150, 70, 118, { r: 6, tone: 'mid', shadow: true });
    V.top.rect(8, 8, 134, 54, { r: 4, role: 'detail-rect' });
    V.top.slits(20, 130, 6, 18, 52);
    V.front.recess(8, 6, 134, 82, { r: 4 });
    NUMS.forEach((n, i) => {
      const c = i % 3, r = Math.floor(i / 3), u = 12 + c * 44, v = 10 + r * 26;
      const lit = i === PICK ? chosen : scanLit[i];
      V.front.glass(u, v, 38, 20, { r: 2, lit });
      V.front.text(u + 19, v + 14, n, { size: 7, align: 'center', role: 'engrave', lit });
    });
    V.front.text(10, 104, 'STOCK', { size: 8 });
    V.front.led(52, 100, 1.8, Math.max(scanIdx >= 0 ? k.env(scanT0, tB, 80, 200) : 0, 0));
    V.front.recess(93, 96, 20, 20, { r: 2 });                       // dispenser slot
    V.front.slits(122, 142, 4, 98, 112);
    V.front.screws(5, 1.4);
    V.side.slits(10, 60, 4, 14, 70).recess(22, 84, 26, 8, { r: 2 }).text(14, 108, 'CARRIER', { size: 7 });

    // ---- conveyor ----
    const belt = g.box(110, 100, Z, 230, 22, 4, { r: 2, tone: 'lo' });
    for (let x = 6; x < 230; x += 12) belt.top.line(x, 2, x, 20, { role: 'detail' });
    belt.front.slits(4, 226, 10, 1, 3);

    // ---- the press (provisioning) ----
    const PX = 236;
    g.box(PX - 1, 90, Z, 10, 8, 54, { r: 1.5, tone: 'mid' });          // back post
    // tile on the belt
    const tileX = 124 + toPress * (PX - 124 - 3) + toFlow * (348 - PX + 3);
    const tileY = 100 + out * 3;
    if (out > 0 && toFlow < 1) {
      const d = Math.max(0.5, Math.min(14, out * 17));
      const tile = g.box(tileX, tileY, Z + 4, 14, d, 13, { r: 2, tone: 'hi', lit: Math.min(1, tileLit * (stamped ? 1 : 0.75) + pressLit * 0.25) });
      if (d > 10) tile.front.line(3, 4, 11, 4, { role: 'engrave' }).line(3, 7, 9, 7, { role: 'engrave' });
    }
    // press head comes down on the tile
    const headZ = Z + 40 - stamp * 19;
    g.cyl(PX + 4, 109, headZ + 9, 2.5, Z + 54 - headZ - 9, { tone: 'lo' });
    const head = g.box(PX - 8, 99, headZ, 24, 20, 9, { r: 2, tone: 'mid' });
    head.front.slits(4, 20, 4, 2, 7);
    const beam = g.box(PX - 1, 90, Z + 54, 10, 42, 8, { r: 1.5, tone: 'mid' });         // beam
    beam.side.led(8, 4, 1.6, pressLit);
    g.box(PX - 1, 124, Z, 10, 8, 54, { r: 1.5, tone: 'mid', shadow: true }); // front post
    g.bloom([PX + 4, 110, Z + 20], 30, pressLit);

    // ---- call flow box (where the number is attached) ----
    const R = g.box(340, 80, Z, 110, 100, 46, { r: 7, tone: 'hi', shadow: true });
    R.top.rect(8, 8, 94, 84, { r: 5, role: 'detail-rect' });
    R.top.recess(14, 14, 46, 16, { r: 3 }).glass(16, 16, 42, 12, { r: 2, lit: socket });
    R.top.clip(16, 16, 42, 12, 2, p => p.text(21, 25, socket > 0.05 ? NUMS[PICK] : '', { size: 7, align: 'center', lit: socket }));
    ['GREET', 'ROUTE', 'RING'].forEach((name, i) => {
      const key = g.box(356 + i * 2, 120 + i * 18, Z + 46, 44, 13, 4, { r: 2.5, tone: 'mid', lit: step[i] });
      key.top.text(4, 9.5, name, { size: 6, role: 'engrave', lit: step[i] });
    });
    g.line([[420, 124, Z + 46.5], [420, 166, Z + 46.5]], { role: 'detail' });
    const flowName = step[2] > 0.5 ? 'MAIN' : '';
    R.front.recess(9, 8, 56, 20, { r: 3 }).glass(11, 10, 52, 16, { r: 2, lit: step[2] });
    R.front.clip(11, 10, 52, 16, 2, p => p.text(26, 22, flowName, { size: 8, align: 'center', lit: step[2] }));
    R.front.text(9, 40, 'FLOW', { size: 7.5 });
    R.front.led(80, 14, 1.7, socket).led(92, 14, 1.7, callLit + ring * 0.8);
    R.front.slits(70, 102, 4, 26, 38);
    R.side.slits(10, 50, 4, 10, 38).circle(78, 16, 3);

    // ---- desk phone (the test call) ----
    const wC = g.wire([[388, 180, Z + 7], [388, 196, Z + 7], [388, 196, F], [388, 243, F], [298, 243, F]], { lit: Math.max(callLit, ring * 0.6) });
    g.packet(wC, callPkt, { lit: callLit });
    const P = g.box(220, 214, Z, 78, 58, 18, { r: 6, tone: 'mid', shadow: true });
    P.top.rect(32, 8, 38, 42, { r: 3, role: 'recess' });
    const bounce = ring * Math.abs(Math.sin(t / 70)) * 3;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.box(220 + 35 + c * 11, 214 + 11 + r * 9.6, Z + 18, 8, 6.6, 2, { r: 1.2, tone: 'hi' });
    g.box(226, 220, Z + 18 + bounce, 20, 46, 7, { r: 6, tone: 'hi', lit: ring });
    P.front.text(7, 13, 'DESK', { size: 8 }).led(70, 9, 1.6, ring);
    g.bloom([236, 243, Z + 28], 34, ring);
    P.side.slits(8, 50, 4, 5, 13);

    // ---- search console ----
    const C = g.box(40, 190, Z, 120, 76, 30, { r: 6, tone: 'mid', shadow: true });
    C.top.rect(6, 6, 46, 64, { r: 4, role: 'recess' });
    C.top.slits(12, 46, 6, 12, 64);
    const KEYS = '123456789*0#';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const ch = KEYS[r * 3 + c];
      const lit = ch === '4' ? Math.max(keyLit[0], keyLit[2]) : ch === '0' ? keyLit[1] : 0;
      const kb = g.box(40 + 62 + c * 17, 190 + 8 + r * 16, Z + 30 - lit * 1.2, 13, 12, 3, { r: 2, tone: 'hi', lit });
      kb.top.text(6.5, 9, ch, { size: 7, align: 'center', role: 'engrave', lit });
    }
    C.front.recess(8, 6, 64, 18, { r: 3 }).glass(10, 8, 60, 14, { r: 2, lit: scrOn });
    C.front.clip(10, 8, 60, 14, 2, p => p.text(30, 18, scrOn > 0.05 ? AREA.slice(0, typed) : '', { size: 8, align: 'center', lit: scrOn }));
    C.front.text(80, 18, 'SEARCH', { size: 7 });

    // ---- readout ----
    g.readout(t < tS + 1400 ? 'area code · ' + (AREA.slice(0, typed) || '–')
      : t < tP ? 'searching · area ' + AREA
      : t < scanT0 + PICK * SCAN ? 'area ' + AREA + ' · ' + NUMS.length + ' available'
      : t < tB ? 'picked · ' + PICKED
      : t < tB + 1700 ? 'purchasing · ' + PICKED
      : t < tA ? 'provisioned · voice on'
      : t < tT ? 'attached · ' + step.filter(v => v > 0.5).length + '/3 steps'
      : t < tT + 900 ? 'test call · dialing'
      : 'test call · ringing ' + ringSecs.toFixed(0) + ' s');
  },
});
