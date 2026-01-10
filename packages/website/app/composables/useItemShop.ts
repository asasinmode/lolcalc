import LolItemShop from '~/components/Lol/LolItemShop.vue';

let resolve: (() => void) | undefined;
const valueRef = ref<Ref<IItem[]>>();
const targetProp = shallowRef<IItemVariableCalculationTarget>();
const dialogRef = ref<InstanceType<typeof LolItemShop>>();

async function selectItems(inventory: Ref<IItem[]>, target: IItemVariableCalculationTarget): Promise<void> {
	valueRef.value = inventory;
	targetProp.value = target;
	return new Promise<void>((_resolve) => {
		dialogRef.value?.open();
		resolve = _resolve;
	}).finally(() => {
		resolve = undefined;
		valueRef.value = undefined;
		targetProp.value = undefined;
	});
}

const _component = defineComponent(() =>
	() => h(LolItemShop, {
		'ref': dialogRef,
		'modelValue': valueRef.value?.value,
		'target': targetProp.value,
		'onUpdate:modelValue': function (value) {
			valueRef.value!.value = value!;
		},
		onClose() {
			resolve?.();
		},
	}));

export function useItemShop() {
	return {
		_component,
		selectItems,
	};
}
