import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IGaren from '@lolcalc/data/files/champion/Garen.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
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
	e: {
		variables: defineChampionVariables<'Garen', typeof IGaren, 'e'>()({
			known: {
				f1: [],
				NearestTickDamage: [],
			},
			calculate(self) {
				let DamageTicks = Number.NaN;
				let NearestTickDamage = Number.NaN;

				const eParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'e', abilityVariant: self.champion.value!.abilities.e.variants[0]!, damageSource: self };
				const baseTicks = championAbilityVariableValue('NumTicks', eParams);
				const asPerTick = championAbilityVariableValue('ASPerTick', eParams);
				if (typeof baseTicks.value === 'number' && typeof asPerTick.value === 'number') {
					DamageTicks = baseTicks.value + Math.max(0, Math.floor(self.stats.value.total.bonusAttackSpeedPercent / asPerTick.value));
				} else {
					console.warn('[CHAMPION_SPECIFICS garen] failed to calculate e ticks vars', baseTicks, asPerTick);
				}

				const baseTickDamage = championAbilityVariableValue('TotalDamage', eParams);
				const nearestBonus = championAbilityVariableValue('NearestEnemyBonus', eParams);
				if (typeof baseTickDamage.value === 'number' && typeof nearestBonus.value === 'number') {
					NearestTickDamage = baseTickDamage.value * (1 + nearestBonus.value);
				} else {
					console.warn('[CHAMPION_SPECIFICS garen] failed to calculate e ticks vars', baseTicks, asPerTick);
				}

				return {
					f1: {
						value: DamageTicks,
					},
					NearestTickDamage: {
						value: NearestTickDamage,
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.physical,
					displayedName: 'TickDamage',
				},
				CriticalDamage: {
					type: VariableType.physical,
				},
				NearestTickDamage: {
					type: VariableType.physical,
					isCustom: true,
				},
				f1: {
					displayedName: 'DamageTicks',
				},
			},
			uninteresting: ['Duration', 'NearestEnemyBonus', 'StacksToShred', 'ShredDuration', 'ASPerTick', 'ShredAmount'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, totalPreMultipliersStats, bonusStats, championPassiveStats }) {
				if (self.internalData.value.isPassiveActive) {
					const bonusHPRegen = championAbilityVariableValue('RegenCalc', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});
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
