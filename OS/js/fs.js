/* NEON//OS — default virtual filesystem.
   Edit this file to change what ships in the OS. User changes are saved in
   the browser (localStorage) on top of it; Settings → "Reset filesystem" restores this. */
(() => {
  // Small seeded RNG so generated images look the same every load
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function skyline(seed, sky1, sky2, glow) {
    const r = rng(seed), W = 800, H = 450;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle cx="${560 + r() * 120}" cy="110" r="46" fill="${glow}" opacity=".25"/>`;
    for (let layer = 0; layer < 3; layer++) {
      const shade = ['#1a1030', '#100a20', '#07050f'][layer];
      let x = -20;
      while (x < W) {
        const w = 30 + r() * 70, h = 90 + r() * (220 - layer * 40) + layer * 40;
        s += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${shade}"/>`;
        if (layer === 2 || r() > .5) {
          for (let wy = H - h + 10; wy < H - 10; wy += 14)
            for (let wx = x + 6; wx < x + w - 6; wx += 10)
              if (r() > .72) s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="4" height="6" fill="${r() > .8 ? glow : '#fcee0a'}" opacity="${(.3 + r() * .6).toFixed(2)}"/>`;
        }
        x += w + r() * 8;
      }
    }
    s += `<rect y="${H - 3}" width="${W}" height="3" fill="${glow}"/></svg>`;
    return s;
  }

  const portrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<rect width="400" height="400" fill="#0b0b14"/>
<g stroke="#00f0ff" stroke-width="2" fill="none" opacity=".9">
<circle cx="200" cy="170" r="80"/><path d="M90 380c10-90 60-130 110-130s100 40 110 130"/>
<path d="M150 160h30M220 160h30" stroke="#ff003c" stroke-width="5"/>
<path d="M120 170h-30v-40M280 170h30v-40M200 90v-40" opacity=".5"/>
<path d="M245 205l30 20h40" stroke="#fcee0a"/><circle cx="318" cy="225" r="5" fill="#fcee0a"/></g>
<text x="20" y="34" font-family="monospace" font-size="14" fill="#fcee0a">ID://RUNNER-0x7F</text>
<text x="20" y="390" font-family="monospace" font-size="11" fill="#6c7b88">NEURAL SCAN · 98.2% MATCH</text></svg>`;

  const f = content => ({ type: 'file', content });
  const d = children => ({ type: 'dir', children });

  window.DEFAULT_FS = d({
    home: d({
      runner: d({
        Desktop: d({
          'README.txt': f(`NEON//OS — QUICK START
======================

Welcome to the grid, runner.

  • Double-click icons to open them (single tap on touch screens).
  • Drag windows by the title bar, resize from the bottom-right corner.
  • Double-click a title bar to maximize.
  • Everything you create is saved in this browser.

APPS
  FILES      browse the filesystem, make files and folders
  TERMINAL   type 'help' for commands
  NETWALKER  browse the NightNet (bookmarks are in the bar)
  NOTEPAD    edit any text file, Ctrl+S to save

Check mission.txt if you want something to do.`),
          'mission.txt': f(`>> ENCRYPTED MESSAGE // SENDER: [FIXER]

Job's simple. Helix Dynamics is hiding something on their
internal page. Their ICE keeps everyone out.

1. Get an icebreaker from the Dark Bazaar  (darkbazaar.void)
2. Run it from your Downloads folder
3. Read what falls out, then check helix-dynamics.corp/internal

Don't get flatlined.`),
        }),
        Documents: d({
          'notes.txt': f(`- buy coffee (real, not synth)
- fix the left optic, it keeps flickering blue
- pay the clinic before they repossess my arm
- learn more terminal commands`),
          'contacts.db': f(`NAME            HANDLE        NODE              STATUS
--------------------------------------------------------
Rook            @rook         fixer.relay.07    ONLINE
Dr. Ilse Vane   @vane         chromeclinic.med  ONLINE
Nomad Kai       @kai          [unlisted]        OFFLINE
Echo            @echo         darkbazaar.void   ???`),
          Logs: d({
            'run_0412.log': f(`[23:02] entered sector 4, rain heavy
[23:17] contact made, package swapped
[23:40] trace detected, dropped off grid
[00:05] safe.`),
            'run_0419.log': f(`[01:12] netrunning session started
[01:13] ICE: black, class 3. aborted.
[01:14] note to self: need a better icebreaker`),
          }),
        }),
        Pictures: d({
          'night_city.svg': f(skyline(7, '#2a0a3a', '#ff2a6d', '#00f0ff')),
          'docks_dawn.svg': f(skyline(42, '#06122a', '#00a3b0', '#ff003c')),
          'id_scan.svg': f(portrait),
        }),
        Music: d({
          'playlist.txt': f(`NIGHT DRIVE MIX
  01  Chrome Rain — Static Hearts
  02  Lower Docks — Neon Choir
  03  Overclocked — VOLTA
  04  Flatline Lullaby — Ghost Signal
  05  Last Train to Sector 9 — The Ice Breakers`),
        }),
        Downloads: d({
          'readme_first.txt': f(`Downloads from NetWalker land here.
Files ending in .exe can be run by double-clicking them.`),
        }),
      }),
    }),
    system: d({
      'kernel.log': f(`[0.000000] NEON kernel 7.7.2-neural #1 SMP PREEMPT
[0.004211] CPU: Synapse-X 16 cores @ 9.2GHz
[0.112983] neural-link: interface detected on bus 0x7F
[0.553004] ice-fw: firewall loaded, 128 rules
[1.002710] netd: connected to NightNet relay
[1.204551] wm: compositor online`),
      'config.ini': f(`[system]
hostname = neon
user     = runner
shell    = /bin/nsh

[net]
relay    = nightnet.relay.7f
ice      = active
proxy    = none`),
      'diag.exe': f(`binary: system diagnostics (requires root)`),
    }),
    net: d({
      'netsearch.url': f('netsearch.nc'),
      'nightnet_news.url': f('nightnet.news'),
      'helix.url': f('helix-dynamics.corp'),
      'chrome_clinic.url': f('chromeclinic.med'),
    }),
  });
})();
