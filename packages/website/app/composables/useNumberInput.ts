type NumberKey<T> = {
	[K in keyof T]: T[K] extends number ? K : never
}[keyof T];

export function useNumberInput<T>(
	targetRef: Ref<number> | Ref<number | undefined> | [targetObject: T, targetKey: NumberKey<T>],
	isInt = true,
	max?: Ref<number>,
): (event: Event) => void {
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
		if (Array.isArray(targetRef)) {
			(targetRef[0][targetRef[1]] as number) = value;
		} else {
			targetRef.value = value;
		}
	};
}
