export function useHighlightedDamageSources() {
	const highlightedDamageSources = useState<string[]>('highlightedDamageSourceId', () => []);

	function add(id: string) {
		if (!highlightedDamageSources.value.includes(id)) {
			highlightedDamageSources.value.push(id);
		}
	}

	function remove(id: string) {
		const index = highlightedDamageSources.value.indexOf(id);
		if (~index) {
			highlightedDamageSources.value.splice(index, 1);
		}
	}

	function has(id: string) {
		return highlightedDamageSources.value.includes(id);
	}

	return { add, remove, has, value: highlightedDamageSources };
}
