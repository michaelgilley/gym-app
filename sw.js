// Service Worker for Gym Program PWA

const CACHE_PREFIX = 'gym-app-';
const CACHE_VERSION = `${CACHE_PREFIX}v2.0.0`;
const APP_URL = new URL('./index.html', self.registration.scope).href;
const APP_SHELL = [
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install the local app shell atomically. External assets are cached at runtime.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// Remove superseded app caches without touching other caches on this origin.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_VERSION)
                    .map((cacheName) => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

// Use the network for documents, with the cached app shell as the offline fallback.
// Cache static assets after their first successful request.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(event.request);
                if (response.ok) {
                    const cache = await caches.open(CACHE_VERSION);
                    await cache.put(APP_URL, response.clone());
                }
                return response;
            } catch {
                return (await caches.match(APP_URL)) || Response.error();
            }
        })());
        return;
    }

    event.respondWith((async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        try {
            const response = await fetch(event.request);
            if (response.ok || response.type === 'opaque') {
                const cache = await caches.open(CACHE_VERSION);
                await cache.put(event.request, response.clone());
            }
            return response;
        } catch {
            return Response.error();
        }
    })());
});
