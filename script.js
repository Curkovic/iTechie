/* iTechie.eu homepage — progressive extras. The page works fully without JS. */
(function () {
  var root = document.documentElement;

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
})();
