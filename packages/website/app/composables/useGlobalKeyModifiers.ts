interface IGlobalKeyModifiers {
	shift: boolean;
	alt: boolean;
	/** also cmd */
	ctrl: boolean;
};

export function useGlobalKeyModifiers() {
	return useState<IGlobalKeyModifiers>('globalKeyModifiers', () => ({ shift: false, alt: false, ctrl: false }));
}

export function _setupGlobalKeyModifiers() {
	const globalKeyModifiers = useGlobalKeyModifiers();

	function mouseDownUpdateModifiers(event: MouseEvent) {
		globalKeyModifiers.value.shift = event.shiftKey;
		globalKeyModifiers.value.alt = event.altKey;
		globalKeyModifiers.value.ctrl = event.ctrlKey;
	}

	function pressModifier(event: KeyboardEvent) {
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

	onMounted(() => {
		globalKeyModifiers.value.shift = false;
		globalKeyModifiers.value.alt = false;
		globalKeyModifiers.value.ctrl = false;
		window.addEventListener('keydown', pressModifier, { passive: true });
		window.addEventListener('keyup', releaseModifier, { passive: true });
		window.addEventListener('mousedown', mouseDownUpdateModifiers, { passive: true });
	});

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', pressModifier);
		window.removeEventListener('keyup', releaseModifier);
		window.removeEventListener('mousedown', mouseDownUpdateModifiers);
	});
}
