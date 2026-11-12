// 小土小紅家 Service Worker v1.3
const CACHE_NAME = 'xiaotuXiaohong-v1.3';

const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/spinner.css',
  './css/vote.css',
  './js/app.js',
  './js/spinner.js',
  './js/vote.js',
  './libs/js/jquery.min.js',
  './libs/js/bootstrap.js',
  './libs/css/bootstrap.css',
  './icons/icon.svg'
];

// 安裝：預快取所有靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 啟動：清除舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 請求攔截：Cache First 策略（優先用快取，無快取才去網路）
self.addEventListener('fetch', (event) => {
  // Firebase 與 CDN 請求不走快取
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com') ||
    event.request.url.includes('fontawesome.com') ||
    event.request.url.includes('fonts.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // 只快取成功的 GET 請求
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET'
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
