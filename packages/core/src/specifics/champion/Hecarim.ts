import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';

import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';

export default {
	calculateHooks: {
		postTotal: {
			handler(self, { bonusStats, championPassiveStats, totalStats, totalMultipliersStats }, { calculatedVariables }) {
				const bonusAd = championAbilityVariableValue('BonusAD', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: {
						level: { value: self.level.value },
						stats: { value: { bonus: bonusStats } },
					} as DamageSource,
				});

				if (typeof bonusAd.value === 'number') {
					championPassiveStats.attackDamage = bonusAd.value;
					const multiplierValue = calculatedVariables.midQuestMultiplier * championPassiveStats.attackDamage;
					totalMultipliersStats.attackDamage += multiplierValue;
					calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + multiplierValue;
					const value = bonusAd.value + multiplierValue;
					bonusStats.attackDamage += value;
					totalStats.attackDamage += value;
				} else {
					console.warn('[CHAMPION_SPECIFICS hecarim] failed to calculate passive attack damage', bonusAd);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Hecarim,
		},
	},
} satisfies IChampionSpecific<'Hecarim'>;
