import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IGaren from '@lolcalc/data/files/champion/Garen.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Garen', typeof IGaren, 'passive'>()({
			known: {
				HPRegen: [],
			},
			calculate(self) {
				return {
					HPRegen: {
						value: self.stats.value.championPassive.hpRegen ?? 0,
					},
				};
			},
			meta: {
				HPRegen: {
					isCustom: true,
					type: VariableType.hpRegen,
				},
			},
			uninteresting: ['DamageTimer'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, totalPreMultipliersStats, bonusStats, championPassiveStats }) {
				if (self.internalData.value.isPassiveActive) {
					const bonusHPRegen = championAbilityVariableValue('RegenCalc', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
					if (typeof bonusHPRegen.value === 'number') {
						const regenPer5 = totalStats.hp * bonusHPRegen.value;
						championPassiveStats.hpRegen = regenPer5;
						totalPreMultipliersStats.hpRegen += championPassiveStats.hpRegen;
						totalStats.hpRegen += championPassiveStats.hpRegen;
						bonusStats.hpRegen += championPassiveStats.hpRegen;
					} else {
						console.warn('[CHAMPION_SPECIFICS garen] failed to calculate passive hp regen', bonusHPRegen);
					}
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Garen,
		},
	},
} satisfies IChampionSpecific<'Garen'>;
