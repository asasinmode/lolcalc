import type { ICalculateChampionStatsHookSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type { IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey } from '@lolcalc/shared';

import type { DetectChampionVariables } from '../../types.ts';
import type { IDefineVariablesConfig, IExtractExtraVariables, ISpecificVariables } from '../index.ts';
import { defineVariables } from '../index.ts';

/** wrapper around `defineVariables` for types on champion specific's variables */
export function defineChampionVariables<Id extends IChampionId, T = never, AbilityKey extends IChampionAbilityKey = IChampionAbilityKey, DetectedVariables extends string = DetectChampionVariables<T, AbilityKey>>() {
	return function <Config extends IDefineVariablesConfig<Id, 'championAbility', DetectedVariables> = IDefineVariablesConfig<Id, 'championAbility', DetectedVariables>>(
		config: Config & Omit<ISpecificVariables<DetectedVariables, IExtractExtraVariables<Config, DetectedVariables>, Id, 'championAbility'>, 'default'>,
	): ISpecificVariables<DetectedVariables, IExtractExtraVariables<Config, DetectedVariables>, Id, 'championAbility'> {
		return defineVariables<DetectedVariables, Id, 'championAbility', Config>(config as any);
	};
}

export function cooldownReductionPercentageFromHaste(haste: number): number {
	return (haste / (haste + 100)) * 100;
}

export function windBrotherCalculateHooks(id: 'Yasuo' | 'Yone'): ICalculateChampionStatsHookSource {
	return {
		postInit: {
			handler(self, _stats, { calculatedVariables }) {
				const critDamageMod = championAbilityVariableValue('CritDamageMod', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof critDamageMod.value === 'number') {
					calculatedVariables.critMultiplierMod = critDamageMod.value;
				} else {
					console.warn(`[CHAMPION_SPECIFICS ${id}] failed to calculate passive crit multiplier`, critDamageMod);
				}
			},
		},
		onTotalPreMultipliers: {
			handler(self, { bonusStats, championPassiveStats, totalPreMultipliersStats }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				const critMultiplier = championAbilityVariableValue('CritChanceMultiplier', passiveParams);
				if (typeof critMultiplier.value === 'number') {
					championPassiveStats.critChance = bonusStats.critChance * critMultiplier.value;
					bonusStats.critChance += championPassiveStats.critChance;
					totalPreMultipliersStats.critChance += championPassiveStats.critChance;
				} else {
					console.warn(`[CHAMPION_SPECIFICS ${id}] failed to calculate passive crit multiplier`, critMultiplier);
				}

				const critToAD = championAbilityVariableValue(`${id}CritToAD`, passiveParams);
				if (typeof critToAD.value === 'number') {
					championPassiveStats.attackDamage = Math.max(0, bonusStats.critChance - 1) * critToAD.value;
					bonusStats.attackDamage += championPassiveStats.attackDamage;
					totalPreMultipliersStats.attackDamage += championPassiveStats.attackDamage;
				} else {
					console.warn(`[CHAMPION_SPECIFICS ${id}] failed to calculate passive crit to ad`, critToAD);
				}
			},
		},
	};
}
