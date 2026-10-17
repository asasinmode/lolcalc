interface Options<TData> {
	/* the popover element */
	el: MaybeRefOrGetter<HTMLElement | null | undefined>;
	onShow?: (data: TData, trigger: HTMLElement) => void;
	onHide?: () => unknown;
}

export function useHoverTooltip<TData = void>({ el, onShow, onHide }: Options<TData>) {
	function hide() {
		const popover = toValue(el);
		popover?.removeAttribute('data-pinned');
		popover?.hidePopover();
		onHide?.();
	}

	function show(trigger: HTMLElement, data: TData, pin: boolean) {
		const popover = toValue(el);
		if (popover) {
			onShow?.(data, trigger);
			popover.showPopover({ source: trigger });
			pin && popover.setAttribute('data-pinned', '');
			window.addEventListener('keydown', onKeyDown);
			setTimeout(() => {
				popover.addEventListener(
					'toggle',
					(event) => {
						event.newState === 'closed' && popover.removeAttribute('data-pinned');
						window.removeEventListener('keydown', onKeyDown);
					},
					{ once: true },
				);
			}, 0);
		}
	}

	function onTriggerEnter(event: MouseEvent, data: TData) {
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
			}
		}
	}

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', onKeyDown);
	});

	return { show: onTriggerEnter, hide };
}
