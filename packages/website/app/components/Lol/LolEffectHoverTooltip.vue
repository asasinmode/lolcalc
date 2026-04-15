<script setup lang="ts">
import type { IEffectHoverTooltipProps } from '~/utils/types';
import { LolChampionAbilityHoverTooltip, LolItemDescription } from '#components';

const props = defineProps<IEffectHoverTooltipProps>();

const text = useText();
const globalKeyModifiers = useGlobalKeyModifiers();
const effects = useEffects();
const { minorVersion } = usePatchVersion();
const items = useItems();

const abilityImage = shallowRef<Awaited<ReturnType<typeof gameAbilityImage>>>(['', 0]);
const champion = shallowRef<IChampion>();
const isLoading = ref(false);

const effectSpecific = computed<IEffectSpecific | undefined>(() => props.abilityId && EFFECT_SPECIFICS[props.abilityId.id] as IEffectSpecific);

const sourceAbilityId = computed(() => effectSpecific.value?.sourceAbility);

watch(sourceAbilityId, async (abilityId) => {
	if (abilityId?.type === ABILITY_TYPE.champion) {
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
	if (!sourceAbilityId.value) {
		return undefined;
	}

	const { type, id } = sourceAbilityId.value;

	if (type === ABILITY_TYPE.champion && champion.value && champion.value.id === id) {
		return computeAbilityDescription(
			minorVersion,
			champion.value,
			sourceAbilityId.value,
			props.damageSource,
		);
	}

	const item = items[id]!;
	return computeItemDescription(text, minorVersion, item, props.damageSource);
});

const computedDescription = computed(() => props.abilityId && effects.data[props.abilityId.id].description);

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<div ref="el" popover="hint" class="effect-hover-tooltip-container">
		<div class="hover-tooltip effect">
			<img
				v-show="!isLoading"
				:src="abilityImage[0]"
				:width="abilityImage[1]"
				:height="abilityImage[1]"
				aria-hidden="true"
			>
			<h5
				class="game-description"
				v-html="effectSpecific?.label ?? '<unknown>UNKNOWN</unknown>'"
			/>
			<div class="game-description" v-html="computedDescription" />
			<footer v-show="!globalKeyModifiers.shift">
				Hold <kbd>[Shift]</kbd> to show source
			</footer>
		</div>
		<template v-if="precomputedDescription">
			<LolChampionAbilityHoverTooltip
				v-if="sourceAbilityId?.type === ABILITY_TYPE.champion"
				v-show="globalKeyModifiers.shift"
				:precomputed-description="precomputedDescription as IComputedAbilityDescription"
			/>
			<div v-else-if="sourceAbilityId" v-show="globalKeyModifiers.shift" class="hover-tooltip champion-item">
				<LolItemDescription
					:precomputed-description="precomputedDescription as IComputedItemDescription"
					source="Inventory"
					hover-tooltip
				/>
			</div>
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

		> div {
			--at-apply: 'col-span-full b-b-0 pb-0 mb-0 mt-[--description-mt]';
		}

		> footer {
			--at-apply: 'col-span-full text-end leading-5 b-t b-[--ui-btn-border-clr] pt-[--description-pb] mt-[--description-mb]';

			> kbd {
				--at-apply: 'font-inherit';
			}
		}
	}
}
</style>
