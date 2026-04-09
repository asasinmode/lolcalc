import LolChampSelect from '~/components/Lol/LolChampSelect.vue';

let resolve: (() => void) | undefined;
const valueRef = shallowRef<Ref<IListedChampion | undefined>>();
const dialogRef = shallowRef<InstanceType<typeof LolChampSelect>>();

async function selectChampion(champion: Ref<IListedChampion | undefined>): Promise<void> {
	valueRef.value = champion;
	return new Promise<void>((_resolve) => {
		dialogRef.value?.open();
		resolve = _resolve;
	}).finally(() => {
		resolve = undefined;
		valueRef.value = undefined;
	});
}

const _component = defineComponent(() =>
	() => h(LolChampSelect, {
		'ref': dialogRef,
		'modelValue': valueRef.value?.value,
		'onUpdate:modelValue': function (value) {
			valueRef.value!.value = value;
		},
		onClose() {
			resolve?.();
		},
	}));

export function useChampSelect() {
	return {
		_component,
		selectChampion,
	};
}
