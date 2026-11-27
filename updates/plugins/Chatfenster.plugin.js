/**
 * @name Chatfenster
 * @author BOSA
 * @version 1.7.0
 * @description Direktnachrichten in einem eigenen, verschiebbaren Fenster – ohne den Kanal zu wechseln. Links alle Chats, oben Reiter für offene Chats, Nachrichten als Sprechblasen, mit Emojis, GIFs und Stickern. Neue Nachrichten erscheinen als Hinweis über der Sprachverbindung. Öffnen über das Chat-Symbol vor dem Plus im Nachrichtenfeld, per Rechtsklick auf einen Nutzer → „Im Chatfenster öffnen“ oder – wenn in den Einstellungen eingeschaltet – mit Strg + Umschalt + C. Farben passen sich dem aktiven Theme an (im Theme Studio unter Discord → Chatfenster frei einstellbar: Flächen, Sprechblasen, Schrift, Rundung, eigenes Hintergrundbild), Deckkraft über das Zahnrad im Fenster einstellbar; dort passt „An aktuelles Theme anpassen“ die Farben an das Theme an, das gerade in Discord läuft. Mit dem Theme-Studio-Mod ab 1.1 lässt sich das Fenster als eigenes Windows-Fenster herauslösen (z. B. auf den zweiten Bildschirm).
 */

const NAME = "Chatfenster";
const DEFAULTS = {
  notify: true,          // Hinweis bei neuen Nachrichten
  groups: true,          // Gruppen-DMs in der Liste
  tabs: [],              // offene Chats (Kanal-IDs)
  active: null,          // aktiver Chat
  x: null, y: null, w: 760, h: 520,
  opacity: 100,          // Deckkraft der Flächen in %
  blur: true,            // Hintergrund hinter dem Fenster weichzeichnen
  wall: true,            // Hintergrundbild des Themes im Fenster zeigen
  top: false,            // herausgelöstes Fenster immer im Vordergrund
  px: null, py: null, pw: null, ph: null,   // Lage des herausgelösten Fensters
  hotkey: false,         // Strg + Umschalt + C – ab Werk aus (keine Tastenbelegung)
  fit: false,            // Farben vom gerade laufenden Theme übernehmen (statt der Studio-Farben fürs Chatfenster)
};
const POPNAME = "TS_POPOUT_CHATFENSTER";
const MAX_LIST = 100;
const MAX_NOTES = 3;

const ICON = {
  close: "M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.41 6.29 6.3-6.3 6.29 1.42 1.42 6.29-6.3 6.3 6.3 1.41-1.42-6.29-6.29 6.29-6.3z",
  send: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",
  popout: "M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z",
  dock: "M19 5v14H5V5zm0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-8 13h2v-5h3l-4-4-4 4h3z",
  pin: "M16 9V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3",
  gear: "M19.14 12.94a7.1 7.1 0 0 0 .05-.94 7 7 0 0 0-.05-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.47.41l-.36 2.54a7.4 7.4 0 0 0-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58a7 7 0 0 0 0 1.88l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54a7.4 7.4 0 0 0 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61zM12 15.6A3.6 3.6 0 1 1 15.6 12a3.6 3.6 0 0 1-3.6 3.6",
  chat: "M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2",
  emoji: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-3.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M12 18a5.5 5.5 0 0 1-5-3.2h10A5.5 5.5 0 0 1 12 18",
  gif: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m2.5 5A1.5 1.5 0 0 0 5 10.5v3A1.5 1.5 0 0 0 6.5 15h2a1.5 1.5 0 0 0 1.5-1.5V12H7.8v1.2H7v-2.4h3V10.5A1.5 1.5 0 0 0 8.5 9zm4.5 0v6h1.8V9zm3 0v6h1.8v-2.2h2.2V11h-2.2v-.2h2.6V9z",
  sticker: "M5 3h10l6 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m9 1.5V8a2 2 0 0 0 2 2h3.5zM8.5 10a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6m5 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6M8 15a4.5 4.5 0 0 0 8 0z",
};

const CSS = `
#cf-win, #cf-notes {
  /* Farben aus dem Theme (Theme Studio → Reiter „Chatfenster“ schreibt --tscf-*), sonst Discords Farben */
  --cf-accent: var(--tscf-accent, var(--brand-500, var(--brand-experiment, #5865f2)));
  --cf-op: 100%;
  --cf-bg0: var(--tscf-bg, var(--background-primary, var(--bg-base-primary, #313338)));
  --cf-side0: var(--tscf-side, var(--background-secondary, var(--bg-base-secondary, #2b2d31)));
  --cf-head0: var(--tscf-head, var(--background-tertiary, var(--bg-base-tertiary, #1e1f22)));
  --cf-bg: color-mix(in srgb, var(--cf-bg0) var(--cf-op), transparent);
  --cf-side: color-mix(in srgb, var(--cf-side0) var(--cf-op), transparent);
  --cf-head: color-mix(in srgb, var(--cf-head0) var(--cf-op), transparent);
  --cf-float: var(--tscf-note, var(--background-floating, var(--cf-side)));
  --cf-text: var(--tscf-text, var(--text-normal, #dbdee1));
  --cf-muted: var(--tscf-muted, var(--text-muted, #949ba4));
  --cf-head-text: var(--tscf-head-text, var(--header-primary, var(--cf-text)));
  --cf-border: var(--tscf-border, color-mix(in srgb, var(--cf-accent) 45%, transparent));
  --cf-r: var(--tscf-r, 16px);
  --cf-tail: var(--tscf-tail, 4px);
  --cf-line: color-mix(in srgb, var(--cf-text) 12%, transparent);
  font-family: var(--font-primary); color: var(--cf-text);
}
#cf-win { position: fixed; z-index: 1000; display: grid; grid-template-columns: 230px 1fr; min-width: 520px; min-height: 340px;
  background: var(--cf-bg); border: 1px solid var(--cf-border); border-radius: var(--tscf-win-r, 14px);
  box-shadow: 0 14px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.2); overflow: hidden; resize: both; }
#cf-win[hidden] { display: none; }
#cf-win.cf-blur { backdrop-filter: blur(14px) saturate(1.2); }
/* Theme sagt „Kein Bild“: Fenster deckend, nichts von Discord scheint durch */
#cf-win.cf-solid { background: linear-gradient(var(--cf-bg), var(--cf-bg)), var(--tscf-solid, #111214); backdrop-filter: none; }
#cf-win .cf-dot { border-color: var(--cf-side0) !important; }
#cf-win .cf-tab.on { background: var(--cf-bg) !important; }

/* Hintergrundbild des Themes im Fenster (wirkt wie ein Blick durch Discord aufs Bild) */
#cf-win .cf-wall { position: absolute; z-index: 0; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; display: none; background-repeat: no-repeat; }
#cf-win.cf-haswall .cf-wall { display: block; }
#cf-win.cf-haswall { background: transparent; }
#cf-win.cf-haswall .cf-main { background: var(--cf-bg); }
#cf-win .cf-side, #cf-win .cf-main { position: relative; z-index: 1; }

/* Herausgelöst: füllt das eigene Windows-Fenster */
#cf-win.cf-popped { position: static !important; width: 100vw !important; height: 100vh !important; border: 0; border-radius: 0; resize: none; box-shadow: none; min-width: 0; min-height: 0; }
#cf-win.cf-popped [data-drag] { cursor: default; }
#cf-win .cf-pin { display: none !important; }
#cf-win.cf-popped .cf-pin { display: flex !important; }
#cf-win .cf-pin.on { color: var(--cf-accent) !important; }

/* Zahnrad-Menü */
#cf-win .cf-ib, #cf-win .cf-gear { border: 0; background: transparent; color: var(--cf-muted); cursor: pointer; padding: 6px; border-radius: 8px; align-self: center; display: flex; }
#cf-win .cf-ib:hover, #cf-win .cf-gear:hover, #cf-win .cf-gear.on { color: var(--cf-head-text); background: color-mix(in srgb, var(--cf-text) 10%, transparent); }
#cf-win .cf-pop { position: absolute; top: 44px; right: 10px; z-index: 5; width: 250px; padding: 12px 14px; border-radius: 12px;
  background: var(--cf-float); border: 1px solid var(--cf-border); box-shadow: 0 10px 30px rgba(0,0,0,.45);
  display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
#cf-win .cf-pop[hidden] { display: none; }
#cf-win .cf-pop b { color: var(--cf-head-text); }
#cf-win .cf-pop .cf-prow { display: flex; align-items: center; gap: 8px; }
#cf-win .cf-pop input[type=range] { flex: 1; accent-color: var(--cf-accent); cursor: pointer; }
#cf-win .cf-pop .cf-pval { min-width: 38px; text-align: right; color: var(--cf-muted); font-variant-numeric: tabular-nums; }
#cf-win .cf-pop label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
#cf-win .cf-pop input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--cf-accent); margin: 0; }
#cf-win .cf-pop .cf-fitbtn { margin-top: 4px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--cf-accent); background: color-mix(in srgb, var(--cf-accent) 18%, transparent); color: var(--cf-head-text); font: inherit; font-weight: 600; cursor: pointer; text-align: center; }
#cf-win .cf-pop .cf-fitbtn:hover { background: color-mix(in srgb, var(--cf-accent) 32%, transparent); }
#cf-win .cf-pop .cf-fitoff { border: 0; background: transparent; color: var(--cf-muted); font: inherit; font-size: 12px; cursor: pointer; padding: 2px; text-decoration: underline; }
#cf-win .cf-pop .cf-fitoff[hidden] { display: none; }
#cf-win svg { width: 18px; height: 18px; fill: currentColor; }
#cf-win button { font: inherit; color: inherit; }

/* linke Spalte */
#cf-win .cf-side { background: var(--cf-side); display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--cf-line); }
#cf-win .cf-sidehead { padding: 10px; display: flex; flex-direction: column; gap: 8px; cursor: move; background: var(--cf-head); }
#cf-win .cf-title { font-weight: 800; color: var(--cf-head-text); display: flex; align-items: center; gap: 8px; font-size: 14px; }
#cf-win .cf-title svg { color: var(--cf-accent); }
#cf-win .cf-search { width: 100%; box-sizing: border-box; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--cf-line);
  background: var(--cf-bg); color: var(--cf-text); outline: none; font-size: 13px; cursor: text; }
#cf-win .cf-search:focus { border-color: var(--cf-accent); }
#cf-win .cf-list { overflow-y: auto; flex: 1; padding: 6px; display: flex; flex-direction: column; gap: 3px; }
#cf-win .cf-item { display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center; padding: 7px 8px; border-radius: 10px; cursor: pointer; border: 0; background: transparent; text-align: left; }
#cf-win .cf-item:hover { background: color-mix(in srgb, var(--cf-text) 7%, transparent); }
#cf-win .cf-item.on { background: color-mix(in srgb, var(--cf-accent) 22%, transparent); }
#cf-win .cf-ava { position: relative; width: 36px; height: 36px; }
#cf-win .cf-ava img, #cf-win .cf-ava .cf-letter { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: block; }
#cf-win .cf-letter { background: var(--cf-accent); color: #fff; display: grid !important; place-items: center; font-weight: 800; }
#cf-win .cf-dot { position: absolute; right: -1px; bottom: -1px; width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--cf-side); background: #80848e; }
#cf-win .cf-dot.online { background: #23a55a; } #cf-win .cf-dot.idle { background: #f0b232; } #cf-win .cf-dot.dnd { background: #f23f43; }
#cf-win .cf-nm { font-weight: 600; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cf-win .cf-sub { font-size: 11.5px; color: var(--cf-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cf-win .cf-item.unread .cf-nm { color: var(--cf-head-text); font-weight: 800; }
#cf-win .cf-badge { background: #f23f43; color: #fff; font-size: 11px; font-weight: 800; min-width: 18px; height: 18px; border-radius: 9px; display: grid; place-items: center; padding: 0 5px; }
#cf-win .cf-empty { color: var(--cf-muted); font-size: 13px; text-align: center; padding: 24px 12px; }

/* rechte Seite */
#cf-win .cf-main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
#cf-win .cf-tabs { display: flex; align-items: stretch; gap: 4px; padding: 6px 6px 0; background: var(--cf-head); cursor: move; min-height: 40px; }
#cf-win .cf-tabscroll { display: flex; gap: 4px; overflow-x: auto; flex: 1; scrollbar-width: none; }
#cf-win .cf-tab { display: flex; align-items: center; gap: 7px; padding: 6px 8px 6px 10px; border-radius: 10px 10px 0 0; border: 0;
  background: color-mix(in srgb, var(--cf-text) 6%, transparent); color: var(--cf-muted); cursor: pointer; white-space: nowrap; max-width: 180px; font-size: 13px; }
#cf-win .cf-tab.on { background: var(--cf-bg); color: var(--cf-head-text); font-weight: 700; }
#cf-win .cf-tab img { width: 20px; height: 20px; border-radius: 50%; }
#cf-win .cf-tab span { overflow: hidden; text-overflow: ellipsis; }
#cf-win .cf-tab .cf-x { border: 0; background: transparent; padding: 1px; border-radius: 5px; opacity: .6; cursor: pointer; display: flex; }
#cf-win .cf-tab .cf-x:hover { opacity: 1; background: color-mix(in srgb, var(--cf-text) 12%, transparent); }
#cf-win .cf-tab .cf-x svg { width: 13px; height: 13px; }
#cf-win .cf-tab.unread:not(.on) { color: var(--cf-head-text); }
#cf-win .cf-tab.unread:not(.on)::after { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #f23f43; }
#cf-win .cf-hide { border: 0; background: transparent; color: var(--cf-muted); cursor: pointer; padding: 6px; border-radius: 8px; align-self: center; display: flex; }
#cf-win .cf-hide:hover { color: var(--cf-head-text); background: color-mix(in srgb, var(--cf-text) 10%, transparent); }

#cf-win .cf-msgs { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 3px; min-height: 0; }
#cf-win .cf-msgs > :first-child { margin-top: auto; }
#cf-win .cf-day { align-self: center; font-size: 11.5px; color: var(--cf-muted); background: var(--tscf-day, color-mix(in srgb, var(--cf-text) 7%, transparent)); padding: 3px 10px; border-radius: 999px; margin: 10px 0 6px; }
#cf-win .cf-row { display: flex; gap: 8px; align-items: flex-end; max-width: 78%; }
#cf-win .cf-row.me { align-self: flex-end; flex-direction: row-reverse; }
#cf-win .cf-row .cf-mini { width: 28px; height: 28px; border-radius: 50%; flex: none; }
#cf-win .cf-row .cf-gap { width: 28px; flex: none; }
#cf-win .cf-bubble { padding: 7px 11px 5px; border-radius: var(--cf-r) var(--cf-r) var(--cf-r) var(--cf-tail); background: var(--tscf-other, color-mix(in srgb, color-mix(in srgb, var(--cf-text) 9%, var(--cf-bg0)) calc(var(--cf-op) * 0.5 + 50%), transparent));
  color: var(--tscf-other-text, inherit); line-height: 1.38; font-size: var(--tscf-fs, 14px); word-break: break-word; min-width: 48px; }
#cf-win .cf-row.me .cf-bubble { background: var(--tscf-me, var(--cf-accent)); color: var(--tscf-me-text, #fff); border-radius: var(--cf-r) var(--cf-r) var(--cf-tail) var(--cf-r); }
#cf-win .cf-row.cont .cf-bubble { border-radius: var(--cf-r); }
#cf-win .cf-who { font-size: 12px; font-weight: 700; color: var(--tscf-who, var(--cf-accent)); margin-bottom: 2px; }
#cf-win .cf-time { font-size: 10.5px; opacity: .65; text-align: right; margin-top: 2px; white-space: nowrap; }
#cf-win .cf-bubble a { color: inherit; text-decoration: underline; }
#cf-win .cf-row:not(.me) .cf-bubble a { color: var(--text-link, var(--cf-accent)); }
#cf-win .cf-bubble img.cf-img { display: block; max-width: 260px; max-height: 260px; border-radius: 10px; margin: 4px 0 2px; cursor: pointer; }
#cf-win .cf-bubble img.cf-emo { width: 22px; height: 22px; vertical-align: -5px; }
#cf-win .cf-mention { background: color-mix(in srgb, var(--cf-accent) 30%, transparent); border-radius: 4px; padding: 0 3px; font-weight: 600; }
#cf-win .cf-sys { align-self: center; font-size: 12px; color: var(--cf-muted); margin: 4px 0; }
#cf-win .cf-more { align-self: center; font-size: 12px; color: var(--cf-muted); padding: 4px 0 8px; }
#cf-win .cf-welcome { margin: auto; text-align: center; color: var(--cf-muted); max-width: 300px; }
#cf-win .cf-welcome svg { width: 42px; height: 42px; color: var(--cf-accent); }

#cf-win .cf-input { display: flex; gap: 8px; align-items: flex-end; padding: 10px 12px 12px; border-top: 1px solid var(--cf-line); }
#cf-win textarea { flex: 1; resize: none; max-height: 140px; min-height: 40px; box-sizing: border-box; padding: 10px 12px; border-radius: 12px;
  border: 1px solid var(--cf-line); background: var(--tscf-input, var(--channeltextarea-background, var(--cf-side))); color: var(--cf-text); font: inherit; font-size: var(--tscf-fs, 14px); outline: none; }
#cf-win textarea:focus { border-color: var(--cf-accent); }
#cf-win .cf-send { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--tscf-send, var(--cf-accent)); color: var(--tscf-send-icon, #fff); cursor: pointer; display: grid; place-items: center; flex: none; }
#cf-win .cf-send:hover { filter: brightness(1.1); }
#cf-win .cf-send:disabled { opacity: .45; cursor: default; }

/* Emojis, GIFs, Sticker (Knöpfe einzeln im Theme Studio abschaltbar: --tscf-btn-gif/-sticker/-emoji: none) */
#cf-win .cf-xbtns { display: flex; gap: 2px; align-self: center; }
#cf-win .cf-xbtn { border: 0; background: transparent; color: var(--cf-muted); cursor: pointer; padding: 6px; border-radius: 8px; display: flex; }
#cf-win .cf-xbtn:hover, #cf-win .cf-xbtn.on { color: var(--cf-head-text); background: color-mix(in srgb, var(--cf-text) 10%, transparent); }
#cf-win .cf-xbtn svg { width: 22px; height: 22px; }
#cf-win .cf-xbtn[data-x="gif"] { display: var(--tscf-btn-gif, flex); }
#cf-win .cf-xbtn[data-x="sticker"] { display: var(--tscf-btn-sticker, flex); }
#cf-win .cf-xbtn[data-x="emoji"] { display: var(--tscf-btn-emoji, flex); }
#cf-win .cf-xp { position: absolute; right: 12px; bottom: 66px; z-index: 6; width: min(420px, calc(100% - 24px)); height: min(440px, calc(100% - 120px)); display: flex; flex-direction: column;
  background: var(--cf-float); border: 1px solid var(--cf-border); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.5); overflow: hidden; }
#cf-win .cf-xp[hidden] { display: none; }
#cf-win .cf-xphead { display: flex; gap: 6px; align-items: center; padding: 8px 8px 6px; }
#cf-win .cf-xptab { border: 0; background: transparent; color: var(--cf-muted); padding: 5px 10px; border-radius: 7px; cursor: pointer; font-weight: 600; font-size: 13px; }
#cf-win .cf-xptab.on { background: color-mix(in srgb, var(--cf-accent) 25%, transparent); color: var(--cf-head-text); }
#cf-win .cf-xpq { margin: 0 8px 6px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--cf-line); background: var(--cf-bg0); color: var(--cf-text); outline: none; font-size: 13px; }
#cf-win .cf-xpq:focus { border-color: var(--cf-accent); }
#cf-win .cf-xpbody { flex: 1; overflow-y: auto; padding: 0 8px 8px; min-height: 0; }
#cf-win .cf-xpsec { font-size: 11.5px; font-weight: 700; color: var(--cf-muted); text-transform: uppercase; letter-spacing: .3px; margin: 8px 2px 4px; display: flex; align-items: center; gap: 6px; }
#cf-win .cf-xpsec img { width: 16px; height: 16px; border-radius: 50%; }
#cf-win .cf-emos { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 2px; }
#cf-win .cf-emos button { border: 0; background: transparent; border-radius: 6px; cursor: pointer; height: 36px; font-size: 24px; line-height: 36px; padding: 0; display: grid; place-items: center; }
#cf-win .cf-emos button:hover { background: color-mix(in srgb, var(--cf-text) 12%, transparent); }
#cf-win .cf-emos img { width: 28px; height: 28px; object-fit: contain; }
#cf-win .cf-gifs { columns: 2; column-gap: 6px; }
#cf-win .cf-gifs button { display: block; width: 100%; margin: 0 0 6px; padding: 0; border: 0; border-radius: 8px; overflow: hidden; cursor: pointer; background: color-mix(in srgb, var(--cf-text) 8%, transparent); position: relative; break-inside: avoid; }
#cf-win .cf-gifs img { display: block; width: 100%; min-height: 60px; object-fit: cover; }
#cf-win .cf-gifs button:hover { outline: 2px solid var(--cf-accent); }
#cf-win .cf-gifs .cf-cat span { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.45); color: #fff; font-weight: 800; font-size: 14px; text-transform: capitalize; }
#cf-win .cf-stk { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 6px; }
#cf-win .cf-stk button { border: 0; background: transparent; border-radius: 8px; cursor: pointer; height: 84px; padding: 4px; display: grid; place-items: center; color: var(--cf-muted); font-size: 11px; overflow: hidden; }
#cf-win .cf-stk button:hover { background: color-mix(in srgb, var(--cf-text) 10%, transparent); }
#cf-win .cf-stk img, #cf-win .cf-stk .cf-lot { width: 76px; height: 76px; object-fit: contain; }
#cf-win .cf-lotmsg { width: 140px; height: 140px; margin: 4px 0 2px; }
#cf-win .cf-xpnote { color: var(--cf-muted); font-size: 13px; text-align: center; padding: 24px 8px; }

/* Hinweis „Neue Nachricht“ über der Sprachverbindung */
#cf-notes { margin: 0 8px 8px; display: flex; flex-direction: column; gap: 6px; }
#cf-notes:empty { display: none; }
#cf-notes .cf-note { display: grid; grid-template-columns: 32px 1fr auto; gap: 9px; align-items: center; padding: 8px 8px 8px 10px; border-radius: 12px; cursor: pointer;
  background: var(--cf-float); border: 1px solid color-mix(in srgb, var(--cf-accent) 55%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--cf-accent) 20%, transparent); animation: cf-up .35s cubic-bezier(.2,.9,.3,1.2); }
#cf-notes .cf-note:hover { border-color: var(--cf-accent); }
#cf-notes .cf-note img { width: 32px; height: 32px; border-radius: 50%; }
#cf-notes .cf-nt { font-size: 11.5px; color: var(--cf-accent); font-weight: 800; text-transform: uppercase; letter-spacing: .3px; }
#cf-notes .cf-nn { font-size: 13px; font-weight: 700; color: var(--cf-head-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cf-notes .cf-np { font-size: 12px; color: var(--cf-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cf-notes .cf-nx { border: 0; background: transparent; color: var(--cf-muted); cursor: pointer; padding: 3px; border-radius: 6px; display: flex; align-self: flex-start; }
#cf-notes .cf-nx:hover { color: var(--cf-text); background: color-mix(in srgb, var(--cf-text) 10%, transparent); }
#cf-notes .cf-nx svg { width: 14px; height: 14px; fill: currentColor; }
@keyframes cf-up { from { transform: translateY(18px); opacity: 0; } to { transform: none; opacity: 1; } }

/* Chat-Symbol im Nachrichtenfeld von Discord (vor dem Plus) */
.cf-cbtn { position: relative; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; box-sizing: border-box;
  width: 34px; min-height: 24px; margin: 0 0 0 8px; padding: 0; border: 0; border-radius: 8px; background: transparent; cursor: pointer;
  color: var(--interactive-normal, var(--text-muted, #b5bac1)); }
.cf-cbtn:hover { color: var(--interactive-hover, var(--text-normal, #dbdee1)); }
.cf-cbtn:hover svg { transform: scale(1.08); }
.cf-cbtn svg { transition: transform .12s; }
.cf-cbtn.on { color: var(--brand-500, #5865f2); }
.cf-cbtn svg { width: 20px; height: 20px; fill: currentColor; display: block; }
.cf-cbtn .cf-cnum { position: absolute; top: calc(50% - 17px); right: -4px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 8px;
  background: #f23f43; color: #fff; font: 700 10.5px/16px var(--font-primary, sans-serif); text-align: center; pointer-events: none;
  box-shadow: 0 0 0 3px var(--channeltextarea-background, var(--background-primary, #313338)); }
.cf-cbtn .cf-cnum:empty { display: none; }

/* Eintrag im Rechtsklick-Menü */
#user-context-cf-open { cursor: pointer; }
#user-context-cf-open:hover { background: var(--menu-item-default-hover-bg, var(--brand-500, #5865f2)); color: var(--white, #fff); }
#user-context-cf-open:hover * { color: inherit; }
`;

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = class Chatfenster {
  constructor(meta) { this.meta = meta; this.notes = new Map(); this.loading = new Set(); }

  /* ================= Einstellungen ================= */
  get s() {
    if (!this._s) {
      const saved = BdApi.Data.load(NAME, "settings");
      this._s = Object.assign({}, DEFAULTS, saved || {});
      // Wer das Plugin schon vor 1.6.1 benutzt hat, behält sein Tastenkürzel
      if (saved && typeof saved === "object" && !("hotkey" in saved)) { this._s.hotkey = true; this.save(); }
      if (!Array.isArray(this._s.tabs)) this._s.tabs = [];
    }
    return this._s;
  }
  save() { BdApi.Data.save(NAME, "settings", this.s); }

  /* ================= Discord-Bausteine ================= */
  resolve() {
    const W = BdApi.Webpack;
    const st = (n) => { try { return W.getStore(n); } catch { return null; } };
    this.ChannelStore = st("ChannelStore");
    this.UserStore = st("UserStore");
    this.MessageStore = st("MessageStore");
    this.PresenceStore = st("PresenceStore");
    this.ReadStateStore = st("ReadStateStore");
    this.SortStore = st("PrivateChannelSortStore");
    this.SelectedStore = st("SelectedChannelStore");
    this.RelStore = st("RelationshipStore");
    this.MuteStore = st("UserGuildSettingsStore");
    const key = (...k) => { try { return W.getByKeys(...k); } catch { return null; } };
    this.MsgActions = key("sendMessage", "fetchMessages") || key("sendMessage");
    this.PrivActions = key("getOrEnsurePrivateChannel") || key("ensurePrivateChannel") || null;
    this.AckActions = key("ack", "bulkAck") || key("ack", "localAck") || null;
    /* Discords eigener HTTP-Baustein (nicht superagent: der hat getXHR und eine andere Aufrufart) */
    try { this.Http = W.getModule((m) => m && typeof m.get === "function" && typeof m.post === "function" && typeof m.del === "function" && typeof m.getXHR !== "function", { searchExports: true }) || null; } catch { this.Http = null; }
    if (!this.Http) { try { this.Http = W.getModule((m) => m && typeof m.post === "function" && typeof m.get === "function" && typeof m.del === "function" && typeof m.patch === "function", { searchExports: true }) || null; } catch {} }
    this.CtxActions = key("closeContextMenu") || null;
    this.Dispatcher = key("dispatch", "subscribe", "unsubscribe") || (this.ChannelStore && this.ChannelStore._dispatcher) || null;
    const missing = [];
    if (!this.ChannelStore || !this.UserStore) missing.push("Kanäle/Nutzer");
    if (!this.MessageStore) missing.push("Nachrichten");
    if (!this.MsgActions) missing.push("Senden");
    if (!this.Dispatcher) missing.push("Live-Updates");
    return missing;
  }

  me() { try { return this.UserStore.getCurrentUser(); } catch { return null; } }
  user(id) { try { return this.UserStore.getUser(id); } catch { return null; } }
  channel(id) { try { return this.ChannelStore.getChannel(id); } catch { return null; } }

  userName(u, id) {
    if (!u) return "Unbekannt";
    let nick = null;
    try { nick = this.RelStore && this.RelStore.getNickname && this.RelStore.getNickname(u.id || id); } catch {}
    return nick || u.globalName || u.global_name || u.username || "Unbekannt";
  }
  avatar(u, size = 64) {
    if (!u) return "";
    try { if (typeof u.getAvatarURL === "function") { const a = u.getAvatarURL(null, size); if (a) return a; } } catch {}
    if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${String(u.avatar).startsWith("a_") ? "gif" : "png"}?size=${size}`;
    let n = 0; try { n = Number((BigInt(u.id) >> 22n) % 6n); } catch {}
    return `https://cdn.discordapp.com/embed/avatars/${n}.png`;
  }
  status(id) { try { return (this.PresenceStore && this.PresenceStore.getStatus(id)) || "offline"; } catch { return "offline"; } }
  unread(cid) {
    try {
      const rs = this.ReadStateStore; if (!rs) return 0;
      const n = rs.getMentionCount ? rs.getMentionCount(cid) : 0;
      if (n) return n;
      return rs.hasUnread && rs.hasUnread(cid) ? 1 : 0;
    } catch { return 0; }
  }
  muted(cid) { try { return !!(this.MuteStore && this.MuteStore.isChannelMuted && this.MuteStore.isChannelMuted(null, cid)); } catch { return false; } }

  /* Infos zu einem Privat-Chat: Name, Bild, Status */
  chatInfo(cid) {
    const ch = this.channel(cid);
    if (!ch) return null;
    const ids = ch.recipients || ch.rawRecipients?.map((r) => r.id) || [];
    if (ch.type === 3) {
      const names = ids.map((id) => this.userName(this.user(id), id)).filter(Boolean);
      const name = ch.name || names.join(", ") || "Gruppe";
      const icon = ch.icon ? `https://cdn.discordapp.com/channel-icons/${ch.id}/${ch.icon}.png?size=64` : null;
      return { id: cid, group: true, name, icon, letter: name.trim().charAt(0).toUpperCase() || "#", sub: `${ids.length + 1} Mitglieder`, status: null };
    }
    const uid = (ch.getRecipientId && ch.getRecipientId()) || ids[0];
    const u = this.user(uid);
    return { id: cid, group: false, uid, name: this.userName(u, uid), icon: this.avatar(u), status: this.status(uid), sub: u ? (u.username || "") : "" };
  }

  privateIds() {
    let ids = [];
    try { if (this.SortStore && this.SortStore.getPrivateChannelIds) ids = this.SortStore.getPrivateChannelIds() || []; } catch {}
    if (!ids.length) {
      try {
        const all = (this.ChannelStore.getMutablePrivateChannels && this.ChannelStore.getMutablePrivateChannels())
          || (this.ChannelStore.getSortedPrivateChannels && this.ChannelStore.getSortedPrivateChannels()) || {};
        const list = Array.isArray(all) ? all : Object.values(all);
        const big = (x) => { try { return BigInt(x || 0); } catch { return 0n; } };
        ids = list.sort((a, b) => (big(b.lastMessageId) > big(a.lastMessageId) ? 1 : -1)).map((c) => c.id);
      } catch {}
    }
    return ids.filter((id) => { const c = this.channel(id); return c && (c.type === 1 || (c.type === 3 && this.s.groups)); });
  }

  /* ================= Nachrichten ================= */
  messages(cid) {
    try {
      const m = this.MessageStore.getMessages(cid);
      if (!m) return [];
      if (typeof m.toArray === "function") return m.toArray();
      return m._array || [];
    } catch { return []; }
  }
  hasMore(cid) { try { const m = this.MessageStore.getMessages(cid); return !!(m && m.hasMoreBefore); } catch { return false; } }

  async load(cid, before) {
    const key = cid + (before || "");
    if (this.loading.has(key) || !this.MsgActions || !this.MsgActions.fetchMessages) return;
    this.loading.add(key);
    try { await this.MsgActions.fetchMessages(before ? { channelId: cid, limit: 50, before } : { channelId: cid, limit: 50 }); }
    catch (e) { console.error("[Chatfenster] laden", e); }
    finally { this.loading.delete(key); }
  }

  async send(cid, text) {
    text = text.trim();
    if (!text) return false;
    if (text.length > 2000) { BdApi.UI.showToast("Nachricht ist zu lang (max. 2000 Zeichen)", { type: "error" }); return false; }
    try {
      await this.MsgActions.sendMessage(cid, { content: text, tts: false, invalidEmojis: [], validNonShortcutEmojis: [] }, undefined, {});
      return true;
    } catch (e) {
      console.error("[Chatfenster] senden", e);
      BdApi.UI.showToast("Senden hat nicht geklappt", { type: "error" });
      return false;
    }
  }

  /* Als gelesen markieren – drei Wege, falls Discord Namen geändert hat */
  ack(cid, force) {
    if (!cid || !this.unread(cid)) return;
    const now = Date.now(); this._ackAt = this._ackAt || {};
    if (!force && now - (this._ackAt[cid] || 0) < 2500) return;
    this._ackAt[cid] = now;
    let via = "";
    try { if (this.AckActions && typeof this.AckActions.ack === "function") { this.AckActions.ack(cid, true, true); via = "ack"; } } catch {}
    if (!via) { try { this.Dispatcher.dispatch({ type: "CHANNEL_ACK", channelId: cid, immediate: true, force: true }); via = "dispatch"; } catch {} }
    this.diag("ack", via || "keiner");
    setTimeout(() => { if (this.unread(cid)) this.ackHttp(cid); else { this.removeNote(cid); this.queueRender(false); } }, 1200);
  }
  async ackHttp(cid) {
    const ch = this.channel(cid), list = this.messages(cid);
    const mid = (ch && ch.lastMessageId) || (list.length ? list[list.length - 1].id : null);
    if (!mid || !this.Http || !this.Http.post) { this.diag("ackHttp", "nicht möglich"); return; }
    try {
      await this.Http.post({ url: `/channels/${cid}/messages/${mid}/ack`, body: { token: null } });
      this.diag("ackHttp", "ok");
    } catch (e) { this.diag("ackHttp", String((e && (e.message || e.status)) || e)); }
    setTimeout(() => { this.removeNote(cid); this.queueRender(false); }, 800);
  }
  diag(k, v) { try { const d = BdApi.Data.load(NAME, "diag") || {}; if (d[k] === v) return; d[k] = v; d.zeit = new Date().toISOString(); BdApi.Data.save(NAME, "diag", d); } catch {} }

  /* Privat-Chat zu einem Nutzer finden oder anlegen */
  async dmFor(uid) {
    try { const id = this.ChannelStore.getDMFromUserId && this.ChannelStore.getDMFromUserId(uid); if (id) return id; } catch {}
    for (const fn of ["getOrEnsurePrivateChannel", "ensurePrivateChannel"]) {
      try { if (this.PrivActions && this.PrivActions[fn]) { const r = await this.PrivActions[fn](uid); const id = typeof r === "string" ? r : r && r.id; if (id) return id; } } catch {}
    }
    try {
      if (this.Http && this.Http.post) {
        const r = await this.Http.post({ url: "/users/@me/channels", body: { recipients: [uid] } });
        const id = r && r.body && r.body.id;
        if (id) { for (let i = 0; i < 20 && !this.channel(id); i++) await new Promise((res) => setTimeout(res, 100)); return id; }
      }
    } catch (e) { console.error("[Chatfenster] DM anlegen", e); }
    return null;
  }

  /* ================= Fenster ================= */
  build() {
    const w = document.createElement("div");
    w.id = "cf-win";
    w.hidden = true;
    w.innerHTML = `
      <div class="cf-wall"></div>
      <div class="cf-side">
        <div class="cf-sidehead" data-drag>
          <div class="cf-title"><svg viewBox="0 0 24 24"><path d="${ICON.chat}"/></svg>Chatfenster</div>
          <input class="cf-search" placeholder="Suchen …" spellcheck="false">
        </div>
        <div class="cf-list"></div>
      </div>
      <div class="cf-main">
        <div class="cf-tabs" data-drag><div class="cf-tabscroll"></div><button class="cf-ib cf-pin" title="Immer im Vordergrund"><svg viewBox="0 0 24 24"><path d="${ICON.pin}"/></svg></button><button class="cf-ib cf-popbtn" title="Herauslösen – eigenes Fenster, z. B. für den zweiten Bildschirm"><svg viewBox="0 0 24 24"><path d="${ICON.popout}"/></svg></button><button class="cf-gear" title="Einstellungen"><svg viewBox="0 0 24 24"><path d="${ICON.gear}"/></svg></button><button class="cf-hide" title="Ausblenden"><svg viewBox="0 0 24 24"><path d="${ICON.close}"/></svg></button></div>
        <div class="cf-pop" hidden>
          <b>Fenster</b>
          <div>Deckkraft</div>
          <div class="cf-prow"><input type="range" class="cf-op" min="30" max="100" step="5"><span class="cf-pval"></span></div>
          <label><input type="checkbox" class="cf-wallcb"> Hintergrundbild im Fenster</label>
          <label><input type="checkbox" class="cf-blurcb"> Hintergrund weichzeichnen</label>
          <label><input type="checkbox" class="cf-notecb"> Hinweis bei neuen Nachrichten</label>
          <label><input type="checkbox" class="cf-groupcb"> Gruppen-Chats anzeigen</label>
          <button class="cf-fitbtn" title="Übernimmt Farben, Akzent und Schrift vom Theme, das gerade in Discord läuft – und passt sich bei einem Theme-Wechsel von selbst wieder an">An aktuelles Theme anpassen</button>
          <button class="cf-fitoff" hidden>Zurück zu den Studio-Farben</button>
        </div>
        <div class="cf-msgs"></div>
        <div class="cf-xp" hidden><div class="cf-xphead"><button class="cf-xptab" data-x="gif">GIFs</button><button class="cf-xptab" data-x="sticker">Sticker</button><button class="cf-xptab" data-x="emoji">Emojis</button></div><input class="cf-xpq" spellcheck="false" placeholder="Suchen …"><div class="cf-xpbody"></div></div>
        <div class="cf-input"><textarea rows="1" placeholder="Nachricht schreiben …"></textarea><div class="cf-xbtns"><button class="cf-xbtn" data-x="gif" title="GIFs"><svg viewBox="0 0 24 24"><path d="${ICON.gif}"/></svg></button><button class="cf-xbtn" data-x="sticker" title="Sticker"><svg viewBox="0 0 24 24"><path d="${ICON.sticker}"/></svg></button><button class="cf-xbtn" data-x="emoji" title="Emojis"><svg viewBox="0 0 24 24"><path d="${ICON.emoji}"/></svg></button></div><button class="cf-send" title="Senden (Enter)"><svg viewBox="0 0 24 24"><path d="${ICON.send}"/></svg></button></div>
      </div>`;
    document.body.appendChild(w);
    this.win = w;
    const q = (c) => w.querySelector(c);
    this.$list = q(".cf-list"); this.$tabs = q(".cf-tabscroll"); this.$msgs = q(".cf-msgs");
    this.$input = q("textarea"); this.$send = q(".cf-send"); this.$search = q(".cf-search");

    q(".cf-hide").onclick = () => this.hide();
    this.$wall = q(".cf-wall");
    q(".cf-popbtn").onclick = () => { if (this.popped) { this.dock(false); this.show(); } else this.popOut(); };
    q(".cf-pin").onclick = () => this.setTop(!this.s.top);
    q(".cf-wallcb").onchange = (e) => { this.s.wall = e.target.checked; this.save(); this.applyWall(); };
    const pop = q(".cf-pop"), gear = q(".cf-gear");
    gear.onclick = (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; gear.classList.toggle("on", !pop.hidden); this.syncPop(); };
    w.addEventListener("mousedown", (e) => { if (!pop.hidden && !e.target.closest(".cf-pop, .cf-gear")) { pop.hidden = true; gear.classList.remove("on"); } });
    const op = q(".cf-op");
    op.oninput = () => { this.s.opacity = +op.value; this.applyLook(); this.syncPop(); };
    op.onchange = () => this.save();
    q(".cf-blurcb").onchange = (e) => { this.s.blur = e.target.checked; this.save(); this.applyLook(); };
    q(".cf-fitbtn").onclick = () => { this.s.fit = true; this.save(); this.applyFit(true); this.syncPop(); };
    q(".cf-fitoff").onclick = () => { this.s.fit = false; this.save(); this.applyFit(); this.syncPop(); };
    q(".cf-notecb").onchange = (e) => { this.s.notify = e.target.checked; this.save(); if (!this.s.notify) { this.notes.clear(); this.renderNotes(); } };
    q(".cf-groupcb").onchange = (e) => { this.s.groups = e.target.checked; this.save(); this.renderAll(); };
    this.$search.oninput = () => this.renderList();
    this.$list.onclick = (e) => { const b = e.target.closest(".cf-item"); if (b) this.openChat(b.dataset.id); };
    this.$tabs.onclick = (e) => {
      const x = e.target.closest(".cf-x"); const t = e.target.closest(".cf-tab");
      if (x && t) { e.stopPropagation(); this.closeTab(t.dataset.id); } else if (t) this.openChat(t.dataset.id);
    };
    this.$tabs.onauxclick = (e) => { const t = e.target.closest(".cf-tab"); if (t && e.button === 1) this.closeTab(t.dataset.id); };
    this.$msgs.onclick = (e) => {
      const img = e.target.closest("img.cf-img"); if (img) { window.open(img.dataset.full || img.src, "_blank"); return; }
    };
    this.$msgs.onscroll = () => {
      const cid = this.s.active;
      if (cid && this.$msgs.scrollTop < 60 && this.hasMore(cid)) {
        const first = this.messages(cid)[0];
        if (first) { this.keepFromBottom = this.$msgs.scrollHeight - this.$msgs.scrollTop; this.load(cid, first.id); }
      }
    };
    this.$input.addEventListener("keydown", (e) => {
      e.stopPropagation(); // Discord-Tastenkürzel nicht auslösen
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); this.doSend(); }
      if (e.key === "Escape") { if (this.xp) this.xpClose(); else this.hide(); }
    });
    this.$input.addEventListener("keypress", (e) => e.stopPropagation());
    this.$input.addEventListener("input", () => this.autoGrow());
    this.$send.onclick = () => this.doSend();
    this.$xp = q(".cf-xp"); this.$xpq = q(".cf-xpq"); this.$xpb = q(".cf-xpbody");
    w.querySelectorAll(".cf-xbtn").forEach((b) => b.onclick = (e) => { e.stopPropagation(); this.xpToggle(b.dataset.x); });
    w.querySelectorAll(".cf-xptab").forEach((b) => b.onclick = () => this.xpShow(b.dataset.x));
    this.$xpq.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") { this.xpClose(); this.$input.focus(); } });
    this.$xpq.addEventListener("keypress", (e) => e.stopPropagation());
    this.$xpq.oninput = () => { clearTimeout(this._xqt); this._xqt = setTimeout(() => this.xpRender(), this.xp === "gif" ? 400 : 120); };
    this.$xpb.onclick = (e) => this.xpPick(e);
    this.$xpb.onmouseover = (e) => { const t = e.target.closest("[data-lot]"); if (t && t._anim) { try { t._anim.play(); } catch {} } };
    this.$xpb.onmouseout = (e) => { const t = e.target.closest("[data-lot]"); if (t && t._anim) { try { t._anim.goToAndStop(0, true); } catch {} } };
    w.addEventListener("mousedown", (e) => { if (this.xp && !e.target.closest(".cf-xp, .cf-xbtn")) this.xpClose(); });
    this.$search.addEventListener("keydown", (e) => e.stopPropagation());

    // Verschieben an der Kopfzeile
    w.addEventListener("mousedown", (e) => {
      const h = e.target.closest("[data-drag]");
      if (this.popped || !h || e.button !== 0 || e.target.closest("button, input, .cf-tab")) return;
      e.preventDefault();
      const r = w.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const move = (ev) => this.place(ev.clientX - dx, ev.clientY - dy);
      const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); this.savePos(); };
      window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    });
    // Größe merken
    this.ro = new ResizeObserver(() => { clearTimeout(this._rt); this._rt = setTimeout(() => this.savePos(), 400); });
    this.ro.observe(w);

    w.style.width = this.s.w + "px"; w.style.height = this.s.h + "px";
    this.applyLook();
    this.applyWall();
    const x = this.s.x != null ? this.s.x : window.innerWidth - this.s.w - 40;
    const y = this.s.y != null ? this.s.y : 80;
    this.place(x, y);
  }

  applyLook() {
    if (!this.win) return;
    const op = this.popped ? 100 : Math.max(30, Math.min(100, +this.s.opacity || 100));
    this.win.style.setProperty("--cf-op", op + "%");
    this.win.classList.toggle("cf-blur", !!this.s.blur && op < 100);
    if (this.$wall) this.$wall.style.opacity = String(op / 100);
  }
  syncPop() {
    if (!this.win) return;
    const q = (c) => this.win.querySelector(c);
    q(".cf-op").value = this.s.opacity; q(".cf-pval").textContent = this.s.opacity + " %";
    q(".cf-blurcb").checked = !!this.s.blur; q(".cf-wallcb").checked = !!this.s.wall; q(".cf-notecb").checked = !!this.s.notify; q(".cf-groupcb").checked = !!this.s.groups;
    q(".cf-fitoff").hidden = !this.s.fit; q(".cf-fitbtn").textContent = this.s.fit ? "Farben neu vom Theme holen" : "An aktuelles Theme anpassen";
  }

  /* ================= An aktuelles Theme anpassen =================
     Liest die Farben, die in Discord gerade wirklich zu sehen sind (Akzent, Flächen, Schrift), und legt sie direkt aufs Fenster.
     Das überdeckt die Chatfenster-Farben aus dem Theme Studio (--tscf-*), solange es an ist. */
  themeColors() {
    const doc = document, probe = doc.createElement("div");
    probe.style.cssText = "position:fixed;left:-99px;top:-99px;width:1px;height:1px;pointer-events:none;visibility:hidden";
    doc.body.appendChild(probe);
    const varCol = (expr, prop) => { probe.style[prop || "color"] = ""; probe.style[prop || "color"] = expr; const c = getComputedStyle(probe)[prop || "color"]; return c; };
    const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ""); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const css = (o) => o ? (o.a >= 0.999 ? `rgb(${Math.round(o.r)}, ${Math.round(o.g)}, ${Math.round(o.b)})` : `rgba(${Math.round(o.r)}, ${Math.round(o.g)}, ${Math.round(o.b)}, ${Math.round(o.a * 100) / 100})`) : "";
    /* Sichtbare Fläche eines Bereichs: erste Hintergrundfarbe mit Deckung, vom Element nach außen */
    const surf = (sels) => { for (const sel of sels) { let el = doc.querySelector(sel); for (let i = 0; el && i < 8; i++, el = el.parentElement) {
      if (el.closest && el.closest("#cf-win")) break; const o = parse(getComputedStyle(el).backgroundColor); if (o && o.a > 0.04) return o; } } return null; };
    const v = (expr) => parse(varCol(expr, "backgroundColor"));
    const accent = parse(varCol("var(--brand-500, var(--brand-experiment, #5865f2))")) || { r: 88, g: 101, b: 242, a: 1 };
    let txtEl = doc.querySelector('[class*="messageContent_"]'), text = txtEl ? parse(getComputedStyle(txtEl).color) : null;
    if (!text) text = parse(varCol("var(--text-normal, var(--text-default, #dbdee1))"));
    const muted = parse(varCol("var(--text-muted, #949ba4)")) || text, head = parse(varCol("var(--header-primary, var(--text-strong, #f2f3f5))")) || text;
    const bg = surf(['main[class*="chatContent_"]', '[class*="chatContent_"]', '[class*="chat_"]']) || v("var(--background-primary, var(--background-base-lower, #313338))");
    const side = surf(['[class*="sidebar_"] [class*="scroller_"]', '[class*="sidebar_"]', 'nav[class*="container_"]']) || v("var(--background-secondary, var(--background-base-lowest, #2b2d31))") || bg;
    const top = surf(['[class*="guilds_"]', 'nav[class*="guilds"]', '[class*="titleBar_"]']) || v("var(--background-tertiary, #1e1f22)") || side;
    probe.remove();
    const lum = (o) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(o.r) + 0.7152 * f(o.g) + 0.0722 * f(o.b); };
    const meText = lum(accent) > 0.45 ? "#111214" : "#ffffff", A = css(accent), T = css(text);
    return { accent: A, bg: css(bg), side: css(side), head: css(top), text: T, muted: css(muted), "head-text": css(head), note: css(side),
      me: A, "me-text": meText, send: A, "send-icon": meText, who: A, input: `color-mix(in srgb, ${T} 7%, ${css(side)})`,
      other: `color-mix(in srgb, ${T} 10%, ${css(bg)})`, "other-text": T, border: `color-mix(in srgb, ${A} 45%, transparent)`, day: `color-mix(in srgb, ${T} 7%, transparent)` };
  }
  applyFit(fresh) {
    const els = [this.win, this.$notes].filter(Boolean);
    if (!this.s.fit) { for (const el of els) for (const k of this._fitKeys || []) el.style.removeProperty("--tscf-" + k); this._fitKeys = []; this._fitCols = null; return; }
    let c; try { c = this.themeColors(); } catch (e) { return; }
    this._fitCols = c; this._fitKeys = Object.keys(c);
    for (const el of els) for (const k of this._fitKeys) el.style.setProperty("--tscf-" + k, c[k]);
    if (fresh) try { BdApi.UI.showToast("Chatfenster passt sich jetzt dem aktuellen Theme an", { type: "success" }); } catch {}
  }

  place(x, y) {
    const w = this.win; if (!w) return;
    const r = w.getBoundingClientRect();
    const W = r.width || this.s.w, H = r.height || this.s.h;
    x = Math.max(0, Math.min(window.innerWidth - Math.min(W, 120), x));
    y = Math.max(0, Math.min(window.innerHeight - 50, y));
    w.style.left = x + "px"; w.style.top = y + "px";
    this.updateWallPos();
  }
  savePos() {
    if (this.popped) { this.savePopPos(); return; }
    if (!this.win || this.win.hidden) return;
    const r = this.win.getBoundingClientRect();
    Object.assign(this.s, { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
    this.save();
  }
  autoGrow() { const t = this.$input; t.style.height = "auto"; t.style.height = Math.min(140, t.scrollHeight) + "px"; }

  visible() { return !!(this.win && !this.win.hidden); }
  show() {
    if (this.popped) { this.focusPop(); this.renderAll(true); return; }
    if (!this.win) this.build();
    this.win.hidden = false;
    this.place(parseFloat(this.win.style.left) || 0, parseFloat(this.win.style.top) || 0);
    this.applyWall();
    this.renderAll(true);
    setTimeout(() => this.$input && this.$input.focus(), 30);
  }
  hide() { if (this.popped) { this.dock(false); this.updateBadges(); return; } if (this.win) { this.savePos(); this.win.hidden = true; } this.updateBadges(); }
  toggle() {
    if (this.popped) { if (this.pop && this.pop.document.hasFocus()) this.hide(); else this.focusPop(); return; }
    this.visible() ? this.hide() : this.show();
  }
  doc() { return this.popped && this.pop ? this.pop.document : document; }

  /* ================= Emojis, GIFs, Sticker ================= */
  xpToggle(x) { if (this.xp === x) this.xpClose(); else this.xpShow(x); }
  xpShow(x) {
    if (!this.$xp) return;
    if (this.xp !== x) { this.$xpq.value = ""; this.$xpb.scrollTop = 0; }
    this.xp = x; this.$xp.hidden = false;
    this.win.querySelectorAll(".cf-xptab, .cf-xbtn").forEach((b) => b.classList.toggle("on", b.dataset.x === x));
    this.$xpq.placeholder = x === "gif" ? "GIFs suchen …" : x === "sticker" ? "Sticker suchen …" : "Emojis suchen …";
    this.xpRender(); setTimeout(() => { try { this.$xpq.focus(); } catch {} }, 20);
  }
  xpClose() { this.xp = null; if (this.$xp) this.$xp.hidden = true; if (this.win) this.win.querySelectorAll(".cf-xptab, .cf-xbtn").forEach((b) => b.classList.remove("on")); this.xpStopLottie(); }
  xpStopLottie() { for (const a of this._lots || []) { try { a.destroy(); } catch {} } this._lots = []; if (this._lio) { this._lio.disconnect(); this._lio = null; } }
  nitro() { const u = this.me(); return !!(u && u.premiumType); }
  emojiData() {
    if (this._emo) return this._emo;
    const W = BdApi.Webpack; let U = null; try { U = W.getByKeys("getByCategory", "getCategories"); } catch {}
    const NAMES = { people: "Smileys und Personen", nature: "Natur", food: "Essen und Trinken", activity: "Aktivitäten", travel: "Reisen und Orte", objects: "Gegenstände", symbols: "Symbole", flags: "Flaggen" };
    const cats = [];
    try { for (const c of U.getCategories()) { const list = (U.getByCategory(c) || []).map((e) => ({ s: e.surrogates, n: ((e.emojiObject && e.emojiObject.names) || [e.uniqueName]).join(" ") })).filter((e) => e.s); if (list.length) cats.push({ id: c, name: NAMES[c] || c, list }); } } catch {}
    const guilds = [];
    try {
      const ES = BdApi.Webpack.getStore("EmojiStore"), GS = BdApi.Webpack.getStore("GuildStore"), all = ES.getGuilds() || {};
      for (const gid of Object.keys(all)) { const g = all[gid], list = (g.usableEmojis || g.emojis || []).filter((e) => e && e.available !== false);
        if (!list.length) continue; const gg = GS && GS.getGuild(gid);
        guilds.push({ id: gid, name: (gg && gg.name) || "Server", icon: gg && gg.icon ? `https://cdn.discordapp.com/icons/${gid}/${gg.icon}.png?size=32` : "", list: list.map((e) => ({ id: e.id, a: !!e.animated, n: e.name })) }); }
    } catch {}
    return (this._emo = { cats, guilds, at: Date.now() });
  }
  async gifData(q) {
    const key = q || "";
    this._gif = this._gif || {};
    if (this._gif[key]) return this._gif[key];
    if (!this.Http || !this.Http.get) return { fehler: "Discords Schnittstelle nicht gefunden" };
    try {
      const query = { provider: "tenor", locale: "de", media_format: "mp4", limit: 40 };
      const r = q ? await this.Http.get({ url: "/gifs/search", query: Object.assign({ q }, query) }) : await this.Http.get({ url: "/gifs/trending", query });
      const b = r && r.body;
      const out = q ? { gifs: Array.isArray(b) ? b : (b && b.gifs) || [] } : { cats: (b && b.categories) || [], gifs: (b && b.gifs) || [] };
      this._gif[key] = out; return out;
    } catch (e) { return { fehler: "GIFs ließen sich nicht laden (" + ((e && (e.status || e.message)) || e) + ")" }; }
  }
  async stickerData() {
    if (this._stk && Date.now() - this._stk.at < 10 * 60000) return this._stk;
    const out = { packs: [], guilds: [], at: Date.now() };
    try {
      const SS = BdApi.Webpack.getStore("StickersStore"), GS = BdApi.Webpack.getStore("GuildStore");
      const all = SS && SS.getAllGuildStickers && SS.getAllGuildStickers();
      if (all && all.forEach) all.forEach((list, gid) => { const ok = (list || []).filter((s) => s && s.available !== false); if (!ok.length) return; const gg = GS && GS.getGuild(gid);
        out.guilds.push({ id: gid, name: (gg && gg.name) || "Server", icon: gg && gg.icon ? `https://cdn.discordapp.com/icons/${gid}/${gg.icon}.png?size=32` : "", list: ok }); });
    } catch {}
    try { if (this.Http && this.Http.get) { const r = await this.Http.get({ url: "/sticker-packs" }); const p = r && r.body; out.packs = ((p && p.sticker_packs) || (Array.isArray(p) ? p : [])).map((k) => ({ id: k.id, name: k.name, list: k.stickers || [] })); } } catch {}
    return (this._stk = out);
  }
  stickerUrl(s) { return s.format_type === 4 ? `https://media.discordapp.net/stickers/${s.id}.gif?size=160` : `https://media.discordapp.net/stickers/${s.id}.png?size=160&passthrough=false`; }
  async xpRender() {
    const box = this.$xpb, x = this.xp; if (!box || !x) return;
    const q = (this.$xpq.value || "").trim().toLowerCase(), token = (this._xpTok = (this._xpTok || 0) + 1);
    this.xpStopLottie();
    if (x === "emoji") {
      const d = this.emojiData(); let html = "";
      if (this.nitro()) for (const g of d.guilds) { const l = q ? g.list.filter((e) => e.n.toLowerCase().includes(q)) : g.list; if (!l.length) continue;
        html += `<div class="cf-xpsec">${g.icon ? `<img src="${esc(g.icon)}" alt="">` : ""}${esc(g.name)}</div><div class="cf-emos">` + l.slice(0, q ? 60 : 400).map((e) => `<button data-ce="${e.id}" data-a="${e.a ? 1 : ""}" data-n="${esc(e.n)}" title=":${esc(e.n)}:"><img loading="lazy" src="https://cdn.discordapp.com/emojis/${e.id}.${e.a ? "gif" : "webp"}?size=48" alt=""></button>`).join("") + "</div>"; }
      for (const c of d.cats) { const l = q ? c.list.filter((e) => e.n.includes(q)) : c.list; if (!l.length) continue;
        html += `<div class="cf-xpsec">${esc(c.name)}</div><div class="cf-emos">` + l.map((e) => `<button data-ue="${esc(e.s)}" title=":${esc(e.n.split(" ")[0])}:">${e.s}</button>`).join("") + "</div>"; }
      box.innerHTML = html || `<div class="cf-xpnote">${q ? "Kein Emoji gefunden." : "Emojis ließen sich nicht laden."}</div>`;
      return;
    }
    if (x === "gif") {
      box.innerHTML = `<div class="cf-xpnote">Lade GIFs …</div>`;
      const d = await this.gifData(q); if (token !== this._xpTok) return;
      if (d.fehler) { box.innerHTML = `<div class="cf-xpnote">${esc(d.fehler)}</div>`; return; }
      let html = "";
      if (!q && d.cats && d.cats.length) html += `<div class="cf-gifs">` + d.cats.map((c) => `<button class="cf-cat" data-gq="${esc(c.name)}"><img loading="lazy" src="${esc(c.src)}" alt=""><span>${esc(c.name)}</span></button>`).join("") + "</div>";
      if (d.gifs && d.gifs.length) html += (q ? "" : `<div class="cf-xpsec">Angesagt</div>`) + `<div class="cf-gifs">` + d.gifs.map((g) => `<button data-gif="${esc(g.url)}" title="${esc(g.title || "")}"><img loading="lazy" src="${esc(g.gif_src || g.preview || g.src)}" alt="" style="aspect-ratio:${+g.width || 1}/${+g.height || 1}"></button>`).join("") + "</div>";
      box.innerHTML = html || `<div class="cf-xpnote">Keine GIFs gefunden.</div>`;
      return;
    }
    if (x === "sticker") {
      box.innerHTML = `<div class="cf-xpnote">Lade Sticker …</div>`;
      const d = await this.stickerData(); if (token !== this._xpTok) return;
      const match = (s) => !q || (s.name || "").toLowerCase().includes(q) || (s.tags || "").toLowerCase().includes(q);
      const tile = (s) => s.format_type === 3 ? `<button data-stk="${s.id}" title="${esc(s.name)}"><div class="cf-lot" data-lot="${s.id}"></div></button>` : `<button data-stk="${s.id}" title="${esc(s.name)}"><img loading="lazy" src="${esc(this.stickerUrl(s))}" alt="${esc(s.name)}"></button>`;
      let html = "";
      if (this.nitro()) for (const g of d.guilds) { const l = g.list.filter(match); if (!l.length) continue; html += `<div class="cf-xpsec">${g.icon ? `<img src="${esc(g.icon)}" alt="">` : ""}${esc(g.name)}</div><div class="cf-stk">${l.map(tile).join("")}</div>`; }
      for (const p of d.packs) { const l = p.list.filter(match); if (!l.length) continue; html += `<div class="cf-xpsec">${esc(p.name)}</div><div class="cf-stk">${l.map(tile).join("")}</div>`; }
      if (!this.nitro() && d.guilds.length) html += `<div class="cf-xpnote">Server-Sticker gehen in Direktnachrichten nur mit Nitro.</div>`;
      box.innerHTML = html || `<div class="cf-xpnote">${q ? "Kein Sticker gefunden." : "Sticker ließen sich nicht laden."}</div>`;
      this.xpLottie();
    }
  }
  /* Animierte Discord-Sticker (Lottie) erst zeichnen, wenn sie zu sehen sind; abspielen beim Drüberfahren */
  xpLottie() {
    let L = null; try { L = BdApi.Webpack.getByKeys("loadAnimation"); } catch {}
    const tiles = this.$xpb.querySelectorAll("[data-lot]"); if (!tiles.length) return;
    if (!L) { tiles.forEach((t) => { t.textContent = (t.parentElement.title || "Sticker"); }); return; }
    this._lots = this._lots || [];
    this._lio = new IntersectionObserver((ents) => { for (const en of ents) { if (!en.isIntersecting) continue; const t = en.target; this._lio.unobserve(t);
      try { t._anim = L.loadAnimation({ container: t, renderer: "svg", loop: true, autoplay: false, path: `https://discord.com/stickers/${t.dataset.lot}.json` }); this._lots.push(t._anim); } catch { t.textContent = t.parentElement.title; } } }, { root: this.$xpb });
    tiles.forEach((t) => this._lio.observe(t));
  }
  msgLottie(box) {
    for (const a of this._mlots || []) { try { a.destroy(); } catch {} } this._mlots = [];
    const tiles = box.querySelectorAll("[data-lotm]"); if (!tiles.length) return;
    let L = null; try { L = BdApi.Webpack.getByKeys("loadAnimation"); } catch {}
    tiles.forEach((t) => { if (!L) { t.textContent = "🏷️ " + t.title; return; }
      try { this._mlots.push(L.loadAnimation({ container: t, renderer: "svg", loop: true, autoplay: true, path: `https://discord.com/stickers/${t.dataset.lotm}.json` })); } catch { t.textContent = "🏷️ " + t.title; } });
  }
  insertText(t) {
    const a = this.$input; if (!a) return;
    const st = a.selectionStart ?? a.value.length, en = a.selectionEnd ?? st;
    a.setRangeText(t, st, en, "end"); this.autoGrow(); a.focus();
  }
  async xpPick(e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ue) { this.insertText(b.dataset.ue); if (!e.shiftKey) this.xpClose(); return; }
    if (b.dataset.ce) { this.insertText(`<${b.dataset.a ? "a" : ""}:${b.dataset.n}:${b.dataset.ce}> `); if (!e.shiftKey) this.xpClose(); return; }
    if (b.dataset.gq) { this.$xpq.value = b.dataset.gq; this.xpRender(); return; }
    const cid = this.s.active; if (!cid) return;
    if (b.dataset.gif) { this.xpClose(); this.stick = true; await this.send(cid, b.dataset.gif); return; }
    if (b.dataset.stk) { this.xpClose(); this.stick = true; await this.sendSticker(cid, b.dataset.stk); }
  }
  async sendSticker(cid, id) {
    try { if (this.MsgActions && this.MsgActions.sendStickers) { await this.MsgActions.sendStickers(cid, [id], ""); return true; } } catch (e) { console.error("[Chatfenster] Sticker", e); }
    try { if (this.Http && this.Http.post) { await this.Http.post({ url: `/channels/${cid}/messages`, body: { sticker_ids: [id], content: "" } }); return true; } } catch (e) { console.error("[Chatfenster] Sticker", e); }
    BdApi.UI.showToast("Sticker ließ sich nicht senden", { type: "error" }); return false;
  }

  /* ================= Hintergrundbild vom Theme ================= */
  themeWall() {
    const read = (el, pseudo) => { try { return el ? getComputedStyle(el, pseudo) : null; } catch { return null; } };
    const am = document.getElementById("app-mount");
    const list = [[read(am, "::before"), true], [read(am), false], [read(document.body), false], [read(document.documentElement), false]];
    for (const [cs, inset] of list) {
      if (!cs) continue;
      const bi = cs.backgroundImage;
      if (!bi || bi === "none" || !/url\(/.test(bi)) continue;
      const n = (v) => { const x = parseFloat(v); return inset && isFinite(x) ? x : 0; };
      return { image: bi, size: cs.backgroundSize, pos: cs.backgroundPosition, repeat: cs.backgroundRepeat,
        filter: cs.filter && cs.filter !== "none" ? cs.filter : "", left: n(cs.left), top: n(cs.top), right: n(cs.right), bottom: n(cs.bottom) };
    }
    return null;
  }
  /* Vorgaben aus dem Theme (Theme Studio → Chatfenster): --tscf-wall = off | own | theme, dazu Bild, Unschärfe, Abdunkeln */
  wallPrefs() {
    let cs = null; try { cs = getComputedStyle(document.documentElement); } catch {}
    const v = (n) => (cs ? cs.getPropertyValue("--tscf-" + n) : "").trim();
    return { mode: v("wall"), img: v("wall-img"), blur: parseFloat(v("wall-blur")) || 0, dim: Math.max(0, Math.min(0.95, parseFloat(v("wall-dim")) || 0)) };
  }
  applyWall() {
    const el = this.$wall; if (!el || !this.win) return;
    const p = this.wallPrefs();
    let w = null;
    if (this.s.wall && p.mode !== "off") {
      if (p.mode === "own" && /url\(/.test(p.img)) w = { image: p.img, size: "cover", pos: "center", repeat: "no-repeat", filter: "", own: true };
      if (!w) w = this.themeWall();
    }
    this._wall = w;
    this.win.classList.toggle("cf-haswall", !!w);
    this.win.classList.toggle("cf-solid", p.mode === "off");
    if (!w) { if (el._img) { el.style.backgroundImage = "none"; el._img = null; } return; }
    const img = p.dim ? `linear-gradient(rgba(0,0,0,${p.dim}), rgba(0,0,0,${p.dim})), ${w.image}` : w.image;
    if (el._img !== img) { el.style.backgroundImage = img; el._img = img; }
    el.style.backgroundSize = p.dim ? "100% 100%, " + w.size : w.size;
    el.style.backgroundPosition = p.dim ? "0 0, " + w.pos : w.pos;
    el.style.backgroundRepeat = p.dim ? "no-repeat, " + w.repeat : w.repeat;
    el.style.filter = [w.filter, p.blur ? `blur(${p.blur}px)` : ""].filter(Boolean).join(" ");
    el.style.transform = w.own && p.blur ? "scale(1.06)" : "";   /* sonst werden die Ränder beim Weichzeichnen hell */
    this.updateWallPos();
  }
  updateWallPos() {
    const el = this.$wall, w = this._wall; if (!el || !w || !this.win) return;
    if (this.popped || w.own) { Object.assign(el.style, { left: "0px", top: "0px", width: "100%", height: "100%" }); return; }
    const r = this.win.getBoundingClientRect(), b = this.win.clientLeft || 0;
    el.style.left = (w.left - r.left - b) + "px"; el.style.top = (w.top - r.top - b) + "px";
    el.style.width = (window.innerWidth - w.left - w.right) + "px"; el.style.height = (window.innerHeight - w.top - w.bottom) + "px";
  }

  /* ================= Herauslösen (eigenes Windows-Fenster) ================= */
  native(cmd, val) {
    try { const N = window.ThemeStudioNative; return N && N.sync ? N.sync("popout", [POPNAME, cmd, val]) : null; } catch { return null; }
  }
  popOut() {
    if (this.popped) { this.focusPop(); return; }
    const ping = this.native("ping");
    if (!ping || !ping.version) {
      BdApi.UI.showToast("Herauslösen braucht den Discord-Mod von Theme Studio ab Version 1.1 – Discord einmal ganz beenden (Taskleisten-Symbol → Beenden) und neu starten.", { type: "error", timeout: 9000 });
      return;
    }
    if (!this.win) this.build();
    const s = this.s, r = this.win.getBoundingClientRect();
    const w = s.pw || Math.round(r.width) || s.w, h = s.ph || Math.round(r.height) || s.h;
    const x = s.px != null ? s.px : Math.round(window.screenX + r.left + 30), y = s.py != null ? s.py : Math.round(window.screenY + r.top + 30);
    const pop = window.open("about:blank", POPNAME, `width=${w},height=${h},left=${x},top=${y}`);
    if (!pop) { BdApi.UI.showToast("Fenster konnte nicht geöffnet werden", { type: "error" }); return; }
    this.savePos();
    this.pop = pop;
    const d = pop.document;
    d.open(); d.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Chatfenster</title></head><body></body></html>'); d.close();
    // Discords Aussehen (Schriften, Theme, Farben) ins neue Fenster mitnehmen
    d.documentElement.className = document.documentElement.className;
    const hs = document.documentElement.getAttribute("style"); if (hs) d.documentElement.setAttribute("style", hs);
    d.body.className = document.body.className;
    for (const n of document.querySelectorAll('link[rel="stylesheet"], style')) {
      try {
        if (n.tagName === "LINK") { const l = d.createElement("link"); l.rel = "stylesheet"; l.href = n.href; d.head.appendChild(l); }
        else { const st = d.createElement("style"); st.textContent = n.textContent; d.head.appendChild(st); }
      } catch {}
    }
    const base = d.createElement("style");
    base.textContent = "html,body{margin:0;height:100%;overflow:hidden;background:var(--background-tertiary,#111214)}";
    d.head.appendChild(base);
    this.popped = true;
    d.body.appendChild(d.adoptNode(this.win));
    this.win.classList.add("cf-popped");
    this.win.hidden = false;
    const btn = this.win.querySelector(".cf-popbtn");
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICON.dock}"/></svg>`; btn.title = "Zurück ins Discord-Fenster";
    this._popClose = () => this.dock(true);
    pop.addEventListener("pagehide", this._popClose);
    pop.addEventListener("beforeunload", this._popClose);
    pop.addEventListener("keydown", this._key, true);
    this._popResize = () => { clearTimeout(this._prt); this._prt = setTimeout(() => this.savePopPos(), 400); };
    pop.addEventListener("resize", this._popResize);
    this.applyLook(); this.applyWall(); this.applyFit();
    if (s.top) this.setTop(true); else this.syncPin();
    this.stick = true;
    this.renderAll(true);
    setTimeout(() => { try { this.$input.focus(); } catch {} }, 50);
  }
  savePopPos() {
    const p = this.pop; if (!p || p.closed) return;
    try { Object.assign(this.s, { px: p.screenX, py: p.screenY, pw: p.innerWidth, ph: p.innerHeight }); this.save(); } catch {}
  }
  dock(fromClose) {
    if (!this.popped) return;
    const pop = this.pop;
    this.savePopPos();
    this.popped = false; this.pop = null;
    try { pop.removeEventListener("keydown", this._key, true); pop.removeEventListener("pagehide", this._popClose); pop.removeEventListener("beforeunload", this._popClose); pop.removeEventListener("resize", this._popResize); } catch {}
    if (this.win) {
      document.body.appendChild(document.adoptNode(this.win));
      this.win.classList.remove("cf-popped");
      this.win.hidden = true;
      const btn = this.win.querySelector(".cf-popbtn");
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICON.popout}"/></svg>`; btn.title = "Herauslösen – eigenes Fenster, z. B. für den zweiten Bildschirm";
      this.applyLook(); this.applyWall(); this.applyFit();
    }
    if (!fromClose && pop && !pop.closed) { try { pop.close(); } catch {} }
  }
  focusPop() { this.native("focus"); }
  setTop(v) {
    this.s.top = !!v; this.save();
    if (this.popped) this.native("top", this.s.top);
    this.syncPin();
  }
  syncPin() {
    const b = this.win && this.win.querySelector(".cf-pin"); if (!b) return;
    b.classList.toggle("on", !!this.s.top);
    b.title = this.s.top ? "Immer im Vordergrund: an" : "Immer im Vordergrund: aus";
  }

  openChat(cid) {
    if (!cid || !this.channel(cid)) return;
    if (!this.s.tabs.includes(cid)) this.s.tabs.push(cid);
    if (this.s.tabs.length > 8) this.s.tabs = this.s.tabs.filter((t) => t === cid).concat(this.s.tabs.filter((t) => t !== cid).slice(-7));
    this.s.active = cid;
    this.save();
    this.removeNote(cid);
    this.stick = true;
    if (!this.visible()) this.show(); else this.renderAll(true);
    if (this.messages(cid).length < 20) this.load(cid);
    this.ack(cid, true);
    setTimeout(() => this.$input && this.$input.focus(), 30);
  }
  closeTab(cid) {
    this.s.tabs = this.s.tabs.filter((t) => t !== cid);
    if (this.s.active === cid) this.s.active = this.s.tabs[this.s.tabs.length - 1] || null;
    this.save();
    this.stick = true;
    this.renderAll(true);
  }
  async openUser(uid) {
    const cid = await this.dmFor(uid);
    if (cid) this.openChat(cid);
    else BdApi.UI.showToast("Chat konnte nicht geöffnet werden", { type: "error" });
  }
  async doSend() {
    const cid = this.s.active; if (!cid) return;
    const text = this.$input.value;
    if (!text.trim()) return;
    this.$send.disabled = true;
    this.stick = true;
    const ok = await this.send(cid, text);
    this.$send.disabled = false;
    if (ok) { this.$input.value = ""; this.autoGrow(); }
    this.$input.focus();
  }

  /* ================= Zeichnen ================= */
  renderAll(force) { if (!this.visible()) return; this.renderList(); this.renderTabs(); this.renderMsgs(force); }

  avatarHtml(info, cls = "") {
    if (info.icon) return `<img class="${cls}" src="${esc(info.icon)}" alt="">`;
    return `<span class="cf-letter ${cls}">${esc(info.letter || "?")}</span>`;
  }

  renderList() {
    if (!this.$list) return;
    const q = (this.$search.value || "").trim().toLowerCase();
    const items = [];
    for (const id of this.privateIds()) {
      const info = this.chatInfo(id); if (!info) continue;
      if (q && !info.name.toLowerCase().includes(q) && !(info.sub || "").toLowerCase().includes(q)) continue;
      items.push(info);
      if (items.length >= MAX_LIST) break;
    }
    if (!items.length) { this.$list._h = ""; this.$list.innerHTML = `<div class="cf-empty">${q ? "Niemand gefunden." : "Noch keine Direktnachrichten."}</div>`; return; }
    const html = items.map((i) => {
      const n = this.unread(i.id);
      return `<button class="cf-item ${i.id === this.s.active ? "on" : ""} ${n ? "unread" : ""}" data-id="${i.id}">
        <span class="cf-ava">${this.avatarHtml(i)}${i.status ? `<span class="cf-dot ${esc(i.status)}"></span>` : ""}</span>
        <span style="min-width:0"><div class="cf-nm">${esc(i.name)}</div><div class="cf-sub">${i.group ? "👥 " : ""}${esc(i.sub)}</div></span>
        ${n ? `<span class="cf-badge">${n > 99 ? "99+" : n}</span>` : "<span></span>"}
      </button>`;
    }).join("");
    if (this.$list._h !== html) { this.$list._h = html; this.$list.innerHTML = html; }
  }

  renderTabs() {
    if (!this.$tabs) return;
    this.s.tabs = this.s.tabs.filter((t) => this.channel(t));
    const html = this.s.tabs.map((cid) => {
      const i = this.chatInfo(cid);
      return `<div class="cf-tab ${cid === this.s.active ? "on" : ""} ${this.unread(cid) ? "unread" : ""}" data-id="${cid}" title="${esc(i.name)}">
        ${i.icon ? `<img src="${esc(i.icon)}" alt="">` : ""}<span>${esc(i.name)}</span>
        <button class="cf-x" title="Chat schließen"><svg viewBox="0 0 24 24"><path d="${ICON.close}"/></svg></button></div>`;
    }).join("");
    if (this.$tabs._h !== html) { this.$tabs._h = html; this.$tabs.innerHTML = html; }
  }

  fmtText(t) {
    let h = esc(t || "");
    h = h.replace(/&lt;(a?):(\w+):(\d+)&gt;/g, (m, a, n, id) => `<img class="cf-emo" alt=":${n}:" title=":${n}:" src="https://cdn.discordapp.com/emojis/${id}.${a ? "gif" : "webp"}?size=48">`);
    h = h.replace(/&lt;@!?(\d+)&gt;/g, (m, id) => `<span class="cf-mention">@${esc(this.userName(this.user(id), id))}</span>`);
    h = h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<i>$2</i>").replace(/~~(.+?)~~/g, "<s>$1</s>");
    h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
    return h.replace(/\n/g, "<br>");
  }

  dayLabel(d) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    const diff = Math.round((today - x) / 86400000);
    if (diff === 0) return "Heute";
    if (diff === 1) return "Gestern";
    return x.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  renderMsgs(force) {
    const box = this.$msgs; if (!box) return;
    const cid = this.s.active;
    const info = cid && this.chatInfo(cid);
    this.$input.disabled = this.$send.disabled = !info;
    if (!info) {
      box.innerHTML = `<div class="cf-welcome"><svg viewBox="0 0 24 24"><path d="${ICON.chat}"/></svg><p>Wähle links einen Chat aus<br>oder klick mit Rechts auf jemanden → <b>Im Chatfenster öffnen</b>.</p></div>`;
      return;
    }
    this.$input.placeholder = `Nachricht an ${info.name} …`;
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    const list = this.messages(cid);
    const meId = this.me() && this.me().id;
    let html = this.hasMore(cid) ? `<div class="cf-more">Hochscrollen für ältere Nachrichten …</div>` : "";
    if (!list.length) html += `<div class="cf-sys">${this.loading.has(cid) ? "Lade Nachrichten …" : "Noch keine Nachrichten – schreib die erste!"}</div>`;
    let lastDay = "", lastAuthor = null, lastTime = 0;
    for (const m of list) {
      const ts = new Date(m.timestamp && m.timestamp.valueOf ? m.timestamp.valueOf() : m.timestamp);
      const day = this.dayLabel(ts);
      if (day !== lastDay) { html += `<div class="cf-day">${esc(day)}</div>`; lastDay = day; lastAuthor = null; }
      const a = m.author || {};
      const imgs = [];
      for (const at of m.attachments || []) {
        const isImg = (at.content_type || "").startsWith("image/") || (at.width && at.height);
        if (isImg) imgs.push(`<img class="cf-img" loading="lazy" src="${esc(at.proxy_url || at.url)}" data-full="${esc(at.url)}" alt="">`);
        else imgs.push(`<a href="${esc(at.url)}" target="_blank" rel="noopener">📎 ${esc(at.filename || "Datei")}</a>`);
      }
      for (const em of m.embeds || []) {
        const im = em.image || (em.type === "image" || em.type === "gifv" ? em.thumbnail : null);
        const src = im && (im.proxyURL || im.proxy_url || im.url);
        if (src) imgs.push(`<img class="cf-img" loading="lazy" src="${esc(src)}" data-full="${esc(em.url || im.url || src)}" alt="">`);
      }
      for (const sk of m.stickerItems || m.sticker_items || []) {
        imgs.push(sk.format_type === 3 ? `<div class="cf-lot cf-lotmsg" data-lotm="${sk.id}" title="${esc(sk.name || "Sticker")}"></div>` : `<img class="cf-img" style="max-width:140px" src="${esc(this.stickerUrl(sk))}" alt="">`);
      }
      const content = m.content || "";
      if (!content && !imgs.length) {
        if (m.type !== 0 && m.type !== 19) { html += `<div class="cf-sys">${m.type === 3 ? "📞 Anruf" : "•"}</div>`; lastAuthor = null; }
        continue;
      }
      const mine = a.id === meId;
      const cont = a.id === lastAuthor && ts - lastTime < 5 * 60000;
      const time = ts.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const u = this.user(a.id) || a;
      const showWho = info.group && !mine && !cont;
      html += `<div class="cf-row ${mine ? "me" : ""} ${cont ? "cont" : ""}">
        ${mine ? "" : cont ? '<span class="cf-gap"></span>' : `<img class="cf-mini" src="${esc(this.avatar(u, 64))}" alt="">`}
        <div class="cf-bubble">${showWho ? `<div class="cf-who">${esc(this.userName(u, a.id))}</div>` : ""}${this.fmtText(content)}${imgs.join("")}
          <div class="cf-time">${m.editedTimestamp || m.edited_timestamp ? "bearbeitet · " : ""}${time}${m.state === "SENDING" ? " · …" : m.state === "SEND_FAILED" ? " · ⚠ nicht gesendet" : ""}</div></div>
      </div>`;
      lastAuthor = a.id; lastTime = ts;
    }
    const keep = this.keepFromBottom;
    box.innerHTML = html;
    this.msgLottie(box);
    if (keep) { box.scrollTop = box.scrollHeight - keep; this.keepFromBottom = 0; }
    else if (force || this.stick || atBottom) box.scrollTop = box.scrollHeight;
    this.stick = false;
    // Bilder laden später – danach unten bleiben
    if (force || atBottom) box.querySelectorAll("img").forEach((im) => { if (!im.complete) im.addEventListener("load", () => { if (box.scrollHeight - box.scrollTop - box.clientHeight < 300) box.scrollTop = box.scrollHeight; }, { once: true }); });
  }

  /* ================= Hinweise über der Sprachverbindung ================= */
  placeNotes() {
    const panels = document.querySelector('section[class*="panels_"]') || document.querySelector('[class*="panels_"]');
    if (!panels) return;
    if (!this.$notes) { this.$notes = document.createElement("div"); this.$notes.id = "cf-notes"; this.$notes.onclick = (e) => this.onNoteClick(e);
      if (this.s.fit && this._fitCols) for (const k in this._fitCols) this.$notes.style.setProperty("--tscf-" + k, this._fitCols[k]); }
    /* Manche Themes schneiden den Balken unten links mit clip-path aus (z. B. „rund mit Abstand“) – Hinweis darunter rücken, sonst ist er oben abgeschnitten */
    let cut = this._cut || 0;
    if (this._cutEl !== panels || Date.now() - (this._cutAt || 0) > 30000) {   /* Stil lesen kostet mit großen Themes Zeit – höchstens alle 30 s */
      cut = 0; try { const cs = getComputedStyle(panels), m = /inset\(\s*([\d.]+)px/.exec(cs.clipPath || ""); if (m) cut = Math.max(0, (parseFloat(m[1]) || 0) + 4 - (parseFloat(cs.paddingTop) || 0)); } catch {}   /* Theme Studio rückt den Inhalt ab 26.11. selbst ein (padding) – dann nichts doppelt */
      this._cut = cut; this._cutEl = panels; this._cutAt = Date.now(); }
    const mt = cut ? Math.ceil(cut) + "px" : "", mx = cut > 8 ? Math.ceil(cut) + "px" : "";
    if (this.$notes.style.marginTop !== mt) this.$notes.style.marginTop = mt;
    if (this.$notes.style.marginLeft !== mx) { this.$notes.style.marginLeft = mx; this.$notes.style.marginRight = mx; }
    const rtc = panels.querySelector('[class*="rtcConnectionStatus"]');
    let anchor = null;
    if (rtc) { anchor = rtc; while (anchor.parentElement && anchor.parentElement !== panels) anchor = anchor.parentElement; }
    if (anchor && anchor.parentElement === panels) { if (this.$notes.nextSibling !== anchor) panels.insertBefore(this.$notes, anchor); }
    else {
      // ohne Sprachverbindung: direkt über dem eigenen Profil (letzter Eintrag)
      const last = panels.lastElementChild;
      if (last && last !== this.$notes && this.$notes.nextSibling !== last) panels.insertBefore(this.$notes, last);
      else if (!this.$notes.isConnected) panels.appendChild(this.$notes);
    }
  }
  addNote(cid, msg) {
    const info = this.chatInfo(cid); if (!info) return;
    const a = msg.author || {};
    const u = this.user(a.id) || a;
    let preview = msg.content || ((msg.attachments || []).length ? "📷 Bild/Datei" : (msg.sticker_items || msg.stickerItems || []).length ? "Sticker" : "…");
    preview = preview.replace(/<a?:(\w+):\d+>/g, ":$1:").replace(/<@!?(\d+)>/g, (m, id) => "@" + this.userName(this.user(id), id));
    const title = info.group ? `${this.userName(u, a.id)} in ${info.name}` : info.name;
    const old = this.notes.get(cid);
    const count = old ? old.count + 1 : 1;
    this.notes.delete(cid);
    this.notes.set(cid, { cid, title, preview, icon: this.avatar(u, 64), count });
    while (this.notes.size > MAX_NOTES) this.notes.delete(this.notes.keys().next().value);
    this.renderNotes(cid);
  }
  removeNote(cid) { if (this.notes.delete(cid)) this.renderNotes(); }
  renderNotes(fresh) {
    this.placeNotes();
    if (!this.$notes) return;
    const list = [...this.notes.values()].reverse();
    const html = list.map((n) => `
      <div class="cf-note" data-id="${n.cid}" ${n.cid === fresh ? "" : 'style="animation:none"'}>
        <img src="${esc(n.icon)}" alt="">
        <div style="min-width:0"><div class="cf-nt">💬 ${n.count > 1 ? n.count + " neue Nachrichten" : "Neue Nachricht"}</div>
          <div class="cf-nn">${esc(n.title)}</div><div class="cf-np">${esc(n.preview)}</div></div>
        <button class="cf-nx" title="Ausblenden"><svg viewBox="0 0 24 24"><path d="${ICON.close}"/></svg></button>
      </div>`).join("");
    if (this.$notes._h !== html) { this.$notes._h = html; this.$notes.innerHTML = html; }
  }
  onNoteClick(e) {
    const n = e.target.closest(".cf-note"); if (!n) return;
    if (e.target.closest(".cf-nx")) { this.removeNote(n.dataset.id); return; }
    this.openChat(n.dataset.id);
  }

  /* ================= Discord-Ereignisse ================= */
  onMessage(ev) {
    const cid = ev.channelId || (ev.message && ev.message.channel_id);
    const ch = cid && this.channel(cid);
    if (!ch || (ch.type !== 1 && ch.type !== 3)) return;
    const msg = ev.message || {};
    const mine = msg.author && this.me() && msg.author.id === this.me().id;
    if (ev.type === "MESSAGE_CREATE" && !mine && !ev.optimistic) {
      const lookingAt = this.visible() && this.s.active === cid && this.doc().hasFocus();
      const inDiscord = document.hasFocus() && this.SelectedStore && this.SelectedStore.getChannelId && this.SelectedStore.getChannelId() === cid;
      if (lookingAt) setTimeout(() => this.ack(cid), 300);
      else if (this.s.notify && !inDiscord && !this.muted(cid) && (ch.type === 1 || this.s.groups)) this.addNote(cid, msg);
    }
    this.queueRender(cid === this.s.active);
  }
  queueRender(withMsgs) {
    this._needMsgs = this._needMsgs || withMsgs;
    if (this._rq) return;
    this._rq = setTimeout(() => {
      this._rq = null;
      this.updateBadges();
      if (!this.visible()) return;
      this.renderList(); this.renderTabs();
      if (this._needMsgs) this.renderMsgs(false);
      this._needMsgs = false;
    }, 80);
  }

  subscribe() {
    const d = this.Dispatcher; if (!d || !d.subscribe) return;
    this.subs = [
      ["MESSAGE_CREATE", (e) => this.onMessage(e)],
      ["MESSAGE_UPDATE", (e) => this.onMessage(e)],
      ["MESSAGE_DELETE", (e) => this.onMessage(e)],
      ["LOAD_MESSAGES_SUCCESS", (e) => { if (e.channelId === this.s.active) this.queueRender(true); }],
      ["MESSAGE_ACK", (e) => { if (e.channelId) this.removeNote(e.channelId); this.queueRender(false); }],
      ["CHANNEL_SELECT", (e) => { if (e.channelId) this.removeNote(e.channelId); }],
      ["PRESENCE_UPDATES", () => { if (!this.visible()) return; clearTimeout(this._pt); this._pt = setTimeout(() => this.queueRender(false), 1500); }],
    ];
    for (const [t, f] of this.subs) { try { d.subscribe(t, f); } catch {} }
  }
  unsubscribe() {
    const d = this.Dispatcher; if (!d || !this.subs) return;
    for (const [t, f] of this.subs) { try { d.unsubscribe(t, f); } catch {} }
    this.subs = null;
  }

  /* ================= Chat-Symbol im Nachrichtenfeld ================= */
  injectComposer() {
    this._cq = false;
    const wraps = document.querySelectorAll('[class*="channelTextArea_"] [class*="attachWrapper_"], [class*="channelTextArea_"] [class*="attachButton_"]');
    for (const a0 of wraps) {
      if (a0.closest("#cf-win")) continue;
      const area = a0.closest('[class*="channelTextArea_"]'); if (!area) continue;
      // die Zeile suchen, in der Plus und Eingabefeld nebeneinander stehen
      let a = a0;
      while (a.parentElement && a.parentElement !== area && !a.parentElement.querySelector('[role="textbox"], textarea, [class*="textArea_"]')) a = a.parentElement;
      const box = a.parentElement; if (!box) continue;
      // falsch sitzende Knöpfe (ältere Version) wegräumen
      area.querySelectorAll(".cf-cbtn").forEach((x) => { if (x.parentElement !== box) x.remove(); });
      if (box.querySelector(":scope > .cf-cbtn")) continue;
      const b = document.createElement("button");
      b.type = "button"; b.className = "cf-cbtn"; b.title = this.s.hotkey ? "Chatfenster (Strg + Umschalt + C)" : "Chatfenster"; b.setAttribute("aria-label", "Chatfenster");
      b.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICON.chat}"/></svg><span class="cf-cnum"></span>`;
      b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); this.toggle(); this.updateBadges(); });
      b._plus = a;
      box.insertBefore(b, a);
    }
    // Höhe und Lage vom Plus übernehmen, damit beide genau auf einer Linie sitzen
    for (const b of document.querySelectorAll(".cf-cbtn")) this.alignToPlus(b);
    this.updateBadges();
  }
  alignToPlus(b) {
    const a = b._plus; if (!a || !a.isConnected) return;
    /* Nachmessen erzwingt in Discord eine komplette Neuberechnung des Layouts (mit großen Themes über 100 ms) – darum nur, bis es sitzt */
    if (b._ok === window.innerWidth + "x" + window.innerHeight) return;
    if ((b._tries = (b._tries || 0) + 1) > 6) { b._ok = window.innerWidth + "x" + window.innerHeight; return; }
    try {
      const cs = getComputedStyle(a), h = a.offsetHeight;
      const want = { alignSelf: cs.alignSelf === "auto" ? "" : cs.alignSelf, marginTop: cs.marginTop, marginBottom: cs.marginBottom,
        height: h ? h + "px" : "", position: cs.position === "sticky" ? "sticky" : "", top: cs.position === "sticky" ? cs.top : "" };
      for (const k in want) if (b.style[k] !== want[k]) b.style[k] = want[k];
      // Plus-Symbol selbst: dessen Mitte bestimmt die Mitte unseres Symbols
      const icon = a.querySelector("svg") || a, mineEl = b.querySelector("svg");
      const ri = icon.getBoundingClientRect(), rm = mineEl.getBoundingClientRect();
      if (ri.height && rm.height) {
        const diff = Math.round((ri.top + ri.height / 2) - (rm.top + rm.height / 2));
        if (Math.abs(diff) >= 1) {
          const nv = Math.max(-20, Math.min(20, (parseFloat(b.dataset.shift || "0") || 0) + diff));
          b.dataset.shift = String(nv);
          b.style.paddingTop = nv > 0 ? nv * 2 + "px" : "";
          b.style.paddingBottom = nv < 0 ? -nv * 2 + "px" : "";
        } else b._ok = window.innerWidth + "x" + window.innerHeight;
      }
    } catch {}
  }
  queueComposer() { if (this._cq) return; this._cq = true; requestAnimationFrame(() => this.injectComposer()); }
  totalUnread() {
    let n = 0;
    try { for (const id of this.privateIds()) { if (!this.muted(id)) n += this.unread(id); } } catch {}
    return n;
  }
  updateBadges() {
    const btns = document.querySelectorAll(".cf-cbtn"); if (!btns.length) return;
    const n = this.totalUnread(), txt = n ? (n > 99 ? "99+" : String(n)) : "", on = this.visible();
    for (const b of btns) { const c = b.querySelector(".cf-cnum"); if (c.textContent !== txt) c.textContent = txt; b.classList.toggle("on", on); }
  }

  /* ================= Rechtsklick-Menü ================= */
  fiberOf(el) {
    if (!el) return null;
    const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$") || x.startsWith("__reactInternalInstance$"));
    return k ? el[k] : null;
  }
  userFromFiber(el, depth = 40) {
    let f = this.fiberOf(el);
    for (let i = 0; f && i < depth; i++, f = f.return) {
      const p = f.memoizedProps;
      if (p) {
        if (p.user && p.user.id && (p.user.username || p.user.discriminator)) return p.user.id;
        if (typeof p.userId === "string" && /^\d{15,}$/.test(p.userId)) return p.userId;
        if (p.message && p.message.author && p.message.author.id && p.message.author.username) return p.message.author.id;
      }
    }
    return null;
  }
  onContextMenu(e) {
    let el = e.target;
    this.ctxUser = null;
    for (let i = 0; el && i < 15 && !this.ctxUser; i++, el = el.parentElement) this.ctxUser = this.userFromFiber(el, 25);
  }
  injectMenuItem(menu) {
    if (!menu || menu.querySelector("#user-context-cf-open")) return;
    const msgItem = menu.querySelector('#user-context-message-user, [id$="-message-user"]');
    if (!msgItem) return;
    const uid = this.userFromFiber(menu, 60) || this.userFromFiber(msgItem, 60) || this.ctxUser;
    if (!uid || (this.me() && uid === this.me().id)) return;
    const item = msgItem.cloneNode(true);
    item.id = "user-context-cf-open";
    item.removeAttribute("aria-disabled");
    item.className = item.className.split(/\s+/).filter((c) => !/focused|disabled/i.test(c)).join(" ");
    const label = item.querySelector('[class*="label"]') || item;
    label.textContent = "Im Chatfenster öffnen";
    item.querySelectorAll('[class*="iconContainer"], svg').forEach((n) => n.remove());
    item.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      this.closeMenu();
      this.openUser(uid);
    }, true);
    msgItem.after(item);
  }
  closeMenu() {
    try { if (this.CtxActions && this.CtxActions.closeContextMenu) { this.CtxActions.closeContextMenu(); return; } } catch {}
    try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true })); } catch {}
  }
  watchMenus() {
    this._ctx = (e) => this.onContextMenu(e);
    document.addEventListener("contextmenu", this._ctx, true);
    this.mo = new MutationObserver((muts) => {
      let compose = false;
      for (const m of muts) {
        const t = m.target; if (!m.addedNodes.length || (t.closest && t.closest("#cf-win, #cf-notes"))) continue;   /* eigene Änderungen überspringen */
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (!compose && typeof n.className === "string" && /channelTextArea|attach|form_|chatContent|inner_|chat_|content_/.test(n.className)) compose = true;
        }
      }
      /* Rechtsklick-Menü: ein Blick per ID ist viel schneller als in jedem neuen Teil zu suchen */
      const menu = document.getElementById("user-context"); if (menu) this.injectMenuItem(menu);
      if (compose) this.queueComposer();
    });
    this.mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ================= Start / Stopp ================= */
  start() {
    const missing = this.resolve();
    if (missing.length) BdApi.UI.showToast("Chatfenster: Teile von Discord nicht gefunden (" + missing.join(", ") + ")", { type: "error", timeout: 8000 });
    BdApi.DOM.addStyle(NAME, CSS);
    this.subscribe();
    this.watchMenus();
    this.injectComposer();
    this._key = (e) => {
      if (this.s.hotkey && e.ctrlKey && e.shiftKey && !e.altKey && (e.code === "KeyC" || e.key === "C" || e.key === "c")) { e.preventDefault(); e.stopPropagation(); this.toggle(); }
    };
    window.addEventListener("keydown", this._key, true);
    this._resize = () => { if (this.visible() && !this.popped) this.place(parseFloat(this.win.style.left) || 0, parseFloat(this.win.style.top) || 0); };
    window.addEventListener("resize", this._resize);
    // Hinweise sauber halten (gelesen in Discord → weg) und Platz in der Leiste sichern
    this._wt = 0;
    this.timer = setInterval(() => {
      for (const cid of [...this.notes.keys()]) if (!this.unread(cid)) this.notes.delete(cid);
      if (this.notes.size || (this.$notes && this.$notes.isConnected)) this.renderNotes();
      if (this.visible() && this.s.active && this.doc().hasFocus()) this.ack(this.s.active);
      if (this.popped && (!this.pop || this.pop.closed)) this.dock(true);
      this.injectComposer();
      if (this.visible() && !this.popped && ++this._wt % 5 === 0) { this.applyWall(); if (this.s.fit) this.applyFit(); }   // Theme gewechselt?
    }, 2000);
  }
  stop() {
    this.dock(false);
    this.unsubscribe();
    clearInterval(this.timer); clearTimeout(this._rq); clearTimeout(this._pt);
    if (this.mo) this.mo.disconnect();
    if (this.ro) this.ro.disconnect();
    document.removeEventListener("contextmenu", this._ctx, true);
    window.removeEventListener("keydown", this._key, true);
    window.removeEventListener("resize", this._resize);
    if (this.win) { this.savePos(); this.win.remove(); this.win = null; }
    if (this.$notes) { this.$notes.remove(); this.$notes = null; }
    const item = document.getElementById("user-context-cf-open"); if (item) item.remove();
    document.querySelectorAll(".cf-cbtn").forEach((b) => b.remove());
    BdApi.DOM.removeStyle(NAME);
  }

  getSettingsPanel() {
    const s = this.s;
    const root = document.createElement("div");
    root.style.cssText = "padding:8px 4px;color:var(--text-normal,#ddd);font-size:14px;display:flex;flex-direction:column;gap:14px;";
    const head = document.createElement("div");
    head.style.cssText = "font-weight:700;font-size:16px;color:var(--brand-500,#5865f2);";
    head.textContent = "Chatfenster";
    const check = (label, hint, key, after) => {
      const l = document.createElement("label");
      l.style.cssText = "display:flex;gap:10px;align-items:flex-start;cursor:pointer;";
      const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!s[key];
      cb.style.cssText = "width:18px;height:18px;margin-top:2px;accent-color:var(--brand-500,#5865f2);";
      cb.onchange = () => { s[key] = cb.checked; this.save(); if (after) after(); };
      const t = document.createElement("div");
      t.innerHTML = `<b>${esc(label)}</b><div style="opacity:.7;font-size:13px">${esc(hint)}</div>`;
      l.append(cb, t); return l;
    };
    const btn = (label, fn) => {
      const b = document.createElement("button"); b.textContent = label;
      b.style.cssText = "align-self:flex-start;padding:8px 12px;border-radius:8px;border:1px solid var(--brand-500,#5865f2);background:transparent;color:var(--brand-500,#5865f2);font-weight:700;cursor:pointer;";
      b.onclick = fn; return b;
    };
    const info = document.createElement("div");
    info.style.cssText = "opacity:.75;line-height:1.5;";
    info.innerHTML = "Öffnen: Chat-Symbol vor dem Plus im Nachrichtenfeld oder Rechtsklick auf einen Nutzer → <b>Im Chatfenster öffnen</b>.<br>Das Fenster lässt sich an der Kopfzeile verschieben und unten rechts größer ziehen.";
    root.append(head,
      check("Hinweis bei neuen Nachrichten", "Erscheint über der Sprachverbindung. Klick darauf öffnet den Chat.", "notify", () => { if (!s.notify) { this.notes.clear(); this.renderNotes(); } }),
      check("Gruppen-Chats anzeigen", "Gruppen-DMs erscheinen mit in der Liste links.", "groups", () => this.renderAll()),
      check("Tastenkürzel Strg + Umschalt + C", "Öffnet und schließt das Chatfenster. Ab Werk aus, damit es keiner anderen Taste in die Quere kommt.", "hotkey", () => document.querySelectorAll(".cf-cbtn").forEach((b) => { b.title = this.s.hotkey ? "Chatfenster (Strg + Umschalt + C)" : "Chatfenster"; })),
      (() => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;flex-direction:column;gap:6px;";
        const t = document.createElement("b"); t.textContent = "Deckkraft des Fensters";
        const line = document.createElement("div"); line.style.cssText = "display:flex;gap:10px;align-items:center;";
        const r = document.createElement("input"); r.type = "range"; r.min = 30; r.max = 100; r.step = 5; r.value = s.opacity;
        r.style.cssText = "flex:1;accent-color:var(--brand-500,#5865f2);";
        const v = document.createElement("span"); v.textContent = s.opacity + " %"; v.style.minWidth = "44px";
        r.oninput = () => { s.opacity = +r.value; v.textContent = s.opacity + " %"; this.applyLook(); };
        r.onchange = () => this.save();
        line.append(r, v); row.append(t, line); return row;
      })(),
      check("Hintergrundbild im Fenster", "Zeigt im Fenster das Hintergrundbild deines Themes – oder das eigene Bild, das im Theme Studio unter „Chatfenster“ eingestellt ist.", "wall", () => this.applyWall()),
      check("Farben vom aktuellen Theme", "Übernimmt Akzent, Flächen und Schrift vom Theme, das gerade in Discord läuft – auch nach einem Theme-Wechsel. Aus: Farben aus dem Theme Studio (Discord → Chatfenster).", "fit", () => { this.applyFit(true); if (this.win) this.syncPop(); }),
      check("Hintergrund weichzeichnen", "Bei weniger als 100 % Deckkraft wird alles hinter dem Fenster verschwommen – so bleibt der Text gut lesbar.", "blur", () => this.applyLook()),
      info,
      btn("Fenster öffnen", () => this.show()),
      btn("Fensterposition zurücksetzen", () => { Object.assign(s, { x: null, y: null, w: DEFAULTS.w, h: DEFAULTS.h }); this.save(); if (this.win) { this.win.style.width = s.w + "px"; this.win.style.height = s.h + "px"; this.place(window.innerWidth - s.w - 40, 80); } }));
    return root;
  }
};
