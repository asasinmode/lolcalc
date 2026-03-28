<script setup lang="ts">
import type { IScoreboardItemShowAbilityTooltipArgs } from '~/utils/types';

const props = defineProps<{
	value: DamageSource<'Veigar'>;
	idPrefix: string;
}>();

defineEmits<{
	abilityHover: IScoreboardItemShowAbilityTooltipArgs;
}>();

const { abilityImage } = useChampionImages();

const onPassiveStacksInput = useNumberInput([props.value.internalData, 'phenomenalEvilStacks']);
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<article class="number-extra" data-passive-stacks="">
		<img
			:src="abilityImage(props.value.champion.value!.abilities.passive.variants[props.value.abilityVariants.value.passive]!.image, 'Veigar')"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="$emit('abilityHover', $event, 'passive', 0)"
		>
		<label :for="`${idPrefix}-passive-stacks`">
			Phenomenal Evil stacks
		</label>
		<input
			:id="`${idPrefix}-passive-stacks`"
			:value="value.internalData.value.phenomenalEvilStacks"
			min="0"
			type="number"
			@input="onPassiveStacksInput"
		>
		<button class="pretend-ui-button" @click="value.internalData.value.phenomenalEvilStacks = 0">
			min
		</button>
		<button class="pretend-ui-button" disabled>
			max
		</button>
	</article>
</template>
