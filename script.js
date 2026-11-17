/* iTechie.eu homepage — progressive extras. The page works fully without JS. */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // Hamburger menu (phones)
  var mb = document.getElementById("menu-btn"), nav = document.getElementById("nav");
  if (mb && nav) {
    var setMenu = function (open) { nav.classList.toggle("open", open); mb.setAttribute("aria-expanded", open ? "true" : "false"); };
    mb.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (ev) { if (ev.target.tagName === "A") setMenu(false); });
  }


  // Zadar clock
  var clock = document.getElementById("clock");
  function tick() {
    clock.textContent = "ZADAR " + new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Zagreb" });
  }
  tick(); clock.hidden = false; setInterval(tick, 1000);

  // "Last sync: 12 min ago" from the build timestamp
  var sync = document.getElementById("sync");
  var epoch = parseInt(sync && sync.getAttribute("data-epoch"), 10);
  if (epoch) {
    var stamp = sync.textContent;
    function ago() {
      var m = Math.max(0, Math.round((Date.now() / 1000 - epoch) / 60));
      var txt = m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.floor(m / 60) + " h " + (m % 60) + " min ago";
      sync.textContent = txt;
      sync.title = stamp;
    }
    ago(); setInterval(ago, 30000);
  }

  // Launch countdown: T-hh:mm:ss until T-0, then T+ for 3 hours
  var cd = document.querySelector(".countdown[data-t0]");
  if (cd) {
    var t0 = parseInt(cd.getAttribute("data-t0"), 10);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var fmt = function (s) {
      var d = Math.floor(s / 86400); s %= 86400;
      return (d ? d + "d " : "") + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60);
    };
    var tickCd = function () {
      var diff = Math.round(t0 - Date.now() / 1000);
      if (diff >= 0) cd.textContent = "T-" + fmt(diff);
      else if (diff > -10800) cd.textContent = "T+" + fmt(-diff);
      else cd.textContent = "";
    };
    tickCd(); setInterval(tickCd, 1000);
  }

  // Daylight countdown (Daylight & Sea block)
  var sky = document.querySelector(".sky[data-set]");
  if (sky) {
    var rise = +sky.getAttribute("data-rise"), set = +sky.getAttribute("data-set"), rise2 = +sky.getAttribute("data-rise2");
    var st = sky.querySelector(".sky-state"), bar = sky.querySelector(".sky-bar i");
    var hm = function (s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
      return h ? h + "h " + (m < 10 ? "0" : "") + m + "m" : m + "m"; };
    var tickSky = function () {
      var t = Date.now() / 1000;
      if (t >= rise && t < set) { st.textContent = "Daylight left " + hm(set - t); bar.style.width = ((t - rise) / (set - rise) * 100).toFixed(1) + "%"; }
      else if (t < rise) { st.textContent = "Dark · sunrise in " + hm(rise - t); bar.style.width = "0%"; }
      else if (t < rise2) { st.textContent = "Dark · sunrise in " + hm(rise2 - t); bar.style.width = "100%"; }
    };
    tickSky(); setInterval(tickSky, 30000);
  }

  // Quizzes: a fresh random 4 on every page load (daily picks stay without JS)
  var qg = document.getElementById("quiz-grid"), qall = document.getElementById("quiz-all");
  if (qg && qall && qall.content) {
    var cards = Array.prototype.slice.call(qall.content.querySelectorAll(".quiz-card"));
    var show = parseInt(qg.getAttribute("data-show"), 10) || 4;
    for (var i = cards.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = cards[i]; cards[i] = cards[j]; cards[j] = t; }
    if (cards.length >= show) {
      qg.innerHTML = "";
      cards.slice(0, show).forEach(function (c) { qg.appendChild(c.cloneNode(true)); });
    }
  }

  // Make the flat ☺ / ☹ mood glyphs in panel headers bigger (wrap them in a span)
  Array.prototype.forEach.call(document.querySelectorAll(".panel-head small"), function (sm) {
    Array.prototype.slice.call(sm.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var m = node.nodeValue.match(/[\u263a\u2639]\ufe0e?/);
      if (!m) return;
      var after = node.splitText(m.index); after.splitText(m[0].length);
      var span = document.createElement("span"); span.className = "mood"; span.textContent = after.nodeValue;
      sm.replaceChild(span, after);
    });
  });

  // click-to-zoom lightbox: NASA image + recommendation poster (without JS the link opens the image itself)
  var zooms = document.querySelectorAll("a.iotd[data-big], a.zoom[data-big], a.sn-open[data-big]"), iotd = zooms[0];
  if (zooms.length) {
    var lb = document.createElement("div"); lb.className = "lb"; lb.hidden = true;
    lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    var box = document.createElement("div"); box.className = "lb-box";
    var x = document.createElement("button"); x.type = "button"; x.className = "lb-close"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    var im = document.createElement("img"); im.alt = "";
    var ti = document.createElement("p"); ti.className = "lb-title";
    var de = document.createElement("p"); de.className = "lb-desc";
    var ln = document.createElement("a"); ln.className = "lb-link"; ln.target = "_blank"; ln.rel = "noopener noreferrer"; ln.textContent = "Full story on NASA.gov ↗";
    x.hidden = true; document.body.appendChild(x); box.appendChild(im); box.appendChild(ti); box.appendChild(de); box.appendChild(ln); lb.appendChild(box);
    document.body.appendChild(lb);
    var closeLb = function () { lb.hidden = true; x.hidden = true; document.body.classList.remove("lb-open"); if (iotd) iotd.focus(); };
    zooms.forEach(function (z) { z.addEventListener("click", function (ev) { iotd = z; open(ev); }); });
    function open(ev) {
      var big = iotd.getAttribute("data-big") || "";
      if (big.indexOf("https://") !== 0) return;            // fall back to normal link
      ev.preventDefault();
      box.classList.remove("tall");
      im.onload = function () { box.classList.toggle("tall", im.naturalHeight > im.naturalWidth * 1.1); };   /* posters: image left, text right */
      im.src = big; im.alt = iotd.getAttribute("data-title") || "";
      ti.textContent = iotd.getAttribute("data-title") || "";
      de.textContent = iotd.getAttribute("data-desc") || "";
      var l = iotd.getAttribute("data-link") || ""; if (l.indexOf("https://") === 0) { ln.href = l; ln.hidden = false; } else ln.hidden = true;
      ln.textContent = iotd.getAttribute("data-linktext") || "Full story on NASA.gov ↗";
      lb.hidden = false; x.hidden = false; lb.scrollTop = 0; document.body.classList.add("lb-open"); x.focus();
    }
    x.addEventListener("click", closeLb);
    lb.addEventListener("click", function (ev) { if (ev.target === lb) closeLb(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !lb.hidden) closeLb(); });
  }

  // Operator available / busy: busy for data-window seconds after data-since
  var av = document.getElementById("op-av");
  if (av) {
    var dnd = parseInt(av.getAttribute("data-since"), 10) || 0, win = parseInt(av.getAttribute("data-window"), 10) || 3600;
    var tickAv = function () {
      var busy = dnd > 0 && Date.now() / 1000 - dnd < win;
      av.className = "op-av " + (busy ? "busy" : "free");
      av.textContent = busy ? "busy" : "available";
      if (busy) { var d = new Date(dnd * 1000); av.title = "Busy since " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
      else av.title = "Available";
    };
    tickAv(); setInterval(tickAv, 60000);
  }

  // Ticker: constant reading speed, however long the text gets (px per second)
  var tk = document.querySelector(".ticker .track span");
  if (tk) {
    var setSpeed = function () { tk.style.animationDuration = Math.max(30, Math.round(tk.scrollWidth / 55)) + "s"; };
    setSpeed(); window.addEventListener("resize", setSpeed);
  }
})();

// Space News slider: arrows + dots (the track itself scrolls/swipes natively)
(function () {
  var t = document.getElementById("sn-track"); if (!t) return;
  var cards = t.children, dots = document.querySelectorAll(".sn-dots i");
  function idx() { var w = cards[0].offsetWidth + 12; return Math.round(t.scrollLeft / w); }
  function mark() { var i = idx(); dots.forEach(function (d, n) { d.classList.toggle("on", n === i); }); }
  document.querySelectorAll(".sn-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = Math.max(0, Math.min(cards.length - 1, idx() + (+b.dataset.d)));
      t.scrollTo({ left: cards[i].offsetLeft - t.offsetLeft, behavior: "smooth" });
    });
  });
  t.addEventListener("scroll", function () { window.requestAnimationFrame(mark); }); mark();
  // auto-slide every 10 s (loops); pauses on hover/touch, while the lightbox is open or the tab is hidden
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var hold = false, box = t.parentNode;
  ["mouseenter", "touchstart", "focusin"].forEach(function (ev) { box.addEventListener(ev, function () { hold = true; }, { passive: true }); });
  ["mouseleave", "focusout"].forEach(function (ev) { box.addEventListener(ev, function () { hold = false; }); });
  setInterval(function () {
    if (hold || document.hidden || document.body.classList.contains("lb-open")) return;
    var i = (idx() + 1) % cards.length;
    t.scrollTo({ left: cards[i].offsetLeft - t.offsetLeft, behavior: "smooth" });
  }, 10000);
})();

// news photos that fail to load (missing, hotlink-blocked, deleted): swap for a styled "no signal" card instead of a broken-image icon
(function () {
  function bad(img) { var w = img.closest(".hl-img"); if (w) w.classList.add("hl-noimg", "hl-lost"); img.remove(); }
  document.querySelectorAll(".hl-img img, .sn-img img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) bad(img);
    else img.addEventListener("error", function () { bad(img); });
  });
})();

// easter egg: header top line = today's daylight progress in Zadar (sunrise -> sunset), empty at night
(function () {
  var bar = document.querySelector(".topbar"), sky = document.querySelector(".sky[data-rise][data-set]");
  if (!bar || !sky) return;
  var line = document.createElement("span"); line.className = "daybar"; line.setAttribute("aria-hidden", "true"); bar.appendChild(line);
  var rise = +sky.dataset.rise, set = +sky.dataset.set, day = set - rise;
  function tick() {
    var now = Date.now() / 1000, p = 0;
    if (day > 0 && now > rise && now < set) p = (now - rise) / day;
    else if (day > 0 && now >= set) {   /* page left open past midnight: shift to the next day's times */
      while (now > rise + 86400) { rise += 86400; set += 86400; }
      if (now > rise && now < set) p = (now - rise) / day;
    }
    line.style.width = (p * 100).toFixed(2) + "%";
    line.title = p > 0 ? "Daylight in Zadar: " + Math.round(p * 100) + "% of today's daylight gone" : "";
  }
  tick(); setInterval(tick, 60000);
})();

// logo easter egg: every 1-4 min the logo backspaces itself, types a Dalmatian word, then types itself back
(function () {
  var logo = document.querySelector(".brand"); if (!logo) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var WORDS = ["fjaka", "pomalo", "bura", "jugo", "maraschino", "sjor", "bonaca", "kuzis", "cakula", "dir", "pjat",
               "marenda", "skoj", "tovar", "borsa", "kalelarga", "makijato", "di si"];
  var BASE = "iTechie.eu", last = "";
  logo.setAttribute("aria-label", BASE);
  var box0 = logo.getBoundingClientRect();
  logo.style.minWidth = box0.width + "px";
  logo.style.height = box0.height + "px";              // keep the header height fixed while letters change
  logo.style.display = "inline-block"; logo.style.lineHeight = box0.height + "px";
  logo.style.whiteSpace = "nowrap";
  function render(t) {                       // keep ".eu" cyan while the real logo is typed
    var cut = BASE.indexOf(".eu");
    if (BASE.indexOf(t) === 0 && t.length > cut) {
      logo.textContent = t.slice(0, cut);
      var s = document.createElement("span"); s.textContent = t.slice(cut); logo.appendChild(s);
    } else logo.textContent = t;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function key() { return 70 + Math.random() * 90; }            // human-ish typing speed
  async function erase(t) { for (var i = t.length; i >= 0; i--) { render(t.slice(0, i)); await wait(45 + Math.random() * 40); } }
  async function type(t) { for (var i = 1; i <= t.length; i++) { render(t.slice(0, i)); await wait(key()); } }
  async function play() {
    if (document.hidden) return schedule();
    var w; do { w = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (w === last); last = w;
    await erase(BASE); await wait(350);
    await type(w);     await wait(2400);
    await erase(w);    await wait(300);
    await type(BASE);
    schedule();
  }
  function schedule() { setTimeout(play, 60000 + Math.random() * 180000); }
  // secret trigger: open the page with #fjaka (or change the address to it) and it plays right away with "fjaka"
  var busy = false;
  async function now(word) { if (busy) return; busy = true; last = "";
    await erase(BASE); await wait(350); await type(word); await wait(2400); await erase(word); await wait(300); await type(BASE); busy = false; }
  function hash() { if (location.hash.toLowerCase() === "#fjaka") setTimeout(function () { now("fjaka"); }, 2000); }
  window.addEventListener("hashchange", hash); hash();
  schedule();
})();

// mission line: typed once, then the terminal "talks": live facts, data reactions, time-of-day remarks (visitor's own clock),
// random questions (movie, word of the day) and AI "thoughts". Decided in the browser; nothing is stored or sent.
(function () {
  var box = document.getElementById("mission"); if (!box) return;
  var t = box.querySelector(".mission-t"), f = box.querySelector(".mission-f");
  var c = {}; try { c = JSON.parse(box.dataset.facts || "{}"); } catch (x) {}
  if (Array.isArray(c)) c = { facts: c };
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function timeLines() {
    var d = new Date(), h = d.getHours(), wd = d.getDay(), now = pad(h) + ":" + pad(d.getMinutes()), L = [];
    if (h >= 23 || h < 4) L.push("it's " + now + ". why are you still awake?", "night shift again? the terminal sees you.", "go to sleep, operator. the world will still be here.", "insomnia detected. hydrate. then sleep.");
    else if (h < 7) L.push("early riser detected. respect, the city is still asleep.", "makijato first, apocalypse later. that is the protocol.", "the sea is quiet at this hour, and so is this terminal.");
    else if (h < 10) L.push("good morning, operator. coffee status: hopefully already in your hand.", "new day, same terminal. let us see what the world broke overnight.");
    else if (h >= 13 && h < 16) L.push("peak fjaka hours in Dalmatia. resistance is futile, just let it happen.", "post-lunch fjaka detected. productivity levels dropping across the coast.");
    else if (h >= 19 && h < 23) L.push("evening watch has started. anything good to watch tonight, operator?", "golden hour is over. the lights of Zadar are coming on one by one.");
    if (wd === 5 && h >= 16) L.push("weekend protocol engaged. all non-essential worries suspended until monday.");
    if (wd === 1 && h < 12) L.push("it is monday morning. survive it, and the rest of the week is easy.");
    if (wd === 0) L.push("it is sunday. even home servers deserve a little fjaka today.");
    return L;
  }
  function dataLines() {
    var L = [];
    if (c.wind && c.wind.gust >= 50 && /bura/i.test(c.wind.name)) L.push("bura gusts " + c.wind.gust + " km/h. hold onto everything.");
    else if (c.wind && c.wind.gust >= 45) L.push(c.wind.name + " is pushing " + c.wind.gust + " km/h gusts. hats off. literally.");
    if (c.wind && /jugo/i.test(c.wind.name)) L.push("jugo blowing. headaches are not your fault today.");
    if (c.rain) L.push("it is raining in Zadar. stay in, make a coffee and read the news.");
    if (c.level && c.level[0] >= 3) L.push("level " + c.level[0] + ". check your 72-hour kit.");
    if (c.level && c.level[0] === 1) L.push("all six sensors report calm. honestly, that is a little suspicious.");
    if (c.launch) { var s = c.launch - Date.now() / 1000;
      if (s > 0 && s < 6 * 3600) L.push("rocket leaves in " + Math.floor(s / 3600) + "h " + Math.floor(s % 3600 / 60) + "m. watch the sky.");
      else if (s > 0 && s < 36 * 3600) L.push("next rocket in " + Math.round(s / 3600) + " hours. someone, somewhere, is nervous."); }
    return L;
  }
  function randomLines() {
    var L = [];
    if (c.movie) L.push("have you watched " + c.movie + " yet? it is my latest recommendation for a reason.", "if you need something for tonight: " + c.movie + ". you are welcome.");
    if (c.word) L.push("today's word is " + c.word[0] + ". can you say it? try it out loud: " + c.word[1] + ".", "word of the day: " + c.word[0] + ", which means " + c.word[2] + ". use it today.");
    L.push("pomalo. whatever it is, it can wait until after the coffee.", "di si? still here, still watching the sky above Zadar.", "no cookies were harmed in the making of this site. none were even baked.", "this line was typed by a machine. probably. you will never know for sure.");
    return L;
  }
  // one line at a time: mostly facts, then a mix; night-time remarks come up more often
  var last = "";
  function next() {
    var night = new Date().getHours() >= 23 || new Date().getHours() < 4, r = Math.random(), pool;
    var T = timeLines(), Dl = dataLines(), A = c.ai || [], R = randomLines(), F = (c.facts || []);
    if (night && T.length && r < 0.35) pool = T;
    else if (r < 0.40 && F.length) pool = F;
    else if (r < 0.58 && Dl.length) pool = Dl;
    else if (r < 0.75 && A.length) pool = A;
    else if (r < 0.87 && T.length) pool = T;
    else pool = R;
    var s, n = 0; do { s = pick(pool); } while (s === last && ++n < 5); last = s; return s;
  }
  async function typeInto(el, s, base) { for (var i = 1; i <= s.length; i++) { el.textContent = s.slice(0, i); await wait(base + Math.random() * 40); } }
  async function eraseFrom(el) { var s = el.textContent; for (var i = s.length; i >= 0; i--) { el.textContent = s.slice(0, i); await wait(18); } }
  var MISSION = t.textContent;
  f.remove();                                   // everything is typed into the one line now
  (async function () {
    if (calm) return;                           // reduced motion: the mission sentence just stays
    t.textContent = ""; await wait(900);
    await typeInto(t, MISSION, 28); await wait(6000);
    var k = 0;
    for (;;) {
      if (document.hidden) { await wait(2000); continue; }
      await eraseFrom(t); await wait(300);
      var s = (++k % 12 === 0) ? MISSION : next();   // the mission sentence comes back now and then
      await typeInto(t, s, 35);
      await wait(15000);                        // each line stays 15 s
    }
  })();
})();

// easter egg: click the version number -> the planes that are over Zadar right now fly across the screen (none = nothing happens)
(function () {
  var ver = document.querySelector(".ver"); if (!ver) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var flying = false;
  ver.addEventListener("click", function () {
    if (flying) return;
    var cnt = document.querySelector(".atc-count b"), n = cnt ? parseInt(cnt.textContent, 10) || 0 : 0;
    if (!n) return;                                                     // empty sky: nothing happens
    var calls = [].map.call(document.querySelectorAll(".atc-list li > b"), function (b) { return b.textContent.trim(); });
    flying = true; n = Math.min(n, 12);
    for (var i = 0; i < n; i++) (function (i) {
      setTimeout(function () {
        var p = document.createElement("div"), rtl = Math.random() < 0.5, dur = 5 + Math.random() * 4;
        p.className = "fly-plane" + (rtl ? " rtl" : "");
        p.style.top = (8 + Math.random() * 78) + "vh";
        p.style.animationDuration = dur + "s";
        p.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>'
                    + (calls[i] ? '<span>' + calls[i].replace(/[<>&]/g, "") + '</span>' : "");
        document.body.appendChild(p);
        setTimeout(function () { p.remove(); if (i === n - 1) flying = false; }, dur * 1000 + 200);
      }, i * 700);
    })(i);
  });
})();

// easter egg: click the launch countdown -> a rocket lifts off from the bottom of the screen
// (in the last hour before the real launch the screen shakes too)
(function () {
  var cd = document.querySelector(".countdown[data-t0]"); if (!cd) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var busy = false;
  cd.addEventListener("click", function () {
    if (busy) return; busy = true;
    var left = Math.max(0, +cd.dataset.t0 - Date.now() / 1000);
    var r = document.createElement("div"); r.className = "fly-rocket";
    r.style.left = (20 + Math.random() * 60) + "vw";
    r.innerHTML = '<svg viewBox="0 0 24 48" aria-hidden="true"><path class="body" d="M12 1c4 4 6 9 6 16v14H6V17C6 10 8 5 12 1z"/>'
                + '<circle class="win" cx="12" cy="15" r="2.6"/><path class="fin" d="M6 24l-5 9v2l5-3zM18 24l5 9v2l-5-3z"/>'
                + '<path class="flame" d="M7 31h10l-2 9-3 6-3-6z"/></svg><i class="smoke"></i>';
    document.body.appendChild(r);
    if (left > 0 && left < 3600) document.body.classList.add("lift-shake");    // real launch within the hour
    setTimeout(function () { r.remove(); document.body.classList.remove("lift-shake"); busy = false; }, 4200);
  });
})();
