/**
 * @name Spotify
 * @author BOSA
 * @version 1.3.0
 * @description Spotify-Steuerung direkt über deiner Sprachverbindung: Titel, Cover, Zurück/Play/Pause/Weiter, Zufall, Wiederholen, Lautstärke und Fortschritt. Nutzt die Spotify-Verknüpfung deines Discord-Kontos (Steuern braucht Spotify Premium). Farben passen sich automatisch dem aktiven Theme an.
 */

const API = "https://api.spotify.com/v1/me/player";
const DEFAULTS = { show: "voice", pollMs: 2500, mini: false };

const ICONS = {
  prev: "M6 6h2v12H6zm3.5 6 8.5 6V6z",
  next: "M16 6h2v12h-2zM6 18l8.5-6L6 6z",
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6zm8-14v14h4V5z",
  shuffle: "M10.59 9.17 5.41 4 4 5.41l5.17 5.17zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04z",
  repeat: "M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z",
  vol: "M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02",
  less: "M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z",
  more: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
  mute: "M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63m2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71M4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9zM12 4 9.91 6.09 12 8.18z",
};

const CSS = `
/* Alle Farben kommen aus dem aktiven Theme (Discord-Variablen) – mit Discord-Standard als Rückfall */
#bosa-spotify{
  --bs-accent:var(--brand-500,var(--brand-experiment,#5865f2));
  --bs-accent-hover:var(--button-filled-brand-background-hover,color-mix(in srgb,var(--bs-accent) 85%,#fff));
  --bs-accent2:var(--bosa-accent2,var(--text-link,var(--bs-accent)));
  --bs-bg:var(--background-floating,var(--background-secondary-alt,var(--background-secondary,#2b2d31)));
  --bs-text:var(--text-normal,#dbdee1);
  --bs-muted:var(--text-muted,#949ba4);
  --bs-icon:var(--interactive-normal,var(--bs-muted));
  --bs-icon-hover:var(--interactive-hover,var(--bs-text));
  margin:0 8px 8px;padding:10px;border-radius:12px;background:var(--bs-bg);
  border:1px solid color-mix(in srgb,var(--bs-accent) 45%,transparent);
  box-shadow:0 0 12px color-mix(in srgb,var(--bs-accent) 15%,transparent);
  color:var(--bs-text);font-family:var(--font-primary);user-select:none}
#bosa-spotify .bs-top{display:flex;gap:10px;align-items:center}
#bosa-spotify .bs-cover{width:42px;height:42px;border-radius:8px;flex:0 0 42px;background:color-mix(in srgb,var(--bs-text) 8%,transparent) center/cover no-repeat;border:1px solid color-mix(in srgb,var(--bs-accent) 35%,transparent)}
#bosa-spotify .bs-text{min-width:0;flex:1}
#bosa-spotify .bs-title{font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--header-primary,var(--bs-text))}
#bosa-spotify .bs-artist{font-size:12px;color:var(--bs-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#bosa-spotify .bs-ctrl{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
#bosa-spotify button{background:transparent;border:0;padding:4px;border-radius:8px;cursor:pointer;color:var(--bs-icon);display:flex;align-items:center;justify-content:center}
#bosa-spotify button:hover{background:color-mix(in srgb,var(--bs-accent) 18%,transparent);color:var(--bs-icon-hover)}
#bosa-spotify button.on{color:var(--bs-accent)}
#bosa-spotify button.bs-main{background:var(--bs-accent);color:#fff;width:34px;height:34px;border-radius:50%}
#bosa-spotify button.bs-main:hover{background:var(--bs-accent-hover);color:#fff}
#bosa-spotify svg{width:20px;height:20px;fill:currentColor}
#bosa-spotify .bs-prog{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;color:var(--bs-muted)}
#bosa-spotify .bs-bar{flex:1;height:5px;border-radius:3px;background:color-mix(in srgb,var(--bs-text) 15%,transparent);cursor:pointer;position:relative}
#bosa-spotify .bs-fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,var(--bs-accent2),var(--bs-accent))}
#bosa-spotify .bs-vol{display:flex;align-items:center;gap:6px;margin-top:6px}
#bosa-spotify input[type=range]{flex:1;accent-color:var(--bs-accent);height:4px;cursor:pointer}
#bosa-spotify .bs-volnum{font-size:11px;min-width:30px;text-align:right;color:var(--bs-muted)}
#bosa-spotify button.bs-size{padding:2px;align-self:flex-start;opacity:.7}
#bosa-spotify button.bs-size:hover{opacity:1}
#bosa-spotify button.bs-size svg{width:16px;height:16px}
/* Kleine Ansicht: eine Zeile – Cover, Titel, Zurück/Play/Weiter */
#bosa-spotify.bs-mini{display:flex;align-items:center;gap:6px;padding:6px 8px;flex-wrap:wrap}
#bosa-spotify.bs-mini .bs-top{flex:1;min-width:0;gap:8px}
#bosa-spotify.bs-mini .bs-cover{width:28px;height:28px;flex-basis:28px;border-radius:6px}
#bosa-spotify.bs-mini .bs-title{font-size:12px}
#bosa-spotify.bs-mini .bs-artist{font-size:11px}
#bosa-spotify.bs-mini .bs-ctrl{margin-top:0;gap:2px}
#bosa-spotify.bs-mini .bs-shuffle,#bosa-spotify.bs-mini .bs-repeat,#bosa-spotify.bs-mini .bs-prog,#bosa-spotify.bs-mini .bs-vol{display:none}
#bosa-spotify.bs-mini button svg{width:18px;height:18px}
#bosa-spotify.bs-mini button.bs-main{width:26px;height:26px}
#bosa-spotify.bs-mini button.bs-size{align-self:center}
#bosa-spotify.bs-mini .bs-msg{flex-basis:100%;margin-top:2px}
#bosa-spotify .bs-msg{font-size:12px;color:var(--text-warning,var(--bs-accent));margin-top:6px;display:none}
`;

module.exports = class Spotify {
  constructor(meta) { this.meta = meta; this.state = null; this.lastFetch = 0; }

  /* ---------- settings ---------- */
  get settings() {
    if (!this._s) this._s = Object.assign({}, DEFAULTS, BdApi.Data.load("Spotify", "settings") || {});
    return this._s;
  }
  save() { BdApi.Data.save("Spotify", "settings", this.settings); }

  /* ---------- discord internals ---------- */
  resolve() {
    this.SpotifyStore = BdApi.Webpack.getStore("SpotifyStore");
    this.VoiceStore = BdApi.Webpack.getStore("SelectedChannelStore");
    // Discord-Funktion zum Erneuern des Spotify-Tokens (Name kann je nach Version abweichen)
    const mod = BdApi.Webpack.getByKeys("getAccessToken", "setActiveDevice") || BdApi.Webpack.getByKeys("getAccessToken");
    this.getAccessToken = mod && typeof mod.getAccessToken === "function" ? mod.getAccessToken.bind(mod) : null;
  }
  socket() {
    try { const sd = this.SpotifyStore && this.SpotifyStore.getActiveSocketAndDevice(); if (sd && sd.socket) return sd.socket; } catch {}
    try {
      // Fallback: irgendein verbundenes Spotify-Konto
      const all = this.SpotifyStore && this.SpotifyStore.__getLocalVars && this.SpotifyStore.__getLocalVars();
      const accounts = all && (all.accounts || all.sockets);
      if (accounts) for (const v of Object.values(accounts)) { if (v && v.accessToken) return v; }
    } catch {}
    return null;
  }
  inVoice() { try { return !!this.VoiceStore.getVoiceChannelId(); } catch { return false; } }

  /* ---------- spotify web api ---------- */
  async api(method, path, body, retried) {
    const sock = this.socket();
    if (!sock || !sock.accessToken) throw { code: "NO_LINK" };
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: "Bearer " + sock.accessToken, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && !retried && this.getAccessToken) {
      try { await this.getAccessToken(sock.accountId); } catch {}
      return this.api(method, path, body, true);
    }
    if (res.status === 204 || res.status === 202) return null;
    let data = null; try { data = await res.json(); } catch {}
    if (!res.ok) {
      const reason = data && data.error && (data.error.reason || data.error.message);
      throw { code: res.status, reason };
    }
    return data;
  }

  async refresh() {
    if (this.fetching) return;
    this.fetching = true;
    try {
      const st = await this.api("GET", "");
      this.state = st;
      this.lastFetch = Date.now();
      this.msg("");
    } catch (e) {
      this.state = null;
      if (e && e.code === "NO_LINK") this.msg("Spotify ist nicht mit Discord verknüpft (Einstellungen → Verknüpfungen).");
      else this.msg("Spotify antwortet nicht (" + (e && (e.reason || e.code)) + ").");
    } finally {
      this.fetching = false;
      this.render();
    }
  }

  async action(method, path, optimistic) {
    if (optimistic) { try { optimistic(); this.render(); } catch {} }
    try { await this.api(method, path); }
    catch (e) {
      if (e && (e.code === 403 || e.reason === "PREMIUM_REQUIRED")) this.msg("Zum Steuern brauchst du Spotify Premium.");
      else if (e && e.code === 404) this.msg("Kein aktives Spotify-Gerät – starte kurz einen Song in Spotify.");
      else this.msg("Hat nicht geklappt (" + (e && (e.reason || e.code)) + ").");
    }
    setTimeout(() => this.refresh(), 350);
  }

  playPause() { const p = this.state && this.state.is_playing; this.action("PUT", p ? "/pause" : "/play", () => { this.state.is_playing = !p; }); }
  next() { this.action("POST", "/next"); }
  prev() { this.action("POST", "/previous"); }
  shuffle() { const v = !(this.state && this.state.shuffle_state); this.action("PUT", "/shuffle?state=" + v, () => { this.state.shuffle_state = v; }); }
  repeat() {
    const order = ["off", "context", "track"];
    const cur = (this.state && this.state.repeat_state) || "off";
    const nxt = order[(order.indexOf(cur) + 1) % 3];
    this.action("PUT", "/repeat?state=" + nxt, () => { this.state.repeat_state = nxt; });
  }
  setVolume(v) {
    clearTimeout(this._volT);
    this._volT = setTimeout(() => this.action("PUT", "/volume?volume_percent=" + Math.round(v), () => { if (this.state && this.state.device) this.state.device.volume_percent = v; }), 250);
  }
  seek(ms) { this.action("PUT", "/seek?position_ms=" + Math.round(ms), () => { this.state.progress_ms = ms; this.lastFetch = Date.now(); }); }

  /* ---------- ui ---------- */
  svg(name) { return `<svg viewBox="0 0 24 24"><path d="${ICONS[name]}"/></svg>`; }
  fmt(ms) { ms = Math.max(0, ms | 0); const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  msg(t) { this._msg = t; if (this.el) { const m = this.el.querySelector(".bs-msg"); m.textContent = t; m.style.display = t ? "block" : "none"; } }

  build() {
    const el = document.createElement("div");
    el.id = "bosa-spotify";
    el.innerHTML = `
      <div class="bs-top"><div class="bs-cover"></div><div class="bs-text"><div class="bs-title">Spotify</div><div class="bs-artist">–</div></div><button class="bs-size" title="Kleine Ansicht">${this.svg("less")}</button></div>
      <div class="bs-prog"><span class="bs-cur">0:00</span><div class="bs-bar"><div class="bs-fill"></div></div><span class="bs-dur">0:00</span></div>
      <div class="bs-ctrl">
        <button class="bs-shuffle" title="Zufallswiedergabe">${this.svg("shuffle")}</button>
        <button class="bs-prev" title="Zurück">${this.svg("prev")}</button>
        <button class="bs-main" title="Play/Pause">${this.svg("play")}</button>
        <button class="bs-next" title="Weiter">${this.svg("next")}</button>
        <button class="bs-repeat" title="Wiederholen">${this.svg("repeat")}</button>
      </div>
      <div class="bs-vol"><button class="bs-mute" title="Stumm">${this.svg("vol")}</button><input type="range" min="0" max="100" step="1"><span class="bs-volnum">–</span></div>
      <div class="bs-msg"></div>`;
    const q = (c) => el.querySelector(c);
    q(".bs-main").onclick = () => this.playPause();
    q(".bs-size").onclick = () => { this.settings.mini = !this.settings.mini; this.save(); this.applySize(); };
    q(".bs-next").onclick = () => this.next();
    q(".bs-prev").onclick = () => this.prev();
    q(".bs-shuffle").onclick = () => this.shuffle();
    q(".bs-repeat").onclick = () => this.repeat();
    const range = q("input[type=range]");
    range.oninput = () => { this.dragVol = true; q(".bs-volnum").textContent = range.value + "%"; this.setVolume(+range.value); };
    range.onchange = () => { setTimeout(() => { this.dragVol = false; }, 1500); };
    q(".bs-mute").onclick = () => {
      const cur = this.state && this.state.device ? this.state.device.volume_percent : 0;
      if (cur > 0) { this.beforeMute = cur; this.setVolume(0); }
      else this.setVolume(this.beforeMute || 50);
    };
    q(".bs-bar").onclick = (e) => {
      const it = this.state && this.state.item; if (!it) return;
      const r = e.currentTarget.getBoundingClientRect();
      this.seek(((e.clientX - r.left) / r.width) * it.duration_ms);
    };
    this.el = el;
    this.applySize();
    this.msg(this._msg || "");
    return el;
  }

  applySize() {
    if (!this.el) return;
    const mini = !!this.settings.mini;
    this.el.classList.toggle("bs-mini", mini);
    const b = this.el.querySelector(".bs-size");
    // in der kleinen Ansicht steht der Umschalter ganz rechts hinter den Knöpfen
    if (mini) this.el.querySelector(".bs-ctrl").after(b); else this.el.querySelector(".bs-top").append(b);
    b.innerHTML = this.svg(mini ? "more" : "less");
    b.title = mini ? "Große Ansicht" : "Kleine Ansicht";
  }

  render() {
    if (!this.el) return;
    const q = (c) => this.el.querySelector(c);
    const st = this.state, it = st && st.item;
    if (it) {
      q(".bs-title").textContent = it.name || "–";
      q(".bs-title").title = it.name || "";
      q(".bs-artist").textContent = (it.artists || it.show && [it.show] || []).map(a => a.name).join(", ") || "–";
      const img = (it.album && it.album.images && it.album.images[0]) || (it.images && it.images[0]);
      q(".bs-cover").style.backgroundImage = img ? `url("${img.url}")` : "";
    } else {
      q(".bs-title").textContent = "Spotify";
      q(".bs-artist").textContent = st ? "Gerade läuft nichts" : "–";
      q(".bs-cover").style.backgroundImage = "";
    }
    q(".bs-main").innerHTML = this.svg(st && st.is_playing ? "pause" : "play");
    q(".bs-shuffle").classList.toggle("on", !!(st && st.shuffle_state));
    const rep = st && st.repeat_state;
    q(".bs-repeat").classList.toggle("on", rep && rep !== "off");
    q(".bs-repeat").title = rep === "track" ? "Wiederholen: aktueller Song" : rep === "context" ? "Wiederholen: Playlist/Album" : "Wiederholen: aus";
    q(".bs-repeat").style.textDecoration = "";
    q(".bs-repeat").innerHTML = this.svg("repeat") + (rep === "track" ? '<span style="font-size:9px;font-weight:800;margin-left:-4px">1</span>' : "");
    const vol = st && st.device && st.device.volume_percent;
    if (!this.dragVol && vol != null) { q("input[type=range]").value = vol; q(".bs-volnum").textContent = vol + "%"; }
    q(".bs-mute").innerHTML = this.svg(vol === 0 ? "mute" : "vol");
    this.tick();
  }

  tick() {
    if (!this.el) return;
    const st = this.state, it = st && st.item;
    const dur = it ? it.duration_ms : 0;
    let pos = st ? st.progress_ms || 0 : 0;
    if (st && st.is_playing) pos += Date.now() - this.lastFetch;
    pos = Math.min(pos, dur || 0);
    this.el.querySelector(".bs-cur").textContent = this.fmt(pos);
    this.el.querySelector(".bs-dur").textContent = this.fmt(dur);
    this.el.querySelector(".bs-fill").style.width = dur ? (pos / dur * 100) + "%" : "0%";
    // Song zu Ende -> neu laden
    if (st && st.is_playing && dur && pos >= dur - 200 && Date.now() - this.lastFetch > 1500) this.refresh();
  }

  /* ---------- placement ---------- */
  shouldShow() {
    if (!this.socket()) return this.settings.show === "always";
    if (this.settings.show === "always") return true;
    return this.inVoice();
  }
  place() {
    const panels = document.querySelector('section[class*="panels_"]') || document.querySelector('[class*="panels_"]');
    if (!this.shouldShow() || !panels) { if (this.el && this.el.isConnected) this.el.remove(); return false; }
    if (!this.el) this.build();
    // direkt über der Sprachverbindung einsetzen
    const rtc = panels.querySelector('[class*="rtcConnectionStatus"]');
    let anchor = null;
    if (rtc) { anchor = rtc; while (anchor.parentElement && anchor.parentElement !== panels) anchor = anchor.parentElement; }
    if (anchor && anchor.parentElement === panels) {
      if (this.el.nextSibling !== anchor) panels.insertBefore(this.el, anchor);
    } else if (!this.el.isConnected || this.el.parentElement !== panels) {
      panels.insertBefore(this.el, panels.firstChild);
    }
    return true;
  }

  loop() {
    const shown = this.place();
    if (!shown) return;
    if (Date.now() - this.lastFetch > this.settings.pollMs) this.refresh();
    else this.tick();
  }

  /* ---------- lifecycle ---------- */
  start() {
    this.resolve();
    BdApi.DOM.addStyle("Spotify", CSS);
    this.timer = setInterval(() => { try { this.loop(); } catch (e) { console.error("[Spotify]", e); } }, 500);
    if (!this.SpotifyStore) BdApi.UI.showToast("Spotify: Spotify-Teil von Discord nicht gefunden", { type: "error" });
  }
  stop() {
    clearInterval(this.timer);
    clearTimeout(this._volT);
    BdApi.DOM.removeStyle("Spotify");
    if (this.el) this.el.remove();
    this.el = null;
  }

  getSettingsPanel() {
    const s = this.settings;
    const root = document.createElement("div");
    root.style.cssText = "padding:8px 4px;color:var(--text-normal,#ddd);font-size:14px;display:flex;flex-direction:column;gap:14px;";
    const inputCss = "padding:10px 12px;border-radius:8px;background:var(--background-secondary,#2b2d31);color:var(--text-normal,#dbdee1);border:1px solid color-mix(in srgb,var(--brand-500,#5865f2) 45%,transparent);font-size:14px;";
    const title = document.createElement("div");
    title.style.cssText = "font-weight:700;font-size:16px;color:var(--brand-500,#5865f2);";
    title.textContent = "Spotify";
    const status = document.createElement("div");
    const linked = !!this.socket();
    status.textContent = linked ? "✔ Spotify ist mit Discord verknüpft." : "✖ Kein Spotify gefunden. Verknüpfe Spotify unter Discord-Einstellungen → Verknüpfungen und starte einmal einen Song.";
    status.style.color = linked ? "var(--text-positive,#23a55a)" : "var(--text-warning,#f0b232)";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:10px;align-items:center;";
    const lbl = document.createElement("span"); lbl.textContent = "Anzeigen:"; lbl.style.minWidth = "80px";
    const sel = document.createElement("select"); sel.style.cssText = inputCss;
    sel.append(new Option("Nur wenn ich in einem Sprachkanal bin", "voice", false, s.show !== "always"));
    sel.append(new Option("Immer", "always", false, s.show === "always"));
    sel.onchange = () => { s.show = sel.value; this.save(); };
    row.append(lbl, sel);
    const row2 = document.createElement("div");
    row2.style.cssText = "display:flex;gap:10px;align-items:center;";
    const lbl2 = document.createElement("span"); lbl2.textContent = "Größe:"; lbl2.style.minWidth = "80px";
    const sel2 = document.createElement("select"); sel2.style.cssText = inputCss;
    sel2.append(new Option("Groß – alle Knöpfe, Fortschritt und Lautstärke", "big", false, !s.mini));
    sel2.append(new Option("Klein – nur Titel und Zurück/Play/Weiter", "mini", false, !!s.mini));
    sel2.onchange = () => { s.mini = sel2.value === "mini"; this.save(); this.applySize(); };
    row2.append(lbl2, sel2);
    const hint = document.createElement("div");
    hint.style.cssText = "opacity:.75;";
    hint.textContent = "Steuern (Play/Pause, Weiter, Lautstärke …) funktioniert nur mit Spotify Premium – das ist eine Vorgabe von Spotify. Die Lautstärke ist die von Spotify selbst, nicht die von Discord.";
    root.append(title, status, row, row2, hint);
    return root;
  }
};
