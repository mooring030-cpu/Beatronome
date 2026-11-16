/* Beatronome v0.16.2: version-isolated, offline-first application shell.
 * Active sessions are never force-reloaded and existing controllers are not claimed.
 */
const VERSION = '0.16.2';
const CACHE = `beatronome-offline-v${VERSION}`;
const BASIC = Array.from({length:6},(_,i)=>['strong','weak','normal'].map(role=>`./audio/basic/bank${i+1}_${role}.wav`)).flat();
const SHELL = [
  './','./index.html',
  ...['styles.css','polish.css','design-v016.css','ux-v016.js','cloud-config.js','app.js','knowledge.js','pitch-shifter.js','backing.js','quality.js','manifest.webmanifest'].map(n=>`./${n}?v=${VERSION}`),
  './THIRD_PARTY_NOTICES.txt','./favicon.png','./apple-touch-icon.png',
  './icon-192.png','./icon-512.png','./app-artwork.png',...BASIC
];
const SHELL_SET = new Set(SHELL.map(p=>new URL(p,self.registration.scope).href));
async function fetchAsset(path){
  const r=await fetch(new Request(path,{cache:'no-store'}));
  if(!r.ok)throw new Error(`Offline asset unavailable: ${path} (${r.status})`);
  return r;
}
async function status(){
  const cache=await caches.open(CACHE);
  const missing=[];let cached=0;
  for(const path of SHELL){if(await cache.match(path))cached++;else missing.push(path);}
  return {version:VERSION,cache:CACHE,total:SHELL.length,cached,ready:missing.length===0,missing};
}
async function precache(missingOnly=false){
  const cache=await caches.open(CACHE);
  // Failure propagates on installation: do not activate an incomplete build.
  await Promise.all(SHELL.map(async path=>{
    if(missingOnly&&await cache.match(path))return;
    const response=await fetchAsset(path);
    await cache.put(path,response);
  }));
  return status();
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{await precache();await self.skipWaiting();})());
});
self.addEventListener('activate',event=>{
  // Deliberately no clients.claim(): active musical sessions retain their old UI.
  // Deliberately keep older version caches until explicit cleanup to avoid mixing
  // resources or breaking a tab still controlled by an older worker.
  event.waitUntil(Promise.resolve());
});
self.addEventListener('message',event=>{
  const port=event.ports?.[0],type=event.data?.type;
  if(type==='GET_OFFLINE_STATUS')event.waitUntil(status().then(r=>port?.postMessage(r)));
  else if(type==='PREPARE_OFFLINE')event.waitUntil(precache(true).then(r=>port?.postMessage(r)).catch(e=>port?.postMessage({ready:false,error:String(e)})));
  else if(type==='CLEANUP_OLD_OFFLINE_CACHES')event.waitUntil((async()=>{
    const names=await caches.keys();const toDelete=names.filter(n=>n.startsWith('beatronome-offline-v')&&n!==CACHE);
    await Promise.all(toDelete.map(n=>caches.delete(n)));
    port?.postMessage({deleted:toDelete.length});
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      // Crucial: only our version's index; never global caches.match(), which
      // could return an older HTML that references nonmatching JS/CSS.
      const shell=await cache.match('./index.html');
      if(shell)return shell;
      try{return await fetch(request,{cache:'no-store'});}catch{
        return new Response('Beatronome offline files are not ready.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok&&SHELL_SET.has(url.href))await cache.put(request,response.clone());
      return response;
    }catch{
      return new Response('',{status:504,statusText:'Offline resource unavailable'});
    }
  })());
});
