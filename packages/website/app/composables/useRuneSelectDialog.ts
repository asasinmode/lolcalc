async function selectRunes(targetRef: Ref<IChampionRunes>): Promise<void> {
	console.log('selecting runes into', targetRef);
}

export function useRuneSelectDialog() {
	return {
		selectRunes,
	};
}
