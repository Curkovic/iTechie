/* NEON//OS — prebuilt NightNet websites for the NetWalker browser.
   Add a site: add an entry to SITES with render(path, query) → { title, html }.
   Links use data-href="host/path". Buttons with data-download="file" save into ~/Downloads. */
(() => {
  const L = (href, text, cls = '') => `<a data-href="${href}" class="${cls}">${text}</a>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const flag = k => { try { return JSON.parse(localStorage.getItem('neon.flags') || '{}')[k]; } catch { return false; } };

  /* ---------- data ---------- */
  const ARTICLES = [
    { id: 1, tag: 'CITY', title: 'Grid blackout plunges Lower Docks into darkness for 14 hours', by: 'Mara Okafor',
      sum: 'Residents say the outage hit only the poorest blocks. The power authority blames "solar weather".',
      body: ['The lights went out in the Lower Docks just after midnight and did not come back until mid-afternoon, leaving forty thousand residents without heat, water pumps or net access.',
        'The Municipal Power Authority blamed a solar storm. Independent netrunners who looked at the grid logs say the shutdown was surgical: only sixteen substations went dark, all of them south of the canal.',
        '"Solar weather doesn\'t read zoning maps," said one resident, who asked not to be named. The authority declined to answer further questions.'] },
    { id: 2, tag: 'CORP', title: 'Helix Dynamics stock jumps 12% on rumors of "Project Lantern"', by: 'Dev Ramires',
      sum: 'Nobody outside the company knows what Lantern is. Traders are buying anyway.',
      body: ['Helix Dynamics shares closed up twelve percent on Friday after an anonymous post claimed the company was weeks away from unveiling "Project Lantern".',
        'Helix has not confirmed the project exists. Its public site lists only consumer neural links and logistics drones.',
        'Former employees describe a sealed floor at the Helix tower where badges stop working. "You didn\'t ask about the 88th floor," one said.'] },
    { id: 3, tag: 'TECH', title: 'Black-market icebreakers are getting cheaper, and that worries security firms', by: 'Ines Halloway',
      sum: 'Tools that once cost a fortune now trade for pocket change on hidden markets.',
      body: ['Five years ago, software capable of cracking corporate ICE was the domain of state agencies and the richest crime syndicates. Today, analysts say, versions trade for less than a month of rent.',
        'Security firms report a threefold rise in intrusion attempts this year. Most are crude, but some get through.',
        '"The barrier to entry has collapsed," said one analyst. "A kid with a deck and a bad attitude can now knock on doors we thought were sealed."'] },
    { id: 4, tag: 'STREET', title: 'Night market vendors protest new drone patrols', by: 'Mara Okafor',
      sum: 'Vendors say the drones scare off customers and log every face that walks by.',
      body: ['Hundreds of night market vendors shuttered their stalls on Tuesday to protest a new fleet of surveillance drones.',
        'The drones, supplied under a city contract by Helix Dynamics, scan faces and transmit them to a central database.',
        'City officials say the patrols reduce crime. Vendors say they reduce business.'] },
    { id: 5, tag: 'WEATHER', title: 'Acid rain advisory extended through the weekend', by: 'Weather Desk',
      sum: 'Keep coats sealed and optics covered. pH expected to drop to 4.1.',
      body: ['The city weather service extended its acid rain advisory through Sunday night.',
        'Residents are advised to keep exposed cyberware covered and avoid standing water. Umbrella vendors report record sales.'] },
  ];

  const PRODUCTS = [
    { id: 'opt', slot: 'OCULAR', name: 'Kestrel Optics Mk.II', desc: 'Low-light vision, 12× zoom, threat highlighting. Includes free recalibration.', price: 4800 },
    { id: 'arm', slot: 'ARMS', name: 'Mantis Forearm Blades', desc: 'Retractable monowire-edged blades. License required in most districts.', price: 12500 },
    { id: 'leg', slot: 'LEGS', name: 'Springline Tendons', desc: 'Reinforced tendons for double jumps and soft landings.', price: 7200 },
    { id: 'neu', slot: 'NEURAL', name: 'Synapse Booster v4', desc: 'Faster reflexes and reaction time. Side effects may include vivid dreams.', price: 9900 },
    { id: 'skn', slot: 'DERMAL', name: 'Subdermal Plating', desc: 'Ceramic armor mesh grafted under the skin. Stops small-caliber rounds.', price: 6400 },
    { id: 'hrt', slot: 'CIRCULATORY', name: 'BioPump Heart', desc: 'Backup heart that kicks in when the original gives up. Peace of mind.', price: 21000 },
  ];
  const cart = new Set();

  const LISTINGS = [
    { name: 'icebreaker.exe', desc: 'Cracks class 1–3 corporate ICE. One use per target. Tested on Helix.', seller: 'echo', price: '0.04 Ξ', dl: true },
    { name: 'ghost_mask.bin', desc: 'Spoofs your facial ID for drone scanners. 6h runtime.', seller: 'nullset', price: '0.11 Ξ' },
    { name: 'daemon_pack.zip', desc: '12 combat daemons: short circuit, overheat, optics reset.', seller: 'kraken', price: '0.32 Ξ' },
    { name: 'clinic_creds.txt', desc: 'Staff logins for a downtown clinic. Probably expired.', seller: 'anon', price: '0.01 Ξ' },
  ];

  const DOWNLOADS = {
    'icebreaker.exe': `MZ\u0090\u0003 ICEBREAKER v3.1 // build by echo
target=helix-dynamics.corp
payload=lantern_dump
// double-click to run`,
  };

  const LANTERN = `PROJECT LANTERN // INTERNAL // CLEARANCE 9
------------------------------------------------
Lantern is not a product. It is a backdoor.

Every Helix neural link shipped since 2075 carries a
dormant listener. When enabled, it lets Helix read a
user's location and visual feed in real time.

Pilot test: Lower Docks, 16 substations powered down to
mask the activation spike. (see: NightNet News, "Grid blackout")

Rollout: city-wide, next quarter.

>> If you're reading this, the fixer was right.
>> Get this to someone who can publish it.`;

  /* ---------- pages ---------- */
  const SITES = {
    'netsearch.nc': {
      render(path, q) {
        const query = (q.get('q') || '').trim();
        const head = `<div class="logo">Net<span>Search</span><em>.</em></div>
          <form data-search><input name="q" value="${esc(query)}" placeholder="Search the NightNet..." autocomplete="off"><button>SCAN</button></form>
          <div class="tag">INDEXING ${(48213 + new Date().getMinutes() * 7).toLocaleString()} NODES · NO TRACKING*</div>`;
        if (!query) {
          return { title: 'NetSearch', html: `<div class="s-search">${head}
            <div class="nodes">${INDEX.map(s => `<div class="node" data-href="${s.url}"><b>${s.title}</b><small>${s.url}</small><p>${s.desc}</p></div>`).join('')}</div></div>` };
        }
        const words = query.toLowerCase().split(/\s+/);
        const hits = INDEX.filter(s => words.some(w => (s.title + ' ' + s.desc + ' ' + s.kw).toLowerCase().includes(w)));
        return { title: `${query} — NetSearch`, html: `<div class="s-search">${head}<div class="results">
          <p class="tag" style="margin:14px 0">${hits.length} RESULT${hits.length === 1 ? '' : 'S'} FOR "${esc(query)}"</p>
          ${hits.map(s => `<div class="res"><small>${s.url}</small>${L(s.url, s.title)}<p>${s.desc}</p></div>`).join('') || '<p class="tag">Nothing on the grid matches that. Try "news", "cyberware" or "market".</p>'}
          </div></div>` };
      },
    },

    'nightnet.news': {
      render(path) {
        const date = new Date(); date.setFullYear(2077);
        const header = `<header><div class="mast">NightNet<span>.</span>News</div>
          <div class="date">${date.toDateString()} · The city never sleeps, neither do we</div></header>
          <nav>${L('nightnet.news', 'Front page')}${['CITY', 'CORP', 'TECH', 'STREET'].map(t => L('nightnet.news/section/' + t.toLowerCase(), t)).join('')}</nav>
          <div class="ticker"><span>BREAKING: ${ARTICLES.map(a => a.title.toUpperCase()).join('  ///  ')}</span></div>`;
        const m = path.match(/^\/article\/(\d+)/);
        if (m) {
          const a = ARTICLES.find(x => x.id === +m[1]);
          if (!a) return null;
          return { title: a.title, html: `<div class="s-news">${header}<article>
            ${L('nightnet.news', '← Front page', 'back')}<div class="kicker" style="margin-top:18px">${a.tag}</div>
            <h1>${a.title}</h1><div class="by">By ${a.by} · NightNet News</div>
            ${a.body.map(p => `<p>${p}</p>`).join('')}</article></div>` };
        }
        const sec = (path.match(/^\/section\/(\w+)/) || [])[1];
        const list = sec ? ARTICLES.filter(a => a.tag.toLowerCase() === sec) : ARTICLES;
        return { title: 'NightNet News', html: `<div class="s-news">${header}<div class="grid">
          ${list.map((a, i) => `<div class="card ${i === 0 && !sec ? 'lead' : ''}" data-href="nightnet.news/article/${a.id}">
            <div class="kicker">${a.tag}</div><h2>${a.title}</h2><p>${a.sum}</p></div>`).join('')}</div></div>` };
      },
    },

    'helix-dynamics.corp': {
      render(path) {
        const head = `<header><div class="brand">HELIX<i>/</i>DYNAMICS</div>
          <nav>${L('helix-dynamics.corp', 'Home')}${L('helix-dynamics.corp/products', 'Products')}${L('helix-dynamics.corp/careers', 'Careers')}${L('helix-dynamics.corp/internal', 'Internal')}</nav></header>`;
        const foot = `<footer>© 2077 HELIX DYNAMICS · SEE FURTHER · ALL TRAFFIC IS MONITORED FOR YOUR SAFETY</footer>`;
        const page = body => `<div class="s-corp">${head}${body}${foot}</div>`;
        if (path.startsWith('/internal')) {
          if (!flag('helix')) return { title: 'ACCESS DENIED', html: page(`<div class="denied"><h1>ACCESS DENIED</h1>
            <p>Clearance level 9 required. This attempt has been logged.</p><p style="font-family:var(--mono);font-size:12px;margin-top:16px">ICE: BLACK · CLASS 3 · TRACE ACTIVE</p></div>`) };
          return { title: 'Helix // INTERNAL', html: page(`<section><h2>// INTERNAL · ICE BYPASSED</h2><div class="leak">${LANTERN}</div></section>`) };
        }
        if (path.startsWith('/products')) return { title: 'Helix Products', html: page(`<section><h2>PRODUCTS</h2><div class="cols">
          <div class="col"><h3>Lumen Neural Link</h3><p>The world's most popular neural interface. Thought-to-text, AR overlays, and seamless NightNet access.</p></div>
          <div class="col"><h3>Sentinel Drones</h3><p>Autonomous city patrol units. Facial recognition, crowd analytics, and 22-hour flight time.</p></div>
          <div class="col"><h3>Helix Cloud Memory</h3><p>Back up your memories to our secure servers. Your past, protected forever.</p></div></div></section>`) };
        if (path.startsWith('/careers')) return { title: 'Helix Careers', html: page(`<section><h2>CAREERS</h2><div class="cols">
          <div class="col"><h3>Security Analyst</h3><p>Tower 3 · Help us keep the city safe. Must pass loyalty screening.</p></div>
          <div class="col"><h3>Neural Firmware Engineer</h3><p>Floor 88 · Classified project. NDA required before interview.</p></div>
          <div class="col"><h3>Drone Fleet Operator</h3><p>Lower Docks · Night shifts. Hazard pay included.</p></div></div></section>`) };
        if (path !== '/' && path !== '') return null;
        return { title: 'Helix Dynamics — See Further', html: page(`<div class="hero"><h1>See further.<br>Think faster.</h1>
          <p>For forty years Helix Dynamics has connected minds to the city. Our neural links power 80% of the world's thoughts.</p>
          ${L('helix-dynamics.corp/products', 'EXPLORE PRODUCTS', 'cta')}</div>
          <section><h2>WHAT WE DO</h2><div class="cols">
          <div class="col"><h3>Connect</h3><p>Neural links that bridge mind and machine, built for everyone.</p></div>
          <div class="col"><h3>Protect</h3><p>Smart city security that sees threats before they happen.</p></div>
          <div class="col"><h3>Remember</h3><p>Cloud memory so you never lose a moment again.</p></div></div></section>`) };
      },
    },

    'chromeclinic.med': {
      render() {
        const total = PRODUCTS.filter(p => cart.has(p.id)).reduce((s, p) => s + p.price, 0);
        return { title: 'Chrome Clinic — Cyberware', html: `<div class="s-clinic">
          <header><div class="brand">✚ CHROME CLINIC</div><div class="cart">CART: ${cart.size} · ¢${total.toLocaleString()}</div></header>
          <div class="intro"><h1>Upgrade the meat.</h1><p>Licensed cyberware installs by Dr. Ilse Vane. Payment plans available. Repossession is a last resort.</p></div>
          <div class="shop">${PRODUCTS.map(p => `<div class="item"><div class="slot">${p.slot}</div><h3>${p.name}</h3><p>${p.desc}</p>
            <div class="row"><span class="price">¢${p.price.toLocaleString()}</span>
            <button class="add ${cart.has(p.id) ? 'in' : ''}" data-cart="${p.id}">${cart.has(p.id) ? 'IN CART' : 'ADD'}</button></div></div>`).join('')}</div></div>` };
      },
      onClick(el, reload) {
        const id = el.closest('[data-cart]')?.dataset.cart;
        if (!id) return false;
        cart.has(id) ? cart.delete(id) : cart.add(id);
        reload();
        return true;
      },
    },

    'darkbazaar.void': {
      render() {
        return { title: '▓ DARK BAZAAR ▓', html: `<div class="s-bazaar"><pre class="ascii">
 ██████╗  █████╗ ██████╗ ██╗  ██╗    ██████╗  █████╗ ███████╗ █████╗  █████╗ ██████╗
 ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝    ██╔══██╗██╔══██╗╚══███╔╝██╔══██╗██╔══██╗██╔══██╗
 ██║  ██║███████║██████╔╝█████╔╝     ██████╔╝███████║  ███╔╝ ███████║███████║██████╔╝
 ██║  ██║██╔══██║██╔══██╗██╔═██╗     ██╔══██╗██╔══██║ ███╔╝  ██╔══██║██╔══██║██╔══██╗
 ██████╔╝██║  ██║██║  ██║██║  ██╗    ██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝</pre>
          <div class="warn">⚠ NO REFUNDS. NO NAMES. NO QUESTIONS. YOUR CONNECTION IS BEING BOUNCED THROUGH 7 RELAYS.</div>
          <div class="tbl"><table><tr><th>FILE</th><th>DESCRIPTION</th><th>SELLER</th><th>PRICE</th><th></th></tr>
          ${LISTINGS.map(l => `<tr><td>${l.name}</td><td>${l.desc}</td><td><small>@${l.seller}</small></td><td>${l.price}</td>
            <td>${l.dl ? `<button class="dl" data-download="${l.name}">GET</button>` : '<small>SOLD OUT</small>'}</td></tr>`).join('')}
          </table></div>
          <p style="margin-top:22px;font-size:12px;color:#1f8a0a">// the first one's free, runner. — echo</p></div>` };
      },
    },
  };

  const INDEX = [
    { url: 'nightnet.news', title: 'NightNet News', desc: 'Independent news from the streets, corps and the grid.', kw: 'news blackout docks helix lantern weather' },
    { url: 'helix-dynamics.corp', title: 'Helix Dynamics', desc: 'Neural links, city security and cloud memory. See further.', kw: 'corp corporation neural link drones lantern careers' },
    { url: 'chromeclinic.med', title: 'Chrome Clinic', desc: 'Licensed cyberware installs and upgrades. Payment plans available.', kw: 'cyberware implants clinic optics arms doctor vane shop' },
    { url: 'darkbazaar.void', title: 'Dark Bazaar', desc: 'You did not find this through a search engine.', kw: 'market black icebreaker hack daemon echo ice' },
    { url: 'netsearch.nc', title: 'NetSearch', desc: 'Search the NightNet. Probably no tracking.', kw: 'search home' },
  ];

  window.SITES = SITES;
  window.SITE_INDEX = INDEX;
  window.SITE_DOWNLOADS = DOWNLOADS;
})();
