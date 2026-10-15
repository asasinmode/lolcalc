import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ITristana from '@lolcalc/data/files/champion/Tristana.json';
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
		variables: defineChampionVariables<'Tristana', typeof ITristana, 'q'>()({
			uninteresting: ['BuffDuration'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				const attackRange = championAbilityVariableValue('BonusPassiveRange', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});
				if (typeof attackRange.value === 'number') {
					championPassiveStats.attackRange = attackRange.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS tristana] failed to calculate passive attack range', attackRange);
				}
			},
		},
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isQActive) {
					const as = championAbilityVariableValue('AttackSpeedMod', {
						abilityKey: 'q',
						abilityVariant: self.champion.value!.abilities.q.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						abilityLevel: self.abilityLevels.value.q,
					});
					if (typeof as.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = as.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS tristana] failed to calculate q as', as);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Tristana'>;
