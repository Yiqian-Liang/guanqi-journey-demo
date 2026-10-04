#!/usr/bin/env python3
"""Offline reference check, NOT a production game or UI test.

The generator is an executable specification. Frozen external table rows anchor
structural checks; game implementations must be checked against saved fixtures.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STEMS = '甲乙丙丁戊己庚辛壬癸'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
MASK = 0xFFFFFFFF
SELECTION_KEYS = ('yearCycle', 'monthBranch', 'dayCycle', 'hourBranch')

def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)

def validate_selection(s: dict) -> None:
    if not isinstance(s, dict) or set(s) != set(SELECTION_KEYS):
        raise ValueError('INVALID_FIELD')
    for k, n in zip(SELECTION_KEYS, (60, 12, 60, 12)):
        if type(s[k]) is not int or not 0 <= s[k] < n:
            raise ValueError('OUT_OF_BOUNDS')

def derive_chart(s: dict) -> dict:
    validate_selection(s)
    y, m, d, h = (s[k] for k in SELECTION_KEYS)
    return {
        'mode': 'structural_ganzhi', 'calendarVerified': False,
        'year': STEMS[y % 10] + BRANCHES[y % 12],
        'month': STEMS[(2 * (y % 5) + 2 + (m + 10) % 12) % 10] + BRANCHES[m],
        'day': STEMS[d % 10] + BRANCHES[d % 12],
        'hour': STEMS[(2 * (d % 5) + h) % 10] + BRANCHES[h],
    }

def words(seed: int):
    state = seed
    while True:
        state = (state + 0x6D2B79F5) & MASK
        t = ((state ^ (state >> 15)) * (state | 1)) & MASK
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & MASK)) & MASK
        yield (t ^ (t >> 14)) & MASK

def generate(seed_hex: str, locks: dict) -> tuple[dict, dict]:
    if not isinstance(seed_hex, str) or not re.fullmatch(r'[0-9a-f]{8}', seed_hex):
        raise ValueError('INVALID_SEED')
    if not isinstance(locks, dict) or set(locks) - {*SELECTION_KEYS, 'dayStem'}:
        raise ValueError('INVALID_FIELD')
    for key, n in zip(SELECTION_KEYS, (60, 12, 60, 12)):
        if key in locks and (type(locks[key]) is not int or not 0 <= locks[key] < n):
            raise ValueError('OUT_OF_BOUNDS')
    if 'dayStem' in locks and (not isinstance(locks['dayStem'], str) or locks['dayStem'] not in list(STEMS)):
        raise ValueError('INVALID_FIELD')
    if 'dayCycle' in locks and 'dayStem' in locks and STEMS[locks['dayCycle'] % 10] != locks['dayStem']:
        raise ValueError('CONFLICTING_LOCKS')
    rng = words(int(seed_hex, 16))
    out = {}
    for key, n in zip(SELECTION_KEYS, (60, 12, 60, 12)):
        pool = [locks[key]] if key in locks else list(range(n))
        if key == 'dayCycle' and 'dayStem' in locks:
            pool = [i for i in pool if STEMS[i % 10] == locks['dayStem']]
        if not pool:
            raise ValueError('CONFLICTING_LOCKS')
        limit = 2**32 - (2**32 % len(pool))
        while True:
            u = next(rng)
            if u < limit:
                out[key] = pool[u % len(pool)]
                break
    return out, derive_chart(out)

def encode(s: dict) -> str:
    validate_selection(s)
    return 'GQ1-' + '-'.join(f'{s[k]:02d}' for k in SELECTION_KEYS)

def decode(code: str) -> dict:
    if not isinstance(code, str) or not re.fullmatch(r'GQ1-(\d{2}-){3}\d{2}', code, re.ASCII):
        raise ValueError('INVALID_CODE')
    result = dict(zip(SELECTION_KEYS, (int(x) for x in code.split('-')[1:])))
    validate_selection(result)
    return result

def check_chart(chart: dict, cfg: dict) -> None:
    require(chart['calendarVerified'] is False, 'False calendar claim')
    for k in ('year', 'month', 'day', 'hour'):
        require(chart[k] in cfg['sexagenaryCycle'], f'Invalid pillar {chart[k]}')
    y, m = STEMS.index(chart['year'][0]), BRANCHES.index(chart['month'][1])
    d, h = STEMS.index(chart['day'][0]), BRANCHES.index(chart['hour'][1])
    require(chart['month'][0] == cfg['monthStemRowsFromYin'][y % 5][(m + 10) % 12], 'Year/month mismatch')
    require(chart['hour'][0] == cfg['hourStemRowsFromZi'][d % 5][h], 'Day/hour mismatch')

