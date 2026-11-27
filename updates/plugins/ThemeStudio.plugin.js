/**
 * @name ThemeStudio
 * @author BOSA
 * @description Verbindung zum Theme Studio: Wenn du im Studio „In Discord speichern“ klickst, wird dein neues Theme sofort eingeschaltet. Ist im Theme „Windows-Hintergrund verwenden“ an, zeigt Discord dein aktuelles Desktop-Bild mit passenden Farben – auch bei einer Diashow. Legt für den Profil-Editor die Liste der Avatar-Dekos und Profil-Rahmen aus dem Discord-Shop ab. Liest nur, schickt nichts weg.
 * @version 1.3.1
 */

module.exports = class ThemeStudio {
  start() {
    this.wandKey = ""; this.busy = false; this.lastOn = null; this.lastErr = ""; this.log("Plugin gestartet (1.3.1)"); this.flatSeen = new Set();
    this.timer = setInterval(() => { try { this.check(); } catch (e) {} }, 1500);
    this.wandTimer = setInterval(() => { this.wand().catch(() => {}); }, 4000);
    setTimeout(() => { this.wand().catch(() => {}); }, 1500);
    /* Rahmen-Liste für den Profil-Editor: kurz nach dem Start und dann alle 6 Stunden */
    this.rahmenT = setTimeout(() => { this.rahmen().catch(e => this.log("Rahmen-Liste ging nicht: " + (e && e.message))); }, 12000);
    this.rahmenTimer = setInterval(() => { this.rahmen().catch(() => {}); }, 6 * 3600 * 1000);
  }
  stop() {
    clearInterval(this.timer); clearInterval(this.wandTimer); this.timer = this.wandTimer = null; clearTimeout(this.rahmenT); clearInterval(this.rahmenTimer);
    try { BdApi.DOM.removeStyle("ThemeStudioWandbild"); } catch (e) {} this.wandKey = ""; this.unflat();
  }

  /* Das Studio legt ThemeStudio.aktivieren.json in den Plugin-Ordner: welches Theme eingeschaltet werden soll */
  check() {
    let fs, path; try { fs = require("fs"); path = require("path"); } catch (e) { return; }
    const f = path.join(BdApi.Plugins.folder, "ThemeStudio.aktivieren.json"); if (!fs.existsSync(f)) return;
    let j = null; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) {}
    const done = () => { try { fs.unlinkSync(f); } catch (e) {} };
    if (!j || !j.file) return done();
    const all = BdApi.Themes.getAll(), t = all.find(x => x.filename === j.file);
    if (!t) { /* BetterDiscord lädt eine neue Datei erst kurz danach */
      if (Date.now() - (j.at || 0) > 30000) { done(); BdApi.UI.showToast("Theme Studio: „" + j.file + "“ wurde nicht gefunden", { type: "error" }); }
      return; }
    for (const x of all) if (x.id !== t.id && BdApi.Themes.isEnabled(x.id)) BdApi.Themes.disable(x.id);
    if (!BdApi.Themes.isEnabled(t.id)) BdApi.Themes.enable(t.id);
    done(); BdApi.UI.showToast("Theme Studio: „" + (t.name || j.file) + "“ ist jetzt eingeschaltet", { type: "success" });
  }

  /* ===== Rahmen für den Profil-Editor =====
     Holt über Discords eigene Schnittstelle die Shop-Liste und deine Käufe und legt nur die nötigen Angaben ab
     (ThemeStudioRahmen.config.json): Avatar-Dekos (Name, Bild-Kennung) und Profil-Rahmen (Ebenen und Maße). */
  async rahmen() {
    const W = BdApi.Webpack;
    const H = W.getModule(m => m && typeof m.get === "function" && typeof m.post === "function" && typeof m.del === "function" && typeof m.getXHR !== "function", { searchExports: true });
    if (!H) return this.log("Rahmen-Liste: Discords Schnittstelle nicht gefunden");
    const body = async url => { try { const r = await H.get({ url }); return r && r.body; } catch (e) { return null; } };
    const kaeufe = await body("/users/@me/collectibles-purchases"), shop = await body("/collectibles-categories");
    if (!kaeufe && !shop) return this.log("Rahmen-Liste: keine Antwort von Discord");
    const deko = new Map(), pr = new Map(), names = new Map(), mine = new Set();
    const items = (o, cb, d = 0) => { if (!o || d > 7) return; if (Array.isArray(o)) return o.forEach(v => items(v, cb, d + 1)); if (typeof o === "object") { if (Array.isArray(o.items)) o.items.forEach(it => it && cb(it, o)); for (const k in o) if (k !== "items") items(o[k], cb, d + 1); } };
    /* Produktnamen: ein Produkt mit genau einem Teil heißt wie das Teil; Pakete nur als Ersatz */
    items(shop, (it, p) => { if (p && p.name && p.sku_id) { const one = p.items.length === 1; if (one || !names.has(it.sku_id)) names.set(it.sku_id, { n: p.name, one }); } });
    if (Array.isArray(kaeufe)) for (const k of kaeufe) for (const it of k.items || []) { mine.add(it.sku_id); if (k.name && (k.items.length === 1 || !names.has(it.sku_id))) names.set(it.sku_id, { n: k.name, one: k.items.length === 1 }); }
    const add = it => {
      if (it.type === 0 && it.asset && !deko.has(it.sku_id)) deko.set(it.sku_id, { sku: it.sku_id, asset: it.asset, name: (names.get(it.sku_id) || {}).n || "", label: /TODO/.test(it.label || "") ? "" : String(it.label || "").slice(0, 160) });
      if (it.type === 3 && Array.isArray(it.layers) && !pr.has(it.sku_id)) pr.set(it.sku_id, { sku: it.sku_id, name: (names.get(it.sku_id) || {}).n || "", label: String(it.label || "").slice(0, 160),
        layers: it.layers.map(l => ({ id: l.id, type: l.type, order: l.order, anchor: l.anchor, responsive: !!l.responsive })), iw: it.inner_width || 1200, ot: it.overflow_top || 0, ob: it.overflow_bottom || 0, oh: it.overflow_horizontal || 0 }); };
    if (Array.isArray(kaeufe)) for (const k of kaeufe) for (const it of k.items || []) add(it);
    items(shop, add);
    const out = o => Object.assign(o, { eigen: mine.has(o.sku) });
    BdApi.Data.save("ThemeStudioRahmen", "liste", { zeit: Date.now(), deko: [...deko.values()].map(out), profilRahmen: [...pr.values()].map(out) });
    this.log("Rahmen-Liste für den Profil-Editor: " + deko.size + " Avatar-Dekos, " + pr.size + " Profil-Rahmen (" + mine.size + " eigene Teile)");
  }

  /* Text aller eingeschalteten Themes (eigener Mod: <ts-themes>, BetterDiscord: <bd-themes>) */
  themeText() { let t = ""; for (const st of document.querySelectorAll("ts-themes style, bd-themes style")) t += st.textContent.length > 4e6 ? st.textContent.slice(0, 4e6) : st.textContent; return t; }
  /* ===== Wechselnder Windows-Hintergrund ===== */
  /* Windows legt das gerade angezeigte Desktop-Bild immer hier ab – auch bei einer Diashow */
  wallFile(mon) {
    const path = require("path"), fs = require("fs"); let app = "";
    try { if (typeof process !== "undefined" && process.env && process.env.APPDATA) app = process.env.APPDATA; } catch (e) {}
    if (!app) app = path.resolve(BdApi.Plugins.folder, "..", "..");   /* …\AppData\Roaming\BetterDiscord\plugins → …\AppData\Roaming */
    const dir = path.join(app, "Microsoft", "Windows", "Themes");
    /* Mehrere Monitore: jeder hat sein Bild (Transcoded_000, _001 …) – welcher, steht im Theme (--tsw-mon) */
    if (mon !== undefined) { const f = path.join(dir, "Transcoded_" + String(mon).padStart(3, "0")); try { if (fs.existsSync(f)) return f; } catch (e) {} }
    return path.join(dir, "TranscodedWallpaper");
  }
  /* Kleines Protokoll im Plugin-Ordner (ThemeStudio.log), damit man sieht, woran es hängt */
  log(t) {
    try { const fs = require("fs"), path = require("path"), f = path.join(BdApi.Plugins.folder, "ThemeStudio.log");
      let old = ""; try { old = fs.readFileSync(f, "utf8"); } catch (e) {}
      const lines = (old ? old.split("\n") : []).filter(Boolean).slice(-80); lines.push(new Date().toLocaleTimeString("de-DE") + " " + t);
      fs.writeFileSync(f, lines.join("\n") + "\n"); } catch (e) {}
  }
  /* Bild dekodieren: erst direkt, sonst über ein normales Bild-Element */
  /* Datei als Base64 lesen (BetterDiscords fs gibt Binärdaten nicht zuverlässig heraus) und als Bild laden */
  async decode(b64) {
    const type = b64.startsWith("iVBOR") ? "image/png" : b64.startsWith("UklGR") ? "image/webp" : "image/jpeg";
    const img = new Image(); img.src = "data:" + type + ";base64," + b64; await img.decode(); return img;
  }
  async wand() {
    if (this.busy) return;
    /* Nur, wenn das eingeschaltete Theme das will (das Studio schreibt dann --tsw-an: 1 hinein) */
    /* Im Text der eingeschalteten Themes nachsehen statt über getComputedStyle – das zwingt Discord sonst alle 4 s, alle Stile neu zu berechnen */
    const css = this.themeText(), on = /--tsw-an\s*:\s*1\b/.test(css);
    if (on !== this.lastOn) { this.lastOn = on; this.log(on ? "Theme mit wechselndem Hintergrund ist an" : "Kein Theme mit wechselndem Hintergrund an"); }
    if (!on) { if (this.wandKey) { BdApi.DOM.removeStyle("ThemeStudioWandbild"); this.wandKey = ""; this.unflat(); } return; }
    try { this.flat(); } catch (e) {}
    const mon = parseInt((/--tsw-mon\s*:\s*(\d+)/.exec(css) || [])[1], 10) || 0;
    /* Ein Bild über alle Monitore gestreckt: das Studio schickt den Ausschnitt des gewählten Monitors mit (x y Breite Höhe als Anteile) */
    const cm = /--tsw-crop\s*:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(css), crop = cm ? cm.slice(1, 5).map(Number) : null;
    const fs = require("fs"), file = crop ? this.wallFile() : this.wallFile(mon); let st;
    try { st = fs.statSync(file); } catch (e) { if (this.lastErr !== "stat") { this.lastErr = "stat"; this.log("Desktop-Bild nicht lesbar: " + file + " – " + (e && e.message)); } return; }
    const key = file + ":" + String(st.mtimeMs || st.mtime) + ":" + st.size + ":" + (crop ? crop.join(",") : ""); if (key === this.wandKey) return;
    this.busy = true;
    try {
      const b64 = String(fs.readFileSync(file, "base64") || "");
      if (b64.length < 1400) throw new Error("Datei zu klein – Windows schreibt gerade");
      const bmp = await this.decode(b64), W0 = bmp.naturalWidth || bmp.width, H0 = bmp.naturalHeight || bmp.height;
      const sx = crop ? crop[0] * W0 : 0, sy = crop ? crop[1] * H0 : 0, w = crop ? crop[2] * W0 : W0, h = crop ? crop[3] * H0 : H0;
      const sc = Math.min(1, 2560 / Math.max(w, h)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc)); c.getContext("2d").drawImage(bmp, sx, sy, w, h, 0, 0, c.width, c.height);
      const url = c.toDataURL("image/jpeg", 0.88), pal = this.palette(c, c.width, c.height); if (bmp.close) bmp.close();
      let css = `:root { --tsw-bild: url("${url}") !important;`; if (pal) for (const k in pal) css += ` --tsw-${k}: ${pal[k]} !important;`; css += " }";
      BdApi.DOM.addStyle("ThemeStudioWandbild", css); this.wandKey = key; this.lastErr = "";
      this.log("Neues Desktop-Bild von Monitor " + (mon + 1) + (crop ? " (Ausschnitt aus dem gestreckten Bild)" : "") + " übernommen (" + Math.round(w) + "×" + Math.round(h) + ", Akzent " + (pal ? pal.accent : "–") + ")");
    } catch (e) { if (this.lastErr !== key) { this.lastErr = key; this.log("Fehler beim Bildwechsel: " + (e && e.message)); } }
    finally { this.busy = false; }
  }

  /* Mitgliederliste: breite, deckende Kästen (z. B. hervorgehobene Aktivitäts-Karten) durchsichtig machen – kleine Abzeichen bleiben */
  flat() {
    const root = document.querySelector('[class*="membersWrap_"]'); if (!root) return;
    for (const el of root.querySelectorAll("div:not([data-ts-chk])")) {
      el.dataset.tsChk = "1"; if (el.offsetWidth < 150) continue;
      const cs = getComputedStyle(el); if (cs.backgroundImage !== "none") continue;
      const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor); if (!m) continue; const p = m[1].split(",").map(parseFloat); if ((p.length > 3 ? p[3] : 1) < 0.5) continue;
      el.style.setProperty("background-color", "transparent", "important"); el.dataset.tsFlat = "1";
      const cls = String(el.className || "").split(/\s+/).map(c => c.replace(/_[\w-]+$/, "_")).join(" ");
      if (!this.flatSeen.has(cls)) { this.flatSeen.add(cls); this.log("Mitgliederliste: Kasten durchsichtig gemacht (" + cls + ", war " + cs.backgroundColor + ")"); }
    }
  }
  /* Einmalige Untersuchung: was in der rechten Liste einen Hintergrund hat (hilft, Discords Namen für Kästen zu finden) */
  dump() {
    const root = document.querySelector('[class*="membersWrap_"]') || document.querySelector('[class*="members_"]');
    if (!root) return this.log("Dump: keine Mitgliederliste offen");
    const short = el => (typeof el.className === "string" ? el.className : "").split(/\s+/).filter(Boolean).map(c => c.replace(/_[\w-]+$/, "_")).join(".");
    let n = 0;
    for (const el of root.querySelectorAll("*")) {
      if (n >= 40) break; const r = el.getBoundingClientRect(); if (r.width < 120 || r.height < 20) continue;
      const cs = getComputedStyle(el), bc = cs.backgroundColor, bi = cs.backgroundImage, be = getComputedStyle(el, "::before"), af = getComputedStyle(el, "::after");
      const has = x => x && x.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(x.backgroundColor) || (x.backgroundImage && x.backgroundImage !== "none");
      if (!has(cs) && !(be.content !== "none" && has(be)) && !(af.content !== "none" && has(af))) continue;
      n++; this.log("Dump " + el.tagName + "." + short(el) + " " + Math.round(r.width) + "x" + Math.round(r.height) + " bg=" + bc + " img=" + bi.slice(0, 60) + (be.content !== "none" && has(be) ? " ::before=" + be.backgroundColor + " " + be.backgroundImage.slice(0, 40) : "") + (af.content !== "none" && has(af) ? " ::after=" + af.backgroundColor + " " + af.backgroundImage.slice(0, 40) : "") + " text=" + (el.textContent || "").trim().slice(0, 30));
    }
    this.log("Dump fertig (" + n + " Einträge), Liste: " + root.tagName + "." + short(root));
  }
  unflat() { for (const el of document.querySelectorAll("[data-ts-flat]")) { el.style.removeProperty("background-color"); delete el.dataset.tsFlat; } for (const el of document.querySelectorAll("[data-ts-chk]")) delete el.dataset.tsChk; }

  /* Farben aus dem Bild – gleiche Rechnung wie „Discord an den Hintergrund anpassen“ im Studio */
  palette(src, W, H) {
    const hex = (r, g, b) => "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const hsl = h => { let [r, g, b] = rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let H = 0, S = 0; const L = (mx + mn) / 2;
      if (mx !== mn) { const d = mx - mn; S = L > .5 ? d / (2 - mx - mn) : d / (mx + mn); H = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4); H *= 60; } return [H, S, L]; };
    const fromHsl = (H, S2, L) => { const k = n => (n + H / 30) % 12, a = S2 * Math.min(L, 1 - L), f = n => L - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return hex(f(0) * 255, f(8) * 255, f(4) * 255); };
    const c = document.createElement("canvas"); c.width = 48; c.height = Math.max(8, Math.round(48 * H / W));
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(src, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data, buckets = new Map();
    for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 5) << 6 | (d[i + 1] >> 5) << 3 | (d[i + 2] >> 5);
      const b = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 }; b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; buckets.set(k, b); }
    const list = [...buckets.values()].map(b => ({ n: b.n, h: hex(b.r / b.n, b.g / b.n, b.b / b.n) }));
    list.forEach(o => { const [, S, L] = hsl(o.h); o.w = o.n * (0.4 + S) * (L < .08 || L > .95 ? 0.3 : 1); }); list.sort((a, b) => b.w - a.w);
    const cols = []; for (const o of list) { if (cols.every(p => { const a = rgb(p), b = rgb(o.h); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 60; })) cols.push(o.h); if (cols.length >= 6) break; }
    if (!cols.length) return null;
    const hs = cols.map(h => ({ h, c: hsl(h) })), sat = hs.filter(o => o.c[1] > .25 && o.c[2] > .15 && o.c[2] < .88).sort((a, b) => b.c[1] - a.c[1]);
    const a1 = (sat[0] || hs[0]).c, a2 = (sat.find(o => Math.abs(o.c[0] - a1[0]) > 25) || { c: [(a1[0] + 30) % 360, a1[1], a1[2]] }).c;
    const dk = hs.filter(o => o.c[2] < .3).sort((a, b) => a.c[2] - b.c[2])[0], [bH, bS0] = dk && dk.c[1] > .1 ? dk.c : [a1[0], a1[1] * .5], bS = Math.min(.5, bS0);
    return { accent: fromHsl(a1[0], Math.max(.5, Math.min(.9, a1[1])), Math.max(.48, Math.min(.62, a1[2]))),
      accent2: fromHsl(a2[0], Math.max(.45, Math.min(.85, a2[1])), Math.max(.55, Math.min(.7, a2[2]))),
      bgServer: fromHsl(bH, bS, .07), bgChannels: fromHsl(bH, bS, .1), bgChat: fromHsl(bH, bS, .13), bgFloat: fromHsl(bH, bS, .06), bgUser: fromHsl(bH, bS, .085),
      textNormal: fromHsl(a1[0], .15, .88), textHeader: fromHsl(a1[0], .2, .97), textMuted: fromHsl(a1[0], .12, .62), link: fromHsl(a2[0], .7, .72) };
  }
};
