"""Local MY FILE playback + master volume integration in Chromium; no sound hardware validation."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import wave, math, struct, tempfile
ROOT=Path(__file__).resolve().parent
soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
for el in soup.select('link[rel=stylesheet]'):
 tag=soup.new_tag('style');tag.string=(ROOT/'beatronome.bundle.css').read_text();el.replace_with(tag)
for el in soup.select('script[src]'):
 src=el.get('src','').split('?')[0].removeprefix('./')
 if (ROOT/src).is_file():el.attrs.pop('src',None);el.string=(ROOT/src).read_text()
# Disallow service worker and other external dependencies in QA.
markup=str(soup)
with tempfile.TemporaryDirectory() as d:
 wav=Path(d)/'beatronome_qa_sine.wav'
 with wave.open(str(wav),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(22050)
  w.writeframes(b''.join(struct.pack('<h',int(3500*math.sin(i*2*math.pi*440/22050))) for i in range(22050*3)))
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
  page=browser.new_page(viewport={'width':390,'height':900},service_workers='block')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate("""() => { const data = {}; Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}}); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k],clear:()=>Object.keys(data).forEach(k=>delete data[k])}}); }""")
  page.set_content(markup,wait_until='domcontentloaded')
  page.evaluate("document.getElementById('tabMetronome').classList.remove('active');document.getElementById('tabPractice').classList.add('active');document.querySelector('#backingSourceTabs [data-source=local]').click();document.getElementById('onboardingOverlay').style.setProperty('display','none','important')")
  page.locator('#backingFile').set_input_files(str(wav))
  page.wait_for_timeout(300)
  assert page.locator('#backingFileName').inner_text()==wav.name
  page.locator('#backingVolume').fill('24')
  assert page.locator('#backingVolumeValue').inner_text()=='24%'
  assert page.evaluate("JSON.parse(localStorage.getItem('beatronome-backing-v1')).volume")==24
  page.locator('#backingPlay').click()
  page.wait_for_timeout(750)
  state=page.evaluate("({paused:document.getElementById('backingMedia').paused,time:document.getElementById('backingMedia').currentTime,errors:document.getElementById('toast').textContent})")
  assert state['time']>.05 and not state['paused'],state
  page.locator('#backingVolume').fill('0')
  assert page.evaluate("JSON.parse(localStorage.getItem('beatronome-backing-v1')).volume")==0
  page.locator('#backingVolume').fill('85')
  assert page.evaluate("JSON.parse(localStorage.getItem('beatronome-backing-v1')).volume")==85
  assert not errors,errors
  page.locator('#backingPlay').click()
  assert page.evaluate('document.getElementById("backingMedia").paused')
  print('PASS: Chromium local WAV loads, plays >750ms, pauses, master volume 24→0→85 saves, no JS errors')
  browser.close()
