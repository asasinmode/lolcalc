import type { UnwrapRef } from 'vue';

type NumberKey<T> = {
	[K in keyof T]: T[K] extends number ? K : never
}[keyof T];

export function useNumberInput<T extends Ref>(
	targetRef: Ref<number> | Ref<number | undefined> | [targetObject: T, targetKey: NumberKey<UnwrapRef<T>>] | [targetObject: MaybeRef<any[]>, targetIndex: number] | (() => [targetObject: MaybeRef<any[]>, targetIndex: number]),
	isInt = true,
	max?: MaybeRef<number>,
): (event: Event) => void {
	return function onInput(event: Event) {
		const computedRef = typeof targetRef === 'function' ? targetRef() : targetRef;
		const rawValue = (event.target as HTMLInputElement).value;
		if (!isInt && !rawValue) {
			(event.target as HTMLInputElement).value = '0';
			return;
		}

		let value = Number(rawValue.replace(',', '.'));
		if (Number.isNaN(value) && !isInt) {
			return;
		}

		if (isInt) {
			value = Math.round(value);
			(event.target as HTMLInputElement).value = value.toString();
		}

		if (toValue(max) !== undefined) {
			value = Math.min(value, toValue(max)!);
			(event.target as HTMLInputElement).value = value.toString();
		}

		if (rawValue.startsWith('0') && (value >= 1 || value <= -1 || rawValue.startsWith('00'))) {
			(event.target as HTMLInputElement).value = value.toString();
		}

		if (Array.isArray(computedRef)) {
			if (isRef(computedRef[0])) {
				(computedRef[0].value[computedRef[1]] as number) = value;
			} else {
				(computedRef[0] as any[])[computedRef[1] as number] = value;
			}
		} else {
			computedRef.value = value;
		}
	};
}
