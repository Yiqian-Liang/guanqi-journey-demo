#!/usr/bin/env python3
"""Validate or regenerate the repository file inventory and SHA-256."""
from pathlib import Path
import hashlib
import sys
ROOT=Path(__file__).resolve().parents[1]

def bundled_files():
    return {
        str(path.relative_to(ROOT)): path
        for path in ROOT.rglob('*')
        if path.is_file()
        and '.git' not in path.parts
        and '__pycache__' not in path.parts
        and path.suffix != '.pyc'
        and path.name not in {'MANIFEST.sha256', '.DS_Store'}
    }

def main():
    file=ROOT/'MANIFEST.sha256'
    actual=bundled_files()
    if '--write' in sys.argv[1:]:
        rows=(f'{hashlib.sha256(actual[name].read_bytes()).hexdigest()}  {name}' for name in sorted(actual))
        file.write_text('\n'.join(rows)+'\n',encoding='utf-8')
        print(f'WROTE: {len(actual)} bundled files to SHA-256 manifest.')
        return
    if not file.is_file():raise ValueError('MANIFEST.sha256 missing')
    expected={}
    for row in file.read_text(encoding='utf-8').splitlines():
        digest,name=row.split('  ',1)
        rel=Path(name)
        if rel.is_absolute() or '..' in rel.parts or name in expected:
            raise ValueError('Invalid/duplicate manifest path')
        if len(digest)!=64 or any(x not in '0123456789abcdef' for x in digest):
            raise ValueError('Invalid digest')
        expected[name]=digest
    if set(actual)!=set(expected):
        raise ValueError(f'File inventory mismatch: missing={set(expected)-set(actual)}, extra={set(actual)-set(expected)}')
    for name,path in actual.items():
        if hashlib.sha256(path.read_bytes()).hexdigest()!=expected[name]:
            raise ValueError('SHA256 mismatch: '+name)
    print(f'PASS: {len(expected)} bundled files match SHA-256 manifest. No game behavior verified.')
if __name__=='__main__':
    try:main()
    except (ValueError,OSError) as exc:
        print('FAIL: '+str(exc),file=sys.stderr);sys.exit(1)
