/* ==========================================================
   Repaginação: idioma, lightbox dos trabalhos, tesoura e mata-moscas.
   O conteúdo dos trabalhos vem de js/data.js (window.WORKS).
   A aranha (spider.js) e o minijogo (game.js) seguem como antes.
   ========================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------- Idioma (pt / en) ---------- */
  let lang = "pt";
  const tx = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v[lang] ?? v.pt : v);
  const UI = {
    pt: { close: "Fechar", prev: "Anterior", next: "Próxima", code: "Ler o código no GitHub", play: "Jogar a demo",
          toEn: "Switch to English", dialog: "Trabalho" },
    en: { close: "Close", prev: "Previous", next: "Next", code: "Read the code on GitHub", play: "Play the demo",
          toEn: "Mudar para português", dialog: "Work" }
  };

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    for (const el of $$("[data-en]")) {
      if (el.dataset.pt === undefined) el.dataset.pt = el.innerHTML;
      if (el.classList.contains("tool__msg") && el.closest(".is-got")) {
        el.textContent = lang === "en" ? el.dataset.got : el.dataset.gotPt;
        continue;
      }
      el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.pt;
    }
    for (const [attr, key] of [["alt", "enAlt"], ["aria-label", "enAria"]]) {
      for (const el of $$(`[data-${key === "enAlt" ? "en-alt" : "en-aria"}]`)) {
        const ptKey = key === "enAlt" ? "ptAlt" : "ptAria";
        if (el.dataset[ptKey] === undefined) el.dataset[ptKey] = el.getAttribute(attr) || "";
        el.setAttribute(attr, lang === "en" ? el.dataset[key] : el.dataset[ptKey]);
      }
    }
    store.set("lang", lang);
    if (lb && !lb.hidden) renderInfo();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }
  $("#langToggle")?.addEventListener("click", () => applyLang(lang === "en" ? "pt" : "en"));
  if (store.get("lang") === "en") applyLang("en");

  /* ---------- Lightbox: imagem grande + texto completo ---------- */
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.hidden = true;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.innerHTML = `
    <div class="lb__stage">
      <img class="lb__img" alt="">
      <button class="lb__nav lb__prev" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="lb__nav lb__next" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
      <span class="lb__count" aria-live="polite"></span>
    </div>
    <aside class="lb__info">
      <p class="lb__status"></p>
      <h2 class="lb__title"></h2>
      <div class="lb__desc"></div>
      <ul class="lb__tags"></ul>
      <div class="lb__links"></div>
    </aside>
    <button class="lb__close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
  document.body.append(lb);

  let work = null, imgs = [], idx = 0, lastFocus = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function renderInfo() {
    if (!work) return;
    const u = UI[lang];
    $(".lb__title", lb).textContent = tx(work.title);
    lb.setAttribute("aria-label", tx(work.title));
    const st = $(".lb__status", lb);
    st.textContent = work.status ? tx(work.status) : "";
    st.hidden = !work.status;
    let html = (tx(work.desc) || "").split("\n").filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");
    for (const d of work.details || []) {
      html += `<h3>${esc(tx(d.label))}</h3><ul>${d.items.map((i) => `<li>${esc(tx(i))}</li>`).join("")}</ul>`;
    }
    $(".lb__desc", lb).innerHTML = html;
    $(".lb__tags", lb).innerHTML = (work.tags || []).map((t) => `<li>${esc(t)}</li>`).join("");
    let links = "";
    if (work.game) links += `<button class="btn btn--primary" type="button" data-play>${u.play}</button>`;
    if (work.links?.code) links += `<a class="btn btn--secondary" href="${esc(work.links.code)}" target="_blank" rel="noopener">${u.code}</a>`;
    $(".lb__links", lb).innerHTML = links;
    $(".lb__close", lb).setAttribute("aria-label", u.close);
    $(".lb__prev", lb).setAttribute("aria-label", u.prev);
    $(".lb__next", lb).setAttribute("aria-label", u.next);
  }
  function showImg() {
    const img = $(".lb__img", lb);
    img.src = imgs[idx];
    img.alt = tx(work.title);
    const many = imgs.length > 1;
    $$(".lb__nav", lb).forEach((b) => (b.hidden = !many));
    $(".lb__count", lb).textContent = many ? `${idx + 1} / ${imgs.length}` : "";
    $(".lb__stage", lb).scrollTop = 0;
  }
  function open(i, start = 0) {
    work = window.WORKS?.[i];
    if (!work) return;
    imgs = (work.images?.length ? work.images : [work.cover]).filter(Boolean);
    idx = Math.min(start, imgs.length - 1);
    lb.classList.toggle("is-pixel", !!work.pixel);
    renderInfo(); showImg();
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.documentElement.classList.add("lb-open");
    $(".lb__close", lb).focus();
  }
  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.documentElement.classList.remove("lb-open");
    lastFocus?.focus?.();
  }
  const step = (d) => { idx = (idx + d + imgs.length) % imgs.length; showImg(); };

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-work]");
    if (t && !lb.contains(t)) { e.preventDefault(); open(+t.dataset.work, +(t.dataset.img || 0)); return; }
    if (!lb.contains(e.target)) return;
    if (e.target === lb || e.target.closest(".lb__close")) close();
    else if (e.target.closest(".lb__prev")) step(-1);
    else if (e.target.closest(".lb__next")) step(1);
    else if (e.target.closest("[data-play]")) close();      // o jogo abre por cima (game.js)
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && imgs.length > 1) step(1);
    else if (e.key === "ArrowLeft" && imgs.length > 1) step(-1);
    else if (e.key === "Tab") {                              // foco preso dentro do lightbox
      const f = $$("button:not([hidden]), a[href]", lb).filter((el) => el.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Tesoura e mata-moscas (seção A aranha) ---------- */
  function collect(box, btn, flag, evt) {
    if (window[flag]) return;
    window[flag] = true;
    document.dispatchEvent(new Event(evt));
    box.classList.add("is-got");
    const msg = $(".tool__msg", box);
    msg.textContent = lang === "en" ? msg.dataset.got : msg.dataset.gotPt;
    msg.setAttribute("role", "status");
    btn.addEventListener("animationend", () => (btn.hidden = true), { once: true });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) btn.hidden = true;
  }
  [["#scissors", "#scissorsBtn", "__tesoura", "tesoura"], ["#swatterBox", "#swatterBtn", "__mataMoscas", "matamoscas"]].forEach(([b, s, flag, evt]) => {
    const box = $(b), btn = $(s);
    if (!box || !btn) return;
    btn.addEventListener("click", () => collect(box, btn, flag, evt));
    box.addEventListener("click", (e) => { if (!box.classList.contains("is-got") && !e.target.closest(".tool__btn")) btn.click(); });
  });
})();
