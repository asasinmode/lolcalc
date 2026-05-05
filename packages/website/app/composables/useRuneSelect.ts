import type { IChampionRunes } from '@lolcalc/data/types';
import LolRuneSelect from '~/components/Lol/LolRuneSelect.vue';

let resolve: (() => void) | undefined;
const valueRef = shallowRef<Ref<IChampionRunes>>();
const dialogRef = shallowRef<InstanceType<typeof LolRuneSelect>>();

async function selectRunes(targetRef: Ref<IChampionRunes>): Promise<void> {
	valueRef.value = targetRef;
	return new Promise<void>((_resolve) => {
		dialogRef.value?.open();
		resolve = _resolve;
	}).finally(() => {
		resolve = undefined;
		valueRef.value = undefined;
	});
}

const _component = defineComponent(() =>
	() => h(LolRuneSelect, {
		'ref': dialogRef,
		'modelValue': valueRef.value?.value,
		'onUpdate:modelValue': function (value) {
			valueRef.value!.value = value!;
		},
		onClose() {
			resolve?.();
		},
	}));

export function useRuneSelect() {
	return {
		_component,
		selectRunes,
	};
}
