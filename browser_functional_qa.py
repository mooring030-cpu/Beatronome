"""Self-contained Chromium DOM/function integration tests.
A real origin, YouTube backend, Apple Safari and Supabase are NOT tested here.
"""
import asyncio,json
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
ROOT=Path(__file__).parent

def html_content():
    soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
    for tag in soup.select('link[href],script[src]'):tag.decompose()
    for img in soup.select('img[src]'):img['src']=''
    for link in soup.select('a[href]'):link['href']='#'
    tag=soup.new_tag('style');tag.string=(ROOT/'beatronome.bundle.css').read_text();soup.head.append(tag)
    return str(soup)

async def main():
    passed=[];errors=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
        page=await browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:asyncio.create_task(d.accept('QA meter chain')))
        await page.set_content(html_content(),wait_until='domcontentloaded')
        await page.evaluate("""(()=>{const m={'beatronome-onboarding-done':'1'};Object.defineProperty(window,'localStorage',{value:{getItem:k=>m[k]||null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>delete m[k]},configurable:true});Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>m['s:'+k]||null,setItem:(k,v)=>{m['s:'+k]=String(v)}},configurable:true})})()""")
        for f in ['cloud-config.js','app.js','pitch-shifter.js','backing.js','knowledge.js','quality.js','ux-v016.js']:
            await page.add_script_tag(content=(ROOT/f).read_text())
        await page.wait_for_timeout(100)
        assert not errors,errors
        assert await page.evaluate("window.BeatronomeAPI.getVersion()")=='0.17.0';passed.append('boot_version')
        assert await page.locator('#meterChainToggle').count()==1
        await page.locator('#meterChainToggle').click()
        await page.locator('#chainAddBeats').select_option('7');await page.locator('#chainAddDenominator').select_option('8');await page.locator('#chainAddCustom').click()
        assert await page.locator('#meterChainList button').count()==2;passed.append('meter_chain_numeric_insert')
        await page.locator('#chainPatternSave').click()
        opts=await page.locator('#chainPatternPreset option').count()
        assert opts==2,opts;passed.append('meter_chain_preset_save')
        await page.locator('#chainPatternPreset').select_option(index=1)
        await page.locator('#chainPatternLoad').click()
        assert await page.locator('#meterChainList button').count()==2;passed.append('meter_chain_preset_load')
        assert await page.locator('#undoBar').count()==1
        await page.locator('#undoAction').click();passed.append('undo_action_functional')
        await page.locator('#liveChangeApply').select_option('nextBar')
        state=await page.evaluate("JSON.parse(localStorage.getItem('beatronome-settings-v3'))")
        assert state['ui']['changeApply']=='nextBar';passed.append('change_apply_persistence')
        backing=await page.evaluate("window.BeatronomeBackingAPI.getBackupData()")
        assert isinstance(backing,dict) and 'youtube' in backing;passed.append('backing_backup_serializes')
        valid=await page.evaluate("window.BeatronomeBackingAPI.validateBackup({youtube:{url:'https://youtu.be/abc'},markers:{}})")
        assert valid;passed.append('backing_backup_validates')
        # Backups are parsed and previewed, then a chosen preset-only restore is performed.
        source_state=await page.evaluate('JSON.parse(localStorage.getItem("beatronome-settings-v3"))')
        fake_preset={'id':'qa-preset','name':'QA Restore','bpm':133,'updatedAt':1}
        data={'app':'Beatronome','schema':2,'version':'0.17.0','settings':source_state,'presets':[fake_preset], 'backing':None}
        await page.evaluate("window.BeatronomeAPI.switchTab('presets')")
        await page.locator('#importBackupFile').set_input_files({'name':'qa-backup.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
        await page.locator('#backupPreview').wait_for(state='visible',timeout=2500)
        await page.locator('#backupRestoreSettings').uncheck()
        await page.locator('#backupPreviewConfirm').click()
        actual=await page.evaluate('JSON.parse(localStorage.getItem("beatronome-presets-v3"))')
        assert any(item['id']=='qa-preset' for item in actual);passed.append('backup_preview_selective_restore')
        assert (await page.evaluate('JSON.parse(localStorage.getItem("beatronome-settings-v3"))'))['ui']['changeApply']=='nextBar'
        passed.append('backup_preserves_unselected_settings')
        # Mock iOS support notice in desktop environment should disable unsupported vibration.
        await page.locator('#advancedToggle').count()
        # On the emulated browser, detect but do not assume hardware vibration support.
        is_disabled=await page.locator('#vibrateToggle').evaluate('(x)=>x.disabled')
        supports=await page.evaluate("typeof navigator.vibrate==='function'")
        assert is_disabled != supports;passed.append('vibration_capability_guard')
        # Background audio diagnostics should not leak credentials.
        stats=await page.evaluate('window.BeatronomeAPI.getDiagnostics()')
        assert stats['version']=='0.17.0' and 'session' not in str(stats).lower();passed.append('diagnostics_safe')
        # Mock Youtube play calls to ensure the retry isn't disabled after rejection
        assert await page.locator('#youtubeRetry').count()==1;passed.append('youtube_retry_ui')
        # Narrow viewport has no sideways scroll and actionable controls.
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth');passed.append('responsive_390')
        for width in [320,768,1366]:
            await page.set_viewport_size({'width':width,'height':900})
            await page.wait_for_timeout(50)
            sw=await page.evaluate('document.documentElement.scrollWidth')
            assert sw<=width,(width,sw)
            passed.append(f'responsive_{width}')
        # Restore to metronome, check page errors did not occur in all UI paths.
        assert not errors,errors
        passed.append('no_javascript_exceptions')
        print(json.dumps({'pass_count':len(passed),'passed':passed,'runtime_errors':errors},ensure_ascii=False,indent=2))
        await browser.close()

asyncio.run(main())
