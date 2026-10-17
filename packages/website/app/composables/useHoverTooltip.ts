interface Options<TData> {
	el: MaybeRefOrGetter<HTMLElement | null | undefined>;
	onShow?: (data: TData, trigger: HTMLElement) => void;
	onClose?: () => unknown;
}

export function useHoverTooltip<TData = void>({ el, onShow, onClose }: Options<TData>) {
	let hovered: { trigger: HTMLElement; data: TData } | undefined;
	let triggerEl: HTMLElement | undefined;
	let isPinned = false;

	function setPinned(value: boolean) {
		isPinned = value;
		toValue(el)?.toggleAttribute('data-pinned', value);
	}

	function reset() {
		triggerEl = undefined;
		setPinned(false);
	}

	function hide() {
		toValue(el)?.hidePopover();
		onClose?.();
		reset();
	}

	function show(trigger: HTMLElement, data: TData, pin: boolean) {
		const popover = toValue(el);
		if (!popover) return;
		if (triggerEl === trigger && popover.matches(':popover-open')) {
			setPinned(pin);
			return;
		}
		onShow?.(data, trigger);
		(popover as HTMLElement & { showPopover(options?: { source?: HTMLElement }): void }).showPopover({ source: trigger });
		triggerEl = trigger;
		setPinned(pin);
	}

	function onTriggerEnter(event: MouseEvent, data: TData) {
		const trigger = event.target as HTMLElement;
		hovered = { trigger, data };
		trigger.addEventListener(
			'mouseleave',
			() => {
				if (hovered?.trigger === trigger) {
					hovered = undefined;
				}
				!isPinned && triggerEl === trigger && hide();
			},
			{ passive: true, once: true },
		);

		/* open pinned on devices that cant hover/pin with K */
		!isPinned && show(trigger, data, !matchMedia('(hover: hover) and (pointer: fine)').matches);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key.toLowerCase() !== 'k' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
		if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]')) return;
		if (isPinned) {
			const next = hovered && hovered.trigger !== triggerEl ? hovered : undefined;
			hide();
			next && show(next.trigger, next.data, true);
		} else if (hovered) {
			show(hovered.trigger, hovered.data, true);
		}
	}

	function onToggle(event: Event) {
		(event as ToggleEvent).newState === 'closed' && reset();
	}

	onMounted(() => {
		window.addEventListener('keydown', onKeyDown);
		toValue(el)?.addEventListener('toggle', onToggle);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', onKeyDown);
		toValue(el)?.removeEventListener('toggle', onToggle);
	});

	return { show: onTriggerEnter, hide };
}
