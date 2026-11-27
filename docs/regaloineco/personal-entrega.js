/* ==========================================================================
   INECO — Teatro de Entregas Personalizadas (personal-entrega.js)
   Self-contained Personalized Video Delivery Theater
   Public API: window.PersonalEntrega = { open(personId?), close(), getPeople() }
   Deep-link: #entrega=<id-or-name>
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'ineco_personal_entrega_v1';
  const MUTE_KEY = 'ineco_personal_entrega_muted';
  const WATCHED_KEY = 'ineco_pe_watched_v1';

  function loadWatchedSet() {
    try {
      const arr = JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function markWatched(personId) {
    if (!personId) return;
    const set = loadWatchedSet();
    if (!set.has(personId)) {
      set.add(personId);
      try {
        localStorage.setItem(WATCHED_KEY, JSON.stringify([...set]));
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent('pe-video-watched', { detail: { id: personId } }));
    }
  }

  const encodeAsset = (dir, file) => (file ? `${dir}/${encodeURIComponent(file)}` : null);

  const shuffleArray = (arr) => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const normalizeKey = (str) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const DEFAULT_TITLE = 'Una entrega muy especial de INECO...';

  // Exact filenames from Mesa/ and Videos/Entrega/
  const RAW_PEOPLE = [
    {
      id: 'ana',
      name: 'Ana',
      photoFile: 'Ana.jpg',
      videoFile: 'Ana.mp4',
      defaultMessage:
        'Gracias por tu energía, tu cercanía y por hacer que cada proyecto brille con luz propia. ¡Que disfrutes muchísimo de esta Navidad!'
    },
    {
      id: 'edu',
      name: 'Edu',
      photoFile: 'Edu.jpg',
      videoFile: 'Edu.mp4',
      defaultMessage:
        'Por otro año compartiendo retos, soluciones y grandes momentos en equipo. ¡Feliz Navidad y un 2027 lleno de éxitos!'
    },
    {
      id: 'gloria',
      name: 'Gloria',
      photoFile: 'Gloria.jpg',
      videoFile: 'Gloria.mp4',
      defaultMessage:
        'Tu dedicación y tu sonrisa hacen que el día a día sea mucho mejor. Aquí tienes un pequeño detalle pensado especialmente para ti.'
    },
    {
      id: 'irene',
      name: 'Irene',
      photoFile: 'Irene.jpg',
      videoFile: 'Irene.mp4',
      defaultMessage:
        'Gracias por aportar siempre calma, talento y compañerismo. ¡Te deseamos unas fiestas mágicas y un año nuevo extraordinario!'
    },
    {
      id: 'jose-luis',
      name: 'Jose Luis',
      photoFile: 'Jose Luis.jpg',
      videoFile: 'Jose Luis.mp4',
      defaultMessage:
        'Un año más recorriendo esta vía juntos con la mejor compañía. ¡Que esta Navidad te traiga salud, alegría y grandes momentos!'
    },
    {
      id: 'manuel',
      name: 'Manuel',
      photoFile: 'Manuel.jpg',
      videoFile: 'Manuel.mp4',
      defaultMessage:
        'Gracias por tu compromiso, tu buen humor y por estar siempre al pie del cañón. ¡Feliz Navidad y próspero 2027!'
    },
    {
      id: 'pepe',
      name: 'Pepe',
      photoFile: 'Pepe.jpg',
      videoFile: 'Pepe.mp4',
      defaultMessage:
        'Por tu experiencia, tu apoyo constante y los buenos ratos compartidos este año. ¡Disfruta de tu entrega navideña!'
    },
    {
      id: 'raul',
      name: 'Raúl',
      photoFile: 'Raul.jpg',
      videoFile: 'Raúl.mp4',
      defaultMessage:
        'Gracias por sumar siempre con entusiasmo y profesionalidad. ¡Que estas fiestas sean tan especiales como te mereces!'
    },
    {
      id: 'ernesto',
      name: 'Ernesto',
      photoFile: 'Ernesto.jpg',
      videoFile: 'Ernesto.mp4',
      defaultMessage:
        'Gracias por tu precisión, tu entrega y tu compañerismo en cada jornada. ¡Recibe todo nuestro cariño y los mejores deseos del equipo INECO para esta Navidad!'
    },
    {
      id: 'ivan-de-la-paz',
      name: 'Iván de la Paz',
      photoFile: 'Iván de la Paz.jpg',
      videoFile: 'Iván de la Paz.mp4',
      defaultMessage:
        '¡Gracias por impulsar y hacer posible esta experiencia tan especial! Que la magia de la Navidad te devuelva multiplicada toda tu ilusión.'
    },
    {
      id: 'ivan-alvarez',
      name: 'Iván Álvarez',
      photoFile: 'Iván Álvarez.jpg',
      videoFile: 'Iván Alvarez.mp4',
      defaultMessage:
        'Por tu talento, tu buen hacer y la energía que aportas al equipo cada día. ¡Te deseamos unas fiestas inolvidables y un 2027 repleto de grandes proyectos!'
    },
    {
      id: 'pascual',
      name: 'Pascual',
      photoFile: 'Pascual.jpg',
      videoFile: 'Pascual.mp4',
      defaultMessage:
        'Gracias por cuidar siempre de todos y por tu apoyo incondicional en cada proyecto. ¡Feliz Navidad y nuestros mejores deseos para el nuevo año!'
    }
  ];

  const PEOPLE = RAW_PEOPLE.map((p) => ({
    ...p,
    photo: encodeAsset('Mesa', p.photoFile),
    video: encodeAsset('Videos/Entrega', p.videoFile),
    hasVideo: Boolean(p.videoFile)
  }));

  // Session-only local video previews (via File Picker in Director's Drawer)
  const localVideoUrls = new Map();

  // Persistent customization store
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        globalTheme: parsed.globalTheme || 'gala-dorada',
        people: parsed.people && typeof parsed.people === 'object' ? parsed.people : {}
      };
    } catch {
      return { globalTheme: 'gala-dorada', people: {} };
    }
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore quota / private mode errors
    }
  }

  let store = loadStore();

  function getPersonConfig(person) {
    const custom = store.people[person.id] || {};
    return {
      title: custom.title || DEFAULT_TITLE,
      message: custom.message || person.defaultMessage,
      theme: custom.theme || store.globalTheme || 'gala-dorada'
    };
  }

  function getEffectiveVideo(person) {
    if (localVideoUrls.has(person.id)) {
      return { url: localVideoUrls.get(person.id), isLocal: true };
    }
    if (person.video) {
      return { url: person.video, isLocal: false };
    }
    return { url: null, isLocal: false };
  }

  function findPerson(query) {
    if (!query) return null;
    const norm = normalizeKey(query);
    return (
      PEOPLE.find((p) => p.id === norm) ||
      PEOPLE.find((p) => normalizeKey(p.name) === norm) ||
      PEOPLE.find((p) => normalizeKey(p.name).startsWith(norm)) ||
      null
    );
  }

  // ========================================================================
  // Web Audio API Synthesized Festive Chimes & Fanfare (Zero external audio)
  // ========================================================================
  const SoundEngine = {
    ctx: null,
    muted: (() => {
      try {
        return localStorage.getItem(MUTE_KEY) === '1';
      } catch {
        return false;
      }
    })(),

    ensure() {
      if (this.muted) return null;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!this.ctx) this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      } catch {
        return null;
      }
    },

    setMuted(flag) {
      this.muted = Boolean(flag);
      try {
        localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
      } catch {
        // ignore
      }
    },

    playTone(freq, startTime, duration, type = 'triangle', peak = 0.08) {
      const ctx = this.ctx;
      if (!ctx || this.muted) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.04);
      } catch {
        // ignore
      }
    },

    playCurtainShimmer() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime + 0.02;
      // Warm ascending harp arpeggio (C major 9)
      const notes = [261.63, 329.63, 392.0, 493.88, 587.33, 783.99];
      notes.forEach((f, idx) => {
        this.playTone(f, now + idx * 0.09, 0.9, 'sine', 0.045);
      });
    },

    playGiftFanfare() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime + 0.02;
      // Festive orchestral bells + warm pad chord
      const chord = [261.63, 329.63, 392.0, 523.25];
      chord.forEach((f) => this.playTone(f, now, 1.9, 'triangle', 0.04));
      // Sparkling chime melody
      const melody = [
        { f: 523.25, t: 0.0, d: 0.7 },
        { f: 659.25, t: 0.14, d: 0.7 },
        { f: 783.99, t: 0.28, d: 0.85 },
        { f: 1046.5, t: 0.44, d: 1.4 },
        { f: 1318.5, t: 0.62, d: 1.2 }
      ];
      melody.forEach((n) => {
        this.playTone(n.f, now + n.t, n.d, 'sine', 0.065);
        this.playTone(n.f * 2, now + n.t, n.d * 0.6, 'sine', 0.018);
      });
    },

    playBellTap() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      this.playTone(880, now, 0.35, 'sine', 0.05);
      this.playTone(1318.5, now + 0.05, 0.45, 'sine', 0.035);
    }
  };

  // ========================================================================
  // HTML5 Canvas Snow, Bokeh & Golden Burst Particle Engine
  // ========================================================================
  const ParticleFX = {
    canvas: null,
    ctx: null,
    rafId: null,
    width: 0,
    height: 0,
    snow: [],
    bursts: [],
    running: false,

    attach(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
      this.initSnow();
    },

    resize() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.floor(this.width * dpr);
      this.canvas.height = Math.floor(this.height * dpr);
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    },

    initSnow() {
      this.snow = [];
      const count = Math.min(68, Math.max(32, Math.floor(window.innerWidth / 22)));
      for (let i = 0; i < count; i++) {
        this.snow.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          r: Math.random() * 2.6 + 0.8,
          vy: Math.random() * 0.75 + 0.25,
          vx: (Math.random() - 0.5) * 0.4,
          alpha: Math.random() * 0.55 + 0.2,
          isGold: Math.random() < 0.28,
          phase: Math.random() * Math.PI * 2
        });
      }
    },

    burst(cx, cy, count = 85) {
      const colors = ['#fde68a', '#d4af37', '#ffffff', '#f59e0b', '#fb7185', '#93c5fd'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7.5 + 2.2;
        this.bursts.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.2,
          size: Math.random() * 4.5 + 2,
          color: colors[i % colors.length],
          alpha: 1,
          decay: Math.random() * 0.014 + 0.011,
          gravity: 0.11,
          shape: Math.random() < 0.45 ? 'star' : 'circle',
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.18
        });
      }
    },

    start() {
      if (this.running) return;
      this.running = true;
      const tick = () => {
        if (!this.running) return;
        this.draw();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    },

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    },

    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, this.width, this.height);

      // Gentle snow & golden bokeh
      for (let i = 0; i < this.snow.length; i++) {
        const p = this.snow[i];
        p.phase += 0.015;
        p.x += p.vx + Math.sin(p.phase) * 0.35;
        p.y += p.vy;
        if (p.y > this.height + 10) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
        if (p.x > this.width + 10) p.x = -10;
        if (p.x < -10) p.x = this.width + 10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold
          ? `rgba(253, 230, 138, ${p.alpha})`
          : `rgba(241, 245, 249, ${p.alpha})`;
        ctx.fill();
      }

      // Burst particles
      for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += b.gravity;
        b.vx *= 0.985;
        b.alpha -= b.decay;
        b.rot += b.vrot;

        if (b.alpha <= 0) {
          this.bursts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, b.alpha);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;

        if (b.shape === 'star') {
          ctx.beginPath();
          const spikes = 4;
          const outer = b.size * 1.35;
          const inner = b.size * 0.48;
          for (let s = 0; s < spikes * 2; s++) {
            const rad = s % 2 === 0 ? outer : inner;
            const ang = (s * Math.PI) / spikes;
            const sx = Math.cos(ang) * rad;
            const sy = Math.sin(ang) * rad;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, b.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  };

  // ========================================================================
  // Theater State & DOM Controller
  // ========================================================================
  const state = {
    mounted: false,
    isOpen: false,
    view: 'gallery', // 'gallery' | 'intro' | 'player'
    currentPerson: null,
    filter: 'all', // 'all' | 'ready' | 'pending'
    search: '',
    festiveFrame: true,
    ambianceOn: true,
    drawerOpen: false,
    introTimers: [],
    introProgressRaf: null
  };

  const els = {};

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('pe-show');
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(() => {
      els.toast.classList.remove('pe-show');
    }, 2600);
  }

  function buildShareUrl(person) {
    const base = window.location.href.split('#')[0];
    return `${base}#entrega=${encodeURIComponent(person.id)}`;
  }

  function copyPersonLink(person) {
    const url = buildShareUrl(person);
    SoundEngine.playBellTap();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast(`¡Enlace personalizado de ${person.name} copiado!`))
        .catch(() => fallbackCopy(url, person.name));
    } else {
      fallbackCopy(url, person.name);
    }
  }

  function fallbackCopy(text, name) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`¡Enlace personalizado de ${name} copiado!`);
    } catch {
      showToast(`Enlace: #entrega=${name}`);
    }
  }

  function clearIntroTimers() {
    state.introTimers.forEach((id) => clearTimeout(id));
    state.introTimers = [];
    if (state.introProgressRaf) {
      cancelAnimationFrame(state.introProgressRaf);
      state.introProgressRaf = null;
    }
  }

  function applyTheme(themeName) {
    if (!els.overlay) return;
    els.overlay.setAttribute('data-pe-theme', themeName || 'gala-dorada');
  }

  function updateSoundButton() {
    if (!els.soundBtn) return;
    els.soundBtn.innerHTML = SoundEngine.muted ? '🔇' : '🔊';
    els.soundBtn.title = SoundEngine.muted ? 'Activar música y efectos' : 'Silenciar efectos';
  }

  // ========================================================================
  // DOM Mounting (Lazy, On-Demand)
  // ========================================================================
  function mountOverlay() {
    if (state.mounted) return;
    state.mounted = true;

    const overlay = document.createElement('div');
    overlay.id = 'pe-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Teatro de Entregas Personalizadas INECO');
    overlay.setAttribute('data-pe-theme', store.globalTheme || 'gala-dorada');

    overlay.innerHTML = `
      <div class="pe-bg-glow"></div>
      <canvas id="pe-fx-canvas"></canvas>

      <header class="pe-topbar">
        <div class="pe-brand">
          <div class="pe-brand-logo">
            <img src="assets/Logo-Ineco.png" alt="INECO">
          </div>
          <div class="pe-brand-text">
            <div class="pe-brand-title">Entregas Personalizadas 2026</div>
          </div>
        </div>

        <div class="pe-topbar-actions">
          <button type="button" class="pe-btn pe-hidden" id="pe-back-btn" title="Volver a la galería">
            <span>←</span><span class="pe-btn-label-sm-hide">Galería</span>
          </button>
          <button type="button" class="pe-btn pe-btn-icon" id="pe-sound-btn" title="Activar/Silenciar sonido">🔊</button>
          <button type="button" class="pe-btn pe-btn-icon pe-btn-close" id="pe-close-btn" title="Cerrar teatro (Esc)">✕</button>
        </div>
      </header>

      <div class="pe-body" id="pe-body">
        <!-- GALLERY VIEW -->
        <section class="pe-gallery-view" id="pe-gallery-view">
          <div class="pe-gallery-hero">
            <div class="pe-eyebrow">🎬 Gala de Navidad INECO 2026</div>
            <h2>Tu Video Personalizado de Entrega</h2>
            <p>Selecciona tu nombre para abrir el telón y descubrir tu saludo navideño personalizado, o copia el enlace directo para compartirlo con cada compañero.</p>
          </div>

          <div class="pe-grid" id="pe-grid"></div>
        </section>

        <!-- THEATER VIEW (Intro + Video Player / Fallback) -->
        <section class="pe-theater-view pe-hidden" id="pe-theater-view">
          <!-- CINEMATIC INTRO STAGE -->
          <div class="pe-intro-stage pe-hidden" id="pe-intro-stage">
            <div class="pe-spotlights"></div>
            <div class="pe-curtain pe-curtain-left"></div>
            <div class="pe-curtain pe-curtain-right"></div>

            <div class="pe-gift-scene" id="pe-gift-scene">
              <div class="pe-intro-kicker" id="pe-intro-kicker">UNA ENTREGA MUY ESPECIAL DE INECO...</div>
              <div class="pe-gift-box" id="pe-gift-box" title="Haz clic para abrir tu entrega">
                <div class="pe-gift-glow"></div>
                <div class="pe-gift-lid"><div class="pe-gift-bow"></div></div>
                <div class="pe-gift-base"></div>
              </div>
              <div class="pe-gift-hint">Abriendo tu regalo navideño...</div>
            </div>

            <div class="pe-reveal-scene" id="pe-reveal-scene">
              <div class="pe-wreath-wrap">
                <div class="pe-wreath-halo"></div>
                <svg class="pe-wreath-svg" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                  <circle cx="100" cy="100" r="88" stroke="url(#peGoldGrad)" stroke-width="2.5" stroke-dasharray="6 6" opacity="0.85"/>
                  <circle cx="100" cy="100" r="80" stroke="url(#peGoldGrad)" stroke-width="1.5" opacity="0.5"/>
                  <g fill="#FDE68A">
                    <circle cx="100" cy="12" r="4.5"/>
                    <circle cx="188" cy="100" r="4.5"/>
                    <circle cx="100" cy="188" r="4.5"/>
                    <circle cx="12" cy="100" r="4.5"/>
                    <circle cx="38" cy="38" r="3"/>
                    <circle cx="162" cy="38" r="3"/>
                    <circle cx="162" cy="162" r="3"/>
                    <circle cx="38" cy="162" r="3"/>
                  </g>
                  <defs>
                    <linearGradient id="peGoldGrad" x1="0" y1="0" x2="200" y2="200">
                      <stop offset="0%" stop-color="#FEF08A"/>
                      <stop offset="50%" stop-color="#D4AF37"/>
                      <stop offset="100%" stop-color="#CB1823"/>
                    </linearGradient>
                  </defs>
                </svg>
                <img id="pe-reveal-portrait" class="pe-reveal-portrait" src="" alt="">
              </div>
              <div class="pe-reveal-subtitle" id="pe-reveal-subtitle">UNA ENTREGA MUY ESPECIAL DE INECO</div>
              <h2 class="pe-reveal-headline" id="pe-reveal-headline">¡Feliz Navidad!</h2>
              <p class="pe-reveal-dedication" id="pe-reveal-dedication"></p>
              <button type="button" class="pe-btn pe-btn-primary" id="pe-enter-now-btn">▶ Ver entrega ahora</button>
            </div>

            <div class="pe-intro-footer">
              <div class="pe-intro-progress-track">
                <div class="pe-intro-progress-fill" id="pe-intro-progress-fill"></div>
              </div>
              <button type="button" class="pe-btn" id="pe-skip-intro-btn">Saltar intro →</button>
            </div>
          </div>

          <!-- VIDEO PLAYER & FALLBACK STAGE -->
          <div class="pe-player-stage pe-hidden" id="pe-player-stage">
            <div class="pe-cinema-bezel" id="pe-cinema-bezel">
              <div class="pe-corner pe-corner-tl"></div>
              <div class="pe-corner pe-corner-tr"></div>
              <div class="pe-corner pe-corner-bl"></div>
              <div class="pe-corner pe-corner-br"></div>

              <div class="pe-cinema-inner">
                <!-- VIDEO WRAP -->
                <div id="pe-video-mode">
                  <div class="pe-video-wrap" id="pe-video-wrap">
                    <video id="pe-video" playsinline preload="metadata"></video>
                    <div class="pe-video-overlay pe-hidden" id="pe-video-overlay">
                      <button type="button" class="pe-big-play" id="pe-big-play-btn" aria-label="Reproducir video">▶</button>
                      <div id="pe-overlay-caption" style="font-weight:700;color:#fde68a;font-size:0.95rem;">Pulsa para reproducir tu video</div>
                      <div class="pe-end-actions pe-hidden" id="pe-end-actions">
                        <button type="button" class="pe-btn pe-btn-primary" id="pe-end-replay-btn">↺ Ver de nuevo</button>
                        <button type="button" class="pe-btn" id="pe-end-next-btn">⏭️ Siguiente</button>
                        <button type="button" class="pe-btn" id="pe-end-intro-btn">✨ Repetir intro</button>
                        <button type="button" class="pe-btn" id="pe-end-gallery-btn">👥 Ver compañeros</button>
                      </div>
                    </div>
                  </div>

                  <div class="pe-controls">
                    <div class="pe-scrubber-row">
                      <span class="pe-time" id="pe-time-cur">0:00</span>
                      <input type="range" id="pe-scrubber" class="pe-range" min="0" max="100" step="0.1" value="0" aria-label="Progreso del video">
                      <span class="pe-time" id="pe-time-dur">0:00</span>
                    </div>
                    <div class="pe-controls-row">
                      <div class="pe-controls-group">
                        <button type="button" class="pe-btn pe-btn-primary" id="pe-play-btn">▶ Reproducir</button>
                        <button type="button" class="pe-btn pe-btn-icon" id="pe-vid-mute-btn" title="Silenciar video">🔊</button>
                        <input type="range" id="pe-vol-slider" class="pe-range pe-vol-range" min="0" max="1" step="0.05" value="1" aria-label="Volumen">
                      </div>
                      <div class="pe-controls-group">
                        <button type="button" class="pe-btn" id="pe-subtitles-btn" aria-expanded="true" title="Mostrar u ocultar subtítulos del mensaje">💬 Ocultar subtítulos</button>
                        <button type="button" class="pe-btn" id="pe-replay-intro-btn" title="Repetir intro cinematográfica">✨ Repetir intro</button>
                        <button type="button" class="pe-btn pe-btn-icon" id="pe-fs-btn" title="Pantalla completa">⛶</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- PENDING FALLBACK CARD -->
                <div class="pe-fallback-card pe-hidden" id="pe-fallback-mode">
                  <img id="pe-fallback-portrait" class="pe-fallback-portrait" src="" alt="">
                  <div class="pe-badge pe-badge-pending" style="margin-bottom:12px;">✨ Video en producción · Próximamente</div>
                  <h3 id="pe-fallback-title">¡Feliz Navidad!</h3>
                  <p id="pe-fallback-msg"></p>
                  <div class="pe-fallback-actions">
                    <button type="button" class="pe-btn pe-btn-primary" id="pe-fallback-confetti-btn">🎉 Lanzar magia navideña</button>
                    <button type="button" class="pe-btn" id="pe-fallback-replay-btn">✨ Repetir intro</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- RECIPIENT FOOTER BAR -->
            <div class="pe-recipient-bar">
              <div class="pe-recipient-info">
                <img id="pe-recipient-thumb" class="pe-recipient-thumb" src="" alt="">
                <div style="min-width:0;">
                  <h4 class="pe-recipient-name" id="pe-recipient-name"></h4>
                  <p class="pe-recipient-dedication" id="pe-recipient-dedication"></p>
                </div>
              </div>
              <div class="pe-controls-group">
                <button type="button" class="pe-btn" id="pe-next-person-btn" title="Ir al siguiente compañero">⏭️ Siguiente</button>
                <button type="button" class="pe-btn" id="pe-share-current-btn" title="Compartir enlace por WhatsApp o sistema">📤 Compartir</button>
                <button type="button" class="pe-btn" id="pe-copy-current-btn">🔗 Copiar enlace</button>
                <button type="button" class="pe-btn pe-btn-primary" id="pe-download-current-btn" title="Descargar video personalizado">⬇️ Descargar video</button>
              </div>
            </div>

            <!-- TRANSCRIPT / SUBTITLES BOX -->
            <div class="pe-transcript-box" id="pe-transcript-box" aria-live="polite">
              <strong>🎄 Mensaje Navideño · Subtítulos</strong>
              <span id="pe-transcript-text"></span>
            </div>
          </div>
        </section>
      </div>

      <div class="pe-toast" id="pe-toast" role="status" aria-live="polite"></div>
    `;

    document.body.appendChild(overlay);
    cacheElements(overlay);
    bindEvents();
    ParticleFX.attach(els.canvas);
    updateSoundButton();
  }

  function cacheElements(root) {
    const q = (sel) => root.querySelector(sel);
    els.overlay = root;
    els.canvas = q('#pe-fx-canvas');
    els.backBtn = q('#pe-back-btn');
    els.soundBtn = q('#pe-sound-btn');
    els.closeBtn = q('#pe-close-btn');
    els.body = q('#pe-body');

    els.galleryView = q('#pe-gallery-view');
    els.grid = q('#pe-grid');

    els.theaterView = q('#pe-theater-view');
    els.introStage = q('#pe-intro-stage');
    els.introKicker = q('#pe-intro-kicker');
    els.giftBox = q('#pe-gift-box');
    els.revealPortrait = q('#pe-reveal-portrait');
    els.revealSubtitle = q('#pe-reveal-subtitle');
    els.revealHeadline = q('#pe-reveal-headline');
    els.revealDedication = q('#pe-reveal-dedication');
    els.enterNowBtn = q('#pe-enter-now-btn');
    els.skipIntroBtn = q('#pe-skip-intro-btn');
    els.introProgressFill = q('#pe-intro-progress-fill');

    els.playerStage = q('#pe-player-stage');
    els.cinemaBezel = q('#pe-cinema-bezel');
    els.videoMode = q('#pe-video-mode');
    els.videoWrap = q('#pe-video-wrap');
    els.video = q('#pe-video');
    els.videoOverlay = q('#pe-video-overlay');
    els.bigPlayBtn = q('#pe-big-play-btn');
    els.overlayCaption = q('#pe-overlay-caption');
    els.endActions = q('#pe-end-actions');
    els.endReplayBtn = q('#pe-end-replay-btn');
    els.endNextBtn = q('#pe-end-next-btn');
    els.endIntroBtn = q('#pe-end-intro-btn');
    els.endGalleryBtn = q('#pe-end-gallery-btn');

    els.timeCur = q('#pe-time-cur');
    els.timeDur = q('#pe-time-dur');
    els.scrubber = q('#pe-scrubber');
    els.playBtn = q('#pe-play-btn');
    els.vidMuteBtn = q('#pe-vid-mute-btn');
    els.volSlider = q('#pe-vol-slider');
    els.subtitlesBtn = q('#pe-subtitles-btn');
    els.replayIntroBtn = q('#pe-replay-intro-btn');
    els.fsBtn = q('#pe-fs-btn');

    els.fallbackMode = q('#pe-fallback-mode');
    els.fallbackPortrait = q('#pe-fallback-portrait');
    els.fallbackTitle = q('#pe-fallback-title');
    els.fallbackMsg = q('#pe-fallback-msg');
    els.fallbackConfettiBtn = q('#pe-fallback-confetti-btn');
    els.fallbackReplayBtn = q('#pe-fallback-replay-btn');

    els.recipientThumb = q('#pe-recipient-thumb');
    els.recipientName = q('#pe-recipient-name');
    els.recipientDedication = q('#pe-recipient-dedication');
    els.nextPersonBtn = q('#pe-next-person-btn');
    els.shareCurrentBtn = q('#pe-share-current-btn');
    els.copyCurrentBtn = q('#pe-copy-current-btn');
    els.downloadCurrentBtn = q('#pe-download-current-btn');
    els.transcriptBox = q('#pe-transcript-box');
    els.transcriptText = q('#pe-transcript-text');

    els.toast = q('#pe-toast');
  }

  function bindEvents() {
    window.addEventListener('resize', () => {
      if (state.isOpen) ParticleFX.resize();
    });

    document.addEventListener('keydown', (e) => {
      if (!state.isOpen) return;
      if (e.key === 'Escape') {
        closeTheater();
      }
    });

    els.closeBtn.addEventListener('click', closeTheater);
    els.backBtn.addEventListener('click', () => showGallery());

    els.soundBtn.addEventListener('click', () => {
      SoundEngine.setMuted(!SoundEngine.muted);
      updateSoundButton();
      if (!SoundEngine.muted) SoundEngine.playBellTap();
    });

    // Intro controls
    els.giftBox.addEventListener('click', () => {
      if (state.view === 'intro' && state.currentPerson) {
        triggerGiftRevealPhase();
      }
    });

    els.skipIntroBtn.addEventListener('click', () => transitionToPlayer());
    els.enterNowBtn.addEventListener('click', () => transitionToPlayer());

    // Video player events
    const vid = els.video;
    const togglePlay = () => {
      if (vid.paused || vid.ended) {
        vid.play().catch(() => {
          showVideoOverlay('Pulsa para reproducir tu video', false);
        });
      } else {
        vid.pause();
      }
    };

    vid.addEventListener('click', togglePlay);
    els.playBtn.addEventListener('click', togglePlay);
    els.bigPlayBtn.addEventListener('click', togglePlay);

    vid.addEventListener('play', () => {
      els.playBtn.textContent = '⏸ Pausar';
      els.videoOverlay.classList.add('pe-hidden');
      els.endActions.classList.add('pe-hidden');
      if (state.currentPerson) markWatched(state.currentPerson.id);
      window.dispatchEvent(new CustomEvent('pe-video-play'));
    });

    vid.addEventListener('pause', () => {
      els.playBtn.textContent = '▶ Reproducir';
    });

    vid.addEventListener('loadedmetadata', () => {
      els.timeDur.textContent = formatTime(vid.duration);
      els.scrubber.max = vid.duration || 100;
    });

    vid.addEventListener('timeupdate', () => {
      els.timeCur.textContent = formatTime(vid.currentTime);
      if (vid.duration) {
        els.scrubber.value = vid.currentTime;
      }
    });

    vid.addEventListener('ended', () => {
      els.playBtn.textContent = '↺ Repetir';
      ParticleFX.burst(window.innerWidth * 0.5, window.innerHeight * 0.45, 95);
      SoundEngine.playGiftFanfare();
      showVideoOverlay(`¡Feliz Navidad, ${state.currentPerson ? state.currentPerson.name : ''}!`, true);
    });

    els.scrubber.addEventListener('input', () => {
      if (vid.duration) {
        vid.currentTime = Number(els.scrubber.value);
      }
    });

    els.vidMuteBtn.addEventListener('click', () => {
      vid.muted = !vid.muted;
      els.vidMuteBtn.textContent = vid.muted || vid.volume === 0 ? '🔇' : '🔊';
    });

    els.volSlider.addEventListener('input', () => {
      vid.volume = Number(els.volSlider.value);
      vid.muted = vid.volume === 0;
      els.vidMuteBtn.textContent = vid.muted ? '🔇' : '🔊';
    });

    els.replayIntroBtn.addEventListener('click', () => {
      if (state.currentPerson) startPersonExperience(state.currentPerson);
    });

    els.fsBtn.addEventListener('click', () => {
      const target = els.cinemaBezel;
      if (!document.fullscreenElement) {
        (target.requestFullscreen || target.webkitRequestFullscreen || (() => {})).call(target);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
      }
    });

    els.endReplayBtn.addEventListener('click', () => {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    });
    const goToNextPerson = () => {
      if (!state.currentPerson) return;
      const idx = PEOPLE.findIndex((p) => p.id === state.currentPerson.id);
      const next = PEOPLE[(idx + 1) % PEOPLE.length];
      if (next) startPersonExperience(next);
    };
    els.endNextBtn.addEventListener('click', goToNextPerson);
    els.nextPersonBtn.addEventListener('click', goToNextPerson);
    els.endIntroBtn.addEventListener('click', () => {
      if (state.currentPerson) startPersonExperience(state.currentPerson);
    });
    els.endGalleryBtn.addEventListener('click', () => showGallery());

    els.subtitlesBtn.addEventListener('click', () => {
      const isHidden = els.transcriptBox.classList.toggle('pe-hidden');
      els.subtitlesBtn.setAttribute('aria-expanded', String(!isHidden));
      els.subtitlesBtn.textContent = isHidden ? '💬 Subtítulos' : '💬 Ocultar subtítulos';
    });

    // Fallback buttons
    els.fallbackConfettiBtn.addEventListener('click', () => {
      ParticleFX.burst(window.innerWidth * 0.5, window.innerHeight * 0.45, 110);
      SoundEngine.playGiftFanfare();
      showToast('✨ ¡Magia navideña enviada!');
    });

    els.fallbackReplayBtn.addEventListener('click', () => {
      if (state.currentPerson) startPersonExperience(state.currentPerson);
    });

    els.shareCurrentBtn.addEventListener('click', () => {
      if (!state.currentPerson) return;
      const url = getShareUrl(state.currentPerson);
      const text = `🎁 ¡Feliz Navidad ${state.currentPerson.name}! Aquí tienes tu vídeo personalizado de INECO: ${url}`;
      if (navigator.share) {
        navigator.share({ title: `Entrega INECO — ${state.currentPerson.name}`, text, url }).catch(() => {});
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      }
    });

    els.copyCurrentBtn.addEventListener('click', () => {
      if (state.currentPerson) copyPersonLink(state.currentPerson);
    });

    els.downloadCurrentBtn.addEventListener('click', () => {
      if (state.currentPerson) downloadPersonVideo(state.currentPerson, els.downloadCurrentBtn);
    });
  }

  // ========================================================================
  // Gallery Rendering (orden aleatorio, sin buscador ni badge "Video Listo")
  // ========================================================================
  function renderGallery() {
    const shuffled = shuffleArray(PEOPLE);
    const watchedSet = loadWatchedSet();

    els.grid.innerHTML = shuffled
      .map((p) => {
        const eff = getEffectiveVideo(p);
        const cfg = getPersonConfig(p);
        const actionLabel = eff.url ? '▶ Ver Entrega' : '✨ Abrir Postal';
        const isWatched = watchedSet.has(p.id);

        return `
          <article class="pe-card" data-person-id="${p.id}">
            <div class="pe-card-top" style="justify-content:${isWatched ? 'space-between' : 'flex-end'};">
              ${isWatched ? '<span class="pe-watched-pill">✓ Visto</span>' : ''}
              <div style="display:flex;gap:6px;align-items:center;">
                ${eff.url ? `<button type="button" class="pe-btn pe-btn-icon" data-action="download" data-id="${p.id}" title="Descargar video de ${escapeHtml(p.name)}">⬇️</button>` : ''}
                <button type="button" class="pe-btn pe-btn-icon" data-action="copy" data-id="${p.id}" title="Copiar enlace personalizado (#entrega=${p.id})">🔗</button>
              </div>
            </div>
            <div class="pe-card-avatar-wrap" data-action="open" data-id="${p.id}">
              <img class="pe-card-avatar" src="${p.photo}" alt="${escapeHtml(p.name)}" loading="lazy">
              <div class="pe-card-play-dot">${eff.url ? '▶' : '✨'}</div>
            </div>
            <h3 class="pe-card-name">${escapeHtml(p.name)}</h3>
            <p class="pe-card-msg">${escapeHtml(cfg.message)}</p>
            <div class="pe-card-actions">
              <button type="button" class="pe-btn pe-btn-primary" data-action="open" data-id="${p.id}">${actionLabel}</button>
            </div>
          </article>
        `;
      })
      .join('');

    els.grid.querySelectorAll('[data-action="open"]').forEach((node) => {
      node.addEventListener('click', () => {
        const person = findPerson(node.getAttribute('data-id'));
        if (person) startPersonExperience(person);
      });
    });

    els.grid.querySelectorAll('[data-action="copy"]').forEach((node) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const person = findPerson(node.getAttribute('data-id'));
        if (person) copyPersonLink(person);
      });
    });

    els.grid.querySelectorAll('[data-action="download"]').forEach((node) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const person = findPerson(node.getAttribute('data-id'));
        if (person) downloadPersonVideo(person, node);
      });
    });
  }

  function downloadPersonVideo(person, triggerBtn = null) {
    const eff = getEffectiveVideo(person);
    if (!eff.url) {
      showToast('Este video aún no está disponible para descargar');
      return;
    }
    const filename = person.videoFile || `${person.name}.mp4`;
    const a = document.createElement('a');
    a.href = eff.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`⬇️ Descargando ${filename}`);
    if (triggerBtn) {
      const prev = triggerBtn.textContent;
      triggerBtn.textContent = prev.trim() === '⬇️' ? '✅' : '✅ Descargado';
      setTimeout(() => {
        triggerBtn.textContent = prev;
      }, 2000);
    }
  }

  function showGallery() {
    clearIntroTimers();
    stopVideo();
    state.view = 'gallery';
    state.currentPerson = null;
    applyTheme(store.globalTheme || 'gala-dorada');

    els.backBtn.classList.add('pe-hidden');
    els.theaterView.classList.add('pe-hidden');
    els.introStage.classList.add('pe-hidden');
    els.playerStage.classList.add('pe-hidden');
    els.galleryView.classList.remove('pe-hidden');
    els.body.scrollTop = 0;

    renderGallery();
  }

  // ========================================================================
  // Cinematic Intro Sequence
  // ========================================================================
  let giftRevealed = false;

  function startPersonExperience(person) {
    clearIntroTimers();
    stopVideo();
    giftRevealed = false;

    state.currentPerson = person;
    state.view = 'intro';

    const cfg = getPersonConfig(person);
    applyTheme(cfg.theme);

    els.backBtn.classList.remove('pe-hidden');
    els.galleryView.classList.add('pe-hidden');
    els.theaterView.classList.remove('pe-hidden');
    els.playerStage.classList.add('pe-hidden');
    els.introStage.classList.remove('pe-hidden');
    els.body.scrollTop = 0;

    // Reset intro stage classes
    els.introStage.classList.remove('pe-phase-open', 'pe-phase-gift', 'pe-phase-reveal');
    els.giftBox.classList.remove('pe-gift-shaking', 'pe-gift-burst');
    els.introProgressFill.style.width = '0%';

    // Populate text & portrait
    refreshCurrentPersonText();
    els.revealPortrait.src = person.photo;
    els.revealPortrait.alt = person.name;

    // Smooth progress bar over 6.2 seconds
    const totalMs = 6200;
    const startTs = performance.now();
    const stepProgress = (now) => {
      if (state.view !== 'intro') return;
      const pct = Math.min(100, ((now - startTs) / totalMs) * 100);
      els.introProgressFill.style.width = `${pct}%`;
      if (pct < 100) {
        state.introProgressRaf = requestAnimationFrame(stepProgress);
      }
    };
    state.introProgressRaf = requestAnimationFrame(stepProgress);

    // Phase 1: Part curtains & play shimmer
    state.introTimers.push(
      setTimeout(() => {
        els.introStage.classList.add('pe-phase-open');
        SoundEngine.playCurtainShimmer();
      }, 120)
    );

    // Phase 2: Gift box anticipation shake
    state.introTimers.push(
      setTimeout(() => {
        els.introStage.classList.add('pe-phase-gift');
        els.giftBox.classList.add('pe-gift-shaking');
      }, 1150)
    );

    // Phase 3: Gift burst + Golden Particles + Spotlight Portrait
    state.introTimers.push(
      setTimeout(() => {
        triggerGiftRevealPhase();
      }, 2250)
    );

    // Phase 4: Auto-transition to video player / fallback card
    state.introTimers.push(
      setTimeout(() => {
        transitionToPlayer();
      }, totalMs)
    );
  }

  function triggerGiftRevealPhase() {
    if (giftRevealed) return;
    giftRevealed = true;
    els.giftBox.classList.remove('pe-gift-shaking');
    els.giftBox.classList.add('pe-gift-burst');

    const rect = els.introStage.getBoundingClientRect();
    ParticleFX.burst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.48, 105);
    SoundEngine.playGiftFanfare();

    state.introTimers.push(
      setTimeout(() => {
        if (state.view === 'intro') {
          els.introStage.classList.add('pe-phase-reveal');
        }
      }, 420)
    );
  }

  function refreshCurrentPersonText() {
    const p = state.currentPerson;
    if (!p) return;
    const cfg = getPersonConfig(p);
    els.introKicker.textContent = cfg.title;
    els.revealSubtitle.textContent = cfg.title;
    els.revealHeadline.textContent = `¡Feliz Navidad, ${p.name}!`;
    els.revealDedication.textContent = `“${cfg.message}”`;
    els.recipientName.textContent = `Entrega especial para ${p.name}`;
    els.recipientDedication.textContent = cfg.message;
    if (els.transcriptText) els.transcriptText.textContent = cfg.message;
    els.fallbackTitle.textContent = `¡Feliz Navidad, ${p.name}!`;
    els.fallbackMsg.textContent = cfg.message;
  }

  // ========================================================================
  // Video Player / Fallback Stage
  // ========================================================================
  function stopVideo() {
    if (!els.video) return;
    try {
      els.video.pause();
      els.video.removeAttribute('src');
      els.video.load();
    } catch {
      // ignore
    }
  }

  function showVideoOverlay(caption, showEndBtns) {
    els.overlayCaption.textContent = caption;
    els.endActions.classList.toggle('pe-hidden', !showEndBtns);
    els.bigPlayBtn.classList.toggle('pe-hidden', showEndBtns);
    els.videoOverlay.classList.remove('pe-hidden');
  }

  function transitionToPlayer() {
    if (!state.currentPerson) return;
    clearIntroTimers();
    state.view = 'player';

    els.introStage.classList.add('pe-hidden');
    els.playerStage.classList.remove('pe-hidden');
    mountPlayerForPerson(state.currentPerson, false);
  }

  function mountPlayerForPerson(person, attemptAutoplay) {
    const eff = getEffectiveVideo(person);
    refreshCurrentPersonText();

    els.recipientThumb.src = person.photo;
    els.recipientThumb.alt = person.name;

    if (eff.url) {
      els.fallbackMode.classList.add('pe-hidden');
      els.videoMode.classList.remove('pe-hidden');
      els.videoOverlay.classList.add('pe-hidden');
      els.endActions.classList.add('pe-hidden');

      els.video.poster = person.photo;
      els.video.src = eff.url;
      els.video.load();
      els.timeCur.textContent = '0:00';
      els.timeDur.textContent = '0:00';
      els.scrubber.value = 0;

      if (attemptAutoplay) {
        const playPromise = els.video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            showVideoOverlay(`Pulsa para ver el video de ${person.name}`, false);
          });
        }
      } else {
        showVideoOverlay(`Pulsa para ver el video de ${person.name}`, false);
      }
    } else {
      stopVideo();
      els.videoMode.classList.add('pe-hidden');
      els.fallbackMode.classList.remove('pe-hidden');
      els.fallbackPortrait.src = person.photo;
      els.fallbackPortrait.alt = person.name;
    }
  }

  // ========================================================================
  // Public API: open(personId?), close(), getPeople()
  // ========================================================================
  function openTheater(personId) {
    mountOverlay();
    state.isOpen = true;
    document.body.style.overflow = 'hidden';
    els.overlay.classList.add('pe-open');
    ParticleFX.resize();
    ParticleFX.start();

    const target = personId ? findPerson(personId) : null;
    if (target) {
      startPersonExperience(target);
    } else {
      showGallery();
    }
  }

  function closeTheater() {
    if (!state.mounted || !state.isOpen) return;
    clearIntroTimers();
    stopVideo();
    ParticleFX.stop();

    state.isOpen = false;
    els.overlay.classList.remove('pe-open');
    document.body.style.overflow = '';

    // Clean #entrega=... hash without scrolling the page
    if (window.location.hash && window.location.hash.toLowerCase().startsWith('#entrega=')) {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        // ignore
      }
    }
  }

  function getPeople() {
    return PEOPLE.map((p) => {
      const cfg = getPersonConfig(p);
      const eff = getEffectiveVideo(p);
      return {
        id: p.id,
        name: p.name,
        photo: p.photo,
        video: eff.url,
        hasVideo: Boolean(eff.url),
        defaultTitle: cfg.title,
        defaultMessage: cfg.message,
        theme: cfg.theme
      };
    });
  }

  // Deep-link handler (#entrega=<id-or-name>)
  function checkDeepLink() {
    const hash = window.location.hash || '';
    const match = hash.match(/^#entrega=(.+)$/i);
    if (!match) return;
    let decoded = match[1];
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // keep raw
    }
    openTheater(decoded);
  }

  window.PersonalEntrega = {
    open: openTheater,
    close: closeTheater,
    getPeople
  };

  window.addEventListener('hashchange', checkDeepLink);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDeepLink);
  } else {
    checkDeepLink();
  }
})();
