import assert from 'node:assert/strict';
import { LineSplitter } from '../src/lib/line-splitter';
import { expandScores, extractScores, extractUpdate, topOf, tryParseJson } from '../src/lib/parser';

/**
 * Focused checks on the two pieces that no UI test would catch if broken:
 * chunk-boundary handling and dual-mode parsing. Run with:
 *   npx tsx scripts/test-parser.ts   (or via ts-node)
 */

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${name}\n       ${(err as Error).message}`);
  }
}

/* ---------------------------------------------------------------- */
/* LineSplitter                                                      */
/* ---------------------------------------------------------------- */

check('splits on \\n', () => {
  const s = new LineSplitter();
  assert.deepEqual(s.push('a\nb\n'), ['a', 'b']);
});

check('splits on \\r\\n', () => {
  const s = new LineSplitter();
  assert.deepEqual(s.push('a\r\nb\r\n'), ['a', 'b']);
});

check('holds a partial line until its newline arrives', () => {
  const s = new LineSplitter();
  assert.deepEqual(s.push('hel'), []);
  assert.deepEqual(s.push('lo\nwor'), ['hello']);
});

check('reassembles a line split across many chunks', () => {
  const s = new LineSplitter();
  const wire = '{"class":"Healthy","confidence":0.948}\n';
  const out: string[] = [];
  for (let i = 0; i < wire.length; i += 3) out.push(...s.push(wire.slice(i, i + 3)));
  assert.equal(out.length, 1);
  assert.ok(tryParseJson(out[0]), 'reassembled JSON must parse');
});

check('handles a JSON frame split mid-token (the real failure mode)', () => {
  const s = new LineSplitter();
  const frame = '{"class":"Late_Blight","confidence":0.9156,"scores":{"Healthy":0.08}}';
  const out: string[] = [];
  // Split the frame into 5-char chunks, newline only at the very end — this is
  // what a real UART stream looks like.
  for (let i = 0; i < frame.length; i += 5) {
    const piece = frame.slice(i, i + 5);
    out.push(...s.push(i + 5 >= frame.length ? `${piece}\n` : piece));
  }
  assert.equal(out.length, 1, `expected 1 reassembled line, got ${out.length}`);
  const u = extractUpdate(out[0]);
  assert.equal(u?.topLabel, 'Late_Blight');
  assert.ok(Math.abs((u?.topScore ?? 0) - 0.9156) < 1e-9);
});

check('flush returns a trailing partial line', () => {
  const s = new LineSplitter();
  s.push('no newline here');
  assert.equal(s.flush(), 'no newline here');
  assert.equal(s.flush(), null);
});

check('drops blank lines', () => {
  const s = new LineSplitter();
  assert.deepEqual(s.push('\n\n\r\nreal\n\n'), ['real']);
});

/* ---------------------------------------------------------------- */
/* Mode 1: JSON                                                      */
/* ---------------------------------------------------------------- */

check('parses the brief\'s JSON frame', () => {
  const u = extractUpdate('{"class":"Healthy", "confidence":0.948, "dsp_time":3, "nn_time":11}');
  assert.ok(u, 'must produce an update');
  assert.equal(u.source, 'json');
  assert.equal(u.topLabel, 'Healthy');
  assert.equal(u.topScore, 0.948);
  assert.equal(u.dspMs, 3);
  assert.equal(u.nnMs, 11);
});

check('parses a JSON frame carrying a full score set', () => {
  const u = extractUpdate(
    '{"class":"Late_Blight","confidence":0.91,"scores":{"Healthy":0.06,"Early_Blight":0.03,"Late_Blight":0.91}}',
  );
  assert.equal(u?.scores?.length, 3);
  assert.equal(u?.scores?.find((s) => s.label === 'Healthy')?.score, 0.06);
});

check('rejects JSON without a class', () => {
  assert.equal(tryParseJson('{"confidence":0.9}'), null);
});

check('rejects malformed JSON', () => {
  assert.equal(tryParseJson('{"class":"Healthy","confidence":'), null);
});

check('rejects non-finite confidence', () => {
  assert.equal(tryParseJson('{"class":"Healthy","confidence":"high"}'), null);
});

check('does not mistake a log line for JSON', () => {
  assert.equal(tryParseJson('[DSP] timing: 3ms'), null);
});

/* ---------------------------------------------------------------- */
/* Mode 2: raw log lines                                             */
/* ---------------------------------------------------------------- */

check('parses [DSP] timing', () => {
  assert.equal(extractUpdate('[DSP] timing: 3ms')?.dspMs, 3);
});

check('parses [NN] timing', () => {
  assert.equal(extractUpdate('[NN] timing: 11ms')?.nnMs, 11);
});

check('parses the Predictions: block', () => {
  const u = extractUpdate('Predictions: Healthy: 0.9482, Blight: 0.0518');
  assert.equal(u?.scores?.length, 2);
  assert.equal(u?.topLabel, 'Healthy');
  assert.ok(Math.abs((u?.topScore ?? 0) - 0.9482) < 1e-9);
});

check('parses [PREDICTION] Class with probability', () => {
  const u = extractUpdate('[PREDICTION] Class: Late_Blight (0.9156)');
  assert.equal(u?.topLabel, 'Late_Blight');
  assert.ok(Math.abs((u?.topScore ?? 0) - 0.9156) < 1e-9);
});

check('never treats a timing key as a class label', () => {
  const scores = extractScores('timing: 0.03 confidence: 0.97');
  assert.equal(scores, null, 'timing/confidence must be filtered out');
});

check('returns null for pure noise', () => {
  assert.equal(extractUpdate('[INFO] Signal length: 9216'), null);
});

check('ignores signal-length lines as inference signal', () => {
  assert.equal(extractUpdate('[DSP] Signal length: 1600'), null);
});

/* ---------------------------------------------------------------- */
/* Score helpers                                                     */
/* ---------------------------------------------------------------- */

check('topOf picks the maximum', () => {
  const t = topOf([
    { label: 'a', score: 0.1 },
    { label: 'b', score: 0.9 },
  ]);
  assert.equal(t.label, 'b');
  assert.equal(t.index, 1);
});

check('expandScores sums to 1', () => {
  const s = expandScores('Healthy', 0.948, ['Early_Blight', 'Late_Blight']);
  const total = s.reduce((a, b) => a + b.score, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `sum was ${total}`);
  assert.equal(s[0].label, 'Healthy');
});

check('expandScores handles a perfect score', () => {
  const s = expandScores('Healthy', 1, ['Early_Blight', 'Late_Blight']);
  const total = s.reduce((a, b) => a + b.score, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.ok(s.slice(1).every((x) => x.score === 0));
});

/* ---------------------------------------------------------------- */

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);