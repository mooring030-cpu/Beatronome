import asyncio
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
ROOT=Path(__file__).parent
async def main():
    raw=(ROOT/'index.html').read_text()
    soup=BeautifulSoup(raw,'html.parser')
    for tag in soup.select('link[href],script[src]'):tag.decompose()
    for img in soup.select('img[src]'):img['src']=''
    for link in soup.select('a[href]'):link['href']='#'
    style=soup.new_tag('style');style.string=(ROOT/'beatronome.bundle.css').read_text()
    soup.head.append(style)
    html=str(soup)
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run'],timeout=10000)
        for w in [320,390,768,1366]:
            page=await browser.new_page(viewport={'width':w,'height':844 if w<500 else 900})
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            # Fake persistent localStorage for a no-origin self-contained DOM test.
            await page.add_init_script("""(()=>{const m={};window.localStorage={getItem:k=>m[k]||null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>delete m[k]};window.sessionStorage={getItem:k=>m['s:'+k]||null,setItem:(k,v)=>{m['s:'+k]=String(v)}};})();""")
            await page.set_content(html,wait_until='domcontentloaded')
            await page.evaluate("""(()=>{const m={'beatronome-onboarding-done':'1'};Object.defineProperty(window,'localStorage',{value:{getItem:k=>m[k]||null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>delete m[k]},configurable:true});Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>m['s:'+k]||null,setItem:(k,v)=>{m['s:'+k]=String(v)}},configurable:true})})()""")
            for js in ['cloud-config.js','app.js','pitch-shifter.js','backing.js','knowledge.js','quality.js','ux-v016.js']:
                await page.add_script_tag(content=(ROOT/js).read_text())
            await page.wait_for_timeout(350)
            print('VIEW',w,'api',await page.evaluate("!!window.BeatronomeAPI"),'errors',errors[:5], 'scrollWidth',await page.evaluate('document.documentElement.scrollWidth'))
            if w==390 and await page.evaluate('!!window.BeatronomeAPI'):
                if await page.locator('#onboardingOverlay').is_visible():await page.locator('#skipOnboarding').click()
                await page.locator('#meterChainToggle').click()
                await page.locator('#chainAddBeats').select_option('7')
                await page.locator('#chainAddDenominator').select_option('8')
                await page.locator('#chainAddCustom').click()
                print('CHAIN',await page.locator('#meterChainList button').count())
                print('DEBUG',await page.evaluate('window.BeatronomeAPI.getDebugSnapshot()'))
            await page.screenshot(path=str(ROOT/f'QA_v0170_{w}_DOM.png'),full_page=True)
            await page.close()
        await browser.close()
asyncio.run(main())
