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

  // NASA image: click to view large (without JS the link opens the image itself)
  var iotd = document.querySelector("a.iotd[data-big]");
  if (iotd) {
    var lb = document.createElement("div"); lb.className = "lb"; lb.hidden = true;
    lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    var box = document.createElement("div"); box.className = "lb-box";
    var x = document.createElement("button"); x.type = "button"; x.className = "lb-close"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    var im = document.createElement("img"); im.alt = "";
    var ti = document.createElement("p"); ti.className = "lb-title";
    var de = document.createElement("p"); de.className = "lb-desc";
    var ln = document.createElement("a"); ln.className = "lb-link"; ln.target = "_blank"; ln.rel = "noopener noreferrer"; ln.textContent = "Full story on NASA.gov ↗";
    box.appendChild(x); box.appendChild(im); box.appendChild(ti); box.appendChild(de); box.appendChild(ln); lb.appendChild(box);
    document.body.appendChild(lb);
    var closeLb = function () { lb.hidden = true; document.body.classList.remove("lb-open"); iotd.focus(); };
    iotd.addEventListener("click", function (ev) {
      var big = iotd.getAttribute("data-big") || "";
      if (big.indexOf("https://") !== 0) return;            // fall back to normal link
      ev.preventDefault();
      im.src = big; im.alt = iotd.getAttribute("data-title") || "";
      ti.textContent = iotd.getAttribute("data-title") || "";
      de.textContent = iotd.getAttribute("data-desc") || "";
      var l = iotd.getAttribute("data-link") || ""; if (l.indexOf("https://") === 0) { ln.href = l; ln.hidden = false; } else ln.hidden = true;
      lb.hidden = false; document.body.classList.add("lb-open"); x.focus();
    });
    x.addEventListener("click", closeLb);
    lb.addEventListener("click", function (ev) { if (ev.target === lb) closeLb(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !lb.hidden) closeLb(); });
  }

  // Operator available / busy: busy for data-window seconds after the last Do Not Disturb file
  var av = document.getElementById("op-av");
  if (av) {
    var dnd = parseInt(av.getAttribute("data-dnd"), 10) || 0, win = parseInt(av.getAttribute("data-window"), 10) || 3600;
    var tickAv = function () {
      var busy = dnd > 0 && Date.now() / 1000 - dnd < win;
      av.className = "op-av " + (busy ? "busy" : "free");
      av.textContent = busy ? "busy" : "available";
      if (busy) { var d = new Date(dnd * 1000); av.title = "Do Not Disturb since " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
      else av.title = "Available";
    };
    tickAv(); setInterval(tickAv, 60000);
  }
})();
