import type { UnwrapRef } from 'vue';

type NumberKey<T> = {
	[K in keyof T]: T[K] extends number ? K : never
}[keyof T];

export function useNumberInput<T extends Ref>(
	targetRef: Ref<number> | Ref<number | undefined> | [targetObject: T, targetKey: NumberKey<UnwrapRef<T>>] | [targetObject: any[], targetIndex: number],
	isInt = true,
	max?: MaybeRefOrGetter<number>,
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
			value = Math.min(value, toValue(max));
		}
		(event.target as HTMLInputElement).value = value.toString();
		if (Array.isArray(targetRef)) {
			if (isRef(targetRef[0])) {
				(targetRef[0].value[targetRef[1]] as number) = value;
			} else {
				((targetRef[0] as any[])[targetRef[1] as number] as number) = value;
			}
		} else {
			targetRef.value = value;
		}
	};
}
