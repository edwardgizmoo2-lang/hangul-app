export const consonants = [
  { char: 'ㄱ', romanization: 'g/k', name: '기역', audio: 'giyeok', audioFile: 'consonants/ㄱ.ogg', examples: ['가 (ga)', '고 (go)', '구 (gu)'] },
  { char: 'ㄴ', romanization: 'n', name: '니은', audio: 'nieun', audioFile: 'consonants/ㄴ.ogg', examples: ['나 (na)', '노 (no)', '누 (nu)'] },
  { char: 'ㄷ', romanization: 'd/t', name: '디귿', audio: 'digeut', audioFile: 'consonants/ㄷ.ogg', examples: ['다 (da)', '도 (do)', '두 (du)'] },
  { char: 'ㄹ', romanization: 'r/l', name: '리을', audio: 'rieul', audioFile: 'consonants/ㄹ.ogg', examples: ['라 (ra)', '로 (ro)', '루 (ru)'] },
  { char: 'ㅁ', romanization: 'm', name: '미음', audio: 'mieum', audioFile: 'consonants/ㅁ.ogg', examples: ['마 (ma)', '모 (mo)', '무 (mu)'] },
  { char: 'ㅂ', romanization: 'b/p', name: '비읍', audio: 'bieup', audioFile: 'consonants/ㅂ.ogg', examples: ['바 (ba)', '보 (bo)', '부 (bu)'] },
  { char: 'ㅅ', romanization: 's', name: '시옷', audio: 'siot', audioFile: 'consonants/ㅅ.ogg', examples: ['사 (sa)', '소 (so)', '수 (su)'] },
  { char: 'ㅇ', romanization: 'ng/silent', name: '이응', audio: 'ieung', audioFile: 'consonants/ㅇ.ogg', examples: ['아 (a)', '오 (o)', '우 (u)'] },
  { char: 'ㅈ', romanization: 'j/ch', name: '지읒', audio: 'jieut', audioFile: 'consonants/ㅈ.ogg', examples: ['자 (ja)', '조 (jo)', '주 (ju)'] },
  { char: 'ㅊ', romanization: 'ch', name: '치읓', audio: 'chieut', audioFile: 'consonants/ㅊ.ogg', examples: ['차 (cha)', '초 (cho)', '추 (chu)'] },
  { char: 'ㅋ', romanization: 'k', name: '키읔', audio: 'kieuk', audioFile: 'consonants/ㅋ.ogg', examples: ['카 (ka)', '코 (ko)', '쿠 (ku)'] },
  { char: 'ㅌ', romanization: 't', name: '티읕', audio: 'tieut', audioFile: 'consonants/ㅌ.ogg', examples: ['타 (ta)', '토 (to)', '투 (tu)'] },
  { char: 'ㅍ', romanization: 'p', name: '피읍', audio: 'pieup', audioFile: 'consonants/ㅍ.ogg', examples: ['파 (pa)', '포 (po)', '푸 (pu)'] },
  { char: 'ㅎ', romanization: 'h', name: '히읗', audio: 'hieut', audioFile: 'consonants/ㅎ.ogg', examples: ['하 (ha)', '호 (ho)', '후 (hu)'] },
]

export const doubleConsonants = [
  { char: 'ㄲ', romanization: 'kk', name: '쌍기역', audio: 'ssanggiyeok', audioFile: 'consonants/ㄲ.ogg', examples: ['까 (kka)', '꼬 (kko)', '꾸 (kku)'] },
  { char: 'ㄸ', romanization: 'tt', name: '쌍디귿', audio: 'ssangdigeut', audioFile: 'consonants/ㄸ.ogg', examples: ['따 (tta)', '또 (tto)', '뚜 (ttu)'] },
  { char: 'ㅃ', romanization: 'pp', name: '쌍비읍', audio: 'ssangbieup', audioFile: 'consonants/ㅃ.ogg', examples: ['빠 (ppa)', '뽀 (ppo)', '뿌 (ppu)'] },
  { char: 'ㅆ', romanization: 'ss', name: '쌍시옷', audio: 'ssangsiot', audioFile: 'consonants/ㅆ.ogg', examples: ['싸 (ssa)', '쏘 (sso)', '쑤 (ssu)'] },
  { char: 'ㅉ', romanization: 'jj', name: '쌍지읒', audio: 'ssangjieut', audioFile: 'consonants/ㅉ.ogg', examples: ['짜 (jja)', '쪼 (jjo)', '쭈 (jju)'] },
]

export const vowels = [
  { char: 'ㅏ', romanization: 'a', name: '아', audio: 'a', audioFile: 'vowels/ㅏ.ogg', examples: ['아 (a)', '바 (ba)', '사 (sa)'] },
  { char: 'ㅑ', romanization: 'ya', name: '야', audio: 'ya', audioFile: 'vowels/ㅑ.ogg', examples: ['야 (ya)', '뱌 (bya)', '샤 (sya)'] },
  { char: 'ㅓ', romanization: 'eo', name: '어', audio: 'eo', audioFile: 'vowels/ㅓ.ogg', examples: ['어 (eo)', '버 (beo)', '서 (seo)'] },
  { char: 'ㅕ', romanization: 'yeo', name: '여', audio: 'yeo', audioFile: 'vowels/ㅕ.ogg', examples: ['여 (yeo)', '벼 (byeo)', '셔 (syeo)'] },
  { char: 'ㅗ', romanization: 'o', name: '오', audio: 'o', audioFile: 'vowels/ㅗ.ogg', examples: ['오 (o)', '보 (bo)', '소 (so)'] },
  { char: 'ㅛ', romanization: 'yo', name: '요', audio: 'yo', audioFile: 'vowels/ㅛ.ogg', examples: ['요 (yo)', '뵤 (byo)', '쇼 (syo)'] },
  { char: 'ㅜ', romanization: 'u', name: '우', audio: 'u', audioFile: 'vowels/ㅜ.ogg', examples: ['우 (u)', '부 (bu)', '수 (su)'] },
  { char: 'ㅠ', romanization: 'yu', name: '유', audio: 'yu', audioFile: 'vowels/ㅠ.ogg', examples: ['유 (yu)', '뷰 (byu)', '슈 (syu)'] },
  { char: 'ㅡ', romanization: 'eu', name: '으', audio: 'eu', audioFile: 'vowels/ㅡ.ogg', examples: ['으 (eu)', '브 (beu)', '스 (seu)'] },
  { char: 'ㅣ', romanization: 'i', name: '이', audio: 'i', audioFile: 'vowels/ㅣ.ogg', examples: ['이 (i)', '비 (bi)', '시 (si)'] },
]

export const compoundVowels = [
  { char: 'ㅐ', romanization: 'ae', name: '애', audio: 'ae', audioFile: 'vowels/ㅐ.ogg', examples: ['애 (ae)', '배 (bae)', '새 (sae)'] },
  { char: 'ㅒ', romanization: 'yae', name: '얘', audio: 'yae', audioFile: 'vowels/ㅒ.ogg', examples: ['얘 (yae)', '뱌 (byae)', '샤 (syae)'] },
  { char: 'ㅔ', romanization: 'e', name: '에', audio: 'e', audioFile: 'vowels/ㅔ.ogg', examples: ['에 (e)', '베 (be)', '세 (se)'] },
  { char: 'ㅖ', romanization: 'ye', name: '예', audio: 'ye', audioFile: 'vowels/ㅖ.ogg', examples: ['예 (ye)', '볘 (bye)', '셰 (sye)'] },
  { char: 'ㅘ', romanization: 'wa', name: '와', audio: 'wa', audioFile: 'vowels/ㅘ.ogg', examples: ['와 (wa)', '와 (wa)', '와 (wa)'] },
  { char: 'ㅙ', romanization: 'wae', name: '왜', audio: 'wae', audioFile: 'vowels/ㅙ.ogg', examples: ['왜 (wae)', '왜 (wae)', '왜 (wae)'] },
  { char: 'ㅚ', romanization: 'oe', name: '외', audio: 'oe', audioFile: 'vowels/ㅚ.ogg', examples: ['외 (oe)', '외 (oe)', '외 (oe)'] },
  { char: 'ㅝ', romanization: 'wo', name: '워', audio: 'wo', audioFile: 'vowels/ㅝ.ogg', examples: ['워 (wo)', '워 (wo)', '워 (wo)'] },
  { char: 'ㅞ', romanization: 'we', name: '웨', audio: 'we', audioFile: 'vowels/ㅞ.ogg', examples: ['웨 (we)', '웨 (we)', '웨 (we)'] },
  { char: 'ㅟ', romanization: 'wi', name: '위', audio: 'wi', audioFile: 'vowels/ㅟ.ogg', examples: ['위 (wi)', '위 (wi)', '위 (wi)'] },
  { char: 'ㅢ', romanization: 'ui', name: '의', audio: 'ui', audioFile: 'vowels/ㅢ.ogg', examples: ['의 (ui)', '뷔 (bui)', '쉬 (swi)'] },
]

export const finalConsonants = [
  { char: 'ㄱ', romanization: 'k', name: '기역', examples: ['각 (gak)', '곡 (gok)', '국 (guk)'] },
  { char: 'ㄴ', romanization: 'n', name: '니은', examples: ['간 (gan)', '곤 (gon)', '군 (gun)'] },
  { char: 'ㄷ', romanization: 't', name: '디귿', examples: ['닭 (dak)', '독 (dok)', '둑 (duk)'] },
  { char: 'ㄹ', romanization: 'l', name: '리을', examples: ['갈 (gal)', '골 (gol)', '굴 (gul)'] },
  { char: 'ㅁ', romanization: 'm', name: '미음', examples: ['감 (gam)', '곰 (gom)', '굼 (gum)'] },
  { char: 'ㅂ', romanization: 'p', name: '비읍', examples: ['갑 (gap)', '겁 (geop)', '갑 (gap)'] },
  { char: 'ㅇ', romanization: 'ng', name: '이응', examples: ['강 (gang)', '공 (gong)', '궁 (gung)'] },
  { char: 'ㅈ', romanization: 't', name: '지읒', examples: ['감 (gat)', '곳 (got)', '귿 (gut)'] },
  { char: 'ㅊ', romanization: 't', name: '치읓', examples: ['갇 (gat)', '곧 (got)', '귿 (gut)'] },
  { char: 'ㅋ', romanization: 'k', name: '키읔', examples: [' Prostitutas (gak)', '곡 (gok)', '굑 (guk)'] },
  { char: 'ㅌ', romanization: 't', name: '티읕', examples: ['갑 (gat)', '곳 (got)', '굳 (gut)'] },
  { char: 'ㅍ', romanization: 'p', name: '피읍', examples: ['값 (gap)', '곱 (gop)', '굽 (gup)'] },
  { char: 'ㅎ', romanization: 't', name: '히읗', examples: ['갇 (gat)', '곳 (got)', '곳 (got)'] },
  { char: 'ㄲ', romanization: 'k', name: '쌍기역', examples: ['깥 (gat)', '곧 (got)', '귿 (gut)'] },
  { char: 'ㅆ', romanization: 't', name: '쌍시옷', examples: ['갇 (gat)', '곳 (got)', '귿 (gut)'] },
]

const INITIAL_ROMAN = {
  'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm',
  'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj',
  'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h',
}

const VOWEL_ROMAN = {
  'ㅏ': 'a', 'ㅑ': 'ya', 'ㅓ': 'eo', 'ㅕ': 'yeo',
  'ㅗ': 'o', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅠ': 'yu',
  'ㅡ': 'eu', 'ㅣ': 'i',
}

const INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const MEDIALS = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']

const MEDIAL_INDEX = { 'ㅏ':0, 'ㅑ':2, 'ㅓ':4, 'ㅕ':6, 'ㅗ':8, 'ㅛ':12, 'ㅜ':13, 'ㅠ':16, 'ㅡ':18, 'ㅣ':20 }
const INITIAL_INDEX = { 'ㄱ':0, 'ㄲ':1, 'ㄴ':2, 'ㄷ':3, 'ㄸ':4, 'ㄹ':5, 'ㅁ':6, 'ㅂ':7, 'ㅃ':8, 'ㅅ':9, 'ㅆ':10, 'ㅇ':11, 'ㅈ':12, 'ㅉ':13, 'ㅊ':14, 'ㅋ':15, 'ㅌ':16, 'ㅍ':17, 'ㅎ':18 }

function composeSyllable(initial, medial) {
  const ii = INITIAL_INDEX[initial] ?? 0
  const mi = MEDIAL_INDEX[medial] ?? 0
  return String.fromCharCode(0xAC00 + ii * 21 * 28 + mi * 28)
}

export const syllables = []
INITIALS.forEach(c => {
  MEDIALS.forEach(v => {
    const roman = INITIAL_ROMAN[c] + VOWEL_ROMAN[v]
    syllables.push({
      romanization: roman,
      letters: [c, v],
      display: composeSyllable(c, v),
    })
  })
})

export const SPELL_CONSONANTS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
export const SPELL_VOWELS = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']

export const difficultySettings = {
  easy: { timePerLetter: 20, label: 'Easy (20s)' },
  medium: { timePerLetter: 15, label: 'Medium (15s)' },
  hard: { timePerLetter: 10, label: 'Hard (10s)' },
  pro: { timePerLetter: 5, label: 'Pro (5s)' },
}

export const vocabulary = [
  { korean: '안녕하세요', romanization: 'annyeonghaseyo', english: 'Hello' },
  { korean: '감사합니다', romanization: 'gamsahamnida', english: 'Thank you' },
  { korean: '죄송합니다', romanization: 'joesonghamnida', english: 'Excuse me / Sorry' },
  { korean: '네', romanization: 'ne', english: 'Yes' },
  { korean: '아니요', romanization: 'aniyo', english: 'No' },
  { korean: '물', romanization: 'mul', english: 'Water' },
  { korean: '밥', romanization: 'bap', english: 'Rice / Meal' },
  { korean: '집', romanization: 'jip', english: 'House / Home' },
  { korean: '학교', romanization: 'hakgyo', english: 'School' },
  { korean: '친구', romanization: 'chingu', english: 'Friend' },
  { korean: '가족', romanization: 'gajok', english: 'Family' },
  { korean: '사랑', romanization: 'sarang', english: 'Love' },
  { korean: '행복', romanization: 'haengbok', english: 'Happiness' },
  { korean: '공부', romanization: 'gongbu', english: 'Study' },
  { korean: '일', romanization: 'il', english: 'Work / Day' },
  { korean: '시간', romanization: 'sigan', english: 'Time' },
  { korean: '돈', romanization: 'don', english: 'Money' },
  { korean: '책', romanization: 'chaek', english: 'Book' },
  { korean: '전화', romanization: 'jeonhwa', english: 'Phone call / Telephone' },
  { korean: '이름', romanization: 'ireum', english: 'Name' },
  { korean: '한국', romanization: 'hanguk', english: 'Korea' },
  { korean: '서울', romanization: 'seoul', english: 'Seoul' },
  { korean: '날씨', romanization: 'nalssi', english: 'Weather' },
  { korean: '아침', romanization: 'achim', english: 'Morning' },
  { korean: '저녁', romanization: 'jeonyeok', english: 'Evening' },
  { korean: '밤', romanization: 'bam', english: 'Night' },
  { korean: '오늘', romanization: 'oneul', english: 'Today' },
  { korean: '내일', romanization: 'naeil', english: 'Tomorrow' },
  { korean: '어제', romanization: 'eoje', english: 'Yesterday' },
  { korean: '주말', romanization: 'jumal', english: 'Weekend' },
]
