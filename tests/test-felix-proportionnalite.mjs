#!/usr/bin/env node
/**
 * Unit test for felix/proportionnalite/questions.js (no browser).
 * Runs every generator many times and checks that each question is well formed:
 * finite numeric answers, valid MCQ index, distinct choices, no "NaN"/"undefined" text.
 */
import { THEMES, makeQuestion, makeExam, makePractice, isCorrect, parseAnswer, answerText } from '../felix/proportionnalite/questions.js';

const errors = [];
const RUNS = 300;

function check(q, label) {
  const text = [q.text, q.correction, ...(q.choices || []), JSON.stringify(q.table || '')].join(' ');
  if (/NaN|undefined|Infinity|\[object/.test(text)) errors.push(`${label}: bad text → ${text.slice(0, 160)}`);
  if (!q.text || !q.correction) errors.push(`${label}: missing text or correction`);
  if (q.kind === 'num') {
    if (!Number.isFinite(q.answer)) errors.push(`${label}: answer not finite (${q.answer})`);
    if (!isCorrect(q, String(q.answer).replace('.', ','))) errors.push(`${label}: own answer rejected (${q.answer})`);
    if (isCorrect(q, String(q.answer + 1))) errors.push(`${label}: answer + 1 accepted (${q.answer})`);
  } else if (q.kind === 'mcq') {
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${label}: not enough choices`);
    else {
      if (new Set(q.choices).size !== q.choices.length) errors.push(`${label}: duplicate choices ${JSON.stringify(q.choices)}`);
      if (!(q.answer >= 0 && q.answer < q.choices.length)) errors.push(`${label}: bad answer index ${q.answer}`);
    }
  } else errors.push(`${label}: unknown kind ${q.kind}`);
  if (q.graph) {
    const g = q.graph;
    for (const [x, y] of g.points) if (x > g.xmax || y > g.ymax) errors.push(`${label}: point (${x};${y}) outside graph`);
  }
  answerText(q);
}

for (const theme of THEMES) {
  const count = theme.variants.length + theme.hard.length;
  for (let v = 0; v < count; v++) {
    for (let i = 0; i < RUNS; i++) check(makeQuestion(theme.id, v), `${theme.id}#${v}`);
  }
  for (let i = 0; i < 20; i++) {
    const p = makePractice(theme.id);
    if (p.length !== 8 || p.filter(q => q.hard).length !== 2) errors.push(`${theme.id}: practice set shape`);
  }
  console.log(`  ok: ${theme.id} (${count} generators)`);
}

for (let i = 0; i < 100; i++) {
  const exam = makeExam();
  if (exam.length !== 20) errors.push(`exam has ${exam.length} questions`);
  if (exam.filter(q => q.hard).length !== THEMES.length) errors.push('exam must have one problem per chapter');
}

const parse = [['12,5', 12.5], ['1 224', 1224], ['36 €', 36], ['-4', -4], ['', NaN], ['abc', NaN]];
for (const [s, v] of parse) {
  const got = parseAnswer(s);
  if (!(Number.isNaN(v) ? Number.isNaN(got) : got === v)) errors.push(`parseAnswer(${s}) = ${got}, expected ${v}`);
}

if (errors.length) {
  console.log(`\nFAILED: ${errors.length} error(s)`);
  for (const e of [...new Set(errors)].slice(0, 40)) console.log('  ' + e);
  process.exit(1);
}
console.log('\nPASSED');
