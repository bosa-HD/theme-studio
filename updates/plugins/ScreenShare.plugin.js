/**
 * @name ScreenShare
 * @author BOSA
 * @version 1.9.0
 * @description Globale Hotkeys: (1) ganzen Bildschirm im Sprachkanal übertragen (an/aus) und (2) Komplett-Stumm per Taste – halten oder umschalten (Mikro + Ton) und (3) Nur-Mikro-Stumm per Taste (halten oder umschalten). Mehrere Tasten pro Funktion, jede wahlweise nur aktiv in einem bestimmten Spiel. Monitor für die Übertragung wählbar, eigene Taste zum Monitor-Wechseln während der Übertragung und eine eigene Taste je Monitor (z. B. Taste für Bildschirm 4).
 */

const IDS = { screen: 1984001, switch: 1984004 };
const BIND_BASE = { deafen: 1984200, mute: 1984300, mon: 1984400 };
const BOTH_SCREENS = "screen:-1:0"; // WebRTC: -1 = kompletter Desktop über alle Monitore
const DEFAULTS = {
  screen: { shortcut: [], label: "nicht belegt" },   // ab Werk keine Taste – jeder legt seine selbst fest
  switch: { shortcut: [], label: "nicht belegt" },
  deafen: { binds: [], mode: "hold", enabled: true },
  mute: { binds: [], mode: "hold", enabled: true },
  screenId: "screen:0:0",
  screenName: "Bildschirm 1",
  monKeys: {},           // Taste je Monitor: { "screen:3:0": { shortcut, label } }
  toasts: true,
};

const MOD_VK = {
  ControlLeft: 162, ControlRight: 163,
  ShiftLeft: 160, ShiftRight: 161,
  AltLeft: 164, AltRight: 165,
  MetaLeft: 91, MetaRight: 92,
};
const MOD_LABEL = {
  ControlLeft: "Strg", ControlRight: "Rechts-Strg",
  ShiftLeft: "Umschalt", ShiftRight: "Rechts-Umschalt",
  AltLeft: "Alt", AltRight: "Alt Gr",
  MetaLeft: "Win", MetaRight: "Rechts-Win",
};
// Discord-Format: [1, n] = Maustaste. n = event.button + 1 (3 = Mausrad, 4 = Seitentaste hinten, 5 = Seitentaste vorne)
const MOUSE_LABEL = { 1: "Mausrad-Klick", 3: "Maus-Seitentaste 1 (hinten)", 4: "Maus-Seitentaste 2 (vorne)" };
const MOD_ORDER = ["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"];

module.exports = class ScreenShare {
  constructor(meta) {
    this.meta = meta;
    this.busy = false;
    this.registered = {};
    this.weDeafened = false;
    this.weMuted = false;
  }

  /* ---------- settings ---------- */
  get settings() {
    if (!this._settings) {
      const saved = BdApi.Data.load("ScreenShare", "settings") || {};
      // migrate v1.0.x
      if (saved.shortcut && !saved.screen) {
        saved.screen = { shortcut: saved.shortcut, label: saved.shortcutLabel || "?" };
        delete saved.shortcut; delete saved.shortcutLabel;
      }
      this._settings = Object.assign({}, DEFAULTS, saved);
      // Bis 1.8.0 war Strg + Umschalt + B ab Werk belegt: wer das Plugin schon benutzt hat, behält die Taste
      const OLD_SCREEN = { shortcut: [[0, 162], [0, 160], [0, 66]], label: "Strg + Umschalt + B" };
      const used = Object.keys(saved).length > 0;
      this._settings.screen = Object.assign({}, used && !saved.screen ? OLD_SCREEN : DEFAULTS.screen, saved.screen || {});
      this._settings.screen.shortcut = this.fixAltGr(this._settings.screen.shortcut);
      this._settings.switch = Object.assign({}, DEFAULTS.switch, saved.switch || {});
      this._settings.switch.shortcut = this.fixAltGr(this._settings.switch.shortcut);
      const mk = saved.monKeys && typeof saved.monKeys === "object" ? saved.monKeys : {};
      this._settings.monKeys = {};
      for (const id in mk) if (mk[id] && Array.isArray(mk[id].shortcut)) this._settings.monKeys[id] = { shortcut: this.fixAltGr(mk[id].shortcut), label: mk[id].label || "nicht belegt" };
      if (this._settings.screenId === BOTH_SCREENS) { this._settings.screenId = "screen:0:0"; this._settings.screenName = "Bildschirm 1"; }
      for (const k of ["deafen", "mute"]) {
        const f = Object.assign({}, DEFAULTS[k], saved[k] || {});
        // migrate v1.5: eine Taste -> Liste von Belegungen
        if (!Array.isArray(f.binds) || (f.shortcut && !f.binds.length)) {
          f.binds = [];
          if (Array.isArray(f.shortcut)) f.binds.push({ shortcut: f.shortcut, label: f.label || "nicht belegt", game: "" });
        }
        delete f.shortcut; delete f.label;
        if (!f.binds.length) f.binds.push({ shortcut: [], label: "nicht belegt", game: "" });
        f.binds.forEach(b => { b.shortcut = this.fixAltGr(b.shortcut); if (b.game == null) b.game = ""; });
        this._settings[k] = f;
      }
    }
    return this._settings;
  }
  saveSettings() { BdApi.Data.save("ScreenShare", "settings", this.settings); }

  // AltGr on Windows = fake left Ctrl + right Alt. Discord's native hotkey system ignores the fake Ctrl,
  // so a combo containing both 162 and 165 would never fire. Drop the 162 in that case.
  fixAltGr(sc) {
    if (!Array.isArray(sc)) return [];
    const codes = sc.map(k => k[1]);
    if (codes.includes(165) && codes.includes(162)) return sc.filter(k => k[1] !== 162);
    return sc;
  }

  /* ---------- discord internals ---------- */
  findFn(needle) {
    const mod = BdApi.Webpack.getModule(m => {
      try { return m && typeof m === "object" && Object.values(m).some(v => typeof v === "function" && String(v).includes(needle)); }
      catch { return false; }
    }, { searchExports: false });
    if (!mod) return null;
    return Object.values(mod).find(v => typeof v === "function" && String(v).includes(needle)) || null;
  }

  // All exported functions (across all modules) whose source contains `needle`.
  findAllFns(needle) {
    const out = [];
    let mods = [];
    try {
      mods = BdApi.Webpack.getModule(m => {
        try { return m && typeof m === "object" && Object.values(m).some(v => typeof v === "function" && String(v).includes(needle)); }
        catch { return false; }
      }, { first: false, searchExports: false }) || [];
    } catch {}
    if (!Array.isArray(mods)) mods = [mods];
    for (const m of mods) {
      for (const [k, v] of Object.entries(m)) {
        try { if (typeof v === "function" && String(v).includes(needle)) out.push({ key: k, fn: v, src: String(v) }); } catch {}
      }
    }
    return out;
  }

  // The real action is an async, hook-free function. Components/hooks that merely mention the same text are skipped.
  findStartStream() {
    const usesHooks = (s) => /\buse[A-Z]\w*\(|\.use(State|Effect|Memo|Callback|Ref|StateFromStores)\b/.test(s);
    const cands = this.findAllFns("no user or channel");
    this.diag.startCandidates = cands.map(c => ({ key: c.key, async: /^async/.test(c.src), hooks: usesHooks(c.src), head: c.src.slice(0, 220) }));
    const good = cands.filter(c => !usesHooks(c.src));
    const pick = good.find(c => /^async/.test(c.src)) || good[0];
    return pick ? pick.fn : null;
  }

  resolveInternals() {
    this.diag = { at: new Date().toISOString() };
    this.utils = DiscordNative.nativeModules.requireModule("discord_utils");
    this.StreamStore = BdApi.Webpack.getStore("ApplicationStreamingStore");
    this.VoiceStore = BdApi.Webpack.getStore("SelectedChannelStore");
    this.MediaStore = BdApi.Webpack.getStore("MediaEngineStore");
    this.GameStore = BdApi.Webpack.getStore("RunningGameStore");
    this.startStreamWithSource = this.findStartStream();
    this.stopStream = this.findFn('type:"STREAM_STOP"');
    const deafMod = BdApi.Webpack.getByKeys("toggleSelfDeaf");
    this.toggleSelfDeaf = deafMod ? deafMod.toggleSelfDeaf.bind(deafMod) : this.findFn('"AUDIO_TOGGLE_SELF_DEAF"');
    const muteMod = BdApi.Webpack.getByKeys("toggleSelfMute");
    this.toggleSelfMute = muteMod ? muteMod.toggleSelfMute.bind(muteMod) : this.findFn('"AUDIO_TOGGLE_SELF_MUTE"');
    const missing = [];
    if (!this.utils || !this.utils.inputEventRegister) missing.push("Hotkey-System");
    if (!this.StreamStore || !this.VoiceStore) missing.push("Stores");
    if (!this.startStreamWithSource) missing.push("Stream starten");
    if (!this.stopStream) missing.push("Stream beenden");
    if (!this.toggleSelfDeaf || !this.MediaStore) missing.push("Stummschalten");
    if (!this.toggleSelfMute || !this.MediaStore) missing.push("Mikro stumm");
    this.diag.missing = missing;
    this.diag.stopHead = this.stopStream ? String(this.stopStream).slice(0, 200) : null;
    try { BdApi.Data.save("ScreenShare", "diag", this.diag); } catch {}
    return missing;
  }

  encodeStreamKey(s) {
    if (s.streamType === "call") return ["call", s.channelId, s.ownerId].join(":");
    return ["guild", s.guildId, s.channelId, s.ownerId].join(":");
  }

  toast(msg, type = "info") {
    if (this.settings.toasts || type === "error") BdApi.UI.showToast(msg, { type });
  }

  /* ---------- screen share ---------- */
  async toggleScreen() {
    if (this.busy) return;
    this.busy = true;
    try {
      const active = this.StreamStore.getCurrentUserActiveStream();
      if (active) {
        this.stopStream(this.encodeStreamKey(active));
        this.toast("Bildschirmübertragung beendet", "info");
        return;
      }
      if (!this.VoiceStore.getVoiceChannelId()) { this.toast("Du bist in keinem Sprachkanal", "warning"); return; }
      const screen = await this.getScreen(this.settings.screenId);
      if (!screen) { this.toast("Monitor nicht gefunden – bitte in den Plugin-Einstellungen neu wählen", "error"); return; }
      const res = await this.startStreamWithSource({ id: screen.id, name: screen.name });
      if (Array.isArray(res) && res[0] === false) this.toast("Übertragung nicht möglich: " + res[1], "error");
      else { this._live = screen.id; this.toast("Übertrage " + screen.name, "success"); }
    } catch (e) {
      console.error("[ScreenShare]", e);
      try { this.diag.lastError = { at: new Date().toISOString(), msg: String(e && e.message), stack: String(e && e.stack).slice(0, 1500) }; BdApi.Data.save("ScreenShare", "diag", this.diag); } catch {}
      this.toast("Fehler: " + (e && e.message), "error");
    } finally {
      setTimeout(() => { this.busy = false; }, 800);
    }
  }

  // Wechselt auf den nächsten Monitor. Läuft gerade eine Übertragung, wird sie dort neu gestartet.
  async switchScreen() {
    if (this.busy) return;
    this.busy = true;
    try {
      const list = await this.getScreens();
      if (list.length < 2) { this.toast("Nur ein Monitor gefunden", "warning"); return; }
      const s = this.settings;
      const idx = list.findIndex(x => x.id === s.screenId);
      const next = list[(idx + 1) % list.length];
      s.screenId = next.id; s.screenName = next.name; this.saveSettings();
      if (this._monSel) { try { this._monSel.value = next.id; } catch {} }
      const active = this.StreamStore.getCurrentUserActiveStream();
      if (!active) { this.toast("Nächste Übertragung: " + next.name, "info"); return; }
      this.stopStream(this.encodeStreamKey(active));
      // warten, bis Discord die alte Übertragung wirklich beendet hat
      for (let i = 0; i < 30 && this.StreamStore.getCurrentUserActiveStream(); i++) await new Promise(res => setTimeout(res, 100));
      await new Promise(res => setTimeout(res, 400));
      if (!this.VoiceStore.getVoiceChannelId()) { this.toast("Du bist in keinem Sprachkanal", "warning"); return; }
      const res = await this.startStreamWithSource({ id: next.id, name: next.name });
      if (Array.isArray(res) && res[0] === false) this.toast("Wechsel nicht möglich: " + res[1], "error");
      else { this._live = next.id; this.toast("Übertragung gewechselt: " + next.name, "success"); }
    } catch (e) {
      console.error("[ScreenShare]", e);
      this.toast("Fehler beim Wechseln: " + (e && e.message), "error");
    } finally {
      setTimeout(() => { this.busy = false; }, 800);
    }
  }

  /* Taste eines bestimmten Monitors: keine Übertragung → diesen Monitor übertragen,
     anderer Monitor läuft → auf diesen wechseln, genau dieser läuft → Übertragung beenden */
  async screenKey(id) {
    if (this.busy) return;
    this.busy = true;
    try {
      const screen = (await this.getScreens()).find(x => x.id === id) || (await this.getScreens(true)).find(x => x.id === id);
      if (!screen) { this.toast("Dieser Monitor ist gerade nicht angeschlossen", "warning"); return; }
      const s = this.settings;
      s.screenId = screen.id; s.screenName = screen.name; this.saveSettings();
      if (this._monSel) { try { this._monSel.value = screen.id; } catch {} }
      const active = this.StreamStore.getCurrentUserActiveStream();
      if (active && this._live === screen.id) { this.stopStream(this.encodeStreamKey(active)); this._live = null; this.toast("Bildschirmübertragung beendet", "info"); return; }
      if (!this.VoiceStore.getVoiceChannelId()) { this.toast("Du bist in keinem Sprachkanal", "warning"); return; }
      if (active) {
        this.stopStream(this.encodeStreamKey(active));
        for (let i = 0; i < 30 && this.StreamStore.getCurrentUserActiveStream(); i++) await new Promise(res => setTimeout(res, 100));
        await new Promise(res => setTimeout(res, 400));
        if (!this.VoiceStore.getVoiceChannelId()) { this.toast("Du bist in keinem Sprachkanal", "warning"); return; }
      }
      const res = await this.startStreamWithSource({ id: screen.id, name: screen.name });
      if (Array.isArray(res) && res[0] === false) this.toast("Übertragung nicht möglich: " + res[1], "error");
      else { this._live = screen.id; this.toast((active ? "Übertragung gewechselt: " : "Übertrage ") + screen.name, "success"); }
    } catch (e) {
      console.error("[ScreenShare]", e);
      this.toast("Fehler: " + (e && e.message), "error");
    } finally {
      setTimeout(() => { this.busy = false; }, 800);
    }
  }

  /* Monitor-Liste vorab holen und merken: das Abfragen bei Windows dauert ein paar Sekunden, darum nicht erst beim Tastendruck */
  async getScreens(fresh) {
    if (!fresh && this._screens && Date.now() - this._screensAt < 120000) return this._screens;
    try {
      const list = await DiscordNative.desktopCapture.getDesktopCaptureSources({ types: ["screen"], thumbnailSize: { width: 1, height: 1 } });
      this._screens = (list || []).map(s => ({ id: s.id, name: s.name })); this._screensAt = Date.now();
      return this._screens;
    } catch { return this._screens || []; }
  }
  async getScreen(id) {
    let all = await this.getScreens();
    let hit = all.find(s => s.id === id);
    if (!hit) { all = await this.getScreens(true); hit = all.find(s => s.id === id); }   /* Monitor umgesteckt: einmal frisch nachfragen */
    return hit || all[0] || null;
  }

  /* ---------- game detection ---------- */
  runningGames() {
    try { return (this.GameStore && this.GameStore.getRunningGames()) || []; } catch { return []; }
  }
  knownGames() {
    const names = new Set();
    const add = (g) => { const n = g && (g.name || g.gameName); if (n) names.add(n); };
    this.runningGames().forEach(add);
    try { (this.GameStore.getGamesSeen() || []).forEach(add); } catch {}
    return [...names].sort((a, b) => a.localeCompare(b));
  }
  gameOk(bind) {
    if (!bind || !bind.game) return true; // "Immer"
    const want = bind.game.toLowerCase();
    return this.runningGames().some(g => String(g.name || g.gameName || "").toLowerCase() === want);
  }

  /* ---------- full mute (deafen) ---------- */
  isDeaf() { try { return !!this.MediaStore.isSelfDeaf(); } catch { return false; } }

  onDeafenKey(isDown, bind) {
    const d = this.settings.deafen;
    if (!d.enabled) return;
    if (isDown !== false && !this.gameOk(bind)) return; // falsches/kein Spiel -> Taste tut nichts
    if (d.mode === "toggle") {
      if (isDown === false) return;
      this.toggleSelfDeaf();
      return;
    }
    // hold mode
    if (isDown !== false) {
      if (!this.isDeaf()) { this.toggleSelfDeaf(); this.weDeafened = true; }
    } else {
      if (this.weDeafened && this.isDeaf()) this.toggleSelfDeaf();
      this.weDeafened = false;
    }
  }

  /* ---------- mic-only mute ---------- */
  isMuted() { try { return !!this.MediaStore.isSelfMute(); } catch { return false; } }

  onMuteKey(isDown, bind) {
    const m = this.settings.mute;
    if (!m.enabled || !this.toggleSelfMute) return;
    if (isDown !== false && !this.gameOk(bind)) return; // falsches/kein Spiel -> Taste tut nichts
    if (m.mode === "toggle") {
      if (isDown === false) return;
      if (this.isDeaf()) return; // bei Komplett-Stumm nichts anfassen
      this.toggleSelfMute();
      return;
    }
    // hold mode: Taste gedrückt = Mikro aus, losgelassen = Mikro wieder an
    if (isDown !== false) {
      if (!this.isDeaf() && !this.isMuted()) { this.toggleSelfMute(); this.weMuted = true; }
    } else {
      if (this.weMuted && !this.isDeaf() && this.isMuted()) this.toggleSelfMute();
      this.weMuted = false;
    }
  }

  /* ---------- native keybinds ---------- */
  registerAll() {
    this.unregisterAll();
    const s = this.settings;
    this.register("screen", s.screen.shortcut, (down) => { if (down !== false) this.toggleScreen(); }, { keydown: true, keyup: false });
    this.register("switch", s.switch.shortcut, (down) => { if (down !== false) this.switchScreen(); }, { keydown: true, keyup: false });
    for (const id in s.monKeys) { const n = parseInt((/^screen:(\d+)/.exec(id) || [])[1], 10); if (isNaN(n) || n > 40) continue;
      this.register(BIND_BASE.mon + n, s.monKeys[id].shortcut, (down) => { if (down !== false) this.screenKey(id); }, { keydown: true, keyup: false }); }
    for (const k of ["deafen", "mute"]) {
      const f = s[k];
      if (!f.enabled) continue;
      const hold = f.mode !== "toggle";
      const handler = k === "deafen" ? this.onDeafenKey.bind(this) : this.onMuteKey.bind(this);
      f.binds.forEach((b, i) => this.register(BIND_BASE[k] + i, b.shortcut, (down) => handler(down, b), { keydown: true, keyup: hold }));
    }
  }
  register(name, sc, cb, ev) {
    if (!Array.isArray(sc) || !sc.length) return;
    const id = typeof name === "number" ? name : IDS[name];
    try {
      this.utils.inputEventRegister(id, sc, cb, { focused: true, blurred: true, ...ev });
      this.registered[id] = true;
    } catch (e) {
      console.error("[ScreenShare] register failed", name, e);
      this.toast("Hotkey konnte nicht registriert werden: " + e.message, "error");
    }
  }
  unregisterAll() {
    for (const name of Object.keys(this.registered)) {
      try { this.utils.inputEventUnregister(Number(name)); } catch {}
    }
    this.registered = {};
  }

  /* ---------- native mouse detection ---------- */
  // Meldet sich bei Discords eigenem Hotkey-System für Maustasten 3..12 an.
  // Die erste, die feuert, ist die gedrückte Taste – so stimmt die Nummer immer.
  startMouseDetect(onHit) {
    this.stopMouseDetect();
    if (!this.utils || !this.utils.inputEventRegister) return false;
    this._detectIds = [];
    for (let code = 3; code <= 12; code++) {
      const id = 1984100 + code;
      try {
        this.utils.inputEventRegister(id, [[1, code]], (down) => { if (down !== false) onHit(code); }, { focused: true, blurred: true, keydown: true, keyup: false });
        this._detectIds.push(id);
      } catch {}
    }
    return this._detectIds.length > 0;
  }
  stopMouseDetect() {
    for (const id of this._detectIds || []) { try { this.utils.inputEventUnregister(id); } catch {} }
    this._detectIds = [];
  }

  /* ---------- lifecycle ---------- */
  start() {
    const missing = this.resolveInternals();
    if (missing.length) {
      BdApi.UI.showToast("ScreenShare: nicht kompatibel mit dieser Discord-Version (" + missing.join(", ") + ")", { type: "error", timeout: 8000 });
      if (!this.utils || !this.utils.inputEventRegister) return;
    }
    this.saveSettings();
    this.registerAll();
    this.getScreens(true).catch(() => {}); clearInterval(this._scrTimer); this._scrTimer = setInterval(() => { this.getScreens(true).catch(() => {}); }, 90000);
    this.toast("ScreenShare aktiv – Übertragung: " + this.settings.screen.label + " · Stumm: " + this.bindSummary("deafen") + " · Mikro: " + this.bindSummary("mute"), "success");
  }
  bindSummary(k) {
    const list = this.settings[k].binds.filter(b => b.shortcut.length).map(b => b.label + (b.game ? " (" + b.game + ")" : ""));
    return list.length ? list.join(", ") : "nicht belegt";
  }
  stop() {
    clearInterval(this._scrTimer); this._scrTimer = null;
    this.stopMouseDetect();
    this.unregisterAll();
    if (this.weDeafened && this.isDeaf()) { try { this.toggleSelfDeaf(); } catch {} }
    this.weDeafened = false;
    if (this.weMuted && this.isMuted() && !this.isDeaf()) { try { this.toggleSelfMute(); } catch {} }
    this.weMuted = false;
  }

  /* ---------- settings panel ---------- */
  getSettingsPanel() {
    const s = this.settings;
    const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
    const inputCss = "padding:10px 12px;border-radius:8px;background:var(--input-background,var(--background-tertiary,#1e1f22));color:#fff;border:1px solid color-mix(in srgb,var(--brand-500,var(--brand-experiment,#5865f2)) 45%,transparent);font-size:14px;";
    const btnCss = "padding:10px 14px;border-radius:8px;border:0;background:var(--brand-500,var(--brand-experiment,#5865f2));color:#fff;font-weight:700;cursor:pointer;white-space:nowrap;";
    const root = el("div", "padding:8px 4px;color:var(--text-normal,#ddd);font-size:14px;display:flex;flex-direction:column;gap:22px;");
    const section = (title, hint) => { const d = el("div", "display:flex;flex-direction:column;gap:8px;"); d.append(el("div", "font-weight:700;font-size:16px;color:var(--header-primary,var(--text-strong,#f2f3f5));", title)); if (hint) d.append(el("div", "opacity:.75;", hint)); return d; };

    const recorder = (target) => {
      const row = el("div", "display:flex;gap:10px;align-items:center;");
      const show = el("div", "flex:1;font-weight:600;" + inputCss, target.label);
      const btn = el("button", btnCss, "Hotkey aufnehmen");
      const clr = el("button", btnCss + "background:transparent;border:1px solid color-mix(in srgb,var(--brand-500,var(--brand-experiment,#5865f2)) 60%,transparent);color:var(--header-primary,var(--text-strong,#f2f3f5));", "Leeren");
      row.append(show, btn, clr);
      let recording = false, pressed = [], mainKey = null, lastCtrlLeftAt = 0;
      const label = () => {
        const mods = MOD_ORDER.filter(c => pressed.includes(c)).map(c => MOD_LABEL[c]);
        return [...mods, mainKey ? mainKey.label : ""].filter(Boolean).join(" + ");
      };
      const onDown = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;
        if (e.code === "Escape") { finish(true); return; }
        if (MOD_VK[e.code]) {
          if (e.code === "ControlLeft") lastCtrlLeftAt = e.timeStamp;
          // AltGr sends a fake ControlLeft right before AltRight – remove it
          if (e.code === "AltRight" && e.timeStamp - lastCtrlLeftAt < 60) pressed = pressed.filter(c => c !== "ControlLeft");
          if (!pressed.includes(e.code)) pressed.push(e.code);
          show.textContent = label() + " + …";
          return;
        }
        let lbl;
        if (/^Numpad/.test(e.code)) lbl = "Num " + e.code.replace("Numpad", "");
        else if (/^Key|^Digit/.test(e.code)) lbl = e.code.replace(/^Key|^Digit/, "");
        else lbl = e.code;
        mainKey = { vk: e.keyCode, label: lbl };
        finish(false);
      };
      const onMouse = (e) => {
        if (!recording) return;
        if (MOUSE_LABEL[e.button]) { e.preventDefault(); e.stopPropagation(); }
        // Mausrad-Klick wie bisher (hat funktioniert), falls Discord ihn nicht selbst meldet
        if (e.button === 1) setTimeout(() => { if (recording && !mainKey) { mainKey = { vk: 2, label: "Mausrad-Klick", mouse: true }; finish(false); } }, 250);
      };
      const onNativeMouse = (code) => {
        if (!recording) return;
        mainKey = { vk: code, label: "Maustaste " + code, mouse: true };
        finish(false);
      };
      const blockNav = (e) => { if (e.button === 3 || e.button === 4) { e.preventDefault(); e.stopPropagation(); } };
      const onUp = (e) => {
        // allow a single modifier-free key or modifier-only combos: finish on release of last key
        if (!recording) return;
        if (MOD_VK[e.code] && !mainKey && pressed.length) { e.preventDefault(); finish(false); }
      };
      const finish = (cancel) => {
        recording = false;
        this.stopMouseDetect();
        window.removeEventListener("keydown", onDown, true);
        window.removeEventListener("keyup", onUp, true);
        window.removeEventListener("mousedown", onMouse, true);
        window.removeEventListener("pointerdown", onMouse, true);
        setTimeout(() => { window.removeEventListener("mouseup", blockNav, true); window.removeEventListener("auxclick", blockNav, true); }, 300);
        btn.textContent = "Hotkey aufnehmen";
        if (cancel || (!mainKey && !pressed.length)) { show.textContent = target.label; if (this.utils) this.registerAll(); return; }
        const mods = MOD_ORDER.filter(c => pressed.includes(c));
        target.shortcut = this.fixAltGr([...mods.map(c => [0, MOD_VK[c]]), ...(mainKey ? [[mainKey.mouse ? 1 : 0, mainKey.vk]] : [])]);
        target.label = label();
        show.textContent = target.label;
        this.saveSettings();
        if (this.utils) this.registerAll();
        BdApi.UI.showToast("Hotkey gespeichert: " + target.label, { type: "success" });
      };
      btn.onclick = () => {
        if (recording) { finish(true); return; }
        recording = true; pressed = []; mainKey = null;
        show.textContent = "Taste, Mausrad oder Seitentaste drücken … (Esc = abbrechen)";
        btn.textContent = "Abbrechen";
        window.addEventListener("keydown", onDown, true);
        window.addEventListener("keyup", onUp, true);
        // Hotkeys kurz abmelden, damit die alte Belegung beim Aufnehmen nicht auslöst
        if (this.utils) this.unregisterAll();
        this.startMouseDetect(onNativeMouse);
        window.addEventListener("mousedown", onMouse, true);
        window.addEventListener("pointerdown", onMouse, true);
        window.addEventListener("mouseup", blockNav, true);
        window.addEventListener("auxclick", blockNav, true);
      };
      clr.onclick = () => {
        target.shortcut = []; target.label = "nicht belegt"; show.textContent = target.label;
        this.saveSettings(); if (this.utils) this.registerAll();
      };
      return row;
    };

    // 1) Screen share
    const sec1 = section("Bildschirmübertragung", "Einmal drücken = ganzen Bildschirm im aktuellen Sprachkanal übertragen, nochmal = beenden. Funktioniert auch im Spiel.");
    sec1.append(recorder(s.screen));
    const sel = el("select", inputCss);
    sel.append(new Option(s.screenName, s.screenId));
    this.getScreens().then(list => {
      if (!list.length) return;
      sel.innerHTML = "";
      list.forEach(x => sel.append(new Option(x.name, x.id, false, x.id === s.screenId)));
    });
    sel.onchange = () => { s.screenId = sel.value; s.screenName = sel.options[sel.selectedIndex].text; this.saveSettings(); };
    const monRow = el("div", "display:flex;gap:10px;align-items:center;");
    monRow.append(el("span", "min-width:70px;", "Monitor:"), sel);
    sec1.append(monRow);
    const test = el("button", "align-self:flex-start;padding:8px 12px;border-radius:8px;border:1px solid var(--brand-500,var(--brand-experiment,#5865f2));background:transparent;color:var(--brand-500,var(--brand-experiment,#5865f2));font-weight:700;cursor:pointer;", "Übertragung testen (Start/Stopp)");
    test.onclick = () => this.toggleScreen();
    sec1.append(test);
    this._monSel = sel;
    const swTitle = el("div", "font-weight:600;margin-top:6px;", "Monitor wechseln");
    const swHint = el("div", "opacity:.75;", "Springt während der Übertragung auf den nächsten Bildschirm (1 → 2 → 1 …). Kurze Unterbrechung von 1–2 Sekunden. Ohne laufende Übertragung wird nur der Monitor für die nächste Übertragung umgestellt.");
    sec1.append(swTitle, swHint, recorder(s.switch));
    /* Eigene Taste je Monitor */
    sec1.append(el("div", "font-weight:600;margin-top:6px;", "Taste je Monitor"),
      el("div", "opacity:.75;", "Jeder Bildschirm kann eine eigene Taste bekommen. Drücken = diesen Bildschirm übertragen. Läuft schon ein anderer, wird auf diesen gewechselt. Läuft genau dieser, wird die Übertragung beendet."));
    const monBox = el("div", "display:flex;flex-direction:column;gap:10px;");
    monBox.append(el("div", "opacity:.6;", "Monitore werden gesucht …"));
    sec1.append(monBox);
    this.getScreens(true).then(list => {
      monBox.innerHTML = "";
      if (!list.length) { monBox.append(el("div", "opacity:.6;", "Keine Monitore gefunden.")); return; }
      list.forEach(x => {
        if (!s.monKeys[x.id]) s.monKeys[x.id] = { shortcut: [], label: "nicht belegt" };
        const card = el("div", "display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:10px;border:1px solid color-mix(in srgb,var(--brand-500,var(--brand-experiment,#5865f2)) 25%,transparent);background:var(--background-secondary,rgba(0,0,0,.2));");
        card.append(el("div", "font-weight:600;opacity:.85;", x.name + (x.id === s.screenId ? "  · gewählt" : "")), recorder(s.monKeys[x.id]));
        monBox.append(card);
      });
    });

    // Liste von Belegungen (Taste + Spiel) für eine Funktion
    const bindList = (k) => {
      const box = el("div", "display:flex;flex-direction:column;gap:12px;");
      const render = () => {
        box.innerHTML = "";
        const games = this.knownGames();
        const running = this.runningGames().map(g => g.name || g.gameName).filter(Boolean);
        s[k].binds.forEach((b, i) => {
          const card = el("div", "display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:10px;border:1px solid color-mix(in srgb,var(--brand-500,var(--brand-experiment,#5865f2)) 25%,transparent);background:var(--background-secondary,rgba(0,0,0,.2));");
          card.append(el("div", "font-weight:600;opacity:.85;", "Taste " + (i + 1)));
          card.append(recorder(b));
          const gRow = el("div", "display:flex;gap:10px;align-items:center;");
          const gSel = el("select", inputCss + "flex:1;");
          gSel.append(new Option("Immer aktiv (egal ob/welches Spiel)", "", false, !b.game));
          const list = [...games];
          if (b.game && !list.includes(b.game)) list.unshift(b.game);
          list.forEach(n => gSel.append(new Option(n + (running.includes(n) ? "  ● läuft gerade" : ""), n, false, b.game === n)));
          gSel.onchange = () => { b.game = gSel.value; this.saveSettings(); };
          gRow.append(el("span", "min-width:70px;", "Nur in:"), gSel);
          card.append(gRow);
          if (s[k].binds.length > 1) {
            const del = el("button", "align-self:flex-start;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,80,80,.6);background:transparent;color:#ff7a7a;font-weight:600;cursor:pointer;", "Taste entfernen");
            del.onclick = () => { s[k].binds.splice(i, 1); this.saveSettings(); if (this.utils) this.registerAll(); render(); };
            card.append(del);
          }
          box.append(card);
        });
        const add = el("button", "align-self:flex-start;padding:8px 12px;border-radius:8px;border:1px solid var(--brand-500,var(--brand-experiment,#5865f2));background:transparent;color:var(--brand-500,var(--brand-experiment,#5865f2));font-weight:700;cursor:pointer;", "+ Weitere Taste hinzufügen");
        add.onclick = () => { s[k].binds.push({ shortcut: [], label: "nicht belegt", game: "" }); this.saveSettings(); render(); };
        const hint = el("div", "opacity:.7;font-size:13px;", "Spiele erscheinen in der Liste, sobald Discord sie einmal erkannt hat. Starte das Spiel und öffne diese Seite neu, falls es fehlt.");
        box.append(add, hint);
      };
      render();
      return box;
    };

    // 2) Full mute
    const sec2 = section("Komplett stumm (Mikro + Ton)", "Schaltet Mikrofon UND Lautsprecher aus – z. B. für Roleplay. Einzelne Tasten wie J sind erlaubt, wirken dann aber überall (auch beim Tippen).");
    const en = el("label", "display:flex;gap:10px;align-items:center;cursor:pointer;");
    const enCb = el("input"); enCb.type = "checkbox"; enCb.checked = !!s.deafen.enabled; enCb.style.cssText = "width:18px;height:18px;accent-color:var(--brand-500,var(--brand-experiment,#5865f2));";
    enCb.onchange = () => { s.deafen.enabled = enCb.checked; this.saveSettings(); if (this.utils) this.registerAll(); };
    en.append(enCb, el("span", "", "Aktiv"));
    sec2.append(en, bindList("deafen"));
    const modeSel = el("select", inputCss);
    modeSel.append(new Option("Halten – stumm solange die Taste gedrückt ist", "hold", false, s.deafen.mode !== "toggle"));
    modeSel.append(new Option("Umschalten – einmal drücken stumm, nochmal drücken wieder an", "toggle", false, s.deafen.mode === "toggle"));
    modeSel.onchange = () => { s.deafen.mode = modeSel.value; this.saveSettings(); if (this.utils) this.registerAll(); };
    const modeRow = el("div", "display:flex;gap:10px;align-items:center;");
    modeRow.append(el("span", "min-width:70px;", "Modus:"), modeSel);
    sec2.append(modeRow);

    // 3) Mic only
    const sec3 = section("Nur Mikrofon stumm", "Schaltet nur dein Mikrofon aus – du hörst die anderen weiterhin. Im Modus „Halten“ ist das Mikro tot, solange du die Taste gedrückt hältst, und geht beim Loslassen wieder an.");
    const en3 = el("label", "display:flex;gap:10px;align-items:center;cursor:pointer;");
    const en3Cb = el("input"); en3Cb.type = "checkbox"; en3Cb.checked = !!s.mute.enabled; en3Cb.style.cssText = "width:18px;height:18px;accent-color:var(--brand-500,var(--brand-experiment,#5865f2));";
    en3Cb.onchange = () => { s.mute.enabled = en3Cb.checked; this.saveSettings(); if (this.utils) this.registerAll(); };
    en3.append(en3Cb, el("span", "", "Aktiv"));
    sec3.append(en3, bindList("mute"));
    const mode3 = el("select", inputCss);
    mode3.append(new Option("Halten – Mikro aus solange die Taste gedrückt ist", "hold", false, s.mute.mode !== "toggle"));
    mode3.append(new Option("Umschalten – einmal drücken Mikro aus, nochmal drücken wieder an", "toggle", false, s.mute.mode === "toggle"));
    mode3.onchange = () => { s.mute.mode = mode3.value; this.saveSettings(); if (this.utils) this.registerAll(); };
    const mode3Row = el("div", "display:flex;gap:10px;align-items:center;");
    mode3Row.append(el("span", "min-width:70px;", "Modus:"), mode3);
    sec3.append(mode3Row);

    // Toasts
    const tg = el("label", "display:flex;gap:10px;align-items:center;cursor:pointer;");
    const cb = el("input"); cb.type = "checkbox"; cb.checked = !!s.toasts; cb.style.cssText = "width:18px;height:18px;accent-color:var(--brand-500,var(--brand-experiment,#5865f2));";
    cb.onchange = () => { s.toasts = cb.checked; this.saveSettings(); };
    tg.append(cb, el("span", "", "Kurze Meldung bei Start/Stopp der Übertragung anzeigen"));

    root.append(sec1, sec2, sec3, tg);
    return root;
  }
};
