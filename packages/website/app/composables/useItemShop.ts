import LolItemShop from '~/components/Lol/LolItemShop.vue';

let resolve: (() => void) | undefined;
const damageSourceRef = ref<DamageSource>();
const targetProp = shallowRef<IItemVariableCalculationTarget>();
const dialogRef = ref<InstanceType<typeof LolItemShop>>();

async function selectItems(damageSource: DamageSource): Promise<void> {
	damageSourceRef.value = damageSource;
	return new Promise<void>((_resolve) => {
		dialogRef.value?.open();
		resolve = _resolve;
	}).finally(() => {
		resolve = undefined;
		damageSourceRef.value = undefined;
		targetProp.value = undefined;
	});
}

const _component = defineComponent(() =>
	() => h(LolItemShop, {
		ref: dialogRef,
		modelValue: damageSourceRef.value,
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
