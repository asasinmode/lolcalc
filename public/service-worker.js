const CACHE_VERSION = 2;
const CURRENT_CACHES = {
   images: 'image-cache-v' + CACHE_VERSION
};

self.addEventListener('activate', (event) => {
   const expectedCacheNamesSet = new Set(Object.values(CURRENT_CACHES));
   event.waitUntil(
      caches.keys().then((cacheNames) => {
         return Promise.all(cacheNames.map((cacheName) => {
               if (!expectedCacheNamesSet.has(cacheName)) {
                  console.log('Deleting out of date cache:', cacheName);
                  return caches.delete(cacheName);
               }
            })
         );
      })
   );
});

self.addEventListener('fetch', function(event) {
   if(event.request.destination === "image"){
      event.respondWith(caches.open(CURRENT_CACHES.images).then(async cache => {
         return cache.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request.clone()).then(fetchResponse => {
               cache.put(event.request, fetchResponse.clone())
               return fetchResponse
            })
         })
      }))
   }
});