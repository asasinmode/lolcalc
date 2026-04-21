<script setup lang="ts">
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';

const props = defineProps<IExtraComponentProps<'champion'>>();

defineEmits<IExtraComponentEmits>();

const { abilityImage, abilityImageSize } = useChampionImages();

const imgSize = abilityImageSize('Viktor');

const abilityUpgradesMask = computed(() => (props.damageSource as DamageSource<'Viktor'>).internalData.value.passiveAbilityUpgradesMask);

const notAllBasicEvolved = computed(() => {
	const requiredMask = (1 << 3) - 1;
	return (abilityUpgradesMask.value & requiredMask) !== requiredMask;
});

function isEvolved(abilityIndex: number) {
	const bit = 1 << abilityIndex;
	return (abilityUpgradesMask.value & bit) !== 0;
}

function toggle(abilityIndex: number) {
	const bit = 1 << abilityIndex;
	(props.damageSource as DamageSource<'Viktor'>).internalData.value.passiveAbilityUpgradesMask ^= bit;

	if (notAllBasicEvolved.value) {
		(props.damageSource as DamageSource<'Viktor'>).internalData.value.passiveAbilityUpgradesMask &= ~(1 << 3);
	}
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<article class="extras-viktor-passive-ability-upgrades">
		<img
			:src="abilityImage(props.damageSource.champion.value!.abilities.passive.variants[props.damageSource.abilityVariantsIndexes.value.passive]!.image, 'Aphelios')"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event, GameAbilityId.build(ABILITY_TYPE.champion, 'Aphelios', 'passive', 0))"
		>
		<h5>abilities evolved</h5>
		<label
			v-for="(abilityKey, abilityIndex) in ['q', 'w', 'e', 'r'] satisfies IChampionAbilityKey[]"
			:key="abilityKey"
			:for="`${idPrefix}-ability-evolve-${abilityKey}`"
		>
			<input
				:id="`${idPrefix}-ability-evolve-${abilityKey}`"
				type="checkbox"
				:checked="isEvolved(abilityIndex)"
				:disabled="abilityKey === 'r' && notAllBasicEvolved"
				@input="toggle(abilityIndex)"
			>
			{{ abilityKey.toUpperCase() }}
		</label>
	</article>
</template>

<style>
@layer overrides {
	#scoreboard
		> div
		> ul
		> [data-scoreboard-item='Viktor']
		> details
		> [data-extras]
		> .extras-viktor-passive-ability-upgrades {
		--at-apply: 'grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr]';

		> h5 {
			--at-apply: 'col-span-2 mb-0.75';
		}

		> label {
			--at-apply: 'leading-[1]';

			&:has(> input:disabled) {
				--at-apply: 'text-neutral-400';

				> input {
					--at-apply: 'op-60';
				}
			}
		}

		/* > [role='radiogroup'] { */
		/* 	--at-apply: 'grid grid-flow-col grid-cols-[2rem] grid-rows-1 justify-start items-center h-min'; */

		/* 	&::before { */
		/* 		--at-apply: 'block uppercase leading-[1]'; */
		/* 		content: '"' attr(data-ability-key) '": '; */
		/* 		paint-order: stroke fill; */
		/* 		-webkit-text-stroke: black 0.15em; */
		/* 	} */

		/* 	&:nth-of-type(1) { */
		/* 		--at-apply: 'self-end'; */
		/* 	} */
		/* } */
	}
}
</style>
