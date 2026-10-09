// Kill switch for the service worker of the old app that used to live on promptestates.com (vite-plugin-pwa).
// Browsers that still have it installed fetch this file on their next update check: it clears every cache,
// unregisters itself and reloads open tabs, so visitors get the current site instead of the cached app shell.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    var clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (c) { c.navigate(c.url); });
  })());
});
