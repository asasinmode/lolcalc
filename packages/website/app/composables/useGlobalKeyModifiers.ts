interface IGlobalKeyModifiers {
	shift: boolean;
	alt: boolean;
	/** also cmd */
	ctrl: boolean;
}

export function useGlobalKeyModifiers() {
	return useState<IGlobalKeyModifiers>('globalKeyModifiers', () => ({
		shift: false,
		alt: false,
		ctrl: false,
	}));
}

/** also sets up tooltip expanded tracking */
export function _setupGlobalKeyModifiers() {
	const globalKeyModifiers = useGlobalKeyModifiers();

	function mouseDownUpdateModifiers(event: MouseEvent) {
		globalKeyModifiers.value.shift = event.shiftKey;
		globalKeyModifiers.value.alt = event.altKey;
		globalKeyModifiers.value.ctrl = event.ctrlKey;
	}

	function pressModifier(event: KeyboardEvent) {
		if (event.repeat) return;
		if (event.key === 'Shift' || event.shiftKey) {
			globalKeyModifiers.value.shift = true;
		} else if (event.key === 'Alt' || event.altKey) {
			globalKeyModifiers.value.alt = true;
		} else if (event.key === 'Control' || event.key === 'Meta' || event.ctrlKey || event.metaKey) {
			globalKeyModifiers.value.ctrl = true;
		}
	}

	function releaseModifier(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			globalKeyModifiers.value.shift = false;
		} else if (event.key === 'Alt') {
			globalKeyModifiers.value.alt = false;
		} else if (event.key === 'Control' || event.key === 'Meta' || event.ctrlKey || event.metaKey) {
			globalKeyModifiers.value.ctrl = false;
		}
	}

	const { isTooltipPinned, isTooltipExpanded, isTooltipAugmented, isPopoverHintSupported, isTooltipHoverMode } = useTooltipState();

	let hoverMatchMedia: MediaQueryList | undefined;
	function updateHoverMatchMedia(event: MediaQueryListEvent) {
		isTooltipHoverMode.value = event.matches;
	}

	onMounted(() => {
		globalKeyModifiers.value.shift = false;
		globalKeyModifiers.value.alt = false;
		globalKeyModifiers.value.ctrl = false;
		window.addEventListener('keydown', pressModifier, { passive: true });
		window.addEventListener('keyup', releaseModifier, { passive: true });
		window.addEventListener('mousedown', mouseDownUpdateModifiers, { passive: true });

		const maybePopover = document.createElement('div');
		maybePopover.popover = 'hint';
		isPopoverHintSupported.value = maybePopover.popover === 'hint';

		hoverMatchMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
		isTooltipHoverMode.value = hoverMatchMedia.matches;
		hoverMatchMedia.addEventListener('change', updateHoverMatchMedia);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', pressModifier);
		window.removeEventListener('keyup', releaseModifier);
		window.removeEventListener('mousedown', mouseDownUpdateModifiers);
		hoverMatchMedia?.removeEventListener('change', updateHoverMatchMedia);
	});

	watch(
		() => globalKeyModifiers.value.shift,
		(value) => {
			if (isTooltipPinned.value) {
				value && (isTooltipExpanded.value = !isTooltipExpanded.value);
			} else {
				isTooltipExpanded.value = value;
			}
		},
	);

	watch(
		() => globalKeyModifiers.value.ctrl,
		(value) => {
			if (isTooltipPinned.value) {
				value && (isTooltipAugmented.value = !isTooltipAugmented.value);
			} else {
				isTooltipAugmented.value = value;
			}
		},
	);

	watch(isTooltipPinned, (value) => {
		if (!value) {
			!globalKeyModifiers.value.shift && (isTooltipExpanded.value = false);
			!globalKeyModifiers.value.ctrl && (isTooltipAugmented.value = false);
		}
	});
}
