/* NEON//OS — core: boot, filesystem, window manager, apps. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
    del(k) { try { localStorage.removeItem(k); } catch { } },
  };
  const touch = matchMedia('(pointer: coarse)').matches;
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ================= ICONS ================= */
  const I = {
    folder: '<svg viewBox="0 0 24 24"><path d="M3 6h6l2 2h10v11H3z"/><path d="M3 10h18"/></svg>',
    text: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 15h7M9 18h4"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-8 7"/></svg>',
    link: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    exe: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9l3 3-3 3M13 15h4"/></svg>',
    term: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16"/><path d="M6 9l3 3-3 3M11 15h6"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/><path d="M15 21l4-4"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/></svg>',
    power: '<svg viewBox="0 0 24 24"><path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>',
    reboot: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>',
  };

  /* ================= FILESYSTEM ================= */
  const HOME = '/home/runner';
  let FS = store.get('neon.fs', null) || clone(window.DEFAULT_FS);
  const fsListeners = new Set();
  const saveFS = () => { store.set('neon.fs', FS); fsListeners.forEach(fn => fn()); };

  const norm = (p, cwd = HOME) => {
    p = String(p || '').trim();
    if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : cwd + '/' + p).split('/');
    const out = [];
    for (const s of parts) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
    return '/' + out.join('/');
  };
  const getNode = path => {
    let n = FS;
    for (const s of path.split('/').filter(Boolean)) { if (n.type !== 'dir' || !n.children[s]) return null; n = n.children[s]; }
    return n;
  };
  const split = path => { const i = path.lastIndexOf('/'); return [path.slice(0, i) || '/', path.slice(i + 1)]; };
  const baseName = path => split(path)[1] || '/';
  const ext = name => { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(i + 1).toLowerCase() : ''; };
  const readOnly = path => path === '/system' || path.startsWith('/system/');
  const pretty = path => path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;

  function fsMake(path, type, content = '') {
    const [dir, name] = split(path);
    const d = getNode(dir);
    if (!name || !d || d.type !== 'dir') throw new Error('no such directory: ' + dir);
    if (readOnly(path)) throw new Error('permission denied (read-only)');
    if (/[\/\\]/.test(name)) throw new Error('invalid name');
    if (d.children[name]) throw new Error(name + ': already exists');
    d.children[name] = type === 'dir' ? { type: 'dir', children: {} } : { type: 'file', content };
    saveFS();
  }
  function fsWrite(path, content) {
    if (readOnly(path)) throw new Error('permission denied (read-only)');
    const n = getNode(path);
    if (n && n.type === 'dir') throw new Error('is a directory');
    if (n) { n.content = content; saveFS(); } else fsMake(path, 'file', content);
  }
  function fsRemove(path, recursive = false) {
    if (path === '/' || readOnly(path) || path === '/home' || path === HOME) throw new Error('permission denied');
    const [dir, name] = split(path);
    const d = getNode(dir), n = d && d.children[name];
    if (!n) throw new Error('no such file or directory');
    if (n.type === 'dir' && Object.keys(n.children).length && !recursive) throw new Error('directory not empty (use rm -r)');
    delete d.children[name];
    saveFS();
  }
  function kindOf(name, n) {
    if (n.type === 'dir') return 'folder';
    const e = ext(name);
    if (['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return 'image';
    if (e === 'url') return 'link';
    if (e === 'exe') return 'exe';
    return 'text';
  }
  const listDir = n => Object.entries(n.children).sort(([a, x], [b, y]) =>
    (x.type === y.type ? 0 : x.type === 'dir' ? -1 : 1) || a.localeCompare(b));

  /* flags (game progress) — shared with sites.js through localStorage */
  const flags = store.get('neon.flags', {});
  const setFlag = (k, v = true) => { flags[k] = v; store.set('neon.flags', flags); };

  /* ================= SETTINGS ================= */
  const S = Object.assign({ accent: '#fcee0a', scan: true, flicker: false, boot: true }, store.get('neon.settings', {}));
  function applySettings() {
    document.documentElement.style.setProperty('--accent', S.accent);
    document.body.classList.toggle('no-scan', !S.scan);
    document.body.classList.toggle('flicker', S.flicker);
    store.set('neon.settings', S);
  }

  /* ================= TOASTS ================= */
  function toast(title, msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${esc(title)}</b>${esc(msg)}`;
    $('#toasts').append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ================= WINDOW MANAGER ================= */
  const WM = { z: 10, n: 0, wins: new Map() };

  function createWindow({ title, icon = 'text', w = 640, h = 440, onClose }) {
    const id = 'w' + (++WM.n);
    const el = document.createElement('section');
    el.className = 'win';
    const area = $('#windows').getBoundingClientRect();
    w = Math.min(w, area.width - 16); h = Math.min(h, area.height - 16);
    const off = (WM.n % 7) * 28;
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el.style.left = Math.max(8, Math.min(area.width - w - 8, (area.width - w) / 2 - 90 + off)) + 'px';
    el.style.top = Math.max(8, Math.min(area.height - h - 8, (area.height - h) / 2 - 50 + off)) + 'px';
    el.innerHTML = `<header class="titlebar"><span class="t-icon">${I[icon] || I.text}</span><span class="title"></span>
      <button class="wbtn" data-a="min" aria-label="Minimize">_</button><button class="wbtn" data-a="max" aria-label="Maximize">□</button>
      <button class="wbtn x" data-a="close" aria-label="Close">✕</button></header><div class="win-body"></div>`;
    $('#windows').append(el);

    const task = document.createElement('button');
    task.className = 'task';
    task.innerHTML = `${I[icon] || I.text}<span></span>`;
    $('#tasks').append(task);

    const win = {
      id, el, task, body: el.querySelector('.win-body'), cleanups: [],
      setTitle(t) { el.querySelector('.title').textContent = t; task.querySelector('span').textContent = t; task.title = t; },
      focus() { focusWin(win); },
      close() {
        el.remove(); task.remove(); WM.wins.delete(id);
        win.cleanups.forEach(fn => fn()); onClose && onClose();
        const top = [...WM.wins.values()].filter(x => !x.el.classList.contains('min')).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
        top && focusWin(top);
      },
      minimize() { el.classList.add('min'); task.classList.add('minimized'); el.classList.remove('focused'); task.classList.remove('active'); },
      toggleMax() { el.classList.toggle('max'); },
    };
    win.setTitle(title);
    WM.wins.set(id, win);

    el.addEventListener('pointerdown', () => focusWin(win), true);
    el.querySelector('[data-a=min]').onclick = () => win.minimize();
    el.querySelector('[data-a=max]').onclick = () => win.toggleMax();
    el.querySelector('[data-a=close]').onclick = () => win.close();
    task.onclick = () => {
      if (el.classList.contains('min')) { el.classList.remove('min'); task.classList.remove('minimized'); focusWin(win); }
      else if (el.classList.contains('focused')) win.minimize();
      else focusWin(win);
    };

    // drag by title bar
    const bar = el.querySelector('.titlebar');
    bar.addEventListener('dblclick', e => { if (!e.target.closest('.wbtn')) win.toggleMax(); });
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.wbtn') || el.classList.contains('max') || innerWidth <= 700) return;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      bar.setPointerCapture(e.pointerId);
      const move = ev => {
        const a = $('#windows').getBoundingClientRect();
        el.style.left = Math.min(a.width - 80, Math.max(80 - el.offsetWidth, ox + ev.clientX - sx)) + 'px';
        el.style.top = Math.min(a.height - 34, Math.max(0, oy + ev.clientY - sy)) + 'px';
      };
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
    });

    focusWin(win);
    return win;
  }
  function focusWin(win) {
    WM.wins.forEach(w => { w.el.classList.remove('focused'); w.task.classList.remove('active'); });
    win.el.style.zIndex = ++WM.z;
    win.el.classList.add('focused'); win.task.classList.add('active');
    win.el.classList.remove('min'); win.task.classList.remove('minimized');
  }

  // In-window dialog (prompt / confirm)
  function ask(win, { label, value = '', input = true, ok = 'OK' }) {
    return new Promise(res => {
      const ov = document.createElement('div');
      ov.className = 'modal';
      ov.innerHTML = `<form class="modal-box"><label>${esc(label)}</label>${input ? `<input value="${esc(value)}" spellcheck="false" autocomplete="off">` : ''}
        <div class="modal-btns"><button type="button" class="btn" data-a="cancel">Cancel</button><button class="btn primary">${esc(ok)}</button></div></form>`;
      win.el.append(ov);
      const inp = ov.querySelector('input');
      setTimeout(() => { if (inp) { inp.focus(); const dot = value.lastIndexOf('.'); inp.setSelectionRange(0, dot > 0 ? dot : value.length); } else ov.querySelector('.primary').focus(); });
      const done = v => { ov.remove(); res(v); };
      ov.querySelector('form').onsubmit = e => { e.preventDefault(); done(input ? inp.value.trim() || null : true); };
      ov.querySelector('[data-a=cancel]').onclick = () => done(null);
      ov.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } });
    });
  }

  /* ================= OPEN ================= */
  function openPath(path) {
    const n = getNode(path);
    if (!n) return toast('Error', 'File not found: ' + path);
    const k = kindOf(baseName(path), n);
    if (k === 'folder') return Apps.files(path);
    if (k === 'image') return Apps.image(path);
    if (k === 'link') return Apps.browser(n.content.trim());
    if (k === 'exe') return Apps.exe(path);
    return Apps.notepad(path);
  }

  /* ================= APPS ================= */
  const Apps = {};

  /* ---------- Files ---------- */
  Apps.files = (start = HOME) => {
    const win = createWindow({ title: 'Files', icon: 'folder', w: 760, h: 480 });
    let cwd = getNode(start)?.type === 'dir' ? start : HOME, hist = [cwd], hi = 0, sel = null;
    const places = [['Home', HOME], ['Desktop', HOME + '/Desktop'], ['Documents', HOME + '/Documents'], ['Pictures', HOME + '/Pictures'],
      ['Music', HOME + '/Music'], ['Downloads', HOME + '/Downloads'], ['System', '/system'], ['Net', '/net'], ['Root /', '/']];
    win.body.innerHTML = `<div class="explorer">
      <div class="bar"><button class="btn" data-a="back" title="Back">◀</button><button class="btn" data-a="fwd" title="Forward">▶</button>
      <button class="btn" data-a="up" title="Up">▲</button><input class="path" spellcheck="false">
      <button class="btn" data-a="newf">+ File</button><button class="btn" data-a="newd">+ Dir</button>
      <button class="btn" data-a="ren">Rename</button><button class="btn" data-a="del">Delete</button></div>
      <div class="ex-main"><nav class="ex-side"><h4>PLACES</h4>${places.map(([t, p]) => `<button data-p="${p}">${t}</button>`).join('')}</nav>
      <div class="ex-grid" tabindex="0"></div></div><div class="ex-status"><span class="st-l"></span><span class="st-r"></span></div></div>`;
    const grid = $('.ex-grid', win.body), pathIn = $('.path', win.body);

    function render() {
      let n = getNode(cwd);
      if (!n || n.type !== 'dir') { cwd = HOME; n = getNode(cwd); }
      win.setTitle('Files — ' + pretty(cwd));
      pathIn.value = cwd;
      const items = listDir(n);
      grid.innerHTML = items.length ? items.map(([name, c]) => {
        const k = kindOf(name, c);
        return `<button class="icon ${sel === name ? 'sel' : ''}" data-name="${esc(name)}"><span class="glyph k-${k}">${I[k]}</span><span>${esc(name)}</span></button>`;
      }).join('') : '<div class="ex-empty">// empty directory</div>';
      $('.st-l', win.body).textContent = `${items.length} item${items.length === 1 ? '' : 's'}${readOnly(cwd) ? ' · read-only' : ''}`;
      $('.st-r', win.body).textContent = sel ? sel : '';
      $('[data-a=back]', win.body).disabled = hi === 0;
      $('[data-a=fwd]', win.body).disabled = hi >= hist.length - 1;
      $('[data-a=up]', win.body).disabled = cwd === '/';
      const ro = readOnly(cwd);
      ['newf', 'newd'].forEach(a => $(`[data-a=${a}]`, win.body).disabled = ro);
      ['ren', 'del'].forEach(a => $(`[data-a=${a}]`, win.body).disabled = ro || !sel);
      win.body.querySelectorAll('.ex-side button').forEach(b => b.classList.toggle('on', b.dataset.p === cwd));
    }
    function go(p, push = true) {
      const n = getNode(p);
      if (!n) return toast('Files', 'No such directory: ' + p);
      if (n.type !== 'dir') return openPath(p);
      cwd = p; sel = null;
      if (push) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; }
      render();
    }
    const full = name => (cwd === '/' ? '' : cwd) + '/' + name;

    grid.addEventListener('click', e => {
      const it = e.target.closest('.icon');
      if (!it) { sel = null; return render(); }
      if (touch && sel === it.dataset.name) return go(full(it.dataset.name));
      sel = it.dataset.name; render();
    });
    grid.addEventListener('dblclick', e => { const it = e.target.closest('.icon'); if (it) go(full(it.dataset.name)); });
    grid.addEventListener('keydown', e => {
      if (e.key === 'Enter' && sel) go(full(sel));
      if (e.key === 'Delete' && sel) $('[data-a=del]', win.body).click();
      if (e.key === 'Backspace' && cwd !== '/') go(split(cwd)[0]);
    });
    $('.ex-side', win.body).addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) go(b.dataset.p); });
    pathIn.addEventListener('keydown', e => { if (e.key === 'Enter') go(norm(pathIn.value, cwd)); });

    win.body.querySelector('.bar').addEventListener('click', async e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      try {
        if (a === 'back' && hi > 0) go(hist[--hi], false);
        else if (a === 'fwd' && hi < hist.length - 1) go(hist[++hi], false);
        else if (a === 'up') go(split(cwd)[0]);
        else if (a === 'newf') { const n = await ask(win, { label: 'New file name', value: 'untitled.txt', ok: 'Create' }); if (n) { fsMake(full(n), 'file'); sel = n; render(); } }
        else if (a === 'newd') { const n = await ask(win, { label: 'New folder name', value: 'New Folder', ok: 'Create' }); if (n) { fsMake(full(n), 'dir'); sel = n; render(); } }
        else if (a === 'ren' && sel) {
          const n = await ask(win, { label: 'Rename to', value: sel, ok: 'Rename' });
          if (n && n !== sel) {
            const d = getNode(cwd);
            if (d.children[n]) throw new Error(n + ' already exists');
            if (/[\/\\]/.test(n)) throw new Error('invalid name');
            d.children[n] = d.children[sel]; delete d.children[sel]; sel = n; saveFS();
          }
        }
        else if (a === 'del' && sel) {
          const ok = await ask(win, { label: `Delete "${sel}"?`, input: false, ok: 'Delete' });
          if (ok) { fsRemove(full(sel), true); sel = null; render(); }
        }
      } catch (err) { toast('Files', err.message); }
    });

    fsListeners.add(render);
    win.cleanups.push(() => fsListeners.delete(render));
    render();
    return win;
  };

  /* ---------- Notepad ---------- */
  Apps.notepad = (path = null) => {
    const win = createWindow({ title: 'Notepad', icon: 'note', w: 640, h: 460 });
    const n = path ? getNode(path) : null;
    let dirty = false;
    win.body.innerHTML = `<div class="notepad"><div class="bar"><button class="btn" data-a="save">Save</button>
      <button class="btn" data-a="saveas">Save as</button><span class="np-status"></span></div>
      <textarea spellcheck="false"></textarea></div>`;
    const ta = $('textarea', win.body), st = $('.np-status', win.body);
    ta.value = n ? n.content : '';
    const title = () => win.setTitle((dirty ? '● ' : '') + (path ? baseName(path) : 'Untitled') + ' — Notepad');
    const status = () => { st.textContent = `${path ? pretty(path) : 'unsaved'}${path && readOnly(path) ? ' · READ-ONLY' : ''} · ${ta.value.length} chars`; };
    title(); status();
    ta.addEventListener('input', () => { if (!dirty) { dirty = true; title(); } status(); });

    async function save(as) {
      try {
        if (!path || as || readOnly(path)) {
          const name = await ask(win, { label: 'Save as (path)', value: path && !readOnly(path) ? pretty(path) : '~/Documents/untitled.txt', ok: 'Save' });
          if (!name) return;
          path = norm(name);
        }
        fsWrite(path, ta.value);
        dirty = false; title(); status();
        toast('Saved', pretty(path));
      } catch (err) { toast('Notepad', err.message); }
    }
    $('[data-a=save]', win.body).onclick = () => save(false);
    $('[data-a=saveas]', win.body).onclick = () => save(true);
    ta.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(false); }
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); }
    });
    setTimeout(() => ta.focus());
    return win;
  };

  /* ---------- Image viewer ---------- */
  Apps.image = path => {
    const n = getNode(path);
    const win = createWindow({ title: baseName(path) + ' — Viewer', icon: 'image', w: 720, h: 480 });
    const src = n.content.trim().startsWith('<svg') ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(n.content) : n.content.trim();
    win.body.innerHTML = `<div class="imgview"><img alt="${esc(baseName(path))}" src="${esc(src)}"></div>`;
    return win;
  };

  /* ---------- Browser ---------- */
  Apps.browser = (startUrl = 'netsearch.nc') => {
    const win = createWindow({ title: 'NetWalker', icon: 'globe', w: 960, h: 620 });
    let hist = [], hi = -1, current = null;
    win.body.innerHTML = `<div class="browser">
      <div class="bar"><button class="btn" data-a="back" title="Back">◀</button><button class="btn" data-a="fwd" title="Forward">▶</button>
      <button class="btn" data-a="reload" title="Reload">⟳</button><button class="btn" data-a="home" title="Home">⌂</button>
      <span class="lock">⛨</span><input class="path" spellcheck="false" autocomplete="off"><button class="btn" data-a="go">Go</button></div>
      <div class="bookmarks">${window.SITE_INDEX.map(s => `<button data-href="${s.url}">${s.title}</button>`).join('')}</div>
      <div class="vp-wrap"><div class="loadbar"></div><div class="vp"></div></div></div>`;
    const vp = $('.vp', win.body), urlIn = $('.path', win.body), lb = $('.loadbar', win.body);

    const parse = raw => {
      let s = String(raw || '').trim().replace(/^[a-z]+:\/\//i, '');
      if (!s) s = 'netsearch.nc';
      if (!/^[\w.-]+\.[a-z]{2,}/i.test(s)) return parse('netsearch.nc/?q=' + encodeURIComponent(s)); // treat as search
      const m = s.match(/^([^/?#]+)([^?#]*)(\?[^#]*)?/);
      const host = m[1].toLowerCase(), path = m[2] || '/', query = new URLSearchParams(m[3] || '');
      const url = host + (path === '/' ? '' : path) + (m[3] || '');
      return { host, path, query, url };
    };
    function render(u) {
      const site = window.SITES[u.host];
      let page = site && site.render(u.path, u.query);
      if (!page) page = { title: 'Node not found', html: `<div class="s-404"><h1>404</h1><p>NODE "${esc(u.url)}" DID NOT RESPOND</p>
        <p>The NightNet only knows a few nodes. Try <a data-href="netsearch.nc">NetSearch</a>.</p></div>` };
      vp.innerHTML = page.html;
      win.setTitle(page.title + ' — NetWalker');
      urlIn.value = 'net://' + u.url;
      current = u;
    }
    function go(raw, push = true) {
      const u = parse(raw);
      if (push) { hist = hist.slice(0, hi + 1); hist.push(u.url); hi = hist.length - 1; }
      lb.classList.remove('go'); void lb.offsetWidth; lb.classList.add('go');
      vp.innerHTML = '';
      setTimeout(() => { render(u); vp.scrollTop = 0; }, 180 + Math.random() * 220);
      $('[data-a=back]', win.body).disabled = hi <= 0;
      $('[data-a=fwd]', win.body).disabled = hi >= hist.length - 1;
    }
    win.go = go;

    win.body.querySelector('.bar').addEventListener('click', e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'back' && hi > 0) go(hist[--hi], false);
      else if (a === 'fwd' && hi < hist.length - 1) go(hist[++hi], false);
      else if (a === 'reload' && current) go(current.url, false);
      else if (a === 'home') go('netsearch.nc');
      else if (a === 'go') go(urlIn.value);
    });
    urlIn.addEventListener('keydown', e => { if (e.key === 'Enter') go(urlIn.value); });
    urlIn.addEventListener('focus', () => urlIn.select());
    $('.bookmarks', win.body).addEventListener('click', e => { const b = e.target.closest('[data-href]'); if (b) go(b.dataset.href); });

    vp.addEventListener('click', e => {
      const site = current && window.SITES[current.host];
      if (site && site.onClick && site.onClick(e.target, () => render(current))) return;
      const dl = e.target.closest('[data-download]');
      if (dl) {
        const name = dl.dataset.download, content = window.SITE_DOWNLOADS[name] || '';
        const target = HOME + '/Downloads/' + name;
        try { fsWrite(target, content); toast('Download complete', '~/Downloads/' + name); }
        catch (err) { toast('Download failed', err.message); }
        return;
      }
      const link = e.target.closest('[data-href]');
      if (link) { e.preventDefault(); go(link.dataset.href); }
    });
    vp.addEventListener('submit', e => {
      const f = e.target.closest('[data-search]');
      if (!f) return;
      e.preventDefault();
      go('netsearch.nc/?q=' + encodeURIComponent(new FormData(f).get('q') || ''));
    });

    go(startUrl);
    return win;
  };

  /* ---------- Terminal ---------- */
  Apps.terminal = () => {
    const win = createWindow({ title: 'Terminal', icon: 'term', w: 700, h: 440 });
    let cwd = HOME;
    const history = store.get('neon.history', []);
    let hp = history.length;
    win.body.innerHTML = `<div class="term"><div class="term-out"></div><div class="term-line"><span class="ps"></span>
      <input class="term-in" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Command"></div></div>`;
    const out = $('.term-out', win.body), inp = $('.term-in', win.body), ps = $('.ps', win.body);
    const prompt = () => `runner@neon:${pretty(cwd)}$`;
    const print = (html = '') => { out.insertAdjacentHTML('beforeend', html + '\n'); win.body.scrollTop = win.body.scrollHeight; };
    const err = m => print(`<span class="t-err">${esc(m)}</span>`);
    const setPs = () => { ps.textContent = prompt(); win.setTitle('Terminal — ' + pretty(cwd)); };
    win.body.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });

    const fmtName = (name, n) => {
      const k = kindOf(name, n);
      return k === 'folder' ? `<span class="t-dir">${esc(name)}/</span>` : k === 'exe' ? `<span class="t-exe">${esc(name)}*</span>` : esc(name);
    };
    const date2077 = () => { const d = new Date(); d.setFullYear(2077); return d.toString().replace(/ GMT.*$/, ''); };

    const C = {
      help: () => print(`<span class="t-acc">NEON SHELL — available commands</span>
  ls [-a] [dir]      list directory        cd [dir]         change directory
  pwd                print working dir     cat &lt;file&gt;       print file
  tree [dir]         show directory tree   open &lt;path|url&gt;  open with default app
  mkdir &lt;dir&gt;        create directory      touch &lt;file&gt;     create empty file
  rm [-r] &lt;path&gt;     remove                mv &lt;src&gt; &lt;dst&gt;    move / rename
  echo &lt;txt&gt; [&gt; f]   print or write file   edit &lt;file&gt;      open in Notepad
  browse [url]       open NetWalker        files [dir]      open file manager
  netscan            scan the NightNet     neofetch         system info
  whoami · date · uname · history · clear · reboot · exit`),
      ls: args => {
        const all = args.includes('-a');
        const p = norm(args.find(a => !a.startsWith('-')) || '.', cwd);
        const n = getNode(p);
        if (!n) return err(`ls: ${p}: no such file or directory`);
        if (n.type !== 'dir') return print(esc(baseName(p)));
        const items = listDir(n).filter(([k]) => all || !k.startsWith('.'));
        print(items.map(([k, v]) => fmtName(k, v)).join('   ') || '<span class="t-dim">(empty)</span>');
      },
      cd: args => {
        const p = norm(args[0] || '~', cwd), n = getNode(p);
        if (!n) return err(`cd: ${args[0]}: no such directory`);
        if (n.type !== 'dir') return err(`cd: ${args[0]}: not a directory`);
        cwd = p;
      },
      pwd: () => print(cwd),
      cat: args => {
        if (!args.length) return err('cat: missing file');
        args.forEach(a => {
          const p = norm(a, cwd), n = getNode(p);
          if (!n) return err(`cat: ${a}: no such file`);
          if (n.type === 'dir') return err(`cat: ${a}: is a directory`);
          if (kindOf(p, n) === 'image') return print('<span class="t-dim">[binary image data — use: open ' + esc(a) + ']</span>');
          print(esc(n.content));
        });
      },
      tree: args => {
        const p = norm(args[0] || '.', cwd), n = getNode(p);
        if (!n || n.type !== 'dir') return err('tree: not a directory');
        const lines = [`<span class="t-dir">${esc(pretty(p))}</span>`];
        const walk = (node, pre) => listDir(node).forEach(([k, v], i, arr) => {
          const last = i === arr.length - 1;
          lines.push(pre + (last ? '└── ' : '├── ') + fmtName(k, v));
          if (v.type === 'dir') walk(v, pre + (last ? '    ' : '│   '));
        });
        walk(n, '');
        print(lines.join('\n'));
      },
      mkdir: args => args.forEach(a => fsMake(norm(a, cwd), 'dir')),
      touch: args => args.forEach(a => { const p = norm(a, cwd); if (!getNode(p)) fsMake(p, 'file'); }),
      rm: args => {
        const r = args.some(a => /^-r|^-rf|^-fr/.test(a));
        const targets = args.filter(a => !a.startsWith('-'));
        if (!targets.length) return err('rm: missing operand');
        targets.forEach(a => fsRemove(norm(a, cwd), r));
      },
      mv: args => {
        if (args.length < 2) return err('mv: usage: mv <src> <dst>');
        const src = norm(args[0], cwd); let dst = norm(args[1], cwd);
        const n = getNode(src);
        if (!n) return err('mv: source not found');
        if (readOnly(src)) return err('mv: permission denied');
        if (getNode(dst)?.type === 'dir') dst = (dst === '/' ? '' : dst) + '/' + baseName(src);
        if (dst.startsWith(src + '/')) return err('mv: cannot move a directory into itself');
        const copy = clone(n);
        fsRemove(src, true);
        try { const [d, name] = split(dst); const dn = getNode(d); if (!dn || dn.type !== 'dir' || dn.children[name]) throw new Error('bad destination'); dn.children[name] = copy; saveFS(); }
        catch (e) { const [d, name] = split(src); getNode(d).children[name] = copy; saveFS(); throw new Error('mv: ' + e.message); }
      },
      echo: (args, raw) => {
        const m = raw.match(/^echo\s+([\s\S]*?)\s*(>>?)\s*(\S+)\s*$/);
        const strip = s => s.replace(/^(["'])([\s\S]*)\1$/, '$2');
        if (m) {
          const p = norm(m[3], cwd), old = getNode(p);
          fsWrite(p, (m[2] === '>>' && old ? old.content + '\n' : '') + strip(m[1]));
        } else print(esc(strip(raw.replace(/^echo\s?/, ''))));
      },
      edit: args => { if (!args[0]) return Apps.notepad(); const p = norm(args[0], cwd); getNode(p) ? Apps.notepad(p) : (fsMake(p, 'file'), Apps.notepad(p)); },
      open: args => {
        if (!args[0]) return err('open: missing operand');
        const p = norm(args[0], cwd);
        if (getNode(p)) return openPath(p);
        if (Apps[args[0]]) return Apps[args[0]]();
        if (/\.[a-z]{2,}/i.test(args[0])) return Apps.browser(args[0]);
        err(`open: ${args[0]}: not found`);
      },
      browse: args => Apps.browser(args[0]),
      files: args => Apps.files(args[0] ? norm(args[0], cwd) : cwd),
      whoami: () => print('runner'),
      date: () => print(date2077()),
      uname: args => print(args.includes('-a') ? 'NEON 7.7.2-neural #1 SMP PREEMPT synapse-x x86_128 NEON//OS' : 'NEON'),
      history: () => print(history.map((h, i) => `${String(i + 1).padStart(4)}  ${esc(h)}`).join('\n')),
      clear: () => { out.innerHTML = ''; },
      exit: () => win.close(),
      reboot: () => reboot(),
      sudo: () => err('runner is not in the sudoers file. This incident will be reported to Helix Dynamics.'),
      neofetch: () => {
        const up = Math.floor((Date.now() - BOOTED) / 1000);
        print(`<span class="t-acc">   ███╗   ██╗</span>   <span class="t-acc">runner</span>@<span class="t-acc">neon</span>
<span class="t-acc">   ████╗  ██║</span>   ─────────────
<span class="t-acc">   ██╔██╗ ██║</span>   <span class="t-acc">OS:</span> NEON//OS 7.7.2
<span class="t-acc">   ██║╚██╗██║</span>   <span class="t-acc">Kernel:</span> 7.7.2-neural
<span class="t-acc">   ██║ ╚████║</span>   <span class="t-acc">Uptime:</span> ${Math.floor(up / 60)}m ${up % 60}s
<span class="t-acc">   ╚═╝  ╚═══╝</span>   <span class="t-acc">Shell:</span> nsh
                 <span class="t-acc">CPU:</span> Synapse-X 16c @ 9.2GHz
                 <span class="t-acc">Memory:</span> ${(8 + Math.random() * 6).toFixed(1)}G / 64G
                 <span class="t-acc">Display:</span> ${innerWidth}x${innerHeight} · ${navigator.language}
                 <span class="t-acc">ICE:</span> <span class="t-ok">ACTIVE</span>   <span class="t-acc">Link:</span> <span class="t-ok">STABLE</span>`);
      },
      netscan: () => {
        print('<span class="t-dim">scanning NightNet relays...</span>');
        const nodes = Object.keys(window.SITES);
        nodes.forEach((h, i) => setTimeout(() => print(`  <span class="t-ok">[+]</span> ${h.padEnd(22)} ${(10 + Math.random() * 90).toFixed(0)}ms  ${h.endsWith('.void') ? '<span class="t-err">UNTRUSTED</span>' : 'ok'}`), 200 * (i + 1)));
        setTimeout(() => print(`<span class="t-dim">${nodes.length} nodes found. try: browse &lt;node&gt;</span>`), 200 * (nodes.length + 1));
      },
    };

    function run(raw) {
      print(`<span class="ps">${esc(prompt())}</span> ${esc(raw)}`);
      const line = raw.trim();
      if (!line) return;
      history.push(line); if (history.length > 200) history.shift(); store.set('neon.history', history); hp = history.length;
      const args = line.match(/"[^"]*"|'[^']*'|\S+/g).map(a => a.replace(/^(["'])(.*)\1$/, '$2'));
      const cmd = args.shift();
      if (!C[cmd]) return err(`nsh: command not found: ${cmd}  (type 'help')`);
      try { C[cmd](args, line); } catch (e) { err(e.message); }
      setPs();
    }

    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { run(inp.value); inp.value = ''; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hp > 0) inp.value = history[--hp]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); hp = Math.min(history.length, hp + 1); inp.value = history[hp] || ''; }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const parts = inp.value.split(' '), last = parts.pop();
        const slash = last.lastIndexOf('/');
        const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '', frag = slash >= 0 ? last.slice(slash + 1) : last;
        let pool;
        if (!parts.length) pool = Object.keys(C);
        else { const d = getNode(norm(dirPart || '.', cwd)); pool = d && d.type === 'dir' ? Object.keys(d.children).map(k => d.children[k].type === 'dir' ? k + '/' : k) : []; }
        const hits = pool.filter(k => k.startsWith(frag));
        if (hits.length === 1) inp.value = [...parts, dirPart + hits[0] + (parts.length || hits[0].endsWith('/') ? '' : ' ')].join(' ');
        else if (hits.length > 1) print(`<span class="ps">${esc(prompt())}</span> ${esc(inp.value)}\n${hits.map(esc).join('   ')}`);
      }
    });

    print(`<span class="t-acc">NEON//OS shell</span> <span class="t-dim">— type 'help' to list commands</span>`);
    setPs();
    setTimeout(() => inp.focus());
    return win;
  };

  /* ---------- Executables ---------- */
  Apps.exe = path => {
    const n = getNode(path), name = baseName(path);
    const win = createWindow({ title: name, icon: 'exe', w: 600, h: 400 });
    if (!/ICEBREAKER/.test(n.content)) {
      win.body.innerHTML = `<div class="breach"><pre>${esc(name)}: execution failed\n\n${esc(n.content)}\n\nerror 0x5: ACCESS_DENIED</pre></div>`;
      return win;
    }
    win.body.innerHTML = `<div class="breach"><pre></pre><div class="bbar"><span></span></div></div>`;
    const pre = $('pre', win.body), bar = $('.bbar span', win.body);
    const hex = () => Array.from({ length: 6 }, () => ['1C', '55', 'BD', 'E9', '7A', 'FF'][Math.random() * 6 | 0]).join(' ');
    const steps = [
      '> ICEBREAKER v3.1 // echo', '> target: helix-dynamics.corp', '> resolving ICE topology...',
      '  ICE class 3 · BLACK · 4 layers', ...Array.from({ length: 6 }, (_, i) => `  [layer ${(i >> 1) + 1}] injecting ${hex()}`),
      '> layer 4 bypassed', '> extracting lantern_dump...', '> writing ~/Documents/lantern_dump.txt', '> covering tracks... done',
    ];
    let i = 0;
    const timers = [];
    win.cleanups.push(() => timers.forEach(clearTimeout));
    const tick = () => {
      if (i < steps.length) {
        pre.textContent += steps[i++] + '\n';
        bar.style.width = (i / steps.length * 100) + '%';
        pre.scrollTop = pre.scrollHeight;
        timers.push(setTimeout(tick, 220 + Math.random() * 260));
      } else {
        setFlag('helix');
        try { fsWrite(HOME + '/Documents/lantern_dump.txt', `LANTERN DUMP (partial)\n----------------------\nAuth token captured. Helix internal page should now accept you.\n\n→ open NetWalker and go to: helix-dynamics.corp/internal`); } catch { }
        pre.insertAdjacentHTML('beforeend', '\n<span class="done">ACCESS GRANTED</span>\n\n<span style="color:#ccc">visit helix-dynamics.corp/internal</span>');
        toast('Breach complete', 'lantern_dump.txt saved to Documents');
      }
    };
    tick();
    return win;
  };

  /* ---------- Settings ---------- */
  Apps.settings = () => {
    const win = createWindow({ title: 'Settings', icon: 'gear', w: 480, h: 560 });
    const colors = ['#fcee0a', '#00f0ff', '#ff003c', '#39ff14', '#c77dff', '#ff8a00'];
    const render = () => {
      win.body.innerHTML = `<div class="settings">
        <div><h3>ACCENT</h3><div class="swatches">${colors.map(c => `<button class="swatch ${S.accent === c ? 'on' : ''}" style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}</div></div>
        <div><h3>DISPLAY</h3>
          <label class="toggle">CRT scanlines <input type="checkbox" data-k="scan" ${S.scan ? 'checked' : ''}></label>
          <label class="toggle">Screen flicker <input type="checkbox" data-k="flicker" ${S.flicker ? 'checked' : ''}></label>
          <label class="toggle">Boot animation <input type="checkbox" data-k="boot" ${S.boot ? 'checked' : ''}></label></div>
        <div><h3>STORAGE</h3><p class="sysinfo" style="margin-bottom:10px">Files you create are saved in this browser only.</p>
          <button class="btn" data-a="reset">Reset filesystem</button></div>
        <div><h3>SYSTEM</h3><div class="sysinfo">
          OS <b>NEON//OS 7.7.2</b><br>Kernel <b>7.7.2-neural</b><br>User <b>runner</b><br>
          Screen <b>${innerWidth}×${innerHeight}</b><br>Mission <b>${flags.helix ? 'ICE breached' : 'in progress'}</b></div></div></div>`;
    };
    win.body.addEventListener('click', async e => {
      const c = e.target.closest('[data-c]');
      if (c) { S.accent = c.dataset.c; applySettings(); render(); }
      if (e.target.closest('[data-a=reset]')) {
        if (await ask(win, { label: 'Reset all files and progress?', input: false, ok: 'Reset' })) {
          FS = clone(window.DEFAULT_FS); Object.keys(flags).forEach(k => delete flags[k]); store.del('neon.flags');
          saveFS(); toast('Filesystem', 'Restored to factory state'); render();
        }
      }
    });
    win.body.addEventListener('change', e => { const k = e.target.dataset.k; if (k) { S[k] = e.target.checked; applySettings(); } });
    render();
    return win;
  };

  /* ================= DESKTOP ================= */
  const APPS = [
    { id: 'files', name: 'Files', icon: 'folder', run: () => Apps.files() },
    { id: 'terminal', name: 'Terminal', icon: 'term', run: () => Apps.terminal() },
    { id: 'browser', name: 'NetWalker', icon: 'globe', run: () => Apps.browser() },
    { id: 'notepad', name: 'Notepad', icon: 'note', run: () => Apps.notepad() },
    { id: 'settings', name: 'Settings', icon: 'gear', run: () => Apps.settings() },
  ];

  function renderIcons() {
    const desk = getNode(HOME + '/Desktop');
    const files = desk && desk.type === 'dir' ? listDir(desk) : [];
    $('#icons').innerHTML =
      APPS.map(a => `<button class="icon" data-app="${a.id}"><span class="glyph">${I[a.icon]}</span><span>${a.name}</span></button>`).join('') +
      files.map(([name, n]) => { const k = kindOf(name, n); return `<button class="icon" data-file="${esc(name)}"><span class="glyph k-${k}">${I[k]}</span><span>${esc(name)}</span></button>`; }).join('');
  }
  function activateIcon(el) {
    if (el.dataset.app) APPS.find(a => a.id === el.dataset.app).run();
    else openPath(HOME + '/Desktop/' + el.dataset.file);
  }
  $('#icons').addEventListener('click', e => {
    const el = e.target.closest('.icon');
    document.querySelectorAll('#icons .icon.sel').forEach(x => x.classList.remove('sel'));
    if (!el) return;
    if (touch) return activateIcon(el);
    el.classList.add('sel');
  });
  $('#icons').addEventListener('dblclick', e => { const el = e.target.closest('.icon'); if (el) activateIcon(el); });
  $('#icons').addEventListener('keydown', e => { const el = e.target.closest('.icon'); if (el && e.key === 'Enter') activateIcon(el); });
  fsListeners.add(renderIcons);

  // Start menu
  const sm = $('#startmenu'), sb = $('#startbtn');
  sm.innerHTML = `<div class="sm-head"><b>NEON//OS</b><small>runner@neon · node 0x7F</small></div><div class="sm-list">
    ${APPS.map(a => `<button class="sm-item" data-app="${a.id}">${I[a.icon]}${a.name}</button>`).join('')}
    <div class="sm-sep"></div>
    <button class="sm-item" data-p="${HOME}/Documents">${I.folder}Documents</button>
    <button class="sm-item" data-p="${HOME}/Pictures">${I.image}Pictures</button>
    <div class="sm-sep"></div>
    <button class="sm-item" data-a="reboot">${I.reboot}Reboot</button>
    <button class="sm-item" data-a="off">${I.power}Shut down</button></div>`;
  const toggleSM = show => { sm.hidden = !(show ?? sm.hidden); sb.classList.toggle('on', !sm.hidden); };
  sb.onclick = e => { e.stopPropagation(); toggleSM(); };
  sm.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    toggleSM(false);
    if (b.dataset.app) APPS.find(a => a.id === b.dataset.app).run();
    else if (b.dataset.p) Apps.files(b.dataset.p);
    else if (b.dataset.a === 'reboot') reboot();
    else if (b.dataset.a === 'off') shutdown();
  });
  document.addEventListener('pointerdown', e => { if (!sm.hidden && !e.target.closest('#startmenu,#startbtn')) toggleSM(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sm.hidden) toggleSM(false); });

  // Clock
  function tickClock() {
    const d = new Date();
    $('#clock').innerHTML = `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<small>${d.toLocaleDateString([], { day: '2-digit', month: 'short' })} 2077</small>`;
  }
  setInterval(tickClock, 10000);

  /* ================= BOOT ================= */
  let BOOTED = Date.now();
  const BOOT_LINES = [
    ['NEON BIOS v7.7.2 · (c) 2077 Neon Systems', ''], ['CPU: Synapse-X 16 cores @ 9.2GHz', 'ok'], ['Memory test: 65536 MB', 'ok'],
    ['Neural link interface on bus 0x7F', 'ok'], ['Mounting /home/runner', 'ok'], ['Loading ICE firewall (128 rules)', 'ok'],
    ['Checking optic calibration', 'warn'], ['Connecting to NightNet relay', 'ok'], ['Starting window manager', 'ok'], ['Welcome back, runner.', ''],
  ];
  function boot() {
    const bootEl = $('#boot'), log = $('#boot-log'), bar = $('.boot-bar span');
    $('#off').hidden = true; $('#desktop').hidden = true;
    WM.wins.forEach(w => w.close());
    if (!S.boot) return finish();
    bootEl.hidden = false; log.innerHTML = ''; bar.style.width = '0';
    let i = 0, t;
    const step = () => {
      if (i >= BOOT_LINES.length) { t = setTimeout(finish, 450); return; }
      const [txt, st] = BOOT_LINES[i++];
      log.insertAdjacentHTML('beforeend', `${esc(txt)}${st ? ` ... <span class="${st}">${st === 'ok' ? 'OK' : 'WARN'}</span>` : ''}\n`);
      bar.style.width = (i / BOOT_LINES.length * 100) + '%';
      t = setTimeout(step, 140 + Math.random() * 180);
    };
    const skip = () => { clearTimeout(t); finish(); };
    bootEl.onclick = skip;
    document.addEventListener('keydown', skip, { once: true });
    function finish() {
      clearTimeout(t); document.removeEventListener('keydown', skip);
      bootEl.hidden = true; $('#desktop').hidden = false;
      BOOTED = Date.now(); tickClock(); renderIcons();
      if (!store.get('neon.welcomed', false)) { store.set('neon.welcomed', true); setTimeout(() => openPath(HOME + '/Desktop/README.txt'), 250); }
    }
    step();
  }
  function reboot() { boot(); }
  function shutdown() {
    WM.wins.forEach(w => w.close());
    $('#desktop').hidden = true; $('#off').hidden = false;
  }
  $('#power').onclick = boot;

  // Expose a tiny API for tinkering from the dev console
  window.NEON = { Apps, openPath, fs: { get: getNode, write: fsWrite, make: fsMake, remove: fsRemove }, flags };

  applySettings();
  boot();
})();
