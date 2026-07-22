export default defineNuxtPlugin(() => {
	'serviceWorker' in navigator && navigator.serviceWorker.register(`${useRuntimeConfig().app.baseURL}sw.js`);
});
