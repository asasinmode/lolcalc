import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISett from '@lolcalc/data/files/champion/Sett.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Sett', typeof ISett, 'passive'>()({
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
				RightPunchBonus: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['MissingHealthUnit'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, totalPreMultipliersStats, bonusStats, championPassiveStats }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				};
				const bonusHPRegen = championAbilityVariableValue('TooltipRegenPerMissingHealthCalc', passiveParams);
				const hpUnit = championAbilityVariableValue('MissingHealthUnit', passiveParams);
				if (typeof bonusHPRegen.value === 'number' && typeof hpUnit.value === 'number') {
					const missingHPPercent = Math.min(1, (totalStats.hp - Math.min(totalStats.hp, self.currentHealth.value)) / totalStats.hp);
					const regenPer5 = (missingHPPercent / hpUnit.value) * bonusHPRegen.value;
					championPassiveStats.hpRegen = regenPer5;
					totalPreMultipliersStats.hpRegen += championPassiveStats.hpRegen;
					totalStats.hpRegen += championPassiveStats.hpRegen;
					bonusStats.hpRegen += championPassiveStats.hpRegen;
				} else {
					console.warn('[CHAMPION_SPECIFICS sett] failed to calculate passive hp regen', bonusHPRegen, hpUnit);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Sett,
		},
	},
} satisfies IChampionSpecific<'Sett'>;
