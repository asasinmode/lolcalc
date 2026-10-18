interface Options<TData> {
	/* the popover element */
	el: MaybeRefOrGetter<HTMLElement | null | undefined>;
	onShow?: (data: TData) => void;
	onHide?: () => unknown;
}

/**
 * for global tooltip state. Currently only 1 tooltip is expected to be shown/pinned at a time
 * expanded & augmented are managed in `useGlobalKeyModifiers` setup
 * */
export function useTooltipState() {
	return {
		isTooltipPinned: useState('isTooltipPinned', () => false),
		isTooltipExpanded: useState('isTooltipExpanded', () => false),
		/** currently only for effect tooltip showing source ability. Same logic as expanded but with `[Ctrl]` keybind */
		isTooltipAugmented: useState('isTooltipAugmented', () => false),
	};
}

export function useHoverTooltip<TData = void>({ el, onShow, onHide }: Options<TData>) {
	const { isTooltipPinned } = useTooltipState();

	/* partially duplicated in popover's toggle listener */
	function hide() {
		const popover = toValue(el);
		popover?.removeAttribute('data-pinned');
		popover?.hidePopover();
		isTooltipPinned.value = false;
		onHide?.();
	}

	function show(trigger: HTMLElement, data: TData, pin: boolean) {
		const popover = toValue(el);
		if (popover) {
			onShow?.(data);
			popover.showPopover({ source: trigger });
			if (pin) {
				popover.setAttribute('data-pinned', '');
				isTooltipPinned.value = true;
			}
			window.addEventListener('keydown', onKeyDown);
			setTimeout(() => {
				popover.addEventListener(
					'toggle',
					(event) => {
						event.newState === 'closed' && popover.removeAttribute('data-pinned');
						window.removeEventListener('keydown', onKeyDown);
						onHide?.();
						isTooltipPinned.value = false;
					},
					{ once: true },
				);
			}, 0);
		}
	}

	function onTriggerEnter(event: Event, data: TData) {
		const trigger = event.target as HTMLElement;
		trigger.addEventListener(
			'mouseleave',
			() => {
				!toValue(el)?.hasAttribute('data-pinned') && hide();
			},
			{ passive: true, once: true },
		);

		/* open pinned on devices that cant hover/pin with K */
		!toValue(el)?.matches(':popover-open') && show(trigger, data, !matchMedia('(hover: hover) and (pointer: fine)').matches);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key.toLowerCase() === 'k' && !event.repeat && !(event.target instanceof HTMLElement && event.target.closest('input, textarea, select'))) {
			const popover = toValue(el);
			const isPinned = popover?.hasAttribute('data-pinned');
			if (isPinned) {
				hide();
			} else {
				popover?.setAttribute('data-pinned', '');
				isTooltipPinned.value = true;
			}
		}
	}

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', onKeyDown);
	});

	return { show: onTriggerEnter, hide };
}
