import type { DamageSource } from '@lolcalc/core/DamageSource';
import CalculatorDamageSourceDebugDialog from '~/components/Calculator/CalculatorDamageSourceDebugDialog.vue';

let resolve: (() => void) | undefined;
const damageSourceRef = shallowRef<DamageSource>();
const dialogRef = shallowRef<InstanceType<typeof CalculatorDamageSourceDebugDialog>>();

function openDebugDialog(damageSource: DamageSource): Promise<void> {
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
	() => h(CalculatorDamageSourceDebugDialog, {
		ref: dialogRef,
		modelValue: damageSourceRef.value,
		onClose() {
			resolve?.();
		},
	}));

export function useDamageSourceDebug() {
	return {
		_component,
		openDebugDialog,
	};
}
