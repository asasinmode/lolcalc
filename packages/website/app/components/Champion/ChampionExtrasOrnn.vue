<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { AbilityType } from '@lolcalc/shared';

const props = defineProps<IExtraComponentProps>();

defineEmits<IExtraComponentEmits>();

const maxUpgradedAllies = computed(() => CHAMPION_SPECIFICS.Ornn.calcMaxUpgradedAllies(props.damageSource));

const SlotIndexComponent = await numberExtra(GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0), 'masterworkItemSlot', 'Masterwork item slot', 1, 6);
const UpgradedAlliesComponent = await numberExtra(GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0), 'passiveUpgradedAllies', 'Allies with masterwork item', 0, maxUpgradedAllies);

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
	[data-scoreboard-item='Ornn'] .v-extras-number {
		&:nth-of-type(-n + 2) {
			> p {
				--at-apply: 'col-start-2 row-start-2 col-span-3 z-1 relative text-center h-9 grid-center -mt-1 whitespace-nowrap bg-black/20 backdrop-blur-2 -mx-1 font-500';
				paint-order: stroke fill;
				-webkit-text-stroke: 0.15em black;
			}

			&:not(:has(> input:disabled)) > p {
				--at-apply: 'hidden';
			}

			> input {
				--at-apply: 'col-start-2 row-start-2';
			}

			> button {
				&:nth-of-type(1) {
					--at-apply: 'col-start-3 row-start-2';
				}

				&:nth-of-type(2) {
					--at-apply: 'col-start-4 row-start-2';
				}
			}
		}
	}
}
</style>
