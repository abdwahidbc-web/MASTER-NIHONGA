// ==========================================
// NIHONGO MASTER | POPUP PRACTICE MODAL V7
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
const mainNav = document.getElementById('main-nav');

function hideAllViews() {
  [viewHome, viewLevels, viewStudy, viewQuiz, viewReading, viewSentences, viewLibrary, viewTyping].forEach(v => {
    if(v) v.classList.remove('active');
  });
  document.body.classList.remove('study-active');
  if(mainNav) mainNav.style.display = 'flex';
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

const studyBackBtn = document.getElementById('study-back-btn');
if (studyBackBtn) {
    studyBackBtn.onclick = () => {
        hideAllViews();
        if(viewLevels) viewLevels.classList.add('active');
        if(navHomeBtn) navHomeBtn.classList.remove('hidden');
        if(navLevelsBtn) navLevelsBtn.classList.add('hidden');
    };
}

// --- BATTLE-TESTED MOBILE AUDIO ENGINE ---
// Initialize voices early for mobile WebViews
if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); }

function playAudio(text) {
  const isSlowMode = document.getElementById('slow-audio-toggle')?.checked;
  
  // 1. Mobile WebViews (like Median) prefer standard HTML5 MP3 Audio.
  // We try this first because the built-in Speech Engine is often bugged on Android WebViews.
  try {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = isSlowMode ? 0.5 : 1.0;
      
      // Mobile browsers return a "Promise" when playing audio. 
      // If the phone blocks it, we catch the error and use the fallback.
      let playPromise = audio.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.log("Audio Stream blocked by phone, trying fallback...", error);
              fallbackSpeech(text, isSlowMode);
          });
      }
  } catch(e) { 
      fallbackSpeech(text, isSlowMode); 
  }
}

// 2. The Fallback: If the MP3 fails, force the native phone Speech Engine.
function fallbackSpeech(text, isSlowMode) {
  if ('speechSynthesis' in window && typeof window.speechSynthesis.speak === 'function') {
      window.speechSynthesis.cancel(); // Clear any stuck audio
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = isSlowMode ? 0.4 : 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.toLowerCase().includes('ja'));
      if (jaVoice) { utterance.voice = jaVoice; }
      
      window.speechSynthesis.speak(utterance);
  }
}

// ==========================================
// --- 3. STATE & DATA ---
// ==========================================
let currentSystem = ''; let currentLevelIndex = 0; let currentCharIndex = 0;
let quizPool = []; let currentQuestion = 0; let score = 0; let correctAnswer = null; let currentQuizMode = 'char';

const activeCharUI = document.getElementById('active-char');
const vocabGrid = document.getElementById('vocab-grid');

const db = {
  hiragana: [
    { id: 'h1', title: 'Level 1: A-Row', chars: ['あ', 'い', 'う', 'え', 'お'], unlocked: true },
    { id: 'h2', title: 'Level 2: K-Row', chars: ['か', 'き', 'く', 'け', 'こ'], unlocked: false },
    { id: 'h3', title: 'Level 3: S-Row', chars: ['さ', 'し', 'す', 'せ', 'そ'], unlocked: false },
    { id: 'h4', title: 'Level 4: T-Row', chars: ['た', 'ち', 'つ', 'て', 'と'], unlocked: false },
    { id: 'h5', title: 'Level 5: N-Row', chars: ['な', 'に', 'ぬ', 'ね', 'の'], unlocked: false },
    { id: 'h6', title: 'Level 6: H-Row', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'], unlocked: false },
    { id: 'h7', title: 'Level 7: M-Row', chars: ['ま', 'み', 'む', 'め', 'も'], unlocked: false },
    { id: 'h8', title: 'Level 8: Y-Row', chars: ['や', 'ゆ', 'よ'], unlocked: false },
    { id: 'h9', title: 'Level 9: R-Row', chars: ['ら', 'り', 'る', 'れ', 'ろ'], unlocked: false },
    { id: 'h10', title: 'Level 10: W-Row & N', chars: ['わ', 'を', 'ん'], unlocked: false },
    { id: 'h11', title: 'Level 11: G-Row (Dakuten)', chars: ['が', 'ぎ', 'ぐ', 'げ', 'ご'], unlocked: false },
    { id: 'h12', title: 'Level 12: Z & D-Row', chars: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど'], unlocked: false },
    { id: 'h13', title: 'Level 13: B & P-Row', chars: ['ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'], unlocked: false },
    { id: 'h14', title: 'Level 14: Combos (K, S, T)', chars: ['きゃ', 'きゅ', 'きょ', 'しゃ', 'しゅ', 'しょ', 'ちゃ', 'ちゅ', 'ちょ'], unlocked: false },
    { id: 'h15', title: 'Level 15: Combos (N, H, M)', chars: ['にゃ', 'にゅ', 'にょ', 'ひゃ', 'ひゅ', 'ひょ', 'みゃ', 'みゅ', 'みょ'], unlocked: false }
  ],
  katakana: [
    { id: 'k1', title: 'Level 1: A-Row', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'], unlocked: true },
    { id: 'k2', title: 'Level 2: K-Row', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'], unlocked: false },
    { id: 'k3', title: 'Level 3: S-Row', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'], unlocked: false },
    { id: 'k4', title: 'Level 4: T-Row', chars: ['タ', 'チ', 'ツ', 'テ', 'ト'], unlocked: false },
    { id: 'k5', title: 'Level 5: N-Row', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'], unlocked: false },
    { id: 'k6', title: 'Level 6: H-Row', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'], unlocked: false },
    { id: 'k7', title: 'Level 7: M-Row', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'], unlocked: false },
    { id: 'k8', title: 'Level 8: Y-Row', chars: ['ヤ', 'ユ', 'ヨ'], unlocked: false },
    { id: 'k9', title: 'Level 9: R-Row', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'], unlocked: false },
    { id: 'k10', title: 'Level 10: W-Row & N', chars: ['ワ', 'ヲ', 'ン'], unlocked: false },
    { id: 'k11', title: 'Level 11: G-Row (Dakuten)', chars: ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'], unlocked: false },
    { id: 'k12', title: 'Level 12: Z & D-Row', chars: ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド'], unlocked: false },
    { id: 'k13', title: 'Level 13: B & P-Row', chars: ['バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ'], unlocked: false },
    { id: 'k14', title: 'Level 14: Combos (K, S, T)', chars: ['キャ', 'キュ', 'キョ', 'シャ', 'シュ', 'ショ', 'チャ', 'チュ', 'チョ'], unlocked: false }
  ],
  kanji: [
    { id: 'j1', title: 'Level 1: Numbers (1-5)', chars: ['一', '二', '三', '四', '五'], unlocked: true },
    { id: 'j2', title: 'Level 2: Numbers (6-10)', chars: ['六', '七', '八', '九', '十'], unlocked: false },
    { id: 'j3', title: 'Level 3: Days & Elements', chars: ['日', '月', '火', '水', '木', '金', '土'], unlocked: false },
    { id: 'j4', title: 'Level 4: Nature', chars: ['山', '川', '田', '石', '花', '海', '空'], unlocked: false },
    { id: 'j5', title: 'Level 5: People & Body', chars: ['人', '目', '口', '耳', '手', '足', '心'], unlocked: false },
    { id: 'j6', title: 'Level 6: Directions', chars: ['上', '下', '左', '右', '中', '外', '前', '後'], unlocked: false },
    { id: 'j7', title: 'Level 7: Time & Date', chars: ['今', '年', '時', '間', '半', '分', '午'], unlocked: false },
    { id: 'j8', title: 'Level 8: School & Learning', chars: ['学', '生', '先', '校', '本', '字', '文'], unlocked: false },
    { id: 'j9', title: 'Level 9: Basic Actions', chars: ['行', '来', '見', '食', '飲', '立', '休'], unlocked: false },
    { id: 'j10', title: 'Level 10: Adjectives', chars: ['大', '小', '高', '安', '新', '古', '多', '少'], unlocked: false },
    { id: 'j11', title: 'Level 11: Colors & Shapes', chars: ['白', '黒', '赤', '青', '円', '形'], unlocked: false },
    { id: 'j12', title: 'Level 12: Family', chars: ['父', '母', '兄', '弟', '姉', '妹', '友'], unlocked: false },
    { id: 'j13', title: 'Level 13: Weather', chars: ['雨', '雪', '風', '晴', '雲', '春', '夏', '秋', '冬'], unlocked: false },
    { id: 'j14', title: 'Level 14: Places', chars: ['国', '町', '店', '駅', '道', '社', '家'], unlocked: false },
    { id: 'j15', title: 'Level 15: Objects', chars: ['車', '電', '気', '語', '名', '紙', '金'], unlocked: false }
  ]
};

const characterMap = {
  'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o', 'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so', 'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no', 'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo', 'や':'ya', 'ゆ':'yu', 'よ':'yo', 'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
  'わ':'wa', 'を':'wo', 'ん':'n', 'ー': '-', 'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go', 'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do', 'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
  'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po', 'きゃ':'kya', 'きゅ':'kyu', 'きょ':'kyo', 'しゃ':'sha', 'しゅ':'shu', 'しょ':'sho',
  'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o', 'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
  'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so', 'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to', 
  'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no', 'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho', 
  'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo', 'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo', 'ラ':'ra', 'リ':'ri', 'ル':'ru', 'レ':'re', 'ロ':'ro', 
  'ワ':'wa', 'ヲ':'wo', 'ン':'n', 'ガ':'ga', 'ギ':'gi', 'グ':'gu', 'ゲ':'ge', 'ゴ':'go', 'ザ':'za', 'ジ':'ji', 'ズ':'zu', 'ゼ':'ze', 'ゾ':'zo',
  'ダ':'da', 'ヂ':'ji', 'ヅ':'zu', 'デ':'de', 'ド':'do', 'バ':'ba', 'ビ':'bi', 'ブ':'bu', 'ベ':'be', 'ボ':'bo',
  'パ':'pa', 'ピ':'pi', 'プ':'pu', 'ペ':'pe', 'ポ':'po', 'キャ':'kya', 'キュ':'kyu', 'キョ':'kyo'
};
// --- NEW KANJI MEANINGS DICTIONARY ---
const kanjiMeanings = {
  '一': 'One (ichi)', '二': 'Two (ni)', '三': 'Three (san)', '四': 'Four (yon/shi)', '五': 'Five (go)', '六': 'Six (roku)', '七': 'Seven (nana/shichi)', '八': 'Eight (hachi)', '九': 'Nine (kyuu)', '十': 'Ten (juu)',
  '日': 'Day/Sun (nichi)', '月': 'Month/Moon (tsuki)', '火': 'Fire (hi)', '水': 'Water (mizu)', '木': 'Tree (ki)', '金': 'Gold/Money (kane)', '土': 'Earth/Soil (tsuchi)',
  '山': 'Mountain (yama)', '川': 'River (kawa)', '田': 'Rice Field (ta)', '石': 'Stone (ishi)', '花': 'Flower (hana)', '海': 'Sea (umi)', '空': 'Sky (sora)',
  '人': 'Person (hito)', '目': 'Eye (me)', '口': 'Mouth (kuchi)', '耳': 'Ear (mimi)', '手': 'Hand (te)', '足': 'Foot/Leg (ashi)', '心': 'Heart (kokoro)',
  '上': 'Up/Above (ue)', '下': 'Down/Below (shita)', '左': 'Left (hidari)', '右': 'Right (migi)', '中': 'Inside/Middle (naka)', '外': 'Outside (soto)', '前': 'Before/Front (mae)', '後': 'After/Behind (ato)',
  '今': 'Now (ima)', '年': 'Year (toshi)', '時': 'Time/Hour (toki/ji)', '間': 'Interval/Between (aida)', '半': 'Half (han)', '分': 'Minute/Part (fun)', '午': 'Noon (go)',
  '学': 'Study (gaku)', '生': 'Life/Birth (sei)', '先': 'Previous/Ahead (saki)', '校': 'School (kou)', '本': 'Book (hon)', '字': 'Character/Letter (ji)', '文': 'Sentence/Literature (bun)',
  '行': 'To go (iku)', '来': 'To come (kuru)', '見': 'To see (miru)', '食': 'To eat (taberu)', '飲': 'To drink (nomu)', '立': 'To stand (tatsu)', '休': 'To rest (yasumu)',
  '大': 'Big (ookii)', '小': 'Small (chiisai)', '高': 'High/Expensive (takai)', '安': 'Cheap/Safe (yasui)', '新': 'New (atarashii)', '古': 'Old (furui)', '多': 'Many (ooi)', '少': 'Few (sukunai)',
  '白': 'White (shiro)', '黒': 'Black (kuro)', '赤': 'Red (aka)', '青': 'Blue (ao)', '円': 'Yen/Circle (en)', '形': 'Shape (katachi)',
  '父': 'Father (chichi)', '母': 'Mother (haha)', '兄': 'Older Brother (ani)', '弟': 'Younger Brother (otouto)', '姉': 'Older Sister (ane)', '妹': 'Younger Sister (imouto)', '友': 'Friend (tomo)',
  '雨': 'Rain (ame)', '雪': 'Snow (yuki)', '風': 'Wind (kaze)', '晴': 'Clear/Sunny (hare)', '雲': 'Cloud (kumo)', '春': 'Spring (haru)', '夏': 'Summer (natsu)', '秋': 'Autumn (aki)', '冬': 'Winter (fuyu)',
  '国': 'Country (kuni)', '町': 'Town (machi)', '店': 'Shop (mise)', '駅': 'Station (eki)', '道': 'Road (michi)', '社': 'Company (sha)', '家': 'House (ie)',
  '車': 'Car (kuruma)', '電': 'Electricity (den)', '気': 'Spirit/Mind (ki)', '語': 'Language (go)', '名': 'Name (na)', '紙': 'Paper (kami)'
};
const dictionary = [
  { word: 'あお', mean: 'Blue (ao)' }, { word: 'あい', mean: 'Love (ai)' }, { word: 'いいえ', mean: 'No (iie)' },
  { word: 'あか', mean: 'Red (aka)' }, { word: 'かき', mean: 'Persimmon (kaki)' }, { word: 'いく', mean: 'To go (iku)' },
  { word: 'すし', mean: 'Sushi (sushi)' }, { word: 'かさ', mean: 'Umbrella (kasa)' }, { word: 'あし', mean: 'Leg (ashi)' },
  { word: 'あした', mean: 'Tomorrow (ashita)' }, { word: 'て', mean: 'Hand (te)' }, { word: 'した', mean: 'Under (shita)' },
  { word: 'なに', mean: 'What? (nani)' }, { word: 'いぬ', mean: 'Dog (inu)' }, { word: 'ねこ', mean: 'Cat (neko)' },
  { word: 'はな', mean: 'Flower (hana)' }, { word: 'ひと', mean: 'Person (hito)' }, { word: 'ほし', mean: 'Star (hoshi)' },
  { word: 'みみ', mean: 'Ear (mimi)' }, { word: 'め', mean: 'Eye (me)' }, { word: 'うみ', mean: 'Sea (umi)' },
  { word: 'やま', mean: 'Mountain (yama)' }, { word: 'ゆき', mean: 'Snow (yuki)' }, { word: 'よむ', mean: 'To read (yomu)' },
  { word: 'くるま', mean: 'Car (kuruma)' }, { word: 'さくら', mean: 'Cherry Blossom (sakura)' },
  { word: 'わたし', mean: 'I / Me (watashi)' }, { word: 'ほん', mean: 'Book (hon)' }, { word: 'にほん', mean: 'Japan (nihon)' },
  { word: 'たべもの', mean: 'Food (tabemono)' }, { word: 'のみもの', mean: 'Drink (nomimono)' }, { word: 'くだもの', mean: 'Fruit (kudamono)' },
  { word: 'やさい', mean: 'Vegetable (yasai)' }, { word: 'さかな', mean: 'Fish (sakana)' }, { word: 'にく', mean: 'Meat (niku)' },
  { word: 'たまご', mean: 'Egg (tamago)' }, { word: 'みず', mean: 'Water (mizu)' }, { word: 'おちゃ', mean: 'Tea (ocha)' },
  { word: 'ぎゅうにゅう', mean: 'Milk (gyuunyuu)' }, { word: 'かぞく', mean: 'Family (kazoku)' }, { word: 'ともだち', mean: 'Friend (tomodachi)' },
  { word: 'がっこう', mean: 'School (gakkou)' }, { word: 'せんせい', mean: 'Teacher (sensei)' }, { word: 'がくせい', mean: 'Student (gakusei)' },
  { word: 'かいしゃ', mean: 'Company (kaisha)' }, { word: 'しごと', mean: 'Work (shigoto)' }, { word: 'べんきょう', mean: 'Study (benkyou)' },
  { word: 'あさ', mean: 'Morning (asa)' }, { word: 'ひる', mean: 'Noon (hiru)' }, { word: 'よる', mean: 'Night (yoru)' },
  { word: 'きょう', mean: 'Today (kyou)' }, { word: 'きのう', mean: 'Yesterday (kinou)' }, { word: 'いま', mean: 'Now (ima)' },
  { word: 'てんき', mean: 'Weather (tenki)' }, { word: 'はれ', mean: 'Sunny (hare)' }, { word: 'あめ', mean: 'Rain (ame)' },
  { word: 'おおきい', mean: 'Big (ookii)' }, { word: 'ちいさい', mean: 'Small (chiisai)' }, { word: 'たかい', mean: 'High/Expensive (takai)' },
  { word: 'やすい', mean: 'Cheap (yasui)' }, { word: 'あたらしい', mean: 'New (atarashii)' }, { word: 'ふるい', mean: 'Old (furui)' },
  { word: 'いい', mean: 'Good (ii)' }, { word: 'わるい', mean: 'Bad (warui)' }, { word: 'むずかしい', mean: 'Difficult (muzukashii)' },
  { word: 'やさしい', mean: 'Easy/Kind (yasashii)' }, { word: 'おいしい', mean: 'Delicious (oishii)' }, { word: 'たのしい', mean: 'Fun (tanoshii)' },
  { word: 'あそぶ', mean: 'To play (asobu)' }, { word: 'およぐ', mean: 'To swim (oyogu)' }, { word: 'まつ', mean: 'To wait (matsu)' },
  { word: 'わかる', mean: 'To understand (wakaru)' }, { word: 'はなす', mean: 'To speak (hanasu)' }, { word: 'きく', mean: 'To listen (kiku)' },
  { word: 'おきる', mean: 'To wake up (okiru)' }, { word: 'ねる', mean: 'To sleep (neru)' }, { word: 'みる', mean: 'To see/watch (miru)' },
  { word: 'エア', mean: 'Air (ea)' }, { word: 'ケーキ', mean: 'Cake (keeki)' }, { word: 'ココア', mean: 'Cocoa (kokoa)' },
  { word: 'アイス', mean: 'Ice (aisu)' }, { word: 'テスト', mean: 'Test (tesuto)' }, { word: 'コーヒー', mean: 'Coffee (koohii)' },
  { word: 'スマホ', mean: 'Smartphone (sumaho)' }, { word: 'カメラ', mean: 'Camera (kamera)' }, { word: 'クラス', mean: 'Class (kurasu)' },
  { word: 'パソコン', mean: 'Personal Computer (pasokon)' }, { word: 'インターネット', mean: 'Internet (intaanetto)' }, { word: 'テレビ', mean: 'TV (terebi)' },
  { word: 'ラジオ', mean: 'Radio (rajio)' }, { word: 'ニュース', mean: 'News (nyuusu)' }, { word: 'スポーツ', mean: 'Sports (supootsu)' },
  { word: 'サッカー', mean: 'Soccer (sakkaa)' }, { word: 'テニス', mean: 'Tennis (tenisu)' }, { word: 'バス', mean: 'Bus (basu)' },
  { word: 'タクシー', mean: 'Taxi (takushii)' }, { word: 'ホテル', mean: 'Hotel (hoteru)' }, { word: 'レストラン', mean: 'Restaurant (resutoran)' },
  { word: 'メニュー', mean: 'Menu (menyuu)' }, { word: 'パン', mean: 'Bread (pan)' }, { word: 'バター', mean: 'Butter (bataa)' },
  { word: 'チーズ', mean: 'Cheese (chiizu)' }, { word: 'ハンバーグ', mean: 'Hamburg Steak (hanbaagu)' }, { word: 'ラーメン', mean: 'Ramen (raamen)' },
  { word: 'ジュース', mean: 'Juice (juusu)' }, { word: 'ビール', mean: 'Beer (biiru)' }, { word: 'ワイン', mean: 'Wine (wain)' },
  { word: 'テーブル', mean: 'Table (teeburu)' }, { word: 'ベッド', mean: 'Bed (beddo)' }, { word: 'ドア', mean: 'Door (doa)' },
  { word: 'ペン', mean: 'Pen (pen)' }, { word: 'ノート', mean: 'Notebook (nooto)' }, { word: 'シャツ', mean: 'Shirt (shatsu)' },
  { word: 'パンツ', mean: 'Pants (pantsu)' }, { word: 'シューズ', mean: 'Shoes (shuuzu)' }, { word: 'カレンダー', mean: 'Calendar (karendaa)' },
  { word: 'マンション', mean: 'Apartment (manshon)' }, { word: 'アパート', mean: 'Apartment (apaato)' }, { word: 'ビル', mean: 'Building (biru)' },
  { word: 'エレベーター', mean: 'Elevator (erebeetaa)' }, { word: 'エスカレーター', mean: 'Escalator (esukareetaa)' }, { word: 'トイレ', mean: 'Toilet (toire)' },
  { word: 'シャワー', mean: 'Shower (shawaa)' }, { word: 'エアコン', mean: 'Air Conditioner (eakon)' }, { word: 'ゲーム', mean: 'Game (geemu)' },
  { word: 'アニメ', mean: 'Anime (anime)' }, { word: 'カラオケ', mean: 'Karaoke (karaoke)' }, { word: 'スーパー', mean: 'Supermarket (suupaa)' },
  { word: 'デパート', mean: 'Department Store (depaato)' }, { word: 'コンビニ', mean: 'Convenience Store (konbini)' }, { word: 'カード', mean: 'Card (kaado)' },
  { word: '一', mean: 'One (ichi)' }, { word: '水', mean: 'Water (mizu)' }, { word: '火', mean: 'Fire (hi)' },
  { word: '山', mean: 'Mountain (yama)' }, { word: '人', mean: 'Person (hito)' }, { word: '上', mean: 'Up (ue)' },
  { word: '先生', mean: 'Teacher (sensei)' }, { word: '学生', mean: 'Student (gakusei)' }, { word: '行く', mean: 'To go (iku)' },
  { word: '新しい', mean: 'New (atarashii)' }, { word: '大きい', mean: 'Big (ookii)' }, { word: '今年', mean: 'This Year (kotoshi)' },
  { word: '学校', mean: 'School (gakkou)' }, { word: '日本人', mean: 'Japanese Person (nihonjin)' }, { word: '車', mean: 'Car (kuruma)' },
  { word: '電気', mean: 'Electricity (denki)' }, { word: '電車', mean: 'Train (densha)' }, { word: '休日', mean: 'Holiday (kyuujitsu)' },
  { word: '本', mean: 'Book (hon)' }, { word: '文字', mean: 'Character/Letter (moji)' }, { word: '空', mean: 'Sky (sora)' },
  { word: '白', mean: 'White (shiro)' }, { word: '黒', mean: 'Black (kuro)' }, { word: '赤', mean: 'Red (aka)' },
  { word: '青', mean: 'Blue (ao)' }, { word: '男', mean: 'Man (otoko)' }, { word: '女', mean: 'Woman (onna)' },
  { word: '子ども', mean: 'Child (kodomo)' }, { word: '時計', mean: 'Watch/Clock (tokei)' }, { word: '時間', mean: 'Time (jikan)' },
  { word: '会社', mean: 'Company (kaisha)' }, { word: '名前', mean: 'Name (namae)' }, { word: '友達', mean: 'Friend (tomodachi)' }
];

const readingDb = [
  { jp: "こんにちは。私の名前は田中です。私は東京に住んでいます。", en: "Hello. My name is Tanaka. I live in Tokyo." },
  { jp: "今日はとてもいい天気ですね。公園を散歩しましょう。", en: "The weather is very nice today, isn't it? Let's take a walk in the park." },
  { jp: "日本の食べ物は美味しいです。特に寿司とラーメンが好きです。", en: "Japanese food is delicious. I especially like sushi and ramen." },
  { jp: "毎朝、七時に起きます。そして、コーヒーを飲みながら本を読みます。", en: "I wake up at 7 o'clock every morning. Then, I read a book while drinking coffee." },
  { jp: "週末は友達と映画を見に行きます。とても楽しみです！", en: "I'm going to watch a movie with my friends this weekend. I'm really looking forward to it!" },
  { jp: "私の趣味は音楽を聞くことです。ジャズが一番好きです。", en: "My hobby is listening to music. I like jazz best." },
  { jp: "来年、日本へ旅行に行きたいです。富士山を見たいです。", en: "Next year, I want to travel to Japan. I want to see Mount Fuji." }
];

const sentenceDb = [
    { sys: 'hiragana', level: 1, jp: "おはようございます。", en: "Good morning." },
    { sys: 'hiragana', level: 1, jp: "こんにちは。", en: "Hello / Good afternoon." },
    { sys: 'hiragana', level: 1, jp: "こんばんは。", en: "Good evening." },
    { sys: 'hiragana', level: 2, jp: "ありがとうございます。", en: "Thank you very much." },
    { sys: 'hiragana', level: 2, jp: "ごめんなさい。", en: "I am sorry." },
    { sys: 'hiragana', level: 2, jp: "すみません。", en: "Excuse me / I'm sorry." },
    { sys: 'hiragana', level: 3, jp: "はい、そうです。", en: "Yes, that is right." },
    { sys: 'hiragana', level: 3, jp: "いいえ、ちがいます。", en: "No, that is wrong." },
    { sys: 'hiragana', level: 3, jp: "わかりました。", en: "I understand / Understood." },
    { sys: 'hiragana', level: 4, jp: "わかりません。", en: "I do not understand." },
    { sys: 'hiragana', level: 4, jp: "これはなんですか？", en: "What is this?" },
    { sys: 'hiragana', level: 4, jp: "それをください。", en: "Please give me that." },
    { sys: 'hiragana', level: 5, jp: "おげんきですか？", en: "How are you?" },
    { sys: 'hiragana', level: 5, jp: "はい、げんきです。", en: "Yes, I am fine." },
    { sys: 'hiragana', level: 5, jp: "いただきます。", en: "Let's eat (said before meals)." },
    { sys: 'hiragana', level: 6, jp: "ごちそうさまでした。", en: "Thank you for the meal (said after meals)." },
    { sys: 'hiragana', level: 6, jp: "いってきます。", en: "I am leaving (but will return)." },
    { sys: 'hiragana', level: 6, jp: "いってらっしゃい。", en: "Have a good trip / Take care." },
    { sys: 'hiragana', level: 7, jp: "ただいま。", en: "I am home." },
    { sys: 'hiragana', level: 7, jp: "おかえりなさい。", en: "Welcome back." },
    { sys: 'hiragana', level: 7, jp: "おねがいします。", en: "Please (when asking for a favor)." },
    { sys: 'hiragana', level: 8, jp: "どういたしまして。", en: "You are welcome." },
    { sys: 'hiragana', level: 8, jp: "はじめまして。", en: "Nice to meet you (for the first time)." },
    { sys: 'hiragana', level: 8, jp: "よろしくおねがいします。", en: "Please treat me well / I look forward to working with you." },
    { sys: 'hiragana', level: 9, jp: "どこですか？", en: "Where is it?" },
    { sys: 'hiragana', level: 9, jp: "いつですか？", en: "When is it?" },
    { sys: 'hiragana', level: 9, jp: "だれですか？", en: "Who is it?" },
    { sys: 'hiragana', level: 10, jp: "どうしてですか？", en: "Why is that?" },
    { sys: 'hiragana', level: 10, jp: "いくらですか？", en: "How much is it?" },
    { sys: 'hiragana', level: 11, jp: "もういちどおねがいします。", en: "One more time, please." },
    { sys: 'hiragana', level: 11, jp: "ゆっくりはなしてください。", en: "Please speak slowly." },
    { sys: 'hiragana', level: 12, jp: "ちょっとまってください。", en: "Please wait a moment." },
    { sys: 'hiragana', level: 13, jp: "だいじょうぶですか？", en: "Are you okay?" },
    { sys: 'hiragana', level: 14, jp: "ほんとうですか？", en: "Really? / Is that true?" },
    { sys: 'hiragana', level: 15, jp: "きをつけてください。", en: "Please be careful." },
    { sys: 'katakana', level: 1, jp: "アメリカから来ました。", en: "I came from America." },
    { sys: 'katakana', level: 1, jp: "トイレはどこですか？", en: "Where is the toilet?" },
    { sys: 'katakana', level: 2, jp: "コーヒーをお願いします。", en: "Coffee, please." },
    { sys: 'katakana', level: 2, jp: "パンを食べます。", en: "I eat bread." },
    { sys: 'katakana', level: 3, jp: "クレジットカードは使えますか？", en: "Can I use a credit card?" },
    { sys: 'katakana', level: 3, jp: "スマホを忘れました。", en: "I forgot my smartphone." },
    { sys: 'katakana', level: 4, jp: "ホテルを予約しました。", en: "I booked a hotel." },
    { sys: 'katakana', level: 4, jp: "テレビを見ます。", en: "I watch TV." },
    { sys: 'katakana', level: 5, jp: "レストランに行きます。", en: "I am going to a restaurant." },
    { sys: 'katakana', level: 5, jp: "メニューをください。", en: "Please give me the menu." },
    { sys: 'katakana', level: 6, jp: "タクシーを呼んでください。", en: "Please call a taxi." },
    { sys: 'katakana', level: 6, jp: "カメラで写真を撮ります。", en: "I take pictures with a camera." },
    { sys: 'katakana', level: 7, jp: "パソコンを使います。", en: "I use a personal computer." },
    { sys: 'katakana', level: 7, jp: "インターネットがありません。", en: "There is no internet." },
    { sys: 'katakana', level: 8, jp: "アニメが好きです。", en: "I like anime." },
    { sys: 'katakana', level: 8, jp: "ゲームをします。", en: "I play games." },
    { sys: 'katakana', level: 9, jp: "スーパーで買い物をします。", en: "I shop at the supermarket." },
    { sys: 'katakana', level: 9, jp: "コンビニに行きます。", en: "I am going to the convenience store." },
    { sys: 'katakana', level: 10, jp: "ドアを開けてください。", en: "Please open the door." },
    { sys: 'katakana', level: 10, jp: "ベッドで寝ます。", en: "I sleep in the bed." },
    { sys: 'katakana', level: 11, jp: "シャワーを浴びます。", en: "I take a shower." },
    { sys: 'katakana', level: 11, jp: "エアコンをつけてください。", en: "Please turn on the air conditioner." },
    { sys: 'katakana', level: 12, jp: "エレベーターはあそこです。", en: "The elevator is over there." },
    { sys: 'katakana', level: 12, jp: "エスカレーターに乗ります。", en: "I take the escalator." },
    { sys: 'katakana', level: 13, jp: "チーズとワインをお願いします。", en: "Cheese and wine, please." },
    { sys: 'katakana', level: 13, jp: "ジュースを飲みます。", en: "I drink juice." },
    { sys: 'katakana', level: 14, jp: "ニュースを見ます。", en: "I watch the news." },
    { sys: 'katakana', level: 14, jp: "スポーツをします。", en: "I play sports." },
    { sys: 'kanji', level: 1, jp: "一から十まで数えてください。", en: "Please count from 1 to 10." },
    { sys: 'kanji', level: 1, jp: "一人で行きます。", en: "I will go alone." },
    { sys: 'kanji', level: 2, jp: "今は何時ですか？", en: "What time is it now?" },
    { sys: 'kanji', level: 2, jp: "今日は休みです。", en: "Today is a day off." },
    { sys: 'kanji', level: 3, jp: "今日は月曜日です。", en: "Today is Monday." },
    { sys: 'kanji', level: 3, jp: "水を飲みます。", en: "I drink water." },
    { sys: 'kanji', level: 4, jp: "山に行きたいです。", en: "I want to go to the mountains." },
    { sys: 'kanji', level: 4, jp: "空が青いです。", en: "The sky is blue." },
    { sys: 'kanji', level: 5, jp: "あの人は私の先生です。", en: "That person is my teacher." },
    { sys: 'kanji', level: 5, jp: "目が痛いです。", en: "My eyes hurt." },
    { sys: 'kanji', level: 6, jp: "上を見てください。", en: "Please look up." },
    { sys: 'kanji', level: 6, jp: "右に曲がってください。", en: "Please turn right." },
    { sys: 'kanji', level: 7, jp: "今年は日本へ行きます。", en: "I am going to Japan this year." },
    { sys: 'kanji', level: 7, jp: "半分ください。", en: "Please give me half." },
    { sys: 'kanji', level: 8, jp: "学校に行きます。", en: "I go to school." },
    { sys: 'kanji', level: 8, jp: "本を読みます。", en: "I read a book." },
    { sys: 'kanji', level: 9, jp: "朝ごはんを食べます。", en: "I eat breakfast." },
    { sys: 'kanji', level: 9, jp: "早く来てください。", en: "Please come early." },
    { sys: 'kanji', level: 10, jp: "大きい車ですね。", en: "That is a big car, isn't it?" },
    { sys: 'kanji', level: 10, jp: "新しい靴を買いました。", en: "I bought new shoes." },
    { sys: 'kanji', level: 11, jp: "白い犬がいます。", en: "There is a white dog." },
    { sys: 'kanji', level: 11, jp: "赤いりんごが好きです。", en: "I like red apples." },
    { sys: 'kanji', level: 12, jp: "私の母は優しいです。", en: "My mother is kind." },
    { sys: 'kanji', level: 12, jp: "友達と遊びます。", en: "I play/hang out with friends." },
    { sys: 'kanji', level: 13, jp: "今日は雨が降っています。", en: "It is raining today." },
    { sys: 'kanji', level: 13, jp: "冬は寒いです。", en: "Winter is cold." },
    { sys: 'kanji', level: 14, jp: "駅はどこですか？", en: "Where is the train station?" },
    { sys: 'kanji', level: 14, jp: "店に入ります。", en: "I enter the store." },
    { sys: 'kanji', level: 15, jp: "電車に乗ります。", en: "I ride the train." },
    { sys: 'kanji', level: 15, jp: "お金がありません。", en: "I have no money." }
];

// ==========================================
// --- 5. INITIALIZATION & CORE LOGIC ---
// ==========================================
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
  document.body.classList.add('study-active');
  if(mainNav) mainNav.style.display = 'none';
  
  const title = document.getElementById('study-level-title');
  if(title) title.textContent = db[currentSystem][levelIndex].title;
  loadCharacter(); renderVocabulary();
}

function loadCharacter() {
  const char = db[currentSystem][currentLevelIndex].chars[currentCharIndex];
  
  // --- SMART SIZING LOGIC ---
  // If the character string is longer than 1 (like キャ), shrink the font so it fits!
  const isCombo = char.length > 1;
  const mainFontSize = isCombo ? '4rem' : '6rem';
  const modalFontSize = isCombo ? '3.5rem' : '5.5rem';

  if(activeCharUI) { 
      activeCharUI.textContent = char; 
      activeCharUI.style.fontSize = mainFontSize;
      activeCharUI.style.whiteSpace = 'nowrap'; // Forces them to stay side-by-side
  }
  
  // Set the proper meaning or Romaji
  const displayMeaning = currentSystem === 'kanji' ? (kanjiMeanings[char] || "Kanji") : (characterMap[char] || char);
  
  const meaningUI = document.getElementById('active-char-meaning');
  if(meaningUI) { meaningUI.textContent = displayMeaning; }

  const modalGuideChar = document.getElementById('modal-guide-char');
  if(modalGuideChar) { 
      modalGuideChar.textContent = char; 
      modalGuideChar.classList.remove('enlarged-guide'); 
      modalGuideChar.style.fontSize = modalFontSize;
      modalGuideChar.style.whiteSpace = 'nowrap'; // Forces them to stay side-by-side
  }
  
  const modalMeaningUI = document.getElementById('modal-char-meaning');
  if(modalMeaningUI) { modalMeaningUI.textContent = displayMeaning; }

  if(ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); }
}

// ==========================================
// --- 6. SMART FILTERING VOCABULARY ---
// ==========================================
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
  
  // First, find all words the user can spell
  let playableWords = dictionary.filter(entry => entry.word.split('').every(char => knownChars.includes(char)));
  
  // --- THE SMART FILTER ---
  // If in Kanji mode, ONLY show words that contain Kanji characters!
  // If in Katakana mode, ONLY show Katakana words!
  // If in Hiragana mode, ONLY show pure Hiragana words!
  if (currentSystem === 'kanji') {
      playableWords = playableWords.filter(entry => /[\u4E00-\u9FAF]/.test(entry.word));
  } else if (currentSystem === 'katakana') {
      playableWords = playableWords.filter(entry => /[\u30A0-\u30FF]/.test(entry.word));
  } else if (currentSystem === 'hiragana') {
      playableWords = playableWords.filter(entry => !/[\u4E00-\u9FAF]/.test(entry.word) && !/[\u30A0-\u30FF]/.test(entry.word));
  }

  const vocabGrid = document.getElementById('vocab-grid');
  if(!vocabGrid) return; 
  vocabGrid.innerHTML = '';

  if (playableWords.length === 0) {
      vocabGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 10px; color: #aaa;">Pass more levels to unlock words!</div>';
      return;
  }

  playableWords.forEach(entry => {
    const div = document.createElement('div'); 
    div.style.cssText = 'background: #2a2a35; padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 8px;';
    div.innerHTML = `
        <button class="audio-btn" style="background: #3f51b5; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; flex-shrink: 0; font-size: 0.9rem; cursor: pointer; display: flex; justify-content: center; align-items: center;">🔊</button>
        <div style="display: flex; flex-direction: column; overflow: hidden;">
            <span style="font-size: 1rem; color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${entry.word}</span>
            <span style="font-size: 0.75rem; color: #00d2ff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${entry.mean}</span>
        </div>
    `;
    div.querySelector('.audio-btn').onclick = () => playAudio(entry.word);
    vocabGrid.appendChild(div);
  });
}

// ==========================================
// --- 6. POPUP MODAL & STUDY CONTROLS ---
// ==========================================
const playAudioBtn = document.getElementById('play-audio-btn');
if(playAudioBtn) playAudioBtn.onclick = () => playAudio(activeCharUI.textContent.trim());

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

// --- POPUP MODAL LOGIC ---
const practiceModal = document.getElementById('practice-modal');
const openModalBtn = document.getElementById('open-practice-modal-btn');
const closeModalBtn = document.getElementById('modal-close-btn');
const modalReplayBtn = document.getElementById('modal-replay-btn');
const modalClearBtn = document.getElementById('modal-clear-btn');
const modalGuideChar = document.getElementById('modal-guide-char');
const canvas = document.getElementById('writing-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;

// Inject CSS for the guide animation
if (!document.getElementById('guide-css')) {
    const style = document.createElement('style');
    style.id = 'guide-css';
    style.innerHTML = `
        @keyframes drawStroke { to { stroke-dashoffset: 0; } }
        /* Increased SVG size to match the new 150px box */
        .enlarged-guide svg { width: 140px; height: 140px; } 
        .enlarged-guide path { fill: none; stroke: #ff3366; stroke-width: 4; stroke-linecap: round; }
        .enlarged-guide text { display: none; }
    `;
    document.head.appendChild(style);
}
// Open Modal and Start Animation
if(openModalBtn) {
    openModalBtn.onclick = () => {
        practiceModal.style.display = 'flex';
        if(ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); }
        playGuideAnimation();
    }
}

// Close Modal
if(closeModalBtn) {
    closeModalBtn.onclick = () => {
        practiceModal.style.display = 'none';
    }
}

// Replay Animation
if(modalReplayBtn) modalReplayBtn.onclick = playGuideAnimation;

// Clear Canvas
if(modalClearBtn) {
    modalClearBtn.onclick = () => {
        if(ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); }
    }
}

async function playGuideAnimation() {
  const char = activeCharUI.textContent.trim();
  modalGuideChar.innerHTML = char;
  modalGuideChar.classList.remove('enlarged-guide');

  if (char.includes('<svg')) return;

  const hex = char.charCodeAt(0).toString(16).padStart(5, '0');
  try {
    const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`);
    if (!res.ok) throw new Error("Not found");
    const svg = await res.text();
    
    modalGuideChar.innerHTML = svg.substring(svg.indexOf('<svg'));
    modalGuideChar.classList.add('enlarged-guide');

    modalGuideChar.querySelectorAll('path').forEach((p, i) => {
      const l = p.getTotalLength(); 
      p.style.strokeDasharray = l; 
      p.style.strokeDashoffset = l;
      p.style.animation = `drawStroke 1s forwards ${i * 1.1}s`;
    });
  } catch (e) { console.log("Guide currently unavailable for this character."); }
}

// --- CANVAS DRAWING LOGIC ---
if(canvas && ctx) {
    ctx.strokeStyle = '#00d2ff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';      
    
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; draw(e); });
    canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
    canvas.addEventListener('mousemove', draw);
    
    // Prevent default touch behaviors (like scrolling) while drawing
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; draw(e.touches[0]); e.preventDefault(); }, {passive: false});
    canvas.addEventListener('touchend', (e) => { isDrawing = false; ctx.beginPath(); e.preventDefault(); }, {passive: false});
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

// ==========================================
// --- 7. QUIZ MODULE ---
// ==========================================
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

// ==========================================
// --- 8. READING MODULE ---
// ==========================================
let currentParagraphIndex = 0;
const startReadingBtn = document.getElementById('start-reading-btn');
const quitReadingBtn = document.getElementById('quit-reading-btn');
if (startReadingBtn) startReadingBtn.onclick = () => { currentParagraphIndex = 0; hideAllViews(); if(viewReading) viewReading.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.remove('hidden'); loadParagraph(); };
if (quitReadingBtn) quitReadingBtn.onclick = () => { hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); };

function loadParagraph() {
    const data = readingDb[currentParagraphIndex];
    const jpUI = document.getElementById('reading-jp'); const enUI = document.getElementById('reading-en'); const tBtn = document.getElementById('toggle-translation-btn');
    if(jpUI) jpUI.textContent = data.jp;
    if(enUI) { enUI.textContent = data.en; enUI.classList.add('hidden'); }
    if(tBtn) tBtn.textContent = "👁️ Translate";
}

const toggleTransBtn = document.getElementById('toggle-translation-btn');
if (toggleTransBtn) toggleTransBtn.onclick = () => {
    const enUI = document.getElementById('reading-en');
    if(enUI) enUI.classList.toggle('hidden');
    toggleTransBtn.textContent = enUI.classList.contains('hidden') ? "👁️ Translate" : "🙈 Hide";
};

const nextParaBtn = document.getElementById('next-paragraph-btn');
if (nextParaBtn) nextParaBtn.onclick = () => {
    currentParagraphIndex++;
    if (currentParagraphIndex >= readingDb.length) { currentParagraphIndex = 0; alert("Finished!"); hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); } 
    else { loadParagraph(); }
};

const readAudioBtn = document.getElementById('read-audio-btn');
if (readAudioBtn) readAudioBtn.onclick = () => playAudio(readingDb[currentParagraphIndex].jp);

// ==========================================
// --- 9. SENTENCE BANK MODULE ---
// ==========================================
const startSentencesBtn = document.getElementById('start-sentences-btn');
const quitSentencesBtn = document.getElementById('quit-sentences-btn');
if (startSentencesBtn) startSentencesBtn.onclick = () => { hideAllViews(); if(viewSentences) viewSentences.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.remove('hidden'); renderSentences(); };
if (quitSentencesBtn) quitSentencesBtn.onclick = () => { hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); };

function renderSentences() {
    const student = localStorage.getItem('nihongoStudent');
    const listUI = document.getElementById('sentence-list');
    if(!listUI) return;
    listUI.innerHTML = '';
    let unlockedCount = 0;

    sentenceDb.forEach(item => {
        let isUnlocked = false;
        if (localStorage.getItem(`${student}_sys_${item.sys}_complete`) === 'true') isUnlocked = true;
        else if (localStorage.getItem(`${student}_progress_${item.sys}_${item.level}`) === 'unlocked') isUnlocked = true;

        if (isUnlocked) {
            unlockedCount++;
            const div = document.createElement('div');
            div.style.cssText = 'background: #1a1a24; padding: 20px; border-radius: 12px; border-left: 4px solid #9c27b0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            div.innerHTML = `<div><div style="font-size: 1.4rem; color: #fff; font-weight: bold; margin-bottom: 5px;">${item.jp}</div><div style="font-size: 1rem; color: #aaa;">${item.en}</div></div><button class="audio-btn" style="font-size: 1.8rem; background: none; border: none; cursor: pointer;">🔊</button>`;
            div.querySelector('.audio-btn').onclick = () => playAudio(item.jp);
            listUI.appendChild(div);
        }
    });
    if (unlockedCount === 0) listUI.innerHTML = `<div style="text-align: center; padding: 40px; background: #1a1a24; border-radius: 12px; border: 1px dashed #444;"><span style="font-size: 3rem; display: block; margin-bottom: 15px;">🔒</span><p style="color: #aaa; font-size: 1.1rem;">Your sentence vault is locked.</p></div>`;
}

// ==========================================
// --- 10. THE LIBRARY MODULE ---
// ==========================================
const startLibraryBtn = document.getElementById('start-library-btn');
const quitLibraryBtn = document.getElementById('quit-library-btn');
const librarySearch = document.getElementById('library-search');

if (startLibraryBtn) startLibraryBtn.onclick = () => { hideAllViews(); if(viewLibrary) viewLibrary.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.remove('hidden'); renderLibrary(""); };
if (quitLibraryBtn) quitLibraryBtn.onclick = () => { hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); };
if (librarySearch) librarySearch.addEventListener('input', (e) => renderLibrary(e.target.value.toLowerCase()));

function renderLibrary(searchTerm) {
    const results = document.getElementById('library-results'); if(!results) return;
    results.innerHTML = '';
    const filtered = dictionary.filter(entry => entry.mean.toLowerCase().includes(searchTerm) || entry.word.includes(searchTerm));
    
    filtered.forEach(entry => {
        const div = document.createElement('div');
        div.style.cssText = 'background: #1a1a24; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
        div.innerHTML = `<div><span style="font-size: 1.5rem; color: white; font-weight: bold; margin-right: 15px;">${entry.word}</span><span style="color: #aaa;">${entry.mean}</span></div><button class="audio-btn" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">🔊</button>`;
        div.querySelector('.audio-btn').onclick = () => playAudio(entry.word);
        results.appendChild(div);
    });
}

// ==========================================
// --- 11. TYPING STUDIO MODULE ---
// ==========================================
const startTypingBtn = document.getElementById('start-typing-btn');
const quitTypingBtn = document.getElementById('quit-typing-btn');
let targetRomaji = ""; let currentTyped = "";

if (startTypingBtn) startTypingBtn.onclick = () => { hideAllViews(); if(viewTyping) viewTyping.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.remove('hidden'); loadTypingWord(); };
if (quitTypingBtn) quitTypingBtn.onclick = () => { hideAllViews(); if(viewHome) viewHome.classList.add('active'); if(navHomeBtn) navHomeBtn.classList.add('hidden'); };

function loadTypingWord() {
    const randomEntry = dictionary[Math.floor(Math.random() * dictionary.length)];
    const jpUI = document.getElementById('typing-jp'); const enUI = document.getElementById('typing-en');
    if(jpUI) jpUI.textContent = randomEntry.word;
    if(enUI) enUI.textContent = randomEntry.mean;
    
    const match = randomEntry.mean.match(/\(([^)]+)\)/);
    targetRomaji = match ? match[1].toLowerCase().replace(/\s/g, '') : "";
    currentTyped = ""; updateTypingDisplay();
}

function updateTypingDisplay() {
    const disp = document.getElementById('typing-input-display'); if(disp) disp.textContent = currentTyped;
}

document.addEventListener('keydown', (e) => {
    if (!viewTyping || !viewTyping.classList.contains('active')) return;
    if (e.key.length > 1 && e.key !== 'Backspace') return; 

    if (e.key === 'Backspace') currentTyped = currentTyped.slice(0, -1);
    else currentTyped += e.key.toLowerCase();
    
    updateTypingDisplay();

    if (currentTyped === targetRomaji) {
        const disp = document.getElementById('typing-input-display'); const jpUI = document.getElementById('typing-jp');
        if(disp) disp.style.color = "#28a745"; 
        if(jpUI) playAudio(jpUI.textContent);
        setTimeout(() => { if(disp) disp.style.color = "#00d2ff"; loadTypingWord(); }, 500);
    }
});
