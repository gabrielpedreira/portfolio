/* ==========================================================
   CONTEÚDO DO SITE — edite aqui.
   Texto bilíngue: { pt: "...", en: "..." }
   ========================================================== */

/* Disciplinas mostradas no topo */
window.DISCIPLINES = [
  { pt: "Desenvolvimento de software", en: "Software development" },
  { pt: "Jogos", en: "Games" },
  { pt: "Ilustração", en: "Illustration" },
  { pt: "Concept art", en: "Concept art" },
  { pt: "Animação 2D", en: "2D animation" },
  { pt: "Escultura", en: "Sculpture" }
];

/* Stack — "learning: true" mostra o chip tracejado (estudando) */
window.STACK = [
  {
    color: "#e8a55a",
    title: { pt: "Linguagens", en: "Languages" },
    desc: { pt: "O que eu escrevo no dia a dia e nos projetos pessoais.", en: "What I write daily and in personal projects." },
    items: ["Rust", "JavaScript", "PHP", "C#", "SQL / MySQL", "HTML", "CSS", { name: "Python", learning: true }]
  },
  {
    color: "#c58af9",
    title: { pt: "Jogos & gráficos", en: "Games & graphics" },
    desc: { pt: "Renderização, ferramentas de criação e animação para jogos.", en: "Rendering, creative tools and animation for games." },
    items: ["Godot", "Rust + skia-safe", "egui / eframe", "Spritesheets", "Pixel art", { pt: "Animação frame a frame", en: "Frame-by-frame animation" }]
  },
  {
    color: "#7cc4c0",
    title: { pt: "Web & back-end", en: "Web & back-end" },
    desc: { pt: "Sistemas internos, APIs e interfaces web.", en: "Internal systems, APIs and web interfaces." },
    items: ["PHP 8", "MySQL", "JavaScript", "HTML / CSS", "Anthropic API", { name: "React", learning: true }]
  },
  {
    color: "#8fb3ff",
    title: { pt: "Ferramentas", en: "Tools" },
    desc: { pt: "Fluxo de trabalho e versionamento.", en: "Workflow and version control." },
    items: ["Git", "GitHub", "Cargo", "VS Code", "Claude (Anthropic)"]
  },
  {
    color: "#f08a8a",
    title: { pt: "Arte", en: "Art" },
    desc: { pt: "Do rascunho ao personagem animado ou esculpido.", en: "From sketch to animated or sculpted character." },
    items: [
      "Adobe Illustrator", "Blender", "SketchMotion",
      { pt: "Ilustração", en: "Illustration" },
      { pt: "Concept art", en: "Concept art" },
      { pt: "Animação 2D", en: "2D animation" },
      { pt: "Escultura", en: "Sculpture" }
    ]
  }
];

/* Categorias de trabalhos (a ordem define os filtros) — id = nome da pasta em /trabalhos */
window.CATEGORIES = [
  { id: "jogos", bg: "assets/img/fundos/jogos.webp", cover: "assets/works/jogos/infestacao-logo.webp", fit: "contain",
    label: { pt: "Jogos", en: "Games" },
    blurb: { pt: "Jogos autorais: design, arte, personagens e bestiário.", en: "Original games: design, art, characters and bestiary." } },
  { id: "programacao", bg: "assets/img/fundos/inicio_v2.webp", cover: "assets/works/programacao/sketchmotion_editor_thumb.webp",
    label: { pt: "Programas", en: "Software" },
    blurb: { pt: "Ferramentas e sistemas que desenvolvi.", en: "Tools and systems I've built." } },
  { id: "conceptarts", bg: "assets/img/fundos/conceptarts.webp", cover: "assets/works/conceptarts/troll_conceptart_gbdracco_thumb.webp",
    label: { pt: "Concept art", en: "Concept art" },
    blurb: { pt: "Criaturas e personagens do rascunho à cor.", en: "Creatures and characters from sketch to colour." } },
  { id: "esculturas", bg: "assets/img/fundos/esculturas.webp", cover: "assets/works/esculturas/arakne_by_gbdracco2_thumb.webp",
    label: { pt: "Esculturas", en: "Sculptures" },
    blurb: { pt: "Peças originais e fan arts esculpidas.", en: "Original pieces and sculpted fan art." } },
  { id: "animacoes", bg: "assets/img/fundos/animacoes_v2.webp", cover: "assets/works/animacoes/lorena_tiropistola.gif", fit: "contain", pixel: true,
    label: { pt: "Animações", en: "Animations" },
    blurb: { pt: "Animação frame a frame em pixel art.", en: "Frame-by-frame pixel art animation." } },
  { id: "ilustracoes", bg: "assets/img/fundos/ilustracoes.webp", cover: "assets/works/ilustracoes/agonia_by_gbdracco_thumb.webp",
    label: { pt: "Ilustrações digitais", en: "Digital illustrations" },
    blurb: { pt: "Criaturas e horror pintados digitalmente.", en: "Creatures and horror painted digitally." } }
];

/* Trabalhos
   cover:   imagem do card (miniatura)
   images:  imagens em tamanho cheio abertas no lightbox (a 1ª é a principal)
   fit:     "contain" mostra a peça inteira no card (sem cortar)
   pixel:   true = pixel art (sem suavização ao ampliar)
   sprite:  prévia animada de spritesheet { src, frames, fps }
   links:   { code, view, play } — todos opcionais
   status:  { pt, en } — selo no canto
   also:    outras categorias em que o trabalho também aparece (ex.: arte de jogo em "jogos") */
const W = "assets/works/";
const art = (cat, slug) => ({ cover: `${W}${cat}/${slug}_thumb.webp`, images: [`${W}${cat}/${slug}.webp`] });

window.WORKS = [
  /* ---------- Jogos ---------- */
  {
    category: "jogos",
    title: "Infestação",
    status: { pt: "Em produção", en: "In production" },
    desc: {
      pt: "Plataforma 2D em pixel art animado. Em 2026, uma infestação global de insetos parasitas transforma as cidades num cenário de horror de sobrevivência — e dois irmãos, Lorena e Nicolas, precisam combinar força e inteligência para atravessá-lo.",
      en: "2D platformer in animated pixel art. In 2026, a global infestation of parasitic insects turns cities into a survival-horror nightmare — and two siblings, Lorena and Nicolas, must combine strength and wits to make it through."
    },
    tags: ["Godot", "Pixel art", "2D platformer"],
    cover: W + "jogos/infestacao-logo.webp",
    images: [W + "jogos/infestacao-logo.webp"],
    fit: "contain",
    featured: true,
    game: true
  },
  {
    category: "jogos",
    title: { pt: "Personagens — Infestação", en: "Characters — Infestação" },
    desc: {
      pt: "Almanaque do jogo: os protagonistas, os estágios da infestação e o bestiário de criaturas. Clique para ler as 4 páginas.",
      en: "The game's almanac: the protagonists, the stages of the infestation and the creature bestiary. Click to read all 4 pages."
    },
    tags: ["Character design", "Pixel art"],
    cover: W + "jogos/personagens_thumb.webp",
    images: [1, 2, 3, 4].map((n) => `${W}jogos/almanaque_${n}.webp`),
    details: [
      { label: { pt: "Protagonistas", en: "Protagonists" }, items: [
        { pt: "Lorena — policial novata, combate corpo a corpo e mecânica de veículos", en: "Lorena — rookie cop, melee combat and vehicle mechanics" },
        { pt: "Nicolas — cientista químico, enigmas, sistemas e armas improvisadas", en: "Nicolas — chemist, puzzles, systems and improvised weapons" }
      ] },
      { label: { pt: "Inimigos", en: "Enemies" }, items: ["Zumbi", "Controlador", "Mutante", "Fulminante", "Caçador", "Chomper", "Zangão", "Fertilizador"] }
    ]
  },

  /* ---------- Programação ---------- */
  {
    category: "programacao",
    title: "SketchMotion",
    status: { pt: "Em desenvolvimento", en: "In development" },
    desc: {
      pt: "O SketchMotion é um programa de desenho e animação 2D para computador (Windows), feito em Rust. Ele junta num lugar só o que você encontraria espalhado entre Aseprite, Krita e Illustrator. Funciona tanto para ilustração livre quanto para pixel art e é pensado para uso com mesa digitalizadora, com o menu de roda no botão da caneta.\nPara desenhar, ele tem lápis e pincel com vários tipos de ponta, borracha, balde, conta-gotas, formas, caneta vetorial e texto. O trabalho fica em camadas, que você pode ocultar, bloquear e ajustar a opacidade. Dá para selecionar por retângulo, laço ou varinha mágica e depois mover, girar, escalar, espelhar, copiar e colar. Também é possível guardar peças prontas numa biblioteca de objetos para reutilizar.\nNa parte de animação, você trabalha quadro a quadro em várias timelines, com onion skin, reprodução e controle de FPS. Há uma câmera com keyframes para fazer o enquadramento, esqueletos (rig) com ossos para montar personagens articulados, e pivôs e vetores de direção para animar peças entre frames. Existe ainda a ferramenta “aplicar mudanças em”, que copia para os outros frames só o que foi editado num frame.\nOs projetos são salvos num formato próprio (.sketchmotion), que guarda camadas, frames, rig e câmera. A exportação sai em PNG, JPEG, GIF, MP4, sequência de PNG ou sprite sheet. O programa também converte imagens em vetores, tem réguas e guias, permite redimensionar o papel por qualquer borda, tem desfazer e refazer e abre com um clique pelo atalho, que já recompila a versão mais recente.\n==Todas as animações deste site e dos jogos que desenvolvi foram feitas nele.==",
      en: "SketchMotion is a 2D drawing and animation program for the computer (Windows), written in Rust. It brings together in one place what you would otherwise find spread across Aseprite, Krita and Illustrator. It works for free illustration as well as pixel art and is designed for use with a drawing tablet, with a radial menu on the pen button.\nFor drawing, it has pencil and brush with several tip types, eraser, bucket, eyedropper, shapes, vector pen and text. Work is organised in layers, which you can hide, lock and adjust in opacity. You can select by rectangle, lasso or magic wand and then move, rotate, scale, flip, copy and paste. Finished pieces can also be stored in an object library for reuse.\nFor animation, you work frame by frame across multiple timelines, with onion skin, playback and FPS control. There is a camera with keyframes for framing shots, skeletons (rigs) with bones to build articulated characters, and pivots and direction vectors to animate pieces between frames. There is also the “apply changes to” tool, which copies only what was edited in one frame to the others.\nProjects are saved in a native format (.sketchmotion) that stores layers, frames, rig and camera. Export options are PNG, JPEG, GIF, MP4, PNG sequence or sprite sheet. The program also converts images into vectors, has rulers and guides, lets you resize the canvas from any edge, has undo and redo, and opens with one click from its shortcut, which already recompiles the latest version.\n==Every animation on this site and in the games I've developed was made with it.=="
    },
    tags: ["Rust", "skia-safe", "egui"],
    cover: W + "programacao/sketchmotion_editor_thumb.webp",
    images: [W + "programacao/sketchmotion_editor.webp", W + "programacao/sketchmotion_inicio.webp"],
    links: { code: "https://github.com/gabrielpedreira/sketchmotion" }
  },
  {
    category: "programacao",
    title: "PatAsset",
    status: { pt: "Em produção", en: "In production" },
    desc: {
      pt: "PatAsset é um sistema web de gestão patrimonial para instituições com várias unidades. Ele centraliza o cadastro dos bens (marca, modelo, número de série, tags, localização, nota fiscal, valores e depreciação) e os classifica automaticamente por grupo, classe e subgrupo.\nA equipe trabalha numa planilha de controle editável, parecida com o Excel, com filtros por coluna e cores que indicam o status de cada item (baixado, conciliado, não localizado, movimentado). O sistema registra as movimentações entre unidades e setores com histórico e termo impresso.\nTambém conduz rotinas de inspeção por local, com geração de termo de responsabilidade e histórico de cada conferência, e audita os itens não localizados. O fluxo de baixa vai da pré-baixa ao descarte definitivo com protocolo, e a conciliação contábil vincula as notas fiscais aos itens.\nCompletam o sistema relatórios, dashboards por unidade e notificações por e-mail aos responsáveis.",
      en: "PatAsset is a web-based asset management system for organisations with multiple sites. It centralises the asset register (brand, model, serial number, tags, location, invoice, values and depreciation) and automatically classifies each item by group, class and subgroup.\nThe team works in an editable control spreadsheet, similar to Excel, with per-column filters and colours that show each item's status (written off, reconciled, not found, transferred). The system records transfers between sites and departments, with history and a printed transfer form.\nIt also runs location-based inspection routines, generating responsibility forms and a history of each check, and audits items that were not found. The write-off flow goes from pre-write-off to final disposal with a protocol, and accounting reconciliation links invoices to items.\nReports, per-site dashboards and email notifications to the people in charge round out the system."
    },
    tags: ["PHP", "MySQL", "JavaScript"],
    cover: W + "programacao/patasset_thumb.webp",
    images: [W + "programacao/patasset.webp"]
  },
  {
    category: "programacao",
    title: "LifeTech",
    status: { pt: "Em produção", en: "In production" },
    desc: {
      pt: "LifeTech é o sistema de engenharia clínica que trabalha integrado ao PatAsset, no mesmo banco de dados, e cuida do ciclo de manutenção dos equipamentos.\nQualquer pessoa pode abrir um chamado por QR Code, sem login. A equipe transforma o chamado numa ordem de serviço e registra nela os técnicos e as intervenções, as peças usadas (com baixa automática do estoque), a manutenção externa com orçamento e as pendências, como falta de peças. No encerramento, gera o documento da OS e agenda as manutenções preventivas.\nO sistema também controla o estoque de peças, o catálogo, os fornecedores e os técnicos, e define a prioridade dos chamados pela criticidade de cada equipamento. Quando o equipamento sai para conserto, o patrimônio é movimentado automaticamente.\nQuem abriu o chamado recebe um e-mail a cada etapa, até a conclusão.",
      en: "LifeTech is the clinical engineering system that works alongside PatAsset, on the same database, and handles the maintenance cycle of medical equipment.\nAnyone can open a ticket via QR code, without logging in. The team turns the ticket into a work order and records the technicians and interventions, the parts used (with automatic stock deduction), external repairs with quotes, and pending issues such as missing parts. On closing, it generates the work order document and schedules preventive maintenance.\nThe system also manages the parts inventory, catalogue, suppliers and technicians, and sets ticket priority by each device's criticality. When equipment goes out for repair, the asset is transferred automatically.\nWhoever opened the ticket gets an email at every stage until completion."
    },
    tags: ["PHP", "MySQL", "JavaScript"],
    cover: W + "programacao/lifetech_thumb.webp",
    images: [W + "programacao/lifetech.webp"]
  },

  /* ---------- Animações ---------- */
  {
    category: "animacoes",
    title: { pt: "Lorena — Infestação", en: "Lorena — Infestação" },
    also: ["jogos"], // aparece também dentro de Jogos
    desc: {
      pt: "Protagonista do meu jogo animada em pixel art: parada, tiro, recarga e pistola descarregada.",
      en: "My game's protagonist animated in pixel art: idle, shooting, reloading and empty pistol."
    },
    tags: ["Pixel art", "Godot"],
    cover: W + "animacoes/lorena_tiropistola.gif",
    images: ["lorena_idle", "lorena_tiropistola", "lorena_recarga", "lorena_pistoladescarregada"].map((n) => `${W}animacoes/${n}.gif`),
    fit: "contain", pixel: true
  },
  {
    category: "animacoes",
    title: { pt: "Zumbi — Infestação", en: "Zombie — Infestação" },
    also: ["jogos"], // aparece também dentro de Jogos
    desc: {
      pt: "Inimigo do jogo animado em pixel art: ciclo parado e morte.",
      en: "Game enemy animated in pixel art: idle cycle and death."
    },
    tags: ["Pixel art", "Godot"],
    cover: W + "animacoes/zumbi_idle.gif",
    images: [W + "animacoes/zumbi_idle.gif", W + "animacoes/zumbi_morte_2.gif"],
    fit: "contain", pixel: true
  },

  {
    category: "animacoes",
    title: { pt: "Dino Crisis — fan art", en: "Dino Crisis — fan art" },
    desc: {
      pt: "Animações em pixel art em homenagem a Dino Crisis: Regina disparando uma AR-15 no automático e um raptor em ciclo parado.",
      en: "Pixel art animations as a tribute to Dino Crisis: Regina firing an AR-15 on full auto and a raptor idle cycle."
    },
    tags: ["Pixel art", "Fan art"],
    cover: W + "animacoes/regina_tiro_ar15.gif",
    images: [W + "animacoes/regina_tiro_ar15.gif", W + "animacoes/raptor_idle.gif"],
    fit: "contain", pixel: true
  },

  /* ---------- Concept art ---------- */
  { category: "conceptarts", title: "Troll", ...art("conceptarts", "troll_conceptart_gbdracco"), fit: "contain",
    desc: {
      pt: "Conceito incompleto de uma criatura que vive nas florestas e caça seres humanos e outros animais para se alimentar. Possui baixo intelecto e utiliza ferramentas e apetrechos rudimentares para caçar, transportar e preparar suas vítimas.\nEste exemplar, em especial, nasceu com uma deformidade: um gêmeo siamês que se projeta de sua barriga. Essa segunda criatura possui um intelecto ainda mais limitado, mas mantém instintos básicos, como emitir grunhidos e se alimentar.",
      en: "An unfinished concept of a creature that lives in the forests and hunts humans and other animals for food. It has low intelligence and uses crude tools and gear to hunt, carry and prepare its victims.\nThis particular specimen was born with a deformity: a conjoined twin protruding from its belly. This second creature is even less intelligent, but keeps basic instincts such as grunting and feeding."
    } },
  { category: "conceptarts", title: { pt: "Inspirado em Silent Hill", en: "Silent Hill inspired" }, ...art("conceptarts", "silenthill_inspired_gbdracco"), fit: "contain",
    desc: {
      pt: "Criatura baseada nos designs dos monstros da série de jogos Silent Hill. A franquia utiliza com frequência criaturas sem rosto, corpos deformados, pele retorcida e anatomias desajeitadas, criando uma espécie de agonia visual e desconforto no observador.\nTentei trazer parte dessa sensação para esta criação, explorando uma anatomia incomum e uma aparência que provoca estranheza mais do que simplesmente representar um monstro tradicional.\nEssa criatura não possui um nome. Mas o que você sente quando olha para ela?",
      en: "A creature based on the monster designs of the Silent Hill game series. The franchise often uses faceless creatures, deformed bodies, twisted skin and awkward anatomy, creating a kind of visual agony and discomfort in the viewer.\nI tried to bring some of that feeling into this piece, exploring an unusual anatomy and an appearance that feels unsettling rather than simply depicting a traditional monster.\nThis creature has no name. But what do you feel when you look at it?"
    } },
  { category: "conceptarts", title: { pt: "Netuno", en: "Neptune" }, ...art("conceptarts", "neptune_by_gbdracco"), fit: "contain",
    desc: {
      pt: "Netuno é um conceito criado com a intenção de quebrar o padrão visual em que o deus dos mares costuma ser representado com uma forma predominantemente humana — rosto, cabelos, barba e anatomia humana.\nEmbora eu ainda tenha seguido algumas linhas antropomórficas neste conceito, tentei trazer para o personagem características mais adaptadas ao ambiente marinho, como tentáculos de polvo, uma cabeça semelhante à de um peixe e um bigode inspirado no bagre.\nA proposta foi imaginar como seria representar uma divindade dos mares caso sua aparência realmente refletisse a natureza do ambiente que ela representa.",
      en: "Neptune is a concept meant to break the usual visual pattern in which the god of the seas is portrayed in a mostly human form — human face, hair, beard and anatomy.\nAlthough I still followed some anthropomorphic lines, I gave the character traits better adapted to the marine environment, such as octopus tentacles, a fish-like head and a catfish-inspired moustache.\nThe idea was to imagine a sea deity whose appearance truly reflected the nature of the environment it represents."
    } },
  { category: "conceptarts", title: { pt: "Monstro draconiano", en: "Draconian monster" }, ...art("conceptarts", "monstro_gbdracco"), fit: "contain",
    desc: {
      pt: "Conceito de uma raça de criaturas reptilianas, escamosas e conscientes. Seus corpos apresentam características semelhantes às de lagartos, com diferentes formatos de chifres, pele espessa e escamosa e diversas variações anatômicas.\nA ideia é que não sejam necessariamente criaturas hostis. Podem existir como mercadores, açougueiros, negociadores ou outros membros comuns de uma sociedade.\nÉ fácil imaginar um desses personagens trabalhando em uma feira medieval de um mundo de fantasia.",
      en: "Concept for a race of reptilian, scaly, sentient creatures. Their bodies have lizard-like traits, with different horn shapes, thick scaly skin and many anatomical variations.\nThey are not necessarily hostile. They could be merchants, butchers, traders or other ordinary members of a society.\nIt's easy to picture one of these characters working at a medieval market in a fantasy world."
    } },
  { category: "conceptarts", title: "Aracne", ...art("conceptarts", "aracne_conceptart_gbdracco"), fit: "contain",
    desc: {
      pt: "Criatura assustadora que vive reclusa em uma caverna próxima a um vilarejo. Sua existência pode estar relacionada ao desaparecimento de diversos homens da região.\nDizem que ela possui um canto encantador e hipnotizante, capaz de atrair viajantes que passam pelas proximidades. Quando encontra uma vítima desprevenida, Aracne a ataca e utiliza seu veneno para liquefazer os tecidos internos do corpo. Em seguida, alimenta-se da vítima, deixando para trás apenas a pele e os ossos — como uma roupa de pele abandonada.\nSegundo a lenda, Aracne um dia foi uma bela mulher. Após o marido de uma deusa se encantar por sua beleza, a deusa, tomada pelo ciúme, amaldiçoou Aracne para que nenhum outro homem jamais pudesse considerá-la bela novamente.\nSeu corpo foi transformado em uma forma grotesca, tornando-se justamente aquilo que a maldição determinava: uma criatura incapaz de ser vista como bela novamente.",
      en: "A frightening creature that lives secluded in a cave near a village. Its existence may be linked to the disappearance of several men in the region.\nThey say it has an enchanting, hypnotic song that lures travellers passing nearby. When it finds an unsuspecting victim, Aracne attacks and uses its venom to liquefy the body's internal tissues. It then feeds, leaving behind only skin and bones — like a discarded suit of skin.\nLegend says Aracne was once a beautiful woman. When a goddess's husband became enchanted by her beauty, the jealous goddess cursed Aracne so that no man would ever find her beautiful again.\nHer body was turned into a grotesque form, becoming exactly what the curse decreed: a creature that could never again be seen as beautiful."
    } },
  { category: "conceptarts", title: { pt: "O Monstro", en: "The Monster" }, ...art("conceptarts", "creature_conceptart_gbdracco"), fit: "contain",
    desc: {
      pt: "O Monstro é aquele conceito clássico que nos faz pensar: “O que habita naquele lugar escuro que causa arrepios?”\nÉ a materialização da ideia de que talvez exista realmente algo escondido na escuridão — algo que surge quando fechamos os olhos ou quando deixamos de enxergar o que está ao nosso redor.\nA proposta é trabalhar com o medo do desconhecido e com aquela sensação infantil e primitiva de que existe algo à espreita no escuro.",
      en: "The Monster is that classic concept that makes us wonder: “What lives in that dark place that gives us chills?”\nIt is the embodiment of the idea that maybe something really is hiding in the dark — something that appears when we close our eyes or stop seeing what is around us.\nThe goal is to play with the fear of the unknown and that primal, childlike feeling that something is lurking in the dark."
    } },
  { category: "conceptarts", title: "Desmotes", ...art("conceptarts", "monstro_conceptart_gbdracco"), fit: "contain",
    desc: {
      pt: "Monstro com design também inspirado em Silent Hill. Desmotes representa a incapacidade, a impotência e o aprisionamento.\nÉ uma criatura que parece ter dificuldade até mesmo para perseguir suas vítimas ou realizar ataques. Seu próprio corpo transmite a sensação de limitação e sofrimento.\nÉ alto, esguio e produz sons semelhantes a murmúrios abafados e sofridos. O som de sua bola de ferro arrastando pelo chão, acompanhado pelo ruído das correntes, pode denunciar sua presença antes mesmo que a criatura seja vista.",
      en: "A monster whose design is also inspired by Silent Hill. Desmotes represents incapacity, powerlessness and imprisonment.\nIt seems to struggle even to chase its victims or attack. Its very body conveys limitation and suffering.\nIt is tall and gaunt and makes sounds like muffled, pained murmurs. The sound of its iron ball dragging across the floor, along with the rattle of chains, can give away its presence before the creature is even seen."
    } },

  /* ---------- Ilustrações digitais ---------- */
  { category: "ilustracoes", title: "Agonia", ...art("ilustracoes", "agonia_by_gbdracco"), fit: "contain",
    desc: {
      pt: "Arte conceitual de criatura inspirada na franquia Silent Hill — ilustração digital.\nA proposta foi desenvolver uma criatura de anatomia disforme e postura contorcida, capaz de transmitir desconforto, agonia e sofrimento.\nSeus braços fundidos ao próprio corpo reforçam a sensação de aprisionamento físico, enquanto o rosto encoberto por uma camada de pele sugere a existência de algo sufocado em seu interior — uma presença incapaz de respirar ou enxergar, aprisionada pela própria carne.\nA ideia é explorar o horror não apenas por meio da aparência grotesca da criatura, mas também pela sensação de claustrofobia e impotência que sua forma evoca.",
      en: "Creature concept art inspired by the Silent Hill franchise — digital illustration.\nThe goal was to design a creature with a misshapen anatomy and a twisted posture, able to convey discomfort, agony and suffering.\nIts arms fused to its own body reinforce the feeling of physical imprisonment, while the face covered by a layer of skin suggests something smothered inside — a presence unable to breathe or see, trapped by its own flesh.\nThe idea is to explore horror not only through the creature's grotesque appearance, but also through the claustrophobia and helplessness its form evokes."
    } },
  { category: "ilustracoes", title: { pt: "Fada de Darkwood", en: "Darkwood Fairy" }, ...art("ilustracoes", "fada_de_darkwood_by_gbdracco"), fit: "contain",
    desc: {
      pt: "Fada insectoide — design de criatura.\nDesign inspirado na anatomia de uma vespa, combinando traços femininos com características físicas e comportamentais de insetos.\nA proposta é explorar a fusão entre o delicado e o ameaçador, criando uma criatura que transita entre o fantástico e o natural, com uma identidade visual que une a figura feminina à natureza predatória dos insetos.",
      en: "Insectoid fairy — creature design.\nA design inspired by the anatomy of a wasp, combining feminine traits with the physical and behavioural features of insects.\nThe goal is to explore the fusion of the delicate and the threatening, creating a creature that moves between the fantastic and the natural, with a visual identity that joins the female figure to the predatory nature of insects."
    } },
  { category: "ilustracoes", title: { pt: "Hecatônquiros", en: "Hecatoncheires" }, ...art("ilustracoes", "hecatonquiros_by_gbdracco"), fit: "contain",
    desc: {
      pt: "Hecatônquiros — conceito de criatura e horror biológico.\nA ideia surgiu ao imaginar um vírus capaz de transformar seres humanos em zumbis, mas com uma particularidade que o diferencia das infecções tradicionais.\nAo infectar uma vítima, o zumbi passa a mordê-la e a transmitir-lhe o vírus. No entanto, mesmo após a transformação, ele não abandona o corpo infectado. Em vez disso, permanece agarrado a ele, como se ambos estivessem presos por um instinto incontrolável.\nA principal característica desse vírus é sua capacidade de amolecer os tecidos dos corpos infectados, especialmente a pele, permitindo que eles se fundam progressivamente. Com o passar do tempo, os limites entre os indivíduos desaparecem, dando origem a uma única massa orgânica composta por múltiplos corpos. Quanto mais tempo a infecção avança, mais complexa e disforme se torna essa estrutura.\nO nome ==Hecatônquiros== faz referência aos hecatônquiros da mitologia grega, gigantes conhecidos por possuírem cem braços e cinquenta cabeças. Assim como essas entidades mitológicas, a criatura representa a convergência de múltiplos corpos em uma única existência monstruosa.",
      en: "Hecatoncheires — creature concept and body horror.\nThe idea came from imagining a virus that turns humans into zombies, but with a twist that sets it apart from traditional infections.\nWhen it infects a victim, the zombie bites it and passes on the virus. Yet even after the transformation, it does not let go of the infected body. Instead, it stays clinging to it, as if both were bound by an uncontrollable instinct.\nThe virus's main trait is its ability to soften the tissues of infected bodies, especially the skin, letting them gradually fuse together. Over time, the boundaries between individuals disappear, giving rise to a single organic mass made of many bodies. The longer the infection runs, the more complex and misshapen this structure becomes.\nThe name ==Hecatoncheires== refers to the hecatoncheires of Greek mythology, giants known for having a hundred arms and fifty heads. Like those mythological beings, the creature represents many bodies converging into a single monstrous existence."
    } },

  /* ---------- Esculturas ---------- */
  { category: "esculturas", title: "Arakne",
    cover: W + "esculturas/arakne_by_gbdracco2_thumb.webp",
    images: ["arakne_by_gbdracco2", "arakne_original_by_gbdracco2", "arakne_original2_by_gbdracco2"].map((n) => `${W}esculturas/${n}.webp`),
    desc: {
      pt: "Personagem autoral que criei alguns anos atrás. Sua primeira versão foi modelada em plastilina.\nA ideia era mesclar a beleza tradicionalmente associada ao corpo feminino com uma forma que, para muitas pessoas, é considerada assustadora: a anatomia de uma aranha.\nEssa criação serviu como uma das bases para meu desenvolvimento na criação de criaturas, principalmente na exploração da mistura entre formas que, à primeira vista, parecem incompatíveis.\nCom um olhar mais atento e um pouco de criatividade, essas formas podem se complementar e criar uma anatomia que transmite simultaneamente beleza e estranheza.",
      en: "An original character I created a few years ago. Its first version was modelled in plasticine.\nThe idea was to blend the beauty traditionally associated with the female body with a form many people find frightening: the anatomy of a spider.\nThis piece became one of the foundations of my creature design work, especially in exploring the mix of forms that at first seem incompatible.\nWith a closer look and a bit of creativity, these forms can complement each other and create an anatomy that conveys beauty and strangeness at the same time."
    } },
  { category: "esculturas", title: { pt: "Xenomorfo — fan art", en: "Xenomorph — fan art" }, ...art("esculturas", "xenomorph_by_gbdracco2"),
    desc: {
      pt: "Escultura em plastilina inspirada no Xenomorfo da franquia Alien.\nA ideia surgiu da combinação entre formas femininas e sensuais e uma figura alienígena grotesca. Essa relação entre sensualidade e estranheza já pode ser observada em conceitos e referências utilizados na concepção do Xenomorfo, e chegou a ser explorada como possibilidade visual para a criatura.\nNesta escultura, decidi representar uma interpretação própria baseada em uma das artes conceituais originais, utilizando minha própria abordagem para traduzir aquele design para a escultura física.",
      en: "A plasticine sculpture inspired by the Xenomorph from the Alien franchise.\nThe idea came from combining feminine, sensual forms with a grotesque alien figure. That relationship between sensuality and strangeness can already be seen in the concepts and references used to create the Xenomorph, and was even explored as a visual possibility for the creature.\nIn this sculpture I made my own interpretation based on one of the original concept artworks, using my own approach to translate that design into a physical sculpture."
    } },
  { category: "esculturas", title: { pt: "Majin Boo — fan art", en: "Majin Buu — fan art" }, ...art("esculturas", "majinboo_by_gbdracco2"), fit: "contain",
    desc: {
      pt: "Personagem da série Dragon Ball, modelado em Oil Clay Hard.\nA peça foi desenvolvida como um exercício de escultura, buscando reproduzir as características marcantes do personagem e adaptar seu design bidimensional para uma forma tridimensional.",
      en: "A character from the Dragon Ball series, modelled in hard oil clay.\nThe piece was a sculpting exercise, aiming to reproduce the character's striking features and adapt his two-dimensional design into a three-dimensional form."
    } },
  { category: "esculturas", title: { pt: "Centauro (esboço)", en: "Centaur (sketch)" }, ...art("esculturas", "centauro_sketch_gbdracco"), fit: "contain",
    desc: { pt: "Esboço escultórico de centauro com lança, estudo de anatomia e movimento.", en: "Sculpted centaur sketch with a spear — anatomy and motion study." } },
  { category: "esculturas", title: { pt: "Zumbi", en: "Zombie" }, ...art("esculturas", "zombie_by_gbdracco2"), fit: "contain",
    desc: { pt: "Estudo de cabeça em decomposição, com detalhes de textura em close.", en: "Decaying head study, with close-up texture details." } }
];

/* Links / referências — url: null deixa o card como "em breve" */
window.LINKS = [
  { id: "github",     name: "GitHub",     handle: "@gabrielpedreira",    url: "https://github.com/gabrielpedreira" },
  { id: "linkedin",   name: "LinkedIn",   handle: "in/gabriel-pedreira", url: "https://www.linkedin.com/in/gabriel-pedreira" },
  { id: "artstation", name: "ArtStation", handle: "gabriel_dracco",      url: "https://gabriel_dracco.artstation.com/" },
  { id: "whatsapp",   name: "WhatsApp",   handle: "(21) 97157-7527",
    url: "https://wa.me/5521971577527?text=" + encodeURIComponent("Olá, Gabriel! Vi seu portfólio e gostaria de conversar.") },
  { id: "email",      name: "E-mail",     handle: "gabrielpedreira.programador@gmail.com",
    url: "mailto:gabrielpedreira.programador@gmail.com", copy: "gabrielpedreira.programador@gmail.com" }
];
