import asyncio,json
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
ROOT=Path(__file__).parent
async def main():
 s=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
 for t in s.select('script[src],link[href]'):t.decompose()
 for t in s.select('img[src]'):t['src']=''
 style=s.new_tag('style');style.string=(ROOT/'beatronome.bundle.css').read_text();s.head.append(style)
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
  page=await b.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
  await page.set_content(str(s));await page.evaluate("""(()=>{const d={'beatronome-onboarding-done':'1'};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>d[k]||null,setItem:(k,v)=>d[k]=String(v),removeItem:k=>delete d[k]}});Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>d['s'+k]||null,setItem:(k,v)=>d['s'+k]=String(v)}})})()""")
  for f in ['cloud-config.js','app.js','pitch-shifter.js','backing.js','knowledge.js','quality.js','ux-v016.js']:
   await page.add_script_tag(content=(ROOT/f).read_text())
  await page.locator('#playButton').click()
  await page.wait_for_timeout(600)
  a=await page.evaluate('window.BeatronomeAPI.getDiagnostics()');print('START',json.dumps(a,ensure_ascii=False))
  if a['playing']:
   await page.locator('#plusBpm').click()
   await page.wait_for_timeout(220)
   print('BPM_AFTER',await page.evaluate('window.BeatronomeAPI.getDebugSnapshot()'))
   await page.locator('#playButton').click();await page.wait_for_timeout(70)
   assert not (await page.evaluate('window.BeatronomeAPI.getDiagnostics()'))['playing']
  print('ERRORS',errors[:8]);await b.close()
asyncio.run(main())
