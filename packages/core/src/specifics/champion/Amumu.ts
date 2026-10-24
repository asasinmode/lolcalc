import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IAmumu from '@lolcalc/data/files/champion/Amumu.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			applyPassive: clamp(0, Math.round(self.internalData.value.applyPassive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Amumu', typeof IAmumu, 'passive'>()({
			uninteresting: ['DebuffDuration', 'DamageAmp'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Amumu', typeof IAmumu, 'q'>()({
			meta: {
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				TotalDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Amumu', typeof IAmumu, 'w'>()({
			known: {
				TotalDamage: [],
			},
			calculate(self, target) {
				let TotalDamage = Number.NaN;

				const wParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'w',
					abilityVariant: self.champion.value!.abilities.w.variants[0]!,
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('BaseDamage', wParams);
				const maxHealthPercent = championAbilityVariableValue('TotalHealthDamage', wParams);
				if (typeof baseDamage.value === 'number' && typeof maxHealthPercent.value === 'number') {
					TotalDamage = baseDamage.value + (target?.stats.value.total.hp ?? 0) * maxHealthPercent.value * 0.01;
				} else {
					console.warn('[CHAMPION_SPECIFICS amumu] failed to calculate w total damage', baseDamage, maxHealthPercent);
				}

				return {
					TotalDamage: {
						value: TotalDamage,
					},
				};
			},
			meta: {
				BaseDamage: {
					type: VariableType.magic,
				},
				TotalDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
		}),
	},
	e: {
		variables: defineChampionVariables<'Amumu', typeof IAmumu, 'e'>()({
			meta: {
				TantrumDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['CDROnHit', 'FlatDamageReductionMax'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Amumu', typeof IAmumu, 'r'>()({
			meta: {
				RCalculatedDamage: {
					type: VariableType.magic,
				},
				RDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Amumu'>;
