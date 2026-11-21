export function useLoadImages(urls: string[]) {
	for (const url of urls) {
		const img = new Image();
		img.decoding = 'async';
		img.src = url;
	}
}
