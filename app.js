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
  try {
      // BULLETPROOF AUDIO: Bypasses the phone's broken voice engine completely
      // Streams a live MP3 pronunciation directly from the web
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      
      // Check for Snail Mode
      const isSlowMode = document.getElementById('slow-audio-toggle')?.checked;
      audio.playbackRate = isSlowMode ? 0.5 : 1.0; 
      
      audio.play();
  } catch(e) {
      console.log("Audio stream failed to play.");
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

// --- 4. CHARACTER DATA ---
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
    { id: 'j10', title: 'Level 10: Adjectives (Sizes/Ages)', chars: ['大', '小', '高', '安', '新', '古', '多', '少'], unlocked: false },
    { id: 'j11', title: 'Level 11: Colors & Shapes', chars: ['白', '黒', '赤', '青', '円', '形'], unlocked: false },
    { id: 'j12', title: 'Level 12: Family', chars: ['父', '母', '兄', '弟', '姉', '妹', '友'], unlocked: false },
    { id: 'j13', title: 'Level 13: Weather', chars: ['雨', '雪', '風', '晴', '雲', '春', '夏', '秋', '冬'], unlocked: false },
    { id: 'j14', title: 'Level 14: Places', chars: ['国', '町', '店', '駅', '道', '社', '家'], unlocked: false },
    { id: 'j15', title: 'Level 15: Objects', chars: ['車', '電', '気', '語', '名', '紙', '金'], unlocked: false }
  ]
};

const characterMap = {
  // Hiragana
  'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o', 'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so', 'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no', 'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo', 'や':'ya', 'ゆ':'yu', 'よ':'yo', 'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
  'わ':'wa', 'を':'wo', 'ん':'n', 'ー': '-',
  // Hiragana Dakuten/Combos
  'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go', 'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do', 'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
  'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po', 'きゃ':'kya', 'きゅ':'kyu', 'きょ':'kyo', 'しゃ':'sha', 'しゅ':'shu', 'しょ':'sho',
  // Katakana
  'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o', 'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
  'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so', 'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to', 
  'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no', 'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho', 
  'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo', 'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo', 'ラ':'ra', 'リ':'ri', 'ル':'ru', 'レ':'re', 'ロ':'ro', 
  'ワ':'wa', 'ヲ':'wo', 'ン':'n',
  // Katakana Dakuten/Combos
  'ガ':'ga', 'ギ':'gi', 'グ':'gu', 'ゲ':'ge', 'ゴ':'go', 'ザ':'za', 'ジ':'ji', 'ズ':'zu', 'ゼ':'ze', 'ゾ':'zo',
  'ダ':'da', 'ヂ':'ji', 'ヅ':'zu', 'デ':'de', 'ド':'do', 'バ':'ba', 'ビ':'bi', 'ブ':'bu', 'ベ':'be', 'ボ':'bo',
  'パ':'pa', 'ピ':'pi', 'プ':'pu', 'ペ':'pe', 'ポ':'po', 'キャ':'kya', 'キュ':'kyu', 'キョ':'kyo'
};

const dictionary = [
  // --- HIRAGANA ---
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
  
  // --- KATAKANA ---
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

  // --- KANJI ---
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

// --- 5. NEW DATABASES (Reading & Sentences) ---
const readingDb = [
  { jp: "こんにちは。私の名前は田中です。私は東京に住んでいます。", en: "Hello. My name is Tanaka. I live in Tokyo." },
  { jp: "今日はとてもいい天気ですね。公園を散歩しましょう。", en: "The weather is very nice today, isn't it? Let's take a walk in the park." },
  { jp: "日本の食べ物は美味しいです。特に寿司とラーメンが好きです。", en: "Japanese food is delicious. I especially like sushi and ramen." },
  { jp: "毎朝、七時に起きます。そして、コーヒーを飲みながら本を読みます。", en: "I wake up at 7 o'clock every morning. Then, I read a book while drinking coffee." },
  { jp: "週末は友達と映画を見に行きます。とても楽しみです！", en: "I'm going to watch a movie with my friends this weekend. I'm really looking forward to it!" },
  { jp: "私の趣味は音楽を聞くことです。ジャズが一番好きです。", en: "My hobby is listening to music. I like jazz the best." },
  { jp: "来年、日本へ旅行に行きたいです。富士山を見たいです。", en: "Next year, I want to travel to Japan. I want to see Mount Fuji." }
];

let currentParagraphIndex = 0;

   // --- UNLOCKABLE SENTENCE DATABASE (100 Daily Use Sentences) ---
const sentenceDb = [
    // --- HIRAGANA SENTENCES ---
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

    // --- KATAKANA SENTENCES ---
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

    // --- KANJI SENTENCES ---
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
