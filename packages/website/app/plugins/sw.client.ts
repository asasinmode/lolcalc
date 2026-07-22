export default defineNuxtPlugin(() => {
	'serviceWorker' in navigator && navigator.serviceWorker.register('/sw.js');
});
