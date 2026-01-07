async function selectItems(targetRef: Ref<IItem[]>): Promise<void> {
	console.log('selecting items into', targetRef);
}

export function useItemShop() {
	return {
		selectItems,
	};
}
