import test from 'node:test';
import assert from 'node:assert/strict';
import {
  segmentBionicWord,
  segmentBionicText,
  splitWordSyllables,
  registerLanguagePatterns,
  segmentConfusableLetters,
  splitSentences,
  chunkTextIntoCards,
  computeReadability,
  extractKeySentences,
  lookupWord,
} from '../index';

test('bionic segmentation bolds ~40% of words >= 3 chars and skips short words', () => {
  const short = segmentBionicWord('to');
  assert.equal(short.bold, '');
  assert.equal(short.normal, 'to');

  const hello = segmentBionicWord('hello,');
  assert.equal(hello.bold, 'he');
  assert.equal(hello.normal, 'llo');
  assert.equal(hello.trailingPunctuation, ',');

  const tokens = segmentBionicText('Read a book!');
  assert.equal(tokens[0].bold, 'Re');
  assert.equal(tokens[0].normal, 'ad');
  assert.equal(tokens[2].bold, '');
  assert.equal(tokens[2].normal, 'a');
  assert.equal(tokens[4].bold, 'bo');
  assert.equal(tokens[4].trailingPunctuation, '!');
});

test('syllable splitter handles English words, hyphens, contractions, numbers, and non-Latin', () => {
  assert.deepEqual(splitWordSyllables('reading'), ['read', 'ing']);
  assert.deepEqual(splitWordSyllables('Dyslexia'), ['Dys', 'lex', 'ia']);
  assert.deepEqual(splitWordSyllables('cat'), ['cat']);
  assert.deepEqual(splitWordSyllables('NASA'), ['NASA']);
  assert.deepEqual(splitWordSyllables('12345'), ['12345']);
  assert.deepEqual(splitWordSyllables("don't"), ["don't"]);
  assert.deepEqual(splitWordSyllables('नमस्ते'), ['नमस्ते']);

  const hyphenated = splitWordSyllables('multi-layered');
  assert.ok(hyphenated.length >= 2);
  assert.ok(hyphenated.some(seg => seg.startsWith('-')));

  registerLanguagePatterns({
    lang: 'test-lang',
    minWordLength: 4,
    leftMin: 2,
    rightMin: 2,
    patterns: { ba1na: 'ba1na' },
    exceptions: { custom: ['cus', 'tom'] },
  });
  assert.deepEqual(splitWordSyllables('custom', 'test-lang'), ['cus', 'tom']);
});

test('confusable letters segments b/d/p/q distinctly', () => {
  const segs = segmentConfusableLetters('bad');
  assert.equal(segs.length, 3);
  assert.equal(segs[0].rule?.char, 'b');
  assert.equal(segs[1].rule, null);
  assert.equal(segs[2].rule?.char, 'd');
});

test('sentence splitter respects abbreviations, decimals, and quotes', () => {
  const text =
    'Dr. Smith measured 3.14 radians at 9 a.m. in the U.S. lab! Did Prof. Lee agree? "Yes, e.g. on Tuesday," she replied.';
  const sentences = splitSentences(text);
  assert.equal(sentences.length, 3);
  assert.ok(sentences[0].startsWith('Dr. Smith'));
  assert.ok(sentences[1].startsWith('Did Prof. Lee'));
  assert.ok(sentences[2].includes('e.g.'));

  const chunks = chunkTextIntoCards(text, 2);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].sentences.length, 2);
  assert.equal(chunks[1].sentences.length, 1);
});

test('readability metrics return deterministic scores and band', () => {
  const empty = computeReadability('   ');
  assert.equal(empty.wordCount, 0);

  const easy = computeReadability('The cat sat on the mat. The dog ran fast.');
  assert.ok(easy.fleschReadingEase > 80);
  assert.equal(easy.band, 'Easy to scan');

  const dense = computeReadability(
    'Electroencephalographic synchronization demonstrates neurocognitive modulation across distributed cortical architecture.'
  );
  assert.ok(dense.fleschKincaidGrade > easy.fleschKincaidGrade);
  assert.ok(dense.gunningFogIndex > easy.gunningFogIndex);
  assert.ok(dense.smogIndex >= 0);
});

test('extractive key sentences selects relevant sentences in reading order', () => {
  const doc =
    'Reading on screens can cause visual fatigue for many readers. ' +
    'Spacing and font selection change how easily words are decoded. ' +
    'The weather outside is mild today. ' +
    'Generous line spacing and calm contrast reduce visual crowding while reading.';
  const keys = extractKeySentences(doc, 2);
  assert.equal(keys.length, 2);
  assert.ok(keys[0].sentenceIndex < keys[1].sentenceIndex);
});

test('offline dictionary resolves direct matches and inflected stems', () => {
  const direct = lookupWord('Dyslexia!');
  assert.ok(direct);
  assert.equal(direct.word, 'dyslexia');
  assert.ok(direct.pronunciation.startsWith('/'));

  const stemmed = lookupWord('highlights');
  assert.ok(stemmed);
  assert.equal(stemmed.word, 'highlight');

  const people = lookupWord('People');
  assert.ok(people);
  assert.equal(people.word, 'people');

  assert.equal(lookupWord('xyznonexistentword'), null);
});
