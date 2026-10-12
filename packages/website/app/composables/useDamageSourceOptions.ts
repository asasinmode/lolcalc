import type { DamageSource } from '@lolcalc/core/DamageSource';
export type ICopyFromOption = [id: string, index: number, championName: string | undefined];

function transformToOptions(from: DamageSource[]): ICopyFromOption[] {
	return from
		.map((source, index) => [source, index] as [DamageSource, number])
		.filter(([source]) => source.anythingFilled.value)
		.map(([source, index]) => [source.id, index, source.listedChampion.value?.name ?? '<empty>'] as ICopyFromOption);
}

export function useDamageSourceOptions() {
	const { damageSources, damageTargets } = useCalculatorState();

	return {
		sourceOptions: computed(() => transformToOptions(damageSources.value)),
		targetOptions: computed(() => transformToOptions(damageTargets.value)),
	};
}
