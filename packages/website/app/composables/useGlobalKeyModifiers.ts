interface IGlobalKeyModifiers {
	shift: boolean;
	alt: boolean;
};

export function useGlobalKeyModifiers() {
	return useState<IGlobalKeyModifiers>('globalKeyModifiers', () => ({ shift: false, alt: false }));
}

export function _setupGlobalKeyModifiers() {
	const globalKeyModifiers = useGlobalKeyModifiers();

	function pressShift(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			globalKeyModifiers.value.shift = true;
		} else if (event.key === 'Alt') {
			globalKeyModifiers.value.alt = true;
		}
	}

	function releaseShift(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			globalKeyModifiers.value.shift = false;
		} else if (event.key === 'Alt') {
			globalKeyModifiers.value.alt = false;
		}
	}

	onMounted(() => {
		window.addEventListener('keydown', pressShift, { passive: true });
		window.addEventListener('keyup', releaseShift, { passive: true });
	});

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', pressShift);
		window.removeEventListener('keyup', releaseShift);
	});
}
