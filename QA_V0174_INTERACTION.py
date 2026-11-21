"""Release UI/logic validation in Chromium without remote YouTube services."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
for el in soup.select('link[rel=stylesheet]'):
 tag=soup.new_tag('style');tag.string=(ROOT/'beatronome.bundle.css').read_text(encoding='utf-8');el.replace_with(tag)
for el in soup.select('script[src]'):
 url=el.get('src','').split('?')[0].removeprefix('./')
 if (ROOT/url).is_file():
  el.attrs.pop('src',None);el.string=(ROOT/url).read_text(encoding='utf-8')
markup=str(soup)
stub='''<script>
window.__yt={pauses:0,plays:0};
window.YT={PlayerState:{UNSTARTED:-1,ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5},Player:function(id,opts){
  let current=0,duration=240,rate=1,state=2;
  this.playVideo=()=>{window.__yt.plays++;state=1;opts.events?.onStateChange?.({data:1});};
  this.pauseVideo=()=>{window.__yt.pauses++;state=2;opts.events?.onStateChange?.({data:2});};
  this.stopVideo=()=>{state=2;};this.destroy=()=>{};
  this.getCurrentTime=()=>current;this.getDuration=()=>duration;
  this.seekTo=t=>{current=t;};this.getPlayerState=()=>state;
  this.getPlaybackRate=()=>rate;this.setPlaybackRate=n=>{rate=n;opts.events?.onPlaybackRateChange?.();};
  window.setTimeout(()=>opts.events?.onReady?.(),0);
}};
</script>'''
markup=markup.replace('<body>','<body>'+stub,1)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,660,768,1366):
  context=browser.new_context(viewport={'width':width,'height':900},service_workers='block')
  page=context.new_page();errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  page.evaluate("""() => { const data = {}; Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}}); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k],clear:()=>Object.keys(data).forEach(k=>delete data[k])}}); }""")
  page.set_content(markup,wait_until='domcontentloaded');page.wait_for_timeout(700)
  page.evaluate("""() => {let on=false;window.__metro={};window.BeatronomeAPI.isPlaying=()=>on;window.BeatronomeAPI.start=()=>{on=true;return Promise.resolve(true)};window.BeatronomeAPI.stop=()=>{on=false;return true};window.BeatronomeAPI.syncFirstBeat=()=>Promise.resolve(true);window.__metro.isPlaying=()=>on;}""")
  page.evaluate("document.getElementById('tabPractice').classList.add('active');document.getElementById('backingSourceTabs').querySelector('[data-source=youtube]').click()")
  assert page.locator('#backingYoutubePane').is_visible(),('youtube hidden',width)
  assert not page.locator('#backingLocalPane').is_visible(),('local hidden',width)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('overflow',width)
  page.evaluate("document.getElementById('youtubeUrl').value='https://www.youtube.com/watch?v=dQw4w9WgXcQ'")
  page.evaluate("document.getElementById('youtubeLoad').click()")
  page.wait_for_timeout(80)
  assert page.evaluate("document.getElementById('youtubeLoopStartSeconds').placeholder")=='00:00'
  page.evaluate("document.getElementById('youtubeLoopStartSeconds').value='00:10';document.getElementById('youtubeLoopEndSeconds').value='03:50';document.getElementById('youtubeLoopApply').click()")
  assert page.evaluate("JSON.parse(localStorage.getItem('beatronome-backing-v1')).youtube.loopB")==230
  page.evaluate("document.getElementById('youtubePlayTogether').click()")
  page.wait_for_timeout(40)
  assert page.evaluate("window.__metro.isPlaying()"),('metro not started',width)
  paused_before=page.evaluate('window.__yt.pauses')
  page.evaluate("document.getElementById('youtubeMetroStop').click()")
  assert not page.evaluate('window.__metro.isPlaying()'),('metro not stopped',width)
  assert page.evaluate('window.__yt.pauses')==paused_before,('video interrupted',width)
  assert not page.locator('#youtubeMetroTogether').is_checked()
  if width>=660:
   dims=page.locator('#youtubePlayerWrap').bounding_box()
   assert dims['width']>=200 and dims['height']>=200,('YouTube min size',width,dims)
  page.evaluate("document.getElementById('backingSourceTabs').querySelector('[data-source=local]').click()")
  assert not page.locator('#backingYoutubePane').is_visible(),('youtube not hidden',width)
  assert page.locator('#backingLocalPane').is_visible(),('local hidden',width)
  page.evaluate("document.getElementById('backingVolume').value=31;document.getElementById('backingVolume').dispatchEvent(new Event('input',{bubbles:true}))")
  assert page.locator('#backingVolumeValue').inner_text()=='31%'
  assert page.locator('#stemStudio').count()==0
  assert page.locator('#backingVolume').is_visible()
  page.evaluate('window.BeatronomeAPI.start()')
  page.evaluate("document.getElementById('backingMetroStop').click()")
  assert not page.evaluate('window.__metro.isPlaying()'),('local stop',width)
  chain_before=page.evaluate("document.getElementById('meterChainToggle').closest('.meter-chain-panel').compareDocumentPosition(document.querySelector('.core-setting-strip')) & Node.DOCUMENT_POSITION_FOLLOWING")
  assert chain_before!=0,('meterchain DOM order',width)
  visual_order=page.evaluate("[getComputedStyle(document.querySelector('#tabMetronome>.meter-chain-panel')).order,getComputedStyle(document.querySelector('#tabMetronome>.core-setting-strip')).order].map(Number)")
  assert visual_order[0]<visual_order[1],('meterchain visual order',width,visual_order)
  assert not errs,('runtime JS errors',width,errs)
  print('PASS',width,'YouTube + local visibility, timecode, combined start/stop, volume, layout, no errors')
  context.close()
 browser.close()
