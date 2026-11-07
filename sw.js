const CACHE='beatronome-v0.4';
const CORE=['./','./index.html','./styles.css?v=0.4','./app.js?v=0.4','./manifest.webmanifest?v=0.4','./favicon.png','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const req=new Request(e.request,{cache:'no-store'});
  e.respondWith(fetch(req).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
