# NEON//OS

A cyberpunk web "operating system" in plain HTML, CSS and JavaScript. No build step, no dependencies.

## Features
- Boot sequence, desktop, taskbar, start menu, clock, notifications
- Window manager: drag, resize, minimize, maximize, focus
- Virtual filesystem (folders and files) saved in the browser's localStorage
- **Files**: browse, create, rename and delete files and folders
- **Terminal**: `ls cd pwd cat tree mkdir touch rm mv echo > edit open browse netscan neofetch` with tab completion and history
- **Notepad**: edit text files (Ctrl+S saves)
- **Image viewer** for SVG/PNG/JPG
- **NetWalker browser** with 5 prebuilt sites, back/forward, search, and downloads
- **Settings**: accent colour, scanlines, flicker, boot animation, reset
- A short hidden mission (start with `mission.txt` on the desktop)

## Deploy to GitHub Pages
1. Create a repo and push these files to its root (`index.html` at the top level).
2. Go to **Settings → Pages → Build and deployment**, set Source to *Deploy from a branch*, then pick `main` and `/ (root)`.
3. After about a minute it's live at `https://<user>.github.io/<repo>/`.

Run it locally with `python3 -m http.server`, then open http://localhost:8000.

## Customise
- `js/fs.js`: the default files and folders
- `js/sites.js`: the websites; add an entry to `SITES` to add a site
- `js/os.js`: apps and terminal commands (add to `Apps` or the `C` command table)
- `css/style.css`: the theme; the colours are CSS variables at the top
