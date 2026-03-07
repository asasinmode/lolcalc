<script setup lang="ts">
const props = defineProps<{
	value: DamageSource<'Veigar'>;
	idPrefix: string;
}>();

defineEmits<{
	abilityHover: [event: MouseEvent, ability: keyof IChampion['abilities'], variant?: number];
}>();

const { minorVersion } = usePatchVersion();

const veigarPassive = props.value.champion.value!.abilities.passive.variants[props.value.abilityVariants.value.passive]!;

const name = computed(() => {
	const { replaced: nameReplaced } = replaceGameDescriptionStringtableVariables(
		veigarPassive.name	|| '<unknown>UNKNOWN</unknown>',
		props.value.champion.value!.stringtable,
	);

	return nameReplaced;
});

const onPassiveStacksInput = useNumberInput([props.value.internalData.value, 'phenomenalEvilStacks']);
</script>

<template>
	<div data-passive-stacks="">
		<img
			:src="`https://raw.communitydragon.org/${minorVersion}/game/${veigarPassive?.image}`"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'passive')"
		>
		<label :for="`${idPrefix}-passive-stacks`">
			{{ name }}
		</label>
		<input
			:id="`${idPrefix}-passive-stacks`"
			:model-value="value.internalData.value.phenomenalEvilStacks"
			min="0"
			type="number"
			@input="onPassiveStacksInput"
		>
	</div>
</template>

<style>
@layer components {
	#calculator-scoreboard > ul > [data-scoreboard-item='Veigar'] > details > [data-extras] {
		> [data-passive-stacks] {
			--at-apply: 'grid grid-cols-[auto_1fr] grid-rows-[min-content_min-content]';

			> img {
				--at-apply: 'row-span-full';
			}
		}
	}
}
</style>
