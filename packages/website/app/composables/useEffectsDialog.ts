import type { DamageSource } from '@lolcalc/core/DamageSource';
import CalculatorEffectsDialog from '~/components/Calculator/CalculatorEffectsDialog.vue';

let resolve: (() => void) | undefined;
const damageSourceRef = ref<DamageSource>();
const dialogRef = shallowRef<InstanceType<typeof CalculatorEffectsDialog>>();

function selectEffects(damageSource: DamageSource): Promise<void> {
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
	() => h(CalculatorEffectsDialog, {
		ref: dialogRef,
		modelValue: damageSourceRef.value,
		onClose() {
			resolve?.();
		},
	}));

export function useEffectsDialog() {
	return {
		_component,
		selectEffects,
	};
}
