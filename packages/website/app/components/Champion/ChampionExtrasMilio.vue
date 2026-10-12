<script setup vapor lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_IMAGES } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';

const props = defineProps<IExtraComponentProps>();
const emit = defineEmits<IExtraComponentEmits>();

const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;
const imgSize = abilityImageSize('Viktor');

const passiveAbilityId = GameAbilityId.build(AbilityType.champion, 'Milio', 'passive', 0);

function onImageMouseenter(event: MouseEvent) {
	emit('imgMouseenter', event, passiveAbilityId);
}

const { damageSources, damageTargets } = useCalculatorState();

const allySourceId = computed(() => (props.damageSource as DamageSource<'Milio'>).internalData.value.passiveAllySourceId);
const sourceOptions = computed(() => transformToOptions(damageSources.value));
const targetOptions = computed(() => transformToOptions(damageTargets.value));

type ICopyFromOption = [id: string, index: number, championName: string | undefined];

function transformToOptions(from: DamageSource[]): ICopyFromOption[] {
	return from
		.map((source, index) => [source, index] as [DamageSource, number])
		.filter(([source]) => source.anythingFilled.value)
		.map(([source, index]) => [source.id, index, source.listedChampion.value?.name ?? '<empty>'] as ICopyFromOption);
}

function updateAllyId(event: Event) {
	const value = (event.target as HTMLSelectElement).value;
	(props.damageSource as DamageSource<'Milio'>).internalData.value.passiveAllySourceId = value;
}

const selectEl = useTemplateRef('select');

onMounted(() => {
	if (selectEl.value) {
		/* not sure why html needs to be updated manually, maybe vapor mode */
		selectEl.value.value = allySourceId.value;
	}
});
</script>

<template>
	<article class="calc-extra-enum extras-milio-passive-ally">
		<img :src="abilityImage(damageSource.computed.abilities.value.passive[damageSource.abilityVariantsIndexes.value.passive]!.image, 'Viktor')" :width="imgSize" :height="imgSize" aria-hidden="true" @mouseenter="onImageMouseenter" />
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
