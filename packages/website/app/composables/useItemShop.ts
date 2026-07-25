import type { DamageSource } from '@lolcalc/core/DamageSource';
import LolItemShop from '~/components/Lol/LolItemShop.vue';

let resolve: (() => void) | undefined;
const damageSourceRef = shallowRef<DamageSource>();
const dialogRef = shallowRef<InstanceType<typeof LolItemShop>>();

function selectItems(damageSource: DamageSource): Promise<void> {
	damageSourceRef.value = damageSource;
	return new Promise<void>((_resolve) => {
		dialogRef.value?.open();
		resolve = _resolve;
	}).finally(() => {
		resolve = undefined;
		damageSourceRef.value = undefined;
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
