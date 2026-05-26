// sw.js - Service Worker لاستقبال المشاركات النصية
const CACHE_NAME = 'readaid-v1';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// استقبال المشاركات عبر POST (للتطبيقات التي تشارك نصاً)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(
      event.request.formData().then((formData) => {
        const sharedText = formData.get('text') || formData.get('title') || '';
        // تخزين النص في localStorage عبر API خاص
        const clients = self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        clients.then((clientList) => {
          if (clientList.length > 0) {
            clientList[0].postMessage({ type: 'SHARED_TEXT', text: sharedText });
          } else {
            // تخزين مؤقت لحين فتح التطبيق
            localStorage.setItem('pendingShare', sharedText);
          }
        });
        return Response.redirect('/index.html', 303);
      }).catch(() => Response.redirect('/index.html'))
    );
  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request).then(response => {
        const newResponse = response.clone();
        newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
        return newResponse;
      }).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

// التعامل مع رسائل من الصفحة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SHARED_TEXT') {
    const text = localStorage.getItem('pendingShare') || '';
    if (text) localStorage.removeItem('pendingShare');
    event.source.postMessage({ type: 'SHARED_TEXT', text });
  }
});
