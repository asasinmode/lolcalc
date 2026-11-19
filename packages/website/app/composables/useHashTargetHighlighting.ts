export function useHashTargetHighlighting() {
	const route = useRoute();

	let previousHashTarget: HTMLElement | null;

	function highlightHash() {
		previousHashTarget?.classList.remove('hash-target');
		const el = document.querySelector<HTMLElement>(location.hash);
		previousHashTarget = el;
		if (el) {
			void el.offsetWidth;
			el.classList.add('hash-target');
		}
	}

	let highlightHashTargetWatch: (() => void) | undefined;

	onMounted(() => (highlightHashTargetWatch = watch(() => route.hash, highlightHash, { immediate: true })));
	onBeforeUnmount(() => highlightHashTargetWatch?.());
}
