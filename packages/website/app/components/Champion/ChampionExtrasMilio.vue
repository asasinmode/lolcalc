<script setup vapor lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_IMAGES } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import type { IExtraComponentProps } from '~/utils/types';

const props = defineProps<IExtraComponentProps>();

const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;
const imgSize = abilityImageSize('Viktor');

const selectEl = useTemplateRef('select');
const { sourceOptions, targetOptions } = useDamageSourceOptions();

const allySourceId = computed(() => (props.damageSource as DamageSource<'Milio'>).internalData.value.passiveAllySourceId);

function updateAllyId(event: Event) {
	(props.damageSource as DamageSource<'Milio'>).internalData.value.passiveAllySourceId = (event.target as HTMLSelectElement).value;
}

onMounted(() => {
	if (selectEl.value) {
		/* not sure why html needs to be updated manually, maybe vapor mode */
		selectEl.value.value = allySourceId.value;
	}
});

const tooltipTriggerBind = (props.tooltipTriggerAttrs as Extract<IExtraComponentProps['tooltipTriggerAttrs'], Function>)?.(GameAbilityId.build(AbilityType.champion, 'Milio', 'passive', 0));
</script>

<template>
	<article class="calc-extra-enum extras-milio-passive-ally">
		<img :src="abilityImage(damageSource.computed.abilities.value.passive[damageSource.abilityVariantsIndexes.value.passive]!.image, 'Viktor')" :width="imgSize" :height="imgSize" aria-hidden="true" v-bind="tooltipTriggerBind" />
		<label :for="`milio-passive-ally-${idSuffix}`"> Fired Up! target ally </label>
		<select ref="select" :id="`milio-passive-ally-${idSuffix}`" :value="allySourceId" @change="updateAllyId">
			<option value="0" :selected="allySourceId === '0'">none</option>
			<optgroup v-if="sourceOptions.length" label="sources">
				<option v-for="[sourceId, sourceIndex, championName] in sourceOptions" :key="sourceId" :value="sourceId" :selected="allySourceId === sourceId">({{ sourceIndex + 1 }}) {{ championName }}</option>
			</optgroup>
			<optgroup v-if="targetOptions.length" label="targets">
				<option v-for="[sourceId, sourceIndex, championName] in targetOptions" :key="sourceId" :value="sourceId" :selected="allySourceId === sourceId">({{ sourceIndex + 1 }}) {{ championName }}</option>
			</optgroup>
		</select>
	</article>
</template>
