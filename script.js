/**
 * Our Tangalle Story 💛
 * Main Script - Interactive Romantic Storybook Game
 * Built with love · Vanilla JavaScript · No frameworks
 */

'use strict';

/* ============================================================
   STATE MANAGEMENT
   ============================================================ */
const state = {
  currentScreen: 'home',
  currentChapter: 0,           // 0 = map, 1-8 = chapters, 9 = final
  musicPlaying: false,
  musicPreference: null,       // 'on' | 'off' | null
  unlockedMemories: new Set(),
  completedChapters: new Set(),
  loaded: false,

  // Chapter 5 juice game state
  juiceBoySelected: null,
  juiceGirlSelected: null,

  // Chapter 6 ice cream positions
  leftHandPos: 0,   // 0-100
  rightHandPos: 100, // 0-100

  // Chapter 8 heartbeat
  rhythmScore: 0,
  rhythmTarget: 5,
  rhythmBeats: [],
  rhythmInterval: null,
  rhythmCurrentBeat: 0,
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  initLoadingScreen();
  initMusic();
  // Ensure lock screen hidden until loading finishes
  const ls = document.getElementById('lock-screen');
  if (ls) ls.classList.remove('visible');
  const qs = document.getElementById('questions-screen');
  if (qs) qs.style.display = 'none';
});

function loadProgress() {
  try {
    const saved = localStorage.getItem('tangalle_progress');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.unlocked) data.unlocked.forEach(k => state.unlockedMemories.add(k));
      if (data.completed) data.completed.forEach(k => state.completedChapters.add(k));
    }
    state.musicPreference = localStorage.getItem('tangalle_music') || null;
  } catch (e) {
    console.warn('Could not load progress:', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem('tangalle_progress', JSON.stringify({
      unlocked: [...state.unlockedMemories],
      completed: [...state.completedChapters]
    }));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
}

/* ============================================================
   LOADING SCREEN
   ============================================================ */
function initLoadingScreen() {
  createLoadingFlowers();
  createLoadingParticles();
  animateLoadingBar();
}

function createLoadingFlowers() {
  const container = $('loading-flowers');
  if (!container) return;
  const flowers = ['🌸', '🌺', '🌼', '✨', '🌸', '🌼', '🌺', '⭐'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'loading-flower';
    el.textContent = flowers[i % flowers.length];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 4}s;
      animation-duration: ${4 + Math.random() * 4}s;
      font-size: ${0.8 + Math.random() * 1.2}rem;
    `;
    container.appendChild(el);
  }
}

function createLoadingParticles() {
  const container = $('loading-particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${3 + Math.random() * 4}px;
      height: ${3 + Math.random() * 4}px;
      background: rgba(247,215,116,${0.3 + Math.random() * 0.5});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: ambientFloat ${3 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 3}s;
    `;
    container.appendChild(el);
  }
}

function animateLoadingBar() {
  const bar = $('loading-bar');
  const pct = $('loading-percent');
  if (!bar || !pct) return;

  let progress = 0;
  // Slower, more satisfying loading feel
  const steps = [
    { target: 25, delay: 600 },
    { target: 55, delay: 700 },
    { target: 80, delay: 600 },
    { target: 95, delay: 500 },
    { target: 100, delay: 400 }
  ];

  let stepIdx = 0;

  function nextStep() {
    if (stepIdx >= steps.length) {
      bar.style.width = '100%';
      pct.textContent = '100%';
      setTimeout(finishLoading, 1000);
      return;
    }
    const step = steps[stepIdx];
    stepIdx++;
    const start = progress;
    const end = step.target;
    const duration = step.delay;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      progress = start + (end - start) * eased;
      bar.style.width = progress + '%';
      pct.textContent = Math.round(progress) + '%';
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(nextStep, 150);
      }
    }
    requestAnimationFrame(animate);
  }

  nextStep();
}

function finishLoading() {
  const loadingEl = document.getElementById('loading-screen');
  if (!loadingEl) return;

  state.loaded = true;

  // Fade out loading screen
  loadingEl.classList.add('fade-out');

  // After fade completes, show lock screen
  setTimeout(() => {
    loadingEl.style.display = 'none';
    initLockScreen();
  }, 1000);
}

/* ============================================================
   MUSIC
   ============================================================ */
/* ============================================================
   MUSIC
   ============================================================ */
function initMusic() {
  const btn = $('music-btn');
  const audio = $('bg-music');
  if (!btn || !audio) return;

  // DON'T auto-load music here — set src only when user clicks
  // This prevents any audio events from interfering with lock screen
  btn.addEventListener('click', handleMusicClick);
  updateMusicUI();
}

function handleMusicClick() {
  const audio = $('bg-music');
  if (!audio) return;

  // Set src on first click if not already set
  if (!audio.src || audio.src === window.location.href) {
    audio.src = storyConfig.music.src;
    audio.load();
  }

  if (state.musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
}

function toggleMusic() {
  if (state.musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
}

function startMusic() {
  const audio = $('bg-music');
  if (!audio) return;

  // Ensure src is set
  if (!audio.src || audio.src === window.location.href) {
    audio.src = storyConfig.music.src;
    audio.load();
  }

  audio.volume = 0;
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      state.musicPlaying = true;
      localStorage.setItem('tangalle_music', 'on');
      fadeAudioIn(audio, 0.45, storyConfig.music.fadeTime);
      updateMusicUI();
    }).catch(() => {
      // Autoplay blocked — user must interact first, that's fine
    });
  }
}

function stopMusic() {
  const audio = $('bg-music');
  if (!audio) return;
  fadeAudioOut(audio, storyConfig.music.fadeTime, () => {
    audio.pause();
    state.musicPlaying = false;
    localStorage.setItem('tangalle_music', 'off');
    updateMusicUI();
  });
}

function fadeAudioIn(audio, targetVol, duration) {
  const steps = 30;
  const interval = duration / steps;
  const increment = targetVol / steps;
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    audio.volume = Math.min(current, targetVol);
    if (current >= targetVol) clearInterval(timer);
  }, interval);
}

function fadeAudioOut(audio, duration, callback) {
  const steps = 30;
  const interval = duration / steps;
  const decrement = audio.volume / steps;
  const timer = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - decrement);
    if (audio.volume <= 0) {
      clearInterval(timer);
      if (callback) callback();
    }
  }, interval);
}

function updateMusicUI() {
  const icon = $('music-icon');
  const label = $('music-label');
  const btn = $('music-btn');
  if (!icon || !label || !btn) return;
  if (state.musicPlaying) {
    icon.textContent = '🎵';
    label.textContent = 'Music On';
    btn.classList.add('playing');
    btn.setAttribute('aria-label', 'Pause background music');
  } else {
    icon.textContent = '🎵';
    label.textContent = 'Music Off';
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', 'Play background music');
  }
}

/* ============================================================
   SCREEN NAVIGATION
   ============================================================ */
const SCREEN_ORDER = ['home', 'map', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'final'];

function navigateTo(screenId, direction = 'forward') {
  const currentEl = document.querySelector('.screen.active');
  const targetEl = $('screen-' + screenId);

  if (!targetEl || (currentEl && currentEl === targetEl)) return;

  // Update state
  state.currentScreen = screenId;

  // Exit current
  if (currentEl) {
    currentEl.classList.add('exit-left');
    setTimeout(() => {
      currentEl.classList.remove('active', 'exit-left');
    }, 800);
  }

  // Enter target
  targetEl.style.transform = direction === 'back' ? 'translateX(-30px)' : 'translateX(30px)';
  setTimeout(() => {
    targetEl.classList.add('active');
    targetEl.style.transform = '';
  }, 50);

  // Update navigation UI
  updateNavUI(screenId);

  // Trigger screen-specific init
  if (screenId === 'map') renderChapterMap();
  if (screenId === 'scrapbook') renderScrapbook();
  if (screenId === 'final') initFinalScreen();
  if (screenId.startsWith('ch')) {
    const chNum = parseInt(screenId.replace('ch', ''));
    if (chNum) initChapterScreen(chNum);
  }
}

function updateNavUI(screenId) {
  const nav = $('chapter-nav');
  const isChapter = screenId !== 'home' && screenId !== 'map' && screenId !== 'scrapbook';
  if (nav) nav.style.display = isChapter ? 'flex' : 'none';

  if (!isChapter) return;

  const idx = SCREEN_ORDER.indexOf(screenId);
  const chapterScreens = SCREEN_ORDER.slice(2, 10); // ch1-ch8
  const chIdx = chapterScreens.indexOf(screenId);

  // Prev button
  const prevBtn = $('nav-prev');
  const nextBtn = $('nav-next');
  if (prevBtn) prevBtn.disabled = idx <= 2; // disable at ch1
  if (nextBtn) nextBtn.disabled = idx >= 9; // disable at ch8

  // Dots
  const dotsEl = $('nav-dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  chapterScreens.forEach((s, i) => {
    const dot = document.createElement('button');
    dot.className = 'nav-dot' + (s === screenId ? ' active' : '') + (state.completedChapters.has(s) ? ' completed' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Chapter ${i + 1}`);
    dot.setAttribute('aria-selected', s === screenId ? 'true' : 'false');
    dot.addEventListener('click', () => navigateTo(s));
    dotsEl.appendChild(dot);
  });
}

/* ============================================================
   ALL SCREENS INIT
   ============================================================ */
function initAllScreens() {
  // Navigation arrows
  const prev = $('nav-prev');
  const next = $('nav-next');

  if (prev) {
    prev.addEventListener('click', () => {
      const idx = SCREEN_ORDER.indexOf(state.currentScreen);
      if (idx > 2) navigateTo(SCREEN_ORDER[idx - 1], 'back');
      else if (idx === 2) navigateTo('map', 'back');
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      const idx = SCREEN_ORDER.indexOf(state.currentScreen);
      if (idx < SCREEN_ORDER.length - 1) navigateTo(SCREEN_ORDER[idx + 1]);
    });
  }

  // Begin button
  const btnBegin = $('btn-begin');
  if (btnBegin) btnBegin.addEventListener('click', () => navigateTo('map'));

  // Scrapbook buttons
  const btnSb = $('btn-scrapbook');
  if (btnSb) btnSb.addEventListener('click', () => navigateTo('scrapbook'));

  const btnSbFinal = $('btn-scrapbook-final');
  if (btnSbFinal) btnSbFinal.addEventListener('click', () => navigateTo('scrapbook'));

  const btnBack = $('btn-back-scrapbook');
  if (btnBack) btnBack.addEventListener('click', () => navigateTo(state.currentScreen === 'scrapbook' ? 'map' : 'map', 'back'));

  // Init chapter play buttons
  document.querySelectorAll('.btn-play-game').forEach(btn => {
    btn.addEventListener('click', () => {
      const ch = parseInt(btn.dataset.chapter);
      showGameArea(ch);
    });
  });

  // Init rain for ch8
  initRain();
}

/* ============================================================
   HOME SCREEN
   ============================================================ */
function initHomeScreen() {
  spawnClouds('clouds-home', 5);
  spawnBirds('birds-home', 6);
  spawnSparkles('sparkles-home', 12);
  spawnButterflies('butterflies-home', 4);
  spawnPetals('petals-home', 10);
}

/* ============================================================
   AMBIENT SPAWNERS
   ============================================================ */
function spawnClouds(containerId, count) {
  const c = $(containerId);
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'cloud';
    const w = 60 + Math.random() * 100;
    const h = 25 + Math.random() * 20;
    el.style.cssText = `
      width:${w}px; height:${h}px;
      top:${5 + Math.random() * 35}%;
      animation-duration:${18 + Math.random() * 20}s;
      animation-delay:-${Math.random() * 20}s;
      opacity:${0.5 + Math.random() * 0.4};
    `;
    el.innerHTML = `
      <div style="position:absolute;border-radius:50%;background:rgba(255,255,255,0.85);
        width:${h * 1.4}px;height:${h * 1.4}px;top:-${h * 0.5}px;left:${w * 0.2}px;"></div>
      <div style="position:absolute;border-radius:50%;background:rgba(255,255,255,0.85);
        width:${h * 1.1}px;height:${h * 1.1}px;top:-${h * 0.3}px;left:${w * 0.5}px;"></div>
    `;
    c.appendChild(el);
  }
}

function spawnBirds(containerId, count) {
  const c = $(containerId);
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'bird';
    el.textContent = '🕊️';
    el.style.cssText = `
      top:${8 + Math.random() * 30}%;
      font-size:${0.8 + Math.random() * 0.7}rem;
      animation-duration:${14 + Math.random() * 12}s;
      animation-delay:-${Math.random() * 14}s;
      opacity:${0.6 + Math.random() * 0.4};
    `;
    c.appendChild(el);
  }
}

function spawnSparkles(containerId, count) {
  const c = $(containerId);
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.cssText = `
      left:${Math.random() * 100}%;
      width:${3 + Math.random() * 5}px;
      height:${3 + Math.random() * 5}px;
      animation-duration:${5 + Math.random() * 8}s;
      animation-delay:-${Math.random() * 8}s;
      background:${Math.random() > 0.5 ? '#F7D774' : '#ffffff'};
      box-shadow:0 0 ${4 + Math.random() * 6}px ${Math.random() > 0.5 ? '#F7D774' : '#fff'};
    `;
    c.appendChild(el);
  }
}

function spawnButterflies(containerId, count) {
  const c = $(containerId);
  if (!c) return;
  c.innerHTML = '';
  const types = ['🦋', '🌸', '✨'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'butterfly';
    el.textContent = types[i % types.length];
    el.style.cssText = `
      animation-duration:${18 + Math.random() * 15}s;
      animation-delay:-${Math.random() * 18}s;
      font-size:${1 + Math.random() * 0.8}rem;
    `;
    c.appendChild(el);
  }
}

function spawnPetals(containerId, count) {
  const c = $(containerId);
  if (!c) return;
  c.innerHTML = '';
  const petals = ['🌸', '🌺', '🌼', '🍃', '🌸'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'petal';
    el.textContent = petals[i % petals.length];
    el.style.cssText = `
      left:${Math.random() * 100}%;
      animation-duration:${7 + Math.random() * 8}s;
      animation-delay:-${Math.random() * 8}s;
      font-size:${0.7 + Math.random() * 0.8}rem;
    `;
    c.appendChild(el);
  }
}

function spawnMapParticles() {
  const c = $('map-particles');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.cssText = `
      left:${Math.random() * 100}%;
      width:${2 + Math.random() * 4}px;
      height:${2 + Math.random() * 4}px;
      animation-duration:${6 + Math.random() * 10}s;
      animation-delay:-${Math.random() * 10}s;
      background:rgba(247,215,116,${0.3 + Math.random() * 0.5});
      box-shadow:0 0 6px rgba(247,215,116,0.6);
    `;
    c.appendChild(el);
  }
}

/* ============================================================
   CHAPTER MAP
   ============================================================ */
function renderChapterMap() {
  spawnMapParticles();
  const grid = $('chapters-grid');
  if (!grid) return;
  grid.innerHTML = '';

  storyConfig.chapters.forEach(ch => {
    const card = document.createElement('div');
    const screenId = 'ch' + ch.id;
    const isCompleted = state.completedChapters.has(screenId);
    card.className = 'chapter-card' + (isCompleted ? ' completed' : '');
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', ch.title + (isCompleted ? ' - Completed' : ''));
    card.innerHTML = `
      <span class="card-emoji">${ch.emoji}</span>
      <p class="card-title">${ch.title}</p>
    `;
    card.addEventListener('click', () => navigateTo(screenId));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateTo(screenId); } });

    // Entrance animation stagger
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, ch.id * 80);

    grid.appendChild(card);
  });

  // Final chapter card
  const finalCard = document.createElement('div');
  const finalDone = state.completedChapters.size >= 8;
  finalCard.className = 'chapter-card' + (finalDone ? ' completed' : '');
  finalCard.setAttribute('role', 'listitem');
  finalCard.setAttribute('tabindex', '0');
  finalCard.setAttribute('aria-label', 'Final Chapter - Our Forever');
  finalCard.innerHTML = `<span class="card-emoji">💛</span><p class="card-title">Our Forever 🌙</p>`;
  finalCard.addEventListener('click', () => navigateTo('final'));
  finalCard.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateTo('final'); } });
  finalCard.style.opacity = '0';
  finalCard.style.transform = 'translateY(20px)';
  setTimeout(() => {
    finalCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    finalCard.style.opacity = '1';
    finalCard.style.transform = 'translateY(0)';
  }, 9 * 80);
  grid.appendChild(finalCard);
}

/* ============================================================
   CHAPTER SCREEN INIT DISPATCHER
   ============================================================ */
function initChapterScreen(chNum) {
  // Reset game areas - hide all, show story
  const gameArea = $('game-ch' + chNum);
  const storyBox = $('ch' + chNum + '-story');
  if (gameArea) gameArea.style.display = 'none';
  if (storyBox) storyBox.style.display = 'block';

  // Chapter-specific background animations
  if (chNum === 8) initRain();
}

function showGameArea(chNum) {
  const storyBox = $('ch' + chNum + '-story');
  const gameArea = $('game-ch' + chNum);
  if (storyBox) {
    storyBox.style.transition = 'opacity 0.4s ease';
    storyBox.style.opacity = '0';
    setTimeout(() => { storyBox.style.display = 'none'; }, 400);
  }
  if (gameArea) {
    setTimeout(() => {
      gameArea.style.display = 'block';
      gameArea.style.opacity = '0';
      gameArea.style.transition = 'opacity 0.4s ease';
      requestAnimationFrame(() => { gameArea.style.opacity = '1'; });
      initGame(chNum);
    }, 420);
  }
}

/* ============================================================
   GAME DISPATCHER
   ============================================================ */
function initGame(chNum) {
  switch (chNum) {
    case 1: initGame1(); break;
    case 2: initGame2(); break;
    case 3: initGame3(); break;
    case 4: initGame4(); break;
    case 5: initGame5(); break;
    case 6: initGame6(); break;
    case 7: initGame7(); break;
    case 8: initGame8(); break;
  }
}

/* ============================================================
   CHAPTER 1 GAME - CREATIVE BUS SEAT GAME
   ============================================================ */
function initGame1() {
  const wrap = $('sgb-seats-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  buildSgbWindows();
  setFeedback('game-feedback-ch1', '💛 She saved the glowing seat just for you!', 'hint');

  const seats = [
    { id:'s00', type:'taken', p:'👨' }, { id:'s01', type:'taken', p:'👩' },
    { id:'s02', type:'taken', p:'🧑‍🦱' }, { id:'s03', type:'taken', p:'👴' },
    { id:'s10', type:'taken', p:'👩‍🦳' }, { id:'s11', type:'taken', p:'🧒' },
    { id:'s12', type:'her',   p:'👧' }, { id:'s13', type:'saved', p:'💛' },
    { id:'s20', type:'taken', p:'👨‍🦱' }, { id:'s21', type:'empty', p:'💺' },
    { id:'s22', type:'taken', p:'👵' },  { id:'s23', type:'empty', p:'💺' },
  ];

  seats.forEach(seat => {
    const el = document.createElement('div');
    el.className = 'sgb-seat' +
      (seat.type === 'taken' ? ' sgb-taken' : '') +
      (seat.type === 'her'   ? ' sgb-taken sgb-her' : '') +
      (seat.type === 'saved' ? ' sgb-saved' : '');
    el.dataset.type = seat.type;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', seat.type === 'saved' ? '0' : '-1');
    el.setAttribute('aria-label',
      seat.type === 'saved' ? 'Saved seat 💛 — tap!' :
      seat.type === 'her'   ? 'Her seat' :
      seat.type === 'empty' ? 'Empty seat' : 'Occupied');

    if (seat.type === 'saved') {
      el.innerHTML = `
        <span style="font-size:clamp(1rem,3.5vw,1.5rem);display:block;animation:seatHeartBeat 1.5s ease-in-out infinite;">💛</span>
        <div class="sgb-seat-label">Tap me!</div>
        <div class="saved-seat-glow-ring"></div>`;
    } else if (seat.type === 'her') {
      el.innerHTML = `
        <span style="font-size:clamp(1rem,3vw,1.4rem);">${seat.p}</span>
        <div style="font-family:var(--font-script);font-size:0.45rem;color:var(--gold);">Her 💛</div>`;
    } else {
      el.innerHTML = `<span>${seat.p}</span>`;
    }

    if (seat.type !== 'taken' && seat.type !== 'her') {
      el.addEventListener('click', () => handleSeatClick1(el, seat));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSeatClick1(el, seat); }
      });
    }
    wrap.appendChild(el);
  });
}

function buildSgbWindows() {
  const strip = $('sgb-win-scroll');
  if (!strip) return;
  strip.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const w = document.createElement('div');
    w.className = 'sgb-win-item';
    strip.appendChild(w);
  }
}

function handleSeatClick1(el, seat) {
  if (seat.type === 'saved') {
    el.classList.add('sgb-correct');
    el.innerHTML = `<span style="font-size:clamp(1.2rem,4vw,1.8rem);display:block;animation:seatHeartBeat 0.8s infinite;">💛</span>`;
    setFeedback('game-feedback-ch1', '💛 You found the saved seat!', 'success');
    animateBoyWalkIn();
    setTimeout(() => unlockMemory('saved_seat', 1), 800);
  } else {
    el.classList.add('sgb-wrong');
    setFeedback('game-feedback-ch1', "That's not it... find the glowing 💛 seat!", 'error');
    setTimeout(() => el.classList.remove('sgb-wrong'), 600);
  }
}

function animateBoyWalkIn() {
  const entry = $('bus-boy-entry');
  if (entry) entry.classList.add('walk-in');
  setTimeout(() => {
    const wrap = $('sgb-seats-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:0.8rem;animation:successPop 0.5s ease;">
        <div style="font-size:clamp(1.8rem,6vw,2.8rem);margin-bottom:0.4rem;animation:coupleLift 2s ease-in-out infinite;">💑</div>
        <p style="font-family:var(--font-script);color:var(--gold);font-size:clamp(0.85rem,3vw,1.1rem);">He sat beside her 💛</p>
        <p style="font-family:var(--font-romantic);color:var(--sand);font-size:0.75rem;font-style:italic;margin-top:0.3rem;">
          She gently touched his cheek 🤍
        </p>
        <div style="font-size:1.3rem;margin-top:0.4rem;">💛 🌸 💛</div>
      </div>`;
    spawnHeartBurst();
  }, 1500);
}

/* ============================================================
   CHAPTER 2 GAME - BLESSING
   ============================================================ */
function initGame2() {
  const stick = $('incense-stick');
  const couple = $('blessing-couple');
  const glow = $('blessing-glow');
  if (!stick || !couple) return;

  setFeedback('game-feedback-ch2', '');
  let isDragging = false;
  let blessed = false;

  // Mouse drag
  stick.addEventListener('mousedown', startDrag);
  stick.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    if (blessed) return;
    e.preventDefault();
    isDragging = true;
    stick.classList.add('dragging');

    const moveHandler = e.type === 'touchstart' ? 'touchmove' : 'mousemove';
    const upHandler = e.type === 'touchstart' ? 'touchend' : 'mouseup';

    document.addEventListener(moveHandler, onDrag, { passive: false });
    document.addEventListener(upHandler, onRelease, { once: true });
  }

  function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    stick.style.position = 'fixed';
    stick.style.left = (clientX - 24) + 'px';
    stick.style.top = (clientY - 24) + 'px';
    stick.style.zIndex = '999';

    // Check proximity to couple
    const coupleRect = couple.getBoundingClientRect();
    const cx = coupleRect.left + coupleRect.width / 2;
    const cy = coupleRect.top + coupleRect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);

    if (dist < 80) {
      const progress = Math.max(0, 1 - dist / 80);
      if (glow) glow.style.opacity = progress.toFixed(2);
    } else {
      if (glow) glow.style.opacity = '0';
    }
  }

  function onRelease(e) {
    isDragging = false;
    stick.classList.remove('dragging');
    const clientX = e.touches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.touches ? e.changedTouches[0].clientY : e.clientY;

    const coupleRect = couple.getBoundingClientRect();
    const cx = coupleRect.left + coupleRect.width / 2;
    const cy = coupleRect.top + coupleRect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);

    stick.style.position = '';
    stick.style.left = '';
    stick.style.top = '';
    stick.style.zIndex = '';

    if (dist < 90) {
      blessed = true;
      if (glow) glow.style.opacity = '1';
      setFeedback('game-feedback-ch2', '✨ The aunty blessed your love!', 'success');
      showBlessingAnimation(couple);
      unlockMemory('blessed_together', 2);
    } else {
      if (glow) glow.style.opacity = '0';
      setFeedback('game-feedback-ch2', 'Bring the incense closer to the couple 🙏', 'hint');
    }
  }
}

function showBlessingAnimation(couple) {
  const particles = ['✨', '🌸', '💛', '⭐', '✨'];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('span');
    p.textContent = particles[i % particles.length];
    p.style.cssText = `
      position:absolute; font-size:1.2rem;
      left:${20 + Math.random() * 60}%; top:${10 + Math.random() * 60}%;
      animation:heartBurst 1.5s ease-out forwards;
      --rot:${Math.random() * 360}deg;
      pointer-events:none; z-index:10;
    `;
    couple.style.position = 'relative';
    couple.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
  spawnHeartBurst();
}

/* ============================================================
   CHAPTER 3 GAME - TEMPLE FLOWERS
   ============================================================ */
const FLOWER_SEQUENCE = ['🌸', '🌺', '🌼', '🪷', '🌻'];
let ch3AltarSlots = [];
let ch3SelectedFlower = null;

function initGame3() {
  const tray = $('flower-tray');
  const altar = $('flower-altar');
  if (!tray || !altar) return;

  ch3AltarSlots = [];
  ch3SelectedFlower = null;
  setFeedback('game-feedback-ch3', 'Tap a flower, then tap an altar slot 🙏');

  // Shuffle flowers in tray
  const shuffled = [...FLOWER_SEQUENCE].sort(() => Math.random() - 0.5);
  tray.innerHTML = '';
  shuffled.forEach(flower => {
    const el = document.createElement('div');
    el.className = 'flower-item';
    el.textContent = flower;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Flower ' + flower);
    el.addEventListener('click', () => selectFlower(el, flower));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') selectFlower(el, flower); });
    tray.appendChild(el);
  });

  // Create altar slots
  altar.innerHTML = '';
  for (let i = 0; i < FLOWER_SEQUENCE.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'altar-slot';
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');
    slot.setAttribute('aria-label', 'Altar position ' + (i + 1));
    slot.dataset.index = i;
    slot.dataset.filled = '';
    slot.addEventListener('click', () => placeFlower(slot, i));
    slot.addEventListener('keydown', e => { if (e.key === 'Enter') placeFlower(slot, i); });
    ch3AltarSlots.push(slot);
    altar.appendChild(slot);
  }
}

function selectFlower(el, flower) {
  // Deselect previous
  document.querySelectorAll('.flower-item.selected').forEach(f => f.classList.remove('selected'));
  el.classList.add('selected');
  el.style.border = '2px solid var(--gold)';
  el.style.background = 'rgba(247,215,116,0.2)';
  ch3SelectedFlower = { el, flower };
  setFeedback('game-feedback-ch3', 'Now tap an altar slot to place ' + flower, 'hint');
}

function placeFlower(slot, index) {
  if (!ch3SelectedFlower) {
    setFeedback('game-feedback-ch3', 'First select a flower from the tray 🌸', 'hint');
    return;
  }
  if (slot.dataset.filled) {
    setFeedback('game-feedback-ch3', 'That slot is already filled! Choose another.', 'hint');
    return;
  }

  slot.textContent = ch3SelectedFlower.flower;
  slot.dataset.filled = ch3SelectedFlower.flower;
  slot.classList.add('filled');

  // Remove from tray
  ch3SelectedFlower.el.remove();
  ch3SelectedFlower = null;
  setFeedback('game-feedback-ch3', '');

  // Check if all slots filled
  const filled = ch3AltarSlots.filter(s => s.dataset.filled !== '');
  if (filled.length === FLOWER_SEQUENCE.length) checkTempleGame();
}

function checkTempleGame() {
  // Any complete arrangement is valid (it's about the act of offering)
  ch3AltarSlots.forEach(s => s.classList.add('correct'));
  setFeedback('game-feedback-ch3', '🙏 The temple accepted your prayer!', 'success');
  showTempleBlessingAnim();
  unlockMemory('temple_blessing', 3);
}

function showTempleBlessingAnim() {
  const altar = $('flower-altar');
  if (!altar) return;
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const p = document.createElement('span');
      p.textContent = ['✨', '🌸', '💛', '🙏'][i % 4];
      p.style.cssText = `
        position:fixed;
        left:${30 + Math.random() * 40}vw;
        top:${20 + Math.random() * 50}vh;
        font-size:${1.5 + Math.random()}rem;
        animation:heartBurst 1.5s ease-out forwards;
        --rot:${Math.random() * 360}deg;
        pointer-events:none; z-index:9999;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }, i * 200);
  }
  spawnHeartBurst();
}

/* ============================================================
   CHAPTER 4 GAME - PHOTO MEMORY
   ============================================================ */
const BEACH_MEMORIES = [
  { emoji: '🌊', label: 'Ocean waves', correct: true },
  { emoji: '🌅', label: 'Golden sunset', correct: true },
  { emoji: '📸', label: 'Taking photos', correct: true },
  { emoji: '🏔️', label: 'Mountain hike', correct: false },
  { emoji: '🚗', label: 'Car ride', correct: false },
  { emoji: '🌴', label: 'Palm trees', correct: true },
  { emoji: '🏙️', label: 'City night', correct: false },
  { emoji: '🦀', label: 'Beach crabs', correct: true },
];

let ch4Correct = 0;
let ch4Attempts = 0;
const CH4_NEEDED = 4;

function initGame4() {
  const game = $('photo-game');
  if (!game) return;
  game.innerHTML = '';
  ch4Correct = 0;
  ch4Attempts = 0;
  setFeedback('game-feedback-ch4', `Select ${CH4_NEEDED} correct Tangalle memories!`);

  const shuffled = [...BEACH_MEMORIES].sort(() => Math.random() - 0.5);
  shuffled.forEach(item => {
    const card = document.createElement('div');
    card.className = 'photo-choice';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.label);
    card.innerHTML = `
      <span>${item.emoji}</span>
      <span class="photo-choice-label">${item.label}</span>
    `;
    card.addEventListener('click', () => handlePhotoClick(card, item));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') handlePhotoClick(card, item); });
    game.appendChild(card);
  });
}

function handlePhotoClick(card, item) {
  if (card.classList.contains('correct-pick') || card.classList.contains('wrong-pick')) return;
  ch4Attempts++;
  if (item.correct) {
    card.classList.add('correct-pick');
    ch4Correct++;
    setFeedback('game-feedback-ch4', `💛 Yes! ${ch4Correct}/${CH4_NEEDED} memories found!`, 'success');
    if (ch4Correct >= CH4_NEEDED) {
      setTimeout(() => {
        setFeedback('game-feedback-ch4', '📸 All Tangalle memories unlocked! 💛', 'success');
        unlockMemory('beach_memories', 4);
        spawnHeartBurst();
      }, 400);
    }
  } else {
    card.classList.add('wrong-pick');
    setFeedback('game-feedback-ch4', "That's not from Tangalle... Try again! 💛", 'error');
    setTimeout(() => card.classList.remove('wrong-pick'), 1000);
  }
}

/* ============================================================
   CHAPTER 5 GAME - FIND OUR DRINKS
   ============================================================ */
const DRINKS = [
  { id: 'lime',   emoji: '🍋', label: 'Lime Juice',    boyDrink: true,  girlDrink: false },
  { id: 'avocado',emoji: '🥑', label: 'Avocado Juice', boyDrink: false, girlDrink: true  },
  { id: 'mango',  emoji: '🥭', label: 'Mango Juice',   boyDrink: false, girlDrink: false },
  { id: 'coco',   emoji: '🥥', label: 'Coconut Water', boyDrink: false, girlDrink: false },
  { id: 'orange', emoji: '🍊', label: 'Orange Juice',  boyDrink: false, girlDrink: false },
  { id: 'passion',emoji: '🍹', label: 'Passion Fruit', boyDrink: false, girlDrink: false },
];

function initGame5() {
  const game = $('juice-game');
  if (!game) return;
  game.innerHTML = '';
  state.juiceBoySelected = null;
  state.juiceGirlSelected = null;

  const boyDisplay = $('boy-drink-display');
  const girlDisplay = $('girl-drink-display');
  const confirmBtn = $('btn-confirm-juice');
  if (boyDisplay) boyDisplay.textContent = '?';
  if (girlDisplay) girlDisplay.textContent = '?';
  if (confirmBtn) confirmBtn.style.display = 'none';

  setFeedback('game-feedback-ch5', '');

  const shuffled = [...DRINKS].sort(() => Math.random() - 0.5);
  shuffled.forEach(drink => {
    const card = document.createElement('div');
    card.className = 'juice-choice';
    card.dataset.id = drink.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', drink.label);
    card.innerHTML = `
      <span style="font-size:2.2rem">${drink.emoji}</span>
      <span class="juice-label">${drink.label}</span>
    `;
    card.addEventListener('click', () => handleJuiceClick(card, drink));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') handleJuiceClick(card, drink); });
    game.appendChild(card);
  });

  if (confirmBtn) {
    confirmBtn.onclick = confirmJuiceSelection;
  }
}

function handleJuiceClick(card, drink) {
  // First click = his drink, second click = her drink
  if (!state.juiceBoySelected) {
    state.juiceBoySelected = drink;
    card.classList.add('selected-boy');
    const d = $('boy-drink-display');
    if (d) d.textContent = drink.emoji + ' ' + drink.label;
    setFeedback('game-feedback-ch5', 'Great! Now pick her drink 💛', 'hint');
  } else if (!state.juiceGirlSelected && drink.id !== state.juiceBoySelected.id) {
    state.juiceGirlSelected = drink;
    card.classList.add('selected-girl');
    const d = $('girl-drink-display');
    if (d) d.textContent = drink.emoji + ' ' + drink.label;
    const confirmBtn = $('btn-confirm-juice');
    if (confirmBtn) confirmBtn.style.display = 'block';
    setFeedback('game-feedback-ch5', 'Tap confirm when ready! 💛', 'hint');
  } else if (drink.id === state.juiceBoySelected.id) {
    // Deselect
    card.classList.remove('selected-boy');
    state.juiceBoySelected = null;
    const d = $('boy-drink-display');
    if (d) d.textContent = '?';
    const confirmBtn = $('btn-confirm-juice');
    if (confirmBtn) confirmBtn.style.display = 'none';
    setFeedback('game-feedback-ch5', '');
  }
}

function confirmJuiceSelection() {
  const boy = state.juiceBoySelected;
  const girl = state.juiceGirlSelected;
  if (!boy || !girl) return;

  if (boy.boyDrink && girl.girlDrink) {
    // Correct!
    setFeedback('game-feedback-ch5', '🍋🥑 That\'s us! Cheers! 💛', 'success');
    showJuiceCheersAnimation();
    unlockMemory('juice_date', 5);
  } else {
    setFeedback('game-feedback-ch5', 'That was not our beach memory ❤️ Try again!', 'error');
    shakeElement('juice-game');
    // Reset
    document.querySelectorAll('.juice-choice').forEach(c => {
      c.classList.remove('selected-boy', 'selected-girl');
    });
    state.juiceBoySelected = null;
    state.juiceGirlSelected = null;
    const boyD = $('boy-drink-display');
    const girlD = $('girl-drink-display');
    if (boyD) boyD.textContent = '?';
    if (girlD) girlD.textContent = '?';
    const confirmBtn = $('btn-confirm-juice');
    if (confirmBtn) confirmBtn.style.display = 'none';
  }
}

function showJuiceCheersAnimation() {
  const game = $('juice-game');
  if (!game) return;

  // Animate the glasses in the scene header
  const hisGlass = $('his-glass');
  const herGlass = $('her-glass');
  if (hisGlass) hisGlass.classList.add('cheers-anim');
  if (herGlass) {
    herGlass.style.animationDelay = '0.1s';
    herGlass.classList.add('cheers-anim');
  }

  game.innerHTML = `
    <div style="text-align:center;padding:1.5rem;animation:successPop 0.5s ease;">
      <div style="display:flex;justify-content:center;align-items:flex-end;gap:8px;margin-bottom:0.5rem;">
        <div class="lime-glass" style="animation:cheersClink 0.5s ease 0.1s both;"></div>
        <div style="font-size:2rem;margin-bottom:8px;">🥂</div>
        <div class="avocado-glass" style="animation:cheersClink 0.5s ease 0.2s both;"></div>
      </div>
      <p style="font-family:var(--font-script);font-size:1.2rem;color:var(--brown);">Cheers to us! 💛</p>
      <p style="font-family:var(--font-romantic);font-size:0.85rem;color:var(--soft-brown);font-style:italic;margin-top:0.3rem;">
        🍋 His lime juice · 🥑 Her avocado juice
      </p>
      <div style="margin-top:0.5rem;font-size:1.8rem;">✨💛✨</div>
    </div>
  `;
  spawnHeartBurst();
}

/* ============================================================
   CHAPTER 6 GAME - ICE CREAM
   ============================================================ */
let ch6LeftPos = 10;   // percentage across container
let ch6RightPos = 90;
const CH6_MATCH_THRESHOLD = 15; // how close hands need to be (% diff)

function initGame6() {
  ch6LeftPos = 10;
  ch6RightPos = 90;
  setFeedback('game-feedback-ch6', '');
  renderHandPositions();

  const leftBtn = $('hand-left');
  const rightBtn = $('hand-right');

  if (leftBtn) {
    leftBtn.onclick = () => {
      ch6LeftPos = Math.min(ch6LeftPos + 15, 80);
      renderHandPositions();
      checkIceCreamMatch();
    };
  }
  if (rightBtn) {
    rightBtn.onclick = () => {
      ch6RightPos = Math.max(ch6RightPos - 15, 20);
      renderHandPositions();
      checkIceCreamMatch();
    };
  }
}

function renderHandPositions() {
  const left = $('gh-left');
  const right = $('gh-right');
  if (left) left.style.left = ch6LeftPos + '%';
  if (right) right.style.right = (100 - ch6RightPos) + '%';
}

function checkIceCreamMatch() {
  const diff = ch6RightPos - ch6LeftPos;
  if (diff <= CH6_MATCH_THRESHOLD) {
    // Hands met!
    const cone = $('icecream-cone');
    if (cone) cone.classList.add('matched');
    setFeedback('game-feedback-ch6', '🍦 One ice cream. Two happy hearts. 💛', 'success');
    unlockMemory('sweetest_memory', 6);
    spawnHeartBurst();
    // Disable buttons
    const lb = $('hand-left');
    const rb = $('hand-right');
    if (lb) lb.disabled = true;
    if (rb) rb.disabled = true;
  } else {
    const warmth = Math.max(0, 1 - diff / 80);
    setFeedback('game-feedback-ch6', warmth > 0.5 ? '💛 Almost there...' : 'Keep moving the hands together! 🍦', 'hint');
  }
}

/* ============================================================
   CHAPTER 7 GAME - YELLOW DRESS
   ============================================================ */
const DRESSES = [
  { emoji: '👗', color: 'Yellow',  label: 'Beautiful Yellow Dress', correct: true,  style: 'background:linear-gradient(180deg,#FFE033 0%,#F7C800 40%,#e6b800 100%);' },
  { emoji: '👗', color: 'Red',     label: 'Red Dress',              correct: false, style: 'background:linear-gradient(180deg,#e74c3c 30%,#c0392b 100%);' },
  { emoji: '👗', color: 'Blue',    label: 'Blue Dress',             correct: false, style: 'background:linear-gradient(180deg,#3498db 30%,#2980b9 100%);' },
  { emoji: '👗', color: 'Pink',    label: 'Pink Dress',             correct: false, style: 'background:linear-gradient(180deg,#ff69b4 30%,#ff1493 100%);' },
  { emoji: '👗', color: 'White',   label: 'White Dress',            correct: false, style: 'background:linear-gradient(180deg,#f5f5f5 30%,#ddd 100%);' },
  { emoji: '👗', color: 'Purple',  label: 'Purple Dress',           correct: false, style: 'background:linear-gradient(180deg,#9b59b6 30%,#8e44ad 100%);' },
];

function initGame7() {
  const game = $('dress-game');
  if (!game) return;
  game.innerHTML = '';
  setFeedback('game-feedback-ch7', '💛 Find the beautiful yellow dress!');

  const shuffled = [...DRESSES].sort(() => Math.random() - 0.5);
  shuffled.forEach(dress => {
    const card = document.createElement('div');
    card.className = 'dress-choice';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', dress.label);
    card.innerHTML = `
      <div style="width:60%;height:65%;border-radius:8px 8px 40% 40%;${dress.style};
        display:flex;align-items:center;justify-content:center;font-size:1.5rem;
        border:2px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.15);">👗</div>
      <span class="dress-label">${dress.color}</span>
    `;
    card.addEventListener('click', () => handleDressClick(card, dress));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') handleDressClick(card, dress); });
    game.appendChild(card);
  });
}

function handleDressClick(card, dress) {
  // Update try-on preview emoji
  const tryChar = $('dress-try-char');
  const tryLabel = $('try-on-label');

  if (tryChar) {
    tryChar.textContent = dress.correct ? '👗' : '👘';
    tryChar.style.filter = dress.correct
      ? 'drop-shadow(0 0 12px rgba(247,215,116,0.9))'
      : 'none';
  }
  if (tryLabel) tryLabel.textContent = dress.color + ' dress...';

  if (dress.correct) {
    card.classList.add('correct');
    if (tryChar) tryChar.classList.add('yellow-glow');
    if (tryLabel) tryLabel.textContent = '💛 The perfect yellow dress!';
    setFeedback('game-feedback-ch7', '💛 Yes! The beautiful yellow dress!', 'success');
    showDressAnimation(card);
    unlockMemory('yellow_dress', 7);
  } else {
    card.classList.add('wrong');
    setFeedback('game-feedback-ch7', 'Not this one... keep searching! 💛', 'error');
    setTimeout(() => {
      card.classList.remove('wrong');
      if (tryChar) { tryChar.textContent = '👧'; tryChar.style.filter = ''; }
      if (tryLabel) tryLabel.textContent = 'tap a dress to try on...';
    }, 900);
  }
}

function showDressAnimation(card) {
  spawnHeartBurst();
  const sparks = ['✨', '💛', '🌟', '💫'];
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const p = document.createElement('span');
      p.textContent = sparks[i % sparks.length];
      const rect = card.getBoundingClientRect();
      p.style.cssText = `
        position:fixed;
        left:${rect.left + Math.random() * rect.width}px;
        top:${rect.top + Math.random() * rect.height}px;
        font-size:1.3rem;
        animation:heartBurst 1.2s ease-out forwards;
        --rot:${Math.random() * 360}deg;
        pointer-events:none; z-index:9999;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }, i * 150);
  }
  // Show wear animation
  setTimeout(() => {
    const game = $('dress-game');
    if (!game) return;
    game.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:1.5rem;animation:successPop 0.5s ease;">
        <div style="font-size:4rem;margin-bottom:0.5rem;animation:floatBounce 2s ease-in-out infinite;">👗</div>
        <p style="font-family:var(--font-script);font-size:1.1rem;color:var(--brown);">She wears it beautifully 💛</p>
        <div style="margin-top:0.5rem;font-size:2rem;">💛✨💛</div>
      </div>
    `;
  }, 1200);
}

/* ============================================================
   CHAPTER 8 GAME - HEARTBEAT
   ============================================================ */
const RHYTHM_PATTERN = [1, 0, 1, 1, 0]; // 1 = beat, 0 = rest (visual only)
let ch8Score = 0;
let ch8BeatIndex = 0;
let ch8RhythmTimer = null;
let ch8Active = false;

function initGame8() {
  ch8Score = 0;
  ch8BeatIndex = 0;
  ch8Active = true;
  renderRhythmDots();
  updateRhythmScore();
  setFeedback('game-feedback-ch8', '');

  const tapBtn = $('btn-tap-heart');
  if (tapBtn) {
    tapBtn.onclick = handleHeartTap;
  }

  // Start the beat indicator
  startRhythmPulse();
}

function renderRhythmDots() {
  const track = $('rhythm-track');
  if (!track) return;
  track.innerHTML = '';
  for (let i = 0; i < state.rhythmTarget; i++) {
    const dot = document.createElement('div');
    dot.className = 'rhythm-dot';
    dot.id = 'rdot-' + i;
    track.appendChild(dot);
  }
}

function startRhythmPulse() {
  if (ch8RhythmTimer) clearInterval(ch8RhythmTimer);
  let pulseIdx = 0;
  ch8RhythmTimer = setInterval(() => {
    if (!ch8Active) { clearInterval(ch8RhythmTimer); return; }
    // Flash the heart
    const heart = $('heart-display');
    if (heart) {
      heart.style.transform = 'scale(1.4)';
      heart.style.filter = 'drop-shadow(0 0 20px rgba(255,80,80,0.9))';
      setTimeout(() => {
        if (heart) { heart.style.transform = ''; heart.style.filter = ''; }
      }, 200);
    }
    pulseIdx++;
  }, 700);
}

function handleHeartTap() {
  if (!ch8Active) return;
  if (ch8Score >= state.rhythmTarget) return;

  ch8Score++;
  const dot = $('rdot-' + (ch8Score - 1));
  if (dot) {
    dot.classList.add('hit');
    dot.classList.add('active');
    setTimeout(() => dot.classList.remove('active'), 300);
  }

  // Visual feedback on heart
  const heart = $('heart-display');
  if (heart) {
    heart.classList.add('correct-beat');
    setTimeout(() => heart.classList.remove('correct-beat'), 300);
  }

  updateRhythmScore();

  if (ch8Score >= state.rhythmTarget) {
    ch8Active = false;
    clearInterval(ch8RhythmTimer);
    setFeedback('game-feedback-ch8', '💓 Perfect rhythm! Your hearts beat as one.', 'success');
    showForheadKissAnimation();
    unlockMemory('journey_home', 8);
    spawnHeartBurst();
  } else {
    setFeedback('game-feedback-ch8', `💓 ${ch8Score}/${state.rhythmTarget} beats matched!`, 'hint');
  }
}

function updateRhythmScore() {
  const el = $('rhythm-score');
  if (el) el.textContent = `Score: ${ch8Score} / ${state.rhythmTarget}`;
}

function showForheadKissAnimation() {
  const game = $('heartbeat-game');
  if (!game) return;
  setTimeout(() => {
    game.innerHTML = `
      <div style="text-align:center;padding:1rem;animation:successPop 0.5s ease;">
        <div style="font-size:3.5rem;margin-bottom:0.5rem;animation:floatBounce 2s ease-in-out infinite;">💑</div>
        <p style="font-family:var(--font-script);font-size:1.1rem;color:var(--brown);margin-bottom:0.4rem;">
          He gently kisses her forehead...
        </p>
        <div style="font-size:2rem;margin-bottom:0.5rem;">💋🤍</div>
        <p style="font-family:var(--font-romantic);font-size:0.9rem;color:var(--soft-brown);font-style:italic;">
          "Your shoulder became my safest place."
        </p>
      </div>
    `;
  }, 600);
}

/* ============================================================
   RAIN ANIMATION (Chapter 8)
   ============================================================ */
function initRain() {
  ['rain-container1', 'rain-container2'].forEach(id => {
    const c = $(id);
    if (!c) return;
    c.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.cssText = `
        left:${Math.random() * 100}%;
        animation-duration:${0.6 + Math.random() * 0.6}s;
        animation-delay:${Math.random() * 1}s;
        height:${8 + Math.random() * 8}px;
        opacity:${0.4 + Math.random() * 0.4};
      `;
      c.appendChild(drop);
    }
  });
}

/* ============================================================
   UNLOCK MEMORY + REWARDS
   ============================================================ */
function unlockMemory(key, chapterNum) {
  if (state.unlockedMemories.has(key)) return;

  state.unlockedMemories.add(key);
  const screenId = 'ch' + chapterNum;
  state.completedChapters.add(screenId);
  saveProgress();

  // Find chapter config
  const ch = storyConfig.chapters.find(c => c.unlockKey === key);
  const label = ch ? ch.unlock : '💛 Memory Unlocked!';

  // Show toast
  showUnlockToast('🔓 Unlocked: ' + label);

  // Update map dots if visible
  const mapDot = document.querySelector(`.chapter-card:nth-child(${chapterNum})`);
  if (mapDot) mapDot.classList.add('completed');

  // Pulse nav dot
  updateNavUI(state.currentScreen);

  // After ch8, auto-show final prompt
  if (chapterNum === 8) {
    setTimeout(() => {
      showUnlockToast('💛 All chapters complete! View the final chapter?');
    }, 3000);
  }
}

function showUnlockToast(message) {
  const toast = $('unlock-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ============================================================
   HEART BURST EFFECT
   ============================================================ */
function spawnHeartBurst(x, y) {
  const overlay = $('heart-burst-overlay');
  if (!overlay) return;

  const cx = x || window.innerWidth / 2;
  const cy = y || window.innerHeight / 2;
  const hearts = ['💛', '🌸', '✨', '💛', '⭐', '💛', '🌺', '💫'];

  for (let i = 0; i < 14; i++) {
    const h = document.createElement('span');
    h.className = 'burst-heart';
    h.textContent = hearts[i % hearts.length];
    h.style.cssText = `
      position:absolute;
      left:${cx}px;
      top:${cy}px;
      font-size:${0.9 + Math.random() * 0.9}rem;
      pointer-events:none;
      transform:translate(-50%,-50%) scale(0);
      opacity:1;
    `;
    overlay.appendChild(h);

    // Calculate target position
    const angle = (i / 14) * 360 + Math.random() * 20;
    const radius = 50 + Math.random() * 80;
    const tx = Math.cos(angle * Math.PI / 180) * radius;
    const ty = Math.sin(angle * Math.PI / 180) * radius - 20;
    const delay = Math.random() * 200;

    // Animate with requestAnimationFrame
    const startTime = performance.now() + delay;
    const duration = 1000 + Math.random() * 400;

    function animateHeart(now) {
      if (now < startTime) { requestAnimationFrame(animateHeart); return; }
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const scale = t < 0.4 ? t / 0.4 * 1.2 : 1.2 - (t - 0.4) / 0.6 * 0.4;
      const opacity = t < 0.3 ? 1 : 1 - (t - 0.3) / 0.7;
      h.style.transform = `translate(calc(-50% + ${tx * eased}px), calc(-50% + ${ty * eased}px)) scale(${scale})`;
      h.style.opacity = opacity;
      if (t < 1) {
        requestAnimationFrame(animateHeart);
      } else {
        h.remove();
      }
    }
    requestAnimationFrame(animateHeart);
  }
}

/* ============================================================
   FINAL CHAPTER
   ============================================================ */
function initFinalScreen() {
  spawnFinalStars();
  spawnLanterns();
  spawnFireflies();
  spawnSilhouetteHearts();
  typewriteFinalLetter();
}

function spawnFinalStars() {
  const c = $('final-stars');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'final-star';
    const size = 1 + Math.random() * 3;
    s.style.cssText = `
      left:${Math.random() * 100}%;
      top:${Math.random() * 70}%;
      width:${size}px; height:${size}px;
      animation-duration:${2 + Math.random() * 4}s;
      animation-delay:-${Math.random() * 4}s;
    `;
    c.appendChild(s);
  }
}

function spawnLanterns() {
  const c = $('lanterns-container');
  if (!c) return;
  c.innerHTML = '';
  const lanternEmojis = ['🏮', '🪔', '✨'];
  for (let i = 0; i < 8; i++) {
    const l = document.createElement('div');
    l.className = 'lantern';
    l.textContent = lanternEmojis[i % lanternEmojis.length];
    l.style.cssText = `
      left:${5 + Math.random() * 90}%;
      animation-duration:${12 + Math.random() * 10}s;
      animation-delay:-${Math.random() * 12}s;
      font-size:${1.5 + Math.random() * 1.2}rem;
    `;
    c.appendChild(l);
  }
}

function spawnFireflies() {
  const c = $('fireflies-container');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 15; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.cssText = `
      left:${10 + Math.random() * 80}%;
      top:${30 + Math.random() * 50}%;
      animation-duration:${3 + Math.random() * 4}s;
      animation-delay:-${Math.random() * 4}s;
      width:${3 + Math.random() * 3}px;
      height:${3 + Math.random() * 3}px;
    `;
    c.appendChild(f);
  }
}

function spawnSilhouetteHearts() {
  const c = $('sil-hearts');
  if (!c) return;
  c.innerHTML = '';
  setInterval(() => {
    const h = document.createElement('span');
    h.textContent = '💛';
    h.style.cssText = `
      position:absolute;
      font-size:${0.7 + Math.random() * 0.6}rem;
      left:${Math.random() * 40 - 20}px;
      animation:silHeart ${2 + Math.random() * 2}s ease-out forwards;
      pointer-events:none;
    `;
    c.appendChild(h);
    setTimeout(() => h.remove(), 4000);
  }, 1500);
}

function typewriteFinalLetter() {
  const el = $('final-letter');
  if (!el) return;
  const text = storyConfig.messages.finalLetter;
  el.textContent = '';
  el.style.opacity = '1';

  let i = 0;
  const speed = 30; // ms per character

  function type() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(type, speed);
      // Scroll as text grows
      el.scrollTop = el.scrollHeight;
    }
  }

  // Start typewrite after a brief delay
  setTimeout(type, 500);
}

/* ============================================================
   SCRAPBOOK
   ============================================================ */
const MEMORY_DATA = [
  { key: 'saved_seat',      emoji: '💛', title: 'Saved Seat',       desc: 'The seat saved just for him' },
  { key: 'blessed_together',emoji: '✨', title: 'Blessed Together', desc: 'Aunty\'s incense blessing' },
  { key: 'temple_blessing', emoji: '🙏', title: 'Temple Blessing',  desc: 'Prayers under the Bodhi tree' },
  { key: 'beach_memories',  emoji: '📸', title: 'Beach Memories',   desc: 'Golden sunset at Tangalle' },
  { key: 'juice_date',      emoji: '🍋', title: 'Juice Date',       desc: 'Lime & Avocado by the shore' },
  { key: 'sweetest_memory', emoji: '🍦', title: 'Sweetest Memory',  desc: 'One ice cream, two hearts' },
  { key: 'yellow_dress',    emoji: '💛', title: 'Yellow Dress',     desc: 'The dress he searched for' },
  { key: 'journey_home',    emoji: '🤍', title: 'Journey Home',     desc: 'Shoulder & forehead kiss 💋' },
];

function renderScrapbook() {
  spawnScrapbookParticles();
  renderMemoriesGrid();
  renderPhotoGallery();
}

function spawnScrapbookParticles() {
  const c = $('sb-particles');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'sparkle';
    p.style.cssText = `
      left:${Math.random() * 100}%;
      width:${2 + Math.random() * 4}px;
      height:${2 + Math.random() * 4}px;
      animation-duration:${6 + Math.random() * 8}s;
      animation-delay:-${Math.random() * 8}s;
      background:rgba(247,215,116,${0.3 + Math.random() * 0.5});
    `;
    c.appendChild(p);
  }
}

function renderMemoriesGrid() {
  const grid = $('memories-grid');
  if (!grid) return;
  grid.innerHTML = '';

  MEMORY_DATA.forEach((mem, i) => {
    const card = document.createElement('div');
    const isUnlocked = state.unlockedMemories.has(mem.key);
    card.className = 'memory-card ' + (isUnlocked ? 'unlocked' : 'locked');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', isUnlocked ? mem.title + ': ' + mem.desc : 'Locked memory');
    card.innerHTML = `
      <span class="memory-emoji">${mem.emoji}</span>
      <p class="memory-title">${isUnlocked ? mem.title : '???'}</p>
      ${isUnlocked ? `<p style="font-size:0.7rem;color:var(--sand);font-style:italic;margin-top:0.2rem;">${mem.desc}</p>` : ''}
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => {
        card.classList.add('new-unlock');
        setTimeout(() => card.classList.remove('new-unlock'), 800);
        showMemoryDetail(mem);
      });
    }

    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    }, i * 60);

    grid.appendChild(card);
  });

  // Progress counter
  const count = state.unlockedMemories.size;
  const total = MEMORY_DATA.length;
  const counter = document.createElement('div');
  counter.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--gold);font-family:var(--font-script);font-size:1.1rem;margin-top:0.5rem;';
  counter.textContent = `${count} / ${total} memories unlocked 💛`;
  grid.appendChild(counter);
}

function showMemoryDetail(mem) {
  showUnlockToast('💛 ' + mem.title + ' · ' + mem.desc);
}

function renderPhotoGallery() {
  const gallery = $('photo-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';

  storyConfig.photos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', 'Memory photo ' + (i + 1));
    const img = document.createElement('img');
    img.src = 'assets/images/' + photo;
    img.alt = 'Memory ' + (i + 1);
    img.loading = 'lazy';
    img.onerror = () => {
      item.innerHTML = ['🌊', '🌅', '💛', '🌴', '📸', '✨'][i % 6];
      item.style.fontSize = '2rem';
    };
    item.appendChild(img);
    gallery.appendChild(item);
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function setFeedback(id, message, type = '') {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.className = 'game-feedback' + (type ? ' ' + type : '');
}

function shakeElement(id) {
  const el = $(id);
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    el.style.animation = 'shakeAnim 0.5s ease';
    setTimeout(() => { el.style.animation = ''; }, 500);
  });
}

/* ============================================================
   CSS KEYFRAME FOR HEART BURST SPREAD
   (injected at runtime since --tx/--ty are used)
   ============================================================ */
(function injectKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    /* Heart burst — uses data-tx/data-ty set via JS style directly */
    @keyframes heartBurstFade {
      0%   { opacity: 1; transform: scale(0); }
      40%  { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0; transform: scale(0.8); }
    }
    @keyframes silHeart {
      0%   { transform: translateY(0) scale(0); opacity: 1; }
      50%  { opacity: 1; }
      100% { transform: translateY(-60px) scale(1); opacity: 0; }
    }
    @keyframes coupleLift {
      0%, 100% { transform: translateY(0) rotate(-1deg); }
      50%       { transform: translateY(-8px) rotate(1deg); }
    }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   KEYBOARD NAVIGATION SUPPORT
   ============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    const idx = SCREEN_ORDER.indexOf(state.currentScreen);
    if (idx > 1 && idx < SCREEN_ORDER.length - 1) navigateTo(SCREEN_ORDER[idx + 1]);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    const idx = SCREEN_ORDER.indexOf(state.currentScreen);
    if (idx > 2) navigateTo(SCREEN_ORDER[idx - 1], 'back');
    else if (idx === 2) navigateTo('map', 'back');
  }
  if (e.key === 'Escape') {
    if (state.currentScreen === 'scrapbook') navigateTo('map', 'back');
  }
});

/* ============================================================
   TOUCH SWIPE NAVIGATION
   ============================================================ */
(function initSwipe() {
  let startX = 0, startY = 0;
  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

    const idx = SCREEN_ORDER.indexOf(state.currentScreen);
    if (dx < -60 && idx < SCREEN_ORDER.length - 1 && idx > 1) {
      // Swipe left = next
      navigateTo(SCREEN_ORDER[idx + 1]);
    } else if (dx > 60 && idx > 2) {
      // Swipe right = prev
      navigateTo(SCREEN_ORDER[idx - 1], 'back');
    }
  }, { passive: true });
})();

/* ============================================================
   SERVICE WORKER REGISTRATION (GitHub Pages PWA support)
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // SW optional, no error needed
    });
  });
}

/* ============================================================
   LOCK SCREEN  💛
   Password: 0729  (July 29 — their date)
   ============================================================ */
const LOCK_PASSWORD = '0729';
const WRONG_MESSAGES = [
  "That's not our date, love 💛 Try again!",
  "Hmm... think about July 🗓️",
  "The day we met at Tangalle 🌊",
  "0-7-2-9... our special numbers 💛",
];
let lockWrongCount = 0;
let lockInput = '';
let lockUnlocked = false;

function initLockScreen() {
  const ls = $('lock-screen');
  if (!ls) {
    showQuestionsScreen();
    return;
  }

  // Always show lock screen fresh — clear any session bypass
  sessionStorage.removeItem('tangalle_unlocked');
  sessionStorage.removeItem('tangalle_questions_done');

  // Reset lock state
  lockInput = '';
  lockUnlocked = false;
  lockWrongCount = 0;
  updateLockDisplay();
  const wrongMsg = $('lock-wrong-msg');
  if (wrongMsg) wrongMsg.textContent = '';

  // Show the lock screen
  ls.classList.add('visible');

  spawnLockHearts();
  spawnLockParticles();

  // Remove old listeners before adding new ones (prevent double-fire)
  document.querySelectorAll('.key-btn').forEach(btn => {
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });

  // Bind fresh keypad buttons
  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', handleKeyPress);
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      handleKeyPress.call(btn);
    }, { passive: false });
  });

  // Physical keyboard support
  document.removeEventListener('keydown', handlePhysicalKey);
  document.addEventListener('keydown', handlePhysicalKey);
}

function spawnLockHearts() {
  const c = $('lock-bg-hearts');
  if (!c) return;
  const hearts = ['💛', '🌸', '✨', '💛', '⭐', '🌺', '💛'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'lock-bg-heart';
    el.textContent = hearts[i % hearts.length];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${0.8 + Math.random() * 1.5}rem;
      animation-duration: ${8 + Math.random() * 10}s;
      animation-delay: -${Math.random() * 10}s;
    `;
    c.appendChild(el);
  }
}

function spawnLockParticles() {
  const c = $('lock-particles');
  if (!c) return;
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
      background: rgba(247,215,116,${0.2 + Math.random() * 0.5});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: ambientFloat ${3 + Math.random() * 5}s ease-in-out infinite;
      animation-delay: -${Math.random() * 5}s;
    `;
    c.appendChild(el);
  }
}

function handleKeyPress() {
  if (lockUnlocked) return;
  const val = this.dataset.val;

  if (val === 'clear') {
    if (lockInput.length > 0) {
      lockInput = lockInput.slice(0, -1);
      updateLockDisplay();
      clearLockError();
    }
    return;
  }

  if (val === 'enter') {
    checkLockPassword();
    return;
  }

  if (lockInput.length < 4 && /^[0-9]$/.test(val)) {
    lockInput += val;
    updateLockDisplay();

    // Animate the button
    this.style.transform = 'scale(0.9)';
    setTimeout(() => { this.style.transform = ''; }, 150);

    // Auto-submit when 4 digits entered
    if (lockInput.length === 4) {
      setTimeout(checkLockPassword, 300);
    }
  }
}

function handlePhysicalKey(e) {
  if (lockUnlocked) return;
  const ls = $('lock-screen');
  if (!ls || ls.style.display === 'none') return;

  if (e.key >= '0' && e.key <= '9') {
    if (lockInput.length < 4) {
      lockInput += e.key;
      updateLockDisplay();
      if (lockInput.length === 4) setTimeout(checkLockPassword, 300);
    }
  } else if (e.key === 'Backspace') {
    lockInput = lockInput.slice(0, -1);
    updateLockDisplay();
    clearLockError();
  } else if (e.key === 'Enter') {
    checkLockPassword();
  }
}

function updateLockDisplay() {
  for (let i = 0; i < 4; i++) {
    const digit = $('ld' + i);
    if (!digit) continue;
    if (i < lockInput.length) {
      digit.textContent = '●';
      digit.classList.add('filled');
      digit.classList.remove('error', 'correct');
    } else {
      digit.textContent = '';
      digit.classList.remove('filled', 'error', 'correct');
    }
  }
}

function checkLockPassword() {
  if (lockInput === LOCK_PASSWORD) {
    // CORRECT!
    lockUnlocked = true;
    for (let i = 0; i < 4; i++) {
      const digit = $('ld' + i);
      if (digit) {
        digit.classList.remove('error');
        digit.classList.add('correct');
      }
    }
    setTimeout(() => {
      const overlay = $('lock-success-overlay');
      if (overlay) overlay.style.display = 'flex';
      spawnLockSuccessHearts();
    }, 400);
    setTimeout(() => {
      hideLockScreen(true);
    }, 2200);
    document.removeEventListener('keydown', handlePhysicalKey);
  } else {
    // WRONG
    lockWrongCount++;
    for (let i = 0; i < 4; i++) {
      const digit = $('ld' + i);
      if (digit) digit.classList.add('error');
    }
    const msg = $('lock-wrong-msg');
    if (msg) {
      msg.textContent = WRONG_MESSAGES[(lockWrongCount - 1) % WRONG_MESSAGES.length];
    }

    // Update hint after 2 wrong tries
    if (lockWrongCount >= 2) {
      const hint = $('lock-hint-text');
      if (hint) hint.innerHTML = 'Hint: Month + Day of Tangalle 🌊<br/><strong style="color:var(--gold);">July = 07, 29th day</strong>';
    }

    setTimeout(() => {
      lockInput = '';
      updateLockDisplay();
      for (let i = 0; i < 4; i++) {
        const digit = $('ld' + i);
        if (digit) digit.classList.remove('error');
      }
    }, 600);
  }
}

function clearLockError() {
  const msg = $('lock-wrong-msg');
  if (msg) msg.textContent = '';
}

function spawnLockSuccessHearts() {
  const overlay = $('lock-success-overlay');
  if (!overlay) return;
  const emojis = ['💛', '✨', '🌸', '⭐', '💛', '🌺'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const h = document.createElement('span');
      h.textContent = emojis[i % emojis.length];
      const startX = Math.random() * 100;
      const startY = 20 + Math.random() * 60;
      h.style.cssText = `
        position:absolute;
        font-size:${0.8 + Math.random() * 1.2}rem;
        left:${startX}%;
        top:${startY}%;
        pointer-events:none;
        animation:silHeart ${1.2 + Math.random() * 0.6}s ease-out forwards;
      `;
      overlay.appendChild(h);
      setTimeout(() => h.remove(), 2000);
    }, i * 80);
  }
}

function hideLockScreen(animate) {
  const ls = $('lock-screen');
  if (!ls) { showQuestionsScreen(); return; }

  document.removeEventListener('keydown', handlePhysicalKey);

  if (animate) {
    ls.classList.add('unlocking');
    setTimeout(() => {
      ls.classList.remove('visible', 'unlocking');
      ls.style.display = 'none';
      showQuestionsScreen();
    }, 900);
  } else {
    ls.classList.remove('visible');
    ls.style.display = 'none';
    showQuestionsScreen();
  }
}

/* ============================================================
   EMOTIONAL QUESTIONS  💛
   5 cute questions before entering the story
   ============================================================ */
const QUESTIONS = [
  {
    emoji: '🌊',
    question: 'Where did our story first come alive in person?',
    choices: [
      { emoji: '🌊', text: 'Tangalle beach, under golden skies', correct: true },
      { emoji: '🏙️', text: 'In a busy city somewhere', correct: false },
      { emoji: '🏔️', text: 'On a mountain trip', correct: false },
    ],
    feedback: '💛 Yes! Tangalle — where everything became real 🌊',
  },
  {
    emoji: '💛',
    question: 'What colour was his shirt when he walked into the bus for the very first time?',
    choices: [
      { emoji: '🔵', text: 'Blue, like the ocean', correct: false },
      { emoji: '💛', text: 'Yellow, warm like sunshine', correct: true },
      { emoji: '⚪', text: 'White, calm and clean', correct: false },
    ],
    feedback: '✨ Yellow — just like the sunshine he brought into your life!',
  },
  {
    emoji: '🥑',
    question: 'What was her drink at the beach juice shop? 🍹',
    choices: [
      { emoji: '🍊', text: 'Orange juice, fresh and bright', correct: false },
      { emoji: '🥥', text: 'Coconut water, tropical vibes', correct: false },
      { emoji: '🥑', text: 'Avocado juice — her favourite', correct: true },
    ],
    feedback: '🥑 Avocado juice! And his was 🍋 lime — the perfect pair, just like you two!',
  },
  {
    emoji: '🙏',
    question: 'He held your hand at the temple even though...?',
    choices: [
      { emoji: '😴', text: 'He was very tired', correct: false },
      { emoji: '🤕', text: 'His hand was bandaged and hurting', correct: true },
      { emoji: '😅', text: 'He was a little nervous', correct: false },
    ],
    feedback: '🤍 His bandaged hand still held yours. That says everything 💛',
  },
  {
    emoji: '💛',
    question: 'What did he search all of Tangalle shopping street to find for you?',
    choices: [
      { emoji: '👟', text: 'A pair of pretty sandals', correct: false },
      { emoji: '👗', text: 'The most beautiful yellow long dress', correct: true },
      { emoji: '💍', text: 'A golden bracelet', correct: false },
    ],
    feedback: '💛 He searched until he found the most beautiful dress — just for you!',
  },
];

let qIndex = 0;
let qAnswered = false;

function showQuestionsScreen() {
  const qs = $('questions-screen');
  if (!qs) { hideQuestionsScreen(false); return; }

  qs.style.display = 'flex';
  qs.classList.remove('fade-out');
  qIndex = 0;
  qAnswered = false;
  spawnQParticles();
  renderQuestion(0);
}

function spawnQParticles() {
  const c = $('q-bg-particles');
  if (!c) return;
  for (let i = 0; i < 15; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      font-size: ${0.8 + Math.random() * 1}rem;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: lockHeartFloat ${8 + Math.random() * 8}s linear infinite;
      animation-delay: -${Math.random() * 8}s;
      opacity: 0.1;
      pointer-events: none;
    `;
    el.textContent = ['💛','🌸','✨','🌺','⭐'][i % 5];
    c.appendChild(el);
  }
}

function renderQuestion(idx) {
  const q = QUESTIONS[idx];
  if (!q) return;
  qAnswered = false;

  // Update progress
  const prog = $('q-progress');
  if (prog) prog.textContent = `${idx + 1} / ${QUESTIONS.length}`;

  // Animate card out then in
  const card = $('q-card');
  if (card) {
    card.style.animation = 'none';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 50);
  }

  const emoji = $('q-emoji');
  const question = $('q-question');
  const feedback = $('q-feedback');
  if (emoji) emoji.textContent = q.emoji;
  if (question) question.textContent = q.question;
  if (feedback) feedback.textContent = '';

  // Render choices
  const choicesEl = $('q-choices');
  if (!choicesEl) return;
  choicesEl.innerHTML = '';
  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'q-choice-btn';
    btn.setAttribute('aria-label', choice.text);
    btn.innerHTML = `
      <span class="q-choice-emoji">${choice.emoji}</span>
      <span>${choice.text}</span>
    `;
    // Stagger entrance
    btn.style.opacity = '0';
    btn.style.transform = 'translateX(-10px)';
    setTimeout(() => {
      btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      btn.style.opacity = '1';
      btn.style.transform = 'translateX(0)';
    }, 200 + i * 100);

    btn.addEventListener('click', () => handleAnswer(btn, choice, q));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(btn, choice, q) {
  if (qAnswered) return;
  qAnswered = true;

  const feedback = $('q-feedback');

  // Disable all choices
  document.querySelectorAll('.q-choice-btn').forEach(b => b.classList.add('disabled-ans'));

  if (choice.correct) {
    btn.classList.add('correct-ans');
    if (feedback) feedback.textContent = q.feedback;
    spawnHeartBurst();

    // Next question after delay
    setTimeout(() => {
      qIndex++;
      if (qIndex < QUESTIONS.length) {
        renderQuestion(qIndex);
      } else {
        // All questions done — enter the story!
        setTimeout(() => {
          hideQuestionsScreen(true);
        }, 1000);
      }
    }, 1800);
  } else {
    btn.classList.add('wrong-ans');
    if (feedback) feedback.textContent = 'Not quite... try again 💛';

    // Re-enable correct answer hint after shake
    setTimeout(() => {
      document.querySelectorAll('.q-choice-btn').forEach(b => {
        b.classList.remove('disabled-ans', 'wrong-ans');
      });
      qAnswered = false;
      if (feedback) feedback.textContent = '';
    }, 900);
  }
}

function hideQuestionsScreen(animate) {
  const qs = $('questions-screen');
  if (!qs) {
    initHomeScreen();
    initAllScreens();
    if (state.musicPreference === 'on') startMusic();
    return;
  }
  if (animate) {
    qs.classList.add('fade-out');
    spawnHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
    setTimeout(() => {
      qs.style.display = 'none';
      qs.classList.remove('fade-out');
      initHomeScreen();
      initAllScreens();
      if (state.musicPreference === 'on') startMusic();
    }, 800);
  } else {
    qs.style.display = 'none';
    initHomeScreen();
    initAllScreens();
    if (state.musicPreference === 'on') startMusic();
  }
}
