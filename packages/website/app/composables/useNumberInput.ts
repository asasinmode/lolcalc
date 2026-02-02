export function useNumberInput(targetRef: Ref<number> | Ref<number | undefined>) {
	return function onChange(event: Event) {
		console.log('number input change event', event.target, targetRef);
	};
}
