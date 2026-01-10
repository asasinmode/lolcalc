import LolRuneSelectDialog from '~/components/Lol/LolRuneSelectDialog.vue';

let resolve: (() => void) | undefined;
const valueRef = ref<Ref<IChampionRunes>>();
const dialogRef = ref<InstanceType<typeof LolRuneSelectDialog>>();

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
	() => h(LolRuneSelectDialog, {
		'ref': dialogRef,
		'modelValue': valueRef.value?.value,
		'onUpdate:modelValue': function (value) {
			valueRef.value!.value = value!;
		},
		onClose() {
			resolve?.();
		},
	}));

export function useRuneSelectDialog() {
	return {
		_component,
		selectRunes,
	};
}
