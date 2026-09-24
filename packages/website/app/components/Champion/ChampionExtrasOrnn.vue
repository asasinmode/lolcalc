<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { AbilityType } from '@lolcalc/shared';

const props = defineProps<IExtraComponentProps>();

defineEmits<IExtraComponentEmits>();

const maxUpgradedAllies = computed(() => CHAMPION_SPECIFICS.Ornn.calcMaxUpgradedAllies(props.damageSource));

const SlotIndexComponent = await enumExtra(GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0), 'masterworkItemSlot', 'Masterwork item slot', [
	[-1, '-1 (no amp, no masterwork item)'],
	[0, '0 (+amp but no masterwork item)'],
	[1, '1'],
	[2, '2'],
	[3, '3'],
	[4, '4'],
	[5, '5'],
	[6, '6'],
]);
const UpgradedAlliesComponent = await enumExtra(
	GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0),
	'passiveUpgradedAllies',
	'Allies with masterwork item',
	computed(() => Array.from({ length: maxUpgradedAllies.value + 1 }, (_, i) => [i, i])),
);

const masterworkLevel = (props.damageSource as DamageSource<'Ornn'>).internalData.value._masterworkLevel;
</script>

<template>
	<SlotIndexComponent v-bind="$props" :disabled="damageSource.level.value < masterworkLevel">
		<p>
			needs level {{ masterworkLevel }}+
		</p>
	</SlotIndexComponent>
	<UpgradedAlliesComponent v-bind="$props" :disabled="damageSource.level.value < (masterworkLevel + 1)">
		<p>
			needs level {{ masterworkLevel + 1 }}+
		</p>
	</UpgradedAlliesComponent>
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Ornn'] .extras > :nth-child(-n + 2) {
		> p {
			--at-apply: 'col-start-2 row-start-2 col-span-3 z-1 relative text-center h-9 grid-center -mt-1 whitespace-nowrap bg-black/20 backdrop-blur-2 -mx-1 font-500';
			paint-order: stroke fill;
			-webkit-text-stroke: 0.15em black;
		}

		&:not(:has(> input:disabled), :has(> select:disabled)) > p {
			--at-apply: 'hidden';
		}

		> select {
			--at-apply: 'col-start-2 row-start-2';
		}
	}
}
</style>
