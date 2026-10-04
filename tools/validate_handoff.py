#!/usr/bin/env python3
"""Offline package audit. It never starts a game, imports a user save or contacts a service."""
from __future__ import annotations
import argparse
import itertools
import json
import math
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from creation_reference import generate, words, derive_chart, encode, decode, check_chart
from reference_rules import (TABLES,BALANCE,STEMS,BRANCHES,ELEMENTS,PILLARS,GANZHI,GODS,
                            chart_selection,profile,ten_god,ten_god_profile,void_branches,stage,
                            detect_natal,relations,encounter,environment,base_cost)
ROOT=Path(__file__).resolve().parents[1]


def require(cond,msg):
    if not cond: raise AssertionError(msg)

def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'),parse_constant=lambda s:(_ for _ in ()).throw(ValueError(s)))

def rejects(fn):
    try:fn()
    except (ValueError,AssertionError,KeyError,TypeError):return
    raise AssertionError('Expected invalid input to be rejected')

def walk(x):
    if isinstance(x,dict):
        yield x
        for v in x.values():yield from walk(v)
    elif isinstance(x,list):
        for v in x:yield from walk(v)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--exhaustive',action='store_true')
    ap.add_argument('--report',type=Path,help='Optional explicit output path; otherwise no files modified')
    args=ap.parse_args();started_perf=time.perf_counter();counts={}
    alljson={str(p.relative_to(ROOT)):load(p.relative_to(ROOT)) for folder in ['data','fixtures','schemas'] for p in (ROOT/folder).glob('*.json')}
    counts['json_files_parsed']=len(alljson)
    data={Path(p).stem:x for p,x in alljson.items() if p.startswith('data/')}
    for name,x in data.items():
        if isinstance(x,dict) and 'schemaVersion' in x:require(x['schemaVersion']==4,f'{name}: schema version drift')
    pc=data['package_config'];require(pc['contentVersion']=='0.4.0' and pc['saveSchemaVersion']==4,'Package versions')
    require(TABLES['profileId']==pc['cultureProfileId'] and BALANCE['profileId']==pc['balanceProfileId'],'Profile references')
    src={s['id'] for s in data['sources']}
    for rec in walk(data):
        for s in rec.get('sourceRefs',[]):require(s in src,'Missing source ID '+s)
    # Frozen structural data are independent table anchors, not proof of historic authenticity.
    cfg=data['character_creation'];require(cfg['combinationCount']==518400,'Combination count')
    for s in cfg['prngVectors']:
        actual=words(int(s['seedHex'],16))
        expected=s.get('first16Uint32',s.get('words'))
        if expected is None:
            expected=next(v for k,v in s.items() if isinstance(v,list))
        require([next(actual) for _ in expected]==expected,'PRNG word vector')
    counts['creation_prng_words']=sum(len(next(v for v in c.values() if isinstance(v,list))) for c in cfg['prngVectors'])
    for c in cfg['randomCases']:
        sel,chart=generate(c['seedHex'],c['locks'])
        expected_sel=c.get('expectedSelection',c.get('selection'))
        expected_chart=c.get('expectedChart',c.get('chart'))
        require(sel==expected_sel and chart==expected_chart,'Frozen creation chart vector')
        require(decode(encode(sel))==sel,'Share-code roundtrip')
    counts['creation_vectors']=len(cfg['randomCases'])
    for c in data['characters']:
        chart_selection(c['chart']);check_chart(c['chart'],cfg)
        require(not c['initialPartyMember'],'Initial NPC party lock')
    counts['authored_charts']=len(data['characters'])
    for day in range(60):
        ch=derive_chart(dict(yearCycle=0,monthBranch=2,dayCycle=day,hourBranch=0))
        check_chart(ch,cfg)
    counts['day_pillars']=60
    for i,a in enumerate(STEMS):
        row=[ten_god(a,b) for b in STEMS]
        require(row==TABLES['tenGodMatrix']['values'][i] and set(row)==set(GODS),'Ten God matrix')
    require(ten_god('甲','癸')=='正印' and ten_god('癸','甲')=='伤官','Direction')
    counts['ten_god_pairs']=100
    expected_hidden=['癸','己癸辛','甲丙戊','乙','戊乙癸','丙戊庚','丁己','己丁乙','庚壬戊','辛','戊辛丁','壬甲']
    for b,expected in zip(BRANCHES,expected_hidden):
        h=TABLES['hiddenStems'][b]
        require(''.join(h)==expected,'Hidden membership/order')
        require(sum(round(v*10) for v in BALANCE['channelBudget']['sharesByArity'][str(len(h))])==10,'Shared branch budget')
    counts['hidden_branch_tables']=12
    examples=load('fixtures/chart_examples.json');sprout=data['characters'][0]['chart'];p=profile(sprout)
    ex=examples['sproutExpected']
    require(p['elementBudget']==ex['elementBudget'],'Sprout budget correction')
    require(all(base_cost(u)==20 for u in p['elementBudgetUnits'].values()),'Sprout preview must not retain old wood18')
    require(p['visibleCounts']==ex['visibleTenGodCounts'] and p['hiddenCounts']==ex['hiddenTenGodCounts'],'Sprout counts')
    require(sum(p['hiddenCounts'].values())==ex['hiddenCount'],'Hidden count')
    for i,g in enumerate(GANZHI):
        void=void_branches(g);require(len(void)==2,'Void length')
        start=i//10*10;require(set(void).isdisjoint(x[1] for x in GANZHI[start:start+10]),'Void derivation')
    require(void_branches('甲寅')==['子','丑'] and void_branches('丙寅')==['戌','亥'],'Same branch, different day')
    counts['xunkong_day_cases']=60
    for s in STEMS:
        stages=[stage(s,b) for b in BRANCHES]
        require(len(set(stages))==12 and stage(s,TABLES['stageProfile']['starts'][s])=='长生','Stages')
    counts['stage_pairs']=120
    double=examples['doubleTianyi']['chart'];d=detect_natal(double)
    hits=[o for o in d['occurrences'] if o['shenshaId']=='tianyi']
    require({o['carrierNodeId'] for o in hits}=={'player/month/branch','player/hour/branch'},'Tianyi distinct carriers')
    require(any(o['shenshaId']=='xunkong' and o['carrierNodeId']=='player/month/branch' for o in d['occurrences']),'Concurrent void')
    edge=relations(double);require(any(e['kind']=='branch_clash' and set(e['nodeIds'])=={'player/month/branch','player/hour/branch'} for e in edge),'Concurrent clash')
    # Same place, two anchor proofs. Distinct position count not multiplied.
    dedup=derive_chart(dict(yearCycle=0,monthBranch=1,dayCycle=50,hourBranch=7)) # 甲子 丁丑 甲寅 辛未
    ds=detect_natal(dedup);hs=[x for x in ds['occurrences'] if x['shenshaId']=='tianyi']
    require(len(hs)==2 and all(len(h['proofs'])==2 for h in hs),'Proof deduplication')
    require(detect_natal(derive_chart(dict(yearCycle=0,monthBranch=2,dayCycle=1,hourBranch=0)))['dispositions']['yangren']=='not_applicable','Yin day no five-yang blade rule')
    counts['named_cultural_regressions']=6
    # Structural graph examples check positions and prohibit automatic transformation.
    for c in data['characters']:
        edges=relations(c['chart'],c['id'])
        require(len({e['id'] for e in edges})==len(edges),'Duplicate relation edge')
        require(all(e['transformation']=='not_adjudicated' and all(n.startswith(c['id']+'/') for n in e['nodeIds']) for e in edges),'Graph ownership')
    counts['natal_relation_graph_examples']=len(data['characters'])
    # Sample all structural dimensions reproducibly. This is NOT a reachability test.
    seen=set()
    for i in range(2000):
        sel,ch=generate(f'{(i*2654435761)&0xffffffff:08x}',{})
        chart_selection(ch);check_chart(ch,cfg);p=profile(ch)
        require(sum(p['elementBudgetUnits'].values())==80,'Total 80 units')
        require(sum(p['tenGodBudgetUnits'].values())==70,'Own profile excludes observer')
        cross=ten_god_profile('甲',p['nodes']);require(sum(cross['tenGodBudgetUnits'].values())==80,'Cross target all nodes')
        require(all(17<=base_cost(u)<=20 for u in p['elementBudgetUnits'].values()),'Cost bounds')
        ds=detect_natal(ch)
        require(len({o['key'] for o in ds['occurrences']})==len(ds['occurrences']),'Unique occurrences')
        require(all('/hidden/' not in o['carrierNodeId'] for o in ds['occurrences']),'No universal hidden shensha scan')
        seen.add(ch['day'][0])
    require(len(seen)==10,'Sample all day stems');counts['fixed_seed_chart_samples']=2000
    invalid=[lambda:generate('FFFFFFFF',{}),lambda:generate('00000000',{'dayCycle':0,'dayStem':'乙'}),
             lambda:generate('00000000',{'yearCycle':True}),lambda:generate('00000000',{'hourBranch':12}),
             lambda:generate('00000000',{'dayStem':'甲乙'}),lambda:decode('GQ1-００-02-00-00'),
             lambda:decode('GQ1-00-12-00-00'),lambda:chart_selection({**sprout,'calendarVerified':True}),
             lambda:chart_selection({**sprout,'month':'甲巳'}),lambda:encounter('中文','road_guest','0:9:ferry',1),
             lambda:environment(data['chapter']['initialEnvironment'],True),lambda:base_cost(float('nan'))]
    for fn in invalid:rejects(fn)
    counts['invalid_input_regressions']=len(invalid)
    if args.exhaustive:
        # Exhaust every 60*12*60*12 selection using independently cached two-pillar contributions.
        def two_budget(y,m,first):
            ch=derive_chart(dict(yearCycle=y if first else 0,monthBranch=m if first else 2,dayCycle=0 if first else y,hourBranch=0 if first else m))
            p=profile(ch);ks={'year','month'} if first else {'day','hour'}
            return tuple(sum(n['budgetUnits'] for n in p['nodes'] if n['pillar'] in ks and n['element']==e) for e in ELEMENTS)
        left=[two_budget(y,m,True) for y in range(60) for m in range(12)]
        right=[two_budget(d,h,False) for d in range(60) for h in range(12)]
        total=0
        for a in left:
            for b in right:
                units=[x+y for x,y in zip(a,b)]
                require(sum(units)==80 and all(17<=base_cost(u)<=20 for u in units),'Exhaustive budget')
                total+=1
        counts['exhaustive_budget_selections']=total
    # Environment and bounded encounter protocol.
    for vals in itertools.product([False,True],['blocked','trimmed','shaped','bypassed'],['closed','notch','open'],[False,True],range(12)):
        gate,roots,vent,shield,phase=vals
        e=environment(dict(gateRepaired=gate,rootMode=roots,ventState=vent,herbShield=shield),phase)
        require(e['inputUnits']==e['herbOutput']+e['ferryOutput']+e['spillOutput'],'Water balance')
        require(all(math.isfinite(v) for v in e.values()),'Finite environment')
        require(0<=e['fog']<=100 and 0<=e['herbHealth']<=100,'Environment bounds')
    counts['environment_states']=576
    e=environment(dict(gateRepaired=True,rootMode='trimmed',ventState='closed',herbShield=False),3)
    require(e['fog']==35 and e['herbHealth']==100,'Canonical water result')
    for c in load('fixtures/encounter_vectors.json')['cases']:
        require(encounter(**c['input'])==c['expected'],'Encounter frozen vector')
        require(encounter(**c['input'])==encounter(**c['input']),'Determinism')
    counts['encounter_vectors']=len(load('fixtures/encounter_vectors.json')['cases'])
    # Cross-file references and completeness, not proof of each runtime handler.
    skills={s['id']:s for s in data['skills']['skills']};require(len(skills)==15,'15 operations')
    require(Counter(s['element'] for s in skills.values())==dict.fromkeys(ELEMENTS,3),'3 operations per element')
    collab=data['collaboration']['entries'];require({x['tenGod'] for x in collab}==set(GODS) and len(collab)==10,'10 collaborations')
    chapter=data['chapter'];items={x['id'] for x in chapter['items']};clues={x['id'] for x in chapter['clues']};flags=set(chapter['initialFlags']);mechanisms=set(chapter['initialEnvironment'])
    require(not flags&mechanisms,'Two authoritative copies of a mechanism')
    npcids={n['id'] for n in data['party']['npcs']};gods={g['id'] for g in TABLES['shenshaRules']}
    require(len(gods)==12,'12 selected shensha types')
    conditions=data['conditions']['conditions'];rooms={x['id']:x for x in data['map_blueprint']['rooms']};nodes={x['id']:x for x in data['map_blueprint']['nodes']}
    def condition(c,stack=()):
        op=c['op']
        if op in ('all','any'):
            require(bool(c['args']),'Empty condition group')
            for a in c['args']:condition(a,stack)
        elif op=='not':condition(c['arg'],stack)
        elif op=='ref':
            require(c['id'] in conditions and c['id'] not in stack,'Bad or cyclic condition ref')
            condition(conditions[c['id']],(*stack,c['id']))
        elif op=='constant':require(type(c['value']) is bool,'Constant boolean')
        elif op=='flag':require(c['key'] in flags,'Unknown flag '+c['key'])
        elif op=='mechanism':require(c['key'] in mechanisms,'Unknown mechanism')
        elif op=='item':require(c['id'] in items and c['atLeast']>=0,'Unknown item')
        elif op=='clue':require(c['id'] in clues,'Unknown clue')
        elif op=='status':require(c['id']=='trace_window','Unknown status')
        elif op=='phase':require(all(type(p) is int and 0<=p<12 for p in c['in']),'Invalid phase condition')
        elif op=='shensha':require(c['id'] in gods and set(c['domains'])<= {'natal','transit','partner','place_legend'},'Unknown shensha/domain')
        elif op=='npcAvailable':require(c['id'] in npcids,'Unknown NPC')
        elif op=='environment':require(c['metric'] in ('fog','herbHealth','water','air') and c['compare'] in ('lt','lte','eq','gte','gt'),'Bad environment predicate')
        else:raise AssertionError('Unregistered condition op '+op)
    for k,c in conditions.items():condition(c,(k,))
    def effect(e):
        op=e['op']
        if op=='setFlag':require(e['key'] in flags,'Effect unknown flag '+e['key'])
        elif op=='setMechanism':require(e['key'] in mechanisms,'Effect unknown mechanism')
        elif op=='grantClue':require(e['id'] in clues,'Effect unknown clue')
        elif op=='learnSkill':require(e['id'] in skills,'Effect unknown skill')
        elif op in ('grantItem','spendItem'):require(e['id'] in items and type(e['quantity']) is int and e['quantity']>=0,'Effect bad item')
        elif op=='addStatus':require(e['id']=='trace_window' and e['durationTicks']>0,'Effect bad status')
        else:raise AssertionError('Unregistered effect op '+op)
    for i in data['interactions']['interactions']:
        require(i['node'] in nodes and i['handlerId'] in data['interactions']['handlerRegistry'],'Interaction node/handler')
        require(i['conditionId'] in conditions,'Interaction condition')
        for e in i['effects']:effect(e)
    for f in data['shensha_events']['families']:
        require(f['id'] in gods and f['node'] in nodes and f['eligibility'] in conditions,'Event refs')
        for es in f['effects'].values():
            for e in es:effect(e)
        for c in f.get('choiceGuards',{}).values():condition(c)
    for i in data['shensha_events']['interactions']:
        require(set(i['referencedTypes'])<=gods,'God interaction IDs')
        require(i['scope'] in ('same_carrier','same_owner_region'),'Interaction scope')
    require(len(data['shensha_events']['families'])==6 and len(data['event_variants']['variants'])==6,'Event family/variant coverage')
    for v in data['event_variants']['variants']:
        require(v['typeId'] in gods and v['parameters']['requiredFact'] in flags,'Variant refs')
    for o in data['objects']['objects']:require(o['node'] in nodes and bool(o['components']),'Object refs')
    for node in nodes.values():
        require(node['roomId'] in rooms,'Missing room')
        rm=rooms[node['roomId']];require(0<=node['x']<rm['width'] and 0<=node['y']<rm['height'],'Node outside room')
    edges=data['map_blueprint']['edges'];require(len({e['id'] for e in edges})==len(edges),'Nav edge ID uniqueness')
    for e in edges:require(e['a'] in nodes and e['b'] in nodes and e['gate'] in conditions,'Nav refs')
    def reachable(allowed):
        seen={'camp'}
        while True:
            before=len(seen)
            for e in edges:
                if e['gate'] not in allowed:continue
                if e['a'] in seen:seen.add(e['b'])
                if e['bidirectional'] and e['b'] in seen:seen.add(e['a'])
            if len(seen)==before:return seen
    before=reachable({'always'});after=reachable(set(conditions))
    require(len(after)==len(nodes),'Blueprint graph disconnected even with gates enabled')
    require('reflection_stone' in before and 'ferry' not in before,'Pre-gate clue position')
    for node in chapter['criticalPlacements'].values():require(node in before,'Key behind its gate')
    for c in chapter['clues']:
        if c['id'] in ('clue_water_trace','clue_wind_bell','clue_stone_inscription'):
            require(c['node'] in before,'Trace clue locked behind fog')
    unlocked=set(chapter['initialLearnedSkillIds'])
    for m in chapter['manuals']:
        require(m['node'] in before,'Manual blocked behind gate');unlocked.update(m['skills'])
    require(unlocked==set(skills),'Manual/core skill coverage')
    for group in data['exploration_points']['groups']:require(group['node'] in nodes and set(group['skillIds'])<=set(skills),'POI refs')
    for npc in data['party']['npcs']:
        covered=[]
        for slot in npc['scheduleSlots']:
            require(slot['node'] in nodes,'NPC node');covered.extend(slot['phases'])
        require(sorted(covered)==list(range(12)),'NPC complete nonoverlap schedule')
        require(npc['inviteConditionId'] in conditions,'NPC invite condition')
    caseids=[x['id'] for x in data['acceptance_cases']['cases']]
    require(len(caseids)==len(set(caseids)),'Duplicate acceptance ID')
    counts.update(skills=len(skills),collaborations=len(collab),shensha_types=len(gods),event_families=6,event_variants=6,
                  shensha_interactions=len(data['shensha_events']['interactions']),conditions=len(conditions),
                  objects=len(data['objects']['objects']),interactions=len(data['interactions']['interactions']),
                  map_nodes=len(nodes),map_edges=len(edges),pre_gate_graph_nodes=len(before),npc_schedules=len(npcids),
                  exploration_groups=len(data['exploration_points']['groups']),acceptance_definitions=len(caseids))
    # Synthetic fixture structural/business subset. Never claim that migration or real save IO passed.
    save=load('fixtures/save_v4_minimal.json')
    require(save['schemaVersion']==4 and set(save['actors'])==set(save['identities']),'Fixture owners')
    require(save['primaryPlayerId'] in save['identities'],'Fixture primary actor')
    require(len(save['party']['humanActorIds'])+len(save['party']['npcActorIds'])<=3,'Fixture party cap')
    for a,ident in save['identities'].items():
        require(ident['id']==a and encode(chart_selection(ident['chart']))==ident['chartCode'],'Identity chart code')
        state=save['actors'][a];rm=rooms[state['position']['roomId']]
        require(0<=state['position']['x']<rm['width'] and 0<=state['position']['y']<rm['height'],'Fixture bounds')
    require(set(save['questFacts'])==flags and set(save['environment'])==mechanisms,'Fixture registries')
    counts['synthetic_save_fixtures']=1
    # Required documentation is deliberately separate from actual game source files.
    required=['README.md','CODEX_PROMPT.md','GAME_SPEC.md','CHARACTER_CREATION.md','RULE_PROFILE.md',
        'SKILL_RUNTIME.md','TEN_GODS_COOP.md','NPC_PARTY.md','SHENSHA_RUNTIME.md','MAP_DESIGN.md',
        'CHAPTER_MIST_FERRY.md','CONTENT_GUIDE.md','ENGINEERING.md','SAVE_MIGRATION.md',
        'IMPLEMENTATION_PLAN.md','ACCEPTANCE.md','SOURCES.md','MERGE_AUDIT.md','PLAYER_EXPERIENCE.md',
        'contracts/index.ts','schemas/chart.schema.json','schemas/selection.schema.json','schemas/save.schema.json']
    for f in required:require((ROOT/f).is_file(),'Missing documentation '+f)
    counts['required_design_files']=len(required)
    report={'status':'PASS','scope':'OFFLINE_DESIGN_REFERENCE_ONLY','createdAt':datetime.now(timezone.utc).isoformat(),
            'seconds':round(time.perf_counter()-started_perf,3),'exhaustiveBudget':args.exhaustive,'counts':counts,
            'notTested':['production_game_implementation','browser_keyboard_mouse','tile_collision_and_portals',
                'real_save_import_or_migration','event_or_skill_gameplay','runtime_transit_and_partner_detection',
                'network_coop','performance','human_fun_or_balance','historical_source_authenticity']}
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,AssertionError,TypeError) as e:
        print(f'FAIL: {e}',file=sys.stderr);sys.exit(1)
