import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IMilio from '@lolcalc/data/files/champion/Milio.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Milio', typeof IMilio, 'passive'>()({
			known: {
				TotalDamage: [],
			},
			calculate(self, target) {
				let TotalDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const adRatio = championAbilityVariableValue('ADBurstRatio', passiveParams);
				const burn = championAbilityVariableValue('BurnDamage', passiveParams);
				if (typeof adRatio.value === 'number' && typeof burn.value === 'number') {
					TotalDamage = burn.value + adRatio.value * 0;
				} else {
					console.warn('[CHAMPION_SPECIFICS milio] failed to calculate passive burn', adRatio, burn);
				}

				return {
					TotalDamage: {
						value: TotalDamage,
					},
				};
			},
			meta: {
				BurnDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
			uninteresting: ['BurnDuration'],
		}),
	},
} satisfies IChampionSpecific<'Milio'>;
