<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type { IChampionAbilityKey } from '@lolcalc/shared';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_IMAGES } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';

const props = defineProps<IExtraComponentProps>();

defineEmits<IExtraComponentEmits>();

const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

const imgSize = abilityImageSize('Khazix');

const abilityUpgradesMask = computed(() => (props.damageSource as DamageSource<'Khazix'>).internalData.value.rEvolvesMask);

function isEvolved(abilityIndex: number) {
	const bit = 1 << abilityIndex;
	return (abilityUpgradesMask.value & bit) !== 0;
}

function toggle(abilityIndex: number) {
	const bit = 1 << abilityIndex;
	(props.damageSource as DamageSource<'Khazix'>).internalData.value.rEvolvesMask ^= bit;
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<article class="extras-viktor-passive-ability-upgrades">
		<img
			:src="abilityImage(props.damageSource.champion.value!.abilities.r.variants[props.damageSource.abilityVariantsIndexes.value.r]!.image, 'Khazix')"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event, GameAbilityId.build(AbilityType.champion, 'Khazix', 'r', 0))"
		>
		<h5>abilities evolved</h5>
		<label
			v-for="(abilityKey, abilityIndex) in ['q', 'w', 'e', 'r'] satisfies IChampionAbilityKey[]"
			:key="abilityKey"
			:for="`evolve-${abilityKey}-${idSuffix}`"
		>
			<input
				:id="`evolve-${abilityKey}-${idSuffix}`"
				type="checkbox"
				:checked="isEvolved(abilityIndex)"
				@input="toggle(abilityIndex)"
			>
			{{ abilityKey.toUpperCase() }}
		</label>
	</article>
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Khazix'] .extras-viktor-passive-ability-upgrades {
		--at-apply: 'grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr]';

		> h5 {
			--at-apply: 'col-span-2 mb-0.75';
		}

		> label {
			--at-apply: 'leading-none';
		}
	}
}
</style>
