"""Beatronome v0.17.4 release verification. Run from any working directory."""
from pathlib import Path
import re,json,hashlib,subprocess,sys
from bs4 import BeautifulSoup
import tinycss2
ROOT=Path(__file__).resolve().parent
VERSION='0.17.4'
FAIL=[];PASS=[]
def ok(condition,name):
 (PASS if condition else FAIL).append(name)
def read(name):return (ROOT/name).read_text(encoding='utf-8')
def digest(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()

html=read('index.html');js=read('app.js');sw=read('sw.js');soup=BeautifulSoup(html,'html.parser')
ok(f"const APP_VERSION='{VERSION}'" in js and f"const VERSION = '{VERSION}'" in sw,'App and SW version')
refs=[]
for e in soup.select('script[src],link[href],img[src]'):
 attr='src' if e.has_attr('src') else 'href'
 url=e.get(attr) or ''
 if url.startswith('./'):
  path=url.split('?')[0].removeprefix('./')
  refs.append(path)
  ok((ROOT/path).is_file(),f'HTML asset exists: {path}')
  if '?v=' in url:ok(url.endswith('?v='+VERSION),f'Asset version: {path}')
ids=[n['id'] for n in soup.select('[id]')]
ok(len(ids)==len(set(ids)),f'HTML IDs are unique ({len(ids)})')
styles=[x['href'] for x in soup.select('link[rel~=stylesheet]')]
ok(styles==[f'./beatronome.bundle.css?v={VERSION}'],'One runtime stylesheet bundle')
css=read('beatronome.bundle.css')
parse_errors=[x for x in tinycss2.parse_stylesheet(css,skip_whitespace=True,skip_comments=True) if x.type=='error']
ok(not parse_errors,f'CSS parser errors: {len(parse_errors)}')
for f in ['app.js','backing.js','knowledge.js','quality.js','ux-v016.js','pitch-shifter.js','clock-worker.js','audio-clock-worklet.js','sw.js','QA_V0174_TESTS.js']:
 p=subprocess.run(['node','--check',str(ROOT/f)],capture_output=True,text=True)
 ok(p.returncode==0,f'Node syntax {f}')
for bank in range(1,7):
 for role in ['strong','weak','normal']:
  p=f'audio/basic/bank{bank}_{role}.wav';ok((ROOT/p).is_file() and (ROOT/p).stat().st_size>50,p)
# Browser assets named in a SW cache mapping must exist.
for base in re.findall(r"\[([^\]]+)\]\.map\(n=>`\.\/\$\{n\}\?v=\$\{VERSION\}`\)",sw):
 for x in re.findall(r"'([^']+)'",base):
  if x=='./':continue
  ok((ROOT/x).is_file(),f'SW cache file {x}')
for f in ['THIRD_PARTY_NOTICES.txt','favicon.png','apple-touch-icon.png','icon-192.png','icon-512.png','app-artwork.png']:
 ok((ROOT/f).is_file(),f'SW static file {f}')
manifest=json.loads(read('manifest.webmanifest'))
for icon in manifest.get('icons',[]):ok((ROOT/icon['src'].removeprefix('./')).is_file(),f'Manifest icon {icon["src"]}')
# Extra static tests: no visible old version leaks in the key diagnostics modules.
for f in ['quality.js','ux-v016.js']:
 ok("version:'0.16.5'" not in read(f) and '<span class="quality-chip">v0.16.5</span>' not in read(f),f'Live version UI in {f}')
# Check source manifest for tampering, then validate content hashes.
manifest_file=ROOT/'BUILD_FINGERPRINTS.json'
if manifest_file.exists():
 data=json.loads(manifest_file.read_text())
 ok(data.get('version')==VERSION,'Fingerprint manifest version')
 for name,expected in data.get('sha256',{}).items():
  ok((ROOT/name).is_file() and digest(name)==expected,f'Fingerprint {name}')
print(f'RELEASE QA {VERSION}: {len(PASS)} PASS / {len(FAIL)} FAIL')
if FAIL:
 for x in FAIL:print('FAIL',x)
 sys.exit(1)
print('PASS: JS/CSS, IDs, version, required assets, 18 WAV, SW and fingerprints')
