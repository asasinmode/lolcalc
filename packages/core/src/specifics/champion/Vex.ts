import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IVex from '@lolcalc/data/files/champion/Vex.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Vex', typeof IVex, 'passive'>()({
			known: {
				NonChampionDamage: [],
			},
			calculate(self) {
				let NonChampionDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('GloomProcCalc', passiveParams);
				const percentDamage = championAbilityVariableValue('GloomMinionMod', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof percentDamage.value === 'number') {
					NonChampionDamage = baseDamage.value * percentDamage.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS vex] failed to calculate passive non-champion dmg', baseDamage, percentDamage);
				}

				return {
					NonChampionDamage: {
						value: NonChampionDamage,
					},
				};
			},
			meta: {
				FearDuration: {
					type: VariableType.affectedByTenacity,
				},
				GloomProcCalc: {
					type: VariableType.magic,
				},
				NonChampionDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['GloomDuration', 'GloomCDChamp', 'GloomCDNonChamp'],
		}),
	},
} satisfies IChampionSpecific<'Vex'>;
