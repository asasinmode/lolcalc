import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IDarius from '@lolcalc/data/files/champion/Darius.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isChampionAtMaxBleed: clamp(0, Math.round(self.internalData.value.isChampionAtMaxBleed ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Darius', typeof IDarius, 'passive'>()({
			meta: {
				BleedDamagePerStack: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['BleedDuration', 'MaxStacks', 'MonsterMod'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				if (!self.internalData.value.isChampionAtMaxBleed) {
					return;
				}

				const passiveAd = championAbilityVariableValue('NoxianMightBonusAD', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof passiveAd.value === 'number') {
					championPassiveStats.attackDamage = passiveAd.value;
					if (calculatedVariables.midQuestMultiplier) {
						calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + championPassiveStats.attackDamage * calculatedVariables.midQuestMultiplier;
					}
				} else {
					console.warn('[CHAMPION_SPECIFICS darius] failed to calculate passive ad');
				}
			},
		},
	},
} satisfies IChampionSpecific<'Darius'>;
