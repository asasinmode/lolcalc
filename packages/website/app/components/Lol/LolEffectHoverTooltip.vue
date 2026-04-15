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

const effectSpecific = computed<IEffectSpecific | undefined>(() => EFFECT_SPECIFICS[props.abilityId.id] as IEffectSpecific);

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

	if (props.damageSource) {
		return type === ABILITY_TYPE.item
			? props.damageSource.computed.items.value.find(item => item?.item.id === id)
			: props.damageSource.computed.abilities.value[sourceAbilityId.value.abilityKey][sourceAbilityId.value.abilityVariantIndex];
	}

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

const computedDescription = computed(() => effects.data[props.abilityId.id].description);

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
		</div>
		<template v-if="precomputedDescription">
			<LolChampionAbilityHoverTooltip
				v-if="sourceAbilityId?.type === ABILITY_TYPE.champion"
				v-show="globalKeyModifiers.shift"
				:precomputed-description="precomputedDescription as IComputedAbilityDescription"
			/>
			<div v-else-if="sourceAbilityId" class="hover-tooltip champion-item">
				<LolItemDescription
					v-show="globalKeyModifiers.shift"
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
		--at-apply: 'flex-col gap-3';

		&:popover-open {
			--at-apply: 'flex';
		}
	}
}
</style>
