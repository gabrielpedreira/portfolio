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
    followSpeed: 420,     // px/s — acompanhando a rolagem
    moveThreshold: 6,     // px de diferença para voltar a se mover (rolagem lenta já ativa a descida)
    bodyMax: 110,         // largura máxima do corpo na tela (px)
    bodyMin: 46,
    gravity: 2600,        // px/s² na queda
    maxFall: 2400,        // px/s velocidade máxima de queda
    calmTime: 5000,       // ms em pé, calma, antes de ir embora
    runSpeed: 950,        // px/s correndo no chão (andando_perfil)
    returnAfter: 7000,    // ms depois de sumir para voltar pela parede
    wallSpeed: 230,       // px/s andando na parede
    // escala de cada animação em relação à teia (ajuste fino visual)
    size: { brava: 0.68, empe: 0.68, virada: 0.68, andando: 0.5, cima: 1.0, parede: 1.05 },
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
    cima:           { src: S + "andando_cima.png",      frames: 10, fps: 16, loop: true },
    parede:         { src: S + "idle_parede.png",       frames: 16, fps: 10, loop: true }
  };
  window.SPIDER_SPRITES = SHEETS;
  // ponto de referência de cada animação no quadro (pés no chão / centro do corpo na parede)
  const REF = {
    brava: { x: 405, y: 459 }, empe: { x: 405, y: 459 }, virada: { x: 405, y: 459 }, andando: { x: 400, y: 500 },
    cima: { x: 413, y: 263 }, parede: { x: 401, y: 205 }
  };
  const BBOX = { brava: [201,166,609,459], cima: [216,58,611,468], parede: [205,26,598,384] };

  const POINT_TARGETS = "#trabalhos .cat, #trabalhos .card [data-open], #trabalhos .card__links a, #catBack";
  const FW = 800, FH = 520;
  const ANCHOR = { x: 391, y: 108 };   // fiandeira
  const FEET = 459;                    // linha dos pés nas animações de chão
  const FALL_BOTTOM = 450;             // parte mais baixa do corpo na queda
  const BODY_SRC_W = 200;              // largura aproximada do corpo no quadro
  const HIT = { x: 205, y: 165, w: 400, h: 300 };  // área clicável do corpo no chão (coords do quadro)

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

  /* ---------- Elementos ---------- */
  const mk = (cls) => { const e = document.createElement("div"); e.className = cls; layer.append(e); return e; };
  const thread = mk("spider-thread");
  const threadHit = mk("spider-thread-hit");
  const cutTop = mk("spider-thread");       // pedaço de cima (sobe e some)
  const cutLow = mk("spider-thread");       // pedaço preso nela (cai junto)
  [thread, cutTop, cutLow].forEach((t) => (t.style.background = CONFIG.threadColor));
  const canvas = document.createElement("canvas");
  canvas.className = "spider-sprite";
  layer.append(canvas);
  const bodyHit = mk("spider-body-hit");
  const ctx = canvas.getContext("2d");
  threadHit.style.cursor = CURSOR.scissorsOpen;
  bodyHit.style.cursor = CURSOR.handOpen;

  const load = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

  /* ---------- Estado ---------- */
  let sheets = {};
  let scale = 0.5, dpr = 1, gutter = 16, viewW = innerWidth;
  let mode = "hidden";   // teia: moving|stopping|idle|pointing   chão: falling|angry|calm|turning|walking|gone
  let pos = 0, vel = 0, peakSpeed = 0;  // fiandeira (y no DOCUMENTO) enquanto na teia
  let gx = 0, gy = 0;                   // chão: x do centro do quadro (tela) e y dos pés (documento)
  let fallV = 0, cut = null, timer = 0;
  let wx = 0, wy = 0, rot = 0, path = [], side = Math.random() < .5 ? "left" : "right"; // parede
  let anim = null, frame = 0, frameTime = 0;
  let bounceT = 0, bounceA = 0, clock = 0, firstTrip = true, pet = 0;
  let lastScroll = 0;
  addEventListener("scroll", () => (lastScroll = performance.now()), { passive: true });
  const onWeb = () => ["moving", "stopping", "idle", "pointing"].includes(mode);

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
  }

  const webX = () => gutter / 2;
  const target = () => window.scrollY + innerHeight * CONFIG.viewY;
  function floorLine() {  // meio vertical da imagem do chão (documento)
    const f = document.getElementById("floor");
    if (!f) return document.documentElement.scrollHeight - 40;
    const r = f.getBoundingClientRect();
    return r.top + window.scrollY + r.height * 0.5;
  }

  function play(name) { if (anim !== name) { anim = name; frame = 0; frameTime = 0; } }

  function setMode(m) {
    mode = m; timer = 0;
    const map = { moving: "webdown", stopping: "webstop", idle: "webidle", pointing: "apontar_inicio",
                  falling: "fall", angry: "brava", calm: "empe", turning: "virada", walking: "andando",
                  wallWalk: "cima", wallIdle: "parede" };
    if (map[m]) play(map[m]);
    if (m === "moving") { peakSpeed = 0; bounceA = 0; }
    if (m === "stopping") { bounceT = 0; bounceA = reduced ? 0 : Math.max(8, Math.min(18, peakSpeed * 0.08)); }
    layer.classList.toggle("is-grounded", !onWeb() && m !== "falling");
    threadHit.hidden = !onWeb();
    bodyHit.hidden = !(m === "angry" || m === "wallIdle");
    bodyHit.style.cursor = m === "angry" ? CURSOR.handOpen : "default";
    thread.hidden = !onWeb();
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
    if (!onWeb()) return;
    threadHit.style.cursor = CURSOR.scissorsClosed;
    setTimeout(() => (threadHit.style.cursor = CURSOR.scissorsOpen), 350);
    const anchorScreen = pos - window.scrollY + bounceOffset();
    const cutY = Math.max(0, Math.min(anchorScreen - 6, e.clientY));
    cut = { t: 0, top: cutY, low: anchorScreen - cutY };
    fallV = 0; vel = 0; bounceA = 0;
    setMode("falling");
  });
  bodyHit.addEventListener("pointerenter", () => { if (mode === "wallIdle") flee(); });
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

    if (onWeb()) {
      const t = target();
      let d = t - pos;
      if (Math.abs(d) > innerHeight * 1.1) { pos = t - Math.sign(d) * innerHeight * 0.75; vel = 0; d = t - pos; }
      if ((mode === "idle" || mode === "stopping" || mode === "pointing") && Math.abs(d) > CONFIG.moveThreshold) setMode("moving");
      if (mode === "idle" && besideClickable()) setMode("pointing");
      else if (mode === "pointing" && !besideClickable()) setMode("idle");

      if (mode === "moving") {
        const max = firstTrip ? CONFIG.entrySpeed : CONFIG.followSpeed;
        const pulse = reduced ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(clock * 3.2)); // pausinhas no fio
        const desired = Math.max(-max, Math.min(max, d * 2.2)) * pulse;
        vel += (desired - vel) * Math.min(1, dt * 5);
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

    if (mode === "wallWalk") { walkPath(dt); return; }
    if (mode === "wallIdle") {
      const sy = window.scrollY, m = 40;
      if (wy < sy - m || wy > sy + innerHeight + m) enterView();   // sumiu da tela → vem andando
      return;
    }

    gy = floorLine();                                         // o chão pode mudar (redimensionar)
    if (mode === "calm" && timer >= CONFIG.calmTime) setMode("turning");
    if (mode === "walking") {
      gx += CONFIG.runSpeed * dt;
      if (gx - FW * scale * CONFIG.size.andando * 0.5 > viewW) setMode("gone");
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
    if (fromFloor) { wx = viewW + off; wy = sy + innerHeight * rnd(0.4, 0.8); }         // volta pela direita
    else if (wy < sy) wy = Math.max(wy, sy - off);                                       // vem de cima
    else if (wy > sy + innerHeight) wy = Math.min(wy, sy + innerHeight + off);           // vem de baixo
    goTo(tx, ty);
  }

  // mouse em cima: foge para um lado aleatório, sem sair da tela
  function flee() {
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
    if (!p) { setMode("wallIdle"); return; }
    const dx = p.x - wx, dy = p.y - wy, d = Math.hypot(dx, dy);
    const step = CONFIG.wallSpeed * dt;
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

  /* ---------- Quadros ---------- */
  function advance(dt) {
    if (!anim) return;
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
    if (onWeb() || mode === "falling") {
      const off = onWeb() ? bounceOffset() : 0;
      const x = webX(), y = pos - sy + off;
      left = x - ANCHOR.x * scale; top = y - ANCHOR.y * scale;
      thread.style.transform = `translateX(${x}px)`;
      thread.style.height = Math.max(0, y) + "px";
      threadHit.style.transform = `translate(${x - 9}px, 0)`;
      threadHit.style.height = Math.max(0, y - 4) + "px";
      canvas.style.transform = `translate(${left}px, ${top}px) scaleY(${1 + off * 0.004})`;
    } else if (anim && REF[anim]) {
      const wall = mode === "wallWalk" || mode === "wallIdle";
      const k = CONFIG.size[anim] || 1, ref = REF[anim];
      const cx = wall ? wx : gx, cy = (wall ? wy : gy) - sy;
      const squash = wall ? 0 : bounceOffset() * 0.006 + pet * 0.08;
      const r = mode === "wallWalk" ? rot : 0;
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
    if (onWeb() || mode === "falling") canvas.style.transformOrigin = "50% 0";

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

  window.__aranha = () => ({ mode, anim, frame, beside: onWeb() && besideClickable() });

  /* ---------- Início ---------- */
  Promise.all(Object.entries(SHEETS).map(([k, s]) => load(s.src).then((img) => [k, img])))
    .then((pairs) => {
      sheets = Object.fromEntries(pairs);
      measure();
      addEventListener("resize", measure);
      setMode("hidden"); threadHit.hidden = bodyHit.hidden = cutTop.hidden = cutLow.hidden = true;
      setTimeout(() => {
        layer.classList.add("is-on");
        respawn();
        let last = performance.now();
        (function loop(now) {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          update(dt); advance(dt); draw();
          requestAnimationFrame(loop);
        })(last);
      }, delay);
    })
    .catch((e) => console.warn("[aranha] não foi possível carregar os sprites", e));
})();
