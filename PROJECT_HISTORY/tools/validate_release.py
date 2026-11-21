#!/usr/bin/env python3
"""Beatronome base checks. Run: python3 PROJECT_HISTORY/tools/validate_release.py"""
from pathlib import Path
from html.parser import HTMLParser
import re, sys, subprocess, wave, io, json
ROOT=Path(__file__).resolve().parents[2]
issues=[]
class Parser(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.local=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if d.get('id'):self.ids.append(d['id'])
        if tag in ('script','link','img','source'):
            s=d.get('src') or d.get('href')
            if s and not (s.startswith(('https:','http:','data:','#','//'))):self.local.append(s.split('?',1)[0].split('#',1)[0])
html=(ROOT/'index.html').read_text(encoding='utf8');p=Parser();p.feed(html)
if len(set(p.ids))!=len(p.ids):
    seen=set();duplicates=[]
    for a in p.ids:
        if a in seen:duplicates.append(a)
        seen.add(a)
    issues.append('Duplicate IDs: '+','.join(duplicates))
for r in p.local:
    if not (ROOT/r).exists():issues.append('Missing referenced asset: '+r)
for f in ROOT.glob('*.js'):
    x=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if x.returncode:issues.append('Syntax: '+f.name+' '+x.stderr[:200])
version=re.search(r"const APP_VERSION='([0-9.]+)'",(ROOT/'app.js').read_text(encoding='utf8'))
worker=re.search(r"const VERSION = '([0-9.]+)'",(ROOT/'sw.js').read_text(encoding='utf8'))
if not version or not worker:issues.append('Missing version declaration')
elif version.group(1)!=worker.group(1):issues.append('App/SW version mismatch')
if version:
    for suffix in re.findall(r'\?v=([0-9.]+)',html):
        if suffix!=version.group(1):issues.append('HTML asset version mismatch: '+suffix)
    if 'v'+version.group(1) not in html:issues.append('App UI version missing')
css_assets=re.findall(r'<link[^>]+href="(\./[^"]+\.css)(?:\?v=[0-9.]+)?"',html)
sw=(ROOT/'sw.js').read_text(encoding='utf8')
for css in css_assets:
    if Path(css).name not in sw:issues.append('Offline cache CSS missing: '+css)
count=0
for wav in (ROOT/'audio'/'basic').glob('*.wav'):
    count+=1
    try:
        with wave.open(str(wav),'rb') as w:
            if w.getnframes()==0:issues.append('Empty WAV: '+wav.name)
    except Exception as e:issues.append('Invalid WAV: '+wav.name+' '+str(e))
if count!=18:issues.append('Expected 18 basic WAV samples, got '+str(count))
# Version-specific historical tests remain archived; the latest test checks its integration.
# v0.16.6 is version agnostic, and v0.16.9 includes v0.16.8 key controls.
for name in ('QA_V0166_TESTS.js','QA_V0169_TESTS.js'):
    if (ROOT/name).exists():
        x=subprocess.run(['node',str(ROOT/name)],capture_output=True,text=True,cwd=ROOT)
        if x.returncode:issues.append(name+' failed: '+x.stderr[-500:])
        else:print(x.stdout.strip())
try:
 import tinycss2
 for css in ROOT.glob('*.css'):
    content=tinycss2.parse_stylesheet(css.read_text(encoding='utf8'),skip_whitespace=True,skip_comments=True)
    errs=[t for t in content if t.type=='error']
    if errs:issues.append('CSS parse errors in '+css.name)
except ImportError:print('INFO: tinycss2 not installed; CSS parser check skipped')
print(f'APP_VERSION={version.group(1) if version else "unknown"} HTML_IDS={len(p.ids)} BASIC_WAV={count}')
if issues:
    for x in issues: print('FAIL',x)
    sys.exit(1)
print('PASS: static linked assets, IDs, JS, version, offline styles, WAVs and bundled regression tests')
