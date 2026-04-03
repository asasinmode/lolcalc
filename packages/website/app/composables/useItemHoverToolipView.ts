export type IItemHoverTooltipView = 'Shop' | 'Inventory';

export function useItemHoverTooltipView(source: IItemHoverTooltipView) {
	const target = useState<IItemHoverTooltipView>(`itemHoverTooltipView${source}`);

	function pressCtrl(event: KeyboardEvent) {
		if (event.key === 'Control') {
			target.value = target.value === 'Shop' ? 'Inventory' : 'Shop';
		}
	}

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', pressCtrl);
	});

	return {
		addItemTooltipViewListeners() {
			window.addEventListener('keydown', pressCtrl);
		},
		removeItemTooltipViewListeners() {
			window.removeEventListener('keydown', pressCtrl);
		},
	};
}
