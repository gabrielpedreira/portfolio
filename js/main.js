/* ==========================================================
   Lógica da página: idioma, render de conteúdo, filtros,
   lightbox, navegação ativa e animações de entrada.
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Idioma ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };
  let lang = store.get("lang") || (navigator.language || "pt").slice(0, 2);
  if (!I18N[lang]) lang = "pt";

  const t = (key) => I18N[lang][key] ?? key;
  const tx = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v[lang] ?? v.pt : v);

  function applyLang() {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("#langToggle [data-lang]").forEach((s) => s.classList.toggle("is-on", s.dataset.lang === lang));
    renderAll();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }
  $("#langToggle").addEventListener("click", () => {
    lang = lang === "pt" ? "en" : "pt";
    store.set("lang", lang);
    instant = true; applyLang(); instant = false;   // troca de idioma não reanima a página
  });

  /* ---------- Ícones ---------- */
  const ICONS = {
    github: '<svg viewBox="0 0 24 24"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>',
    artstation: '<svg viewBox="0 0 24 24"><path d="M0 17.7l2 3.5a2.4 2.4 0 0 0 2.2 1.4h13.4l-2.8-4.9H0zm24 0c0-.5-.1-.9-.4-1.3L15.7 2.7a2.4 2.4 0 0 0-2.1-1.3H9.4l12.2 21.1 1.9-3.3c.4-.6.5-.9.5-1.5zm-11.1-3.4L7.4 4.9 2 14.3h10.9z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2l-.5-.2z"/></svg>',
    email: '<svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.4L4 7.2V17h16V7.2l-8 5.2zM5.3 7l6.7 4.3L18.7 7H5.3z"/></svg>',
    itch: '<svg viewBox="0 0 24 24"><path d="M7 6h10a5 5 0 0 1 5 5v2a5 5 0 0 1-8.6 3.5h-2.8A5 5 0 0 1 2 13v-2a5 5 0 0 1 5-5zm1 3v2H6v2h2v2h2v-2h2v-2h-2V9H8zm8.5 1a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm2 2.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/></svg>'
  };

  /* ---------- Render ---------- */
  let activeFilter = null; // null = visão geral das categorias

  function renderDisciplines() {
    $("#disciplines").innerHTML = DISCIPLINES.map((d) => `<li>${tx(d)}</li>`).join("");
  }

  function renderStack() {
    $("#stackGrid").innerHTML = STACK.map((g) => `
      <article class="stack__group reveal-item" style="--c:${g.color}">
        <h3><i></i>${tx(g.title)}</h3>
        <p>${tx(g.desc)}</p>
        <ul class="chips">${g.items.map((it, j) => {
          const learning = typeof it === "object" && it.learning;
          const name = typeof it === "object" && it.name ? it.name : tx(it);
          return `<li class="${learning ? "is-learning" : ""}" style="--i:${j}" ${learning ? `title="${t("stack.learning")}"` : ""}>${name}</li>`;
        }).join("")}</ul>
      </article>`).join("");
  }

  const worksOf = (id) => WORKS.filter((w) => w.category === id || (w.also || []).includes(id));

  // botão "Jogar" do minigame (js/game.js abre ao clicar em [data-play])
  const playBtn = () => `<button class="playbtn" type="button" data-play aria-label="${t("game.play")}">
      <span class="playbtn__label mono">${t("game.play")}</span>
      <img src="assets/game/botao_jogar.png" alt="" width="180" height="96" loading="lazy">
    </button>`;

  function renderCategories() {
    $("#catsGrid").innerHTML = CATEGORIES.filter((c) => worksOf(c.id).length).map((c, i) => {
      const n = worksOf(c.id).length;
      const cls = [c.fit === "contain" ? "is-contain" : "", c.pixel ? "is-pixel" : ""].join(" ");
      return `<div class="cat reveal-card ${i === 0 ? "cat--wide" : ""}" data-cat="${c.id}" role="button" tabindex="0">
        <span class="cat__media ${cls}">${c.cover ? `<img src="${c.cover}" alt="" loading="lazy">` : ""}
          <span class="cat__hint mono">${t("work.clickHint")}</span></span>
        <span class="cat__body">
          <span class="cat__count mono">${n} ${n === 1 ? t("work.item") : t("work.items")}</span>
          <span class="cat__title">${tx(c.label)}</span>
          <span class="cat__blurb">${tx(c.blurb) || ""}</span>
          <span class="cat__cta"><span>${t("work.openMore")}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          ${c.id === "jogos" ? playBtn() : ""}
        </span>
      </div>`;
    }).join("");
  }

  function renderView() {
    const open = !!activeFilter;
    $("#catsGrid").hidden = open;
    $("#catView").hidden = !open;
    if (!open) return;
    const c = CATEGORIES.find((c) => c.id === activeFilter);
    $("#catTitle").textContent = tx(c.label);
    $("#catBlurb").textContent = tx(c.blurb) || "";
    renderWorks();
    observeReveal();
  }

  /* ---------- Arte de fundo de cada categoria (surge pela direita) ---------- */
  const artLayer = document.createElement("div");
  artLayer.className = "topic-art";
  artLayer.setAttribute("aria-hidden", "true");
  document.body.prepend(artLayer);
  let artInView = true;
  // fundo ilustrado da página: surge devagar quando a imagem termina de carregar
  const bgArt = $("#bgArt");
  if (bgArt) {
    const pre = new Image();
    pre.onload = () => requestAnimationFrame(() => bgArt.classList.add("is-in"));
    pre.src = "assets/img/fundos/inicial_v2.webp";
    // a arte cobre a página inicial inteira (do topo ao rodapé); com uma categoria aberta ela não reescala
    const fitBg = () => {
      if (activeFilter) return;
      bgArt.style.height = "0px";
      bgArt.style.height = document.documentElement.scrollHeight + "px";
    };
    addEventListener("load", fitBg);
    addEventListener("resize", () => { clearTimeout(fitBg.t); fitBg.t = setTimeout(fitBg, 150); });
    setTimeout(fitBg, 50);
  }
  function setTopicArt(id) {
    bgArt?.classList.toggle("is-dim", !!id);          // com uma categoria aberta, o fundo geral recua
    const c = CATEGORIES.find((c) => c.id === id);
    const src = c?.bg || null;
    const cur = artLayer.querySelector(".topic-art__img:not(.is-out)");
    if (cur && cur.dataset.src === src) return;
    if (cur) { cur.classList.add("is-out"); setTimeout(() => cur.remove(), 900); }   // sai pela direita
    if (!src) return;
    const img = new Image();
    img.className = "topic-art__img"; img.alt = ""; img.dataset.src = src; img.decoding = "async";
    img.onload = () => requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add("is-in")));
    img.src = src;
    artLayer.append(img);
  }
  // só aparece enquanto a seção Trabalhos estiver na tela
  document.addEventListener("topicchange", (e) => {
    artInView = e.detail.id === "trabalhos";
    artLayer.classList.toggle("is-hidden", !artInView);
  });

  function openCategory(id, scroll = true) {
    activeFilter = id;
    setTopicArt(id);
    renderView();
    try { history.replaceState(null, "", id ? "#" + id : "#trabalhos"); } catch {}
    if (scroll) $("#trabalhos").scrollIntoView({ behavior: "smooth" });
  }

  function catLabel(id) {
    const c = CATEGORIES.find((c) => c.id === id);
    return c ? tx(c.label) : id;
  }

  // descrição: 1º parágrafo vira "lead" (maior); ==trecho== ganha destaque na cor de acento
  function descHTML(txt) {
    const ps = String(txt || "").split("\n").map((p) => p.trim()).filter(Boolean);
    return ps.map((p, i) => `<p${i === 0 && ps.length > 1 ? ' class="lead"' : ""}>${p.replace(/==(.+?)==/g, '<mark class="hl">$1</mark>')}</p>`).join("");
  }

  function renderWorks() {
    if (!activeFilter) return;
    const list = worksOf(activeFilter);
    const grid = $("#worksGrid");
    if (!list.length) {
      grid.innerHTML = `<article class="card"><div class="card__media is-empty" data-empty="${t("work.soon")}"></div>
        <div class="card__body"><p class="card__desc">${t("work.empty")}</p></div></article>`;
      return;
    }
    grid.innerHTML = list.map((w, i) => {
      const idx = WORKS.indexOf(w);
      let media;
      if (w.sprite) {
        media = `<div class="card__media" data-open="${idx}" style="display:grid;place-items:center">
          <div class="sprite" data-frames="${w.sprite.frames}" data-fps="${w.sprite.fps}"
            style="width:100%;aspect-ratio:800/520;background:url('${w.sprite.src}') 0 0/${w.sprite.frames * 100}% 100% no-repeat"></div>`;
      } else if (w.cover) {
        const cls = [w.fit === "contain" ? "is-contain" : "", w.pixel ? "is-pixel" : ""].join(" ");
        const extra = (w.images?.length || 0) > 1 ? `<span class="card__count mono">+${w.images.length - 1}</span>` : "";
        media = `<div class="card__media ${cls}" data-open="${idx}"><img src="${w.cover}" alt="${tx(w.title)}" loading="lazy"
          onerror="this.parentNode.classList.add('is-empty');this.parentNode.dataset.empty='${t("work.noimg")}';this.remove()">${extra}`;
      } else {
        media = `<div class="card__media is-empty" data-empty="${t("work.noimg")}">`;
      }
      media += `<span class="card__badge">${catLabel(w.category)}</span>`;
      if (w.cover || w.sprite) media += `<span class="card__hint mono"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${t("work.zoomHint")}</span>`;
      if (w.status) media += `<span class="card__status">${tx(w.status)}</span>`;
      media += `</div>`;

      const L = w.links || {};
      const links = [
        L.code && `<a href="${L.code}" target="_blank" rel="noopener">${t("work.code")} ↗</a>`,
        L.view && `<a href="${L.view}" target="_blank" rel="noopener">${t("work.view")} ↗</a>`,
        L.play && `<a href="${L.play}" target="_blank" rel="noopener">${t("work.play")} ↗</a>`
      ].filter(Boolean).join("");

      return `<article class="card reveal-card ${w.featured ? "card--featured" : ""}">
        ${media}
        <div class="card__body">
          <h3 class="card__title">${tx(w.title)}</h3>
          <div class="card__desc">${descHTML(tx(w.desc))}</div>
          ${w.details ? `<dl class="card__details">${w.details.map((d) => `<div><dt>${tx(d.label)}</dt><dd>${d.items.map(tx).join(d.items.every((i) => typeof i === "string") ? " · " : "<br>")}</dd></div>`).join("")}</dl>` : ""}
          ${w.tags?.length ? `<ul class="chips">${w.tags.map((tg) => `<li>${tg}</li>`).join("")}</ul>` : ""}
          ${links ? `<div class="card__links">${links}</div>` : ""}
          ${w.game ? playBtn() : ""}
        </div>
      </article>`;
    }).join("");
  }

  function renderLinks() {
    $("#linksGrid").innerHTML = LINKS.map((l) => {
      const soon = !l.url;
      return `<a class="link reveal-item ${soon ? "is-soon" : ""}" ${soon ? "" : `href="${l.url}" target="_blank" rel="noopener"`}>
        <span class="link__icon">${ICONS[l.id] || ""}</span>
        <span><strong>${l.name}</strong><small>${soon ? t("links.soon") : l.handle}</small></span>
        ${l.copy ? `<button class="link__copy mono" type="button" data-copy="${l.copy}">${t("links.copy")}</button>` : `<span class="link__arrow">↗</span>`}
      </a>`;
    }).join("");
  }
  // copiar e-mail (o mailto pode não abrir em todo computador)
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const done = () => { b.textContent = t("links.copied"); setTimeout(() => (b.textContent = t("links.copy")), 1600); };
    (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject()).then(done, () => {
      const r = document.createRange(); r.selectNodeContents(b.closest(".link").querySelector("small"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    });
  });

  function renderAll() {
    renderDisciplines(); renderStack(); renderCategories(); renderView(); renderLinks();
    observeReveal();
  }

  $("#catsGrid").addEventListener("click", (e) => {
    if (e.target.closest("[data-play]")) return;
    const b = e.target.closest("[data-cat]");
    if (b) openCategory(b.dataset.cat);
  });
  $("#catsGrid").addEventListener("keydown", (e) => {
    if (e.target.matches?.("[data-cat]") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCategory(e.target.dataset.cat); }
  });
  $("#catBack").addEventListener("click", () => openCategory(null));
  // Link direto: site.com/#jogos abre a categoria
  // Ao ATUALIZAR a página tudo volta ao estado inicial: topo, sem categoria aberta, sem #âncora.
  // (Um link direto novo, ex.: site.com/#jogos, continua abrindo a categoria.)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const navEntry = performance.getEntriesByType?.("navigation")?.[0];
  const isReload = navEntry ? navEntry.type === "reload" : performance.navigation?.type === 1;
  if (isReload && location.hash) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  }
  addEventListener("load", () => { if (!location.hash) scrollTo({ top: 0, behavior: "instant" }); });
  scrollTo(0, 0);
  const initial = location.hash.slice(1);
  if (CATEGORIES.some((c) => c.id === initial)) { activeFilter = initial; setTopicArt(initial); }

  /* ---------- Prévia animada de spritesheets ---------- */
  let last = 0;
  (function tick(now) {
    if (now - last > 16) {
      $$(".sprite").forEach((el) => {
        const frames = +el.dataset.frames, fps = +el.dataset.fps;
        const f = Math.floor((now / 1000) * fps) % frames;
        el.style.backgroundPositionX = `${(f / (frames - 1)) * 100}%`;
      });
      last = now;
    }
    requestAnimationFrame(tick);
  })(0);

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  let lbImgs = [], lbIdx = 0;
  function openLB(work) {
    lbImgs = (work.images?.length ? work.images : [work.cover]).filter(Boolean);
    lb.classList.toggle("is-pixel", !!work.pixel);
    if (!lbImgs.length) return;
    lbIdx = 0; showLB(tx(work.title)); lb.hidden = false;
  }
  function showLB(caption) {
    const img = $("img", lb);
    lb.classList.remove("is-tall");
    img.onload = () => lb.classList.toggle("is-tall", img.naturalHeight / img.naturalWidth > 1.6);
    img.src = lbImgs[lbIdx];
    lb.scrollTop = 0;
    const cnt = lbImgs.length > 1 ? ` · ${lbIdx + 1}/${lbImgs.length}` : "";
    lb.dataset.count = cnt;
    if (caption) $("figcaption", lb).textContent = caption;
    $$(".lightbox__nav", lb).forEach((b) => (b.style.display = lbImgs.length > 1 ? "" : "none"));
  }
  $("#worksGrid").addEventListener("click", (e) => {
    const m = e.target.closest("[data-open]");
    if (m) openLB(WORKS[+m.dataset.open]);
  });
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.closest(".lightbox__close")) lb.hidden = true;
    if (e.target.closest(".lightbox__prev")) { lbIdx = (lbIdx - 1 + lbImgs.length) % lbImgs.length; showLB(); }
    if (e.target.closest(".lightbox__next")) { lbIdx = (lbIdx + 1) % lbImgs.length; showLB(); }
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") lb.hidden = true;
    if (e.key === "ArrowRight") $(".lightbox__next", lb).click();
    if (e.key === "ArrowLeft") $(".lightbox__prev", lb).click();
  });

  /* ---------- Navegação ativa + tópico visível ---------- */
  const nav = $(".nav");
  addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 10), { passive: true });

  const topicObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      $$(".nav__links a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
      // Evento usado pela aranha (fase 3) para saber qual tópico o usuário está vendo
      document.dispatchEvent(new CustomEvent("topicchange", { detail: { id, el: en.target } }));
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  $$("[data-topic]").forEach((s) => topicObs.observe(s));

  /* ---------- Revelar ao rolar ---------- */
  // Tudo entra ao rolar: blocos sobem com fade; cards "abrem" a imagem; stacks e links surgem um a um.
  const MOTION = !matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window;
  if (MOTION) document.documentElement.classList.add("js-motion");
  const STAGGER = { stackGrid: 150, linksGrid: 90 };
  const revealObs = MOTION ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      revealObs.unobserve(el);
      const step = STAGGER[el.id];
      if (step != null) {
        [...el.querySelectorAll(":scope > .reveal-item:not(.is-in)")].forEach((c, i) => { c.style.setProperty("--d", i * step + "ms"); c.classList.add("is-in"); });
      } else el.classList.add("is-in");
    });
  }, { threshold: .12, rootMargin: "0px 0px -6% 0px" }) : null;
  let instant = false;
  function observeReveal() {
    const items = $$(".reveal:not(.is-in), .reveal-card:not(.is-in)");
    const groups = Object.keys(STAGGER).map((id) => document.getElementById(id)).filter((g) => g && g.querySelector(".reveal-item:not(.is-in)"));
    if (!MOTION || instant) {                          // sem animação (acessibilidade) ou re-render ao trocar idioma
      items.forEach((el) => el.classList.add("is-in", "no-anim"));
      groups.forEach((g) => g.querySelectorAll(".reveal-item").forEach((c) => c.classList.add("is-in", "no-anim")));
      return;
    }
    items.forEach((el) => revealObs.observe(el));
    groups.forEach((g) => revealObs.observe(g));
  }
  $$(".section__head, .about").forEach((el) => el.classList.add("reveal"));

  /* ---------- Currículo (menu PT/EN) ---------- */
  function closeCv(except) {
    $$("[data-cv]").forEach((c) => {
      if (c === except) return;
      $(".cv__menu", c).hidden = true;
      $(".cv__toggle", c).setAttribute("aria-expanded", "false");
    });
  }
  document.addEventListener("click", (e) => {
    const box = e.target.closest("[data-cv]");
    const tog = e.target.closest(".cv__toggle");
    if (tog) {
      const menu = $(".cv__menu", box), open = menu.hidden;
      closeCv(box);
      menu.hidden = !open;
      tog.setAttribute("aria-expanded", String(open));
      if (open) {
        // o idioma atual do site aparece primeiro e em destaque
        const items = $$("a", menu);
        items.forEach((a) => a.classList.toggle("is-current", a.dataset.cvLang === lang));
        const cur = items.find((a) => a.dataset.cvLang === lang);
        if (cur) { menu.prepend(cur); cur.focus(); }
      }
      return;
    }
    if (!box || e.target.closest(".cv__menu a")) closeCv();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCv(); });
  document.addEventListener("langchange", () => {
    // na faixa de contato, o botão principal é o do idioma atual
    $$(".cvband__actions a").forEach((a) => {
      const on = a.dataset.cvLang === lang;
      a.classList.toggle("btn--primary", on);
      a.classList.toggle("btn--ghost", !on);
      if (on) a.parentNode.prepend(a);
    });
  });

  $("#year").textContent = new Date().getFullYear();
  applyLang();
})();
