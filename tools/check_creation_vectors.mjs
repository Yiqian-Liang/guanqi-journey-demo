/** Standalone cross-language specification check; NOT production game logic. */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const cfg = JSON.parse(readFileSync(new URL('../data/character_creation.json', import.meta.url), 'utf8'));
const stems = [...'甲乙丙丁戊己庚辛壬癸'];
const branches = [...'子丑寅卯辰巳午未申酉戌亥'];
function rng(seedHex) {
  let state = Number.parseInt(seedHex, 16) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}
for (const item of cfg.prngVectors) {
  const next = rng(item.seedHex);
  assert.deepEqual(item.words.map(() => next()), item.words);
}
for (const c of cfg.randomCases) {
  const next = rng(c.seedHex), s = {};
  for (const [key, max] of [['yearCycle',60],['monthBranch',12],['dayCycle',60],['hourBranch',12]]) {
    let pool = Object.hasOwn(c.locks,key) ? [c.locks[key]] : Array.from({length:max}, (_,i)=>i);
    if (key==='dayCycle' && c.locks.dayStem) pool=pool.filter(i=>stems[i%10]===c.locks.dayStem);
    assert.ok(pool.length);
    const limit=2**32-(2**32%pool.length);
    let u; do { u=next(); } while (u>=limit);
    s[key]=pool[u%pool.length];
  }
  assert.deepEqual(s,c.selection);
  // Independent table lookup rather than the Python formula for both derived stems.
  const chart = {mode:'structural_ganzhi',calendarVerified:false,
    year:cfg.sexagenaryCycle[s.yearCycle],
    month:cfg.monthStemRowsFromYin[s.yearCycle%5][(s.monthBranch+10)%12]+branches[s.monthBranch],
    day:cfg.sexagenaryCycle[s.dayCycle],
    hour:cfg.hourStemRowsFromZi[s.dayCycle%5][s.hourBranch]+branches[s.hourBranch]};
  assert.deepEqual(chart,c.chart);
  const code='GQ1-'+['yearCycle','monthBranch','dayCycle','hourBranch'].map(k=>String(s[k]).padStart(2,'0')).join('-');
  assert.equal(code,c.chartCode);
}
console.log(`PASS: ${cfg.prngVectors.length*16} raw uint32 vectors and ${cfg.randomCases.length} creation cases match in JavaScript.`);
console.log('NOT TESTED: production generator, game UI, map routes, saves or player experience.');
