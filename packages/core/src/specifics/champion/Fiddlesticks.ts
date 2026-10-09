import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IFiddlesticks from '@lolcalc/data/files/champion/Fiddlesticks.json';
import { VariableType } from '@lolcalc/shared';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	q: {
		variables: defineChampionVariables<'Fiddlesticks', typeof IFiddlesticks, 'q'>()({
			known: {
				HealthDamage: [],
				HealthDamageFeared: [],
			},
			calculate(self, target) {
				let HealthDamage = Number.NaN;
				let HealthDamageFeared = Number.NaN;

				const qParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};
				const percentHPDmg = championAbilityVariableValue('TotalPercentHealthDamage', qParams);
				const minDmg = championAbilityVariableValue('MinimumDamage', qParams);
				if (typeof percentHPDmg.value === 'number' && typeof minDmg.value === 'number') {
					HealthDamage = Math.max(minDmg.value, percentHPDmg.value * (target?.stats.value.total.hp ?? 0));
				} else {
					console.warn('[CHAMPION_SPECIFICS fiddlesticks] failed to calculate percent health dmg', percentHPDmg);
				}

				const percentHPDmgFeared = championAbilityVariableValue('TotalPercentHealthDamageFeared', qParams);
				if (typeof percentHPDmgFeared.value === 'number' && typeof minDmg.value === 'number') {
					HealthDamageFeared = Math.max(
						minDmg.value * (self.champion.value as typeof IFiddlesticks).abilities.q.variants[0]!.spellCalculations.TotalPercentHealthDamageFeared.mMultiplier.mNumber,
						percentHPDmgFeared.value * (target?.stats.value.total.hp ?? 0),
					);
				} else {
					console.warn('[CHAMPION_SPECIFICS fiddlesticks] failed to calculate percent health dmg', percentHPDmgFeared);
				}

				return {
					HealthDamage: {
						value: HealthDamage,
					},
					HealthDamageFeared: {
						value: HealthDamageFeared,
					},
				};
			},
			meta: {
				FearDuration: {
					type: VariableType.affectedByTenacity,
				},
				MinimumDamage: {
					type: VariableType.magic,
				},
				HealthDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
				HealthDamageFeared: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['MinimumDamage'],
		}),
	},
} satisfies IChampionSpecific<'Fiddlesticks'>;
