/**
 * @name SoundboardStumm
 * @author BOSA
 * @version 1.0.0
 * @description Schaltet dein Discord-Mikro automatisch stumm, solange ein Sound aus der Soundboard-App läuft. Die App meldet über eine lokale Schnittstelle (nur dieser PC, kein Internet), wie lange der Sound dauert. Danach – plus Puffer – geht das Mikro wieder an. Warst du vorher schon stumm, bleibst du es.
 */

const DEFAULTS = {
  enabled: true,
  port: 47800,      // Discord selbst nutzt 6463–6472, darum weit weg davon
  bufferSec: 1,     // Puffer nach Soundende
  maxSec: 1800,     // Sicherheitsgrenze pro Meldung (30 Min.)
  toasts: true,
};
const HEADER = "x-soundboard";   // Pflicht-Header: blockt Webseiten im Browser (die dürfen eigene Header nicht ohne Erlaubnis schicken)

module.exports = class SoundboardStumm {
  constructor(meta) {
    this.meta = meta;
    this.sounds = new Map();   // id -> Endzeit (ms)
    this.weMuted = false;
    this.timer = null;
    this.server = null;
    this.anon = 0;
  }

  /* ---------- Einstellungen ---------- */
  get settings() {
    if (!this._s) this._s = Object.assign({}, DEFAULTS, BdApi.Data.load("SoundboardStumm", "settings") || {});
    return this._s;
  }
  save() { BdApi.Data.save("SoundboardStumm", "settings", this.settings); }
  toast(msg, type = "info") { if (this.settings.toasts || type === "error") BdApi.UI.showToast("Soundboard: " + msg, { type }); }

  /* ---------- Discord ---------- */
  resolve() {
    this.MediaStore = BdApi.Webpack.getStore("MediaEngineStore");
    const muteMod = BdApi.Webpack.getByKeys("toggleSelfMute");
    this.toggleSelfMute = muteMod ? muteMod.toggleSelfMute.bind(muteMod) : null;
    return !!(this.MediaStore && this.toggleSelfMute);
  }
  isMuted() { try { return !!this.MediaStore.isSelfMute(); } catch { return false; } }
  isDeaf() { try { return !!this.MediaStore.isSelfDeaf(); } catch { return false; } }

  muteNow() {
    if (this.weMuted) return;
    if (this.isDeaf() || this.isMuted()) return;     // schon stumm -> nicht anfassen, danach auch nicht freischalten
    this.toggleSelfMute();
    this.weMuted = true;
  }
  unmuteNow() {
    if (this.weMuted && this.isMuted() && !this.isDeaf()) this.toggleSelfMute();
    this.weMuted = false;
  }

  /* ---------- Sound-Logik ---------- */
  // dauerSek = Länge des Sounds. Gleiche id nochmal = Sound neu gestartet -> Zeit zurücksetzen.
  startSound(id, dauerSek) {
    const s = this.settings;
    if (!s.enabled) return { ok: false, fehler: "Plugin ist ausgeschaltet" };
    let sec = Number(dauerSek);
    if (!isFinite(sec) || sec <= 0) return { ok: false, fehler: "dauer fehlt oder ist ungültig" };
    sec = Math.min(sec, Number(s.maxSec) || DEFAULTS.maxSec);
    const key = id != null && String(id) !== "" ? String(id) : "_ohne_id_" + (++this.anon);
    const ende = Date.now() + Math.round((sec + (Number(s.bufferSec) || 0)) * 1000);
    this.sounds.set(key, ende);
    this.muteNow();
    this.schedule();
    return { ok: true, id: key, stummBis: new Date(this.endTime()).toISOString() };
  }
  stopSound(id) {
    if (id == null || id === "") this.sounds.clear();
    else this.sounds.delete(String(id));
    this.check();
    return { ok: true, aktiv: this.sounds.size };
  }
  endTime() { let m = 0; for (const t of this.sounds.values()) if (t > m) m = t; return m; }
  check() {
    const now = Date.now();
    for (const [k, t] of this.sounds) if (t <= now) this.sounds.delete(k);
    if (!this.sounds.size) { clearTimeout(this.timer); this.timer = null; this.unmuteNow(); }
    else this.schedule();
  }
  schedule() {
    clearTimeout(this.timer);
    const wait = Math.max(20, this.endTime() - Date.now());
    this.timer = setTimeout(() => this.check(), wait);
  }

  /* ---------- lokale Schnittstelle ---------- */
  startServer() {
    this.stopServer();
    let http;
    try { http = require("http"); } catch { this.toast("Schnittstelle nicht möglich (http fehlt im Mod)", "error"); return; }
    const send = (res, code, obj) => {
      res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(obj));
    };
    this.server = http.createServer((req, res) => {
      const url = (req.url || "/").split("?")[0].replace(/\/+$/, "") || "/";
      if (req.method === "GET" && url === "/status") {
        return send(res, 200, { ok: true, plugin: "SoundboardStumm", version: "1.0.0", an: !!this.settings.enabled, stumm: this.isMuted(), vonUns: this.weMuted, aktiveSounds: this.sounds.size });
      }
      if (req.method !== "POST") return send(res, 405, { ok: false, fehler: "nur POST (außer GET /status)" });
      if (!req.headers[HEADER]) return send(res, 403, { ok: false, fehler: "Header X-Soundboard fehlt" });
      let body = "";
      req.on("data", c => { body += c; if (body.length > 4096) req.destroy(); });
      req.on("end", () => {
        let d = {};
        try { d = body ? JSON.parse(body) : {}; } catch { return send(res, 400, { ok: false, fehler: "kein gültiges JSON" }); }
        try {
          if (url === "/stumm") {
            const dauer = d.dauer != null ? d.dauer : (d.dauerMs != null ? d.dauerMs / 1000 : null);
            const r = this.startSound(d.id, dauer);
            return send(res, r.ok ? 200 : 400, r);
          }
          if (url === "/frei") return send(res, 200, this.stopSound(d.id));
          return send(res, 404, { ok: false, fehler: "unbekannt – erlaubt: /stumm, /frei, /status" });
        } catch (e) { return send(res, 500, { ok: false, fehler: String(e && e.message) }); }
      });
    });
    this.server.on("error", e => {
      if (e && e.code === "EADDRINUSE") this.toast("Port " + this.settings.port + " ist belegt – bitte in den Einstellungen ändern", "error");
      else this.toast("Schnittstelle: " + (e && e.message), "error");
    });
    this.server.listen(Number(this.settings.port) || DEFAULTS.port, "127.0.0.1");
  }
  stopServer() { if (this.server) { try { this.server.close(); } catch {} this.server = null; } }

  /* ---------- Start/Stopp ---------- */
  start() {
    if (!this.resolve()) { BdApi.UI.showToast("SoundboardStumm: nicht kompatibel mit dieser Discord-Version", { type: "error", timeout: 8000 }); return; }
    this.save();
    this.startServer();
    this.toast("bereit auf Port " + this.settings.port, "success");
  }
  stop() {
    this.stopServer();
    clearTimeout(this.timer); this.timer = null;
    this.sounds.clear();
    this.unmuteNow();
  }

  /* ---------- Einstellungsseite ---------- */
  getSettingsPanel() {
    const s = this.settings;
    const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
    const accent = "var(--brand-500,var(--brand-experiment,#5865f2))";
    const inputCss = "padding:10px 12px;border-radius:8px;background:var(--input-background,var(--background-tertiary,#1e1f22));color:#fff;border:1px solid color-mix(in srgb," + accent + " 45%,transparent);font-size:14px;width:110px;";
    const btnCss = "align-self:flex-start;padding:8px 12px;border-radius:8px;border:1px solid " + accent + ";background:transparent;color:" + accent + ";font-weight:700;cursor:pointer;";
    const root = el("div", "padding:8px 4px;color:var(--text-normal,#ddd);font-size:14px;display:flex;flex-direction:column;gap:18px;");
    const title = (t, h) => { const d = el("div", "display:flex;flex-direction:column;gap:6px;"); d.append(el("div", "font-weight:700;font-size:16px;color:var(--header-primary,var(--text-strong,#f2f3f5));", t)); if (h) d.append(el("div", "opacity:.75;", h)); return d; };
    const check = (label, key, after) => {
      const l = el("label", "display:flex;gap:10px;align-items:center;cursor:pointer;");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = !!s[key];
      cb.style.cssText = "width:18px;height:18px;accent-color:" + accent + ";";
      cb.onchange = () => { s[key] = cb.checked; this.save(); if (after) after(); };
      l.append(cb, el("span", "", label)); return l;
    };
    const num = (label, key, min, max, step, hint, after) => {
      const row = el("div", "display:flex;gap:10px;align-items:center;flex-wrap:wrap;");
      const inp = el("input", inputCss); inp.type = "number"; inp.min = min; inp.max = max; inp.step = step; inp.value = s[key];
      inp.onchange = () => { let v = Number(inp.value); if (!isFinite(v)) v = DEFAULTS[key]; v = Math.min(max, Math.max(min, v)); inp.value = v; s[key] = v; this.save(); if (after) after(); };
      row.append(el("span", "min-width:150px;", label), inp); if (hint) row.append(el("span", "opacity:.7;", hint)); return row;
    };

    const sec1 = title("Automatisch stumm bei Sounds", "Die Soundboard-App meldet, wie lange ein Sound läuft. Solange ist dein Mikro in Discord stumm, danach geht es von selbst wieder an.");
    sec1.append(check("Aktiv", "enabled", () => { if (!s.enabled) this.stopSound(); }));
    sec1.append(num("Puffer nach dem Sound", "bufferSec", 0, 10, 0.5, "Sekunden"));
    sec1.append(num("Höchstens stumm", "maxSec", 10, 7200, 10, "Sekunden pro Sound (Sicherheit)"));

    const sec2 = title("Schnittstelle für die App", "Nur auf diesem PC erreichbar (127.0.0.1). Den Port muss die App kennen – nur ändern, wenn er belegt ist.");
    sec2.append(num("Port", "port", 1024, 65535, 1, null, () => this.startServer()));
    const status = el("div", "opacity:.8;");
    const upd = () => { status.textContent = "Adresse: http://127.0.0.1:" + s.port + "  ·  gerade " + (this.sounds.size ? this.sounds.size + " Sound(s) aktiv" : "kein Sound aktiv"); };
    upd(); sec2.append(status);

    const test = el("button", btnCss, "Test: 3 Sekunden stumm");
    test.onclick = () => { const r = this.startSound("test", 3); this.toast(r.ok ? "Test läuft – 3 s + Puffer" : r.fehler, r.ok ? "info" : "error"); upd(); };
    root.append(sec1, sec2, test, check("Kurze Meldungen anzeigen", "toasts"));
    return root;
  }
};
