import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ITrundle from '@lolcalc/data/files/champion/Trundle.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isQActive: clamp(0, Math.round(self.internalData.value.isQActive ?? 0), 1),
		};
	},
	q: {
		variables: defineChampionVariables<'Trundle', typeof ITrundle, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
			},
			uninteresting: ['BonusRange', 'SapDebuffDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isQActive) {
					const ad = championAbilityVariableValue('BonusAD', {
						abilityKey: 'q',
						abilityVariant: self.champion.value!.abilities.q.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						abilityLevel: self.abilityLevels.value.q,
					});
					if (typeof ad.value === 'number') {
						championPassiveStats.attackDamage = ad.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS trundle] failed to calculate q ad', ad);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Trundle'>;
