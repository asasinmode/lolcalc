import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type IKayle from '@lolcalc/data/files/champion/Kayle.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Kayle'>): number {
	return (self.champion.value! as typeof IKayle).abilities.passive.variants[0]!.dataValues.EnrageMaxStacks[1]!;
}

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks(self)),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Kayle', typeof IKayle, 'passive'>()({
			known: {
				AttackSpeedPercent: [],
			},
			calculate(self) {
				return {
					AttackSpeedPercent: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent,
					},
				};
			},
			meta: {
				PassiveWaveDamage: {
					type: VariableType.magic,
				},
				AttackSpeedPercent: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['LevelForPassiveRank0', 'LevelForPassiveRank1', 'LevelForPassiveRank2', 'LevelForPassiveRank3', 'MSTowardsEnemy', 'EnrageDuration', 'UpgradedAttackRange', 'FinalAttackRange', 'EnrageTotalASPerStack'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { baseStats, championPassiveStats }) {
				const { LevelForPassiveRank1, LevelForPassiveRank3, UpgradedAttackRange, FinalAttackRange } = (self.champion.value! as typeof IKayle).abilities.passive.variants[0]!.dataValues;

				if (self.level.value >= LevelForPassiveRank3[1]!) {
					championPassiveStats.attackRange = FinalAttackRange[1]! - baseStats.attackRange;
				} else if (self.level.value >= LevelForPassiveRank1[1]!) {
					championPassiveStats.attackRange = UpgradedAttackRange[1]! - baseStats.attackRange;
				}
			},
		},
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const attackSpeedPerStack = championAbilityVariableValue('EnrageTotalASPerStack', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource });
				if (typeof attackSpeedPerStack.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value / 100;
				} else {
					console.warn('[CHAMPION_SPECIFICS kayle] failed to calculate passive attack speed');
				}

				if (self.internalData.value.passiveStacks === passiveMaxStacks(self)) {
					const { MSTowardsEnemy } = (self.champion.value! as typeof IKayle).abilities.passive.variants[0]!.dataValues;
					calculatedVariables.totalBonusPercentMoveSpeed += MSTowardsEnemy[1]!;
				}
			},
		},
	},
} satisfies IChampionSpecific<'Kayle'>;
