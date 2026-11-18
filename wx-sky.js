/* iTechie.eu /weather/ — living background drawn from the real Zadar weather (data-* on #wx-sky).
   Sky colour by sun position, stars at night, clouds by cover, rain/snow by precipitation, everything
   drifting with the real wind (bura gets gusty streaks), sea waves by wave height, lightning in storms.
   One canvas, pauses when the tab is hidden, still picture for "reduce motion".
   Preview other weather: /weather/?wind=70&dir=45&rain=4&cloud=80&code=95&wave=2&night=1 */
(function () {
  var cv = document.getElementById("wx-sky"); if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d"), ds = cv.dataset, q = new URLSearchParams(location.search);
  function num(k, d) { var v = q.has(k) ? q.get(k) : ds[k]; v = parseFloat(v); return isFinite(v) ? v : d; }
  var W = {
    wind: num("wind", 0), dir: num("dir", 0), gust: num("gust", 0), cloud: num("cloud", 0),
    rain: num("rain", 0), code: num("code", 0), wave: num("wave", -1), rise: num("rise", 0), set: num("set", 0)
  };
  if (W.gust < W.wind) W.gust = W.wind;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var c = W.code;
  var snow = (c >= 71 && c <= 77) || c === 85 || c === 86;
  var storm = c >= 95;
  var wetCode = (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || storm;
  var rainAmt = W.rain > 0 ? W.rain : (wetCode || snow ? 0.4 : 0);
  // wind blows FROM dir; we draw where it goes: east = right. Horizontal part only (side view)
  var to = (W.dir + 180) * Math.PI / 180, hx = Math.sin(to);
  var bura = W.dir >= 15 && W.dir <= 75 && (W.wind >= 20 || W.gust >= 40);
  var windPx = Math.max(6, W.wind * 2.2);                       // px per second for drifting things

  var w, h, dpr, stars = [], drops = [], clouds = [], streaks = [], t0 = performance.now(), flash = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function night() {
    if (q.has("night")) return q.get("night") === "1";
    var now = Date.now() / 1000;
    return W.rise && W.set ? (now < W.rise || now > W.set) : false;
  }
  function skyColors() {                                         // dark, low-contrast: this is a background
    var now = Date.now() / 1000, cl = W.cloud / 100;
    var dusk = W.rise && W.set ? Math.min(Math.abs(now - W.rise), Math.abs(now - W.set)) < 2700 : false;
    var top, bot;
    if (night()) { top = "#04060d"; bot = "#0a1222"; }
    else if (dusk) { top = "#0b0f22"; bot = "#3a1a2a"; }
    else { top = "#071420"; bot = "#0f2a3a"; }
    if (cl > 0.6 && !night()) { top = "#0b1015"; bot = "#1a2229"; }   // overcast: grey
    return [top, bot];
  }
  function paintSky() {
    var s = skyColors();
    cv.style.background = "linear-gradient(to bottom," + s[0] + "," + s[1] + ")";
  }

  function cloudSprite() {                                       // one soft blob, re-used for every cloud
    var s = document.createElement("canvas"); s.width = 256; s.height = 128;
    var g = s.getContext("2d");
    for (var i = 0; i < 7; i++) {
      var x = rnd(60, 196), y = rnd(50, 80), r = rnd(30, 55);
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(200,215,230,0.55)"); gr.addColorStop(1, "rgba(200,215,230,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    return s;
  }
  var sprite = cloudSprite();

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var area = w * h / (1440 * 900);                               // fewer particles on small screens
    stars = []; drops = []; clouds = []; streaks = [];
    var ns = Math.round(140 * area * (1 - W.cloud / 100 * 0.9));
    for (var i = 0; i < ns; i++) stars.push({ x: rnd(0, w), y: rnd(0, h * 0.7), r: rnd(0.4, 1.3), p: rnd(0, 6.3), s: rnd(0.5, 1.6) });
    var nc = Math.round(W.cloud / 100 * 8);
    for (i = 0; i < nc; i++) clouds.push({ x: rnd(-300, w), y: rnd(10, h * 0.45), k: rnd(1.2, 2.6), a: rnd(0.10, 0.22), v: rnd(0.6, 1.2) });
    var nd = rainAmt ? Math.round(Math.min(380, 50 + rainAmt * 70) * area) : 0;
    for (i = 0; i < nd; i++) drops.push(newDrop(true));
    var nw = bura ? Math.round(40 * area) : (W.wind >= 20 ? Math.round(14 * area) : 0);
    for (i = 0; i < nw; i++) streaks.push(newStreak(true));
    paintSky();
  }
  function newDrop(any) {
    return { x: rnd(-100, w + 100), y: any ? rnd(-h, h) : rnd(-60, -10), l: snow ? rnd(1.2, 2.6) : rnd(10, 22),
             v: snow ? rnd(30, 60) : rnd(500, 800), o: rnd(0.15, 0.35), p: rnd(0, 6.3) };
  }
  function newStreak(any) {
    var fromRight = hx < 0;
    return { x: any ? rnd(0, w) : (fromRight ? w + rnd(0, 200) : -rnd(0, 200)), y: rnd(0, h * 0.85),
             l: rnd(60, bura ? 220 : 120), v: rnd(0.8, 1.4), o: rnd(0.07, bura ? 0.26 : 0.10) };
  }

  function frame(now) {
    var t = (now - t0) / 1000, dt = Math.min(0.05, frame.last ? (now - frame.last) / 1000 : 0.016); frame.last = now;
    var gustK = 1 + (W.gust / Math.max(W.wind, 1) - 1) * Math.max(0, Math.sin(t * 0.7) * Math.sin(t * 1.9));   // breathing gusts
    var vx = hx * windPx * gustK;
    ctx.clearRect(0, 0, w, h);

    if (night()) {                                               // stars
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        ctx.fillStyle = "rgba(220,235,255," + a.toFixed(3) + ")"; ctx.fillRect(s.x, s.y, s.r, s.r);
      }
    }
    for (i = 0; i < clouds.length; i++) {                        // clouds drift with the wind
      var c = clouds[i];
      c.x += (vx === 0 ? 4 : vx) * 0.25 * c.v * dt;
      var cw = 256 * c.k, ch = 128 * c.k;
      if (c.x > w + 50) c.x = -cw; if (c.x < -cw - 50) c.x = w;
      ctx.globalAlpha = c.a * (night() ? 0.5 : 1); ctx.drawImage(sprite, c.x, c.y, cw, ch);
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < streaks.length; i++) {                       // wind streaks (bura: many, fast, gusty)
      var k = streaks[i];
      k.x += (hx < 0 ? -1 : 1) * (windPx * 6 * k.v * gustK) * dt;
      if (k.x < -k.l - 250 || k.x > w + 250) { streaks[i] = newStreak(false); continue; }
      var gr = ctx.createLinearGradient(k.x, 0, k.x + k.l, 0);
      gr.addColorStop(0, "rgba(160,230,255,0)"); gr.addColorStop(0.5, "rgba(160,230,255," + k.o + ")"); gr.addColorStop(1, "rgba(160,230,255,0)");
      ctx.strokeStyle = gr; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x + k.l, k.y + k.l * 0.06); ctx.stroke();
    }

    var slant = vx / (snow ? 60 : 650);                          // rain leans with the wind
    ctx.lineWidth = 1;
    for (i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt; d.x += vx * (snow ? 0.6 : 0.9) * dt + (snow ? Math.sin(t + d.p) * 12 * dt : 0);
      if (d.y > h + 20 || d.x < -150 || d.x > w + 150) { drops[i] = newDrop(false); continue; }
      if (snow) { ctx.fillStyle = "rgba(235,245,255," + (d.o + 0.2) + ")"; ctx.beginPath(); ctx.arc(d.x, d.y, d.l, 0, 7); ctx.fill(); }
      else { ctx.strokeStyle = "rgba(170,210,240," + d.o + ")"; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - slant * d.l, d.y - d.l); ctx.stroke(); }
    }

    var wave = W.wave >= 0 ? W.wave : W.wind / 40;              // sea at the bottom
    var amp = 2 + Math.min(wave, 3) * 7, base = h - 18;
    for (var L = 0; L < 3; L++) {
      ctx.strokeStyle = "rgba(0,240,255," + (0.10 - L * 0.025) + ")"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var x = 0; x <= w; x += 8) {
        var y = base - L * 9 + Math.sin(x / (90 - L * 15) + t * (0.8 + wave * 0.5) * (L % 2 ? -1 : 1) + L) * amp * (1 - L * 0.25)
              + Math.sin(x / 33 + t * 1.7) * amp * 0.25;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    if (storm) {                                                 // lightning: rare dim flash of the whole sky
      if (flash <= 0 && Math.random() < dt / 9) flash = 0.35;
      if (flash > 0) { ctx.fillStyle = "rgba(200,220,255," + (flash * 0.35).toFixed(3) + ")"; ctx.fillRect(0, 0, w, h); flash -= dt * 2.5; }
    }
    if (!still) requestAnimationFrame(frame);
  }

  setup();
  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(setup, 200); });
  setInterval(paintSky, 60000);
  requestAnimationFrame(frame);                                  // rAF stops by itself while the tab is hidden
})();
