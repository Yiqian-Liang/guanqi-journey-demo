/** Independent Node crypto/BigInt calculation against frozen Python fixtures. Not a game test. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/encounter_vectors.json',import.meta.url),'utf8'));
function calculate({seed,npc,window,attempt,eligible}) {
  if (!eligible) return {disposition:'ineligible',drawn:false,nextAttempt:attempt};
  const hex=createHash('sha256').update(JSON.stringify([seed,npc,window]),'utf8').digest('hex').slice(0,16);
  const r=BigInt('0x'+hex), bp=Math.min(8000,3500+1500*(attempt-1)), pity=attempt>=4;
  const win=pity || r*10000n < BigInt(bp)*(1n<<64n);
  return {disposition:'drawn',drawn:true,probabilityBasisPoints:bp,hashWordHex:hex,encountered:win,pityUsed:pity,nextAttempt:win?1:attempt+1};
}
for(const c of fixture.cases) assert.deepEqual(calculate(c.input),c.expected);
console.log(`PASS: ${fixture.cases.length} cross-language encounter vectors; no game or network tested.`);
