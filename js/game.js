/* ==========================================================
   Minigame "Infestação" — vitrine das animações da Lorena e do zumbi.
   Abre num painel que se expande a partir do botão "Jogar".
   Controles: ← →  andar · D atirar · S recarregar · B fechar
   ========================================================== */
(() => {
  const G = "assets/game/";
  const W = 960, H = 540;          // mundo lógico (16:9)
  const FLOOR = 452;               // linha dos pés, na calçada
  const S = 1.05;                  // escala dos sprites (quadro 128px)
  const FR = 128;
  const MAX_AMMO = 9, MAX_LIFE = 9, ZOMBIE_HP = 3;
  // dificuldade progressiva: a cada 12 abates ganha uma caveira e chegam mais zumbis
  // [esquerda, direita] por nível — 3 → 4 → 5 → 6 (máximo)
  const WAVES = [[0, 3], [1, 3], [2, 3], [3, 3]];
  const SKULL_AT = [8, 13, 17];            // abates para ganhar a 1ª, 2ª e 3ª caveira (mais de 7, 12 e 16)
  const level = () => SKULL_AT.filter((k) => kills >= k).length;

  // quadros detectados pela largura da imagem; fps de cada animação
  const SHEETS = {
    l_idle:   { src: "lorena_idle.png",         fps: 8,  loop: true },
    l_walk:   { src: "lorena_andando.png",      fps: 10, loop: true },
    l_shoot:  { src: "lorena_tiro.png",         fps: 15 },
    l_empty:  { src: "lorena_descarregada.png", fps: 15 },
    l_stab:   { src: "lorena_facada.png",       fps: 15 },
    l_reload: { src: "lorena_recarga.png",      fps: 15 },
    l_shootWalk:  { src: "lorena_tiro_andando.png",    fps: 12 },
    l_reloadWalk: { src: "lorena_recarga_andando.png", fps: 15 },
    l_hurt:   { src: "lorena_dano.png",         fps: 15 },
    l_grab:   { src: "lorena_agarrada.png",     fps: 8,  loop: true },
    l_dead:   { src: "lorena_morte.png",        fps: 8 },
    z_walk:   { src: "zumbi_andando.png",       fps: 8,  loop: true },
    z_idle:   { src: "zumbi_idle.png",          fps: 8,  loop: true },
    z_attack: { src: "zumbi_ataque.png",        fps: 10 },
    z_grab:   { src: "zumbi_agarrao.png",       fps: 10 },
    z_hurt:   { src: "zumbi_dano.png",          fps: 12 },
    z_dead:   { src: "zumbi_morte.png",         fps: 12 },
    over:     { src: "game_over.png",           fps: 12 },
    hz_idle:  { src: "zangao_idle.webp",      fps: 10, loop: true, fw: 258 },
    hz_bite:  { src: "zangao_mordida.webp",   fps: 15, loop: true, fw: 258 },
    hz_prep:  { src: "zangao_prep.webp",      fps: 15, fw: 258 },
    hz_sting: { src: "zangao_ferroada.webp",  fps: 15, fw: 258 },
    hz_undo:  { src: "zangao_desfaz.webp",    fps: 15, fw: 258 },
    hz_dano:  { src: "zangao_dano.webp",      fps: 15, fw: 258 },
    hz_fall:  { src: "zangao_queda.webp",     fps: 8,  loop: true, fw: 258 },
    hz_rot:   { src: "zangao_morto.webp",     fps: 6,  fw: 258 },
    bug:      { src: "inseto_voando.png",       fps: 12, loop: true },
    heli:     { src: "helicoptero.png",         fps: 16, loop: true }
  };
  const IMGS = { bg: "cenario.webp", front: "cenario_frente.webp", gun: "pistola_hud.png", gunEmpty: "pistola_descarregada_hud.png", bullet: "municao_hud.png",
    faceOk: "rosto_bem.png", faceCaution: "rosto_caution.png", faceDanger: "rosto_danger.png" };

  const TXT = {
    pt: { bugs: "INSETOS", kills: "ZUMBIS", restart: "Recomeçar", loading: "Carregando…", close: "Fechar jogo",
          walkR: "anda pra direita", walkL: "anda pra esquerda", shoot: "atira", stab: "facada", menu: "menu (X confirma)", reload: "recarrega", quit: "fecha o jogo",
          rotate: "Gire o celular para jogar", quitBtn: "Fechar", volume: "volume", mute: "Silenciar", unmute: "Ativar som" },
    en: { bugs: "INSECTS", kills: "ZOMBIES", restart: "Restart", loading: "Loading…", close: "Close game",
          walkR: "walk right", walkL: "walk left", shoot: "shoot", stab: "stab", menu: "menu (X confirms)", reload: "reload", quit: "close the game",
          rotate: "Rotate your phone to play", quitBtn: "Close", volume: "volume", mute: "Mute", unmute: "Unmute" }
  };
  // celular/tablet: tela cheia, pede para girar e mostra botões na tela
  const TOUCH = () => matchMedia("(pointer: coarse)").matches
    || (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 820)
    || new URLSearchParams(location.search).has("touch");
  const PORTRAIT = () => TOUCH() && innerHeight > innerWidth;
  function enterFull() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    try {
      const pr = req?.call(el, { navigationUI: "hide" });
      Promise.resolve(pr).then(() => screen.orientation?.lock?.("landscape")).catch(() => {});
    } catch {}
  }
  function exitFull() {
    try { screen.orientation?.unlock?.(); } catch {}
    const fe = document.fullscreenElement || document.webkitFullscreenElement;
    if (fe) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
  }
  const lang = () => (document.documentElement.lang || "pt").startsWith("en") ? "en" : "pt";
  const T = (k) => TXT[lang()][k];


  /* ---------- Som (Web Audio: baixa latência, sons sobrepostos) ---------- */
  const SND_DIR = "assets/sounds/";
  const SOUNDS = {
    wings: "zangao_asas.mp3", hzBite: "zangao_mordida.mp3", hzSting: "zangao_ferroada.mp3", hzHurt: "zangao_dano.mp3", hzDie: "zangao_morte.mp3",
    amb: "ambiencia.mp3", groan: "grunhido_zumbi.mp3", zdie: "zumbi_morte.mp3", zatk: "zumbi_ataque.mp3", ldie: "lorena_morte.mp3", amb2: "ambiencia_evento.mp3", heli: "helicoptero.mp3",
    stepsL: "passos_lorena.mp3", stepsZ: "passos_zumbi.mp3",
    shot: "tiro_pistola.mp3", empty: "pistola_descarregada.mp3", stab: "facada.mp3", bite: "mordida_zumbi.mp3", reload: "recarga_pistola.mp3", hurt: "lorena_dano.mp3"
  };
  const MENU_SOUNDS = {
    abre_e_fecha_menu: "assets/sounds/abre_e_fecha_menu.mp3",
    passando_itens_menu: "assets/sounds/passando_itens_menu.mp3",
    confirmacao_abrir_submenu: "assets/sounds/confirmação_abrir_submenu.mp3",
    mapa: "assets/sounds/mapa.mp3"
  };
  const MENU_SOUND_SEGMENTS = {
    open: [0.045, 0.235],     // começa no ataque do som (antes havia 52 ms de silêncio e o final era cortado)
    close: [0.838, 1.000],
    move: [0.210, 0.340],     // o arquivo tem 215 ms de silêncio no início: sem isso o som vinha atrasado
    confirm: [0.180, 0.330]   // 186 ms de silêncio no início
  };
  // trechos do arquivo de grunhidos (segundos): curtos p/ tiro/ataque, longo p/ agarrão
  const GROANS = [[0, 1.14], [1.69, 2.69], [3.13, 3.88], [7.36, 8.1]];
  const GROAN_LONG = [4.38, 7.04];
  // mordidas separadas no arquivo — uma a cada dano do agarrão
  const STABS = [[1.38, 1.95], [4.22, 4.79], [7.08, 7.64]];   // golpes separados no arquivo da facada
  const BITES = [[0, 0.79], [1.13, 1.78], [2.43, 2.92], [3.66, 4.44]];
  const LOOP_RANGE = { wings: [0.03, 3.86] };
  const MIX = { wings: 0.32, hzBite: 0.8, hzSting: 0.85, hzHurt: 0.8, hzDie: 0.85, stab: 0.9, heli: 0.55, zatk: 0.8, ldie: 0.9, amb2: 0.6, amb: 0.35, groan: 0.55, zdie: 0.7, stepsL: 0.55, stepsZ: 0.5, shot: 0.8, empty: 0.8, bite: 0.9, reload: 0.8, hurt: 0.8 };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };
  const A = {
    ctx: null, master: null, buf: {}, loops: {}, ready: null,
    vol: Math.min(1, Math.max(0, parseFloat(store.get("jogo.volume") ?? "0.7") || 0)),
    muted: store.get("jogo.mudo") === "1",
    last: {}, count: {},
    init() {
      if (this.ctx) return this.ready;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return (this.ready = Promise.resolve());
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyVol();
      const normal = Object.entries(SOUNDS).map(([k, f]) =>
        fetch(SND_DIR + f).then((r) => r.arrayBuffer())
          .then((ab) => new Promise((ok, no) => this.ctx.decodeAudioData(ab, ok, no)))
          .then((b) => { this.buf[k] = b; }).catch(() => {}));
      const menues = Object.entries(MENU_SOUNDS).map(([k, p]) =>
        fetch(encodeURI(p)).then((r) => r.arrayBuffer())
          .then((ab) => new Promise((ok, no) => this.ctx.decodeAudioData(ab, ok, no)))
          .then((b) => { this.buf[k] = b; }).catch(() => {}));
      this.ready = Promise.all([...normal, ...menues]);
      return this.ready;
    },
    applyVol() {
      if (!this.master) return;
      const v = this.muted ? 0 : this.vol;
      this.master.gain.setTargetAtTime(v * v, this.ctx.currentTime, 0.03);  // curva perceptiva
    },
    setVol(v) { this.vol = Math.min(1, Math.max(0, v)); if (this.vol > 0) this.muted = false; store.set("jogo.volume", this.vol); store.set("jogo.mudo", this.muted ? "1" : "0"); this.applyVol(); syncVolUI(); },
    toggleMute() { if (this.muted || this.vol === 0) { this.muted = false; if (this.vol === 0) this.vol = 0.5; } else this.muted = true; store.set("jogo.volume", this.vol); store.set("jogo.mudo", this.muted ? "1" : "0"); this.applyVol(); syncVolUI(); },
    resume() { this.ctx?.state === "suspended" && this.ctx.resume().catch(() => {}); },
    suspend() { this.ctx?.state === "running" && this.ctx.suspend().catch(() => {}); },
    playMenu(k, { seg, gain = 1, pan = 0, gap = 0 } = {}) {
      if (!this.ctx) return;
      const p = MENU_SOUNDS[k];
      if (!p) return;
      if (!this.buf[k]) {
        fetch(encodeURI(p)).then((r) => r.arrayBuffer())
          .then((ab) => new Promise((ok, no) => this.ctx.decodeAudioData(ab, ok, no)))
          .then((b) => { this.buf[k] = b; this.play(k, { seg, gain, pan, gap }); })
          .catch(() => {});
        return;
      }
      this.play(k, { seg, gain, pan, gap });
    },
    // toca um som (opcional: trecho [ini, fim], volume, pan -1..1, intervalo mínimo entre repetições)
    play(k, { seg, gain = 1, pan = 0, gap = 0 } = {}) {
      const b = this.buf[k]; if (!b || !this.ctx) return;
      const now = this.ctx.currentTime;
      const cacheKey = seg ? `${k}:${seg[0]}:${seg[1]}` : k;
      if (gap && now - (this.last[cacheKey] || -9) < gap) return;
      this.last[cacheKey] = now;
      this.count[k] = (this.count[k] || 0) + 1;
      const src = this.ctx.createBufferSource(); src.buffer = b;
      const g = this.ctx.createGain(); g.gain.value = (MIX[k] ?? 1) * gain;
      let node = src.connect(g);
      if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node = g.connect(p); }
      node.connect(this.master);
      if (seg) src.start(now, seg[0], seg[1] - seg[0]); else src.start(now);
    },
    // loops contínuos com volume ajustável (ambiência, passos)
    loop(k, gain, pan = 0) {
      const b = this.buf[k]; if (!b || !this.ctx) return;
      let l = this.loops[k];
      if (!l) {
        const src = this.ctx.createBufferSource(); src.buffer = b; src.loop = true;
        const lr = LOOP_RANGE[k];                       // pula o enchimento do mp3 no início/fim (sem "buraco" no loop)
        if (lr) { src.loopStart = lr[0]; src.loopEnd = Math.min(lr[1], b.duration - 0.01); }
        const g = this.ctx.createGain(); g.gain.value = 0;
        let node = src.connect(g);
        let p = null;
        if (this.ctx.createStereoPanner) { p = this.ctx.createStereoPanner(); node = g.connect(p); }
        node.connect(this.master);
        src.start(this.ctx.currentTime, lr ? lr[0] : Math.random() * b.duration * 0.6);
        l = this.loops[k] = { src, g, p, cur: -1 };
      }
      const target = MIX[k] * gain;
      if (Math.abs(target - l.cur) > 0.01) { l.g.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06); l.cur = target; }
      if (l.p) l.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.1);
    },
    quietLoops() { if (!this.ctx) return; for (const l of Object.values(this.loops)) { l.g.gain.cancelScheduledValues(this.ctx.currentTime); l.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04); l.cur = 0; } },
    stopLoops() { for (const l of Object.values(this.loops)) { try { l.src.stop(); } catch {} } this.loops = {}; }
  };
  const panOf = (x) => (x / W) * 1.4 - 0.7;
  const nearGain = (x) => Math.max(0.15, 1 - Math.abs(x - L.x) / 900);
  const offScreen = (x) => x > W + 30 || x < -30;
  const groan = (z, long = false, gap = 0.5) => {
    if (offScreen(z.x)) return;
    A.play("groan", { seg: long ? GROAN_LONG : GROANS[(Math.random() * GROANS.length) | 0], gain: nearGain(z.x), pan: panOf(z.x), gap });
  };
  function syncVolUI() {
    if (!root) return;
    const v = A.muted ? 0 : A.vol;
    root.querySelectorAll(".game__vol input").forEach((i) => (i.value = Math.round(v * 100)));
    root.querySelectorAll("[data-vol-ico]").forEach((b) => { b.dataset.level = v === 0 ? "0" : v < 0.5 ? "1" : "2"; b.setAttribute("aria-label", T(v === 0 ? "unmute" : "mute")); });
  }
  const SPEAKER = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="w1" d="M16 9.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="w2" d="M18.5 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="x" d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  /* ---------- carregamento ---------- */
  let loaded = null;
  function load() {
    if (loaded) return loaded;
    const one = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = G + src; });
    const jobs = [];
    for (const [k, s] of Object.entries(SHEETS)) jobs.push(one(s.src).then((i) => { s.img = i; s.frames = i ? Math.max(1, Math.round(i.width / (s.fw || FR))) : 1; }));
    for (const [k, src] of Object.entries(IMGS)) jobs.push(one(src).then((i) => { IMGS[k] = i; }));
    return (loaded = Promise.all(jobs));
  }

  /* ---------- markup ---------- */
  let root, panel, canvas, ctx, restartBtn, loadingEl, band;
  function build() {
    if (root) return;
    root = document.createElement("div");
    root.className = "game";
    root.hidden = true;
    root.innerHTML = `
      <div class="game__backdrop"></div>
      <div class="game__panel" role="dialog" aria-modal="true" aria-label="Infestação — minigame">
        <div class="game__screen">
          <canvas class="game__canvas" width="${W}" height="${H}"></canvas>
          <p class="game__loading mono"></p>
          <button class="game__restart" type="button" hidden></button>
          <button class="game__x" type="button">×</button>
        </div>
        <div class="game__pad" aria-hidden="true">
          <div class="game__pad-l">
            <button type="button" data-k="left">◀</button>
            <button type="button" data-k="right">▶</button>
          </div>
          <div class="game__pad-r">
            <button type="button" data-k="stab" class="is-stab"><b>A</b><small data-t="stab"></small></button>
            <button type="button" data-k="reload" class="is-reload"><b>S</b><small data-t="reload"></small></button>
            <button type="button" data-k="shoot" class="is-shoot"><b>D</b><small data-t="shoot"></small></button>
          </div>
          <button type="button" data-k="quit" class="game__pad-quit">✕</button>
          <button type="button" data-k="mute" class="game__pad-vol" data-vol-ico>${SPEAKER}</button>
          <button type="button" data-k="menu" class="game__pad-menu">W</button>
        </div>
        <div class="game__rotate">
          <div class="game__rotate-ico" aria-hidden="true"></div>
          <p class="mono" data-t="rotate"></p>
          <button type="button" class="game__rotate-close mono" data-t="quitBtn"></button>
        </div>
        <div class="game__band mono">
          <button type="button" data-k="left"><kbd>←</kbd><span data-t="walkL"></span></button>
          <button type="button" data-k="right"><kbd>→</kbd><span data-t="walkR"></span></button>
          <button type="button" data-k="shoot"><kbd>D</kbd><span data-t="shoot"></span></button>
          <button type="button" data-k="stab"><kbd>A</kbd><span data-t="stab"></span></button>
          <button type="button" data-k="reload"><kbd>S</kbd><span data-t="reload"></span></button>
          <button type="button" data-k="menu"><kbd>W</kbd><span data-t="menu"></span></button>
          <button type="button" data-k="quit"><kbd>B</kbd><span data-t="quit"></span></button>
          <div class="game__vol"><button type="button" class="game__vol-btn" data-vol-ico>${SPEAKER}</button><kbd>M</kbd><input type="range" min="0" max="100" step="5" aria-label="Volume"></div>
        </div>
      </div>`;
    document.body.appendChild(root);
    panel = root.querySelector(".game__panel");
    canvas = root.querySelector("canvas");
    ctx = canvas.getContext("2d");
    restartBtn = root.querySelector(".game__restart");
    loadingEl = root.querySelector(".game__loading");
    band = root.querySelector(".game__band");
    root.querySelector(".game__rotate-close").addEventListener("click", close);
    const range = root.querySelector(".game__vol input");
    range.addEventListener("input", () => A.setVol(range.value / 100));
    root.querySelector(".game__vol-btn").addEventListener("click", (e) => { e.preventDefault(); A.toggleMute(); });
    restartBtn.addEventListener("click", () => { reset(); canvas.focus?.(); });
    root.querySelector(".game__x").addEventListener("click", close);
    root.querySelector(".game__backdrop").addEventListener("click", close);
    // controles por toque/clique na tarja
    // (multitoque: cada dedo solta só o seu botão)
    const onPad = (e) => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      e.preventDefault();
      const k = b.dataset.k, id = e.pointerId;
      if (k === "quit") return close();
      if (k === "mute") { A.toggleMute(); return; }
      if (k === "menu") { M.open ? back() : openMenu(); return; }
      press(k, true); b.classList.add("is-on");
      navigator.vibrate?.(8);
      const up = (ev) => {
        if (ev.pointerId !== id) return;
        press(k, false); b.classList.remove("is-on");
        removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      };
      addEventListener("pointerup", up); addEventListener("pointercancel", up);
    };
    for (const el of [band, root.querySelector(".game__pad")]) {
      el.addEventListener("pointerdown", onPad);
      el.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    labels();
    document.addEventListener("langchange", labels);
    addEventListener("resize", fit);
    addEventListener("orientationchange", () => setTimeout(fit, 250));
    window.visualViewport?.addEventListener("resize", fit);
    document.addEventListener("fullscreenchange", () => setTimeout(fit, 100));
  }
  function labels() {
    if (!root) return;
    root.querySelectorAll("[data-t]").forEach((el) => (el.textContent = T(el.dataset.t)));
    restartBtn.textContent = T("restart");
    loadingEl.textContent = T("loading");
    root.querySelector(".game__x").setAttribute("aria-label", T("close"));
    syncVolUI();
  }
  function fit() {
    if (!canvas || root.hidden) return;
    root.classList.toggle("is-touch", TOUCH());
    // altura VISÍVEL de verdade (sem barra do navegador) para os botões nunca cortarem
    const vv = window.visualViewport;
    root.style.setProperty("--gvh", Math.round(vv ? vv.height : innerHeight) + "px");
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(W, Math.min(1920, Math.round(r.width * dpr)));
    if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * H / W); }
  }

  /* ---------- entrada ---------- */
  const input = { left: false, right: false, shoot: false, shootQ: false, reload: false, stab: false };
  function press(k, down) {
    if (k === "shoot") { if (down && !input.shoot) input.shootQ = true; input.shoot = down; }
    else if (k === "reload") { if (down) input.reload = true; }
    else if (k === "stab") { if (down) input.stab = true; }
    else input[k] = down;
  }
  function onKey(e) {
    if (root.hidden) return;
    if (M.open) return menuKey(e);
    const down = e.type === "keydown";
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let act = null;
    if (k === "ArrowLeft") act = "left";
    else if (k === "ArrowRight") act = "right";
    else if (k === "d") act = "shoot";
    else if (k === "s") act = "reload";
    else if (k === "a") act = "stab";
    else if (k === "m") { e.preventDefault(); e.stopPropagation(); if (down && !e.repeat) A.toggleMute(); return; }
    else if (k === "w") { e.preventDefault(); e.stopPropagation(); if (down && !e.repeat) openMenu(); return; }
    else if ((k === "b" || k === "Escape") && down) { e.preventDefault(); e.stopPropagation(); return close(); }
    else if (k === "ArrowUp" || k === "ArrowDown" || k === " ") { e.preventDefault(); return; }
    if (!act) return;
    e.preventDefault(); e.stopPropagation();
    if (down && e.repeat && act !== "left" && act !== "right") return;
    press(act, down);
  }

  /* ---------- estado ---------- */
  let L, zombies, kills, spawnQ, over, running = false, last = 0, raf = 0, uid = 0;

  const anim = (key) => ({ key, t: 0 });
  const frameOf = (a) => {
    const s = SHEETS[a.key]; const f = Math.floor(a.t * s.fps);
    return s.loop ? f % s.frames : Math.min(f, s.frames - 1);
  };
  const done = (a) => { const s = SHEETS[a.key]; return !s.loop && a.t * s.fps >= s.frames; };
  const dur = (key) => SHEETS[key].frames / SHEETS[key].fps;

  function reset() {
    L = { x: 110, dir: 1, st: "idle", a: anim("l_idle"), ammo: MAX_AMMO, reserve: 150, life: MAX_LIFE, fired: false, grabbedBy: null };
    inv = START_INV.slice();
    zombies = [];
    kills = 0;
    spawnQ = [];
    over = { fade: 0, t: -1, shown: false };
    bug = null; heli = null; hornet = null; hornetQ = null; hornetKills = 0; hzSide = 1;
    for (let i = 0; i < WAVES[0][1]; i++) spawn(1, W + 70 + i * 150);
    restartBtn.hidden = true;
    Object.keys(input).forEach((k) => (input[k] = false));
  }
  function spawn(side, x) {
    const off = 60 + Math.random() * 80;
    zombies.push({
      id: ++uid, from: side, x: x ?? (side > 0 ? W + off : -off), hp: ZOMBIE_HP,
      st: "walk", a: anim("z_walk"), speed: 36 + Math.random() * 16,
      cool: 0.3 + Math.random() * 0.6, idleFor: 0, hitDone: false, fadeOut: 1, dmg: 0
    });
    zombies[zombies.length - 1].a.t = Math.random();
  }
  const setL = (st, key) => { L.st = st; L.a = anim(key); L.fired = false; L.hit = false; };
  const setZ = (z, st, key) => { z.st = st; z.a = anim(key); z.hitDone = false; };
  const alive = (z) => z.st !== "dead";
  const lorenaDown = () => L.st === "dead";

  function hurtLorena(n) {
    if (lorenaDown()) return;
    L.life = Math.max(0, L.life - n);
    A.play("hurt", { pan: panOf(L.x) * 0.6, gap: 0.12 });
    if (L.life <= 0) die();
  }
  function die() {
    setL("dead", "l_dead");
    A.play("ldie", { pan: panOf(L.x) * 0.6 });
    if (L.grabbedBy) { const z = L.grabbedBy; L.grabbedBy = null; setZ(z, "walk", "z_walk"); z.cool = 99; }
    over.t = 0;
  }

  /* ---------- eventos por abates ---------- */
  // a cada 7 abates: ambiência extra; a cada 10: um inseto gigante passa voando ao longe, atrás dos prédios
  function milestones() {
    if (kills % 7 === 0) A.play("amb2");
    if (kills % 10 === 0) spawnBug();
    if (kills % 12 === 0) spawnHeli();
  }
  // helicóptero ao fundo (a cada 12 abates): o desenho aponta para a esquerda
  let heli = null;
  function spawnHeli() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    heli = { dir, x: dir > 0 ? -120 : W + 120, y0: 72 + Math.random() * 22, t: 0, a: anim("heli"), speed: 62 + Math.random() * 16 };
  }
  function updateHeli(dt) {
    if (!heli) return;
    heli.t += dt; heli.a.t += dt;
    heli.x += heli.dir * heli.speed * dt;
    if (heli.x < -160 || heli.x > W + 160) heli = null;
  }
  function drawHeli() {
    if (!heli) return;
    const s = SHEETS.heli; if (!s.img) return;
    const size = FR * 0.5;                                   // longe
    const y = heli.y0 + Math.sin(heli.t * 0.9) * 5;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.translate(heli.x, y);
    ctx.rotate(0.06 * heli.dir);                              // leve inclinação com o bico para baixo
    if (heli.dir > 0) ctx.scale(-1, 1);
    ctx.drawImage(s.img, frameOf(heli.a) * FR, 0, FR, FR, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  let bug = null;
  function spawnBug() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    bug = { dir, x: dir > 0 ? -60 : W + 60, y0: 112 + Math.random() * 30, t: 0, a: anim("bug"), speed: 95 + Math.random() * 30 };
  }
  function updateBug(dt) {
    if (!bug) return;
    bug.t += dt; bug.a.t += dt;
    bug.x += bug.dir * bug.speed * dt;
    if (bug.x < -80 || bug.x > W + 80) {
      if (!hornet && !hornetQ) hornetQ = { side: bug.dir, t: 3 };   // 3 s depois o zangão chega pelo mesmo lado
      bug = null;
    }
  }
  function drawBug() {
    if (!bug) return;
    const s = SHEETS.bug; if (!s.img) return;
    const size = FR * 0.34;                                  // longe: bem pequeno
    const y = bug.y0 + Math.sin(bug.t * 1.3) * 26 + Math.sin(bug.t * 7) * 2;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.translate(bug.x, y);
    if (bug.dir < 0) ctx.scale(-1, 1);                       // o desenho olha para a direita
    ctx.drawImage(s.img, frameOf(bug.a) * FR, 0, FR, FR, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  /* ---------- Lorena ---------- */
  // anda na direção mv (-1/1) sem atravessar zumbis; devolve true se andou
  function stepLorena(mv, dt) {
    let nx = Math.max(40, Math.min(W - 40, L.x + mv * 120 * dt));
    for (const z of zombies) {
      if (!alive(z)) continue;
      const d = (z.x - L.x) * mv;
      if (d > 0 && d < STOP + 40) nx = mv > 0 ? Math.min(nx, z.x - (STOP - 6)) : Math.max(nx, z.x + (STOP - 6));
    }
    if ((nx - L.x) * mv > 0) { L.x = nx; return true; }
    return false;
  }
  // troca a animação mantendo o progresso (o tiro/recarga continua do mesmo ponto)
  function swapAnim(st, key) {
    const from = SHEETS[L.a.key], to = SHEETS[key];
    const p = Math.min(0.999, (L.a.t * from.fps) / from.frames);
    L.st = st; L.a = { key, t: (p * to.frames) / to.fps };
  }
  const heldDir = () => (input.right ? 1 : 0) - (input.left ? 1 : 0);
  function updateLorena(dt) {
    L.a.t += dt;
    switch (L.st) {
      case "idle": case "walk": {
        const walking = heldDir() !== 0;
        if (input.reload) {
          input.reload = false;
          if (L.ammo < MAX_AMMO && L.reserve > 0) { walking ? setL("reloadWalk", "l_reloadWalk") : setL("reload", "l_reload"); break; }
        }
        if (input.stab) {
          input.stab = false; input.shootQ = false;
          setL("stab", "l_stab");                    // facada: ciclo completo, não interrompe
          break;
        }
        if (input.shootQ || input.shoot) {
          input.shootQ = false;
          if (L.ammo > 0) walking ? setL("shootWalk", "l_shootWalk") : setL("shoot", "l_shoot");
          else { setL("empty", "l_empty"); A.play("empty", { pan: panOf(L.x) * 0.6 }); }   // clique da arma vazia
          break;
        }
        const mv = heldDir();
        if (mv) {
          L.dir = mv;
          stepLorena(mv, dt);
          if (L.st !== "walk") setL("walk", "l_walk");
        } else if (L.st !== "idle") setL("idle", "l_idle");
        break;
      }
      case "shoot":
        if (heldDir() === L.dir && heldDir() !== 0 && !done(L.a)) { swapAnim("shootWalk", "l_shootWalk"); break; }   // voltou a andar: continua andando
        if (!L.fired && frameOf(L.a) >= 3) { L.fired = true; L.ammo--; A.play("shot", { pan: panOf(L.x) * 0.6 }); fire(); }
        if (done(L.a)) setL("idle", "l_idle");      // ciclo completo, nunca interrompido por outro tiro
        break;
      case "shootWalk":                                  // atira andando: segue na direção em que olha
        if (heldDir() !== L.dir) { swapAnim("shoot", "l_shoot"); break; }   // soltou/virou: termina parada (sem "moonwalk")
        stepLorena(L.dir, dt);
        if (!L.fired && frameOf(L.a) >= 3) { L.fired = true; L.ammo--; A.play("shot", { pan: panOf(L.x) * 0.6 }); fire(); }
        if (done(L.a)) setL("idle", "l_idle");      // ciclo completo; no quadro seguinte volta a andar se a tecla estiver pressionada
        break;
      case "reloadWalk":                                 // recarrega andando
        if (heldDir() !== L.dir) { swapAnim("reload", "l_reload"); break; }
        stepLorena(L.dir, dt);
        if (!L.fired && frameOf(L.a) >= 8) { L.fired = true; A.play("reload", { pan: panOf(L.x) * 0.6 }); }
        if (done(L.a)) { refill(); setL("idle", "l_idle"); }
        input.shootQ = false;
        break;
      case "empty":
        if (done(L.a)) setL("idle", "l_idle");
        break;
      case "stab":
        if (!L.fired && frameOf(L.a) >= 3) { L.fired = true; A.play("stab", { seg: STABS[(Math.random() * STABS.length) | 0], pan: panOf(L.x) * 0.6 }); }
        if (!L.hit && frameOf(L.a) >= 4) { L.hit = true; stab(); }
        if (done(L.a)) { L.hit = false; setL("idle", "l_idle"); }
        input.shootQ = false; input.stab = false;
        break;
      case "reload":
        if (heldDir() === L.dir && heldDir() !== 0 && !done(L.a)) { swapAnim("reloadWalk", "l_reloadWalk"); break; }
        if (!L.fired && frameOf(L.a) >= 7) { L.fired = true; A.play("reload", { pan: panOf(L.x) * 0.6 }); }   // som no encaixe do pente
        if (done(L.a)) { refill(); setL("idle", "l_idle"); }
        input.shootQ = false;
        break;
      case "hurt":
        if (done(L.a)) setL("idle", "l_idle");
        input.shootQ = false;
        break;
      case "grab":
        input.shootQ = false; input.reload = false;
        break;
      case "dead":
        break;
    }
  }
  function hitZombie(best) {
    best.hp--;
    if (best.hp <= 0) { setZ(best, "dead", "z_dead"); kills++; A.play("zdie", { gain: nearGain(best.x), pan: panOf(best.x) }); milestones(); }
    else { setZ(best, "hurt", "z_hurt"); groan(best, false, 0.25); best.cool = Math.max(best.cool, 0.25); }
  }
  // golpe corpo a corpo: acerta o zumbi mais próximo à frente, ao alcance da faca
  function stab() {
    let best = null, bd = 1e9;
    for (const z of zombies) {
      if (!alive(z) || z.st === "grab") continue;
      const d = (z.x - L.x) * L.dir;
      if (d > -10 && d <= STOP + 24 && d < bd) { bd = d; best = z; }
    }
    if (hornetHittable()) {
      const d = (hornet.x - L.x) * L.dir;
      if (d > -10 && d <= STOP + 34 && d < bd) return hitHornet();
    }
    if (best) hitZombie(best);
  }
  function fire() {
    let best = null, bd = 1e9;
    for (const z of zombies) {
      if (!alive(z) || z.st === "grab") continue;
      if (z.x < -20 || z.x > W + 20) continue;
      const d = (z.x - L.x) * L.dir;
      if (d > -10 && d < bd) { bd = d; best = z; }
    }
    if (hornetHittable()) {
      const d = (hornet.x - L.x) * L.dir;
      if (d > -10 && d < bd) return hitHornet();
    }
    if (!best) return;
    hitZombie(best);
  }

  /* ---------- Zangão (inimigo voador) ----------
     Surge 3 s depois que o inseto do fundo some, pelo mesmo lado para onde ele voou.
     Base: paira num canto alto, cruza para o outro lado da Lorena (sempre virado para ela),
     às vezes desce até a altura dela e volta a subir. Ataques: mordida (60%) e ferroada (40%). */
  const HZ = {
    hp: 9, k: 0.6, fw: 258, fh: 216, cx: 0.49, cy: 0.5,
    high: [150, 215], low: 384, speed: 210, biteSpeed: 430, gravity: 1300,
    attackEvery: [3.2, 6.0], hoverFor: [1.4, 3.0]
  };
  let hornet = null, hornetQ = null, hornetKills = 0, hzSide = 1;
  const hrnd = (a, b) => a + Math.random() * (b - a);
  const hornetAlive = () => hornet && hornet.st !== "fall" && hornet.st !== "rot";
  const zombieCap = () => (hornet ? 1 : Infinity);   // com o zangão em campo, no máximo 1 zumbi

  function spawnHornet(side) {
    if (hornet || over.t >= 0) return;
    hornet = { x: side > 0 ? W + 110 : -110, y: hrnd(...HZ.high), vx: 0, vy: 0, hp: HZ.hp, st: "enter", a: anim("hz_idle"),
      tx: side > 0 ? W - 130 : 130, ty: hrnd(...HZ.high), wait: hrnd(...HZ.hoverFor), atk: hrnd(...HZ.attackEvery),
      t: 0, hit: false, ph: Math.random() * 6, fade: 1, face: side > 0 ? -1 : 1 };
  }
  const setH = (st, key) => { hornet.st = st; hornet.a = anim(key); hornet.t = 0; hornet.hit = false; };
  const sideOf = (x) => (x >= L.x ? 1 : -1);
  const otherSideX = () => {           // ponto do outro lado da Lorena, dentro da tela
    const s = -sideOf(hornet.x);
    return Math.max(90, Math.min(W - 90, L.x + s * hrnd(170, 330)));
  };
  // move suavemente até (tx, ty) com o zigue-zague de inseto; devolve true ao chegar
  function flyTo(dt, speed) {
    const h = hornet, dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy);
    if (d < 4) return true;
    const sp = Math.min(speed, d * 3.2);
    h.x += (dx / d) * sp * dt;
    h.y += (dy / d) * sp * dt + Math.sin(h.t * 9 + h.ph) * 22 * dt;
    return false;
  }

  function updateHornet(dt) {
    if (hornetQ) { hornetQ.t -= dt; if (hornetQ.t <= 0) { const s = hornetQ.side; hornetQ = null; spawnHornet(s); } }
    const h = hornet; if (!h) return;
    h.t += dt; h.a.t += dt;
    if (h.st !== "dive" && h.st !== "bite" && h.st !== "fall" && h.st !== "rot") h.face = h.x > L.x ? -1 : 1;   // sempre de frente para ela
    const bob = Math.sin(performance.now() / 260 + h.ph) * 0.35;
    switch (h.st) {
      case "enter":
        if (flyTo(dt, HZ.speed * 1.3)) setH("hover", "hz_idle");
        break;
      case "hover": {                                    // comportamento base: paira, cruza, desce/sobe
        h.y += bob;
        h.wait -= dt; h.atk -= dt;
        if (h.atk <= 0 && !lorenaDown()) { h.atk = hrnd(...HZ.attackEvery); return Math.random() < 0.6 ? startBite() : startSting(); }
        if (h.wait <= 0) {
          const low = Math.abs(h.y - HZ.low) < 30;
          if (low) { h.tx = h.x + hrnd(-40, 40); h.ty = hrnd(...HZ.high); }            // estava na altura dela: sobe
          else if (Math.random() < 0.3) { h.tx = h.x + hrnd(-30, 30); h.ty = HZ.low; } // às vezes desce
          else { h.tx = otherSideX(); h.ty = hrnd(...HZ.high); }                      // cruza para o outro lado
          h.tx = Math.max(70, Math.min(W - 70, h.tx));
          setH("move", "hz_idle"); h.wait = hrnd(...HZ.hoverFor);
        }
        break;
      }
      case "move":
        h.atk -= dt * 0.5;
        if (flyTo(dt, HZ.speed)) setH("hover", "hz_idle");
        break;
      // ---- mordida: desce até a altura dela e avança em linha reta, atravessando-a ----
      case "biteAlign":
        if (flyTo(dt, HZ.speed * 1.4)) { A.play("hzBite", { pan: panOf(hornet.x) }); setH("bite", "hz_bite"); h.vx = (L.x >= h.x ? 1 : -1) * HZ.biteSpeed; h.face = Math.sign(h.vx); }
        break;
      case "bite":
        h.x += h.vx * dt;
        if (!h.hit && Math.abs(h.x - L.x) < 34 && !lorenaDown()) { h.hit = true; damageLorena(1); }
        if ((h.vx > 0 && h.x > L.x + 170) || (h.vx < 0 && h.x < L.x - 170) || h.x < 40 || h.x > W - 40) {
          h.tx = Math.max(90, Math.min(W - 90, h.x + Math.sign(h.vx) * 40)); h.ty = hrnd(...HZ.high);
          setH("move", "hz_idle");
        }
        break;
      // ---- ferroada: prepara num canto alto, mergulha em V passando pela Lorena e sobe do outro lado ----
      case "stingGo":
        if (flyTo(dt, HZ.speed * 1.4)) { setH("stingPrep", "hz_prep"); hornet.aim = L.x; A.play("hzSting", { pan: panOf(hornet.x) }); }   // premedita: mira onde ela está agora
        break;
      case "stingPrep":                                 // telegrafa o ataque (dá tempo de fugir)
        h.y += bob;
        if (h.t >= dur("hz_prep") + 0.35) {
          const s = h.x < L.x ? 1 : -1;
          // mergulha no ponto mirado durante a preparação; quem sair dali escapa
          const bx = h.aim;
          h.v = { x0: h.x, y0: h.y, bx, by: HZ.low + 6, x1: Math.max(80, Math.min(W - 80, 2 * bx - h.x)), y1: hrnd(...HZ.high) };
          h.face = s; setH("dive", "hz_sting");
        }
        break;
      case "dive": {
        const T = dur("hz_sting"), u = Math.min(1, h.t / T), v = h.v;
        // V: desce até (bx, by) na metade do tempo e sobe até (x1, y1)
        if (u < 0.5) { const e = u / 0.5, ee = e * e; h.x = v.x0 + (v.bx - v.x0) * e; h.y = v.y0 + (v.by - v.y0) * ee; }
        else { const e = (u - 0.5) / 0.5, ee = 1 - (1 - e) * (1 - e); h.x = v.bx + (v.x1 - v.bx) * e; h.y = v.by + (v.y1 - v.by) * ee; }
        if (!h.hit && u > 0.42 && u < 0.58 && Math.abs(h.x - L.x) < 40 && !lorenaDown()) { h.hit = true; damageLorena(3); }
        if (u >= 1) setH("stingEnd", "hz_undo");
        break;
      }
      case "stingEnd":
        h.y += bob;
        if (h.t >= dur("hz_undo")) { setH("hover", "hz_idle"); h.wait = hrnd(...HZ.hoverFor); }
        break;
      case "hurt":
        h.x += h.kb * dt; h.kb *= Math.exp(-6 * dt);
        if (h.t >= dur("hz_dano")) { h.tx = h.x; h.ty = hrnd(...HZ.high); setH("move", "hz_idle"); }
        break;
      case "fall": {                                    // morreu: cai girando a animação de queda
        h.vy += HZ.gravity * dt; h.y += h.vy * dt; h.x += h.vx * dt; h.vx *= Math.exp(-1.5 * dt);
        const ground = FLOOR - (0.893 - HZ.cy) * HZ.fh * HZ.k;
        if (h.y >= ground) { h.y = FLOOR - (0.69 - HZ.cy) * HZ.fh * HZ.k; setH("rot", "hz_rot"); }
        break;
      }
      case "rot":                                       // no chão: se decompõe e some
        if (done(h.a)) { h.fade -= dt * 1.2; if (h.fade <= 0) hornet = null; }
        break;
    }
    if (hornet && h.st !== "fall" && h.st !== "rot") h.x = Math.max(-140, Math.min(W + 140, h.x));
  }
  function startBite() {
    const h = hornet;
    h.tx = Math.max(70, Math.min(W - 70, h.x)); h.ty = HZ.low;
    if (Math.abs(h.x - L.x) < 140) h.tx = Math.max(70, Math.min(W - 70, L.x + sideOf(h.x) * 220));
    setH("biteAlign", "hz_idle");
  }
  function startSting() {
    const h = hornet, s = sideOf(h.x);
    h.tx = Math.max(90, Math.min(W - 90, L.x + s * hrnd(230, 320))); h.ty = HZ.high[0] - 10;
    setH("stingGo", "hz_idle");
  }
  function damageLorena(n) {
    if (L.st !== "grab" && L.st !== "dead") setL("hurt", "l_hurt");
    hurtLorena(n);
  }
  // tiro/facada: só acerta quando ele está na altura do corpo dela
  const hornetHittable = () => hornetAlive() && hornet.y > 300 && hornet.x > -20 && hornet.x < W + 20;
  function hitHornet() {
    const h = hornet;
    h.hp--;
    if (h.hp <= 0) { h.vx = h.face * -60; h.vy = -60; setH("fall", "hz_fall"); hornetKills++; A.play("hzDie", { pan: panOf(h.x) }); return; }
    A.play("hzHurt", { pan: panOf(h.x), gap: 0.1 });
    if (h.st === "dive" || h.st === "stingPrep" || h.st === "stingEnd") return;   // ferroada não é interrompida
    h.kb = (h.x > L.x ? 1 : -1) * 160;
    setH("hurt", "hz_dano");
  }
  function drawHornet() {
    const h = hornet; if (!h) return;
    const s = SHEETS[h.a.key]; if (!s.img) return;
    const w = HZ.fw * HZ.k, hh = HZ.fh * HZ.k;
    ctx.save();
    ctx.globalAlpha = Math.max(0, h.fade);
    ctx.imageSmoothingEnabled = true;
    ctx.translate(Math.round(h.x), Math.round(h.y));
    if (h.face < 0) ctx.scale(-1, 1);                    // o desenho olha para a direita
    ctx.drawImage(s.img, frameOf(h.a) * HZ.fw, 0, HZ.fw, HZ.fh, -w * HZ.cx, -hh * HZ.cy, w, hh);
    ctx.restore();
  }
  function hornetShadow() {
    const h = hornet; if (!h || h.st === "rot") return;
    const k = Math.max(0.25, 1 - (FLOOR - h.y) / 360);
    ctx.fillStyle = `rgba(0,0,0,${0.28 * k})`;
    ctx.beginPath(); ctx.ellipse(h.x, FLOOR + 1, 34 * k, 6 * k, 0, 0, Math.PI * 2); ctx.fill();
  }

  /* ---------- Zumbis ---------- */
  const STOP = 58, GAP = 46;
  function updateZombies(dt) {
    const idleCount = zombies.filter((z) => z.st === "idle").length;
    let grabbing = zombies.some((z) => z.st === "grab");
    // o da frente ataca quando pode; retorna true se atacou
    const tryAttack = (z, side) => {
      if (rank.get(z) !== 0 || z.cool > 0 || lorenaDown() || L.st === "grab") return false;
      const canGrab = !grabbing && L.st !== "hurt";
      if (canGrab && Math.random() < 0.28) { startGrab(z, side); grabbing = true; }
      else { setZ(z, "attack", "z_attack"); groan(z, false, 0.3); }
      return true;
    };
    // ordem de chegada em cada lado para formar fila sem sobrepor
    const rank = new Map();
    for (const side of [1, -1]) {
      zombies.filter((z) => alive(z) && Math.sign(z.x - L.x || 1) === side)
        .sort((a, b) => Math.abs(a.x - L.x) - Math.abs(b.x - L.x))
        .forEach((z, i) => rank.set(z, i));
    }
    for (const z of zombies) {
      z.a.t += dt;
      const side = Math.sign(z.x - L.x) || 1;
      const dist = Math.abs(z.x - L.x);
      const target = STOP + (rank.get(z) || 0) * GAP;
      z.cool -= dt;
      switch (z.st) {
        case "walk": {
          if (dist > target + 1) {
            z.x -= side * Math.min(z.speed * dt, dist - target);
            // evento aleatório: um único zumbi para por um instante (andar tem prioridade)
            if (idleCount === 0 && z.x < W - 30 && z.x > 30 && dist > STOP + 90 && Math.random() < dt * 0.06) {
              setZ(z, "idle", "z_idle"); z.idleFor = 1.2 + Math.random() * 1.4;
            }
          } else {
            // chegou na posição: ataca ou espera na fila em idle (não congela)
            if (!tryAttack(z, side)) { setZ(z, "queue", "z_idle"); z.a.t = Math.random(); }
          }
          break;
        }
        case "queue":
          if (dist > target + 6) setZ(z, "walk", "z_walk");   // a fila andou: volta a caminhar
          else tryAttack(z, side);
          break;
        case "idle":
          z.idleFor -= dt;
          if (z.idleFor <= 0 || dist <= target + 1) setZ(z, "walk", "z_walk");
          break;
        case "attack":
          if (!z.hitDone && frameOf(z.a) >= 4) {
            z.hitDone = true;
            A.play("zatk", { gain: nearGain(z.x), pan: panOf(z.x) });
            if (dist <= STOP + 14 && !lorenaDown() && L.st !== "grab") {
              if (L.st === "reload" || L.st === "shoot" || L.st === "empty" || L.st === "idle" || L.st === "walk" || L.st === "hurt") setL("hurt", "l_hurt");
              hurtLorena(1);
            }
          }
          if (done(z.a)) { setZ(z, "walk", "z_walk"); z.cool = 0.5 + Math.random() * 0.9; }
          break;
        case "grab": {
          z.x = L.x + z.side * 26;                        // colado nela, desenhado por cima
          const f = frameOf(z.a);
          const hits = [5, 11].filter((n) => f >= n).length;      // agarrão: 2 de dano
          while (z.dmg < hits && !lorenaDown()) {
            z.dmg++;
            A.play("bite", { seg: BITES[(z.dmg - 1 + z.biteOff) % BITES.length], pan: panOf(L.x) * 0.6 });
            hurtLorena(1);
          }
          if (done(z.a)) {
            setZ(z, "walk", "z_walk"); z.cool = 1 + Math.random();
            z.x = L.x + z.side * STOP;
            if (!lorenaDown()) { L.grabbedBy = null; setL("idle", "l_idle"); }
          }
          break;
        }
        case "hurt":
          if (done(z.a)) { setZ(z, "walk", "z_walk"); z.cool = Math.max(z.cool, 0.3); }
          break;
        case "dead":
          if (done(z.a)) z.fadeOut -= dt * 1.6;
          break;
      }
    }
    // remove cadáveres e repõe até a cota de cada lado (nunca excede)
    for (let i = zombies.length - 1; i >= 0; i--) if (zombies[i].fadeOut <= 0) zombies.splice(i, 1);
    const [qL, qR] = WAVES[level()];
    for (let [side, quota] of [[-1, qL], [1, qR]]) {
      if (hornet) quota = side === hzSide ? 1 : 0;          // zangão em campo: só 1 zumbi, alternando os lados
      const have = zombies.filter((z) => z.from === side).length + spawnQ.filter((q) => q.side === side).length;
      for (let n = have; n < quota; n++) {
        const pend = spawnQ.filter((q) => q.side === side).length;
        spawnQ.push({ side, t: 0.6 + Math.random() * 1.4 + pend * (0.8 + Math.random()) });   // chegam espaçados
      }
    }
    for (let i = spawnQ.length - 1; i >= 0; i--) {
      const q = spawnQ[i];
      q.t -= dt;
      if (q.t <= 0) { spawnQ.splice(i, 1); if (zombies.filter(alive).length < zombieCap()) { spawn(q.side); if (hornet) hzSide = -q.side; } }
    }
  }
  function startGrab(z, side) {
    setZ(z, "grab", "z_grab");
    groan(z, true, 0);
    z.side = side; z.dmg = 0; z.biteOff = (Math.random() * BITES.length) | 0;
    L.dir = side;                                          // ela vira para o agressor
    L.grabbedBy = z;
    setL("grab", "l_grab");
  }

  /* ---------- desenho ---------- */
  function sprite(key, f, x, flip, alpha = 1) {
    const s = SHEETS[key]; if (!s.img) return;
    const w = FR * S, h = FR * S;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), FLOOR);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.img, f * FR, 0, FR, FR, -w / 2, -h + 3 * S, w, h);
    ctx.restore();
  }
  function draw() {
    const k = canvas.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (IMGS.bg) ctx.drawImage(IMGS.bg, 0, 0, W, H); else { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H); }
    drawHeli();
    drawBug();                                               // entre o céu e o recorte dos prédios
    if (IMGS.front) ctx.drawImage(IMGS.front, 0, 0, W, H);
    ctx.imageSmoothingEnabled = false;

    // sombras
    ctx.fillStyle = "rgba(0,0,0,.35)";
    const shadow = (x) => { ctx.beginPath(); ctx.ellipse(x, FLOOR + 1, 30, 6, 0, 0, Math.PI * 2); ctx.fill(); };
    zombies.forEach((z) => z.st !== "dead" && shadow(z.x));
    shadow(L.x);
    hornetShadow();

    const zSprite = (z) => sprite(z.a.key, frameOf(z.a), z.x, L.x > z.x, Math.max(0, z.fadeOut));
    const behind = zombies.filter((z) => z.st !== "grab").sort((a, b) => (a.st === "dead") - (b.st === "dead") || b.x - a.x);
    behind.filter((z) => z.st === "dead").forEach(zSprite);
    behind.filter((z) => z.st !== "dead").forEach(zSprite);
    sprite(L.a.key, frameOf(L.a), L.x, L.dir < 0);
    zombies.filter((z) => z.st === "grab").forEach(zSprite);   // agarrão sempre na frente dela
    drawHornet();
    ctx.imageSmoothingEnabled = false;

    hud();

    // morte → tela escurece → "morreu" + recomeçar
    if (over.t >= 0) {
      ctx.fillStyle = `rgba(0,0,0,${over.fade})`;
      ctx.fillRect(0, 0, W, H);
      const dAnim = dur("l_dead");
      if (over.t > dAnim) {
        const s = SHEETS.over, tt = over.t - dAnim;
        const f = Math.min(s.frames - 1, Math.floor(tt * s.fps));
        const size = 420;
        if (s.img) ctx.drawImage(s.img, f * FR, 0, FR, FR, (W - size) / 2, (H - size) / 2 - 40, size, size);
        if (!over.shown && tt > s.frames / s.fps) { over.shown = true; restartBtn.hidden = false; }
      }
    }
  }
  // caveirinha em pixel art (indicador de dificuldade)
  const SKULL = [
    "..#####..",
    ".#######.",
    "#########",
    "##..#..##",
    "##..#..##",
    "####.####",
    ".#######.",
    "..#.#.#..",
    "..#####.."
  ];
  function skull(x, y) {
    const px = 2.6;
    ctx.fillStyle = "rgba(0,0,0,.6)";
    SKULL.forEach((row, r) => [...row].forEach((c, k) => { if (c === "#") ctx.fillRect(x + k * px + 1, y + r * px + 1, px, px); }));
    ctx.fillStyle = "#ece6d6";
    SKULL.forEach((row, r) => [...row].forEach((c, k) => { if (c === "#") ctx.fillRect(x + k * px, y + r * px, px, px); }));
  }
  function hud() {
    ctx.save();
    // contador de abates (canto superior esquerdo)
    ctx.font = "700 22px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,0,0,.55)";
    const label = `${T("kills")} ${kills}`;
    const tw = ctx.measureText(label).width;
    const skulls = level();
    ctx.fillRect(14, 14, tw + 24 + (skulls ? 8 + skulls * 26 : 0), 36);
    ctx.fillStyle = "#e8e8ea";
    ctx.fillText(label, 26, 21);
    for (let i = 0; i < skulls; i++) skull(26 + tw + 10 + i * 26, 19);
    // insetos abatidos: só aparece depois do primeiro (não entrega que eles existem)
    if (hornetKills > 0) {
      const l2 = `${T("bugs")} ${hornetKills}`, tw2 = ctx.measureText(l2).width;
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(14, 54, tw2 + 24, 36);
      ctx.fillStyle = "#e8e8ea"; ctx.fillText(l2, 26, 61);
    }

    // vida (canto superior direito): 9 blocos — verde, amarelo a partir de 6, vermelho a partir de 3 —
    // e o rosto da Lorena à direita da barra (bem / caution / danger)
    const life = L.life;
    const tier = life > 6 ? 0 : life > 3 ? 1 : 2;
    const COL = [["#3fbf4a", "#8af07f", "rgba(63,191,74,.45)"], ["#e3b21f", "#ffe07a", "rgba(227,178,31,.45)"], ["#d42a2a", "#ff6a5a", "rgba(212,42,42,.5)"]][tier];
    const face = [IMGS.faceOk, IMGS.faceCaution, IMGS.faceDanger][tier];
    const fw = 60, fh = face ? Math.round(fw * face.height / face.width) : 47;
    const sq = 16, gap = 5, n = MAX_LIFE;
    const barW = n * sq + (n - 1) * gap;
    const panelH = fh + 8, py = 12;
    const fx = W - 18 - fw, lx = fx - 12 - barW;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(lx - 10, py, barW + 12 + fw + 18, panelH);
    const y = py + (panelH - sq) / 2;
    for (let i = 0; i < n; i++) {
      const x = lx + i * (sq + gap);
      if (i < life) { ctx.fillStyle = COL[0]; ctx.fillRect(x, y, sq, sq); ctx.fillStyle = COL[1]; ctx.fillRect(x, y, sq, 3); }
      else { ctx.strokeStyle = COL[2]; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, sq - 2, sq - 2); }
    }
    if (face) { ctx.imageSmoothingEnabled = false; ctx.drawImage(face, fx, py + 4, fw, fh); }

    // arma + munição (lado direito); sem balas mostra a pistola descarregada (ferrolho aberto)
    const gun = L.ammo > 0 ? IMGS.gun : (IMGS.gunEmpty || IMGS.gun), bul = IMGS.bullet;
    const gunK = 100 / 220;                                  // mesma escala para as duas imagens da pistola
    const bw = 8, bh = 26, bg = 4;
    const ammoW = MAX_AMMO * bw + (MAX_AMMO - 1) * bg;
    const gy = py + panelH + 10;
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(W - 18 - 100 - 14 - ammoW - 8, gy - 6, 100 + 14 + ammoW + 16, 64);
    if (gun) ctx.drawImage(gun, W - 18 - ammoW - 14 - 100, gy + 2, gun.width * gunK, gun.height * gunK);
    for (let i = 0; i < MAX_AMMO; i++) {
      const x = W - 18 - ammoW + i * (bw + bg), y = gy + 13;
      if (i < L.ammo) { if (bul) ctx.drawImage(bul, x, y, bw, bh); }
      else { ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x + 2, y + bh - 4, bw - 4, 3); }
    }
    // munição de reserva (a mesma do menu)
    ctx.font = "700 12px 'JetBrains Mono', ui-monospace, monospace"; ctx.textAlign = "right"; ctx.textBaseline = "top";
    ctx.fillStyle = L.reserve > 0 ? "rgba(236,229,216,.85)" : "#d44";
    ctx.fillText("× " + L.reserve, W - 18, gy + 42);
    ctx.restore();
  }

  /* ---------- Menu (W abre · X confirma · setas navegam · W/Esc voltam) ---------- */
  const MG = G + "menu/";
  const ITEMS = {
    pistola:     { img: "pistola.webp",     pt: ["Pistola 9mm", "Arma que me foi dada quando ingressei na polícia."],
                                            en: ["9mm pistol", "The gun I was given when I joined the police."] },
    municao:     { img: "municao.webp",     pt: ["Munição de 9mm", "Munição comum de pistola 9mm."],
                                            en: ["9mm ammo", "Standard 9mm pistol ammunition."] },
    faca:        { img: "faca.webp",        pt: ["Faca de combate", "Uma faca tática militar leve."],
                                            en: ["Combat knife", "A light military tactical knife."] },
    chave_comum: { img: "chave_comum.webp", pt: ["Chave do cadeado", "Uma pequena chave para abrir o cadeado do portão de acesso ao estacionamento."],
                                            en: ["Padlock key", "A small key that opens the padlock on the parking lot gate."] },
    chave_grifo: { img: "chave_grifo.webp", pt: ["Chave de grifo", "Talvez isso possa servir para abrir algo."],
                                            en: ["Pipe wrench", "Maybe this could be used to open something."] },
    kit_med:     { img: "kit_med.webp",     pt: ["Kit médico pequeno", "Kit médico básico. Recupera 2 blocos de vida. Combine dois para montar um kit médio."],
                                            en: ["Small medkit", "Basic first-aid kit. Restores 2 health blocks. Combine two to make a medium kit."] },
    kit_med_m:   { img: "kit_med_m.webp",   pt: ["Kit médico médio", "Recupera 5 blocos de vida. Combine com um kit pequeno para montar um kit grande."],
                                            en: ["Medium medkit", "Restores 5 health blocks. Combine with a small kit to make a large one."] },
    kit_med_g:   { img: "kit_med_g.webp",   pt: ["Kit médico grande", "Kit completo: recupera toda a vida."],
                                            en: ["Large medkit", "Full kit: restores all your health."] }
  };
  const FILES = [
    { pt: ["Mensagem de Nicolas", "Irmã, preciso que você venha até o laboratório. Acredito que descobri algo e preciso de ajuda. Seja rápida!"],
      en: ["Message from Nicolas", "Sis, I need you to come to the lab. I think I've found something and I need help. Be quick!"] },
    { pt: ["Documento do computador do policial", "...o carro roubado foi deixado no estacionamento com as chaves dentro. Não há risco, pois o portão está trancado com cadeado e a chave está comigo. Mas amanhã mesmo eu inicio essa ocorrência e vou até lá retirá-lo."],
      en: ["Document from the officer's computer", "...the stolen car was left in the parking lot with the keys inside. There's no risk, since the gate is padlocked and I have the key. But tomorrow I'll open this case and go get it."] }
  ];
  const MT = {
    pt: { inUse: "Este item já está em uso.", noNeed: "Você não precisa usar este item agora.", noCombine: "Você não pode combinar esse item.",
          loaded: "Esta arma está carregada.", reloaded: "Pistola recarregada.", healed: "Você se sente um pouco melhor.", combinedMed: "Você combinou os kits médicos.",
          pick: "Combinar com qual item?", noAmmo: "Não há munição para recarregar.", select: "Selecione um item.",
          keys: "Setas: mover · X: confirmar · W: voltar", use: "Usar", combine: "Combinar", check: "Checar",
          fine: "BEM", caution: "CUIDADO", danger: "PERIGO", mapBack: "X ou W para voltar", files: "Arquivos" },
    en: { inUse: "This item is already in use.", noNeed: "You don't need to use this item right now.", noCombine: "You can't combine this item.",
          loaded: "This gun is already loaded.", reloaded: "Pistol reloaded.", healed: "You feel a little better.", combinedMed: "You combined the medkits.",
          pick: "Combine with which item?", noAmmo: "There's no ammo to reload.", select: "Select an item.",
          keys: "Arrows: move · X: confirm · W: back", use: "Use", combine: "Combine", check: "Check",
          fine: "FINE", caution: "CAUTION", danger: "DANGER", mapBack: "X or W to go back", files: "Files" }
  };
  const mt = (k) => MT[lang()][k];
  const itemTx = (id) => ITEMS[id][lang()];
  const START_INV = ["pistola", "municao", "faca", "chave_comum", "chave_grifo", "kit_med", "kit_med", "kit_med"];
  const HEAL = { kit_med: 2, kit_med_m: 5, kit_med_g: 9 };
  const MED_COMBO = { "kit_med+kit_med": "kit_med_m", "kit_med+kit_med_m": "kit_med_g" };
  let inv = START_INV.slice();
  const M = { open: false, view: "items", sub: null, subIdx: 0, combine: null, msgT: 0, el: null };

  function buildMenu() {
    if (M.el) return;
    const el = document.createElement("div");
    el.className = "gmenu";
    el.hidden = true;
    el.innerHTML = `
      <div class="gmenu__frame">
        <img class="gm-bg" src="${MG}hud_menu.webp" alt="">
        <div class="gm-face"><img alt=""></div>
        <div class="gm-cond"><div class="gm-life"></div><span class="gm-state"></span></div>
        <div class="gm-weapon"><img src="${MG}pistola.webp" alt=""><span class="gm-mag"></span></div>
        <div class="gm-main">
          <div class="gm-check" hidden><img alt=""><div><h3></h3><p></p></div></div>
          <div class="gm-file" hidden><h3></h3><p></p></div>
          <div class="gm-mapview" hidden><div class="gm-map"><img src="${MG}mapa.png" alt=""><span class="gm-pulse"></span></div></div>
          <p class="gm-hint"></p>
          <p class="gm-msg" hidden></p>
        </div>
        <div class="gm-col gm-col--items">
          <button type="button" class="gm-btn gm-exit" data-nav data-act="exit" aria-label="Sair"></button>
          <button type="button" class="gm-btn gm-files" data-nav data-act="files" aria-label="Arquivos"></button>
          <button type="button" class="gm-btn gm-mapbtn" data-nav data-act="map" aria-label="Mapa"></button>
          <div class="gm-slots">${Array.from({ length: 8 }, (_, i) => `<button type="button" class="gm-slot" data-nav data-slot="${i}"></button>`).join("")}</div>
        </div>
        <div class="gm-col gm-col--files" hidden>
          <img src="${MG}hud_arquivo.webp" alt="">
          <button type="button" class="gm-btn a-exit" data-nav data-act="exit" aria-label="Sair"></button>
          <button type="button" class="gm-btn a-menu" data-nav data-act="items" aria-label="Menu"></button>
          <button type="button" class="gm-btn a-map" data-nav data-act="map" aria-label="Mapa"></button>
          <div class="gm-filelist">${FILES.map((_, i) => `<button type="button" class="gm-fileitem" data-nav data-file="${i}"></button>`).join("")}</div>
        </div>
        <div class="gm-sub" hidden>
          <img src="${MG}submenu.png" alt="">
          <button type="button" data-o="use"></button><button type="button" data-o="combine"></button><button type="button" data-o="check"></button>
        </div>
      </div>`;
    root.querySelector(".game__screen").appendChild(el);
    M.el = el;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || !M.open) return;
      e.preventDefault();
      focusNode(b);
      activate(b);
    });
    el.addEventListener("pointermove", (e) => {
      if (!M.open) return;
      const b = e.target.closest("[data-nav], .gm-sub button");
      if (!b || b.closest("[hidden]")) return;
      if (b !== M.focus) {
        const prev = M.focus;
        focusNode(b);
        if (prev !== b) {
          A.resume();
          A.playMenu("passando_itens_menu", { seg: MENU_SOUND_SEGMENTS.move, gain: 0.9, gap: 0.08 });
        }
      }
    });
  }

  const q = (s) => M.el.querySelector(s);
  function openMenu() {
    if (!running || M.open || over.t >= 0) return;
    buildMenu();
    M.open = true; M.view = "items"; M.sub = null; M.combine = null;
    Object.keys(input).forEach((k) => (input[k] = false));
    A.resume();
    A.playMenu("abre_e_fecha_menu", { seg: MENU_SOUND_SEGMENTS.open, gain: 1.0, gap: 0.25 });
    A.quietLoops();                                    // jogo pausado: ambiência e passos param, mas os sons do menu tocam
    root.classList.add("menu-open");
    M.el.hidden = false;
    clearMain();
    renderMenu();
    focusNode(q(`[data-slot="${Math.max(0, inv.findIndex(Boolean))}"]`));
    M.el.querySelector(".gmenu__frame").animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: "ease-out" });
  }
  function closeMenu() {
    if (!M.open) return;
    M.open = false; M.sub = null; M.combine = null;
    A.resume();
    A.playMenu("abre_e_fecha_menu", { seg: MENU_SOUND_SEGMENTS.close, gain: 1.0, gap: 0.25 });
    M.el.hidden = true;
    root.classList.remove("menu-open");
    last = performance.now();
  }
  function setView(v) {
    M.view = v; M.sub = null; M.combine = null;
    q(".gm-col--items").hidden = v === "files";
    q(".gm-col--files").hidden = v !== "files";
    clearMain();
    if (v === "map") {
      q(".gm-mapview").hidden = false;
      q(".gm-hint").textContent = mt("mapBack");
      A.playMenu("mapa", { gain: 0.6, gap: 0.2 });
    }
    renderMenu();
    focusNode(v === "files" ? q("[data-file='0']") : v === "map" ? q(".gm-mapbtn:not([hidden])") || q(".a-map") : q("[data-slot='0']"));
  }
  function clearMain() {
    ["gm-check", "gm-file", "gm-mapview", "gm-msg"].forEach((c) => (q("." + c).hidden = true));
    q(".gm-hint").hidden = false;
    q(".gm-hint").textContent = mt("select") + "  " + mt("keys");
  }
  function say(k) {
    const m = q(".gm-msg");
    m.textContent = mt(k); m.hidden = false;
    clearTimeout(M.msgT);
    M.msgT = setTimeout(() => (m.hidden = true), 2600);
  }

  function renderMenu() {
    if (!M.el) return;
    const life = L.life, tier = life > 6 ? 0 : life > 3 ? 1 : 2;
    q(".gm-face img").src = G + ["rosto_bem.png", "rosto_caution.png", "rosto_danger.png"][tier];
    q(".gm-life").innerHTML = Array.from({ length: MAX_LIFE }, (_, i) => `<i class="${i < life ? "on" : ""}"></i>`).join("");
    q(".gm-cond").dataset.tier = tier;
    q(".gm-state").textContent = mt(["fine", "caution", "danger"][tier]);
    q(".gm-mag").textContent = L.ammo;
    M.el.querySelectorAll(".gm-slot").forEach((b, i) => {
      const id = inv[i];
      b.classList.toggle("is-empty", !id);
      b.classList.toggle("is-combine", M.combine === i);
      b.innerHTML = id ? `<img src="${MG}${ITEMS[id].img}" alt=""><span>${id === "municao" ? L.reserve : id === "pistola" ? L.ammo : ""}</span>` : "";
      b.setAttribute("aria-label", id ? itemTx(id)[0] : "—");
    });
    M.el.querySelectorAll(".gm-fileitem").forEach((b, i) => (b.textContent = FILES[i][lang()][0]));
    const sub = q(".gm-sub");
    sub.querySelectorAll("button").forEach((b) => b.setAttribute("aria-label", mt(b.dataset.o)));
    sub.hidden = M.sub == null;
    if (M.sub != null) {
      const slot = q(`[data-slot="${M.sub}"]`), fr = q(".gmenu__frame").getBoundingClientRect(), r = slot.getBoundingClientRect();
      sub.style.top = Math.min(78, Math.max(2, ((r.top - fr.top) / fr.height) * 100 - 4)) + "%";
    }
  }

  // navegação espacial: vai para o elemento mais próximo na direção da seta
  function navNodes() {
    if (M.sub != null) return [...q(".gm-sub").querySelectorAll("button")];
    return [...M.el.querySelectorAll("[data-nav]")].filter((b) => !b.closest("[hidden]"));
  }
  function focusNode(b) {
    if (!b) return;
    M.focus?.classList.remove("is-focus");
    M.focus = b; b.classList.add("is-focus");
  }
  function move(dx, dy) {
    const nodes = navNodes();
    if (!M.focus || !nodes.includes(M.focus)) {
      const first = nodes[0]; if (first) focusNode(first);
      return !!first;
    }
    const c = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const [x0, y0] = c(M.focus);
    let best = null, bd = 1e9;
    for (const n of nodes) {
      if (n === M.focus) continue;
      const [x, y] = c(n), vx = x - x0, vy = y - y0;
      const along = vx * dx + vy * dy; if (along <= 2) continue;
      const d = along + Math.abs(vx * dy - vy * dx) * 2.2;
      if (d < bd) { bd = d; best = n; }
    }
    if (!best) return false;
    const prev = M.focus;
    focusNode(best);
    if (prev !== best) {
      A.resume();
      A.playMenu("passando_itens_menu", { seg: MENU_SOUND_SEGMENTS.move, gain: 0.9, gap: 0.08 });
    }
    return true;
  }

  function activate(b) {
    if (b.dataset.o) return subOption(b.dataset.o);
    if (b.dataset.act === "exit") return closeMenu();
    if (b.dataset.act === "files") {
      A.playMenu("confirmacao_abrir_submenu", { seg: MENU_SOUND_SEGMENTS.confirm, gain: 1.0, gap: 0.12 });
      return setView("files");
    }
    if (b.dataset.act === "items") return setView("items");
    if (b.dataset.act === "map") return setView(M.view === "map" ? "items" : "map");
    if (b.dataset.file != null) {
      A.playMenu("confirmacao_abrir_submenu", { seg: MENU_SOUND_SEGMENTS.confirm, gain: 1.0, gap: 0.12 });
      const f = FILES[+b.dataset.file][lang()];
      clearMain(); q(".gm-hint").hidden = true;
      const box = q(".gm-file"); box.hidden = false; box.querySelector("h3").textContent = f[0]; box.querySelector("p").textContent = f[1];
      return;
    }
    if (b.dataset.slot != null) {
      const i = +b.dataset.slot, id = inv[i];
      if (M.combine != null) return finishCombine(i);
      if (!id) return;
      if (M.view === "map") setView("items");
      A.playMenu("confirmacao_abrir_submenu", { seg: MENU_SOUND_SEGMENTS.confirm, gain: 1.0, gap: 0.12 });
      M.sub = i; M.subIdx = 0; renderMenu();
      focusNode(q(".gm-sub button"));
    }
  }
  function subOption(o) {
    const i = M.sub, id = inv[i];
    M.sub = null; renderMenu(); focusNode(q(`[data-slot="${i}"]`));
    if (!id) return;
    clearMain();
    if (o === "check") {
      const [name, desc] = itemTx(id);
      q(".gm-hint").hidden = true;
      const box = q(".gm-check"); box.hidden = false;
      box.querySelector("img").src = MG + ITEMS[id].img; box.querySelector("h3").textContent = name; box.querySelector("p").textContent = desc;
    } else if (o === "use") {
      if (id === "pistola" || id === "faca") return say("inUse");
      if (HEAL[id]) {
        if (L.life >= MAX_LIFE) return say("noNeed");
        L.life = Math.min(MAX_LIFE, L.life + HEAL[id]);
        inv[i] = null; renderMenu(); return say("healed");
      }
      say("noNeed");
    } else if (o === "combine") {
      if (id !== "pistola" && id !== "municao" && id !== "kit_med" && id !== "kit_med_m") return say("noCombine");
      M.combine = i; renderMenu();
      q(".gm-hint").textContent = mt("pick");
    }
  }
  function finishCombine(j) {
    const i0 = M.combine, a = inv[M.combine], b = inv[j];
    if (i0 === j) { M.combine = null; renderMenu(); clearMain(); return say("noCombine"); }
    M.combine = null; renderMenu(); clearMain();
    const pair = [a, b].sort().join("+");
    if (MED_COMBO[pair] && M.combine !== j) {               // kits médicos: juntam num kit maior
      const keep = Math.min(i0, j);
      inv[keep] = MED_COMBO[pair]; inv[Math.max(i0, j)] = null;
      renderMenu(); return say("combinedMed");
    }
    if (pair !== "municao+pistola") return say("noCombine");
    if (L.ammo >= MAX_AMMO) return say("loaded");
    if (L.reserve <= 0) return say("noAmmo");
    refill(); renderMenu(); A.resume(); A.play("reload");
    say("reloaded");
  }
  // carrega o pente com a munição de reserva (o total do menu vai sendo gasto)
  function refill() {
    const take = Math.min(MAX_AMMO - L.ammo, L.reserve);
    L.ammo += take; L.reserve -= take;
    if (L.reserve <= 0) { const k = inv.indexOf("municao"); if (k >= 0) inv[k] = null; }
  }
  function back() {
    if (M.sub != null) { const i = M.sub; M.sub = null; renderMenu(); return focusNode(q(`[data-slot="${i}"]`)); }
    if (M.combine != null) { M.combine = null; renderMenu(); return clearMain(); }
    if (M.view !== "items") return setView("items");
    if (!q(".gm-check").hidden || !q(".gm-file").hidden) return clearMain();
    closeMenu();
  }
  function menuKey(e) {
    const down = e.type === "keydown";
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    e.preventDefault(); e.stopPropagation();
    if (!down) return;
    if (k === "ArrowUp") move(0, -1);
    else if (k === "ArrowDown") move(0, 1);
    else if (k === "ArrowLeft") move(-1, 0);
    else if (k === "ArrowRight") move(1, 0);
    else if ((k === "x" || k === "Enter" || k === " ") && !e.repeat) { if (M.focus) activate(M.focus); }
    else if ((k === "w" || k === "Escape" || k === "Backspace") && !e.repeat) back();
    else if (k === "m" && !e.repeat) A.toggleMute();
  }

  /* ---------- laço ---------- */
  function soundTick(dt) {
    if (!A.ctx) return;
    A.loop("amb", 1);
    // bater de asas do zangão: o tempo todo enquanto ele está vivo em cena (inclusive atacando)
    if (hornet || A.loops.wings) {
      const live = hornetAlive();
      A.loop("wings", live ? 0.55 + 0.45 * Math.max(0, 1 - Math.abs(hornet.x - L.x) / 700) : 0, live ? panOf(hornet.x) : 0);
    }
    // som do helicóptero: cresce ao se aproximar do centro e some ao sair
    if (heli || A.loops.heli) {
      const g = heli ? Math.max(0, 1 - Math.abs(heli.x - W / 2) / (W / 2 + 140)) : 0;
      A.loop("heli", heli ? 0.15 + 0.85 * g : 0, heli ? panOf(heli.x) : 0);
    }
    const walkingNow = L.st === "walk" || ((L.st === "shootWalk" || L.st === "reloadWalk") && heldDir() === L.dir);
    A.loop("stepsL", walkingNow ? 1 : 0, panOf(L.x) * 0.6);
    let zg = 0, zx = 0, n = 0;
    for (const z of zombies) {
      if (z.st !== "walk" || offScreen(z.x)) continue;
      const moving = Math.abs(z.x - L.x) > STOP + 2;
      if (!moving) continue;
      const g = nearGain(z.x); zg = Math.max(zg, g); zx += z.x; n++;
    }
    A.loop("stepsZ", n ? Math.min(1, zg * (0.7 + 0.15 * n)) : 0, n ? panOf(zx / n) : 0);
    for (const z of zombies) {
      if (!alive(z) || offScreen(z.x)) continue;
      z.groanIn = (z.groanIn ?? 1 + Math.random() * 4) - dt;
      if (z.groanIn <= 0) { z.groanIn = 3.5 + Math.random() * 5; if (z.st === "walk" || z.st === "idle" || z.st === "queue") groan(z, false, 1.2); }
    }
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (PORTRAIT()) { A.suspend(); raf = requestAnimationFrame(tick); return; }   // pausado até girar a tela
    if (M.open) { draw(); raf = requestAnimationFrame(tick); return; }   // menu aberto: jogo pausado
    A.resume();
    updateLorena(dt);
    updateZombies(dt);
    updateBug(dt);
    updateHeli(dt);
    updateHornet(dt);
    soundTick(dt);
    if (over.t >= 0) { over.t += dt; over.fade = Math.min(0.78, over.t / 2.2); }
    draw();
    raf = requestAnimationFrame(tick);
  }

  /* ---------- abrir / fechar ---------- */
  let opener = null;
  async function open(from) {
    build();
    opener = from || null;
    root.classList.toggle("is-touch", TOUCH());
    if (TOUCH()) enterFull();             // precisa ser no mesmo toque do botão
    const snd = A.init(); A.resume();      // áudio também precisa nascer no clique
    root.hidden = false;
    document.documentElement.classList.add("game-open");
    // o painel "cresce" a partir do botão clicado
    const r = from?.getBoundingClientRect?.();
    const pr = panel.getBoundingClientRect();
    if (r && pr.width && !TOUCH()) {
      const dx = r.left + r.width / 2 - (pr.left + pr.width / 2);
      const dy = r.top + r.height / 2 - (pr.top + pr.height / 2);
      panel.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${Math.max(0.08, r.width / pr.width)})`, opacity: 0.2 },
        { transform: "none", opacity: 1 }
      ], { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    addEventListener("keydown", onKey, true);
    addEventListener("keyup", onKey, true);
    fit();
    loadingEl.hidden = false;
    await Promise.all([load(), snd]);
    if (root.hidden) return;
    A.resume(); syncVolUI();
    loadingEl.hidden = true;
    reset();
    running = true; last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    panel.focus?.();
  }
  function close() {
    if (!root || root.hidden) return;
    running = false; cancelAnimationFrame(raf);
    removeEventListener("keydown", onKey, true);
    removeEventListener("keyup", onKey, true);
    Object.keys(input).forEach((k) => (input[k] = false));
    if (M.open) { M.open = false; M.el.hidden = true; root.classList.remove("menu-open"); }
    A.stopLoops(); A.suspend();
    exitFull();
    const done = () => { root.hidden = true; document.documentElement.classList.remove("game-open"); opener?.focus?.({ preventScroll: true }); };
    const a = panel.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.92)", opacity: 0 }], { duration: 200, easing: "ease-in" });
    a.onfinish = done;
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { last = performance.now(); if (running) A.resume(); } else A.suspend();
  });

  /* ---------- placa de aviso antes do jogo ---------- */
  let warn = null, warnFrom = null;
  function buildWarn() {
    if (warn) return;
    warn = document.createElement("div");
    warn.className = "gwarn";
    warn.hidden = true;
    warn.innerHTML = `
      <div class="gwarn__backdrop"></div>
      <div class="gwarn__box" role="dialog" aria-modal="true" aria-label="Infestação — minigame">
        <img class="gwarn__img" src="assets/game/placa_aviso_v2.webp" width="1600" height="854" alt="">
        <div class="gwarn__text">
          <p class="gwarn__top" data-w="p1"></p>
          <div class="gwarn__bottom">
            <p data-w="p2"></p>
            <p class="gwarn__gold" data-w="p3"></p>
            <p data-w="p4"></p>
          </div>
        </div>
        <button type="button" class="gwarn__ok"><img src="assets/game/aceitar.png" alt="Aceitar" width="560" height="224"></button>
        <button type="button" class="gwarn__x" aria-label="Fechar">×</button>
      </div>`;
    document.body.appendChild(warn);
    warn.querySelector(".gwarn__ok").addEventListener("click", acceptWarn);
    warn.querySelector(".gwarn__x").addEventListener("click", closeWarn);
    warn.querySelector(".gwarn__backdrop").addEventListener("click", closeWarn);
    warn.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); closeWarn(); }
    });
  }
  const WARN_TXT = {
    pt: {
      p1: "Este é um pequeno minigame desenvolvido para apresentar um dos inimigos do jogo, além de demonstrar algumas de suas mecânicas e animações.",
      p2: "A versão final contará com muito mais elementos: diferentes inimigos, ações, mecânicas e interações com o cenário. Este minigame é apenas uma pequena amostra do que está por vir.",
      p3: "Por enquanto, seu único objetivo é sobreviver.<br>Você consegue chegar a 25 zumbis abatidos?",
      p4: "Então aceite o desafio e veja até onde consegue chegar!",
      ok: "Aceitar"
    },
    en: {
      p1: "This is a small minigame made to introduce one of the game's enemies and to show off some of its mechanics and animations.",
      p2: "The final version will have much more: different enemies, actions, mechanics and interactions with the environment. This minigame is just a small taste of what's coming.",
      p3: "For now, your only goal is to survive.<br>Can you reach 25 zombies killed?",
      p4: "Then accept the challenge and see how far you can go!",
      ok: "Accept"
    }
  };
  function showWarn(from) {
    buildWarn();
    const w = WARN_TXT[lang()];
    warn.querySelectorAll("[data-w]").forEach((el) => (el.innerHTML = w[el.dataset.w]));
    warn.querySelector(".gwarn__ok img").alt = w.ok;
    warnFrom = from || null;
    warn.hidden = false;
    document.documentElement.classList.add("game-open");
    warn.querySelector(".gwarn__box").animate(
      [{ transform: "scale(.85)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
    if (!TOUCH()) warn.querySelector(".gwarn__ok").focus({ preventScroll: true });
    load();                                                  // já vai carregando o jogo enquanto a pessoa lê
  }
  function hideWarn() {
    if (!warn) return;
    warn.hidden = true;
  }
  function closeWarn() {
    hideWarn();
    document.documentElement.classList.remove("game-open");
    warnFrom?.focus?.({ preventScroll: true });
  }
  function acceptWarn() {
    hideWarn();
    open(warnFrom);                                          // no mesmo clique: libera tela cheia e áudio
  }

  // qualquer elemento com data-play mostra a placa; "Aceitar" abre o jogo
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-play]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    showWarn(b);
  }, true);

  window.__jogo = { open, close, get state() { return { L, zombies, kills, over }; },
    warn: showWarn, accept: acceptWarn,
    setKills(n) { kills = n; },
    zangao(side = 1) { spawnHornet(side); },
    get hornet() { return hornet && { st: hornet.st, x: Math.round(hornet.x), y: Math.round(hornet.y), hp: hornet.hp, face: hornet.face }; },
    hornetAttack(kind) { if (hornet) kind === "sting" ? startSting() : startBite(); },
    bug() { spawnBug(); },
    heli() { spawnHeli(); },
    get audio() { return { loaded: Object.keys(A.buf), ctx: A.ctx?.state, vol: A.vol, muted: A.muted, plays: A.count, loops: Object.fromEntries(Object.entries(A.loops).map(([k, l]) => [k, +l.cur.toFixed(2)])) }; } };
})();
