/* Starter: a client sends a request, the server lights up and answers. Copy this and grow it. */
ISOGRAM.define({
  id: 'starter',
  title: 'Request and response',
  duration: 5000,
  still: 2200,
  beats: [
    { at: 0,    caption: 'The app sends a request' },
    { at: 1600, caption: 'The server handles it' },
    { at: 3000, caption: 'The answer comes back' },
  ],
  draw(g, k) {
    const send = k.ramp(200, 1500, k.easeInOut), back = k.ramp(3000, 4300, k.easeInOut);
    const busy = k.env(1500, 3200, 200, 400);                     // envelopes: nothing pops on or off
    g.plate(0, 0, 0, 300, 220, 8);
    // server at the back, wire runs forward to the app
    const srv = g.box(40, 30, 8, 80, 70, 90, { r: 6, tone: 'mid', shadow: true });
    srv.front.slits(8, 72, 4, 10, 40).led(70, 52, 1.8, busy).text(8, 56, 'API', { size: 8 });
    srv.side.slits(8, 62, 4, 10, 50);
    const w = g.wire([[100, 100, 24], [100, 150, 24], [100, 150, 9], [170, 150, 9]], { lit: Math.max(send > 0 && send < 1 ? 1 : 0, busy, back > 0 && back < 1 ? 1 : 0) * 0.9 });
    g.packet(w, 1 - send, { lit: k.env(200, 1600, 100, 200) });   // request travels toward the server
    g.packet(w, back, { lit: k.env(3000, 4400, 100, 200) });      // response travels back
    const app = g.box(170, 120, 8, 90, 60, 40, { r: 6, tone: 'hi', shadow: true });
    app.front.recess(8, 7, 74, 22, { r: 3 }).glass(10, 9, 70, 18, { r: 2, lit: k.env(4200, 5000, 150, 300) });
    app.front.text(45, 22, back >= 1 ? '200 OK' : '...', { size: 8, align: 'center', lit: k.env(4200, 5000, 150, 300) });
    g.readout(k.t < 1600 ? 'POST /orders' : k.t < 3000 ? 'handling · ' + Math.round(k.ramp(1600, 3000) * 42) + ' ms' : 'response · 42 ms');
  },
});
