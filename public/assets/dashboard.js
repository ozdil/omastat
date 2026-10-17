const themeCatalog = [{"id": "ankara", "name": "Ankara", "accent": "#f5b700", "background": "#080b12", "surface": "#24283b", "foreground": "#e2e8f0", "mode": "dark"}, {"id": "catppuccin", "name": "Catppuccin", "accent": "#89b4fa", "background": "#1e1e2e", "surface": "#313244", "foreground": "#cdd6f4", "mode": "dark"}, {"id": "catppuccin-latte", "name": "Catppuccin Latte", "accent": "#1e66f5", "background": "#eff1f5", "surface": "#dce0e8", "foreground": "#4c4f69", "mode": "light"}, {"id": "ethereal", "name": "Ethereal", "accent": "#7d82d9", "background": "#060B1E", "surface": "#131a3a", "foreground": "#ffcead", "mode": "dark"}, {"id": "everforest", "name": "Everforest", "accent": "#7fbbb3", "background": "#2d353b", "surface": "#343f44", "foreground": "#d3c6aa", "mode": "dark"}, {"id": "flexoki-light", "name": "Flexoki Light", "accent": "#205EA6", "background": "#FFFCF0", "surface": "#E6E4D9", "foreground": "#100F0F", "mode": "light"}, {"id": "gruvbox", "name": "Gruvbox", "accent": "#7daea3", "background": "#282828", "surface": "#3c3836", "foreground": "#d4be98", "mode": "dark"}, {"id": "hackerman", "name": "Hackerman", "accent": "#82FB9C", "background": "#0B0C16", "surface": "#151828", "foreground": "#ddf7ff", "mode": "dark"}, {"id": "istanbul", "name": "Istanbul", "accent": "#00cbb8", "background": "#070a0e", "surface": "#24283b", "foreground": "#dbe4ee", "mode": "dark"}, {"id": "kanagawa", "name": "Kanagawa", "accent": "#dcd7ba", "background": "#1f1f28", "surface": "#223249", "foreground": "#dcd7ba", "mode": "dark"}, {"id": "last-horizon", "name": "Last Horizon", "accent": "#b59790", "background": "#0c0b0c", "surface": "#0c0b0c", "foreground": "#FAFCFB", "mode": "dark"}, {"id": "lumon", "name": "Lumon", "accent": "#8bc9eb", "background": "#16242d", "surface": "#1b2d40", "foreground": "#d6e2ee", "mode": "dark"}, {"id": "lupine", "name": "Lupine", "accent": "#3264eb", "background": "#fafafa", "surface": "#f5f5f5", "foreground": "#212121", "mode": "light"}, {"id": "matte-black", "name": "Matte Black", "accent": "#e68e0d", "background": "#121212", "surface": "#1e1e1e", "foreground": "#bebebe", "mode": "dark"}, {"id": "miasma", "name": "Miasma", "accent": "#78824b", "background": "#222222", "surface": "#2c2c2c", "foreground": "#c2c2b0", "mode": "dark"}, {"id": "nord", "name": "Nord", "accent": "#81a1c1", "background": "#2e3440", "surface": "#3b4252", "foreground": "#d8dee9", "mode": "dark"}, {"id": "osaka-jade", "name": "Osaka Jade", "accent": "#509475", "background": "#111c18", "surface": "#23372B", "foreground": "#C1C497", "mode": "dark"}, {"id": "retro-82", "name": "Retro 82", "accent": "#faa968", "background": "#05182e", "surface": "#0a2540", "foreground": "#f6dcac", "mode": "dark"}, {"id": "ristretto", "name": "Ristretto", "accent": "#f38d70", "background": "#2c2525", "surface": "#3d2f2a", "foreground": "#e6d9db", "mode": "dark"}, {"id": "rose-pine", "name": "Rose Pine", "accent": "#56949f", "background": "#faf4ed", "surface": "#f2e9e1", "foreground": "#575279", "mode": "light"}, {"id": "solitude", "name": "Solitude", "accent": "#798186", "background": "#101315", "surface": "#101315", "foreground": "#cacccc", "mode": "dark"}, {"id": "steammachine", "name": "Steammachine", "accent": "#66c0f4", "background": "#090d16", "surface": "#24283b", "foreground": "#c7d5e0", "mode": "dark"}, {"id": "tokyo-night", "name": "Tokyo Night", "accent": "#7aa2f7", "background": "#1a1b26", "surface": "#24283b", "foreground": "#a9b1d6", "mode": "dark"}, {"id": "turkiye", "name": "Turkiye", "accent": "#e63946", "background": "#070a10", "surface": "#24283b", "foreground": "#e5ecf4", "mode": "dark"}, {"id": "vantablack", "name": "Vantablack", "accent": "#8d8d8d", "background": "#000000", "surface": "#1a1a1a", "foreground": "#ffffff", "mode": "dark"}, {"id": "white", "name": "White", "accent": "#6e6e6e", "background": "#ffffff", "surface": "#c0c0c0", "foreground": "#000000", "mode": "light"}];

// --- Audio Synthesizer ---
let soundActive = false;
let audioContext = null;

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
  soundActive = true;
}

function playNote(freq, type = "sine", duration = 0.08, volume = 0.12) {
  if (!soundActive || !audioContext) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch(e) {}
}

function playClick() { playNote(480, "triangle", 0.04, 0.08); }
function playChime() {
  if (!soundActive) return;
  playNote(523.25, "triangle", 0.06);
  setTimeout(() => playNote(659.25, "triangle", 0.08), 50);
  setTimeout(() => playNote(783.99, "triangle", 0.12), 100);
}
function playRoastFx() {
  if (!soundActive) return;
  playNote(300, "sawtooth", 0.07, 0.1);
  setTimeout(() => playNote(450, "square", 0.09, 0.12), 50);
  setTimeout(() => playNote(600, "triangle", 0.14, 0.14), 110);
}

// --- Live Synthwave Radio & Audio Engine ---
const radioStations = [
  { id: "nightride", name: "Nightride FM", url: "https://stream.nightride.fm/nightride.mp3", desc: "Synthwave / Outrun • 320k" },
  { id: "chillsynth", name: "Chillsynth FM", url: "https://stream.nightride.fm/chillsynth.mp3", desc: "Chillwave / Lo-Fi • 320k" },
  { id: "datawave", name: "Datawave FM", url: "https://stream.nightride.fm/datawave.mp3", desc: "Cyberpunk / IDM • 320k" },
  { id: "darksynth", name: "Darksynth FM", url: "https://stream.nightride.fm/darksynth.mp3", desc: "Dark Synthwave • 320k" },
  { id: "plaza", name: "Nightwave Plaza", url: "https://radio.plaza.one/mp3", desc: "Vaporwave / City Pop • 128k" }
];

let currentStationIndex = 0;
let radioPlaying = false;
let radioAudio = null;

function initRadio() {
  if (!radioAudio) {
    radioAudio = new Audio();
    // Do NOT set crossOrigin="anonymous" on live icecast streams to avoid CORS/redirect block
    const volInput = document.getElementById("radioVolume");
    radioAudio.volume = volInput ? parseFloat(volInput.value || "0.75") : 0.75;
    radioAudio.preload = "none";

    radioAudio.addEventListener("waiting", () => {
      document.getElementById("radioStationLabel").textContent = "BUFFERING";
    });

    radioAudio.addEventListener("playing", () => {
      radioPlaying = true;
      soundActive = true;
      document.getElementById("radioPlayBtn").classList.remove("sound-muted");
      document.getElementById("radioPlayIcon").textContent = "󰏤";
      document.getElementById("radioStationLabel").textContent = "LIVE";
    });

    radioAudio.addEventListener("pause", () => {
      radioPlaying = false;
      document.getElementById("radioPlayBtn").classList.add("sound-muted");
      document.getElementById("radioPlayIcon").textContent = "󰐊";
      document.getElementById("radioStationLabel").textContent = "SYNTHWAVE";
    });

    radioAudio.addEventListener("error", (e) => {
      console.warn("Radio stream error:", e);
      radioPlaying = false;
      document.getElementById("radioPlayBtn").classList.add("sound-muted");
      document.getElementById("radioPlayIcon").textContent = "󰐊";
      document.getElementById("radioStationLabel").textContent = "RETRY";
    });
  }
}

function playStation(index) {
  ensureAudio();
  initRadio();
  currentStationIndex = index;
  const st = radioStations[index];
  document.getElementById("radioStationLabel").textContent = "CONNECTING";
  radioAudio.src = st.url;
  radioAudio.load();
  const p = radioAudio.play();
  if (p !== undefined) {
    p.catch(e => {
      console.warn("Radio play prevented:", e);
      document.getElementById("radioStationLabel").textContent = "RETRY";
    });
  }
  document.getElementById("currentStationName").textContent = st.name;

  document.querySelectorAll("#stationMenu .menu-item").forEach((item, idx) => {
    if (idx === index) item.classList.add("active");
    else item.classList.remove("active");
  });
}

function toggleRadio() {
  ensureAudio();
  initRadio();
  if (radioAudio && !radioAudio.paused) {
    radioAudio.pause();
  } else {
    if (!radioAudio.src || radioAudio.src === "" || radioAudio.src === window.location.href) {
      playStation(currentStationIndex);
    } else {
      document.getElementById("radioStationLabel").textContent = "CONNECTING";
      const p = radioAudio.play();
      if (p !== undefined) {
        p.catch(e => {
          console.warn("Play error:", e);
          playStation(currentStationIndex);
        });
      }
    }
  }
}

document.getElementById("radioPlayBtn").addEventListener("click", () => {
  toggleRadio();
  playClick();
});

const stationPickerBtn = document.getElementById("stationPickerBtn");
const stationMenu = document.getElementById("stationMenu");
stationPickerBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  stationMenu.classList.toggle("show");
  document.getElementById("langMenu").classList.remove("show");
  playClick();
});

document.querySelectorAll("#stationMenu .menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const idx = parseInt(item.getAttribute("data-index"), 10);
    playStation(idx);
    stationMenu.classList.remove("show");
    playChime();
  });
});

const volumeSlider = document.getElementById("radioVolume");
const volumeIcon = document.getElementById("volumeIcon");
volumeSlider.addEventListener("input", (e) => {
  const vol = parseFloat(e.target.value);
  initRadio();
  radioAudio.volume = vol;
  if (vol === 0) volumeIcon.textContent = "󰖁";
  else if (vol < 0.5) volumeIcon.textContent = "󰕿";
  else volumeIcon.textContent = "󰕾";
});

// --- Multi-Language Support (i18n) ---
const i18n = {
  tr: {
    badge: "TR",
    tickerTitle: "CANLI AKIŞ",
    navAddPlugin: "OmaRank Ekle",
    heroLead: "Omarchy Linux ekosistemi genelinde gerçek zamanlı toplu donanım zekası.",
    heroTitle: 'Omarchy <span class="hero-gradient">Donanım Matrisi</span>',
    copyStatus: "Kopyala",
    copyToast: "Komut panoya kopyalandı!",
    tabOverview: "Donanım Telemetrisi",
    tabLeaderboard: "Dünya Sıralaması",
    tabRoaster: "Rig Roaster 3000",
    tabSimulator: "OmaScore Simülatörü",
    tabTiers: "Seviyeler Listesi",
    tabPrivacy: "Zero-PII Denetimi",
    lbTitle: "Dünya Battlestation Sıralaması",
    lbSubtitle: "Doğrulanmış Omarchy sistemleri; ondalıklı hassas OmaScore, harf dereceleri ve donanım mimarisi.",
    lbSearchPh: "Sistem (Game Garaj), GPU (4070), CPU veya arketip ara...",
    lbTotalCount: "Doğrulanmış Sistem",
    lbColRank: "SIRA",
    lbColGrade: "DERECE",
    lbColScore: "OMASCORE",
    lbColSystem: "BATTLESTATION & SİSTEM",
    lbColCpu: "İŞLEMCİ (CPU)",
    lbColGpu: "GRAFİK KARTI (GPU)",
    lbColRam: "BELLEK (RAM)",
    lbColDisplay: "EKRAN",
    lbColVerified: "DOĞRULAMA",
    lbNoResults: "Arama kriterine uygun battlestation bulunamadı.",
    activeRigs: "Aktif Sistemler",
    activeRigsSub: "Topluluk tarafından test edilen donanımlar",
    avgScore: "Genel OmaScore Ortalaması",
    topGpu: "Zirvedeki GPU",
    topDisplay: "Baskın Ekran",
    chartGpu: "Grafik Mimarisi (GPU)",
    chartCpu: "İşlemci Mimarisi (CPU)",
    chartRam: "Sistem Belleği (RAM)",
    chartDisplay: "Ekran Arenası & Yenileme Hızları",
    chartVendors: "PC Üreticileri & Laptop Markaları",
    roasterTitle: "Rig Roaster 3000 & Arketip Tarayıcı",
    roasterDesc: "Anonim OmaRank imzanızı yapıştırın veya bir hazır sistem seçerek anında acımasız topluluk eleştirisini görün:",
    roastBtn: "Sistemimi Eleştir",
    simTitle: "OmaScore Donanım Simülatörü",
    simDesc: "Donanım parçalarını değiştirerek tahmini OmaScore puanınızı hesaplayın.",
    runRealBenchmark: "Gerçek Testi Çalıştır",
    bmModalTitle: "Gerçek Donanım Testi (Real Benchmark)",
    bmModalDesc: "Web simülatörü varsayımsal bir puan tahmin aracıdır. Kendi bilgisayarının gerçek donanımını (CPU, GPU, RAM hızı, ekran Hz, NVMe) doğrudan Linux çekirdeğinden test etmek için terminalde şu komutları çalıştırabilirsin:",
    bmStep1Title: "1. Anında Donanım Testi (OmaRank Kuruluysa)",
    bmStep2Title: "2. OmaRank Eklentisini Omarchy'ye Ekle",
    bmStep3Title: "3. Dünya Sıralamasına Gönder (Zero-PII)",
    bmCopyBtn: "Kopyala",
    tickerWelcomeTag: "YENİ RIG",
    tickerWelcomeText: "Game Garaj Slayer 4 Ultra • i7-14700HX • RTX 4070 Laptop • 32 GB RAM — Aramıza hoş geldin!",
    tickerStatTag: "CANLI TELEMETRİ",
    tickerGpuTag: "LİDER GPU",
    tickerGpuText: "NVIDIA GeForce RTX 4070 (%28.4 pazar payı) • Zirve: RTX 4090",
    tickerCpuTag: "LİDER CPU",
    tickerCpuText: "AMD Ryzen 7 7800X3D (%31.2 pay) • Intel Core i7-14700HX",
    tickerThemeTag: "FAVORİ TEMA",
    tickerThemeText: "Tokyo Night (%34) • Ankara & Catppuccin takipte",
    tickerQuickshellTag: "QUICKSHELL",
    tickerQuickshellText: "%100 Yerel Qt/QML Arayüz Desteği • Zero-Scrollbar Tasarım",
    tickerSecurityTag: "GÜVENLİK",
    tickerSecurityText: "%100 Zero-PII • SHA-256 Anonim Donanım Kimliği • Cloudflare D1 Edge Senkron",
    lbLoadMore: "Daha fazla yükle",
    demoBadge: "DEMO",
    demoTitle: "Örnek kayıt: gerçek bir gönderimle değiştirilecek",
    noData: "Henüz veri yok. İlk gönderimi sen yap: omarank-engine --share",
    loading: "Yükleniyor...",
    chartHist: "OmaScore Dağılımı",
    histEmpty: "Henüz puan dağılımı yok.",
    rarityQuery: "Topluluk veritabanı sorgulanıyor...",
    rarityFound: "Topluluk sıklığı: %{pct} ({count} sistem)",
    rarityRare: "Nadir yapılandırma: toplulukta henüz kayıt yok",
    rarityError: "Sıklık bilgisi şu an alınamadı.",
    myRigBadge: "SENİN CİHAZIN",
    lbError: "Liderlik tablosu yüklenemedi.",
    share: "pay",
    submissionsLabel: "gönderim",
    tickerStatText: "Canlı topluluk istatistikleri yükleniyor..."
  },
  en: {
    badge: "EN",
    tickerTitle: "LIVE FEED",
    navAddPlugin: "Add OmaRank",
    heroLead: "Real-time crowdsourced hardware intelligence across the Omarchy Linux ecosystem.",
    heroTitle: 'Omarchy <span class="hero-gradient">Hardware Matrix</span>',
    copyStatus: "Copy",
    copyToast: "Command copied to clipboard!",
    tabOverview: "Hardware Telemetry",
    tabLeaderboard: "World Leaderboard",
    tabRoaster: "Rig Roaster 3000",
    tabSimulator: "OmaScore Simulator",
    tabTiers: "Tier Ladder",
    tabPrivacy: "Zero-PII Audit",
    lbTitle: "World Battlestation Leaderboard",
    lbSubtitle: "Verified Omarchy systems ranked by high-precision decimal OmaScore, letter grade, and architectural capability.",
    lbSearchPh: "Search system (e.g. Game Garaj), GPU (4070), CPU, or archetype...",
    lbTotalCount: "Verified Systems",
    myRigBadge: "YOUR RIG",
    lbColRank: "RANK",
    lbColGrade: "GRADE",
    lbColScore: "OMASCORE",
    lbColSystem: "SYSTEM & ARCHETYPE",
    lbColCpu: "PROCESSOR",
    lbColGpu: "GRAPHICS",
    lbColRam: "MEMORY",
    lbColDisplay: "DISPLAY",
    lbColVerified: "VERIFIED",
    lbFilterAll: "All Tiers",
    lbNoResults: "No matching battlestations found.",
    activeRigs: "Active Battlestations",
    activeRigsSub: "Benchmarked community rigs",
    avgScore: "Global OmaScore Mean",
    topGpu: "Apex Predator GPU",
    topDisplay: "Dominant Display",
    chartGpu: "Graphics Architecture (GPU)",
    chartCpu: "Processor Architecture (CPU)",
    chartRam: "System Memory (RAM)",
    chartDisplay: "Display Arena & Refresh Rates",
    chartVendors: "PC Manufacturers & Custom DIY Vendors",
    roasterTitle: "Rig Roaster 3000 & Archetype Scanner",
    roasterDesc: "Type your anonymous OmaRank Archetype signature or pick a preset for an immediate, brutally honest community roast:",
    roastBtn: "Roast My Rig",
    simTitle: "OmaScore Hardware Simulator",
    simDesc: "Tweak hardware components to calculate your projected OmaScore and tier.",
    runRealBenchmark: "Run Real Benchmark",
    bmModalTitle: "Real Hardware Benchmark Guide",
    bmModalDesc: "The web simulator is an estimation tool. To benchmark your true hardware performance (CPU, GPU, RAM clock, display refresh, NVMe) straight from the Linux kernel, execute these commands in your terminal:",
    bmStep1Title: "1. Instant Benchmark (If OmaRank Installed)",
    bmStep2Title: "2. Install OmaRank Plugin in Omarchy",
    bmStep3Title: "3. Submit to World Leaderboard (Zero-PII)",
    bmCopyBtn: "Copy",
    tickerWelcomeTag: "NEW RIG",
    tickerWelcomeText: "Game Garaj Slayer 4 Ultra • i7-14700HX • RTX 4070 Laptop • 32 GB RAM — Welcome aboard!",
    tickerStatTag: "LIVE TELEMETRY",
    tickerGpuTag: "APEX GPU",
    tickerGpuText: "NVIDIA GeForce RTX 4070 (28.4% community share) • Apex: RTX 4090",
    tickerCpuTag: "APEX CPU",
    tickerCpuText: "AMD Ryzen 7 7800X3D (31.2% share) • Intel Core i7-14700HX",
    tickerThemeTag: "TOP THEME",
    tickerThemeText: "Tokyo Night (34%) • Followed by Ankara & Catppuccin",
    tickerQuickshellTag: "QUICKSHELL",
    tickerQuickshellText: "100% Native Qt/QML Shell • Pure Zero-Scrollbar Design",
    tickerSecurityTag: "ZERO-PII",
    tickerSecurityText: "100% Zero-PII • SHA-256 Anonymous Silicon Hash • Cloudflare D1 Edge Synchronized",
    lbLoadMore: "Load more",
    demoBadge: "DEMO",
    demoTitle: "Sample entry: replaced by the first real submission",
    noData: "No data yet. Be the first: omarank-engine --share",
    loading: "Loading...",
    chartHist: "OmaScore Distribution",
    histEmpty: "No score distribution yet.",
    rarityQuery: "Querying the community database...",
    rarityFound: "Community frequency: {pct}% ({count} rigs)",
    rarityRare: "Rare configuration: no community entries yet",
    rarityError: "Frequency data is unavailable right now.",
    lbError: "Could not load the leaderboard.",
    share: "share",
    submissionsLabel: "submissions",
    tickerStatText: "Loading live community stats..."
  },
  de: {
    badge: "DE",
    tickerTitle: "LIVE-FEED",
    navAddPlugin: "OmaRank Installieren",
    heroLead: "Echtzeit-Hardware-Intelligenz und Telemetrie im gesamten Omarchy Linux-Ökosystem.",
    heroTitle: 'Omarchy <span class="hero-gradient">Hardware-Matrix</span>',
    copyStatus: "Kopieren",
    copyToast: "Befehl in die Zwischenablage kopiert!",
    tabOverview: "Hardware-Telemetrie",
    tabLeaderboard: "Weltrangliste",
    tabRoaster: "Rig Roaster 3000",
    tabSimulator: "OmaScore Simulator",
    tabTiers: "Rangstufen-Halle",
    tabPrivacy: "Zero-PII Prüfung",
    lbTitle: "Globale Battlestation-Bestenliste",
    lbSubtitle: "Verifizierte Omarchy-Systeme sortiert nach präzisem OmaScore, Notenstufen und Hardware-Architektur.",
    lbSearchPh: "Suche System (Game Garaj), GPU (4070), CPU oder Archetyp...",
    lbTotalCount: "Verifizierte Systeme",
    lbColRank: "RANG",
    lbColGrade: "NOTE",
    lbColScore: "OMASCORE",
    lbColSystem: "BATTLESTATION & SYSTEM",
    lbColCpu: "PROZESSOR (CPU)",
    lbColGpu: "GRAFIKKARTE (GPU)",
    lbColRam: "ARBEITSSPEICHER (RAM)",
    lbColDisplay: "BILDSCHIRM",
    lbColVerified: "VERIFIZIERT",
    lbNoResults: "Keine passenden Battlestations gefunden.",
    activeRigs: "Aktive Systeme",
    activeRigsSub: "Von der Community getestete Rigs",
    avgScore: "Globaler OmaScore-Mittelwert",
    topGpu: "Spitzen-GPU",
    topDisplay: "Vorherrschendes Display",
    chartGpu: "Grafikarchitektur (GPU)",
    chartCpu: "Prozessorarchitektur (CPU)",
    chartRam: "Arbeitsspeicher (RAM)",
    chartDisplay: "Displays & Bildwiederholraten",
    chartVendors: "PC-Hersteller & Custom DIY",
    roasterTitle: "Rig Roaster 3000 & Archetyp-Scanner",
    roasterDesc: "Geben Sie Ihre anonyme Signatur ein oder wählen Sie ein Preset für einen gnadenlos ehrlichen Community-Roast:",
    roastBtn: "Röste Mein System",
    simTitle: "OmaScore Hardware-Simulator",
    simDesc: "Simulieren Sie Hardware-Upgrades und berechnen Sie Ihre hypothetische OmaScore-Stufe.",
    runRealBenchmark: "Echten Benchmark Starten",
    bmModalTitle: "Echter Hardware-Benchmark Leitfaden",
    bmModalDesc: "Der Web-Simulator ist ein Schätzwerkzeug. Um die reale Leistung Ihrer Hardware direkt aus dem Linux-Kernel zu testen, führen Sie diese Befehle im Terminal aus:",
    bmStep1Title: "1. Sofortiger Benchmark (Wenn OmaRank installiert)",
    bmStep2Title: "2. OmaRank Plugin zu Omarchy hinzufügen",
    bmStep3Title: "3. Zur Weltrangliste übermitteln (Zero-PII)",
    bmCopyBtn: "Kopieren",
    tickerWelcomeTag: "NEUES RIG",
    tickerWelcomeText: "Game Garaj Slayer 4 Ultra • i7-14700HX • RTX 4070 Laptop • 32 GB RAM — Willkommen!",
    tickerStatTag: "LIVE-TELEMETRIE",
    tickerGpuTag: "TOP-GPU",
    tickerGpuText: "NVIDIA GeForce RTX 4070 (28.4% Anteil) • Spitzenmodell: RTX 4090",
    tickerCpuTag: "TOP-CPU",
    tickerCpuText: "AMD Ryzen 7 7800X3D (31.2%) • Intel Core i7-14700HX",
    tickerThemeTag: "BELIEBTES THEMA",
    tickerThemeText: "Tokyo Night (34%) • Gefolgt von Ankara & Catppuccin",
    tickerQuickshellTag: "QUICKSHELL",
    tickerQuickshellText: "100% Native Qt/QML Shell • Null Scrollbalken",
    tickerSecurityTag: "SICHERHEIT",
    tickerSecurityText: "100% Zero-PII • SHA-256 Anonymer Silizium-Hash • Cloudflare D1 Edge",
    lbLoadMore: "Mehr laden",
    demoBadge: "DEMO",
    demoTitle: "Beispieleintrag: wird durch die erste echte Einsendung ersetzt",
    noData: "Noch keine Daten. Sei der Erste: omarank-engine --share",
    loading: "Lädt...",
    chartHist: "OmaScore-Verteilung",
    histEmpty: "Noch keine Punkteverteilung.",
    rarityQuery: "Community-Datenbank wird abgefragt...",
    rarityFound: "Häufigkeit in der Community: {pct}% ({count} Systeme)",
    rarityRare: "Seltene Konfiguration: noch keine Einträge",
    rarityError: "Häufigkeitsdaten derzeit nicht verfügbar.",
    myRigBadge: "DEIN SYSTEM",
    lbError: "Rangliste konnte nicht geladen werden.",
    share: "Anteil",
    submissionsLabel: "Einsendungen",
    tickerStatText: "Live-Statistiken werden geladen..."
  },
  es: {
    badge: "ES",
    tickerTitle: "EN VIVO",
    navAddPlugin: "Instalar OmaRank",
    heroLead: "Inteligencia agregada de hardware en tiempo real en todo el ecosistema Omarchy Linux.",
    heroTitle: 'Omarchy <span class="hero-gradient">Matriz de Hardware</span>',
    copyStatus: "Copiar",
    copyToast: "¡Comando copiado al portapapeles!",
    tabOverview: "Telemetría de Hardware",
    tabLeaderboard: "Clasificación Mundial",
    tabRoaster: "Rig Roaster 3000",
    tabSimulator: "Simulador OmaScore",
    tabTiers: "Sala de Rangos",
    tabPrivacy: "Auditoría Zero-PII",
    lbTitle: "Tabla de Clasificación Mundial",
    lbSubtitle: "Sistemas Omarchy verificados ordenados por OmaScore de alta precisión, notas y especificaciones.",
    lbSearchPh: "Buscar sistema (Game Garaj), GPU (4070), CPU o arquetipo...",
    lbTotalCount: "Sistemas Verificados",
    lbColRank: "PUESTO",
    lbColGrade: "GRADO",
    lbColScore: "OMASCORE",
    lbColSystem: "BATTLESTATION Y SISTEMA",
    lbColCpu: "PROCESADOR (CPU)",
    lbColGpu: "TARJETA GRÁFICA (GPU)",
    lbColRam: "MEMORIA (RAM)",
    lbColDisplay: "PANTALLA",
    lbColVerified: "VERIFICACIONES",
    lbNoResults: "No se encontraron sistemas coincidentes.",
    activeRigs: "Estaciones Activas",
    activeRigsSub: "Equipos evaluados por la comunidad",
    avgScore: "Media Global OmaScore",
    topGpu: "GPU Líder",
    topDisplay: "Pantalla Dominante",
    chartGpu: "Arquitectura Gráfica (GPU)",
    chartCpu: "Arquitectura del Procesador (CPU)",
    chartRam: "Memoria del Sistema (RAM)",
    chartDisplay: "Pantallas y Tasas de Refresco",
    chartVendors: "Fabricantes OEM y Ensambladores",
    roasterTitle: "Rig Roaster 3000 y Escáner de Arquetipos",
    roasterDesc: "Escribe tu firma de OmaRank o elige un preajuste para una crítica sincera y despiadada:",
    roastBtn: "Critica Mi PC",
    simTitle: "Simulador de Hardware OmaScore",
    simDesc: "Simula mejoras en tus componentes y calcula tu puntuación hipotética.",
    runRealBenchmark: "Ejecutar Benchmark Real",
    bmModalTitle: "Guía de Benchmark Real de Hardware",
    bmModalDesc: "El simulador web es una herramienta de estimación. Para medir el rendimiento real de su hardware directamente desde el kernel Linux, ejecute estos comandos:",
    bmStep1Title: "1. Benchmark Inmediato (Si OmaRank está instalado)",
    bmStep2Title: "2. Agregar Plugin OmaRank a Omarchy",
    bmStep3Title: "3. Enviar a la Clasificación Mundial (Zero-PII)",
    bmCopyBtn: "Copiar",
    tickerWelcomeTag: "NUEVO EQUIPO",
    tickerWelcomeText: "Game Garaj Slayer 4 Ultra • i7-14700HX • RTX 4070 Laptop • 32 GB RAM — ¡Bienvenido!",
    tickerStatTag: "TELEMETRÍA EN VIVO",
    tickerGpuTag: "GPU LÍDER",
    tickerGpuText: "NVIDIA GeForce RTX 4070 (28.4% cuota) • Cúspide: RTX 4090",
    tickerCpuTag: "CPU LÍDER",
    tickerCpuText: "AMD Ryzen 7 7800X3D (31.2%) • Intel Core i7-14700HX",
    tickerThemeTag: "TEMA FAVORITO",
    tickerThemeText: "Tokyo Night (34%) • Seguido de Ankara y Catppuccin",
    tickerQuickshellTag: "QUICKSHELL",
    tickerQuickshellText: "Shell Qt/QML 100% Nativo • Diseño sin barras de scroll",
    tickerSecurityTag: "SEGURIDAD",
    tickerSecurityText: "100% Zero-PII • Hash SHA-256 Anónimo • Sincronización Cloudflare D1",
    lbLoadMore: "Cargar más",
    demoBadge: "DEMO",
    demoTitle: "Entrada de ejemplo: se reemplaza con el primer envío real",
    noData: "Aún no hay datos. Sé el primero: omarank-engine --share",
    loading: "Cargando...",
    chartHist: "Distribución de OmaScore",
    histEmpty: "Aún no hay distribución de puntuaciones.",
    rarityQuery: "Consultando la base de datos de la comunidad...",
    rarityFound: "Frecuencia en la comunidad: {pct}% ({count} equipos)",
    rarityRare: "Configuración rara: aún sin registros",
    rarityError: "Datos de frecuencia no disponibles ahora.",
    myRigBadge: "TU EQUIPO",
    lbError: "No se pudo cargar la clasificación.",
    share: "cuota",
    submissionsLabel: "envíos",
    tickerStatText: "Cargando estadísticas en vivo..."
  },
  fr: {
    badge: "FR",
    tickerTitle: "FLUX DIRECT",
    navAddPlugin: "Ajouter OmaRank",
    heroLead: "Intelligence matérielle agrégée en temps réel dans tout l'écosystème Omarchy Linux.",
    heroTitle: 'Omarchy <span class="hero-gradient">Matrice Matérielle</span>',
    copyStatus: "Copier",
    copyToast: "Commande copiée dans le presse-papier!",
    tabOverview: "Télémétrie Matérielle",
    tabLeaderboard: "Classement Mondial",
    tabRoaster: "Rig Roaster 3000",
    tabSimulator: "Simulateur OmaScore",
    tabTiers: "Galerie des Rangs",
    tabPrivacy: "Audit Zero-PII",
    lbTitle: "Classement Mondial des Battlestations",
    lbSubtitle: "Systèmes Omarchy vérifiés classés par OmaScore haute précision, grades et matériel.",
    lbSearchPh: "Rechercher système, GPU (4070), CPU ou archétype...",
    lbTotalCount: "Systèmes Vérifiés",
    lbColRank: "RANG",
    lbColGrade: "GRADE",
    lbColScore: "OMASCORE",
    lbColSystem: "BATTLESTATION & SYSTÈME",
    lbColCpu: "PROCESSEUR (CPU)",
    lbColGpu: "CARTE GRAPHIQUE (GPU)",
    lbColRam: "MÉMOIRE (RAM)",
    lbColDisplay: "ÉCRAN",
    lbColVerified: "VÉRIFIÉ",
    lbNoResults: "Aucune battlestation trouvée.",
    activeRigs: "Systèmes Actifs",
    activeRigsSub: "Configurations testées par la communauté",
    avgScore: "Moyenne Globale OmaScore",
    topGpu: "GPU Dominant",
    topDisplay: "Écran Dominant",
    chartGpu: "Architecture Graphique (GPU)",
    chartCpu: "Architecture Processeur (CPU)",
    chartRam: "Mémoire Système (RAM)",
    chartDisplay: "Écrans & Fréquences de Rafraîchissement",
    chartVendors: "Fabricants OEM et Marques Portables",
    roasterTitle: "Rig Roaster 3000 & Scanner d'Archétype",
    roasterDesc: "Saisissez votre signature anonyme ou choisissez un préréglage pour une critique brutale et hilarante :",
    roastBtn: "Rôtir Ma Config",
    simTitle: "Simulateur Matériel OmaScore",
    simDesc: "Simulez des mises à niveau et calculez votre rang théorique OmaScore.",
    runRealBenchmark: "Lancer le Vrai Benchmark",
    bmModalTitle: "Guide du Véritable Benchmark Matériel",
    bmModalDesc: "Le simulateur web est un outil d'estimation. Pour tester les performances réelles de votre matériel directement depuis le noyau Linux, exécutez ces commandes :",
    bmStep1Title: "1. Benchmark Immédiat (Si OmaRank est installé)",
    bmStep2Title: "2. Ajouter le Plugin OmaRank à Omarchy",
    bmStep3Title: "3. Soumettre au Classement Mondial (Zero-PII)",
    bmCopyBtn: "Copier",
    tickerWelcomeTag: "NOUVEAU RIG",
    tickerWelcomeText: "Game Garaj Slayer 4 Ultra • i7-14700HX • RTX 4070 Laptop • 32 GB RAM — Bienvenue!",
    tickerStatTag: "TÉLÉMÉTRIE DIRECTE",
    tickerGpuTag: "MEILLEUR GPU",
    tickerGpuText: "NVIDIA GeForce RTX 4070 (part 28.4%) • Sommet: RTX 4090",
    tickerCpuTag: "MEILLEUR CPU",
    tickerCpuText: "AMD Ryzen 7 7800X3D (31.2%) • Intel Core i7-14700HX",
    tickerThemeTag: "THÈME POPULAIRE",
    tickerThemeText: "Tokyo Night (34%) • Suivi par Ankara & Catppuccin",
    tickerQuickshellTag: "QUICKSHELL",
    tickerQuickshellText: "Shell Qt/QML 100% Natif • Zéro Barre de Défilement",
    tickerSecurityTag: "SÉCURITÉ",
    tickerSecurityText: "100% Zero-PII • Empreinte SHA-256 Anonyme • Synchronisation Cloudflare D1",
    lbLoadMore: "Charger plus",
    demoBadge: "DÉMO",
    demoTitle: "Entrée d'exemple : remplacée par le premier envoi réel",
    noData: "Pas encore de données. Soyez le premier : omarank-engine --share",
    loading: "Chargement...",
    chartHist: "Distribution OmaScore",
    histEmpty: "Pas encore de distribution des scores.",
    rarityQuery: "Interrogation de la base communautaire...",
    rarityFound: "Fréquence communautaire : {pct}% ({count} machines)",
    rarityRare: "Configuration rare : aucune entrée pour l'instant",
    rarityError: "Données de fréquence indisponibles.",
    myRigBadge: "TA MACHINE",
    lbError: "Impossible de charger le classement.",
    share: "part",
    submissionsLabel: "envois",
    tickerStatText: "Chargement des statistiques en direct..."
  },
  ja: {
    badge: "JA",
    tickerTitle: "ライブ速報",
    navAddPlugin: "OmaRankを追加",
    heroLead: "Omarchy Linuxエコシステム全体のリアルタイム集約ハードウェア・テレメトリ。",
    heroTitle: 'Omarchy <span class="hero-gradient">ハードウェア・マトリックス</span>',
    copyStatus: "コピー",
    copyToast: "コマンドをクリップボードにコピーしました！",
    tabOverview: "ハードウェア遠隔測定",
    tabLeaderboard: "世界ランキング",
    tabRoaster: "Rig Roaster 3000",
    tabSimulator: "OmaScoreシミュレータ",
    tabTiers: "ティア一覧 (殿堂)",
    tabPrivacy: "Zero-PII 監査",
    lbTitle: "世界バトルステーション ランキング",
    lbSubtitle: "高精度OmaScore、レターグレード、およびハードウェア構成に基づく検証済みOmarchyシステム。",
    lbSearchPh: "システム名、GPU、CPU、アーキタイプで検索...",
    lbTotalCount: "検証済みシステム",
    lbColRank: "順位",
    lbColGrade: "グレード",
    lbColScore: "OMASCORE",
    lbColSystem: "PC構成 & システム",
    lbColCpu: "プロセッサ (CPU)",
    lbColGpu: "グラフィック (GPU)",
    lbColRam: "メモリ (RAM)",
    lbColDisplay: "ディスプレイ",
    lbColVerified: "検証回数",
    lbNoResults: "一致するシステムが見つかりませんでした。",
    activeRigs: "アクティブなシステム",
    activeRigsSub: "コミュニティで測定されたPC構成",
    avgScore: "全世界平均 OmaScore",
    topGpu: "首位のGPU",
    topDisplay: "主流ディスプレイ",
    chartGpu: "グラフィック構成 (GPU)",
    chartCpu: "プロセッサ構成 (CPU)",
    chartRam: "システムメモリ (RAM)",
    chartDisplay: "ディスプレイ解像度とリフレッシュレート",
    chartVendors: "PCメーカー・ノートPCブランド",
    roasterTitle: "Rig Roaster 3000 & アーキタイプ診断",
    roasterDesc: "匿名アーキタイプ署名を入力するかプリセットを選択して、痛快で辛口なPC批評をご覧ください：",
    roastBtn: "PCを辛口批評する",
    simTitle: "OmaScore ハードウェア・シミュレータ",
    simDesc: "パーツのアップグレードを試算し、仮想OmaScoreティアを算出します。",
    runRealBenchmark: "実機ベンチマークを実行",
    bmModalTitle: "実機ハードウェア・ベンチマーク手順",
    bmModalDesc: "Webシミュレータは推定ツールです。Linuxカーネルから直接、真のハードウェア性能（CPU、GPU、RAMクロック、リフレッシュレート、NVMe）を測定するには、端末で次のコマンドを実行してください：",
    bmStep1Title: "1. 即時ベンチマーク（OmaRank導入済みの場合）",
    bmStep2Title: "2. OmaRankプラグインをOmarchyに導入",
    bmStep3Title: "3. 世界ランキングへ送信（Zero-PII）",
    bmCopyBtn: "コピー",
    tickerWelcomeTag: "新規リグ",
    tickerWelcomeText: "Game Garaj Slayer 4 Ultra • i7-14700HX • RTX 4070 Laptop • 32 GB RAM — ようこそ！",
    tickerStatTag: "リアルタイム遠隔測定",
    tickerGpuTag: "首位GPU",
    tickerGpuText: "NVIDIA GeForce RTX 4070 (シェア 28.4%) • 最高峰: RTX 4090",
    tickerCpuTag: "首位CPU",
    tickerCpuText: "AMD Ryzen 7 7800X3D (シェア 31.2%) • Intel Core i7-14700HX",
    tickerThemeTag: "人気テーマ",
    tickerThemeText: "Tokyo Night (34%) • Ankara & Catppuccin が追従",
    tickerQuickshellTag: "QUICKSHELL",
    tickerQuickshellText: "100% ネイティブQt/QMLシェル • スクロールバー完全排除",
    tickerSecurityTag: "セキュリティ",
    tickerSecurityText: "100% Zero-PII • SHA-256匿名ハッシュ • Cloudflare D1 エッジ同期"
  }
};

let activeLang = "tr";
// localStorage throws when storage is blocked; never let that stop the dashboard script
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

const savedLang = storageGet("omastat-lang");
if (savedLang && i18n[savedLang]) {
  activeLang = savedLang;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

// Tiers and weights come from GET /api/meta/v1 (the same tables the server and
// the OmaRank engine use); the constants below are only the offline fallback.
let omaMeta = {
  tiers: [
    { grade: "S+", min: 96, name: "Cosmic Reality Simulator", icon: "\u{F091}", color: "#a855f7" },
    { grade: "S", min: 89, name: "NASA Supercomputer", icon: "\u{F04C5}", color: "#6366f1" },
    { grade: "A", min: 76, name: "Cyberpunk Beast", icon: "\u{F135}", color: "#38bdf8" },
    { grade: "B", min: 61, name: "Gaming Chair Missing", icon: "\u{F11B}", color: "#22c55e" },
    { grade: "C", min: 46, name: "Honest Daily Driver", icon: "\u{F108}", color: "#eab308" },
    { grade: "D", min: 31, name: "Budget Warrior", icon: "\u{F2DB}", color: "#f97316" },
    { grade: "E", min: 16, name: "Study Mode Only", icon: "\u{F109}", color: "#ef4444" },
    { grade: "F", min: 0, name: "Potato Toaster", icon: "\u{F071}", color: "#94a3b8" }
  ],
  weights: { cpu: 24, gpu: 32, ram: 16, mobo: 8, display: 15, storage: 5 }
};
let simReady = false;
let lastStats = null;

// --- Global Leaderboard Logic (server-side paging, filter and search) ---
const LB_PAGE_SIZE = 50;
let currentLeaderboard = [];
let leaderboardTotal = 0;
let leaderboardState = "loading"; // loading | ready | error
let currentLeaderboardFilter = "all";
let currentLeaderboardSearch = "";
let leaderboardRequestId = 0;

// Nerd Font glyphs are decorative; keep them away from screen readers.
function hideDecorativeIcons(root) {
  (root || document).querySelectorAll(".q-icon:not([aria-hidden])").forEach(el => el.setAttribute("aria-hidden", "true"));
}

function tr(key, fallback) {
  const t = i18n[activeLang] || i18n.tr;
  return t[key] !== undefined ? t[key] : (i18n.en[key] !== undefined ? i18n.en[key] : (fallback || ""));
}

function getMyRigCode() {
  const params = new URLSearchParams(window.location.search);
  let my = (params.get("my") || "").trim();
  if (!my && window.location.hash.includes("my=")) {
    my = (window.location.hash.split("my=")[1] || "").split("&")[0].trim();
  }
  try { my = decodeURIComponent(my); } catch (e) {}
  if (my) storageSet("omastat_my_rig", my);
  else my = storageGet("omastat_my_rig") || "";
  return my.trim().toUpperCase();
}

function getCleanTierIcon(tierName, rawIcon) {
  if (rawIcon && typeof rawIcon === "string" && rawIcon.trim().length > 0 && rawIcon.trim().length <= 4) {
    const cp = rawIcon.codePointAt(0) || 0;
    if (cp < 0x1F300 || cp > 0x1FAFF) {
      return rawIcon.trim();
    }
  }
  const tier = (omaMeta.tiers || []).find(x => x.name === tierName);
  return tier ? tier.icon : "";
}

async function fetchLeaderboard(reset) {
  const requestId = ++leaderboardRequestId;
  const offset = reset ? 0 : currentLeaderboard.length;
  const params = new URLSearchParams({ limit: String(LB_PAGE_SIZE), offset: String(offset) });
  if (currentLeaderboardFilter !== "all") params.set("grade", currentLeaderboardFilter);
  if (currentLeaderboardSearch) params.set("q", currentLeaderboardSearch);
  if (reset) {
    leaderboardState = "loading";
    renderLeaderboard();
  }
  const moreBtn = document.getElementById("lbLoadMore");
  if (moreBtn) moreBtn.disabled = true;
  try {
    const res = await fetch(`/api/leaderboard/v1?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (requestId !== leaderboardRequestId) return; // a newer query superseded this one
    currentLeaderboard = reset ? data.items : currentLeaderboard.concat(data.items);
    leaderboardTotal = Number(data.total) || 0;
    leaderboardState = "ready";
  } catch (e) {
    if (requestId !== leaderboardRequestId) return;
    console.error("Leaderboard load failed:", e);
    leaderboardState = "error";
  } finally {
    if (moreBtn) moreBtn.disabled = false;
  }
  renderLeaderboard();
}

function renderLeaderboard() {
  const tbody = document.getElementById("leaderboardBody");
  const totalCountEl = document.getElementById("lbTotalCount");
  const moreBtn = document.getElementById("lbLoadMore");
  if (!tbody) return;

  const t = i18n[activeLang] || i18n.tr;
  const myCode = getMyRigCode();

  if (totalCountEl) {
    totalCountEl.textContent = leaderboardState === "ready" ? `${leaderboardTotal} ${t.lbTotalCount}` : t.lbTotalCount;
  }
  if (moreBtn) {
    moreBtn.textContent = tr("lbLoadMore");
    moreBtn.hidden = !(leaderboardState === "ready" && currentLeaderboard.length < leaderboardTotal);
  }

  const messageRow = (text) => `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--muted); font-size: 0.85rem;">
          ${escapeHtml(text)}
        </td>
      </tr>
    `;

  if (leaderboardState === "loading" && currentLeaderboard.length === 0) {
    tbody.innerHTML = messageRow(tr("loading"));
    return;
  }
  if (leaderboardState === "error" && currentLeaderboard.length === 0) {
    tbody.innerHTML = messageRow(tr("lbError"));
    return;
  }
  if (currentLeaderboard.length === 0) {
    const empty = currentLeaderboardFilter === "all" && !currentLeaderboardSearch ? tr("noData") : t.lbNoResults;
    tbody.innerHTML = messageRow(empty);
    return;
  }

  let hasMarkedMyRig = false;
  // Filtered or searched views number their own result set.
  tbody.innerHTML = currentLeaderboard.map((item, idx) => {
    const rank = idx + 1;
    let rankHtml = `<span>#${rank}</span>`;
    let rankClass = "rank-badge";
    if (rank === 1) {
      rankClass += " rank-1";
      rankHtml = `<span class="q-icon q-icon-amber rank-trophy"></span><span>#1</span>`;
    } else if (rank === 2) {
      rankClass += " rank-2";
      rankHtml = `<span class="q-icon rank-trophy" style="color: #e2e8f0;"></span><span>#2</span>`;
    } else if (rank === 3) {
      rankClass += " rank-3";
      rankHtml = `<span class="q-icon rank-trophy" style="color: #e59866;"></span><span>#3</span>`;
    }

    const grade = item.grade || "F";
    const gradeClass = `grade-${grade.toLowerCase().replace("+", "-plus")}`;
    const scoreFormatted = Number(item.score || 0).toFixed(2);
    const submissions = item.submissions_count || 1;
    const tierIcon = getCleanTierIcon(item.tier_name, item.tier_icon);

    // Only an exact archetype match is "my rig"; substring matches lit up unrelated rows.
    const isMyRig = myCode.length > 0 && (item.archetype || "").toUpperCase() === myCode;
    let rowId = "";
    if (isMyRig && !hasMarkedMyRig) {
      hasMarkedMyRig = true;
      rowId = ' id="myRigRow"';
    }
    const classes = [isMyRig ? "my-rig-row" : "", item.is_demo ? "demo-row" : ""].filter(Boolean).join(" ");
    const rowClass = classes ? ` class="${classes}"` : "";
    const myBadgeHtml = isMyRig
      ? `<span class="my-rig-badge"><span class="q-icon" style="font-size:0.6rem;">󰄵</span> ${escapeHtml(t.myRigBadge || "YOUR RIG")}</span>`
      : "";
    const demoBadgeHtml = item.is_demo
      ? `<span class="demo-badge" title="${escapeHtml(tr("demoTitle"))}">${escapeHtml(tr("demoBadge"))}</span>`
      : "";

    return `
      <tr${rowId}${rowClass}>
        <td><span class="${rankClass}">${rankHtml}</span></td>
        <td><span class="grade-badge ${gradeClass}">${escapeHtml(grade)}</span></td>
        <td><span class="score-cell">${scoreFormatted}</span></td>
        <td>
          <div class="system-title">
            <span class="q-icon q-icon-brand">${escapeHtml(tierIcon)}</span>
            <span>${escapeHtml(item.system_name || "Custom Rig")}</span>
            ${myBadgeHtml}${demoBadgeHtml}
          </div>
          <div class="archetype-tag">${escapeHtml(item.archetype || "OMA-BUILD")}</div>
        </td>
        <td>
          <span class="spec-pill">
            <span class="q-icon q-icon-purple"></span>
            <span>${escapeHtml(item.cpu_model || "CPU")}</span>
          </span>
        </td>
        <td>
          <span class="spec-pill">
            <span class="q-icon q-icon-brand">󰢮</span>
            <span>${escapeHtml(item.gpu_model || "GPU")}</span>
          </span>
        </td>
        <td>
          <span class="spec-pill">
            <span class="q-icon q-icon-cyan">󰍛</span>
            <span>${escapeHtml(item.ram_desc || "RAM")}</span>
          </span>
        </td>
        <td>
          <span class="spec-pill">
            <span class="q-icon q-icon-amber">󰍹</span>
            <span>${escapeHtml(item.display_desc || "Display")}</span>
          </span>
        </td>
        <td style="text-align: right;">
          <span class="submissions-pill" title="${escapeHtml(tr("submissionsLabel"))}">
            <span class="q-icon" style="font-size:0.7rem; margin-right:2px;">󰄵</span>${Number(submissions)}x
          </span>
        </td>
      </tr>
    `;
  }).join("");
  hideDecorativeIcons(tbody);

  if (hasMarkedMyRig) {
    scrollToMyRig();
  }
}

function scrollToMyRig() {
  const activeTab = document.querySelector(".tab-pane.active");
  if (!activeTab || activeTab.id !== "tab-leaderboard") return;
  setTimeout(() => {
    const el = document.getElementById("myRigRow");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 250);
}

function renderTicker(lang) {
  const t = i18n[lang] || i18n.tr;
  const items = [
    { icon: "󰌢", tag: t.tickerWelcomeTag, text: t.tickerWelcomeText },
    { icon: "", tag: t.tickerStatTag, text: t.tickerStatText },
    { icon: "󰢮", tag: t.tickerGpuTag, text: t.tickerGpuText },
    { icon: "", tag: t.tickerCpuTag, text: t.tickerCpuText },
    { icon: "󰏚", tag: t.tickerThemeTag, text: t.tickerThemeText },
    { icon: "󰄛", tag: t.tickerQuickshellTag, text: t.tickerQuickshellText },
    { icon: "󰒃", tag: t.tickerSecurityTag, text: t.tickerSecurityText }
  ];

  const list = [...items, ...items];
  const track = document.getElementById("tickerTrack");
  if (!track) return;
  track.innerHTML = list.map(item => `
    <div class="ticker-item">
      <span class="ticker-tag">${escapeHtml(item.tag)}</span>
      <span class="ticker-icon">${item.icon}</span>
      <span class="ticker-text">${escapeHtml(item.text)}</span>
    </div>
  `).join("");
}

function applyLanguage(lang) {
  if (!i18n[lang]) lang = "tr";
  activeLang = lang;
  storageSet("omastat-lang", lang);
  document.documentElement.lang = lang;
  const t = i18n[lang];

  document.getElementById("activeLangBadge").textContent = t.badge;
  document.getElementById("tickerTitle").textContent = t.tickerTitle;
  document.getElementById("navAddPluginText").textContent = t.navAddPlugin;
  const heroLead = document.querySelector(".hero-lead");
  if (heroLead) heroLead.textContent = t.heroLead;
  const heroH1 = document.querySelector(".hero-banner h1");
  if (heroH1) heroH1.innerHTML = t.heroTitle;
  document.getElementById("copyStatus").textContent = t.copyStatus;

  const tabLabels = [t.tabOverview, t.tabLeaderboard, t.tabRoaster, t.tabSimulator, t.tabTiers, t.tabPrivacy];
  document.querySelectorAll(".qml-tab span:last-child").forEach((el, i) => {
    if (tabLabels[i]) el.textContent = tabLabels[i];
  });

  const lbTitleEl = document.getElementById("lbTitle"); if (lbTitleEl) lbTitleEl.textContent = t.lbTitle;
  const lbSubEl = document.getElementById("lbSubtitle"); if (lbSubEl) lbSubEl.textContent = t.lbSubtitle;
  const lbSearchInput = document.getElementById("leaderboardSearch"); if (lbSearchInput) lbSearchInput.placeholder = t.lbSearchPh;

  const thRank = document.getElementById("thRank"); if (thRank) thRank.textContent = t.lbColRank;
  const thGrade = document.getElementById("thGrade"); if (thGrade) thGrade.textContent = t.lbColGrade;
  const thScore = document.getElementById("thScore"); if (thScore) thScore.textContent = t.lbColScore;
  const thSystem = document.getElementById("thSystem"); if (thSystem) thSystem.textContent = t.lbColSystem;
  const thCpu = document.getElementById("thCpu"); if (thCpu) thCpu.textContent = t.lbColCpu;
  const thGpu = document.getElementById("thGpu"); if (thGpu) thGpu.textContent = t.lbColGpu;
  const thRam = document.getElementById("thRam"); if (thRam) thRam.textContent = t.lbColRam;
  const thDisplay = document.getElementById("thDisplay"); if (thDisplay) thDisplay.textContent = t.lbColDisplay;
  const thVerified = document.getElementById("thVerified"); if (thVerified) thVerified.textContent = t.lbColVerified;

  if (typeof renderLeaderboard === "function") {
    renderLeaderboard();
  }

  const cardLabels = document.querySelectorAll(".card-label");
  if (cardLabels[0]) cardLabels[0].textContent = t.activeRigs;
  if (cardLabels[1]) cardLabels[1].textContent = t.avgScore;
  if (cardLabels[2]) cardLabels[2].textContent = t.topGpu;
  if (cardLabels[3]) cardLabels[3].textContent = t.topDisplay;

  const cardSubs = document.querySelectorAll(".card-sub");
  if (cardSubs[0]) cardSubs[0].textContent = t.activeRigsSub;

  const chartTitles = [t.chartGpu, t.chartCpu, t.chartRam, t.chartDisplay, t.chartVendors, t.chartHist];
  document.querySelectorAll(".chart-box-title").forEach((el, i) => {
    if (chartTitles[i]) {
      const icon = el.querySelector(".q-icon") ? el.querySelector(".q-icon").outerHTML : "";
      el.innerHTML = `${icon} ${chartTitles[i]}`;
    }
  });

  const roasterH2 = document.querySelector(".roaster-header h2");
  if (roasterH2) roasterH2.innerHTML = `<span class="q-icon q-icon-red">󰈸</span> ${t.roasterTitle}`;
  const roasterP = document.querySelector(".roaster-header p");
  if (roasterP) roasterP.innerHTML = t.roasterDesc;
  const roastBtnSpan = document.querySelector("#roastBtn span:last-child");
  if (roastBtnSpan) roastBtnSpan.textContent = t.roastBtn;

  const runRealEl = document.getElementById("runRealBenchmarkText");
  if (runRealEl) runRealEl.textContent = t.runRealBenchmark || "Run Real Benchmark";

  const bmTitle = document.getElementById("bmModalTitle");
  if (bmTitle) bmTitle.textContent = t.bmModalTitle || "Real Hardware Benchmark";
  const bmDesc = document.getElementById("bmModalDesc");
  if (bmDesc) bmDesc.textContent = t.bmModalDesc || "";
  const bmStep1 = document.getElementById("bmStep1Title");
  if (bmStep1) bmStep1.textContent = t.bmStep1Title || "";
  const bmStep2 = document.getElementById("bmStep2Title");
  if (bmStep2) bmStep2.textContent = t.bmStep2Title || "";
  const bmStep3 = document.getElementById("bmStep3Title");
  if (bmStep3) bmStep3.textContent = t.bmStep3Title || "";

  document.querySelectorAll(".copy-cmd-btn .btn-label").forEach(l => {
    l.textContent = t.bmCopyBtn || "Copy";
  });

  document.querySelectorAll("#langMenu .menu-item").forEach(item => {
    if (item.getAttribute("data-lang") === lang) item.classList.add("active");
    else item.classList.remove("active");
  });

  renderTicker(lang);
  if (lastStats) renderStats(lastStats);
  if (typeof recalculateSimulator === "function" && simReady) recalculateSimulator();
  hideDecorativeIcons();
}

const langPickerBtn = document.getElementById("langPickerBtn");
const langMenu = document.getElementById("langMenu");
langPickerBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  langMenu.classList.toggle("show");
  stationMenu.classList.remove("show");
  playClick();
});

document.querySelectorAll("#langMenu .menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const lang = item.getAttribute("data-lang");
    applyLanguage(lang);
    langMenu.classList.remove("show");
    playClick();
  });
});

document.addEventListener("click", () => {
  stationMenu.classList.remove("show");
  langMenu.classList.remove("show");
});

// --- Theme System ---
let activeThemeId = "tokyo-night";
const savedTheme = storageGet("omastat-theme");
if (savedTheme && themeCatalog.some(t => t.id === savedTheme)) {
  activeThemeId = savedTheme;
}

function applyTheme(id) {
  activeThemeId = id;
  document.documentElement.dataset.theme = id;
  storageSet("omastat-theme", id);
  const found = themeCatalog.find(t => t.id === id);
  const label = found ? found.name : id.toUpperCase();
  document.getElementById("activeThemeBadge").textContent = label + " ▾";

  document.querySelectorAll(".theme-card").forEach(c => {
    if (c.getAttribute("data-id") === id) c.classList.add("active");
    else c.classList.remove("active");
  });
}

// Render Modal Cards
const modalGrid = document.getElementById("modalThemeGrid");
function renderModalGrid(filter = "") {
  modalGrid.innerHTML = "";
  const q = filter.toLowerCase().trim();
  const filtered = themeCatalog.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));

  filtered.forEach(t => {
    const card = document.createElement("div");
    card.className = "theme-card" + (t.id === activeThemeId ? " active" : "");
    card.setAttribute("data-id", t.id);
    card.innerHTML = `
      <div class="card-palette">
        <span class="swatch" style="background:${t.background};" title="Background"></span>
        <span class="swatch" style="background:${t.surface};" title="Surface"></span>
        <span class="swatch" style="background:${t.accent};" title="Accent"></span>
        <span class="swatch" style="background:${t.foreground};" title="Foreground"></span>
      </div>
      <div class="theme-card-info">
        <span class="theme-card-name">${t.name}</span>
        <span class="active-tick"><span class="q-icon" style="font-size:0.75rem; margin-right:2px;">󰄵</span>Active</span>
      </div>
    `;
    card.addEventListener("click", () => {
      applyTheme(t.id);
      playChime();
    });
    modalGrid.appendChild(card);
  });
}

renderModalGrid();

// Modal Events
const themeModal = document.getElementById("themeModal");
document.getElementById("openThemeModalBtn").addEventListener("click", () => {
  renderModalGrid(document.getElementById("themeSearch").value);
  themeModal.classList.add("open");
  playClick();
});

document.getElementById("closeThemeModalBtn").addEventListener("click", () => {
  themeModal.classList.remove("open");
});

themeModal.addEventListener("click", (e) => {
  if (e.target === themeModal) themeModal.classList.remove("open");
});

document.getElementById("themeSearch").addEventListener("input", (e) => {
  renderModalGrid(e.target.value);
});

document.getElementById("randomThemeBtn").addEventListener("click", () => {
  const randomItem = themeCatalog[Math.floor(Math.random() * themeCatalog.length)];
  applyTheme(randomItem.id);
  playChime();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (themeModal.classList.contains("open")) themeModal.classList.remove("open");
  if (benchmarkModal && benchmarkModal.classList.contains("open")) benchmarkModal.classList.remove("open");
});

// --- Benchmark Guide Modal Events ---
const benchmarkModal = document.getElementById("benchmarkModal");
const runRealBtn = document.getElementById("runRealBenchmarkBtn");
if (runRealBtn) {
  runRealBtn.addEventListener("click", (e) => {
    e.preventDefault();
    benchmarkModal.classList.add("open");
    playChime();
    const defaultCmd = "omarank-engine";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(defaultCmd).catch(() => fallbackCopy(defaultCmd));
    } else {
      fallbackCopy(defaultCmd);
    }
    toastMsg("[OK] 'omarank-engine' komutu kopyalandı! Terminalinde çalıştırabilirsin.");
  });
}

const closeBmBtn = document.getElementById("closeBenchmarkModalBtn");
if (closeBmBtn) {
  closeBmBtn.addEventListener("click", () => {
    benchmarkModal.classList.remove("open");
  });
}

if (benchmarkModal) {
  benchmarkModal.addEventListener("click", (e) => {
    if (e.target === benchmarkModal) benchmarkModal.classList.remove("open");
  });
}

document.querySelectorAll(".copy-cmd-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const cmd = btn.getAttribute("data-cmd");
    if (!cmd) return;
    const onDone = () => {
      playChime();
      const label = btn.querySelector(".btn-label");
      if (label) {
        const old = label.textContent;
        label.textContent = "[OK] Kopyalandı!";
        setTimeout(() => { label.textContent = old; }, 1500);
      }
      toastMsg("[OK] Komut panoya kopyalandı!");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmd).then(onDone).catch(() => fallbackCopy(cmd).then(onDone));
    } else {
      fallbackCopy(cmd).then(onDone);
    }
  });
});

// Apply initial theme & language
applyTheme(activeThemeId);
applyLanguage(activeLang);

// --- Clipboard Copy ---
const copyBtn = document.getElementById("copyCliBtn");
const toast = document.getElementById("qmlToast");

function toastMsg(txt) {
  toast.textContent = txt;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 2200);
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch(e) {}
  document.body.removeChild(ta);
  return Promise.resolve();
}

copyBtn.addEventListener("click", () => {
  const code = document.getElementById("cliSnippet").innerText;
  const onDone = () => {
    playChime();
    document.getElementById("copyStatus").textContent = "Copied! [OK]";
    toastMsg("[OK] Plugin install command copied to clipboard!");
    setTimeout(() => {
      document.getElementById("copyStatus").textContent = "Copy";
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(onDone).catch(() => {
      fallbackCopy(code).then(onDone);
    });
  } else {
    fallbackCopy(code).then(onDone);
  }
});

// --- Quickshell Tabs ---
function switchTab(targetId) {
  document.querySelectorAll(".qml-tab").forEach(t => {
    if (t.getAttribute("data-tab") === targetId) t.classList.add("active");
    else t.classList.remove("active");
  });
  document.querySelectorAll(".tab-pane").forEach(p => {
    if (p.id === targetId) p.classList.add("active");
    else p.classList.remove("active");
  });
  if (targetId === "tab-leaderboard") {
    scrollToMyRig();
  }
}

document.querySelectorAll(".qml-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    playClick();
    const target = tab.getAttribute("data-tab");
    switchTab(target);
    if (history.replaceState) {
      history.replaceState(null, "", "#" + target.replace("tab-", ""));
    }
  });
});

const rawHash = window.location.hash.replace("#", "");
const cleanHash = rawHash.split("?")[0];
const urlParams = new URLSearchParams(window.location.search);
const hasMyRigQuery = !!urlParams.get("my") || window.location.hash.includes("my=");

if (hasMyRigQuery && (!rawHash || rawHash.includes("leaderboard") || rawHash.includes("my="))) {
  switchTab("tab-leaderboard");
} else if (cleanHash) {
  const targetTabId = cleanHash.startsWith("tab-") ? cleanHash : ("tab-" + cleanHash);
  if (document.getElementById(targetTabId)) {
    switchTab(targetTabId);
  }
}

// --- Rig Roaster 3000 ---
const roastDB = [
  {
    pattern: /(^|-)(ARC|A770|A750|B580|B570)(-|$)/i,
    title: "Intel Arc Underdog Hero",
    comment: "The Intel Arc driver engineers light a candle in your honor every morning. Thank you for your fearless service to open-source Mesa drivers!",
    tier: "Arc Vanguard"
  },
  {
    pattern: /(^|-)(5090|5080|4090|490|790|7900XTX)(-|$)/i,
    title: "NASA Thermal Wind Tunnel",
    comment: "Your municipal power substation reports a voltage sag whenever you compile a Rust kernel. Your rig doubles as central heating for a small village.",
    tier: "Apex Halo"
  },
  {
    pattern: /(^|-)(5070|5060|4080|4070|4060|7800XT|3070|3080)(-|$)/i,
    title: "Liquid Butter High-Refresh Beast",
    comment: "High-refresh DSC + heavy silicon. Wayland animations glide like liquid butter. Still blames lag on a 4ms ping spike.",
    tier: "Cyberpunk Beast"
  },
  {
    pattern: /(^|-)(CEL|INT|4G|8G|60H)(-|$)/i,
    title: "Certified Potato Toaster 1998",
    comment: "Opening four tabs in Firefox is considered an act of cyber terrorism against your RAM. When you compile, the fans scream in Morse code.",
    tier: "Potato Toaster"
  },
  {
    pattern: /(^|-)(240H|360H|480H|500H)(-|$)/i,
    title: "Competitive Sweatlord Optical Illusion",
    comment: "Your monitor refreshes faster than human optic synapses can fire. You still get one-tapped by a 12-year-old on an iPad with greasy fingers.",
    tier: "FPS Addict"
  },
  {
    pattern: /(^|-)(M1|M2|M3|M3P|M4|APPLE)(-|$)/i,
    title: "Asahi Silicon Sorcery",
    comment: "Running Wayland on Apple Silicon out of sheer defiance of Tim Cook. 18 hours of battery life, but good luck finding Vulkan raytracing drivers.",
    tier: "ARM Renegade"
  },
  {
    pattern: /(^|-)(32G|DDR5)(-|$)/i,
    title: "The Golden Ratio Daily Driver",
    comment: "Mathematically balanced, clean, and respectable. You actually close your browser tabs before sleep and your desk cable management is pristine.",
    tier: "Zen Master"
  }
];

function pickRoast(code) {
  if (!code) return null;
  for (const item of roastDB) {
    if (item.pattern.test(code)) return item;
  }
  return {
    title: "Exotic Cyberdeck Construct",
    comment: "A truly enigmatic silicon configuration. Even the Linux kernel had to consult StackOverflow before mounting your root filesystem.",
    tier: "Uncharted Spec"
  };
}

async function executeRoast(code) {
  if (!code) return;
  playRoastFx();
  const output = document.getElementById("roastResultBox");
  const title = document.getElementById("roastTitle");
  const tierBadge = document.getElementById("roastTierBadge");
  const text = document.getElementById("roastText");
  const rarity = document.getElementById("roastRarity");

  const info = pickRoast(code);
  title.innerHTML = `<span class="q-icon q-icon-red" style="margin-right:4px;">󰈸</span> ${escapeHtml(info.title)} <code style="font-size:0.75rem; color:var(--brand);">${escapeHtml(code)}</code>`;
  tierBadge.textContent = `${info.tier}`;
  text.textContent = `"${info.comment}"`;
  rarity.textContent = `󰓅 ${tr("rarityQuery")}`;

  output.style.display = "block";

  try {
    const res = await fetch(`/api/archetype/${encodeURIComponent(code)}`);
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.found) {
      rarity.textContent = `󰓅 ${tr("rarityFound").replace("{pct}", Number(data.percentage) || 0).replace("{count}", Number(data.count) || 0)}`;
    } else {
      rarity.textContent = `󰓅 ${tr("rarityRare")}`;
    }
  } catch(e) {
    // Never invent a rarity figure when the lookup fails
    rarity.textContent = `󰓅 ${tr("rarityError")}`;
  }
}

document.getElementById("roastBtn").addEventListener("click", () => {
  const val = document.getElementById("archetypeInput").value.trim();
  if (val) executeRoast(val);
});

document.getElementById("archetypeInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = e.target.value.trim();
    if (val) executeRoast(val);
  }
});

document.querySelectorAll(".chip-btn").forEach(chip => {
  chip.addEventListener("click", () => {
    const code = chip.getAttribute("data-code");
    document.getElementById("archetypeInput").value = code;
    executeRoast(code);
  });
});

const presetRigs = [
  "OMA-U7-4060-31G-240H",
  "OMA-U7-ARC-31G-240H",
  "OMA-R7-790-32G-240H",
  "OMA-I9-490-64G-360H",
  "OMA-CEL-INT-4G-60H",
  "OMA-M3-M3P-18G-120H"
];

document.getElementById("randomRigBtn").addEventListener("click", () => {
  const r = presetRigs[Math.floor(Math.random() * presetRigs.length)];
  document.getElementById("archetypeInput").value = r;
  executeRoast(r);
});

// --- Simulator ---

const tierQuotes = {
  "S+": "Renders reality in real time. Your power substation reports a voltage sag.",
  "S": "Compiles the Linux kernel in seconds and doubles as central heating.",
  "A": "High refresh DSC and liquid butter Wayland animations with zero drops.",
  "B": "Solid Linux gaming rig, esports ready at 144Hz-240Hz.",
  "C": "Reliable desktop or laptop that gets dev work done without whining.",
  "D": "Survives compile tasks with ZRAM and patience. Respectable efficiency.",
  "E": "Perfect for the terminal, Neovim and PDFs.",
  "F": "Fans scream in Morse code when opening two browser tabs. Still boots Omarchy!"
};

function tierForScore(score) {
  return omaMeta.tiers.find(x => score >= x.min) || omaMeta.tiers[omaMeta.tiers.length - 1];
}

function simValue(id) {
  const el = document.getElementById(id);
  return el ? (parseInt(el.value, 10) || 0) : 0;
}

function recalculateSimulator() {
  const w = omaMeta.weights;
  const total = (w.cpu + w.gpu + w.ram + w.mobo + w.display + w.storage) || 100;
  const raw = simValue("simCpu") * w.cpu + simValue("simGpu") * w.gpu + simValue("simRam") * w.ram +
    simValue("simMobo") * w.mobo + simValue("simDisp") * w.display + simValue("simStorage") * w.storage;
  const score = Math.min(100, Math.round(raw / total));
  document.getElementById("simScoreDisplay").textContent = score;

  const tier = tierForScore(score);
  const titleEl = document.getElementById("simTierTitle");
  titleEl.textContent = `${tier.icon} ${tier.grade} · ${tier.name}`;
  titleEl.style.color = tier.color || "";
  document.getElementById("simTierQuote").textContent = `"${tierQuotes[tier.grade] || ""}"`;
}

["simCpu", "simGpu", "simRam", "simMobo", "simStorage", "simDisp"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", () => {
    playClick();
    recalculateSimulator();
  });
});
recalculateSimulator();
simReady = true;

async function loadMeta() {
  try {
    const res = await fetch("/api/meta/v1");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.tiers) && data.tiers.length && data.weights) {
      omaMeta = { tiers: data.tiers, weights: data.weights };
      recalculateSimulator();
      if (lastStats) renderStats(lastStats);
    }
  } catch (e) {
    console.warn("Meta load failed, using built-in tiers:", e);
  }
}

// --- Leaderboard Event Listeners ---
let lbSearchTimer = null;
const lbSearchInput = document.getElementById("leaderboardSearch");
if (lbSearchInput) {
  lbSearchInput.addEventListener("input", (e) => {
    clearTimeout(lbSearchTimer);
    const value = e.target.value.trim().toLowerCase().slice(0, 40);
    lbSearchTimer = setTimeout(() => {
      if (value === currentLeaderboardSearch) return;
      currentLeaderboardSearch = value;
      fetchLeaderboard(true);
    }, 250);
  });
}

document.querySelectorAll("#lbFilters .lb-filter-btn").forEach(btn => {
  btn.setAttribute("type", "button");
  btn.addEventListener("click", () => {
    playClick();
    document.querySelectorAll("#lbFilters .lb-filter-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    currentLeaderboardFilter = btn.getAttribute("data-filter") || "all";
    fetchLeaderboard(true);
  });
});

const lbLoadMoreBtn = document.getElementById("lbLoadMore");
if (lbLoadMoreBtn) {
  lbLoadMoreBtn.addEventListener("click", () => {
    playClick();
    fetchLeaderboard(false);
  });
}

// --- Live Data Loader ---

async function loadData() {
  try {
    const res = await fetch("/api/stats/v1");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderStats(data);
  } catch(e) {
    console.error("Stats load failed:", e);
    document.getElementById("quickSummary").textContent = "● --";
  }
}

function renderStats(data) {
  lastStats = data;
  const total = data.total_submissions || 0;
  const noData = tr("noData");
  document.getElementById("totalSubmissions").textContent = total.toLocaleString();
  const avgGrade = data.average_grade ? ` [${data.average_grade}]` : "";
  document.getElementById("avgScore").textContent = total > 0 ? (Number(data.average_score).toFixed(2) + "/100" + avgGrade) : "--";
  document.getElementById("avgTier").textContent = total > 0 ? (data.average_tier || "--") : noData;

  const topGpu = (data.top_gpus && data.top_gpus.length > 0) ? data.top_gpus[0] : null;
  document.getElementById("topGpu").textContent = topGpu ? topGpu.model : "--";
  document.getElementById("topGpuShare").textContent = topGpu ? `${topGpu.percentage}% ${tr("share")}` : noData;

  const topDisp = (data.display_breakdown && data.display_breakdown.length > 0) ? data.display_breakdown[0] : null;
  document.getElementById("topDisplay").textContent = topDisp ? topDisp.resolution_hz : "--";
  document.getElementById("topDisplayShare").textContent = topDisp ? `${topDisp.percentage}% ${tr("share")}` : noData;

  document.getElementById("quickSummary").textContent = topGpu
    ? `● ${total.toLocaleString()} ${i18n[activeLang].lbTotalCount} | GPU: ${topGpu.model}`
    : `● ${total.toLocaleString()} ${i18n[activeLang].lbTotalCount}`;

  if (total > 0) {
    const scoreStr = `${Number(data.average_score).toFixed(1)}/100`;
    const statTexts = {
      tr: `${total.toLocaleString()} Doğrulanmış Battlestation • Ortalama OmaScore: ${scoreStr}`,
      en: `${total.toLocaleString()} Verified Battlestations • Mean OmaScore: ${scoreStr}`,
      de: `${total.toLocaleString()} Verifizierte Systeme • Mittlerer OmaScore: ${scoreStr}`,
      es: `${total.toLocaleString()} Sistemas Verificados • Media OmaScore: ${scoreStr}`,
      fr: `${total.toLocaleString()} Systèmes Vérifiés • Score Moyen: ${scoreStr}`,
      ja: `${total.toLocaleString()}台の検証済みシステム • 全体平均OmaScore: ${scoreStr}`
    };
    Object.keys(statTexts).forEach(l => { if (i18n[l]) i18n[l].tickerStatText = statTexts[l]; });
  } else {
    Object.keys(i18n).forEach(l => { i18n[l].tickerStatText = i18n[l].noData; });
  }
  // The GPU/CPU/welcome ticker items show live data, never the old placeholder figures.
  const topCpu = (data.top_cpus && data.top_cpus.length > 0) ? data.top_cpus[0] : null;
  const topBrand = (data.top_brands && data.top_brands.length > 0) ? data.top_brands[0] : null;
  Object.keys(i18n).forEach(l => {
    const d = i18n[l];
    if (!d._welcomeSuffix) d._welcomeSuffix = (d.tickerWelcomeText.split(" — ")[1] || "");
    d.tickerGpuText = topGpu ? `${topGpu.model} (${topGpu.percentage}%)` : d.noData;
    d.tickerCpuText = topCpu ? `${topCpu.model} (${topCpu.percentage}%)` : d.noData;
    const rig = topBrand ? (topBrand.model && topBrand.model !== topBrand.brand ? `${topBrand.brand} ${topBrand.model}` : topBrand.brand) : "Omarchy";
    d.tickerWelcomeText = `${rig} — ${d._welcomeSuffix}`;
  });
  renderTicker(activeLang);

  renderProgress("gpuChart", data.top_gpus, "var(--brand)");
  renderProgress("cpuChart", data.top_cpus, "var(--purple)");
  renderProgress("ramChart", data.ram_breakdown, "var(--cyan)");
  renderProgress("displayChart", data.display_breakdown, "var(--amber)");
  renderProgress("brandChart", data.top_brands, "var(--green)");
  renderHistogram(data.score_histogram || []);
  renderTiers(data.tier_distribution || [], total);
  hideDecorativeIcons();
}

function renderEmpty(box) {
  box.innerHTML = `<div class="chart-empty">${escapeHtml(tr("noData"))}</div>`;
}

function renderProgress(elId, items, color) {
  const box = document.getElementById(elId);
  if (!box) return;
  box.innerHTML = "";
  if (!items || items.length === 0) {
    renderEmpty(box);
    return;
  }

  items.slice(0, 5).forEach(item => {
    let name = item.model || item.bucket || item.resolution_hz || "Unknown";
    if (item.brand) {
      name = item.model && item.model !== item.brand ? `${item.brand} • ${item.model}` : item.brand;
    }
    const pct = Number(item.percentage) || 0;
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `
      <div class="progress-meta">
        <span class="meta-name">${escapeHtml(name)}</span>
        <span class="meta-pct">${pct}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.min(100, Math.max(0, pct))}%; background: ${color};"></div>
      </div>
    `;
    box.appendChild(row);
  });
}

// 10 buckets of 10 points (the last one is 90-100) from the per-score counts.
function renderHistogram(rows) {
  const box = document.getElementById("scoreHistogram");
  if (!box) return;
  const buckets = new Array(10).fill(0);
  rows.forEach(r => {
    const score = Math.max(0, Math.min(100, Number(r.score) || 0));
    buckets[Math.min(9, Math.floor(score / 10))] += Number(r.count) || 0;
  });
  const sum = buckets.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    box.innerHTML = `<div class="chart-empty">${escapeHtml(tr("histEmpty"))}</div>`;
    box.setAttribute("aria-label", tr("histEmpty"));
    return;
  }
  const max = Math.max(...buckets);
  box.innerHTML = buckets.map((count, i) => {
    const lo = i * 10;
    const hi = i === 9 ? 100 : lo + 9;
    const tier = tierForScore(lo + 5);
    const h = Math.max(2, Math.round((count / max) * 100));
    return `
      <div class="hist-col" title="${lo}-${hi}: ${count}">
        <span class="hist-count">${count || ""}</span>
        <div class="hist-bar" style="height: ${h}%; background: ${escapeHtml(tier.color)};"></div>
        <span class="hist-label">${lo}</span>
      </div>
    `;
  }).join("");
  box.setAttribute("aria-label", `${tr("chartHist")}: ` + buckets.map((c, i) => `${i * 10}-${i === 9 ? 100 : i * 10 + 9}: ${c}`).join(", "));
}

function renderTiers(distribution, total) {
  const grid = document.getElementById("tierGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const byName = {};
  (distribution || []).forEach(d => { byName[d.tier_name] = d; });
  const tiers = omaMeta.tiers;
  tiers.forEach((tier, i) => {
    const upper = i === 0 ? 100 : tiers[i - 1].min - 1;
    const d = byName[tier.name];
    const pct = total > 0 && d ? Number(d.percentage) || 0 : 0;
    const c = document.createElement("div");
    c.className = "qml-tier-card";
    c.innerHTML = `
      <div class="tier-header">
        <span class="tier-name"><span class="q-icon" style="color:${escapeHtml(tier.color)}">${escapeHtml(tier.icon)}</span> ${escapeHtml(tier.grade)} · ${escapeHtml(tier.name)}</span>
        <span class="tier-share">${total > 0 ? pct + "%" : "--"}</span>
      </div>
      <div class="tier-lore">OmaScore ${tier.min}-${upper} • ${escapeHtml(tierQuotes[tier.grade] || "")}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.min(100, Math.max(0, pct))}%; background: ${escapeHtml(tier.color)};"></div>
      </div>
    `;
    grid.appendChild(c);
  });
}

renderTiers([], 0);
loadMeta();
loadData();
fetchLeaderboard(true);
hideDecorativeIcons();
