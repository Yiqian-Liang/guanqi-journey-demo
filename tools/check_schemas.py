#!/usr/bin/env python3
"""Optional local JSON Schema audit; requires an already installed jsonschema.
This checks PARTIAL schemas and a synthetic fixture, NOT actual gameplay save IO.
"""
import json
from pathlib import Path
from importlib.metadata import version
try:
    from jsonschema import Draft202012Validator, ValidationError
except ImportError as exc:
    raise SystemExit('NOT RUN: optional dependency jsonschema is not installed.') from exc
ROOT=Path(__file__).resolve().parents[1]
def load(s):return json.loads((ROOT/s).read_text(encoding='utf8'))
charts=load('data/characters.json')
cs=Draft202012Validator(load('schemas/chart.schema.json'))
ss=Draft202012Validator(load('schemas/selection.schema.json'))
sv=Draft202012Validator(load('schemas/save.schema.json'))
for v in (cs,ss,sv):v.check_schema(v.schema)
for c in charts:cs.validate(c['chart'])
s=load('fixtures/save_v4_minimal.json');sv.validate(s)
ss.validate({'yearCycle':0,'monthBranch':2,'dayCycle':0,'hourBranch':0})
negative=[(cs,{**charts[0]['chart'],'calendarVerified':True}),
          (ss,{'yearCycle':True,'monthBranch':2,'dayCycle':0,'hourBranch':0}),
          (sv,{**s,'schemaVersion':2})]
for v,raw in negative:
    try:v.validate(raw)
    except ValidationError:continue
    raise AssertionError('Expected schema rejection')
print(f'PASS: 3 partial schemas; {len(charts)} charts, 1 selection, 1 synthetic save, 3 negative cases. jsonschema={version("jsonschema")}')
print('NOT TESTED: remaining business rules, actual browser persistence, save migration or game runtime.')
