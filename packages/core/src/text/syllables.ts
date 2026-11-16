/**
 * Deterministic Liang-Style Syllable & Hyphenation Engine
 * Pure TypeScript — no DOM, no network.
 *
 * Uses bundled English hyphenation patterns (Knuth-Liang scoring) plus
 * heuristic onset-maximization fallback and a pluggable language registry.
 */

export type PatternMap = Record<string, string>;

export interface LanguageHyphenationPack {
  lang: string;
  minWordLength: number;
  leftMin: number;
  rightMin: number;
  patterns: PatternMap;
  exceptions: Record<string, string[]>;
}

/**
 * Compact bundled English Liang-style hyphenation pattern table.
 * Odd digits indicate permissible hyphenation points; higher digits override lower.
 */
const ENGLISH_RAW_PATTERNS = [
  '.ach4', '.ad4der', '.af1t', '.al3t', '.am5at', '.an5c', '.ang4', '.ani5m',
  '.ant4', '.an3te', '.anti5s', '.ar5s', '.ar4ti', '.as3c', '.as1p', '.as1s',
  '.aster5', '.atom5', '.au1d', '.av4i', '.awn4', '.ba4g', '.ba5na', '.bas4e',
  '.ber4', '.be5ra', '.be3sm', '.be5st', '.bi2', '.bi5d', '.bin4', '.bio5',
  '.bi3t', '.bl2', '.b4r', '.ca4bi', '.ca4p', '.car5om', '.cat5a', '.ce4la',
  '.ch4', '.ci2', '.co4', '.com5', '.con5', '.co3p', '.cor5ner', '.de4',
  '.de5ca', '.de5fi', '.de3sc', '.di4', '.dia5', '.dis1', '.do4', '.du4',
  '.dys5', '.e4', '.eco5', '.ed4', '.el4', '.em5', '.en5', '.ep4', '.eq4',
  '.er4', '.es4', '.ev4', '.ex1', '.fa4', '.fe4', '.fi4', '.for5', '.fu4',
  '.ga4', '.ge4', '.gen5', '.geo5', '.gi4', '.go4', '.gr4', '.ha4', '.he4',
  '.hi4', '.ho4', '.hy4', '.i4', '.il4', '.im4', '.in1', '.inter5', '.into5',
  '.ir4', '.is4', '.it4', '.ja4', '.je4', '.jo4', '.ju4', '.ka4', '.ke4',
  '.ki4', '.ko4', '.la4', '.le4', '.li4', '.lo4', '.lu4', '.ma4', '.me4',
  '.mi4', '.mis1', '.mo4', '.mu4', '.multi5', '.na4', '.ne4', '.neuro5',
  '.ni4', '.no4', '.non1', '.nu4', '.o4', '.ob1', '.oc4', '.of4', '.on4',
  '.op4', '.or4', '.out1', '.over5', '.pa4', '.para5', '.pe4', '.per5',
  '.ph4', '.pi4', '.po4', '.poly5', '.post1', '.pr4', '.pre1', '.pro1',
  '.psy5', '.pu4', '.qu4', '.ra4', '.re1', '.read5', '.ri4', '.ro4', '.ru4',
  '.sa4', '.sc4', '.se4', '.self5', '.semi5', '.sh4', '.si4', '.so4',
  '.st4', '.su4', '.sub1', '.super5', '.sy4', '.syl5', '.ta4', '.te4',
  '.th4', '.ti4', '.to4', '.tr4', '.trans5', '.tri5', '.tu4', '.un1',
  '.under5', '.uni5', '.up1', '.va4', '.ve4', '.vi4', '.vo4', '.wa4',
  '.we4', '.wh4', '.wi4', '.wo4', '.x4', '.ye4', '.yo4', '.zo4',
  'a1ba', 'a1be', 'a1bi', 'a1bo', 'a1bu', 'a1ca', 'a1ce', 'a1ci', 'a1co',
  'a1cu', 'a1da', 'a1de', 'a1di', 'a1do', 'a1du', 'a1fa', 'a1ga', 'a1ge',
  'a1gi', 'a1go', 'a1la', 'a1le', 'a1li', 'a1lo', 'a1lu', 'a1ma', 'a1me',
  'a1mi', 'a1mo', 'a1mu', 'a1na', 'a1ne', 'a1ni', 'a1no', 'a1nu', 'a1pa',
  'a1pe', 'a1pi', 'a1po', 'a1ra', 'a1re', 'a1ri', 'a1ro', 'a1ru', 'a1sa',
  'a1se', 'a1si', 'a1so', 'a1ta', 'a1te', 'a1ti', 'a1to', 'a1tu', 'a1va',
  'a1ve', 'a1vi', 'a1vo', 'a2b', 'ab1l', 'ab1r', 'ac1c', 'ac1t', 'ad1d',
  'ad1v', 'af1f', 'ag1g', 'al1b', 'al1c', 'al1f', 'al1g', 'al1l', 'al1m',
  'al1p', 'al1t', 'al1v', 'am1b', 'am1p', 'an1c', 'an1d', 'an1g', 'an1k',
  'an1s', 'an1t', 'ap1p', 'ar1b', 'ar1c', 'ar1d', 'ar1g', 'ar1k', 'ar1m',
  'ar1n', 'ar1p', 'ar1s', 'ar1t', 'as1k', 'as1p', 'as1s', 'as1t', 'at1t',
  'b1b', 'b1l', 'b1r', 'bi1o', 'ble.', 'c1c', 'c1k', 'c1l', 'c1r', 'c1t',
  'ca1p', 'ce1l', 'ch2', 'ci1a', 'ci1e', 'ci1o', 'ck2', 'com1', 'con1',
  'd1d', 'd1g', 'd1m', 'd1r', 'd1v', 'de1s', 'di1a', 'di1e', 'di1o',
  'e1ba', 'e1be', 'e1bi', 'e1bo', 'e1ca', 'e1ce', 'e1ci', 'e1co', 'e1da',
  'e1de', 'e1di', 'e1do', 'e1ga', 'e1ge', 'e1gi', 'e1la', 'e1le', 'e1li',
  'e1lo', 'e1ma', 'e1me', 'e1mi', 'e1mo', 'e1na', 'e1ne', 'e1ni', 'e1no',
  'e1pa', 'e1pe', 'e1pi', 'e1po', 'e1ra', 'e1re', 'e1ri', 'e1ro', 'e1sa',
  'e1se', 'e1si', 'e1so', 'e1ta', 'e1te', 'e1ti', 'e1to', 'e1va', 'e1ve',
  'e1vi', 'e1vo', 'ed.', 'el1l', 'em1b', 'em1p', 'en1c', 'en1d', 'en1g',
  'en1s', 'en1t', 'er1b', 'er1c', 'er1d', 'er1g', 'er1m', 'er1n', 'er1p',
  'er1s', 'er1t', 'er1v', 'es.', 'es1s', 'es1t', 'ex1p', 'ex1t',
  'f1f', 'f1l', 'f1r', 'for1', 'ful.',
  'g1g', 'g1l', 'g1n', 'g1r', 'ge1n', 'gh2', 'gi1o',
  'h1b', 'h1c', 'h1d', 'h1f', 'h1g', 'h1l', 'h1m', 'h1n', 'h1p', 'h1r', 'h1s', 'h1t',
  'i1a', 'i1ba', 'i1be', 'i1bi', 'i1bo', 'i1ca', 'i1ce', 'i1ci', 'i1co',
  'i1da', 'i1de', 'i1di', 'i1do', 'i1e', 'i1la', 'i1le', 'i1li', 'i1lo',
  'i1ma', 'i1me', 'i1mi', 'i1mo', 'i1na', 'i1ne', 'i1ni', 'i1no', 'i1o',
  'i1pa', 'i1pe', 'i1pi', 'i1po', 'i1ra', 'i1re', 'i1ri', 'i1ro', 'i1sa',
  'i1se', 'i1si', 'i1so', 'i1ta', 'i1te', 'i1ti', 'i1to', 'i1va', 'i1ve',
  'i1vi', 'i1vo', 'ic1s', 'ig1n', 'il1l', 'im1p', 'in1c', 'in1d', 'in1f',
  'in1g', 'in1s', 'in1t', 'ing.', 'ing1', 'ion.', 'ir1r', 'is1m', 'is1s', 'is1t', 'it1t',
  'k1n', 'k1s', 'k1t',
  'l1b', 'l1c', 'l1d', 'l1f', 'l1g', 'l1k', 'l1l', 'l1m', 'l1p', 'l1s', 'l1t', 'l1v', 'less.', 'ly.',
  'm1b', 'm1m', 'm1p', 'm1s', 'ment.',
  'n1c', 'n1d', 'n1f', 'n1g', 'n1k', 'n1n', 'n1s', 'n1t', 'n1v', 'ness.', 'ng2',
  'o1ba', 'o1be', 'o1bi', 'o1bo', 'o1ca', 'o1ce', 'o1ci', 'o1co', 'o1da',
  'o1de', 'o1di', 'o1do', 'o1la', 'o1le', 'o1li', 'o1lo', 'o1ma', 'o1me',
  'o1mi', 'o1mo', 'o1na', 'o1ne', 'o1ni', 'o1no', 'o1pa', 'o1pe', 'o1pi',
  'o1po', 'o1ra', 'o1re', 'o1ri', 'o1ro', 'o1sa', 'o1se', 'o1si', 'o1so',
  'o1ta', 'o1te', 'o1ti', 'o1to', 'o1va', 'o1ve', 'o1vi', 'o1vo', 'ob1l',
  'oc1c', 'of1f', 'ol1d', 'ol1l', 'om1p', 'on1g', 'on1l', 'on1s', 'on1t',
  'op1p', 'or1b', 'or1c', 'or1d', 'or1g', 'or1k', 'or1m', 'or1n', 'or1p',
  'or1s', 'or1t', 'os1s', 'os1t', 'ou1g', 'ous.',
  'p1l', 'p1p', 'p1r', 'p1t', 'ph2', 'pre1', 'pro1',
  'qu2',
  'r1b', 'r1c', 'r1d', 'r1f', 'r1g', 'r1k', 'r1l', 'r1m', 'r1n', 'r1p',
  'r1r', 'r1s', 'r1t', 'r1v', 're1s', 'ri1a', 'ri1o', 'ro1b', 'ro1g',
  's1c', 's1k', 's1l', 's1m', 's1n', 's1p', 's1q', 's1s', 's1t', 's1w', 'sh2', 'si1o', 'sion.',
  't1c', 't1h', 't1l', 't1m', 't1r', 't1s', 't1t', 'th2', 'ti1a', 'ti1o', 'tion.',
  'u1ba', 'u1be', 'u1bi', 'u1bo', 'u1ca', 'u1ce', 'u1ci', 'u1co', 'u1da',
  'u1de', 'u1di', 'u1do', 'u1la', 'u1le', 'u1li', 'u1lo', 'u1ma', 'u1me',
  'u1mi', 'u1mo', 'u1na', 'u1ne', 'u1ni', 'u1no', 'u1pa', 'u1pe', 'u1pi',
  'u1po', 'u1ra', 'u1re', 'u1ri', 'u1ro', 'u1sa', 'u1se', 'u1si', 'u1so',
  'u1ta', 'u1te', 'u1ti', 'u1to', 'ul1t', 'um1b', 'um1p', 'un1c', 'un1d',
  'un1g', 'un1k', 'un1s', 'un1t', 'up1p', 'ur1b', 'ur1c', 'ur1d', 'ur1g',
  'ur1n', 'ur1p', 'ur1s', 'ur1t', 'us1t',
  'v1l', 'v1r', 'vi1a', 'vi1o',
  'w1h', 'w1l', 'w1n', 'w1r',
  'x1p', 'x1t',
  'y1b', 'y1c', 'y1d', 'y1g', 'y1l', 'y1m', 'y1n', 'y1p', 'y1r', 'y1s', 'y1t',
  'z1z',
  // Protect common silent-e & consonant clusters from bad splits
  '4tio', '4cio', '4sio', '2t1l', '2b1l', '2p1l', '2g1l', '2c1l', '2f1l',
  '2t1r', '2d1r', '2b1r', '2p1r', '2g1r', '2c1r', '2f1r',
  '4e.', '4ed.', '4es.', '2ch', '2sh', '2th', '2ph', '2wh', '2ck', '2ng', '2qu',
];

function compilePatterns(rawPatterns: string[]): PatternMap {
  const map: PatternMap = {};
  for (const pat of rawPatterns) {
    const key = pat.replace(/[0-9]/g, '');
    map[key] = pat;
  }
  return map;
}

const ENGLISH_EXCEPTIONS: Record<string, string[]> = {
  read: ['read'],
  reading: ['read', 'ing'],
  dyslexia: ['dys', 'lex', 'ia'],
  dyslexic: ['dys', 'lex', 'ic'],
  neurodivergent: ['neu', 'ro', 'di', 'ver', 'gent'],
  accessibility: ['ac', 'ces', 'si', 'bil', 'i', 'ty'],
  every: ['ev', 'ery'],
  different: ['dif', 'fer', 'ent'],
  business: ['busi', 'ness'],
  people: ['peo', 'ple'],
  knowledge: ['knowl', 'edge'],
  language: ['lan', 'guage'],
  syllable: ['syl', 'la', 'ble'],
  syllables: ['syl', 'la', 'bles'],
  algorithm: ['al', 'go', 'rithm'],
  algorithms: ['al', 'go', 'rithms'],
  focus: ['fo', 'cus'],
  attention: ['at', 'ten', 'tion'],
  typography: ['ty', 'pog', 'ra', 'phy'],
  document: ['doc', 'u', 'ment'],
  experience: ['ex', 'pe', 'ri', 'ence'],
  contrast: ['con', 'trast'],
  cognitive: ['cog', 'ni', 'tive'],
  sentence: ['sen', 'tence'],
  sentences: ['sen', 'tenc', 'es'],
};

const languageRegistry = new Map<string, LanguageHyphenationPack>();

export function registerLanguagePatterns(pack: LanguageHyphenationPack): void {
  languageRegistry.set(pack.lang.toLowerCase(), pack);
}

registerLanguagePatterns({
  lang: 'en',
  minWordLength: 4,
  leftMin: 2,
  rightMin: 2,
  patterns: compilePatterns(ENGLISH_RAW_PATTERNS),
  exceptions: ENGLISH_EXCEPTIONS,
});

function preserveCaseSegments(originalWord: string, lowerSegments: string[]): string[] {
  const result: string[] = [];
  let cursor = 0;
  for (const seg of lowerSegments) {
    result.push(originalWord.slice(cursor, cursor + seg.length));
    cursor += seg.length;
  }
  return result;
}

const LATIN_WORD_REGEX = /^[A-Za-z\u00C0-\u024F]+$/;

export function splitWordSyllables(word: string, lang: string = 'en'): string[] {
  if (!word) return [];
  const pack = languageRegistry.get(lang.toLowerCase()) || languageRegistry.get('en')!;

  // Handle hyphenated compound words by splitting on '-' and preserving hyphen
  if (word.includes('-') && word.length > 2) {
    const parts = word.split('-');
    if (parts.every(p => p.length > 0)) {
      const out: string[] = [];
      parts.forEach((p, idx) => {
        const sub = splitWordSyllables(p, lang);
        if (idx > 0 && sub.length > 0) {
          sub[0] = '-' + sub[0];
        }
        out.push(...sub);
      });
      return out;
    }
  }

  // Non-Latin, numbers, contractions, or all-caps acronyms stay intact
  if (!LATIN_WORD_REGEX.test(word)) {
    return [word];
  }
  if (word.length >= 2 && word === word.toUpperCase()) {
    return [word];
  }
  if (word.length < pack.minWordLength) {
    return [word];
  }

  const lower = word.toLowerCase();
  if (pack.exceptions[lower]) {
    return preserveCaseSegments(word, pack.exceptions[lower]);
  }

  // Liang algorithm: wrap with '.' boundaries and score inter-character points
  const wrapped = `.${lower}.`;
  const scores = new Array<number>(wrapped.length + 1).fill(0);

  for (let i = 0; i < wrapped.length; i++) {
    for (let j = i + 1; j <= wrapped.length; j++) {
      const sub = wrapped.slice(i, j);
      const pattern = pack.patterns[sub];
      if (!pattern) continue;

      let pos = 0;
      for (let k = 0; k < pattern.length; k++) {
        const ch = pattern[k];
        if (ch >= '0' && ch <= '9') {
          const val = parseInt(ch, 10);
          const targetIdx = i + pos;
          if (val > scores[targetIdx]) {
            scores[targetIdx] = val;
          }
        } else {
          pos++;
        }
      }
    }
  }

  // Extract segments from odd scores respecting leftMin/rightMin
  const segments: string[] = [];
  let start = 0;
  for (let idx = 1; idx < lower.length; idx++) {
    // Score at wrapped index (idx + 1) corresponds to boundary before lower[idx]
    const score = scores[idx + 1];
    if (score % 2 === 1 && idx >= pack.leftMin && lower.length - idx >= pack.rightMin) {
      const candidate = word.slice(start, idx);
      const remainder = word.slice(idx);
      // Ensure each piece has at least one vowel so we don't strand consonant clusters
      if (/[aeiouy]/i.test(candidate) && /[aeiouy]/i.test(remainder)) {
        segments.push(candidate);
        start = idx;
      }
    }
  }
  segments.push(word.slice(start));

  return segments.length > 0 ? segments : [word];
}

export interface SyllableSegment {
  text: string;
  syllableIndex: number;
}

export function segmentTextWithSyllables(
  text: string,
  lang: string = 'en'
): Array<{ isWhitespace: boolean; raw: string; leading: string; syllables: SyllableSegment[]; trailing: string }> {
  if (!text) return [];
  const tokens = text.split(/(\s+)/).filter(Boolean);
  return tokens.map((token) => {
    if (/^\s+$/.test(token)) {
      return { isWhitespace: true, raw: token, leading: '', syllables: [], trailing: '' };
    }
    const match = token.match(/^([^A-Za-z\u00C0-\u024F]*)([A-Za-z\u00C0-\u024F'-]+)([^A-Za-z\u00C0-\u024F]*)$/);
    if (!match) {
      return {
        isWhitespace: false,
        raw: token,
        leading: '',
        syllables: [{ text: token, syllableIndex: 0 }],
        trailing: '',
      };
    }
    const [, leading, core, trailing] = match;
    const parts = splitWordSyllables(core, lang);
    return {
      isWhitespace: false,
      raw: token,
      leading,
      syllables: parts.map((p, idx) => ({ text: p, syllableIndex: idx })),
      trailing,
    };
  });
}
