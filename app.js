// ==========================================
// NIHONGO MASTER | MOBILE CRASH-PROOF V3
// ==========================================

const viewHome = document.getElementById('view-home');
const viewLevels = document.getElementById('view-levels');
const viewStudy = document.getElementById('view-study');
const viewQuiz = document.getElementById('view-quiz');
const viewReading = document.getElementById('view-reading'); 
const viewSentences = document.getElementById('view-sentences');
const viewLibrary = document.getElementById('view-library'); 
const viewTyping = document.getElementById('view-typing');   

const navHomeBtn = document.getElementById('nav-home-btn');
const navLevelsBtn = document.getElementById('nav-levels-btn');

function hideAllViews() {
  [viewHome, viewLevels, viewStudy, viewQuiz, viewReading, viewSentences, viewLibrary, viewTyping].forEach(v => {
    if(v) v.classList.remove('active');
  });
}

window.logout = function() {
  localStorage.removeItem('nihongoStudent');
  window.location.href = 'index.html';
}

if(navHomeBtn) {
    navHomeBtn.onclick = () => {
        hideAllViews();
        if(viewHome) viewHome.classList.add('active');
        navHomeBtn.classList.add('hidden');
        if(navLevelsBtn) navLevelsBtn.classList.add('hidden');
        renderCourseCards();
    };
}

if(navLevelsBtn) navLevelsBtn.onclick = () => openSystem(currentSystem);

// ==========================================
// --- 2. CRASH-PROOF VOICE ENGINE ---
// ==========================================
const synth = window.speechSynthesis || null;

// Safe Wakeup
if (synth && typeof synth.getVoices === 'function') {
    try { synth.getVoices(); } catch (e) { console.log("Voices blocked"); }
}

document.body.addEventListener('touchstart', function unlockAudio() {
    if (synth && typeof synth.speak === 'function') {
        try {
            const dummy = new SpeechSynthesisUtterance('');
            synth.speak(dummy);
        } catch(e) {}
    }
    document.body.removeEventListener('touchstart', unlockAudio);
}, { once: true });

function playAudio(text) {
  if (!synth || typeof synth.speak !== 'function') {
      console.warn("Audio is blocked by your mobile device.");
      return; // Stop here, do NOT crash the app
  }
  
  try {
      synth.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP'; 
      
      const isSlowMode = document.getElementById('slow-audio-toggle')?.checked;
      utterance.rate = isSlowMode ? 0.4 : 0.8; 
      
      if (typeof synth.getVoices === 'function') {
          const voices = synth.getVoices();
          const jaVoice = voices.find(v => v.lang.toLowerCase().includes('ja'));
          if (jaVoice) utterance.voice = jaVoice;
      }
      
      synth.speak(utterance);
  } catch(e) {
      console.log("Audio play failed, ignoring error.");
  }
}

// --- 3. STATE MANAGEMENT ---
let currentSystem = ''; let currentLevelIndex = 0; let currentCharIndex = 0;
let quizPool = []; let currentQuestion = 0; let score = 0; let correctAnswer = null; let currentQuizMode = 'char';

const activeCharUI = document.getElementById('active-char');
const vocabGrid = document.getElementById('vocab-grid');
const canvas = document.getElementById('writing-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;

// --- 4. DATA ---
const db = {
  hiragana: [
    { id: 'h1', title: 'Level 1: A-Row', chars: ['あ', 'い', 'う', 'え', 'お'], unlocked: true },
    { id: 'h2', title: 'Level 2: K-Row', chars: ['か', 'き', 'く', 'け', 'こ'], unlocked: false },
    { id: 'h3', title: 'Level 3: S-Row', chars: ['さ', 'し', 'す', 'せ', 'そ'], unlocked: false },
    { id: 'h4', title: 'Level 4: T-Row', chars: ['た', 'ち', 'つ', 'て', 'と'], unlocked: false },
    { id: 'h5', title: 'Level 5: N-Row', chars: ['な', 'に', 'ぬ', 'ね', 'の'], unlocked: false }
  ],
  katakana: [
    { id: 'k1', title: 'Level 1: A-Row', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'], unlocked: true },
    { id: 'k2', title: 'Level 2: K-Row', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'], unlocked: false },
    { id: 'k3', title: 'Level 3: S-Row', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'], unlocked: false }
  ],
  kanji: [
    { id: 'j1', title: 'Level 1: Numbers (1-5)', chars: ['一', '二', '三', '四', '五'], unlocked: true },
    { id: 'j2', title: 'Level 2: Numbers (6-10)', chars: ['六', '七', '八', '九', '十'], unlocked: false },
    { id: 'j3', title: 'Level 3: Days & Elements', chars: ['日', '月', '火', '水', '木', '金', '土'], unlocked: false }
  ]
};

const characterMap = {
  'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o', 'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so', 'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no', 'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o', 
  'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko', 'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so'
};

const dictionary = [
  { word: 'あお', mean: 'Blue (ao)' }, { word: 'あい', mean: 'Love (ai)' }, { word: 'いいえ', mean: 'No (iie)' },
  { word: 'あか', mean: 'Red (aka)' }, { word: 'いく', mean: 'To go (iku)' }, { word: 'すし', mean: 'Sushi (sushi)' }, 
  { word: 'て', mean: 'Hand (te)' }, { word: 'なに', mean: 'What? (nani)' }, { word: 'いぬ', mean: 'Dog (inu)' }, 
  { word: 'ねこ', mean: 'Cat (neko)' }, { word: 'わたし', mean: 'I / Me (watashi)' }, { word: 'ほん', mean: 'Book (hon)' },
  { word: 'みず', mean: 'Water (mizu)' }, { word: 'おちゃ', mean: 'Tea (ocha)' }, { word: 'がっこう', mean: 'School (gakkou)' },
  { word: 'せんせい', mean: 'Teacher (sensei)' }, { word: 'コーヒー', mean: 'Coffee (koohii)' }, { word: 'スマホ', mean: 'Smartphone (sumaho)' },
  { word: '一', mean: 'One (ichi)' }, { word: '水', mean: 'Water (mizu)' }, { word: '火', mean: 'Fire (hi)' },
  { word: '人', mean: 'Person (hito)' }, { word: '先生', mean: 'Teacher (sensei)' }, { word: '学生', mean: 'Student (gakusei)' }
];

const readingDb = [
  { jp: "こんにちは。私の名前は田中です。", en: "Hello. My name is Tanaka." },
  { jp: "今日はとてもいい天気ですね。", en: "The weather is very nice today, isn't it?" }
];

const sentenceDb = [
    { sys: 'hiragana', level: 1, jp: "おはようございます。", en: "Good morning." },
    { sys: 'hiragana', level: 2, jp: "ありがとうございます。", en: "Thank you very much." },
    { sys: 'katakana', level: 1, jp: "アメリカから来ました。", en: "I came from America." },
    { sys: 'kanji', level: 1, jp: "一から十まで数えてください。", en: "Please count from 1 to 10." }
];

// --- 5. INITIALIZATION ---
window.onload = () => {
  const student = localStorage.getItem('nihongoStudent');
  if (!student) { window.location.href = 'index.html'; } else { renderCourseCards(); }
};

function renderCourseCards() {
  const student = localStorage.getItem('nihongoStudent');
  const hiraComplete = localStorage.getItem(`${student}_sys_hiragana_complete`) === 'true';
  const kataComplete = localStorage.getItem(`${student}_sys_katakana_complete`) === 'true';
  const isPro = localStorage.getItem(`${student}_isPro`) === 'true';

  const userBadge = document.getElementById('user-display-name');
  if(userBadge) userBadge.innerHTML = isPro ? `| ${student} 👑 PRO` : `| ${student}`;

  const hiraCard = document.getElementById('card-hiragana');
  const kataCard = document.getElementById('card-katakana');
  const kanjiCard = document.getElementById('card-kanji');

  if(hiraCard) hiraCard.onclick = () => openSystem('hiragana');
  if(kataCard && hiraComplete) { kataCard.classList.remove('locked'); kataCard.onclick = () => openSystem('katakana'); }
  if(kanjiCard && kataComplete) {
      if (isPro) { kanjiCard.classList.remove('locked'); kanjiCard.classList.add('pro-unlocked'); kanjiCard.onclick = () => openSystem('kanji'); } 
      else { kanjiCard.classList.add('locked'); kanjiCard.onclick = () => alert("⭐️ PRO ACCOUNT REQUIRED!"); }
  }
}

function openSystem(systemName) {
  currentSystem = systemName;
  hideAllViews();
  if(viewLevels) viewLevels.classList.add('active');
  if(navHomeBtn) navHomeBtn.classList.remove('hidden');
  if(navLevelsBtn) navLevelsBtn.classList.add('hidden');
  const title = document.getElementById('system-title');
  if(title) title.textContent = `${systemName.toUpperCase()} LEVELS`;
  renderLevelList();
}

function renderLevelList() {
  const container = document.getElementById('level-list-container');
  if(!container) return; container.innerHTML = '';
  const student = localStorage.getItem('nihongoStudent');
  db[currentSystem].forEach((level, index) => {
    const savedStatus = localStorage.getItem(`${student}_progress_${currentSystem}_${index}`);
    if (savedStatus === 'unlocked') level.unlocked = true;
    const div = document.createElement('div');
    div.className = `level-row ${level.unlocked ? 'unlocked' : 'locked'}`;
    div.innerHTML = `<h3 style="margin:0; font-size: 1.1rem;">${level.title}</h3><span>${level.unlocked ? '🔓' : '🔒'}</span>`;
    if (level.unlocked) div.onclick = () => openStudy(index);
    container.appendChild(div);
  });
}

function openStudy(levelIndex) {
  currentLevelIndex = levelIndex; currentCharIndex = 0;
  hideAllViews();
  if(viewStudy) viewStudy.classList.add('active'); 
  if(navHomeBtn) navHomeBtn.classList.remove('hidden');
  if(navLevelsBtn) navLevelsBtn.classList.remove('hidden');
  const title = document.getElementById('study-level-title');
  if(title) title.textContent = db[currentSystem][levelIndex].title;
  loadCharacter(); renderVocabulary();
}

function loadCharacter() {
  if(activeCharUI) { activeCharUI.textContent = db[currentSystem][currentLevelIndex].chars[currentCharIndex]; activeCharUI.classList.remove('enlarged-guide'); }
  if(ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); }
}

function renderVocabulary() {
  const student = localStorage.getItem('nihongoStudent');
  let knownChars = [];
  for (let sys in db) {
      const isSystemUnlocked = sys === 'hiragana' || localStorage.getItem(`${student}_sys_${sys === 'katakana' ? 'hiragana' : 'katakana'}_complete`) === 'true';
      if (isSystemUnlocked) {
          db[sys].forEach((level, index) => {
            if (localStorage.getItem(`${student}_progress_${sys}_${index}`) === 'unlocked' || index === 0) knownChars.push(...level.chars);
          });
      }
  }
  const playableWords = dictionary.filter(entry => entry.word.split('').every(char => knownChars.includes(char)));
  if(!vocabGrid) return; vocabGrid.innerHTML = '';
  playableWords.forEach(entry => {
    const div = document.createElement('div'); div.className = 'vocab-item';
    div.innerHTML = `<button class="audio-btn" style="font-size:1.2rem;">🔊</button> <span class="vocab-jp" style="font-size:1.2rem;">${entry.word}</span> <span class="vocab-en" style="font-size:0.9rem;">${entry.mean}</span>`;
    div.querySelector('.audio-btn').onclick = () => playAudio(entry.word);
    vocabGrid.appendChild(div);
  });
}

// --- 6. STUDY BUTTONS ---
const playAudioBtn = document.getElementById('play-audio-btn');
if(playAudioBtn) playAudioBtn.onclick = () => playAudio(activeCharUI.textContent.trim());

const clearCanvasBtn = document.getElementById('clear-canvas-btn');
if(clearCanvasBtn) clearCanvasBtn.onclick = () => { if(ctx){ ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); } };

const nextCharBtn = document.getElementById('next-char-btn');
if(nextCharBtn) nextCharBtn.onclick = () => {
  currentCharIndex = (currentCharIndex + 1) % db[currentSystem][currentLevelIndex].chars.length; loadCharacter();
};

const passLevelBtn = document.getElementById('pass-level-btn');
if(passLevelBtn) passLevelBtn.onclick = () => {
  const student = localStorage.getItem('nihongoStudent');
  if (currentLevelIndex + 1 < db[currentSystem].length) {
    localStorage.setItem(`${student}_progress_${currentSystem}_${currentLevelIndex + 1}`, 'unlocked');
    alert(`🎉 Level Passed!`);
    renderVocabulary(); openStudy(currentLevelIndex + 1); 
  } else {
    localStorage.setItem(`${student}_sys_${currentSystem}_complete`, 'true');
    alert(`🏆 Course Mastered!`);
    hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); renderCourseCards();
  }
};

// --- 7. QUIZ MODULE ---
const startCharBtn = document.getElementById('start-char-quiz-btn');
if(startCharBtn) startCharBtn.onclick = () => { currentQuizMode = 'char'; startQuiz(); };

const startVocabBtn = document.getElementById('start-vocab-quiz-btn');
if(startVocabBtn) startVocabBtn.onclick = () => { currentQuizMode = 'vocab'; startQuiz(); };

const quitQuizBtn = document.getElementById('quit-quiz-btn');
if(quitQuizBtn) quitQuizBtn.onclick = () => { hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); };

function startQuiz() {
  const student = localStorage.getItem('nihongoStudent');
  let knownChars = [];
  for (let sys in db) {
      const isSystemUnlocked = sys === 'hiragana' || localStorage.getItem(`${student}_sys_${sys === 'katakana' ? 'hiragana' : 'katakana'}_complete`) === 'true';
      if (isSystemUnlocked) {
        db[sys].forEach((l, i) => { if (localStorage.getItem(`${student}_progress_${sys}_${i}`) === 'unlocked' || i === 0) knownChars.push(...l.chars); });
      }
  }
  quizPool = currentQuizMode === 'char' ? [...new Set(knownChars)] : dictionary.filter(e => e.word.split('').every(c => knownChars.includes(c)));
  if (quizPool.length < 4) return alert("Unlock more items first!");
  currentQuestion = 0; score = 0; 
  hideAllViews(); if(viewQuiz) viewQuiz.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.remove('hidden'); loadNextQuestion();
}

function loadNextQuestion() {
  if (currentQuestion >= 10) { alert(`Score: ${score}/10`); hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); return; }
  currentQuestion++;
  const prog = document.getElementById('quiz-progress'); if(prog) prog.textContent = `Question ${currentQuestion} / 10`;
  const pool = [...quizPool].sort(() => 0.5 - Math.random());
  correctAnswer = pool[0];
  const options = pool.slice(0, 4).sort(() => 0.5 - Math.random());
  
  const qWord = document.getElementById('quiz-word');
  if(qWord) qWord.textContent = currentQuizMode === 'char' ? correctAnswer : correctAnswer.word;
  
  const grid = document.getElementById('quiz-options'); if(!grid) return; grid.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button'); btn.className = 'quiz-btn'; btn.style.cssText = "padding: 15px; font-size: 1.2rem; min-width: 100px;";
    btn.textContent = currentQuizMode === 'char' ? (characterMap[opt] || opt) : opt.mean;
    
    btn.onclick = () => {
      document.querySelectorAll('.quiz-btn').forEach(b => b.disabled = true);
      if (opt === correctAnswer) { btn.style.background = '#28a745'; score++; } else { btn.style.background = '#dc3545'; }
      setTimeout(loadNextQuestion, 1500);
    };
    grid.appendChild(btn);
  });
}

// --- 8. READING / SENTENCES / LIBRARY / TYPING (Stubbed for stability) ---
const btnIds = ['start-reading-btn', 'start-sentences-btn', 'start-library-btn', 'start-typing-btn'];
const viewIds = ['view-reading', 'view-sentences', 'view-library', 'view-typing'];
const quitIds = ['quit-reading-btn', 'quit-sentences-btn', 'quit-library-btn', 'quit-typing-btn'];

btnIds.forEach((id, i) => {
    const btn = document.getElementById(id);
    if(btn) btn.onclick = () => {
        hideAllViews(); 
        const view = document.getElementById(viewIds[i]);
        if(view) view.classList.add('active');
        if(navHomeBtn) navHomeBtn.classList.remove('hidden');
    };
});

quitIds.forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.onclick = () => {
        hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden');
    };
});

// --- 9. CANVAS DRAWING (TOUCH SAFE) ---
if(canvas && ctx) {
    ctx.strokeStyle = '#00d2ff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';      
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; draw(e); });
    canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
    canvas.addEventListener('mousemove', draw);
    
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; draw(e.touches[0]); e.preventDefault(); }, {passive: false});
    canvas.addEventListener('touchend', () => { isDrawing = false; ctx.beginPath(); });
    canvas.addEventListener('touchmove', (e) => { draw(e.touches[0]); e.preventDefault(); }, {passive: false});

    function draw(e) {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      ctx.stroke(); ctx.beginPath(); ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    }
}
