import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IKSante from '@lolcalc/data/files/champion/KSante.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'KSante', typeof IKSante, 'passive'>()({
			known: {
				MarkDamage: [],
				AllOutDamage: [],
			},
			calculate(self, target) {
				let MarkDamage = Number.NaN;
				let AllOutDamage = Number.NaN;

				const targetTotalHp = target?.stats.value.total.hp ?? 0;
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				const markFlatVar = championAbilityVariableValue('FlatDamage', passiveParams);
				const markDamagePercentVar = championAbilityVariableValue('PercentHealthDamage', passiveParams);
				if (typeof markFlatVar.value === 'number' && typeof markDamagePercentVar.value === 'number') {
					MarkDamage = markFlatVar.value + targetTotalHp * markDamagePercentVar.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ksante] failed to calculate passive mark dmg vars', markFlatVar, markDamagePercentVar);
				}

				const allOutDamagePercentVar = championAbilityVariableValue('MaxHealthDamagePercent', passiveParams);
				if (typeof allOutDamagePercentVar.value === 'number') {
					AllOutDamage = targetTotalHp * allOutDamagePercentVar.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ksante] failed to calculate passive all out var', allOutDamagePercentVar);
				}

				return {
					MarkDamage: {
						value: MarkDamage,
					},
					AllOutDamage: {
						value: AllOutDamage,
					},
				};
			},
			meta: {
				MarkDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
				AllOutDamage: {
					isCustom: true,
					type: VariableType.physical,
				},
			},
			uninteresting: ['FlatDamage'],
		}),
	},
	q: {
		dataOverrides: {
			isImmobilizing: false,
		},
		variables: defineChampionVariables<'KSante', typeof IKSante, 'q'>()({
			known: {
				f2: [],
			},
			calculate(self) {
				let resistsCap = Number.POSITIVE_INFINITY;

				const defenseCap = championAbilityVariableValue('DefenseCapforCooldown', {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				});
				if (typeof defenseCap.value === 'number') {
					resistsCap = defenseCap.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS ksante] failed to calculate q resists cap', defenseCap);
				}

				return {
					f2: {
						/* checked and is affected by shred - cd and the number go down when ksante loses resists */
						value: Math.min(resistsCap, self.stats.value.bonus.armor + self.stats.value.bonus.magicResist),
					},
				};
			},
			meta: {
				BaseDamage: {
					type: VariableType.physical,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				f2: {
					displayedName: 'CurrentResists',
				},
			},
			uninteresting: ['RecastWindow', 'RCooldownReduction', 'DefenseCapforCooldown'],
		}),
	},
} satisfies IChampionSpecific<'KSante'>;
