export function useNumberInput(targetRef: Ref<number> | Ref<number | undefined>, isInt?: boolean, max?: Ref<number>) {
	return function onChange(event: Event) {
		let value = Number((event.target as HTMLInputElement).value || '');
		if (Number.isNaN(value)) {
			value = 1;
		}
		if (isInt) {
			value = Math.round(value);
		}
		if (max) {
			value = Math.min(value, max.value);
		}
		(event.target as HTMLInputElement).value = value.toString();
		targetRef.value = value;
	};
}
