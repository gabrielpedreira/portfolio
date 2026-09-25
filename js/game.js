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
  const MAX_AMMO = 9, MAX_LIFE = 9, ZOMBIES = 3, ZOMBIE_HP = 3;

  // quadros detectados pela largura da imagem; fps de cada animação
  const SHEETS = {
    l_idle:   { src: "lorena_idle.png",         fps: 8,  loop: true },
    l_walk:   { src: "lorena_andando.png",      fps: 10, loop: true },
    l_shoot:  { src: "lorena_tiro.png",         fps: 15 },
    l_empty:  { src: "lorena_descarregada.png", fps: 15 },
    l_reload: { src: "lorena_recarga.png",      fps: 15 },
    l_hurt:   { src: "lorena_dano.png",         fps: 15 },
    l_grab:   { src: "lorena_agarrada.png",     fps: 8,  loop: true },
    l_dead:   { src: "lorena_morte.png",        fps: 8 },
    z_walk:   { src: "zumbi_andando.png",       fps: 8,  loop: true },
    z_idle:   { src: "zumbi_idle.png",          fps: 8,  loop: true },
    z_attack: { src: "zumbi_ataque.png",        fps: 10 },
    z_grab:   { src: "zumbi_agarrao.png",       fps: 10 },
    z_hurt:   { src: "zumbi_dano.png",          fps: 12 },
    z_dead:   { src: "zumbi_morte.png",         fps: 12 },
    over:     { src: "game_over.png",           fps: 12 }
  };
  const IMGS = { bg: "cenario.webp", gun: "pistola_hud.png", bullet: "municao_hud.png" };

  const TXT = {
    pt: { kills: "ZUMBIS", restart: "Recomeçar", loading: "Carregando…", close: "Fechar jogo",
          walkR: "anda pra direita", walkL: "anda pra esquerda", shoot: "atira", reload: "recarrega", quit: "fecha o jogo",
          rotate: "Gire o celular para jogar", quitBtn: "Fechar", volume: "volume", mute: "Silenciar", unmute: "Ativar som" },
    en: { kills: "ZOMBIES", restart: "Restart", loading: "Loading…", close: "Close game",
          walkR: "walk right", walkL: "walk left", shoot: "shoot", reload: "reload", quit: "close the game",
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
    amb: "ambiencia.mp3", groan: "grunhido_zumbi.mp3", zdie: "zumbi_morte.mp3",
    stepsL: "passos_lorena.mp3", stepsZ: "passos_zumbi.mp3",
    shot: "tiro_pistola.mp3", reload: "recarga_pistola.mp3", hurt: "lorena_dano.mp3"
  };
  // trechos do arquivo de grunhidos (segundos): curtos p/ tiro/ataque, longo p/ agarrão
  const GROANS = [[0, 1.14], [1.69, 2.69], [3.13, 3.88], [7.36, 8.1]];
  const GROAN_LONG = [4.38, 7.04];
  const MIX = { amb: 0.35, groan: 0.55, zdie: 0.7, stepsL: 0.55, stepsZ: 0.5, shot: 0.8, reload: 0.8, hurt: 0.8 };
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
      this.ready = Promise.all(Object.entries(SOUNDS).map(([k, f]) =>
        fetch(SND_DIR + f).then((r) => r.arrayBuffer())
          .then((ab) => new Promise((ok, no) => this.ctx.decodeAudioData(ab, ok, no)))
          .then((b) => { this.buf[k] = b; }).catch(() => {})));
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
    // toca um som (opcional: trecho [ini, fim], volume, pan -1..1, intervalo mínimo entre repetições)
    play(k, { seg, gain = 1, pan = 0, gap = 0 } = {}) {
      const b = this.buf[k]; if (!b || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (gap && now - (this.last[k] || -9) < gap) return;
      this.last[k] = now;
      this.count[k] = (this.count[k] || 0) + 1;
      const src = this.ctx.createBufferSource(); src.buffer = b;
      const g = this.ctx.createGain(); g.gain.value = MIX[k] * gain;
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
        const g = this.ctx.createGain(); g.gain.value = 0;
        let node = src.connect(g);
        let p = null;
        if (this.ctx.createStereoPanner) { p = this.ctx.createStereoPanner(); node = g.connect(p); }
        node.connect(this.master);
        src.start(this.ctx.currentTime, Math.random() * b.duration * 0.6);
        l = this.loops[k] = { src, g, p, cur: -1 };
      }
      const target = MIX[k] * gain;
      if (Math.abs(target - l.cur) > 0.01) { l.g.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06); l.cur = target; }
      if (l.p) l.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.1);
    },
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
    for (const [k, s] of Object.entries(SHEETS)) jobs.push(one(s.src).then((i) => { s.img = i; s.frames = i ? Math.max(1, Math.round(i.width / FR)) : 1; }));
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
            <button type="button" data-k="reload" class="is-reload"><b>S</b><small data-t="reload"></small></button>
            <button type="button" data-k="shoot" class="is-shoot"><b>D</b><small data-t="shoot"></small></button>
          </div>
          <button type="button" data-k="quit" class="game__pad-quit">✕</button>
          <button type="button" data-k="mute" class="game__pad-vol" data-vol-ico>${SPEAKER}</button>
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
          <button type="button" data-k="reload"><kbd>S</kbd><span data-t="reload"></span></button>
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
  const input = { left: false, right: false, shoot: false, shootQ: false, reload: false };
  function press(k, down) {
    if (k === "shoot") { if (down && !input.shoot) input.shootQ = true; input.shoot = down; }
    else if (k === "reload") { if (down) input.reload = true; }
    else input[k] = down;
  }
  function onKey(e) {
    if (root.hidden) return;
    const down = e.type === "keydown";
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let act = null;
    if (k === "ArrowLeft") act = "left";
    else if (k === "ArrowRight") act = "right";
    else if (k === "d") act = "shoot";
    else if (k === "s") act = "reload";
    else if (k === "m") { e.preventDefault(); e.stopPropagation(); if (down && !e.repeat) A.toggleMute(); return; }
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
    L = { x: 110, dir: 1, st: "idle", a: anim("l_idle"), ammo: MAX_AMMO, life: MAX_LIFE, fired: false, grabbedBy: null };
    zombies = [];
    kills = 0;
    spawnQ = [];
    over = { fade: 0, t: -1, shown: false };
    for (let i = 0; i < ZOMBIES; i++) spawn(W + 70 + i * 150);
    restartBtn.hidden = true;
    Object.keys(input).forEach((k) => (input[k] = false));
  }
  function spawn(x) {
    zombies.push({
      id: ++uid, x: x ?? W + 60 + Math.random() * 80, hp: ZOMBIE_HP,
      st: "walk", a: anim("z_walk"), speed: 36 + Math.random() * 16,
      cool: 0.3 + Math.random() * 0.6, idleFor: 0, hitDone: false, fadeOut: 1, dmg: 0
    });
    zombies[zombies.length - 1].a.t = Math.random();
  }
  const setL = (st, key) => { L.st = st; L.a = anim(key); L.fired = false; };
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
    if (L.grabbedBy) { const z = L.grabbedBy; L.grabbedBy = null; setZ(z, "walk", "z_walk"); z.cool = 99; }
    over.t = 0;
  }

  /* ---------- Lorena ---------- */
  function updateLorena(dt) {
    L.a.t += dt;
    switch (L.st) {
      case "idle": case "walk": {
        if (input.reload) {
          input.reload = false;
          if (L.ammo < MAX_AMMO) { setL("reload", "l_reload"); break; }
        }
        if (input.shootQ || input.shoot) {
          input.shootQ = false;
          if (L.ammo > 0) setL("shoot", "l_shoot"); else setL("empty", "l_empty");
          break;
        }
        const mv = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (mv) {
          L.dir = mv;
          let nx = Math.max(40, Math.min(W - 40, L.x + mv * 120 * dt));
          // não atravessa zumbis vivos
          for (const z of zombies) {
            if (!alive(z)) continue;
            const d = (z.x - L.x) * mv;
            if (d > 0 && d < STOP + 40) nx = mv > 0 ? Math.min(nx, z.x - (STOP - 6)) : Math.max(nx, z.x + (STOP - 6));
          }
          if ((nx - L.x) * mv > 0) L.x = nx;
          if (L.st !== "walk") setL("walk", "l_walk");
        } else if (L.st !== "idle") setL("idle", "l_idle");
        break;
      }
      case "shoot":
        if (!L.fired && frameOf(L.a) >= 3) { L.fired = true; L.ammo--; A.play("shot", { pan: panOf(L.x) * 0.6 }); fire(); }
        if (done(L.a)) setL("idle", "l_idle");      // ciclo completo, nunca interrompido por outro tiro
        break;
      case "empty":
        if (done(L.a)) setL("idle", "l_idle");
        break;
      case "reload":
        if (!L.fired && frameOf(L.a) >= 7) { L.fired = true; A.play("reload", { pan: panOf(L.x) * 0.6 }); }   // som no encaixe do pente
        if (done(L.a)) { L.ammo = MAX_AMMO; setL("idle", "l_idle"); }
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
  function fire() {
    let best = null, bd = 1e9;
    for (const z of zombies) {
      if (!alive(z) || z.st === "grab") continue;
      if (z.x < -20 || z.x > W + 20) continue;
      const d = (z.x - L.x) * L.dir;
      if (d > -10 && d < bd) { bd = d; best = z; }
    }
    if (!best) return;
    best.hp--;
    if (best.hp <= 0) { setZ(best, "dead", "z_dead"); kills++; A.play("zdie", { gain: nearGain(best.x), pan: panOf(best.x) }); }
    else { setZ(best, "hurt", "z_hurt"); groan(best, false, 0.25); best.cool = Math.max(best.cool, 0.25); }
  }

  /* ---------- Zumbis ---------- */
  const STOP = 58, GAP = 46;
  function updateZombies(dt) {
    const idleCount = zombies.filter((z) => z.st === "idle").length;
    const grabbing = zombies.some((z) => z.st === "grab");
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
            if (idleCount === 0 && z.x < W - 30 && dist > STOP + 90 && Math.random() < dt * 0.06) {
              setZ(z, "idle", "z_idle"); z.idleFor = 1.2 + Math.random() * 1.4;
            }
          } else {
            z.a.t -= dt;                                   // parado na fila: segura o quadro
            if (rank.get(z) === 0 && z.cool <= 0 && !lorenaDown() && L.st !== "grab") {
              const canGrab = !grabbing && L.st !== "hurt";
              if (canGrab && Math.random() < 0.28) startGrab(z, side);
              else { setZ(z, "attack", "z_attack"); groan(z, false, 0.3); }
            }
          }
          break;
        }
        case "idle":
          z.idleFor -= dt;
          if (z.idleFor <= 0 || dist <= target + 1) setZ(z, "walk", "z_walk");
          break;
        case "attack":
          if (!z.hitDone && frameOf(z.a) >= 4) {
            z.hitDone = true;
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
          const hits = [4, 8, 12].filter((n) => f >= n).length;
          while (z.dmg < hits && !lorenaDown()) { z.dmg++; hurtLorena(1); }
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
    // remove cadáveres e repõe — sempre 3 no total
    for (let i = zombies.length - 1; i >= 0; i--) {
      if (zombies[i].fadeOut <= 0) { zombies.splice(i, 1); spawnQ.push(0.6 + Math.random() * 1.4); }
    }
    for (let i = spawnQ.length - 1; i >= 0; i--) {
      spawnQ[i] -= dt;
      if (spawnQ[i] <= 0 && zombies.length < ZOMBIES) { spawnQ.splice(i, 1); spawn(); }
    }
  }
  function startGrab(z, side) {
    setZ(z, "grab", "z_grab");
    groan(z, true, 0);
    z.side = side; z.dmg = 0;
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
    ctx.imageSmoothingEnabled = false;

    // sombras
    ctx.fillStyle = "rgba(0,0,0,.35)";
    const shadow = (x) => { ctx.beginPath(); ctx.ellipse(x, FLOOR + 1, 30, 6, 0, 0, Math.PI * 2); ctx.fill(); };
    zombies.forEach((z) => z.st !== "dead" && shadow(z.x));
    shadow(L.x);

    const zSprite = (z) => sprite(z.a.key, frameOf(z.a), z.x, L.x > z.x, Math.max(0, z.fadeOut));
    const behind = zombies.filter((z) => z.st !== "grab").sort((a, b) => (a.st === "dead") - (b.st === "dead") || b.x - a.x);
    behind.filter((z) => z.st === "dead").forEach(zSprite);
    behind.filter((z) => z.st !== "dead").forEach(zSprite);
    sprite(L.a.key, frameOf(L.a), L.x, L.dir < 0);
    zombies.filter((z) => z.st === "grab").forEach(zSprite);   // agarrão sempre na frente dela

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
  function hud() {
    ctx.save();
    // contador de abates (canto superior esquerdo)
    ctx.font = "700 22px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,0,0,.55)";
    const label = `${T("kills")} ${kills}`;
    const tw = ctx.measureText(label).width;
    ctx.fillRect(14, 14, tw + 24, 36);
    ctx.fillStyle = "#e8e8ea";
    ctx.fillText(label, 26, 21);

    // vida: 9 quadradinhos vermelhos (canto superior direito)
    const sq = 16, gap = 5, n = MAX_LIFE;
    const lx = W - 18 - n * sq - (n - 1) * gap;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(lx - 8, 14, n * sq + (n - 1) * gap + 16, sq + 16);
    for (let i = 0; i < n; i++) {
      const x = lx + i * (sq + gap), y = 22;
      if (i < L.life) { ctx.fillStyle = "#d42a2a"; ctx.fillRect(x, y, sq, sq); ctx.fillStyle = "#ff6a5a"; ctx.fillRect(x, y, sq, 3); }
      else { ctx.strokeStyle = "rgba(212,42,42,.5)"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, sq - 2, sq - 2); }
    }

    // arma + munição (lado direito)
    const gun = IMGS.gun, bul = IMGS.bullet;
    const bw = 8, bh = 26, bg = 4;
    const ammoW = MAX_AMMO * bw + (MAX_AMMO - 1) * bg;
    const gy = 60;
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(W - 18 - 100 - 14 - ammoW - 8, gy - 6, 100 + 14 + ammoW + 16, 64);
    if (gun) ctx.drawImage(gun, W - 18 - ammoW - 14 - 100, gy + 2, 100, 100 * gun.height / gun.width);
    for (let i = 0; i < MAX_AMMO; i++) {
      const x = W - 18 - ammoW + i * (bw + bg), y = gy + 13;
      if (i < L.ammo) { if (bul) ctx.drawImage(bul, x, y, bw, bh); }
      else { ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x + 2, y + bh - 4, bw - 4, 3); }
    }
    ctx.restore();
  }

  /* ---------- laço ---------- */
  function soundTick(dt) {
    if (!A.ctx) return;
    A.loop("amb", 1);
    A.loop("stepsL", L.st === "walk" ? 1 : 0, panOf(L.x) * 0.6);
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
      if (z.groanIn <= 0) { z.groanIn = 3.5 + Math.random() * 5; if (z.st === "walk" || z.st === "idle") groan(z, false, 1.2); }
    }
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (PORTRAIT()) { A.suspend(); raf = requestAnimationFrame(tick); return; }   // pausado até girar a tela
    A.resume();
    updateLorena(dt);
    updateZombies(dt);
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
    A.stopLoops(); A.suspend();
    exitFull();
    const done = () => { root.hidden = true; document.documentElement.classList.remove("game-open"); opener?.focus?.({ preventScroll: true }); };
    const a = panel.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.92)", opacity: 0 }], { duration: 200, easing: "ease-in" });
    a.onfinish = done;
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { last = performance.now(); if (running) A.resume(); } else A.suspend();
  });

  // qualquer elemento com data-play abre o jogo
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-play]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open(b);
  }, true);

  window.__jogo = { open, close, get state() { return { L, zombies, kills, over }; },
    get audio() { return { loaded: Object.keys(A.buf), ctx: A.ctx?.state, vol: A.vol, muted: A.muted, plays: A.count, loops: Object.fromEntries(Object.entries(A.loops).map(([k, l]) => [k, +l.cur.toFixed(2)])) }; } };
})();
