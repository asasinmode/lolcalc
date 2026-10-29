import { toValue } from 'vue';
import type { MaybeRef, MaybeRefOrGetter } from 'vue';

type NumberKey<T> = {
	[K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export function useNumberInput<T>(
	targetRef: Ref<number | undefined> | MaybeRefOrGetter<[targetObject: MaybeRef<T>, targetKey: T extends any[] ? NumberKey<T> : keyof T]>,
	isInt = true,
	max?: MaybeRef<number>,
	setComposing = false,
): (event: Event) => void {
	return function onInput(event: Event) {
		if (setComposing) {
			(event as any).composing = false;
		}

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

		const maxed = Math.max(value, 0);
		if (maxed !== value) {
			value = maxed;
			(event.target as HTMLInputElement).value = value.toString();
		}

		if (rawValue.startsWith('0') && (value >= 1 || value <= -1 || rawValue.startsWith('00'))) {
			(event.target as HTMLInputElement).value = value.toString();
		}

		const refValue = toValue(targetRef as MaybeRefOrGetter);
		if (Array.isArray(refValue)) {
			if (isRef(refValue[0])) {
				(refValue[0].value as any)[refValue[1]] = value;
			} else {
				(refValue[0] as any)[refValue[1]] = value;
			}
		} else if (isRef(refValue)) {
			refValue.value = value;
		} else if (isRef(targetRef)) {
			(targetRef as any).value = value;
		}

		return value;
	};
}
