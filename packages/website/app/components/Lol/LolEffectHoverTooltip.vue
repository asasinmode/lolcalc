<script setup lang="ts">
import type { IComputedAbilityDescription, IComputedEffectDescription, IComputedItemDescription } from '@lolcalc/core/DamageSource';
import type { IGameImageData } from '@lolcalc/core/misc';
import type { IHypotheticalChampionSpecifics } from '@lolcalc/core/specifics/champion';
import type { IEffectSpecific } from '@lolcalc/core/specifics/effect';
import type { IHypotheticalItemSpecifics } from '@lolcalc/core/specifics/item';
import type { IChampion } from '@lolcalc/data/types';
import type { IEffectHoverTooltipProps } from '~/utils/types';
import { computeAbilityDescription, computeEffectDescription, computeItemDescription } from '@lolcalc/core/DamageSource';
import { gameAbilityImage } from '@lolcalc/core/misc';
import { specificKnownVariables } from '@lolcalc/core/specifics';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { EFFECT_SPECIFICS } from '@lolcalc/core/specifics/effect';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item';
import { ITEMS, useChampion } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import { LolChampionAbilityHoverTooltip, LolItemDescription } from '#components';

const props = defineProps<IEffectHoverTooltipProps>();

const globalKeyModifiers = useGlobalKeyModifiers();

const abilityImage = shallowRef<IGameImageData>(['', 0]);
const champion = shallowRef<IChampion>();
const isLoading = ref(false);

const effectSpecific = computed<IEffectSpecific | undefined>(() => props.abilityId && EFFECT_SPECIFICS[props.abilityId.id] as IEffectSpecific);

const sourceAbilityId = computed(() => effectSpecific.value?.sourceAbility);

watch(sourceAbilityId, async (abilityId) => {
	if (abilityId?.type === AbilityType.champion) {
		isLoading.value = true;
		useChampion(abilityId.id).then((usedChampion) => {
			if (sourceAbilityId.value?.id === usedChampion.id) {
				champion.value = usedChampion;
			}
			isLoading.value = false;
		});
	} else {
		champion.value = undefined;
	}
	if (abilityId) {
		gameAbilityImage(abilityId).then((data) => {
			if (sourceAbilityId.value?.id === abilityId.id) {
				abilityImage.value = data;
			}
		});
	}
}, { immediate: true });

const precomputedDescription = computed<IComputedAbilityDescription | IComputedItemDescription | undefined>(() => {
	if (!sourceAbilityId.value || sourceAbilityId.value.type === AbilityType.effect) {
		return undefined;
	}

	const { type, id } = sourceAbilityId.value;

	if (type === AbilityType.champion && champion.value && champion.value.id === id) {
		return computeAbilityDescription(
			champion.value,
			sourceAbilityId.value,
			undefined,
			{ overrideVariables: specificKnownVariables((CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[id]?.variables) },
		);
	}

	const item = ITEMS[id]!;
	return computeItemDescription(
		item,
		undefined,
		{ overrideVariables: specificKnownVariables((ITEM_SPECIFICS as IHypotheticalItemSpecifics)[id as keyof IHypotheticalItemSpecifics]?.variables) },
	);
});

const computedDescription = computed((): IComputedEffectDescription | undefined => {
	if (props.abilityId) {
		return computeEffectDescription(props.abilityId.id, props.damageSource);
	}
	return undefined;
});

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<div ref="el" popover="manual" class="effect-hover-tooltip-container">
		<article class="hover-tooltip effect">
			<img
				v-show="!isLoading"
				v-bind="gameImageAttrs(abilityImage, 56)"
				aria-hidden="true"
			>
			<h5
				class="game-description"
				v-html="effectSpecific?.label ?? '<unknown>UNKNOWN</unknown>'"
			/>
			<div class="game-description" v-html="(globalKeyModifiers.shift && computedDescription?.tooltipExtended) || computedDescription?.tooltip" />
			<UnresolvedVariablesAlert v-if="computedDescription?.anyUnknownVariables" />
			<footer v-if="precomputedDescription" v-show="!globalKeyModifiers.shift">
				Hold <kbd>[Shift]</kbd> to show source
			</footer>
		</article>
		<template v-if="precomputedDescription">
			<LolChampionAbilityHoverTooltip
				v-if="sourceAbilityId?.type === AbilityType.champion"
				v-show="globalKeyModifiers.shift"
				:precomputed-description="precomputedDescription as IComputedAbilityDescription"
			/>
			<article v-else-if="sourceAbilityId?.type === AbilityType.item" v-show="globalKeyModifiers.shift" class="hover-tooltip champion-item">
				<LolItemDescription
					:precomputed-description="precomputedDescription as IComputedItemDescription"
					source="Inventory"
					hover-tooltip
				/>
			</article>
		</template>
	</div>
</template>

<style>
@layer components {
	.effect-hover-tooltip-container {
		--at-apply: 'flex-col gap-3 pointer-events-none bg-transparent';
		position-try: flip-block;

		&:popover-open {
			--at-apply: 'flex';
		}
	}

	.hover-tooltip.effect {
		--at-apply: 'grid grid-cols-[auto_1fr] w-[min(90vw,30rem)] gap-x-[--gap-x]';

		> img {
			--at-apply: 'size-[--item-img-size]';
		}

		> div {
			--at-apply: 'col-span-full b-b-0 pb-0 mb-0 mt-[--description-mt]';
		}
	}
}

@layer overrides {
	.effect-hover-tooltip-container {
		> .champion-ability {
			--at-apply: 'grid';
		}
	}
}
</style>
