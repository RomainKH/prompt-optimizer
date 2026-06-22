// Unit tests for the Prompt Optimizer engine's pure helpers.
// Run with the built-in Node test runner (no external dependencies):
//   node --test
//
// These lock in the behaviours the README claims are "reproducible" and guard
// against regressions in the trickiest areas: token estimation, language
// detection (incl. the FR/IT accent overlap), and word-boundary matching.

const { test } = require('node:test');
const assert = require('node:assert');

const {
    estimateTokens,
    calculateCompression,
    detectLanguage,
    makeRegex,
} = require('./auto_learn.cjs');

test('estimateTokens: empty / whitespace is zero', () => {
    assert.strictEqual(estimateTokens(''), 0);
    assert.strictEqual(estimateTokens('   '), 0);
});

test('estimateTokens: short words are one token each', () => {
    assert.strictEqual(estimateTokens('parse the json'), 3);
});

test('estimateTokens: long words split into subword tokens', () => {
    // "internationalization" (20 chars) -> ceil(20/4) = 5 tokens
    assert.strictEqual(estimateTokens('internationalization'), 5);
});

test('calculateCompression: never reports negative savings', () => {
    const r = calculateCompression('short', 'a much longer optimized string here');
    assert.strictEqual(r.saved, 0);
    assert.strictEqual(r.ratio, '0.0');
});

test('calculateCompression: reports positive savings and ratio', () => {
    const r = calculateCompression('please could you parse the json file for me thanks', 'parse the json file');
    assert.ok(r.saved > 0);
    assert.ok(parseFloat(r.ratio) > 0);
    assert.strictEqual(r.originalTokens - r.optimizedTokens, r.saved);
});

test('detectLanguage: pure French', () => {
    assert.deepStrictEqual(detectLanguage('est-ce que tu peux écrire une fonction'), ['fr']);
});

test('detectLanguage: pure English', () => {
    assert.deepStrictEqual(detectLanguage('can you write a function for this'), ['en']);
});

test('detectLanguage: accented Italian is NOT misclassified as French', () => {
    // "perché"/"è" share accents with French; Italian must still win.
    const langs = detectLanguage('ciao, potresti scrivere una funzione perché ne ho bisogno');
    assert.ok(langs.includes('it'), `expected IT, got ${langs}`);
    assert.ok(!langs.includes('fr'), `IT prompt should not be tagged FR, got ${langs}`);
});

test('detectLanguage: empty input defaults to English', () => {
    assert.deepStrictEqual(detectLanguage('1234 5678'), ['en']);
});

test('detectLanguage: mixed FR+EN keeps both', () => {
    // Needs real markers from BOTH languages (FR: tu/que/est-ce; EN: can/you/this).
    const langs = detectLanguage('est-ce que tu peux write this function, can you do it');
    assert.ok(langs.includes('fr') && langs.includes('en'), `got ${langs}`);
});

test('makeRegex: matches whole words only (no substring false positives)', () => {
    assert.ok(makeRegex('just').test('just do it'));
    assert.ok(!makeRegex('just').test('adjust the value'));
    assert.ok(!makeRegex('very').test('everyday tasks'));
});

test('makeRegex: handles accented word boundaries', () => {
    assert.ok(makeRegex('été').test('cet été chaud'));
    assert.ok(!makeRegex('été').test('arrêtée'));
});

test('makeRegex: global flag replaces all occurrences', () => {
    const out = 'please please parse'.replace(makeRegex('please', { global: true }), '').replace(/\s+/g, ' ').trim();
    assert.strictEqual(out, 'parse');
});
