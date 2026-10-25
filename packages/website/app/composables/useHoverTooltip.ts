interface Options<TData> {
	/** the popover element */
	el: MaybeRefOrGetter<HTMLElement | null | undefined>;
	/** runs at gesture start. `trigger` is the element `bind()` was spread on. Return `false` to cancel */
	beforeShow?: (data: TData, trigger: HTMLElement, event: Event) => boolean | void;
	/** `event` is the gesture's originating event (PointerEvent / FocusEvent). `event.currentTarget` is unusable here, use `trigger` */
	onShow?: (data: TData, event: Event, trigger: HTMLElement) => void;
	onHide?: () => unknown;
}

const LONG_PRESS_MS = 400;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;
/** after touch ends, for how long a click that follows a long press is swallowed */
const CLICK_SWALLOW_MS = 300;

/**
 * for global tooltip state. Currently only 1 tooltip is expected to be shown/pinned at a time
 * expanded & augmented are managed in `useGlobalKeyModifiers` setup
 */
export function useTooltipState() {
	return {
		isTooltipPinned: useState('isTooltipPinned', () => false),
		isTooltipExpanded: useState('isTooltipExpanded', () => false),
		/** currently only for effect tooltip showing source ability. Same logic as expanded but with `[Ctrl]` keybind */
		isTooltipAugmented: useState('isTooltipAugmented', () => false),
		/** set in `app.vue` onMounted for Safari no `popover="hint"` support */
		isPopoverHintSupported: useState('isPopoverHintSupported', () => true),
		/** `window.matchMedia('(hover: hover) and (pointer: fine)').matches` */
		isTooltipHoverMode: useState('isTooltipHoverMode', () => false),
	};
}

interface PressSession {
	abortCtl: AbortController;
	timer?: ReturnType<typeof setTimeout>;
	fired: boolean;
	/** active from the moment the long press opens the tooltip until shortly after the finger lifts */
	swallowCtl?: AbortController;
}

/** hover/touch/keyboard events for tooltip triggers and their popovers */
export function useHoverTooltip<TData = void>({ el, beforeShow, onShow, onHide }: Options<TData>) {
	const { isTooltipPinned, isPopoverHintSupported, isTooltipHoverMode } = useTooltipState();

	/** popover currently (or about to be) shown */
	let activePopover: HTMLElement | undefined;
	/** trigger that opened `activePopover`, used for focus management */
	let activeTrigger: HTMLElement | undefined;
	let hoverLeaveCtl: AbortController | undefined;
	let press: PressSession | undefined;
	let isDragging = false;
	/** when a close on click outside has to be handled manually */
	let emulateDismiss = false;
	/** `popover` attribute value to restore on close, set when the open popover was switched to manual */
	let restoreType: string | null = null;

	/* `onHide` called in popover toggle listener */
	function hide() {
		const popover = activePopover;
		if (popover?.matches(':popover-open')) {
			popover.removeAttribute('data-pinned');
			popover.hidePopover();
			isTooltipPinned.value = false;
		}
	}

	function show(event: Event, trigger: HTMLElement, data: TData, pin: boolean) {
		const popover = toValue(el);
		onShow?.(data, event, trigger);
		activeTrigger = trigger;
		if (!popover || popover.matches(':popover-open')) return false;
		activePopover = popover;
		/* touch long press: a hint popover opened while the finger is down is light-dismissed by the pointerup that ends the hold, so open it as manual and dismiss it ourselves, same as the Safari fallback */
		const type = popover.getAttribute('popover');
		restoreType = pin && type !== 'manual' ? type : null;
		restoreType !== null && popover.setAttribute('popover', 'manual');
		emulateDismiss = pin || !isPopoverHintSupported.value;
		popover.showPopover({ source: trigger });
		if (pin) {
			popover.setAttribute('data-pinned', '');
			isTooltipPinned.value = true;
		}
		window.addEventListener('keydown', onKeyDown);
		popover.addEventListener('toggle', onPopoverToggle);
		emulateDismiss && document.addEventListener('pointerdown', onOutsidePointerdown, true);
		return true;
	}

	function removeGlobalListeners() {
		window.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('pointerdown', onOutsidePointerdown, true);
	}

	function onPopoverToggle(event: ToggleEvent) {
		if (event.newState !== 'closed') return;
		const popover = event.currentTarget as HTMLElement;
		popover.removeAttribute('data-pinned');
		popover.removeEventListener('toggle', onPopoverToggle);
		hoverLeaveCtl?.abort();
		removeGlobalListeners();
		if (activePopover === popover) {
			activePopover = undefined;
			activeTrigger = undefined;
		}
		if (restoreType !== null) {
			popover.setAttribute('popover', restoreType);
			restoreType = null;
		}
		emulateDismiss = false;
		onHide?.();
		isTooltipPinned.value = false;
	}

	/** only registered when not `isPopoverHintSupported`, emulate dismiss on click outside */
	function onOutsidePointerdown(event: PointerEvent) {
		activePopover && !activePopover.contains(event.target as Node) && hide();
	}

	function onKeyDown(event: KeyboardEvent) {
		if (!activePopover) return;
		if (event.key === 'Escape') {
			emulateDismiss && hide();
		} else if (event.key.toLowerCase() === 'k' && !event.repeat && !(event.target instanceof HTMLElement && event.target.closest('input, textarea, select'))) {
			if (activePopover.hasAttribute('data-pinned')) {
				hide();
			} else {
				activePopover.setAttribute('data-pinned', '');
				isTooltipPinned.value = true;
			}
		}
	}

	function addTriggerPointerleaveListener(trigger: HTMLElement) {
		if (activeTrigger === trigger && activePopover?.matches(':popover-open')) {
			hoverLeaveCtl?.abort();
			hoverLeaveCtl = new AbortController();
			/* not `once`, leaving onto the popover keeps the tooltip so listener has to survive */
			trigger.addEventListener('pointerleave', onTriggerPointerleave, { signal: hoverLeaveCtl.signal });
		}
	}

	function onTriggerPointerleave(event: PointerEvent) {
		const popover = activePopover;
		if (!popover || activeTrigger !== event.currentTarget || event.pointerType === 'touch' || popover.hasAttribute('data-pinned')) return;
		const next = event.relatedTarget as Node | null;
		if (!next || !popover.contains(next)) {
			hide();
		}
	}

	/* bound on sibling popovers via `bindPopover()` - specifically for useInfoTooltip */
	function onPopoverPointerleave(event: PointerEvent) {
		if (!activePopover || event.pointerType === 'touch' || activePopover.hasAttribute('data-pinned')) return;
		/* entering back the trigger */
		const next = event.relatedTarget as Node | null;
		if (!next || !activeTrigger?.contains(next)) {
			hide();
		}
	}

	function swallowNextClick() {
		const abort = new AbortController();
		window.addEventListener(
			'click',
			(event) => {
				/* only clicks outside of the popover */
				if (!activePopover?.contains(event.target as Node)) {
					event.preventDefault();
					event.stopPropagation();
					abort.abort();
				}
			},
			{ capture: true, signal: abort.signal },
		);
		return abort;
	}

	function endPress(cancelled: boolean) {
		const session = press;
		if (!session) return;
		press = undefined;
		clearTimeout(session.timer);
		session.abortCtl.abort();
		const { swallowCtl: swallow } = session;
		if (swallow) {
			/* a click (if any) follows pointerup right away; pointercancel never produces one */
			cancelled ? swallow.abort() : setTimeout(() => swallow.abort(), CLICK_SWALLOW_MS);
		}
	}

	function startPress(event: PointerEvent, trigger: HTMLElement, data: TData) {
		endPress(true);
		const { clientX: startX, clientY: startY } = event;
		const abort = new AbortController();
		const { signal } = abort;
		const session: PressSession = { abortCtl: abort, fired: false };
		press = session;

		/* touch pointers are implicitly captured, so these keep firing even if the finger leaves the trigger */
		trigger.addEventListener(
			'pointermove',
			(e) => {
				if (!session.fired && Math.hypot(e.clientX - startX, e.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE_PX) endPress(true);
			},
			{ signal, passive: true },
		);
		trigger.addEventListener('pointerup', () => endPress(false), { signal });
		/* browser took the gesture over (scroll / pan) */
		trigger.addEventListener('pointercancel', () => endPress(true), { signal });

		session.timer = setTimeout(() => {
			session.fired = true;
			if (show(event, trigger, data, true)) {
				session.swallowCtl = swallowNextClick();
			}
		}, LONG_PRESS_MS);
	}

	function onPointerenter(event: PointerEvent, rawData: MaybeRefOrGetter<TData> | undefined) {
		const trigger = event.currentTarget as HTMLElement | null;
		/* isTooltipPinned checked at the beginning because browsers might dismiss at different moments */
		if (
			isDragging ||
			isTooltipPinned.value ||
			!trigger ||
			/* emulated hovers from touch in hover mode / stray mouse in touch mode */
			(isTooltipHoverMode.value ? event.pointerType === 'touch' : event.pointerType === 'mouse')
		)
			return;

		const data = toValue(rawData)!;
		if (beforeShow?.(data, trigger, event) === false) return;

		if (isTooltipHoverMode.value) {
			show(event, trigger, data, false);
			/* also covers the pointer coming back from the popover onto the trigger (already open, so `show` did nothing) */
			addTriggerPointerleaveListener(trigger);
		} else {
			startPress(event, trigger, data);
		}
	}

	function onFocusin(event: FocusEvent, rawData: MaybeRefOrGetter<TData> | undefined) {
		const trigger = event.currentTarget as HTMLElement | null;
		const target = event.target as Element;
		if (
			!trigger ||
			isTooltipPinned.value ||
			!target.matches(':focus-visible') ||
			/* focus inside a nested trigger or inside a popover is not this trigger's focus. Nested popovers are DOM descendants, so their focus events bubble up here */
			target.closest('[data-tooltip-trigger], [popover]') !== trigger
		)
			return;
		const data = toValue(rawData)!;
		if (beforeShow?.(data, trigger, event) === false) return;
		show(event, trigger, data, false);
	}

	/* works bound on the trigger or on the popover: focus moving between the two keeps the tooltip, focus leaving both hides it */
	function onFocusout(event: FocusEvent) {
		const popover = activePopover;
		if (!popover) return;
		const next = event.relatedTarget as Node | null;
		if (next && (popover.contains(next) || activeTrigger?.contains(next))) return;
		if (next || !popover.hasAttribute('data-pinned')) {
			event.stopPropagation();
			hide();
		}
	}

	/* while a press is in progress, suppress the context menu so that long press only opens the tooltip */
	function onContextmenuCapture(event: Event) {
		if (press) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	/* stop a native drag on long press of draggable elements (some item tooltip triggers are draggable) */
	function onDragstartCapture(event: DragEvent) {
		isDragging = true;
		event.currentTarget && (event.currentTarget as Node).addEventListener('dragend', () => (isDragging = false), { once: true });
		if (press) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function bind(data?: MaybeRefOrGetter<TData>) {
		return {
			'data-tooltip-trigger': '',
			onPointerenter: (event: PointerEvent) => onPointerenter(event, data),
			onFocusin: (event: FocusEvent) => onFocusin(event, data),
			onFocusout,
			onContextmenuCapture,
			onDragstartCapture,
		};
	}

	/** programmatic show. `event.currentTarget` must be the trigger */
	function showFromEvent(event: Event, data: TData) {
		const trigger = event.currentTarget as HTMLElement | null;
		if (!trigger || isTooltipPinned.value) return;
		if (beforeShow?.(data, trigger, event) === false) return;
		show(event, trigger, data, false);
		addTriggerPointerleaveListener(trigger);
	}

	onBeforeUnmount(() => {
		endPress(true);
		hoverLeaveCtl?.abort();
		removeGlobalListeners();
		/* the element is going away without a toggle event, don't leave the global pinned flag stuck */
		if (activePopover) isTooltipPinned.value = false;
	});

	/** Spread on a popover that is a SIBLING of its trigger and can be interacted with, specifically for useInfoTooltip. Not needed when the popover is a child of the trigger. */
	function bindPopover() {
		return { onFocusout, onPointerleave: onPopoverPointerleave };
	}

	return { bind, bindPopover, show: showFromEvent, hide };
}

export function useInfoTooltip() {
	let popoverEl: HTMLElement | undefined;

	const { bind, bindPopover } = useHoverTooltip({
		el: () => popoverEl,
		beforeShow(_, trigger, event) {
			const popover = trigger.nextElementSibling as HTMLElement | null;
			if (!popover) return false;
			/* when the popover is focused and Esc is pressed the browser refocuses the trigger. Don't reopen in that case */
			if (event instanceof FocusEvent && event.relatedTarget && popover.contains(event.relatedTarget as Node)) return false;
			popoverEl = popover;
			return true;
		},
	});

	return { bindTrigger: bind, bindPopover };
}
