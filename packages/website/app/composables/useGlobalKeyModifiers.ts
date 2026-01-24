interface IGlobalKeyModifiers {
	shift: boolean;
	alt: boolean;
};

export function useGlobalKeyModifiers() {
	return useState<IGlobalKeyModifiers>('globalKeyModifiers', () => ({ shift: false, alt: false }));
}

export function _setupGlobalKeyModifiers() {
	const globalKeyModifiers = useGlobalKeyModifiers();

	function mouseDownUpdateModifiers(event: MouseEvent) {
		globalKeyModifiers.value.shift = event.shiftKey;
		globalKeyModifiers.value.alt = event.altKey;
	}

	function pressModifier(event: KeyboardEvent) {
		if (event.key === 'Shift' || event.shiftKey) {
			globalKeyModifiers.value.shift = true;
		} else if (event.key === 'Alt' || event.altKey) {
			globalKeyModifiers.value.alt = true;
		}
	}

	function releaseModifier(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			globalKeyModifiers.value.shift = false;
		} else if (event.key === 'Alt') {
			globalKeyModifiers.value.alt = false;
		}
	}

	onMounted(() => {
		globalKeyModifiers.value.shift = false;
		globalKeyModifiers.value.alt = false;
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
