// تغيير الاسم هنا يجبر الهاتف على التحديث فوراً دون تدخل منك
const CACHE_NAME = 'readaid-v_final_ultra'; 
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// إجبار التثبيت الفوري للنسخة الجديدة
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// تدمير ومسح الكاش والنسخ القديمة تماماً تلقائياً
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
