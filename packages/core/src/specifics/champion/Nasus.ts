import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type INasus from '@lolcalc/data/files/champion/Nasus.json';
import type { IChampion } from '@lolcalc/data/types.js';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

function wCalculateMS(champion: IChampion, progress: number, wLevel: number): number {
	const wParams: IGameVariableValueParameters['championAbility'] = {
		abilityKey: 'w',
		abilityVariant: champion.abilities.w.variants[0]!,
		abilityLevel: wLevel,
	};
	const minMSSlow = championAbilityVariableValue('SlowBase', wParams);
	const maxMSSlow = championAbilityVariableValue('MaxSlowTooltipOnly', wParams);

	if (typeof minMSSlow.value === 'number' && typeof maxMSSlow.value === 'number') {
		return progress === 1
			? minMSSlow.value
			: progress
				? (minMSSlow.value + (maxMSSlow.value - minMSSlow.value) * progress / 100)
				: 0;
	}

	console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate W ms/as slow values', minMSSlow, maxMSSlow);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			wProgress: clamp(0, Math.round(self.internalData.value.wProgress ?? 0), 100),
		};
	},
	w: {
		derivedSlow: ((progress, self) => {
			return self?.effectsOntoTargetVars.value.nasusWSlow ?? wCalculateMS(self.champion.value!, progress, self.abilityLevels.value.w);
		}) satisfies IDeriveProgressFn,
		calculateSlow: wCalculateMS,
		variables: defineChampionVariables<'Nasus', typeof INasus, 'w'>()({
			known: {
				AttackSpeedSlow: [],
				MoveSpeedSlow: [],
			},
			calculate(self) {
				return {
					MoveSpeedSlow: {
						value: self.effectsOntoTargetVars.value.nasusWSlow ?? 0,
					},
					AttackSpeedSlow: {
						value: self.effectsOntoTargetVars.value.nasusWCripple ?? 0,
					},
				};
			},
			meta: {
				MaxSlowTooltipOnly: {
					type: VariableType.affectedBySlowResist,
				},
				MoveSpeedSlow: {
					isCustom: true,
					resultsIsPercentage: true,
					type: VariableType.affectedBySlowResist,
				},
				AttackSpeedSlow: {
					isCustom: true,
					resultsIsPercentage: true,
				},
				Duration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['SlowBase', 'AttackSpeedSlowMult'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const lifeSteal = championAbilityVariableValue('LifestealTooltip', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});

				if (typeof lifeSteal.value === 'number') {
					championPassiveStats.lifeSteal = lifeSteal.value / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate passive life steal', lifeSteal);
				}
			},
		},
	},
	effectOntoTargetVars(self, vars) {
		vars.nasusWSlow = wCalculateMS(self.champion.value!, self.internalData.value.wProgress, self.abilityLevels.value.w);
		const msToASSlowRatio = championAbilityVariableValue('AttackSpeedSlowMult', {
			abilityKey: 'w',
			abilityVariant: self.champion.value!.abilities.w.variants[0]!,
			abilityLevel: self.abilityLevels.value.w,
		});
		if (typeof msToASSlowRatio.value === 'number') {
			vars.nasusWCripple = vars.nasusWSlow * msToASSlowRatio.value;
		} else {
			console.warn('[CHAMPION_SPECIFICS nasus] failed to calculate W ms to as slow ratio', msToASSlowRatio);
		}
	},
} satisfies IChampionSpecific<'Nasus'>;
