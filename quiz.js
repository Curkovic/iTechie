/* =====================================================================
   iTechie.eu quiz engine (shared by every /quiz/N.html)
   Reads the page's meta tags (quiz-title, quiz-topic, quiz-icon,
   quiz-description) and the questions in <script id="quiz-data">:
     [{"q": "question", "a": ["4 answers"], "c": index of correct, "e": "optional explanation"}]
   Flow: start screen -> 10 questions (answers shuffled) -> score + full review.
   All content is inserted as text (no HTML injection possible).
   ===================================================================== */
(function () {
  var app = document.getElementById("quiz-app");
  if (!app) return;
  var meta = function (n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? m.getAttribute("content") : ""; };
  var TITLE = meta("quiz-title") || "Quiz", TOPIC = meta("quiz-topic"), DESC = meta("quiz-description"), ICON = meta("quiz-icon");
  var data = [];
  try { data = JSON.parse(document.getElementById("quiz-data").textContent || "[]"); } catch (e) { data = []; }
  data = data.filter(function (x) { return x && x.q && Array.isArray(x.a) && x.a.length >= 2 && typeof x.c === "number" && x.a[x.c] != null; });

  var ICONS = {
    space: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)"/>',
    telescope: '<path d="M3 14l14-6 2 4-14 6z"/><path d="M10 15l-3 7M12 14l3 8"/><circle cx="19.5" cy="9" r="1"/>',
    biology: '<path d="M7 3c0 6 10 6 10 12s-10 3-10 6"/><path d="M17 3c0 6-10 6-10 12s10 3 10 6"/><path d="M8.5 7h7M8.5 17h7"/>',
    nutrition: '<path d="M12 7c-4-2-8 1-7 6s4 8 7 7c3 1 6-2 7-7s-3-8-7-6z"/><path d="M12 7c0-2 1-4 3-4"/>',
    survival: '<path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
    tech: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    ai: '<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    internet: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    history: '<path d="M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9s10 4 10 9"/>',
    body: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M4 12h3l2-3 3 6 2-3h6"/>',
    animals: '<circle cx="7" cy="9" r="1.8"/><circle cx="12" cy="6.5" r="1.8"/><circle cx="17" cy="9" r="1.8"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-2 3-4 3-4 0-4-3z"/>',
    film: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l2-5 16 3-1.5 2M8 4.5l3 4M14 5.5l3 4"/>',
    weather: '<path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1A3.5 3.5 0 0 1 17 17"/><path d="M12 13l-2 4h3l-2 4"/>',
    croatia: '<path d="M5 3h14v9c0 5-7 9-7 9s-7-4-7-9z"/><path d="M5 7h14M5 11h14M9 3v12M15 3v12"/>',
    sea: '<circle cx="12" cy="8" r="3"/><path d="M2 15c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1M2 19c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1"/>',
    language: '<path d="M4 4h11v8H9l-4 3v-3H4z"/><path d="M15 8h5v8h-1v3l-3-3h-5v-3"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    myth: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
    "default": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5"/>'
  };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function icon() {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "qz-ico"); s.setAttribute("aria-hidden", "true");
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.6");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    s.innerHTML = ICONS[ICON] || ICONS["default"];        /* fixed, built-in markup only */
    return s;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---- layout: top bar + progress + stage ---- */
  app.innerHTML = "";
  var top = el("div", "qz-top");
  var brand = el("a", "qz-brand"); brand.href = "/"; brand.appendChild(document.createTextNode("iTechie")); brand.appendChild(el("span", "", ".eu"));
  var close = el("a", "qz-close", "✕"); close.href = "/#quiz"; close.setAttribute("aria-label", "Close quiz");
  top.appendChild(brand); top.appendChild(el("span", "qz-title", TITLE)); top.appendChild(close);
  var prog = el("div", "qz-prog"); prog.setAttribute("aria-hidden", "true");
  var count = el("div", "qz-count");
  var stage = el("main", "qz-stage"); stage.setAttribute("aria-live", "polite");
  app.appendChild(top); app.appendChild(prog); app.appendChild(count); app.appendChild(stage);

  var state, keyHandler = null;
  function onKey(fn) { keyHandler = fn; }
  document.addEventListener("keydown", function (ev) { if (keyHandler && !ev.metaKey && !ev.ctrlKey && !ev.altKey) keyHandler(ev); });

  function drawProgress() {
    prog.innerHTML = ""; prog.style.setProperty("--n", data.length);
    data.forEach(function (_, i) {
      var seg = el("i", "");
      if (state.answers[i] != null) seg.className = state.answers[i].right ? "ok" : "bad";
      else if (i === state.i && state.started) seg.className = "cur";
      prog.appendChild(seg);
    });
    count.textContent = state.started && state.i < data.length ? "QUESTION " + (state.i + 1) + " / " + data.length : (TOPIC ? TOPIC.toUpperCase() : "");
  }

  /* ---- start ---- */
  function start() {
    state = { i: 0, answers: [], started: false };
    drawProgress();
    var card = el("div", "qz-card");
    card.appendChild(icon());
    card.appendChild(el("h1", "qz-h1", TITLE));
    if (DESC) card.appendChild(el("p", "qz-lead", DESC));
    if (!data.length) {
      card.appendChild(el("p", "qz-meta", "// questions are being written. check back soon."));
      var back = el("a", "qz-btn ghost", "Back to iTechie"); back.href = "/#quiz"; card.appendChild(back);
      stage.innerHTML = ""; stage.appendChild(card); onKey(null); return;
    }
    card.appendChild(el("p", "qz-meta", data.length + " questions · about " + Math.max(1, Math.round(data.length * 0.3)) + " minutes"));
    var go = el("button", "qz-btn", "Start"); go.type = "button";
    go.addEventListener("click", function () { state.started = true; ask(); });
    card.appendChild(go);
    stage.innerHTML = ""; stage.appendChild(card); go.focus({ preventScroll: true });
    onKey(function (ev) { if (ev.key === "Enter") { ev.preventDefault(); go.click(); } });
  }

  /* ---- one question ---- */
  function ask() {
    var item = data[state.i];
    var order = shuffle(item.a.map(function (_, k) { return k; }));
    drawProgress();
    var card = el("div", "qz-card");
    card.appendChild(el("h2", "qz-q", item.q));
    var opts = el("div", "qz-opts"), buttons = [];
    order.forEach(function (k, pos) {
      var b = el("button", "qz-opt"); b.type = "button";
      b.appendChild(el("kbd", "", String(pos + 1))); b.appendChild(el("span", "", item.a[k]));
      b.addEventListener("click", function () { choose(k); });
      buttons.push({ b: b, k: k }); opts.appendChild(b);
    });
    card.appendChild(opts);
    stage.innerHTML = ""; stage.appendChild(card);
    window.scrollTo({ top: 0, behavior: "smooth" });

    function choose(k) {
      if (state.answers[state.i] != null) return;
      var right = k === item.c;
      state.answers[state.i] = { picked: k, right: right };
      buttons.forEach(function (o) {
        o.b.disabled = true;
        if (o.k === item.c) o.b.classList.add("right"); else if (o.k === k) o.b.classList.add("wrong");
      });
      drawProgress();
      var ex = el("p", "qz-explain " + (right ? "ok" : "bad"));
      ex.appendChild(el("b", "", right ? "✓ correct" : "✗ wrong"));
      ex.appendChild(document.createTextNode(item.e || (right ? "" : "Correct answer: " + item.a[item.c])));
      card.appendChild(ex);
      var last = state.i + 1 >= data.length;
      var next = el("button", "qz-btn qz-next", last ? "See results" : "Next question"); next.type = "button";
      next.addEventListener("click", function () { state.i++; last ? result() : ask(); });
      card.appendChild(next); next.focus({ preventScroll: true });
      next.scrollIntoView({ behavior: "smooth", block: "nearest" });
      onKey(function (ev) { if (ev.key === "Enter") { ev.preventDefault(); next.click(); } });
    }
    onKey(function (ev) { var n = parseInt(ev.key, 10); if (n >= 1 && n <= buttons.length) buttons[n - 1].b.click(); });
  }

  /* ---- result + full review ---- */
  function result() {
    state.started = false; drawProgress();
    var score = state.answers.filter(function (a) { return a && a.right; }).length, pct = score / data.length;
    try {   /* best score per quiz, kept only in this browser (shown on /quiz/) */
      var qn = (location.pathname.match(/(\d+)\.html$/) || [])[1];
      if (qn) { var b = JSON.parse(localStorage.getItem("itq-best") || "{}");
        if (!b[qn] || score > b[qn].s) { b[qn] = { s: score, t: data.length }; localStorage.setItem("itq-best", JSON.stringify(b)); } }
    } catch (x) {}
    count.textContent = "RESULT";
    var card = el("div", "qz-card");
    card.appendChild(icon());
    var sc = el("p", "qz-score", String(score)); sc.appendChild(el("small", "", " / " + data.length)); card.appendChild(sc);
    card.appendChild(el("p", "qz-verdict", pct >= 0.9 ? "Overlord material." : pct >= 0.7 ? "You'd survive." : pct >= 0.4 ? "Keep studying, operator." : "The machines thank you for your cooperation."));
    var list = el("ol", "qz-review");
    data.forEach(function (item, i) {
      var a = state.answers[i] || { picked: -1, right: false };
      var li = el("li", a.right ? "ok" : "");
      var rq = el("p", "rq"); rq.appendChild(el("span", "mark", a.right ? "✓" : "✗")); rq.appendChild(document.createTextNode(item.q)); li.appendChild(rq);
      var you = el("p", "ra yours" + (a.right ? "" : " bad")); you.appendChild(el("span", "", "your answer")); you.appendChild(document.createTextNode(a.picked >= 0 ? item.a[a.picked] : "—")); li.appendChild(you);
      if (!a.right) { var cor = el("p", "ra correct"); cor.appendChild(el("span", "", "correct")); cor.appendChild(document.createTextNode(item.a[item.c])); li.appendChild(cor); }
      if (item.e) li.appendChild(el("p", "re", item.e));
      list.appendChild(li);
    });
    var actions = el("div", "qz-actions");
    var again = el("button", "qz-btn", "Try again"); again.type = "button"; again.addEventListener("click", start);
    var more = el("a", "qz-btn ghost", "More quizzes"); more.href = "/#quiz";
    actions.appendChild(again); actions.appendChild(more);
    card.appendChild(actions); card.appendChild(list);
    stage.innerHTML = ""; stage.appendChild(card);
    window.scrollTo({ top: 0, behavior: "smooth" });
    onKey(null);
  }

  start();
})();
