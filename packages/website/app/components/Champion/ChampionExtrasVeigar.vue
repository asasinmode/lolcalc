<script setup lang="ts">
import type { IScoreboardItemShowAbilityTooltipArgs } from '~/utils/types';

const props = defineProps<{
	value: DamageSource<'Veigar'>;
	idPrefix: string;
}>();

defineEmits<{
	abilityHover: IScoreboardItemShowAbilityTooltipArgs;
}>();

const { abilityImage, abilityImageSize } = useChampionImages();
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<VExtrasNumber
		v-model="value.internalData.value.veigarP"
		:id-prefix
		:img="abilityImage(props.value.champion.value!.abilities.passive.variants[props.value.abilityVariantsIndexes.value.passive]!.image, 'Veigar')"
		:img-size="abilityImageSize('Veigar')"
		label="Phenomenal Evil stacks"
		:used-number-input="useNumberInput([value.internalData, 'veigarP'])"
		@img-mouseenter="$emit('abilityHover', $event, 'passive', 0)"
	/>
</template>
