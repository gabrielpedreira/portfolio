/* ==========================================================
   PERSONAGEM INTERATIVA — aranha-saltadora (margem esquerda)

   NA TEIA
     - 5 s após abrir a página ela desce do topo (webdown, loop).
     - Parou → webstop (1x, com mola) → webidle (loop).
     - Rolou a página → volta a se mover para acompanhar.
     - Parada ao lado de um trabalho clicável → apontando_inicio (1x) → apontando_direita (loop).
   CORTE DA TEIA
     - Mouse sobre a teia = tesoura aberta; clique = tesoura fecha e a teia é cortada ali.
     - Ela cai (fall) até o meio vertical do chão; a câmera acompanha a queda.
   NO CHÃO
     - brava_posqueda (loop) até receber cafuné: mouse sobre ela = mão aberta, clique = mão fecha.
     - Calma: empe_frente_idle (loop, 5 s) → viradalateral (1x) → andando_perfil a 50 fps,
       correndo para a direita até sair da tela.
   NA PAREDE (fica assim até recarregar a página)
     - 7 s depois ela volta andando pela tela (andando_cima), em zigue-zague aleatório,
       até a área que o visitante está vendo; para num canto (alterna esquerda/direita) → idle_parede.
     - Só sai do lugar quando some da tela (rolou e escondeu ela) → vem andando de novo.
     - Mouse sobre ela → anda para um lado aleatório (sem sair da tela) → idle_parede.
   WHATSAPP (após 2 min pendurada sem interação, ou 3 min andando na parede)
     - disparandoteia (6 fps): o fio desce devagar do meio das patas até o símbolo no chão;
       puxa (puxando_teia) enquanto o símbolo sobe → segurandowpp_inicio → segurandowpp_idle (loop).
     - Cortar a teia de baixo: soltandoteia (loop) enquanto o símbolo cai girando para a esquerda;
       soltandoteia (1x) → penduradabrava parada 4 s → sobe até sumir; depois desce com o símbolo (wpp, loop).
     - Na parede: depois de 3 min ela sai da tela, desce pela teia e repete o disparo.
     - O símbolo é clicável (abre o WhatsApp) no chão, sendo puxado, segurado e no sprite wpp.
     - Teste rápido: ?wpp=10 faz isso acontecer depois de 10 s.
   TAMANHO: cada spritesheet foi desenhada numa escala; CONFIG.size iguala todas ao
   tamanho dela na teia (1 = mesmo tamanho da teia).

   Teste rápido: ?aranha=0 na URL (aparece sem esperar os 5 s). Depuração: window.__aranha()
   Quadros: 800 x 520 px. Fiandeira em (391, 108). Linha dos pés no chão: y = 459.
   ========================================================== */
(() => {
  const CONFIG = {
    startDelay: 5000,     // ms até ela aparecer
    viewY: 0.28,          // altura de parada na tela (fração da janela, posição da fiandeira)
    entrySpeed: 110,      // px/s — primeira descida (lenta)
    followSpeed: 1150,    // px/s — acompanhando a rolagem (rápida depois que começa)
    followDelay: 380,     // ms de espera depois que a tela rola, antes de começar a se mover
    moveThreshold: 6,     // px de diferença para voltar a se mover (rolagem lenta já ativa a descida)
    bodyMax: 110,         // largura máxima do corpo na tela (px)
    bodyMin: 46,
    gravity: 2600,        // px/s² na queda
    maxFall: 2400,        // px/s velocidade máxima de queda
    angryMax: 10000,      // ms brava no chão; sem cafuné, depois disso ela se acalma e vai embora sozinha
    calmTime: 5000,       // ms em pé, calma, antes de ir embora
    runSpeed: 950,        // px/s correndo no chão (andando_perfil)
    returnAfter: 7000,    // ms depois de sumir para voltar pela parede
    wallSpeed: 310,       // px/s andando na parede
    // escala de cada animação em relação à teia (ajuste fino visual)
    size: { brava: 0.68, empe: 0.68, virada: 0.68, andando: 0.5, cima: 1.0, parede: 1.05, wppteia: 0.82, espreita: 1, ataque: 1, levando: 1, levando_b: 1, limpando: 1, pano: 1 },
    wppAfter: 120000,     // ms pendurada sem interação até buscar o WhatsApp (2 min)
    wallWppAfter: 180000, // ms andando na parede até sair e buscar o WhatsApp (3 min)
    shootSpeed: 520,      // px/s do fio descendo no disparo (devagar)
    shootMin: 1800,       // ms mínimo do disparo
    shootMax: 9000,       // ms máximo do disparo (chão muito longe)
    stayAfterCut: 4000,   // ms parada depois de cortarem o símbolo, antes de subir
    pullMinSpeed: 700,    // px/s mínimo puxando o símbolo
    pullMaxTime: 3500,    // ms máximo puxando (distâncias grandes puxam mais rápido)
    dropGravity: 1900,    // px/s² na queda do símbolo
    symSpin: 1.3,         // rad/s — giro lento (anti-horário) do símbolo caindo
    riseSpeed: 260,       // px/s subindo brava
    wppReturn: 7000,      // ms até voltar descendo com o símbolo
    threadColor: "rgba(236, 232, 222, .6)"
  };

  const S = "assets/sprites/";
  const SHEETS = {
    webdown:        { src: S + "webdown.png",           frames: 4,  fps: 8,  loop: true },
    webstop:        { src: S + "webstop.png",           frames: 13, fps: 18, loop: false },
    webidle:        { src: S + "webidle.png",           frames: 9,  fps: 10, loop: true },
    apontar_inicio: { src: S + "apontando_inicio.png",  frames: 15, fps: 18, loop: false },
    apontar:        { src: S + "apontando_direita.png", frames: 8,  fps: 10, loop: true },
    fall:           { src: S + "fall.png",              frames: 10, fps: 16, loop: false },
    brava:          { src: S + "brava_posqueda.png",    frames: 4,  fps: 8,  loop: true },
    empe:           { src: S + "empe_frente_idle.png",  frames: 4,  fps: 6,  loop: true },
    virada:         { src: S + "virada_lateral.png",    frames: 3,  fps: 8,  loop: false },
    andando:        { src: S + "andando_perfil.png",    frames: 16, fps: 50, loop: true },
    cima:           { src: S + "andando_cima.png",      frames: 10, fps: 21, loop: true },
    parede:         { src: S + "idle_parede.png",       frames: 16, fps: 10, loop: true },
    disparo:        { src: S + "disparando_teia.png",   frames: 4,  fps: 6,  loop: true },
    puxando:        { src: S + "puxando_teia.png",      frames: 6,  fps: 8,  loop: true },
    seg_inicio:     { src: S + "segurando_inicio.png",  frames: 10, fps: 8,  loop: false },
    seg_idle:       { src: S + "segurando_idle.png",    frames: 6,  fps: 8,  loop: true },
    soltando:       { src: S + "soltando_teia.png",     frames: 7,  fps: 10, loop: false },
    pend_brava:     { src: S + "pendurada_brava.png",   frames: 3,  fps: 6,  loop: true },
    espreita:       { src: S + "espreitando.webp",      frames: 4,  fps: 6,  loop: true },   // caçando a mosca (cabeça para baixo, como o idle_parede)
    ataque:         { src: S + "ataque_mosca.webp",     frames: 16, fps: 8,  loop: false },
    levando:        { src: S + "levando_mosca.webp",    frames: 4,  fps: 6,  loop: true },
    levando_b:      { src: S + "levando_besouro.webp",  frames: 4,  fps: 6,  loop: true },
    limpando:       { src: S + "limpando.webp",         frames: 8,  fps: 6,  loop: true },   // faxina do besouro esmagado (cabeça para baixo)
    pano:           { src: S + "trazendo_pano.webp",    frames: 10, fps: 21, loop: true },   // andando com os panos (cabeça para cima)
    wpp:            { src: S + "wpp.png",               frames: 8,  fps: 8,  loop: true },
    wppteia:        { src: S + "wppteia.png",           frames: 4,  fps: 5,  loop: true },  // símbolo preso na teia (canvas próprio)
    simbolo:        { src: S + "simbolo_wpp.png",       frames: 1,  fps: 1,  loop: true, still: true }  // símbolo solto (estático)
  };
  window.SPIDER_SPRITES = SHEETS;
  // ponto de referência de cada animação no quadro (pés no chão / centro do corpo na parede)
  const REF = {
    brava: { x: 405, y: 459 }, empe: { x: 405, y: 459 }, virada: { x: 405, y: 459 }, andando: { x: 400, y: 500 },
    cima: { x: 413, y: 263 }, parede: { x: 401, y: 205 },
    espreita: { x: 379, y: 250 }, ataque: { x: 379, y: 250 }, levando: { x: 379, y: 184 },
    levando_b: { x: 379, y: 174 }, limpando: { x: 379, y: 250 }, pano: { x: 400, y: 262 }
  };
  const BBOX = { brava: [201,166,609,459], cima: [216,58,611,468], parede: [205,26,598,384] };

  const POINT_TARGETS = "#trabalhos .cat, #trabalhos .card [data-open], #trabalhos .card__links a, #catBack";
  const FW = 800, FH = 520;
  const ANCHOR = { x: 391, y: 108 };   // fiandeira
  const FEET = 459;                    // linha dos pés nas animações de chão
  const FALL_BOTTOM = 450;             // parte mais baixa do corpo na queda
  const BODY_SRC_W = 200;              // largura aproximada do corpo no quadro
  const LOW = { x: 396, y: 448 };      // ponta da teia de baixo (entre as patas) em puxando/segurando
  const APEX = { x: 371, y: 191 };     // ponto onde as teias se juntam no topo do símbolo (wppteia)
  const SYM_BOTTOM = 424;              // base do símbolo no quadro wppteia
  const SYM_HIT = [268, 246, 476, 428];   // área clicável do símbolo no quadro wppteia
  const SYM_C = { x: 373, y: 340 }, SYM_HALF = 88;  // centro/meia-largura do símbolo (coords do wppteia) p/ o simbolo_wpp estático
  const WPP_HIT = [322, 364, 470, 470];   // área clicável do símbolo no sprite wpp (aranha segurando)
  const WA = ((window.LINKS || []).find((l) => l.id === "whatsapp") || {}).url || "https://wa.me/5521971577527";

  /* ---------- Cursores (SVG) ---------- */
  const svg = (body, hx, hy, fb) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>${body}</svg>`)}") ${hx} ${hy}, ${fb}`;
  const two = (d) => `<g fill='none' stroke-linecap='round' stroke-linejoin='round'><g stroke='#111' stroke-width='4.5'>${d}</g><g stroke='#fff' stroke-width='2'>${d}</g></g>`;
  const CURSOR = {
    scissorsOpen:   svg(two("<circle cx='9' cy='25' r='4'/><circle cx='23' cy='25' r='4'/><path d='M11.5 22 L23 3 M20.5 22 L9 3'/>"), 16, 11, "crosshair"),
    scissorsClosed: svg(two("<circle cx='11' cy='25' r='4'/><circle cx='21' cy='25' r='4'/><path d='M13 21.5 L16.5 3 M19 21.5 L15.5 3'/>"), 16, 10, "crosshair"),
    handOpen:       svg(two("<path d='M9 17 V8 M13 15 V5 M17 15 V5 M21 16 V7 M9 17 C9 23 12 28 17 28 C22 28 24 24 24 20 L25 14 C25.5 11.5 28 12 27.5 15 L26 22'/><path d='M21 16 V21 M9 17 L9 20'/>"), 16, 14, "pointer"),
    handClosed:     svg(two("<path d='M9 17 C9 14 10 13 12 13 C13 11 16 11 17 13 C18 11 21 11 22 14 C24 13 25.5 14 25.5 17 L25 22 C24.5 26 21.5 28 17 28 C12 28 9 24 9 17 Z'/><path d='M12 13 V17 M17 13 V17 M22 14 V17'/>"), 16, 16, "pointer")
  };

  const layer = document.getElementById("spider-layer");
  if (!layer) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search);
  const delay = params.has("aranha") ? Number(params.get("aranha")) || 0 : CONFIG.startDelay;
  if (params.has("wpp")) CONFIG.wppAfter = (Number(params.get("wpp")) || 10) * 1000;
  if (params.has("parede")) CONFIG.wallWppAfter = (Number(params.get("parede")) || 10) * 1000;

  /* ---------- Elementos ---------- */
  const mk = (cls) => { const e = document.createElement("div"); e.className = cls; layer.append(e); return e; };
  const thread = mk("spider-thread");
  // só dá para cortar a teia depois de pegar a tesoura (seção Sobre)
  const hasScissors = () => !!window.__tesoura;
  const scissorsCursor = () => (hasScissors() ? CURSOR.scissorsOpen : "default");
  const threadHit = mk("spider-thread-hit");
  const cutTop = mk("spider-thread");       // pedaço de cima (sobe e some)
  const cutLow = mk("spider-thread");       // pedaço preso nela (cai junto)
  [thread, cutTop, cutLow].forEach((t) => (t.style.background = CONFIG.threadColor));
  const canvas = document.createElement("canvas");
  canvas.className = "spider-sprite";
  layer.append(canvas);
  const bodyHit = mk("spider-body-hit");
  // símbolo do WhatsApp + teia de baixo
  const lowThread = mk("spider-thread");
  lowThread.style.background = CONFIG.threadColor;
  const lowHit = mk("spider-thread-hit");
  lowHit.style.cursor = scissorsCursor();
  const symCanvas = document.createElement("canvas");
  symCanvas.className = "spider-sprite spider-sym";
  layer.insertBefore(symCanvas, canvas);
  const symCtx = symCanvas.getContext("2d");
  const waHit = document.createElement("a");
  waHit.className = "spider-wpp-hit";
  waHit.href = WA; waHit.target = "_blank"; waHit.rel = "noopener";
  waHit.setAttribute("aria-label", "WhatsApp");
  layer.append(waHit);
  const ctx = canvas.getContext("2d");
  threadHit.style.cursor = scissorsCursor();
  bodyHit.style.cursor = CURSOR.handOpen;

  const load = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

  /* ---------- Estado ---------- */
  let sheets = {};
  let scale = 0.5, dpr = 1, gutter = 16, viewW = innerWidth;
  let mode = "hidden";   // teia: moving|stopping|idle|pointing   chão: falling|angry|calm|turning|walking|gone
  let pos = 0, vel = 0, peakSpeed = 0;  // fiandeira (y no DOCUMENTO) enquanto na teia
  let followWait = 0;                   // ms esperando antes de seguir a rolagem
  let gx = 0, gy = 0;                   // chão: x do centro do quadro (tela) e y dos pés (documento)
  let fallV = 0, cut = null, timer = 0;
  let wx = 0, wy = 0, rot = 0, path = [], side = Math.random() < .5 ? "left" : "right"; // parede
  let anim = null, frame = 0, frameTime = 0;
  let bounceT = 0, bounceA = 0, clock = 0, firstTrip = true, pet = 0;
  let variant = "normal";              // teia: normal | hold (segurando o símbolo) | wpp (desce com o símbolo)
  let idleAcc = 0, shot = 0, shotDur = 1000, cutAt = 0, wallAcc = 0, exiting = false, pendingShoot = false;
  const sym = { state: "floor", x: 0, y: 0, vx: 0, vy: 0, rot: 0, rotV: 0, frame: 0, ft: 0, speed: 0 };
  let lastScroll = 0;
  addEventListener("scroll", () => (lastScroll = performance.now()), { passive: true });
  const onWeb = () => ["moving", "stopping", "idle", "pointing"].includes(mode);
  const hanging = () => onWeb() || ["shoot", "pull", "holdStart", "drop", "angryUp", "climb"].includes(mode);

  function measure() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = document.documentElement.clientWidth;
    const ref = document.querySelector(".hero, .section");
    gutter = Math.max(16, ref ? ref.getBoundingClientRect().left : 16);
    scale = Math.max(CONFIG.bodyMin, Math.min(CONFIG.bodyMax, gutter * 0.75)) / BODY_SRC_W;
    canvas.width = Math.round(FW * scale * dpr);
    canvas.height = Math.round(FH * scale * dpr);
    canvas.style.width = FW * scale + "px";
    canvas.style.height = FH * scale + "px";
    const ks = scale * CONFIG.size.wppteia;
    symCanvas.width = Math.round(FW * ks * dpr);
    symCanvas.height = Math.round(FH * ks * dpr);
    symCanvas.style.width = FW * ks + "px";
    symCanvas.style.height = FH * ks + "px";
  }

  // centro da margem esquerda, mas nunca perto demais da borda (a aranha não pode ser cortada)
  const webX = () => Math.max(gutter / 2, BODY_SRC_W * scale * 0.55 + 4);
  const target = () => window.scrollY + innerHeight * CONFIG.viewY;
  function floorLine() {  // meio vertical da imagem do chão (documento)
    const f = document.getElementById("floor");
    if (!f) return document.documentElement.scrollHeight - 40;
    const r = f.getBoundingClientRect();
    return r.top + window.scrollY + r.height * 0.5;
  }

  let animHold = false;                 // congela o quadro atual (pausas da caçada)
  function play(name) { if (anim !== name) { anim = name; frame = 0; frameTime = 0; animHold = false; } }

  function setMode(m) {
    mode = m; timer = 0;
    const web = variant === "hold" ? "seg_idle" : variant === "wpp" ? "wpp" : null;
    const map = { moving: web || "webdown", stopping: web || "webstop", idle: web || "webidle", pointing: web || "apontar_inicio",
                  falling: "fall", angry: "brava", calm: "empe", turning: "virada", walking: "andando",
                  wallWalk: "cima", wallIdle: "parede",
                  shoot: "disparo", pull: "puxando", holdStart: "seg_inicio", drop: "soltando", angryUp: "pend_brava", climb: "webdown" };
    if (map[m]) play(map[m]);
    if (m === "moving") { peakSpeed = 0; bounceA = 0; }
    if (m === "stopping") { bounceT = 0; bounceA = reduced ? 0 : Math.max(8, Math.min(18, peakSpeed * 0.08)); }
    layer.classList.toggle("is-grounded", !onWeb() && m !== "falling");
    threadHit.hidden = !onWeb();
    lowHit.hidden = !(onWeb() && variant === "hold");
    bodyHit.hidden = !(m === "angry" || m === "wallIdle");
    bodyHit.style.cursor = m === "angry" ? CURSOR.handOpen : "default";
    thread.hidden = !hanging();
  }

  /* ---------- Símbolo do WhatsApp ---------- */
  const DISP_LOW = { x: 404, y: 414 };  // de onde o fio sai no disparandoteia (entre as patas)
  const lowPt = () => (mode === "shoot" ? DISP_LOW : LOW);
  const lowX = () => webX() + (lowPt().x - ANCHOR.x) * scale;             // x da teia de baixo (tela)
  const lowY = () => pos + (lowPt().y - ANCHOR.y) * scale;                // y da ponta da teia de baixo (documento)
  const holdGap = () => 55 * scale;
  const symKs = () => scale * CONFIG.size.wppteia;
  // símbolo parado no chão: base do simbolo_wpp encostada na linha do chão
  function floorApexY() { return floorLine() - (SYM_HALF + SYM_C.y - APEX.y) * symKs(); }
  const symBottom = () => sym.y + (SYM_C.y - APEX.y + SYM_HALF) * symKs();   // base do símbolo (documento)

  function startShoot() {
    pendingShoot = false;
    setMode("shoot");
    sym.x = lowX(); sym.y = floorApexY(); shot = 0;
    shotDur = Math.max(CONFIG.shootMin, Math.min(CONFIG.shootMax, (sym.y - lowY()) / CONFIG.shootSpeed * 1000));
  }

  function updateSym(dt) {
    sym.ft += dt;
    while (sym.ft >= 1 / SHEETS.wppteia.fps) { sym.ft -= 1 / SHEETS.wppteia.fps; sym.frame = (sym.frame + 1) % SHEETS.wppteia.frames; }
    if (sym.state === "floor") { sym.x = lowX(); sym.y = floorApexY(); return; }
    if (mode === "shoot") { sym.x = lowX(); return; }
    if (sym.state === "pull") {
      const pulse = reduced ? 1 : 0.35 + 0.65 * Math.abs(Math.sin(clock * 5.2));   // puxadas
      sym.y -= sym.speed * pulse * dt;
      sym.x = lowX();
      if (sym.y <= lowY() + holdGap()) { sym.y = lowY() + holdGap(); sym.state = "held"; setMode("holdStart"); }
      return;
    }
    if (sym.state === "held") { sym.x = lowX(); sym.y = lowY() + holdGap() + (onWeb() ? bounceOffset() : 0); return; }
    if (sym.state === "drop") {
      // cai em linha reta girando; no chão quica e sai rolando para a esquerda
      sym.t = (sym.t || 0) + dt;
      sym.vy = Math.min(sym.maxV || 2600, sym.vy + (sym.g || CONFIG.dropGravity) * dt);
      sym.x += sym.vx * dt; sym.y += sym.vy * dt; sym.rot += sym.rotV * dt;
      const fl = floorLine();
      if (sym.vy > 0 && symBottom() >= fl) {
        sym.y -= symBottom() - fl;
        sym.vy = Math.abs(sym.vy) > 120 ? -Math.abs(sym.vy) * 0.38 : 0;          // quica
        sym.vx = Math.min(sym.vx, -430);                                          // e vai para a esquerda
        sym.rotV = -CONFIG.symSpin * 2.2;                                        // rola para a esquerda (anti-horário)
      }
      if (sym.x < -SYM_HALF * 2 * symKs() || sym.t > 10) sym.state = "gone";
    }
  }

  function besideClickable() {
    const bodyY = pos - window.scrollY + (280 - ANCHOR.y) * scale;
    for (const el of document.querySelectorAll(POINT_TARGETS)) {
      if (!el.offsetParent) continue;
      const r = el.getBoundingClientRect();
      if (bodyY >= r.top - 10 && bodyY <= r.bottom + 10) return true;
    }
    return false;
  }

  /* ---------- Interações ---------- */
  threadHit.addEventListener("pointerdown", (e) => {
    if (!hasScissors()) return;
    if (!onWeb()) return;
    // segurando o símbolo (pendurado ou nas patas): ele cai de lado e some junto com a queda
    // cai um pouco mais rápido que a aranha → chega ao chão antes e quica para a esquerda
    const withSpider = { state: "drop", t: 0, vx: 0, vy: 0, rotV: -CONFIG.symSpin, g: CONFIG.gravity * 1.25, maxV: CONFIG.maxFall * 1.2 };
    if (variant === "hold") Object.assign(sym, withSpider);
    else if (variant === "wpp") {
      const ks = scale * CONFIG.size.wppteia;
      Object.assign(sym, withSpider, { rot: 0,
        x: webX() + (396 - ANCHOR.x) * scale,                                  // centro do símbolo nas patas
        y: pos + (416 - ANCHOR.y) * scale - (340 - APEX.y) * ks });
    }
    variant = "normal"; idleAcc = 0;
    threadHit.style.cursor = CURSOR.scissorsClosed;
    setTimeout(() => (threadHit.style.cursor = scissorsCursor()), 350);
    const anchorScreen = pos - window.scrollY + bounceOffset();
    const cutY = Math.max(0, Math.min(anchorScreen - 6, e.clientY));
    cut = { t: 0, top: cutY, low: anchorScreen - cutY };
    fallV = 0; vel = 0; bounceA = 0;
    setMode("falling");
  });
  // cortar a teia que segura o símbolo
  lowHit.addEventListener("pointerdown", () => {
    if (!hasScissors() || !(onWeb() && variant === "hold")) return;
    lowHit.style.cursor = CURSOR.scissorsClosed;
    setTimeout(() => (lowHit.style.cursor = scissorsCursor()), 350);
    variant = "normal";
    Object.assign(sym, { state: "drop", t: 0, vx: 0, vy: 0, rotV: -CONFIG.symSpin, g: CONFIG.dropGravity, maxV: 2600 });   // reto, girando devagar (anti-horário)
    cutAt = performance.now();
    bounceA = 0;
    setMode("drop");
  });
  bodyHit.addEventListener("pointerenter", () => { if (mode === "wallIdle") flee(); });
  document.addEventListener("tesoura", () => { threadHit.style.cursor = scissorsCursor(); lowHit.style.cursor = scissorsCursor(); });
  bodyHit.addEventListener("pointerdown", () => {
    if (mode !== "angry") return;
    bodyHit.style.cursor = CURSOR.handClosed;
    pet = 1;                                   // "amassadinha" do cafuné
    setTimeout(() => { bodyHit.style.cursor = CURSOR.handOpen; setMode("calm"); }, 420);
  });

  /* ---------- Física / estados ---------- */
  function update(dt) {
    clock += dt; timer += dt * 1000; bounceT += dt;
    if (pet > 0) pet = Math.max(0, pet - dt * 2.4);

    updateSym(dt);

    if (mode === "shoot") {
      shot = Math.min(1, shot + dt * 1000 / shotDur);
      if (shot >= 1) {
        sym.state = "pull";
        sym.speed = Math.max(CONFIG.pullMinSpeed, (sym.y - lowY()) / (CONFIG.pullMaxTime / 1000));
        setMode("pull");
      }
      return;
    }
    if (mode === "pull" || mode === "holdStart" || mode === "drop") return;   // presa no fio
    if (mode === "climb") { climbWeb(dt); return; }                          // sobe a teia para caçar a mosca
    if (mode === "hunt") { updateHunt(dt); return; }
    if (mode === "angryUp") {
      const waited = timer >= CONFIG.stayAfterCut;                           // penduradabrava parada 4 s
      const visible = pos - window.scrollY + (460 - ANCHOR.y) * scale > -10;
      if (waited && visible) pos -= CONFIG.riseSpeed * dt;                    // depois sobe até sumir
      if (waited && !visible && timer >= CONFIG.wppReturn) { variant = "wpp"; respawn(); }
      return;
    }

    if (onWeb()) {
      if (variant === "normal" && sym.state === "floor") {
        idleAcc += dt * 1000;
        if ((pendingShoot || idleAcc >= CONFIG.wppAfter) && (mode === "idle" || mode === "pointing")) { startShoot(); return; }
      }
      const t = target();
      let d = t - pos;
      if (Math.abs(d) > innerHeight * 1.1) { pos = t - Math.sign(d) * innerHeight * 0.75; vel = 0; d = t - pos; }
      // rolou: espera um instante (delay) e só então sai correndo pelo fio
      if ((mode === "idle" || mode === "stopping" || mode === "pointing") && Math.abs(d) > CONFIG.moveThreshold) {
        followWait += dt * 1000;
        if (followWait >= CONFIG.followDelay) { followWait = 0; setMode("moving"); }
      } else if (mode !== "moving") followWait = 0;
      if (mode === "idle" && variant === "normal" && besideClickable()) setMode("pointing");
      else if (mode === "pointing" && !besideClickable()) setMode("idle");

      if (mode === "moving") {
        // descida lenta com pausinhas só na chegada normal; segurando/trazendo o símbolo usa a mesma velocidade da teia
        const slow = firstTrip && variant === "normal";
        const max = slow ? CONFIG.entrySpeed : CONFIG.followSpeed;
        const pulse = reduced || !slow ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(clock * 3.2));
        const desired = Math.max(-max, Math.min(max, d * (slow ? 2.2 : 4.8))) * pulse;
        vel += (desired - vel) * Math.min(1, dt * (slow ? 5 : 12));
        pos += vel * dt;
        peakSpeed = Math.max(peakSpeed, Math.abs(vel));
        const scrolling = performance.now() - lastScroll < 220;   // não "para" enquanto a tela ainda rola
        if (!scrolling && Math.abs(d) < 1.5 && Math.abs(vel) < 14) { pos = t; vel = 0; firstTrip = false; setMode("stopping"); }
      }
      // parada: fica presa no fio (posição no documento); se a tela rolar, a diferença cresce
      // e ela volta a subir/descer com webdown — inclusive em rolagem lenta
      return;
    }

    if (mode === "falling") {
      fallV = Math.min(CONFIG.maxFall, fallV + CONFIG.gravity * dt);
      pos += fallV * dt;
      if (cut) cut.t += dt;
      // câmera acompanha a queda
      const want = pos - innerHeight * 0.45;
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      if (want > window.scrollY) window.scrollTo({ top: Math.min(maxScroll, want), behavior: "instant" });
      const fl = floorLine();
      if (pos + (FALL_BOTTOM - ANCHOR.y) * scale >= fl) {   // tocou o chão
        gx = Math.max(webX() + (FW / 2 - ANCHOR.x) * scale, 205 * scale + 12); // mesmo x, sem cortar na borda
        gy = fl;
        bounceT = 0; bounceA = reduced ? 0 : 10;             // pequeno quique ao cair
        cut = null;
        setMode("angry");
      }
      return;
    }

    if (mode === "wallWalk" || mode === "wallIdle") {
      wallAcc += dt * 1000;
      if (!exiting && !steal && !hunt && wallAcc >= CONFIG.wallWppAfter && sym.state === "floor") exitWall();
      maybeSteal(dt);
      updateSteal(dt);
    }
    if (mode === "wallWalk") { walkPath(dt); return; }
    if (mode === "wallIdle") {
      const sy = window.scrollY, m = 40;
      if (!steal && !hunt && (wy < sy - m || wy > sy + innerHeight + m)) enterView();   // sumiu da tela → vem andando
      return;
    }

    gy = floorLine();                                         // o chão pode mudar (redimensionar)
    if (mode === "angry" && timer >= CONFIG.angryMax) setMode("calm");   // sem cafuné: se acalma sozinha
    if (mode === "calm" && timer >= CONFIG.calmTime) setMode("turning");
    if (mode === "walking") {
      gx += CONFIG.runSpeed * dt;
      if (gx - FW * scale * CONFIG.size.andando * 0.5 > viewW) {
        setMode("gone");
        Object.assign(sym, { state: "floor", rot: 0, vx: 0, vy: 0 });   // ela saiu do chão → símbolo volta ao lugar original
      }
    }
    if (mode === "gone" && timer >= CONFIG.returnAfter) enterView(true);
  }

  /* ---------- Parede ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const halfBody = () => 200 * scale * CONFIG.size.cima * 0.5 + 8;
  function clampX(x) { const h = halfBody(); return Math.max(h, Math.min(viewW - h, x)); }

  // caminho em zigue-zague: pontos intermediários com desvios laterais aleatórios
  function makePath(x0, y0, x1, y1) {
    const pts = [], dist = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.min(7, Math.round(dist / 170)));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const amp = Math.min(160, dist * 0.25) * (i % 2 ? 1 : -1) * rnd(0.4, 1);
      pts.push({ x: clampX(x0 + (x1 - x0) * t + amp), y: y0 + (y1 - y0) * t + rnd(-30, 30) });
    }
    pts.push({ x: x1, y: y1 });
    return pts;
  }

  function goTo(x, y) { path = makePath(wx, wy, x, y); setMode("wallWalk"); }

  // entra na área visível e para num canto (alternando os lados)
  function enterView(fromFloor) {
    const sy = window.scrollY, off = 80;
    side = side === "left" ? "right" : "left";
    const tx = side === "left" ? clampX(gutter / 2) : clampX(viewW - gutter / 2);
    const ty = sy + innerHeight * rnd(0.3, 0.7);
    if (fromFloor) { wallAcc = 0; wx = viewW + off; wy = sy + innerHeight * rnd(0.4, 0.8); }         // volta pela direita
    else if (wy < sy) wy = Math.max(wy, sy - off);                                       // vem de cima
    else if (wy > sy + innerHeight) wy = Math.min(wy, sy + innerHeight + off);           // vem de baixo
    goTo(tx, ty);
  }

  // depois de 3 min na parede: anda para fora da tela pelo lado mais perto
  function exitWall() {
    exiting = true;
    const sy = window.scrollY, off = 200 * scale + 60;
    const x = wx < viewW / 2 ? -off : viewW + off;
    path = makePath(wx, wy, x, Math.max(sy + 40, Math.min(sy + innerHeight - 40, wy + rnd(-120, 120))));
    setMode("wallWalk");
  }

  // mouse em cima: foge para um lado aleatório, sem sair da tela
  function flee() {
    if (exiting || steal || hunt) return;
    const sy = window.scrollY, h = halfBody();
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, Math.PI * 2), d = rnd(160, 320);
      const x = wx + Math.cos(a) * d, y = wy + Math.sin(a) * d;
      if (x > h && x < viewW - h && y > sy + h && y < sy + innerHeight - h) { goTo(x, y); return; }
    }
    goTo(clampX(viewW - wx), wy);
  }

  function walkPath(dt) {
    const p = path[0];
    if (!p) {
      if (exiting) {                              // saiu da tela → volta descendo pela teia e dispara
        exiting = false; variant = "normal"; pendingShoot = true; idleAcc = 0;
        respawn();
      } else {
        dash = 1;
        setMode("wallIdle");
        if (steal && steal.arrive) { const f = steal.arrive; steal.arrive = null; f(); }   // chegou num ponto do "roubo"
        else if (hunt && hunt.arrive) { const f = hunt.arrive; hunt.arrive = null; f(); }  // chegou perto da mosca
      }
      return;
    }
    const dx = p.x - wx, dy = p.y - wy, d = Math.hypot(dx, dy);
    const step = CONFIG.wallSpeed * dash * (steal && (steal.phase === "go" || steal.phase === "carry") ? 1.7 : 1) * dt;   // em missão anda mais depressa
    // vira suavemente para a direção do movimento (sprite olha para cima)
    const want = Math.atan2(dx, -dy);
    let diff = ((want - rot + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    rot += diff * Math.min(1, dt * 8);
    if (d <= step) { wx = p.x; wy = p.y; path.shift(); }
    else { wx += (dx / d) * step; wy += (dy / d) * step; }
  }

  function bounceOffset() {
    if (!bounceA || bounceT > 2) return 0;
    return bounceA * Math.exp(-4.5 * bounceT) * Math.sin(bounceT * 12);
  }

  /* ---------- Na parede: "rouba" botões de contato e os pendura na teia ---------- */
  // Enquanto anda na parede, de vez em quando ela desce até os botões de Links & contato,
  // aponta a fiandeira, dispara a teia, arrasta o botão até um ponto aleatório da tela e o
  // deixa pendurado balançando. Os botões continuam clicáveis; se a teia for cortada (com a
  // tesoura) o botão cai, quica para o lado mais perto e, ao sumir da tela, volta ao lugar.
  const STEAL = { first: [12000, 26000], every: [16000, 40000], chance: 0.75, rope: 150, g: 1400, shootSpeed: 950 };
  if (params.has("roubo")) STEAL.first = STEAL.every = [Number(params.get("roubo")) * 1000 || 3000, Number(params.get("roubo")) * 1000 || 3000];
  const TEIA_IMG = "assets/img/teia.webp";
  const stealLayer = document.createElement("div");
  stealLayer.className = "spider-steal";
  stealLayer.setAttribute("aria-hidden", "false");
  document.body.append(stealLayer);
  const shootLine = document.createElement("div");
  shootLine.className = "steal-line"; shootLine.hidden = true;
  stealLayer.append(shootLine);
  let steal = null, stealWait = rnd(...STEAL.first);
  const hung = [];
  const contactLinks = () => [...document.querySelectorAll("#linksGrid .link")];

  function setLine(el, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    el.style.transform = `translate(${x1}px, ${y1}px) rotate(${Math.atan2(-dx, dy)}rad)`;
    el.style.height = len + "px";
  }
  // ponta do abdômen (fiandeira) da aranha na parede, em coordenadas do documento
  // ponta do abdômen: no "cima" (andando) a cabeça aponta para rot e o abdômen fica atrás (embaixo);
  // no "parede" (parada) o desenho é o contrário: abdômen para cima e cabeça para baixo
  function spinneret() {
    const k = CONFIG.size[anim] || 1, r = mode === "wallWalk" || steal ? rot : 0;
    if (anim === "parede") { const d = 133 * scale * k; return { x: wx + Math.sin(r) * d, y: wy - Math.cos(r) * d }; }
    const d = 198 * scale * k;
    return { x: wx - Math.sin(r) * d, y: wy + Math.cos(r) * d };
  }
  // troca de sprite (cima ↔ parede) sem virar o corpo: os dois desenhos são opostos, então soma 180°
  const flipRot = () => { rot += Math.PI; };
  const docY = (el) => el.getBoundingClientRect().top + window.scrollY;
  const inView = (y, m = 80) => y > window.scrollY - m && y < window.scrollY + innerHeight + m;

  function maybeSteal(dt) {
    if (steal || hunt || exiting || mode !== "wallIdle") return;
    const sy = window.scrollY;
    if (wy < sy || wy > sy + innerHeight) return;                     // só quando ela está à vista
    stealWait -= dt * 1000;
    if (stealWait > 0) return;
    stealWait = rnd(...STEAL.every);
    if (Math.random() > STEAL.chance) return;                         // às vezes só continua te seguindo
    const free = contactLinks().filter((l) => !l.dataset.stolen && l.offsetParent);
    if (free.length) startSteal(free[(Math.random() * free.length) | 0]);
  }

  // a fiandeira (ponta do abdômen) fica a esta distância do centro do corpo no sprite parado da parede
  const spinDist = () => 133 * scale * CONFIG.size.parede;
  function startSteal(link) {
    const r = link.getBoundingClientRect();
    const bx = r.left + r.width / 2, by = r.top + window.scrollY;
    steal = { link, phase: "go", t: 0, bx, by };
    // anda até encostar no botão: depois de virar de costas, a fiandeira fica sobre o topo dele
    goTo(clampX(bx), by - spinDist() - 1);
    steal.arrive = () => { flipRot(); aimAtLink(); };
  }
  function aimAtLink() {
    const r = steal.link.getBoundingClientRect();
    steal.bx = r.left + r.width / 2; steal.by = r.top + window.scrollY;     // o layout pode ter mudado
    steal.phase = "aim"; steal.t = 0;
  }

  function updateSteal(dt) {
    if (!steal) return;
    steal.t += dt;
    if (steal.phase === "aim") {                                       // gira 180°: fica de costas para o botão
      const want = Math.atan2(steal.bx - wx, wy - steal.by);           // abdômen (parede) apontando para o botão
      const diff = ((want - rot + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      rot += diff * Math.min(1, dt * 2.6);                             // gira devagar até ficar de costas
      if (steal.t > 1.5) { steal.phase = "stick"; steal.t = 0; steal.item = grab(steal.link, spinneret()); }
    } else if (steal.phase === "stick" && steal.t > 2.0) {            // a rede saiu da fiandeira e grudou → arrasta
      steal.phase = "carry";
    { const it = steal.item, before = spinneret(); flipRot(); play("cima"); const after = spinneret();
      it.L = Math.max(4, it.L - (after.y - before.y)); it.ax = after.x; it.ay = after.y; it.pvx = 0; it.om = 0; }   // sem tranco na troca de sprite
      carryTo();
    } else if (steal.phase === "attach" && steal.t > 0.35) {           // prende a teia na parede e solta
      const it = steal.item;
      if (it && it.state === "carry") {
        const s = spinneret(); it.ax = s.x; it.ay = s.y; it.state = "hang"; it.anchor.hidden = false;
        it.anchor.animate([{ transform: "rotate(180deg) scale(.05)" }, { transform: "rotate(180deg) scale(1)" }], { duration: 500, easing: "ease-out" });
      }
      const wasFly = steal.fly;
      steal = null; flipRot();
      if (wasFly) endHunt();
      walkAway();
    }
    // sem atalhos: ela sempre percorre a página de verdade até o destino
  }
  // leva o item pendurado até um ponto aleatório da página (de preferência mais para cima), longe dos já pendurados
  function carryTo() {
    const h = halfBody(), w = steal.item.w;
    let minX = Math.max(h, w / 2 + 12), maxX = Math.min(viewW - h, viewW - w / 2 - 12);
    if (minX > maxX) minX = maxX = viewW / 2;
    const top = 110, bottom = Math.max(top + 200, floorLine() - 700);
    const pick = () => ({ x: rnd(minX, maxX), y: top + (bottom - top) * Math.pow(Math.random(), 1.7) });
    let dst = pick();
    for (let i = 0; i < 20; i++) {
      const c = pick();
      if (hung.every((o) => o === steal.item || o.state !== "hang" || Math.abs(o.ax - c.x) > (o.w + w) / 2 + 30 || Math.abs(o.ay - c.y) > 320)) { dst = c; break; }
    }
    goTo(dst.x, dst.y);
    steal.arrive = () => { flipRot(); steal.phase = "attach"; steal.t = 0; };
  }
  function walkAway() {
    if (!inView(wy, 0)) return enterView();                            // prendeu fora da tela → volta para onde você está
    const sy = window.scrollY, h = halfBody();
    for (let i = 0; i < 14; i++) {
      const a = rnd(Math.PI * 1.05, Math.PI * 1.95), d = rnd(190, 320);    // para cima e para o lado, longe do botão
      const x = wx + Math.cos(a) * d, y = wy + Math.sin(a) * d;
      if (x > h && x < viewW - h && y > sy + h && y < sy + innerHeight - h) return goTo(x, y);
    }
    goTo(clampX(viewW - wx), wy);
  }

  // cria o botão "roubado": uma cópia clicável pendurada por um fio (o original fica invisível no lugar)
  function grab(link, s) {
    const r = link.getBoundingClientRect();
    const w = r.width, h = r.height, by = r.top + window.scrollY;
    const clone = link.cloneNode(true);
    clone.classList.remove("reveal-item", "is-in", "no-anim");
    clone.classList.add("link--stolen");
    clone.removeAttribute("style"); clone.style.width = w + "px";
    link.style.visibility = "hidden"; link.dataset.stolen = "1";
    return hangItem(clone, w, h, s, Math.max(4, by - s.y), link);     // fiandeira encostada no topo do botão
  }
  // carcaça da mosca enrolada na teia (de cabeça para baixo), pendurada como os botões
  function grabCarcass(s, spec) {
    const k = spec.k * scale, w = spec.w * k, h = spec.h * k;
    const img = new Image(); img.src = spec.src; img.alt = ""; img.className = "fly-carcass";
    img.style.width = w + "px"; img.style.height = h + "px";
    return hangItem(img, w, h, s, 6, null);
  }
  function hangItem(clone, w, h, s, L, link) {
    const box = document.createElement("div"); box.className = "steal-item";
    const anchor = new Image(); anchor.src = TEIA_IMG; anchor.className = "steal-blob steal-blob--anchor"; anchor.alt = ""; anchor.hidden = true;
    const wrap = document.createElement("div"); wrap.className = "steal-wrap";
    const line = document.createElement("div"); line.className = "steal-line";
    const hit = document.createElement("div"); hit.className = "steal-hit";
    const blob = new Image(); blob.src = TEIA_IMG; blob.className = "steal-blob"; blob.alt = "";
    wrap.append(line, clone, blob, hit);
    box.append(anchor, wrap);
    stealLayer.append(box);
    const it = { link, idx: link ? contactLinks().indexOf(link) : -1, box, anchor, wrap, line, hit, blob, clone, w, h, state: "carry",
      ax: s.x, ay: s.y, L, rope: rnd(85, 270), th: 0, om: 0, px: s.x, py: s.y, vx: 0, vy: 0, rot: 0, rotV: 0, t: 0, ph: rnd(0, 6) };
    hit.style.cursor = scissorsCursor();
    hit.addEventListener("pointerdown", (e) => { if (!hasScissors()) return; e.preventDefault(); e.stopPropagation(); dropItem(it); });
    // a rede sai da fiandeira bem pequena e se expande até grudar no botão (ponto de fixação sempre no fio)
    // nasce minúscula debaixo do abdômen e vai saindo/crescendo até cobrir o topo do botão
    blob.animate([
      { transform: "translateY(-16px) scale(.03)", opacity: .7 },
      { transform: "translateY(-6px) scale(.35)", opacity: 1, offset: .45 },
      { transform: "translateY(0) scale(1)", opacity: 1 }
    ], { duration: 1700, easing: "cubic-bezier(.35,.1,.25,1)" });
    hung.push(it);
    return it;
  }
  function resetSwing(it) { it.om = 0; it.th = 0; }

  function dropItem(it) {
    if (it.state !== "carry" && it.state !== "hang") return;
    if (steal && steal.item === it) { const f = steal.fly; steal = null; if (f) endHunt(); walkAway(); }     // cortou enquanto ela carregava
    const tipX = it.ax - Math.sin(it.th) * it.L, tipY = it.ay + Math.cos(it.th) * it.L;   // ponta do fio (topo do botão)
    it.state = "fall"; it.t = 0;
    it.side = tipX > viewW / 2 ? 1 : -1;                               // quica para o lado mais perto
    it.px = tipX; it.py = tipY; it.vx = it.side * rnd(120, 220); it.vy = -80; it.rot = it.th * -1; it.rotV = it.side * 1.4;
    it.anchor.hidden = true; it.line.hidden = true; it.blob.hidden = true; it.hit.hidden = true;
  }
  function restoreItem(it) {
    it.state = "gone";
    it.box.remove();
    hung.splice(hung.indexOf(it), 1);
    if (!it.link) return;                                             // carcaça de mosca: só some
    const l = contactLinks()[it.idx] || it.link;
    l.style.visibility = ""; delete l.dataset.stolen;
    l.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
  }

  // física dos botões pendurados (pêndulo amortecido) e das quedas
  function updateHung(dt) {
    for (const it of [...hung]) {
      it.t += dt;
      if (it.state === "carry" || it.state === "hang") {
        let ax = it.ax, ay = it.ay;
        const gluing = steal && steal.item === it && steal.phase === "stick";
        if (gluing) { it.om = 0; it.th = 0; }                            // enquanto a rede sai, o botão fica parado
        else if (it.state === "carry") {
          const s = spinneret(); ax = s.x; ay = s.y;
          const acc = ((ax - it.ax) / Math.max(dt, 1e-3) - (it.pvx || 0)) / Math.max(dt, 1e-3);
          it.pvx = (ax - it.ax) / Math.max(dt, 1e-3);
          it.om += (Math.cos(it.th) * Math.max(-2000, Math.min(2000, acc)) / it.L) * dt * 0.18;
          it.L += (it.rope - it.L) * Math.min(1, dt * 2.2);             // cada fio tem um comprimento aleatório
          it.ax = ax; it.ay = ay;
        }
        it.om += -(STEAL.g / it.L) * Math.sin(it.th) * dt;
        it.om *= Math.exp(-(it.state === "hang" ? 2.4 : 1.4) * dt);          // amortece o balanço do transporte
        it.th = Math.max(-0.45, Math.min(0.45, it.th + it.om * dt));
        const sway = reduced ? 0 : Math.sin(it.t * 1.35 + it.ph) * 0.045;   // balanço leve e contínuo (~2,5°)
        it.box.style.transform = `translate(${ax}px, ${ay}px)`;
        it.wrap.style.transform = `rotate(${it.th + sway}rad)`;
        it.line.style.height = it.L + "px";
        it.hit.style.height = Math.max(0, it.L - 10) + "px";
        it.blob.style.top = it.L + "px";
        it.clone.style.transform = `translate(${-it.w / 2}px, ${it.L - 8}px)`;
      } else if (it.state === "fall") {
        it.vy = Math.min(2600, it.vy + 1900 * dt);
        it.px += it.vx * dt; it.py += it.vy * dt; it.rot += it.rotV * dt;
        const fl = floorLine();
        if (it.vy > 0 && it.py + it.h >= fl) {
          it.py = fl - it.h;
          it.vy = Math.abs(it.vy) > 120 ? -Math.abs(it.vy) * 0.38 : 0;
          it.vx = it.side * Math.max(Math.abs(it.vx), 430); it.rotV = it.side * 2.6;
        }
        it.box.style.transform = `translate(${it.px}px, ${it.py}px)`;
        it.wrap.style.transform = `rotate(${it.rot}rad)`;
        it.clone.style.transform = `translate(${-it.w / 2}px, 0)`;
        const sy = window.scrollY, gone = it.py > sy + innerHeight + 30 || it.px + it.w < -20 || it.px - it.w > viewW + 20 || it.t > 10;
        if (gone) restoreItem(it);
      }
    }
  }
  document.addEventListener("tesoura", () => hung.forEach((it) => (it.hit.style.cursor = scissorsCursor())));
  // trocar o idioma recria os botões: mantém escondidos os que estão pendurados
  document.addEventListener("langchange", () => setTimeout(() => {
    hung.forEach((it) => { const l = contactLinks()[it.idx]; if (l) { l.style.visibility = "hidden"; l.dataset.stolen = "1"; it.link = l; } });
  }, 0));

  /* ---------- Mosca e caçada ----------
     De tempos em tempos (aleatório) uma mosca entra voando por um dos lados e pousa na parede, na
     área que o visitante está vendo. Ela anda aos trancos, para e se limpa (idle) e depois vai embora.
     Se a mosca e a aranha estiverem na mesma tela, a aranha caça: chega perto, espreita circulando
     (sempre virada para a mosca) até ficar do lado DIREITO dela, dá o bote, leva a mosca para fora
     da tela por um canto, volta com ela enrolada na teia e a pendura de cabeça para baixo.
     Na teia (ou segurando o WhatsApp) ela pode ou não largar tudo e subir para caçar.
     Teste: ?mosca=3 (primeira mosca em 3 s). Depuração: window.__mosca() solta uma mosca agora. */
  const FLY = {
    k: 0.27 / 0.28,              // px da folha da mosca → unidades do quadro da aranha (mosca do "levando")
    first: [10000, 130000],      // ms até a primeira mosca
    every: [20000, 90000],       // ms entre uma mosca e outra
    webChase: 0.5,               // chance de largar a teia (ou o símbolo) para caçar
    life: [14, 32],              // s na parede antes de ir embora (se não for caçada)
    walkSpeed: 300, flySpeed: 640,
    sheets: {
      idle: { src: S + "mosca_idle.webp", n: 43, cols: 8, fw: 285, fh: 326, cx: 142, cy: 167, fps: 12 },
      walk: { src: S + "mosca_walk.webp", n: 8,  cols: 8, fw: 286, fh: 320, cx: 144, cy: 161, fps: 21 },
      fly:  { src: S + "mosca_fly.webp",  n: 10, cols: 8, fw: 286, fh: 270, cx: 143, cy: 135, fps: 85 }
    },
    morta: { src: S + "mosca_morta.webp", w: 178, h: 296 }
  };
  if (params.has("mosca")) FLY.first = [Number(params.get("mosca")) * 1000 || 3000, Number(params.get("mosca")) * 1000 || 3000];
  // no "levando_mosca" a mosca fica com o centro em (−4, 190) do ponto de referência e virada −81° (cabeça para a esquerda)
  const LEV = { x: -4, y: 190, ang: -1.42 };
  const flyCanvas = document.createElement("canvas");
  flyCanvas.className = "spider-sprite spider-fly";
  flyCanvas.hidden = true;
  layer.insertBefore(flyCanvas, canvas);                              // por baixo da aranha
  const fctx = flyCanvas.getContext("2d");
  let flyImgs = {}, fly = null, flyWait = rnd(...FLY.first), hunt = null, flyCanvasKey = "";
  const angDiff = (a, b) => ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const onScreen = (y, m = 30) => y > window.scrollY + m && y < window.scrollY + innerHeight - m;

  function spawnFly() {
    const sy = window.scrollY, from = Math.random() < 0.5 ? -1 : 1;
    const tx = viewW * rnd(0.22, 0.78), ty = sy + innerHeight * rnd(0.22, 0.72);
    fly = { st: "in", a: "fly", f: 0, ft: 0, t: 0, x: from < 0 ? -70 : viewW + 70, y: ty + rnd(-160, 40), tx, ty, hx: tx, hy: ty,
      dir: -from, tilt: 0, rot: 0, wait: 0, darts: 0, dist: 0, life: rnd(...FLY.life), frozen: false,
      chase: Math.random() < FLY.webChase, ph: rnd(0, 6) };
  }
  function flyAnim(a) { if (fly.a !== a) { fly.a = a; fly.f = 0; fly.ft = 0; } }
  function flyAway(fast) {
    fly.st = "out"; flyAnim("fly"); fly.fast = !!fast;
    fly.dir = fly.x < viewW / 2 ? -1 : 1;
    fly.vx = fly.dir * (fast ? 700 : 120); fly.vy = -rnd(fast ? 200 : 60, fast ? 380 : 160);
  }
  function startDart() {
    // vira para um lado qualquer e dá uma corridinha curta; longe do ponto de pouso, volta para perto dele
    let a = fly.rot + rnd(-1.7, 1.7);
    if (Math.hypot(fly.x - fly.hx, fly.y - fly.hy) > 160) a = Math.atan2(fly.hx - fly.x, -(fly.hy - fly.y)) + rnd(-0.5, 0.5);
    fly.rot = a; fly.dist = rnd(22, 95); fly.st = "walk"; flyAnim("walk");
  }

  function updateFly(dt) {
    if (!fly) {
      if (!layer.classList.contains("is-on")) return;
      flyWait -= dt * 1000;
      if (flyWait <= 0) spawnFly();
      return;
    }
    const sh = FLY.sheets[fly.a];
    fly.ft += dt; fly.t += dt;
    while (fly.ft >= 1 / sh.fps) { fly.ft -= 1 / sh.fps; fly.f = (fly.f + 1) % sh.n; }
    if (fly.frozen && (fly.st === "walk" || fly.st === "pause")) { fly.st = "idle"; flyAnim("idle"); }
    switch (fly.st) {
      case "in": {                                                   // chega voando e pousa
        const dx = fly.tx - fly.x, dy = fly.ty - fly.y, d = Math.hypot(dx, dy);
        const sp = Math.min(FLY.flySpeed, d * 3.4 + 40);
        if (d < 5) { fly.st = "idle"; flyAnim("idle"); fly.rot = rnd(-1.3, 1.3); fly.wait = rnd(1.2, 3.5); break; }
        fly.x += dx / d * sp * dt;
        fly.y += dy / d * sp * dt + Math.sin(fly.t * 11 + fly.ph) * 40 * dt;
        if (Math.abs(dx) > 2) fly.dir = Math.sign(dx);
        fly.tilt = clamp(dy / d, -0.5, 0.5) * 0.4 * fly.dir;
        break;
      }
      case "idle":                                                    // se limpando
        if (fly.frozen) break;                                        // a aranha está espreitando: não sai do lugar
        fly.wait -= dt;
        if (fly.wait <= 0) {
          if (fly.t > fly.life) flyAway();
          else { fly.darts = 1 + ((Math.random() * 3) | 0); startDart(); }
        }
        break;
      case "walk": {                                                  // corridinha rápida
        const step = Math.min(fly.dist, FLY.walkSpeed * dt);
        fly.x = clamp(fly.x + Math.sin(fly.rot) * step, 40, viewW - 40);
        fly.y += -Math.cos(fly.rot) * step;
        fly.dist -= step;
        if (fly.dist <= 0) {
          if (--fly.darts > 0) { fly.st = "pause"; fly.wait = rnd(0.12, 0.55); flyAnim("idle"); }
          else { fly.st = "idle"; fly.wait = rnd(1.5, 5); flyAnim("idle"); }
        }
        break;
      }
      case "pause":
        fly.wait -= dt;
        if (fly.wait <= 0) startDart();
        break;
      case "out":                                                     // vai embora voando
        fly.vx += fly.dir * (fly.fast ? 3500 : 900) * dt; fly.vy -= 140 * dt;
        fly.vx = clamp(fly.vx, -(fly.fast ? 1500 : FLY.flySpeed), fly.fast ? 1500 : FLY.flySpeed);
        fly.x += fly.vx * dt; fly.y += fly.vy * dt + Math.sin(fly.t * 11 + fly.ph) * 40 * dt;
        fly.tilt = -0.15 * fly.dir;
        if (fly.x < -90 || fly.x > viewW + 90) { fly = null; flyWait = rnd(...FLY.every); }
        break;
    }
  }

  /* ---------- Besouro ----------
     Mais raro que a mosca. Entra andando por um lado, anda em linhas aleatórias, para (idle), anda de novo
     e depois vai embora. Se a aranha o vê, ele FOGE correndo e ela persegue; depois de um tempo ele cansa e
     para — ela se aproxima devagar por trás, contorna até o lado direito dele e dá o bote (como na mosca).
     Mata-moscas: o besouro pode ser esmagado → a aranha sai da tela, volta com o pano e limpa a sujeira.
     Teste: ?besouro=3 (primeiro besouro em 3 s). Depuração: window.__besouro(), window.__mataMoscas = true. */
  const BUG = {
    k: 1 / 0.6,                  // px da folha → unidades do quadro da aranha (mesma escala do desenho original)
    first: [60000, 240000],      // ms até o primeiro besouro
    every: [120000, 300000],     // ms entre um besouro e outro
    life: [25, 50], walkSpeed: 75, runSpeed: 290, chase: [5, 10], webChase: 0.5,
    sheets: {
      idle:  { src: S + "besouro_idle.webp",  n: 12, cols: 8, fw: 251, fh: 216, cx: 125.4, cy: 91.8,  fps: 9,  loop: true },
      run:   { src: S + "besouro_run.webp",   n: 14, cols: 8, fw: 251, fh: 216, cx: 125.4, cy: 91.8,  fps: 60, loop: true },
      splat: { src: S + "besouro_splat.webp", n: 6,  cols: 6, fw: 448, fh: 480, cx: 211.8, cy: 244.2, fps: 5,  loop: true,  z: 0.55 },   // z: mancha menor que o desenho original
      gone:  { src: S + "besouro_gone.webp",  n: 12, cols: 8, fw: 448, fh: 480, cx: 211.8, cy: 244.2, fps: 5,  loop: false, z: 0.55 }
    },
    teia: { src: S + "besouro_teia.webp", w: 113, h: 185 }
  };
  if (params.has("besouro")) BUG.first = [Number(params.get("besouro")) * 1000 || 3000, Number(params.get("besouro")) * 1000 || 3000];
  // no "levando_besouro" o besouro fica com o centro em (−24, 185) do ponto de referência, virado −73°
  const LEV_B = { x: -24, y: 185, ang: -1.27 };
  const CLEAN_REACH = 190;           // os panos ficam ~190 unidades à frente do corpo no "limpando"
  const bugCanvas = document.createElement("canvas");
  bugCanvas.className = "spider-sprite spider-bug";
  bugCanvas.hidden = true;
  layer.insertBefore(bugCanvas, flyCanvas);                          // por baixo da mosca e da aranha
  const bctx = bugCanvas.getContext("2d");
  let bugImgs = {}, bug = null, bugWait = rnd(...BUG.first), bugCanvasKey = "";

  function spawnBug() {
    const sy = window.scrollY, from = Math.random() < 0.5 ? -1 : 1, y = sy + innerHeight * rnd(0.25, 0.75);
    bug = { st: "walk", a: "run", fps: 18, f: 0, ft: 0, t: 0, x: from < 0 ? -90 : viewW + 90, y, rot: from < 0 ? Math.PI / 2 : -Math.PI / 2,
      tx: viewW * rnd(0.2, 0.8), ty: clamp(y + rnd(-120, 120), sy + 90, sy + innerHeight - 90), wait: 0, life: rnd(...BUG.life),
      chase: Math.random() < BUG.webChase, fade: 1, wob: rnd(0, 6) };
  }
  function bugAnim(a, fps) { if (bug.a !== a) { bug.a = a; bug.f = 0; bug.ft = 0; } bug.fps = fps || BUG.sheets[a].fps; }
  function bugNewTarget() {
    const sy = window.scrollY, a = rnd(0, Math.PI * 2), d = rnd(90, 320);
    bug.tx = clamp(bug.x + Math.cos(a) * d, 60, viewW - 60);
    bug.ty = clamp(bug.y + Math.sin(a) * d, sy + 80, sy + innerHeight - 80);
  }
  function vanishBug() { bug.st = "gone"; bugAnim("gone"); }

  function updateBug(dt) {
    if (!bug) {
      if (!layer.classList.contains("is-on")) return;
      bugWait -= dt * 1000;
      if (bugWait <= 0) spawnBug();
      return;
    }
    const sh = BUG.sheets[bug.a];
    bug.t += dt; bug.ft += dt;
    while (bug.ft >= 1 / bug.fps) { bug.ft -= 1 / bug.fps; if (++bug.f >= sh.n) bug.f = sh.loop ? 0 : sh.n - 1; }
    switch (bug.st) {
      case "walk": case "out": {                                      // anda em linha reta até o alvo
        const dx = bug.tx - bug.x, dy = bug.ty - bug.y, d = Math.hypot(dx, dy);
        const want = Math.atan2(dx, -dy), turn = angDiff(want, bug.rot);
        bug.rot += turn * Math.min(1, dt * 7);
        const step = BUG.walkSpeed * (bug.st === "out" ? 1.5 : 1) * dt * (Math.abs(turn) < 0.5 ? 1 : 0.25);
        if (d <= step) {
          bug.x = bug.tx; bug.y = bug.ty;
          if (bug.st === "out") { bug = null; bugWait = rnd(...BUG.every); return; }
          bug.st = "idle"; bugAnim("idle"); bug.wait = rnd(1.5, 4.5);
        } else { bug.x += dx / d * step; bug.y += dy / d * step; }
        break;
      }
      case "idle":
        bug.wait -= dt;
        if (bug.wait <= 0) {
          bugAnim("run", 18);
          if (bug.t > bug.life) { bug.st = "out"; bug.tx = bug.x < viewW / 2 ? -110 : viewW + 110; bug.ty = bug.y + rnd(-80, 80); }
          else { bug.st = "walk"; bugNewTarget(); }
        }
        break;
      case "flee": fleeBug(dt); break;
      case "splat":                                                   // esmagado: espera a faxina (ou some sozinho)
        bug.wait -= dt;
        if (bug.wait <= 0 && !(hunt && hunt.kind === "clean")) vanishBug();
        break;
      case "gone":
        if (bug.f >= BUG.sheets.gone.n - 1) { bug.fade -= dt * 3; if (bug.fade <= 0) { bug = null; bugWait = rnd(...BUG.every); } }
        break;
    }
  }
  // fugindo: corre para longe da aranha, desviando das bordas da tela
  function fleeBug(dt) {
    const sy = window.scrollY, m = 70;
    let ax = bug.x - wx, ay = bug.y - wy;
    const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
    const push = (v, lo, hi) => (v < lo + 150 ? (lo + 150 - v) / 150 : 0) - (v > hi - 150 ? (v - hi + 150) / 150 : 0);
    const px = push(bug.x, m, viewW - m), py = push(bug.y, sy + m, sy + innerHeight - m);
    ax += px * 2.4; ay += py * 2.4;
    if (px || py) { ax += -ay * 0.8; ay += ax * 0.8; }                // encurralado: escorrega pela borda
    if (bug.tiring) { const cx = viewW / 2 - bug.x, cy = sy + innerHeight / 2 - bug.y, cd = Math.hypot(cx, cy) || 1; ax += cx / cd * 1.8; ay += cy / cd * 1.8; }
    bug.wob += dt;
    ax += Math.sin(bug.wob * 1.7) * 0.35; ay += Math.cos(bug.wob * 1.3) * 0.35;
    bug.rot += angDiff(Math.atan2(ax, -ay), bug.rot) * Math.min(1, dt * 5);
    const sp = BUG.runSpeed * dt;
    bug.x = clamp(bug.x + Math.sin(bug.rot) * sp, m * 0.5, viewW - m * 0.5);
    bug.y = clamp(bug.y - Math.cos(bug.rot) * sp, sy + m * 0.5, sy + innerHeight - m * 0.5);
  }

  function drawBug() {
    const show = !!bug && bug.st !== "caught" && layer.classList.contains("is-on") && !!bugImgs[bug.a];
    bugCanvas.hidden = !show;
    if (!show) return;
    const sh = BUG.sheets[bug.a], s = BUG.k * scale * (sh.z || 1);
    const key = `${scale}|${dpr}`;
    if (key !== bugCanvasKey) {
      bugCanvasKey = key;
      bugCanvas.width = Math.ceil(448 * s * dpr); bugCanvas.height = Math.ceil(480 * s * dpr);
      bugCanvas.style.width = bugCanvas.width / dpr + "px"; bugCanvas.style.height = bugCanvas.height / dpr + "px";
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, bugCanvas.width, bugCanvas.height);
    const f = bug.f % sh.n;
    bctx.drawImage(bugImgs[bug.a], (f % sh.cols) * sh.fw, ((f / sh.cols) | 0) * sh.fh, sh.fw, sh.fh, 0, 0, sh.fw * s * dpr, sh.fh * s * dpr);
    bugCanvas.style.opacity = Math.max(0, bug.fade);
    bugCanvas.style.transformOrigin = `${sh.cx * s}px ${sh.cy * s}px`;
    bugCanvas.style.transform = `translate(${bug.x - sh.cx * s}px, ${bug.y - window.scrollY - sh.cy * s}px) rotate(${bug.rot}rad)`;
  }

  /* ---------- Caçada (mosca ou besouro) e faxina ---------- */
  const onWall = () => mode === "wallWalk" || mode === "wallIdle";
  const webFree = () => ["idle", "moving", "stopping", "pointing"].includes(mode);
  const HEAD_DOWN = ["espreita", "ataque", "levando", "levando_b", "limpando"];

  // a aranha vê um inseto? (os dois na mesma tela)
  function maybeHunt() {
    if (hunt) return;
    if (bug && bug.st === "splat") { maybeClean(); return; }          // sujeira primeiro
    let kind = null, prey = null;
    if (fly && ["idle", "walk", "pause"].includes(fly.st) && onScreen(fly.y)) { kind = "fly"; prey = fly; }
    else if (bug && ["walk", "idle"].includes(bug.st) && onScreen(bug.y) && bug.x > 30 && bug.x < viewW - 30) { kind = "bug"; prey = bug; }
    if (!prey) return;
    const h = { kind, prey, lev: kind === "bug" ? LEV_B : LEV };
    if (onWall()) {
      if (exiting || !onScreen(wy, -40)) return;
      if (steal) { if (steal.phase !== "go") return; steal = null; }   // ainda indo buscar um botão: desiste dele
      hunt = h;
      startHunt();
    } else if (webFree() && prey.chase) {
      if (kind === "fly") fly.frozen = true;
      leaveWeb(Object.assign(h, { afterClimb: startHunt }));
    }
  }
  function maybeClean() {
    if (onWall()) {
      if (exiting || steal) return;
      hunt = { kind: "clean", prey: bug };
      cleanLeave();
    } else if (webFree()) leaveWeb({ kind: "clean", prey: bug, afterClimb: cleanAway });
  }

  // na teia: larga o símbolo (se estiver com ele) e sobe até sumir da tela
  function leaveWeb(h) {
    hunt = Object.assign(h, { phase: "climb" });
    if (variant === "hold" || variant === "wpp") {
      if (variant === "wpp") {
        const ks = scale * CONFIG.size.wppteia;
        sym.x = webX() + (396 - ANCHOR.x) * scale;
        sym.y = pos + (416 - ANCHOR.y) * scale - (340 - APEX.y) * ks;
      }
      Object.assign(sym, { state: "drop", t: 0, rot: 0, vx: 0, vy: 0, rotV: -CONFIG.symSpin, g: CONFIG.dropGravity, maxV: 2600 });
      hunt.symDropped = true;
      variant = "normal";
    }
    bounceA = 0; vel = 0;
    setMode("climb");
  }
  function climbWeb(dt) {
    pos -= 560 * dt;
    if (pos - window.scrollY + (460 - ANCHOR.y) * scale < -20) {     // sumiu por cima → desce pela parede
      wx = clampX(webX() + 10); wy = window.scrollY - 150 * scale; rot = Math.PI;
      if (hunt && hunt.afterClimb) hunt.afterClimb(); else enterView();
    }
  }

  // geometria do bote: onde ela tem de terminar (levando a presa) e de onde salta
  function huntGeom() {
    const p = hunt.prey, lv = hunt.lev;
    const k = scale * CONFIG.size.levando, rf = p.rot - lv.ang;
    const c = Math.cos(rf), s = Math.sin(rf);
    const Pf = { x: p.x - (lv.x * c - lv.y * s) * k, y: p.y - (lv.x * s + lv.y * c) * k };
    const L = 120 * k, Ps = { x: Pf.x + Math.sin(rf) * L, y: Pf.y - Math.cos(rf) * L };   // recua na direção oposta à cabeça
    return { rf, Pf, Ps, Rs: Math.hypot(Ps.x - p.x, Ps.y - p.y), th: Math.atan2(Ps.y - p.y, Ps.x - p.x) };
  }
  function startHunt() {
    const p = hunt.prey;
    if (hunt.kind === "bug") {                                        // besouro: foge e ela persegue
      hunt.phase = "chase"; hunt.t = 0; hunt.chaseT = rnd(...BUG.chase);
      p.st = "flee"; bugAnim("run", 60);
      setMode("hunt"); play("cima");
      return;
    }
    p.frozen = true;
    hunt.phase = "approach";
    const g = huntGeom(), a = Math.atan2(wy - p.y, wx - p.x), R = g.Rs * 1.35;
    goTo(clampX(p.x + Math.cos(a) * R), p.y + Math.sin(a) * R);
    hunt.arrive = beginStalk;
  }
  function beginStalk() {
    const p = hunt.prey;
    flipRot();                                                        // "cima" → desenho de cabeça para baixo
    setMode("hunt"); play("espreita");
    const g = huntGeom(), a = Math.atan2(wy - p.y, wx - p.x), way = [];
    if (hunt.kind === "bug") way.push(Math.atan2(Math.cos(p.rot), -Math.sin(p.rot)));   // besouro: vem por trás
    else { const d = angDiff(g.th, a); if (Math.abs(d) < 1.1) way.push(a - Math.sign(d || 1) * rnd(0.5, 0.9)); }   // a "dança"
    way.push(null);                                                   // null = lado direito da presa
    Object.assign(hunt, { phase: "stalk", ang: a, R: Math.hypot(wx - p.x, wy - p.y), way, move: rnd(0.5, 1), pause: 0, t: 0,
      speed: hunt.kind === "bug" ? 55 : 85 });
  }
  function facePrey(dt, rate) {
    const p = hunt.prey, want = Math.atan2(-(p.x - wx), p.y - wy);   // cabeça (para baixo no desenho) apontando para a presa
    rot += angDiff(want, rot) * Math.min(1, dt * rate);
  }
  function moveTo(tx, ty, speed, dt, headUp) {                        // anda em linha reta virando para o caminho
    const dx = tx - wx, dy = ty - wy, d = Math.hypot(dx, dy);
    rot += angDiff(headUp ? Math.atan2(dx, -dy) : Math.atan2(-dx, dy), rot) * Math.min(1, dt * 5);
    const step = speed * dt;
    if (d <= step) { wx = tx; wy = ty; return true; }
    wx += dx / d * step; wy += dy / d * step;
    return false;
  }

  function updateHunt(dt) {
    hunt.t += dt;
    const p = hunt.prey;
    if (hunt.phase === "chase") {                                    // perseguição: ela nunca alcança enquanto ele corre
      const dx = p.x - wx, dy = p.y - wy, d = Math.hypot(dx, dy);
      rot += angDiff(Math.atan2(dx, -dy), rot) * Math.min(1, dt * 6);
      const sp = (d > 190 ? BUG.runSpeed * 1.2 : d > 120 ? BUG.runSpeed * 0.95 : BUG.runSpeed * 0.6) * dt;
      wx += Math.sin(rot) * sp; wy -= Math.cos(rot) * sp;
      if (hunt.t >= hunt.chaseT) {                                    // cansando: perde o rumo e vai para o meio da tela
        p.tiring = true;
        const sy = window.scrollY, inside = p.x > viewW * 0.25 && p.x < viewW * 0.75 && p.y > sy + innerHeight * 0.25 && p.y < sy + innerHeight * 0.75;
        if (inside || hunt.t >= hunt.chaseT + 8) { p.st = "tired"; p.tiring = false; bugAnim("idle"); beginStalk(); }   // cansou: para
      }
    } else if (hunt.phase === "stalk") {
      facePrey(dt, 5);
      if (hunt.pause > 0) { hunt.pause -= dt; animHold = true; return; }   // paradinha, olhando a presa
      animHold = false;
      hunt.move -= dt;
      if (hunt.move <= 0) { hunt.move = rnd(0.5, 1.2); hunt.pause = rnd(0.25, 0.8); }
      const g = huntGeom(), tgt = hunt.way[0] ?? g.th, d = angDiff(tgt, hunt.ang);
      const w = hunt.speed / Math.max(40, hunt.R);
      hunt.ang += clamp(d, -w * dt, w * dt);
      hunt.R += (g.Rs - hunt.R) * Math.min(1, dt * (hunt.kind === "bug" ? 0.7 : 1.1));
      wx = p.x + Math.cos(hunt.ang) * hunt.R; wy = p.y + Math.sin(hunt.ang) * hunt.R;
      if (Math.abs(d) < 0.015) {
        if (hunt.way[0] != null) hunt.way.shift();
        else if (Math.abs(hunt.R - g.Rs) < 3 && hunt.t > 2.5) { hunt.phase = "attack"; hunt.t = 0; hunt.g = g; hunt.r0 = rot; play("ataque"); }
      }
    } else if (hunt.phase === "attack") {                            // agacha (quadros 0–8) e salta (9–13)
      const g = hunt.g;
      rot = hunt.r0 + angDiff(g.rf, hunt.r0) * Math.min(1, hunt.t / 0.9);
      const u = clamp((hunt.t - 9 / 8) / (5 / 8), 0, 1), e = 1 - Math.pow(1 - u, 3);
      wx = g.Ps.x + (g.Pf.x - g.Ps.x) * e; wy = g.Ps.y + (g.Pf.y - g.Ps.y) * e;
      if (hunt.t >= 14 / 8) {                                         // pegou
        p.st = "caught"; play(hunt.kind === "bug" ? "levando_b" : "levando");
        const off = 320 * scale, sy = window.scrollY;
        hunt.tx = wx < viewW / 2 ? -off : viewW + off;
        hunt.ty = wy - sy < innerHeight / 2 ? sy - off : sy + innerHeight + off;
        hunt.phase = "carry"; hunt.t = 0;
      }
    } else if (hunt.phase === "carry") {                             // leva a presa para fora da tela por um canto
      if (hunt.t < 0.5) return;                                      // segura a presa um instante
      if (moveTo(hunt.tx, hunt.ty, CONFIG.wallSpeed * 1.25, dt, false)) { hunt.phase = "wrap"; hunt.t = 0; }
    } else if (hunt.phase === "wrap") {                              // fora da tela: enrola a presa na teia
      if (hunt.t < 2.6) return;
      if (hunt.kind === "bug") { bug = null; bugWait = rnd(...BUG.every); }
      else { fly = null; flyWait = rnd(...FLY.every); }
      steal = { phase: "carry", fly: true, t: 0 };
      play("cima"); flipRot();
      steal.item = grabCarcass(spinneret(), hunt.kind === "bug" ? { ...BUG.teia, k: BUG.k } : { ...FLY.morta, k: FLY.k });
      hunt.phase = "return";
      carryTo();                                                      // volta e pendura como os botões
    }
    // ---- faxina do besouro esmagado ----
    else if (hunt.phase === "away") {                                // fora da tela, pegando o pano
      if (hunt.t < 1.2) return;
      const off = 260 * scale, sy = window.scrollY;
      wx = p.x < viewW / 2 ? -off : viewW + off;
      wy = clamp(p.y + rnd(-140, 140), sy + 60, sy + innerHeight - 60);
      const dx = p.x - wx, dy = p.y - wy, d = Math.hypot(dx, dy) || 1, k = scale * CONFIG.size.limpando;
      hunt.P = { x: p.x - dx / d * CLEAN_REACH * k, y: p.y - dy / d * CLEAN_REACH * k };
      rot = Math.atan2(dx, -dy);
      play("pano"); hunt.phase = "bring"; hunt.t = 0;
    } else if (hunt.phase === "bring") {                             // volta trazendo o pano
      if (moveTo(hunt.P.x, hunt.P.y, CONFIG.wallSpeed * 1.2, dt, true)) {
        flipRot(); play("limpando");
        hunt.phase = "clean"; hunt.t = 0;
        if (p.st === "splat") vanishBug();                            // a sujeira some do meio para fora junto com a limpeza
      }
    } else if (hunt.phase === "clean") {
      const per = { x: Math.cos(rot), y: Math.sin(rot) }, wig = Math.sin(hunt.t * 6) * 5 * scale * 2;   // esfrega de um lado para o outro
      wx = hunt.P.x + per.x * wig; wy = hunt.P.y + per.y * wig;
      if (hunt.t > BUG.sheets.gone.n / BUG.sheets.gone.fps + 0.5) {
        flipRot(); play("pano");
        const off = 260 * scale;
        hunt.tx = wx < viewW / 2 ? -off : viewW + off; hunt.ty = wy + rnd(-120, 120);
        hunt.phase = "exit"; hunt.t = 0;
      }
    } else if (hunt.phase === "exit") {                              // leva o pano embora e volta ao normal
      if (moveTo(hunt.tx, hunt.ty, CONFIG.wallSpeed * 1.3, dt, true)) { endHunt(); play("cima"); enterView(); }
    }
  }
  function cleanLeave() {                                             // sai da tela pelo lado mais perto
    hunt.phase = "leave";
    const off = 260 * scale, sy = window.scrollY;
    goTo(wx < viewW / 2 ? -off : viewW + off, clamp(wy, sy + 60, sy + innerHeight - 60));
    hunt.arrive = cleanAway;
  }
  function cleanAway() { hunt.phase = "away"; hunt.t = 0; setMode("hunt"); play("cima"); }

  function endHunt() {
    if (hunt && hunt.symDropped && sym.state === "gone") Object.assign(sym, { state: "floor", rot: 0, vx: 0, vy: 0 });
    hunt = null; animHold = false;
    if (fly && fly.st === "caught") { fly = null; flyWait = rnd(...FLY.every); }
    if (bug && bug.st === "caught") { bug = null; bugWait = rnd(...BUG.every); }
  }
  // a presa escapou (mata-moscas): ela desiste e volta ao normal
  function abortHunt() {
    if (!hunt || hunt.kind === "clean") return;
    const m = mode, headDown = HEAD_DOWN.includes(anim);
    if (hunt.prey === fly && fly) fly.frozen = false;
    endHunt();
    if (m === "climb") return;                                        // climbWeb volta pela parede sozinha (enterView)
    if (m === "hunt") { if (headDown) flipRot(); play("cima"); walkAway(); }
  }

  /* ---------- Mata-moscas (coletado na seção Sobre) ----------
     Com ele, passar o mouse sobre um inseto mostra o mata-moscas; clicar dá a batida.
     Mosca: sempre escapa voando rápido. Aranha: corre rápido demais, nunca é atingida.
     Besouro: é esmagado (e a aranha vem limpar). */
  const hasSwatter = () => !!window.__mataMoscas;
  const swat = document.createElement("div");
  swat.className = "swatter"; swat.hidden = true;
  const swatImg = new Image(); swatImg.src = "assets/img/mata_moscas.webp"; swatImg.alt = "";
  swat.append(swatImg);
  document.body.append(swat);
  let swX = -999, swY = -999, swMouse = true, swHold = 0, swallowClick = false, dash = 1;
  addEventListener("pointermove", (e) => { swX = e.clientX; swY = e.clientY; swMouse = e.pointerType === "mouse"; }, { passive: true });
  function swatTarget(x, y) {                                         // x, y na tela
    const sy = window.scrollY;
    if (fly && ["in", "idle", "walk", "pause", "out"].includes(fly.st) && Math.hypot(x - fly.x, y - (fly.y - sy)) < 110 * scale + 12) return "fly";
    if (bug && ["walk", "idle", "flee", "tired", "out"].includes(bug.st) && Math.hypot(x - bug.x, y - (bug.y - sy)) < 125 * scale + 12) return "bug";
    if ((onWall() || mode === "hunt") && Math.hypot(x - wx, y - (wy - sy)) < 130 * scale) return "spider";
    if (onWeb() && Math.hypot(x - webX(), y - (pos - sy + (280 - ANCHOR.y) * scale)) < 110 * scale) return "spider";
    return null;
  }
  function swatHit(tgt) {
    if (tgt === "fly") {                                              // rápida demais: sempre escapa
      if (hunt && hunt.prey === fly) abortHunt();
      fly.frozen = false; flyAway(true);
    } else if (tgt === "bug") {                                       // esmagado
      if (hunt && hunt.prey === bug) abortHunt();
      bug.st = "splat"; bugAnim("splat"); bug.wait = 12;
    } else if (tgt === "spider") {                                    // desvia correndo, rápida demais para ser atingida
      if (onWall() && !steal && !hunt && !exiting) { flee(); dash = 3.2; }
      else if (webFree()) { vel = -2400; pos -= 30; if (mode !== "moving") setMode("moving"); }
    }
  }
  addEventListener("pointerdown", (e) => {
    if (!hasSwatter() || !layer.classList.contains("is-on")) return;
    const tgt = swatTarget(e.clientX, e.clientY);
    if (!tgt) return;
    e.preventDefault(); e.stopPropagation();
    swallowClick = true; setTimeout(() => (swallowClick = false), 500);
    swX = e.clientX; swY = e.clientY; swHold = 0.45;
    swatImg.animate([
      { transform: "rotate(-22deg) scale(1)" },
      { transform: "rotate(-6deg) scale(.82)", offset: 0.4 },
      { transform: "rotate(-24deg) scale(1.02)", offset: 0.75 },
      { transform: "rotate(-22deg) scale(1)" }
    ], { duration: 240, easing: "ease-out" });
    if (tgt === "bug") setTimeout(() => bug && ["walk", "idle", "flee", "tired", "out"].includes(bug.st) && swatHit("bug"), 90);   // no impacto
    else swatHit(tgt);                                                // mosca e aranha fogem antes da batida
  }, true);
  addEventListener("click", (e) => { if (swallowClick) { e.preventDefault(); e.stopPropagation(); swallowClick = false; } }, true);
  function drawSwatter(dt) {
    swHold = Math.max(0, swHold - dt);
    const on = hasSwatter() && layer.classList.contains("is-on") && (swHold > 0 || (swMouse && !!swatTarget(swX, swY)));
    swat.hidden = !on;
    document.documentElement.classList.toggle("swat-on", on);
    if (on) swat.style.transform = `translate(${swX}px, ${swY}px)`;
  }
  window.__besouro = (chase) => { if (!bug) spawnBug(); if (chase !== undefined) bug.chase = !!chase; return bug && bug.st; };
  window.__besouroEstado = () => ({ bug: bug && { st: bug.st, x: Math.round(bug.x), y: Math.round(bug.y), rot: +bug.rot.toFixed(2) },
    hunt: hunt && hunt.kind + ":" + hunt.phase, mode, anim, wx: Math.round(wx), wy: Math.round(wy) });
  window.__esmagar = () => { if (bug) swatHit("bug"); return bug && bug.st; };
  function drawFly() {
    const show = !!fly && fly.st !== "caught" && layer.classList.contains("is-on") && !!flyImgs[fly.a];
    flyCanvas.hidden = !show;
    if (!show) return;
    const sh = FLY.sheets[fly.a], s = FLY.k * scale;
    const key = `${scale}|${dpr}`;
    if (key !== flyCanvasKey) {                                       // cabe o maior quadro
      flyCanvasKey = key;
      flyCanvas.width = Math.ceil(286 * s * dpr); flyCanvas.height = Math.ceil(326 * s * dpr);
      flyCanvas.style.width = flyCanvas.width / dpr + "px"; flyCanvas.style.height = flyCanvas.height / dpr + "px";
    }
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, flyCanvas.width, flyCanvas.height);
    const f = fly.f % sh.n;
    fctx.drawImage(flyImgs[fly.a], (f % sh.cols) * sh.fw, ((f / sh.cols) | 0) * sh.fh, sh.fw, sh.fh, 0, 0, sh.fw * s * dpr, sh.fh * s * dpr);
    const side = fly.a === "fly";
    flyCanvas.style.transformOrigin = `${sh.cx * s}px ${sh.cy * s}px`;
    flyCanvas.style.transform = `translate(${fly.x - sh.cx * s}px, ${fly.y - window.scrollY - sh.cy * s}px) ` +
      (side ? `rotate(${fly.tilt}rad) scaleX(${fly.dir < 0 ? -1 : 1})` : `rotate(${fly.rot}rad)`);
  }
  window.__mosca = (chase) => { if (!fly) spawnFly(); if (chase !== undefined) fly.chase = !!chase; return fly && fly.st; };
  window.__moscaEstado = () => ({ fly: fly && { st: fly.st, x: Math.round(fly.x), y: Math.round(fly.y), rot: +fly.rot.toFixed(2), chase: fly.chase },
    hunt: hunt && hunt.phase, mode, anim, frame, wx: Math.round(wx), wy: Math.round(wy), rot: +rot.toFixed(2), steal: steal && steal.phase, hung: hung.length });

  /* ---------- Quadros ---------- */
  function advance(dt) {
    if (!anim || animHold) return;
    const s = SHEETS[anim];
    frameTime += dt;
    const step = 1 / s.fps;
    while (frameTime >= step) {
      frameTime -= step;
      if (++frame >= s.frames) {
        if (s.loop) frame = 0;
        else {
          frame = s.frames - 1;
          if (anim === "webstop") setMode(besideClickable() ? "pointing" : "idle");
          else if (anim === "seg_inicio") { variant = "hold"; setMode("idle"); }
          else if (anim === "soltando") setMode("angryUp");   // soltou → brava parada 4 s → sobe
          else if (anim === "apontar_inicio") play("apontar");
          else if (anim === "virada") setMode("walking");
          return;                               // fall: fica no último quadro até tocar o chão
        }
      }
    }
  }

  function draw() {
    const sy = window.scrollY;
    let left, top;
    if (hanging() || mode === "falling") {
      const off = onWeb() ? bounceOffset() : 0;
      const x = webX(), y = pos - sy + off;
      left = x - ANCHOR.x * scale; top = y - ANCHOR.y * scale;
      thread.style.transform = `translateX(${x}px)`;
      thread.style.height = Math.max(0, y) + "px";
      threadHit.style.transform = `translate(${x - 9}px, 0)`;
      threadHit.style.height = Math.max(0, y - 4) + "px";
      canvas.style.transform = `translate(${left}px, ${top}px) scaleY(${1 + off * 0.004})`;
    } else if (anim && REF[anim]) {
      const wall = mode === "wallWalk" || mode === "wallIdle" || mode === "hunt";
      const k = CONFIG.size[anim] || 1, ref = REF[anim];
      const cx = wall ? wx : gx, cy = (wall ? wy : gy) - sy;
      const squash = wall ? 0 : bounceOffset() * 0.006 + pet * 0.08;
      const r = mode === "wallWalk" || mode === "hunt" || steal ? rot : 0;
      left = cx - ref.x * scale; top = cy - ref.y * scale;
      canvas.style.transformOrigin = `${ref.x * scale}px ${ref.y * scale}px`;
      canvas.style.transform =
        `translate(${left}px, ${top}px) rotate(${r}rad) scale(${k * (1 + squash * 0.5)}, ${k * (1 - squash)})`;
      const bb = BBOX[anim] || BBOX.brava;   // área do mouse = contorno do corpo
      const bl = cx + (bb[0] - ref.x) * scale * k, bt = cy + (bb[1] - ref.y) * scale * k;
      bodyHit.style.transform = `translate(${bl}px, ${bt}px)`;
      bodyHit.style.width = (bb[2] - bb[0]) * scale * k + "px";
      bodyHit.style.height = (bb[3] - bb[1]) * scale * k + "px";
    }
    if (hanging() || mode === "falling") canvas.style.transformOrigin = "50% 0";

    // teia de baixo (disparo / puxando / segurando)
    const lx = lowX(), ly = lowY() - sy + (onWeb() ? bounceOffset() : 0);
    const showLow = mode === "shoot" || sym.state === "pull" || sym.state === "held";
    lowThread.hidden = !showLow;
    if (showLow) {
      const full = Math.max(0, sym.y - sy - ly);
      lowThread.style.transform = `translate(${lx}px, ${ly}px)`;
      lowThread.style.height = (mode === "shoot" ? full * shot : full) + "px";   // disparo: desce devagar, constante
      lowHit.style.transform = `translate(${lx - 9}px, ${ly + 4}px)`;
      lowHit.style.height = Math.max(0, full - 8) + "px";
    }

    // símbolo (canvas próprio) e área clicável só no desenho do símbolo
    const ks = scale * CONFIG.size.wppteia;
    const onFloor = ["angry", "calm", "turning", "walking"].includes(mode);   // aranha no chão: símbolo escondido
    const symOn = sym.state !== "gone" && !(onFloor && sym.state === "floor") && layer.classList.contains("is-on");
    symCanvas.hidden = !symOn;
    let hit = null;
    if (symOn) {
      const ax = sym.x, ay = sym.y - sy;
      const onWebSym = sym.state === "pull" || sym.state === "held";   // preso na teia → wppteia; solto → simbolo_wpp
      symCanvas.style.transformOrigin = `${SYM_C.x * ks}px ${SYM_C.y * ks}px`;   // gira pelo centro do símbolo
      symCanvas.style.transform = `translate(${ax - APEX.x * ks}px, ${ay - APEX.y * ks}px) rotate(${sym.rot}rad)`;
      symCtx.setTransform(1, 0, 0, 1, 0, 0);
      symCtx.clearRect(0, 0, symCanvas.width, symCanvas.height);
      if (onWebSym) symCtx.drawImage(sheets.wppteia, sym.frame * FW, 0, FW, FH, 0, 0, symCanvas.width, symCanvas.height);
      else {
        const k = symCanvas.width / FW;
        symCtx.drawImage(sheets.simbolo, (SYM_C.x - SYM_HALF) * k, (SYM_C.y - SYM_HALF) * k, SYM_HALF * 2 * k, SYM_HALF * 2 * k);
      }
      const box = onWebSym ? SYM_HIT : [SYM_C.x - SYM_HALF, SYM_C.y - SYM_HALF, SYM_C.x + SYM_HALF, SYM_C.y + SYM_HALF];
      if (sym.state !== "drop")
        hit = [ax + (box[0] - APEX.x) * ks, ay + (box[1] - APEX.y) * ks, (box[2] - box[0]) * ks, (box[3] - box[1]) * ks];
    }
    if (variant === "wpp" && onWeb()) {         // símbolo desenhado no próprio sprite da aranha
      const off = bounceOffset(), x = webX(), y = pos - sy + off;
      hit = [x + (WPP_HIT[0] - ANCHOR.x) * scale, y + (WPP_HIT[1] - ANCHOR.y) * scale, (WPP_HIT[2] - WPP_HIT[0]) * scale, (WPP_HIT[3] - WPP_HIT[1]) * scale];
    }
    waHit.hidden = !hit;
    if (hit) {
      waHit.style.transform = `translate(${hit[0]}px, ${hit[1]}px)`;
      waHit.style.width = hit[2] + "px"; waHit.style.height = hit[3] + "px";
    }

    // pedaços da teia cortada
    cutTop.hidden = cutLow.hidden = !cut;
    if (cut) {
      const x = webX(), k = Math.min(1, cut.t / 0.6);
      cutTop.style.transform = `translateX(${x}px)`;
      cutTop.style.height = cut.top * (1 - k) + "px";           // recolhe para cima
      cutTop.style.opacity = 1 - k;
      const y = pos - sy;
      cutLow.style.transform = `translate(${x}px, ${y - cut.low}px)`;
      cutLow.style.height = cut.low + "px";
      cutLow.style.opacity = Math.max(0, 1 - cut.t / 0.9);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === "gone" || !anim) return;
    ctx.drawImage(sheets[anim], frame * FW, 0, FW, FH, 0, 0, canvas.width, canvas.height);
  }

  function respawn() {
    firstTrip = true;
    pos = window.scrollY - FH * scale;
    setMode("moving");
  }

  // depuração: ?parede=… já existe; __aranhaRoubo() força um roubo agora (se estiver na parede)
  window.__aranhaRoubo = () => { const f = contactLinks().filter((l) => !l.dataset.stolen); if (f.length && (mode === "wallIdle" || mode === "wallWalk") && !steal) startSteal(f[(Math.random() * f.length) | 0]); return !!steal; };
  window.__aranhaParede = () => { setMode("gone"); timer = 1e9; };
  window.__aranha = () => ({ rot: +rot.toFixed(2), steal: steal && steal.phase, hung: hung.map((h) => h.state), mode, anim, frame, variant, sym: sym.state, exiting, pendingShoot, beside: onWeb() && besideClickable() });

  /* ---------- Início ---------- */
  Object.entries(FLY.sheets).forEach(([k, s]) => load(s.src).then((img) => (flyImgs[k] = img)).catch(() => {}));
  Object.entries(BUG.sheets).forEach(([k, s]) => load(s.src).then((img) => (bugImgs[k] = img)).catch(() => {}));
  Promise.all(Object.entries(SHEETS).map(([k, s]) => load(s.src).then((img) => [k, img])))
    .then((pairs) => {
      sheets = Object.fromEntries(pairs);
      measure();
      addEventListener("resize", measure);
      setMode("hidden"); threadHit.hidden = bodyHit.hidden = cutTop.hidden = cutLow.hidden = true;
      lowThread.hidden = lowHit.hidden = waHit.hidden = true;
      setTimeout(() => {
        layer.classList.add("is-on");
        respawn();
        let last = performance.now();
        (function loop(now) {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          update(dt); updateFly(dt); updateBug(dt); maybeHunt(); updateHung(dt); advance(dt); draw(); drawFly(); drawBug(); drawSwatter(dt);
          requestAnimationFrame(loop);
        })(last);
      }, delay);
    })
    .catch((e) => console.warn("[aranha] não foi possível carregar os sprites", e));
})();
