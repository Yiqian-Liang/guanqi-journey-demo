"""Executable DESIGN reference. Not production gameplay, calendar, network or save IO.

Works only on the selected conventions shipped in this package. All resource
numbers are original game rules. No claim of divinatory or scientific validity.
"""
from __future__ import annotations
import hashlib
import itertools
import json
from collections import Counter
from pathlib import Path
from creation_reference import derive_chart, validate_selection

ROOT = Path(__file__).resolve().parents[1]
TABLES = json.loads((ROOT/'data/cultural_tables.json').read_text(encoding='utf-8'))
BALANCE = json.loads((ROOT/'data/balance.json').read_text(encoding='utf-8'))
STEMS, BRANCHES, ELEMENTS = TABLES['stems'], TABLES['branches'], TABLES['elements']
PILLARS = ('year', 'month', 'day', 'hour')
GANZHI = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
GODS = ['比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印']


def ten_god(observer: str, target: str) -> str:
    if observer not in STEMS or target not in STEMS:
        raise ValueError('INVALID_STEM')
    a,b = STEMS.index(observer), STEMS.index(target)
    return GODS[((b//2 - a//2) % 5)*2 + int(a%2 != b%2)]


def chart_selection(c: dict) -> dict:
    if not isinstance(c,dict) or set(c) != {'mode','calendarVerified',*PILLARS}:
        raise ValueError('INVALID_CHART_FIELDS')
    if c['mode'] not in ('authored_ganzhi','structural_ganzhi') or c['calendarVerified'] is not False:
        raise ValueError('UNSUPPORTED_CALENDAR_CLAIM')
    if any(c[p] not in GANZHI for p in PILLARS):
        raise ValueError('INVALID_GANZHI')
    s = dict(yearCycle=GANZHI.index(c['year']), monthBranch=BRANCHES.index(c['month'][1]),
             dayCycle=GANZHI.index(c['day']),hourBranch=BRANCHES.index(c['hour'][1]))
    expected = derive_chart(s)
    if any(expected[p] != c[p] for p in PILLARS):
        raise ValueError('CROSS_PILLAR_MISMATCH')
    return s


def profile(c: dict, owner: str='player') -> dict:
    chart_selection(c)
    if not owner or '/' in owner or '|' in owner:
        raise ValueError('INVALID_OWNER_ID')
    budget = {e:0 for e in ELEMENTS}
    nodes = []
    for p in PILLARS:
        stem,branch = c[p]
        nodes.append(dict(id=f'{owner}/{p}/stem',ownerId=owner,pillar=p,stem=stem,
                          element=TABLES['stemElement'][stem],visibility='visible',budgetUnits=10))
        hidden = TABLES['hiddenStems'][branch]
        shares = BALANCE['channelBudget']['sharesByArity'][str(len(hidden))]
        for i,(s,share) in enumerate(zip(hidden,shares)):
            nodes.append(dict(id=f'{owner}/{p}/hidden/{i}',ownerId=owner,pillar=p,stem=s,
                element=TABLES['stemElement'][s],visibility='hidden',branch=branch,
                parentBranchId=f'{owner}/{p}/branch',budgetUnits=round(share*10)))
    for n in nodes:
        budget[n['element']] += n['budgetUnits']
    result = dict(ownerId=owner,nodes=nodes,elementBudgetUnits=budget,
                  elementBudget={e:u/10 for e,u in budget.items()},natalMonthBranch=c['month'][1],
                  seasonDepth='unknown',cultureProfileId=TABLES['profileId'],balanceProfileId=BALANCE['profileId'])
    result.update(ten_god_profile(c['day'][0],nodes,f'{owner}/day/stem'))
    return result


def ten_god_profile(observer: str, nodes: list[dict], exclude_node: str|None=None) -> dict:
    visible,hidden,units = Counter(),Counter(),{g:0 for g in GODS}
    for n in nodes:
        if n['id'] == exclude_node:
            continue
        g = ten_god(observer,n['stem'])
        (visible if n['visibility']=='visible' else hidden)[g] += 1
        units[g] += n['budgetUnits']
    return dict(visibleCounts=dict(visible),hiddenCounts=dict(hidden),tenGodBudgetUnits=units)


def base_cost(budget_units: int) -> int:
    if type(budget_units) is not int or not 0 <= budget_units <= 80:
        raise ValueError('INVALID_BUDGET')
    # Exact ceil(20*(1-.15*units/80)): no floating point boundary drift.
    return (1600 - 3*budget_units + 79)//80


def void_branches(day: str) -> list[str]:
    if day not in GANZHI:
        raise ValueError('INVALID_DAY')
    first = GANZHI.index(day)//10*10
    seen = {g[1] for g in GANZHI[first:first+10]}
    return [b for b in BRANCHES if b not in seen]


def stage(stem: str, branch: str) -> str:
    if stem not in STEMS or branch not in BRANCHES:
        raise ValueError('INVALID_STAGE_INPUT')
    p=TABLES['stageProfile']
    index=((BRANCHES.index(branch)-BRANCHES.index(p['starts'][stem]))*p['direction'][stem])%12
    return p['names'][index]


def local_value(c: dict, selector: str) -> str:
    p,part=selector.split('.')
    if p not in PILLARS or part not in ('stem','branch','pillar'):
        raise ValueError('INVALID_SELECTOR')
    return c[p] if part=='pillar' else c[p][0 if part=='stem' else 1]


def detect_natal(c: dict, owner: str='player') -> dict:
    chart_selection(c)
    found={}
    results=[]
    for rule in TABLES['shenshaRules']:
        applicable=False
        for anchor in rule['anchors']:
            v=local_value(c,anchor)
            if rule['id']=='xunkong':
                kind,targets='branch',void_branches(c['day'])
            elif rule['targetKind']=='mixed':
                entry=rule['table'][v];kind,targets=entry['kind'],entry['values']
            else:
                kind,targets=rule['targetKind'],rule['table'][v]
            applicable |= bool(targets)
            for p in PILLARS:
                target=f'{p}.{kind}'
                if rule.get('excludeSameNode') and target==anchor:
                    continue
                if local_value(c,target) not in targets:
                    continue
                carrier=f'{owner}/{p}/{kind}'
                key='|'.join((owner,TABLES['profileId'],rule['id'],'natal',carrier))
                inst=found.setdefault(key,dict(key=key,ownerId=owner,ruleProfileId=TABLES['profileId'],
                    shenshaId=rule['id'],domain='natal',carrierNodeId=carrier,proofs=[]))
                proof=dict(anchorNodeId=owner+'/'+anchor.replace('.','/'),targetNodeId=carrier,
                    ruleId=rule['id'],ruleProfileId=TABLES['profileId'],sourceRefs=rule['sourceRefs'])
                if proof not in inst['proofs']:
                    inst['proofs'].append(proof)
        occurrences=[i for i in found.values() if i['shenshaId']==rule['id']]
        results.append(dict(ruleId=rule['id'],disposition='present' if occurrences else ('absent' if applicable else 'not_applicable'),occurrences=occurrences))
    return dict(occurrences=list(found.values()),results=results,
                dispositions={r['ruleId']:r['disposition'] for r in results})


def relations(c: dict, owner: str='player') -> list[dict]:
    """Position-preserving NATAL structural graph. Does not judge transformation."""
    nodes=profile(c,owner)['nodes'];out={};r=TABLES['relations']
    def add(kind, ids, directed=False, complete=True):
        ids=list(ids) if directed else sorted(ids)
        key='|'.join([kind,*ids,str(complete)])
        out[key]=dict(id=key,kind=kind,nodeIds=ids,directed=directed,complete=complete,
                     domain='natal',ruleProfileId=TABLES['profileId'],transformation='not_adjudicated')
    visible=[n for n in nodes if n['visibility']=='visible']
    hidden=[n for n in nodes if n['visibility']=='hidden']
    for a in visible:
        for b in hidden:
            if a['stem']==b['stem']:
                add('same_stem_root',[a['id'],b['id']],True)
                add('exposed_hidden',[b['id'],a['id']],True)
            elif a['element']==b['element']:
                add('same_element_support',[a['id'],b['id']],True)
    for a,b in itertools.combinations(visible,2):
        if any({a['stem'],b['stem']}==set(pair) for pair in r['stemCombine']):
            add('stem_combine',[a['id'],b['id']])
    branches=[(p,c[p][1],f'{owner}/{p}/branch') for p in PILLARS]
    for a,b in itertools.combinations(branches,2):
        for field,kind in [('branchCombine','branch_combine'),('branchClash','branch_clash'),('branchHarm','branch_harm'),('branchBreak','branch_break')]:
            if any({a[1],b[1]}==set(pair) for pair in r[field]):
                add(kind,[a[2],b[2]])
        if a[1]==b[1] and a[1] in r['selfPunishment']:
            add('self_punishment',[a[2],b[2]])
        for first,second in ((a,b),(b,a)):
            if [first[1],second[1]] in r['punishmentDirected']:
                add('punishment',[first[2],second[2]],True)
    for field,kind in [('trines','trine'),('directionalMeetings','directional_meeting')]:
        for pattern in r[field]:
            slots=[[b for b in branches if b[1]==m] for m in pattern['members']]
            present=[s for s in slots if s]
            if len(present)<2:
                continue
            for combination in itertools.product(*present):
                add(kind,[b[2] for b in combination],complete=(len(present)==3))
    return sorted(out.values(),key=lambda e:e['id'])


def encounter(seed: str, npc: str, window: str, attempt: int, eligible: bool=True) -> dict:
    if type(attempt) is not int or attempt<1:
        raise ValueError('INVALID_ATTEMPT')
    if any(not isinstance(s,str) or not s or any(not 32<=ord(c)<=126 for c in s) for s in [seed,npc,window]):
        raise ValueError('ASCII_PROTOCOL_KEYS_REQUIRED')
    if not eligible:
        return dict(disposition='ineligible',drawn=False,nextAttempt=attempt)
    key=json.dumps([seed,npc,window],ensure_ascii=False,separators=(',',':')).encode('utf-8')
    word=int.from_bytes(hashlib.sha256(key).digest()[:8],'big')
    probability=min(8000,3500+1500*(attempt-1));pity=attempt>=4
    win=pity or word*10000 < probability*(1<<64)
    return dict(disposition='drawn',drawn=True,probabilityBasisPoints=probability,
                hashWordHex=f'{word:016x}',encountered=win,pityUsed=pity,nextAttempt=1 if win else attempt+1)


def environment(state: dict, phase: int) -> dict:
    if type(phase) is not int or not 0<=phase<12:
        raise ValueError('INVALID_PHASE')
    if set(state)!={'gateRepaired','rootMode','ventState','herbShield'}:
        raise ValueError('INVALID_ENV_FIELDS')
    if type(state['gateRepaired']) is not bool or type(state['herbShield']) is not bool:
        raise ValueError('INVALID_ENV_BOOLEAN')
    if state['rootMode'] not in ('blocked','trimmed','shaped','bypassed') or state['ventState'] not in ('closed','notch','open'):
        raise ValueError('INVALID_ENV_MODE')
    water=int(state['gateRepaired'] and state['rootMode']!='blocked')
    air={'closed':0,'notch':.5,'open':1}[state['ventState']]
    bonus=[20,20,10,0,0,0,0,0,10,20,20,20][phase]
    clamp=lambda x:max(0,min(100,x))
    return dict(water=water,air=air,fog=clamp(80-45*water-40*air+bonus),
                herbHealth=clamp(90+10*water-50*air+25*state['herbShield']),
                inputUnits=8,herbOutput=6*water,ferryOutput=2*water,spillOutput=8*(1-water))
