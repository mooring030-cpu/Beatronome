const VERSION = '0.10.1';
const CACHE = `beatronome-offline-v${VERSION}`;

const BASIC = [];
for (let bank = 1; bank <= 6; bank++) {
  for (const role of ['strong', 'weak', 'normal']) {
    BASIC.push(`./audio/basic/bank${bank}_${role}.wav`);
  }
}

const OFFLINE_ASSETS = [
  './',
  './index.html',
  `./styles.css?v=${VERSION}`,
  `./cloud-config.js?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  `./knowledge.js?v=${VERSION}`,
  `./manifest.webmanifest?v=${VERSION}`,
  './favicon.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './app-artwork.png',
  ...BASIC,
];

async function cacheOne(cache, path) {
  try {
    const response = await fetch(new Request(path, { cache: 'no-store' }));
    if (!response || !response.ok) return false;
    await cache.put(path, response.clone());
    return true;
  } catch (_) {
    return false;
  }
}

async function offlineStatus() {
  const cache = await caches.open(CACHE);
  let cached = 0;
  const missing = [];
  for (const path of OFFLINE_ASSETS) {
    const match = await cache.match(path);
    if (match) cached += 1;
    else missing.push(path);
  }
  return {
    version: VERSION,
    cache: CACHE,
    cached,
    total: OFFLINE_ASSETS.length,
    ready: cached === OFFLINE_ASSETS.length,
    missing,
  };
}

async function prepareOffline() {
  const cache = await caches.open(CACHE);
  for (const path of OFFLINE_ASSETS) {
    const existing = await cache.match(path);
    if (!existing) await cacheOne(cache, path);
  }
  return offlineStatus();
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(OFFLINE_ASSETS.map(path => cacheOne(cache, path)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('beatronome-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const type = event.data?.type;
  if (type === 'GET_OFFLINE_STATUS') {
    event.waitUntil(offlineStatus().then(status => event.ports?.[0]?.postMessage(status)));
  }
  if (type === 'PREPARE_OFFLINE') {
    event.waitUntil(prepareOffline().then(status => event.ports?.[0]?.postMessage(status)));
  }
  if (type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html');
      if (cached) {
        event.waitUntil(fetch(event.request, { cache: 'no-store' }).then(async response => {
          if (response?.ok) {
            const cache = await caches.open(CACHE);
            await cache.put('./index.html', response.clone());
          }
        }).catch(() => {}));
        return cached;
      }
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response?.ok) {
          const cache = await caches.open(CACHE);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return new Response('Beatronome offline cache is not ready yet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request, { cache: 'no-store' });
      if (response?.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response('', { status: 504 });
    }
  })());
});
