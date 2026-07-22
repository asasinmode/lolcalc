/* eslint-disable no-restricted-globals */
function getCacheName() {
	const now = new Date();

	const first = new Date(now.getFullYear(), now.getMonth(), 1);
	const offset = (8 - first.getDay()) % 7; // Monday = 1
	const firstMonday = new Date(first);
	firstMonday.setDate(first.getDate() + offset);

	if (now < firstMonday) {
		const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		return `cdn-images-${prev.getFullYear()}-${prev.getMonth() + 1}`;
	}

	return `cdn-images-${now.getFullYear()}-${now.getMonth() + 1}`;
}

const CACHE = getCacheName();

self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();

		await Promise.all(
			keys
				.filter(key => key.startsWith('cdn-images-') && key !== CACHE)
				.map(key => caches.delete(key)),
		);

		await self.clients.claim();
	})());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	const url = new URL(event.request.url);
	const isDDragon = url.hostname === 'ddragon.leagueoflegends.com' && url.pathname.startsWith('/cdn/');
	const isWiki = url.hostname === 'wiki.leagueoflegends.com';
	const isCDragon = url.hostname === 'raw.communitydragon.org';

	if (isDDragon || isWiki || isCDragon) {
		event.respondWith(cacheFirst(event.request));
	}
});

async function cacheFirst(request) {
	const cache = await caches.open(CACHE);

	const cached = await cache.match(request);
	if (cached) {
		return cached;
	}

	const response = await fetch(request);

	if (response.ok || response.type === 'opaque') {
		await cache.put(request, response.clone());
	}

	return response;
}
