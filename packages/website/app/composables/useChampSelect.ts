async function selectChampion(targetRef: Ref<IChampion | undefined>): Promise<void> {
	console.log('selecting champion into', targetRef);
}

export function useChampSelect() {
	return {
		selectChampion,
	};
}
