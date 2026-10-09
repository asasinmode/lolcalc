import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IMonkeyKing from '@lolcalc/data/files/champion/MonkeyKing.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveMaxStacks = (self: DamageSource<'MonkeyKing'>): number => (self.champion.value! as typeof IMonkeyKing).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!;

export default {
	setupData(self) {
		const maxStacks: number = passiveMaxStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'MonkeyKing', typeof IMonkeyKing, 'passive'>()({
			known: {
				CalculatedBonusArmor: [],
				HPRegenPer5: [],
			},
			calculate(self) {
				return {
					CalculatedBonusArmor: {
						value: self.stats.value.championPassive.armor ?? 0,
					},
					HPRegenPer5: {
						value: self.stats.value.championPassive.hpRegen ?? 0,
					},
				};
			},
			meta: {
				CalculatedBonusArmor: {
					isCustom: true,
					displayedName: 'Armor',
				},
				BonusArmor: {
					displayedName: 'ArmorPerStack',
				},
				HPRegenPer5: {
					isCustom: true,
					type: VariableType.hpRegen,
				},
			},
			uninteresting: ['StackMultiplier', 'StackDuration', 'MaxStacks', 'HealthPercentPer5'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const bonusArmor = championAbilityVariableValue('BonusArmor', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});
				if (typeof bonusArmor.value === 'number') {
					championPassiveStats.armor = (self.internalData.value.passiveStacks + 1) * bonusArmor.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS wukong] failed to calculate passive armor', bonusArmor);
				}
			},
		},
		postTotal: {
			handler(self, { totalStats, totalPreMultipliersStats, bonusStats, championPassiveStats }) {
				const bonusHPRegen = championAbilityVariableValue('HealthPercentPer5', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});
				if (typeof bonusHPRegen.value === 'number') {
					const regenPer5 = totalStats.hp * (self.internalData.value.passiveStacks + 1) * bonusHPRegen.value;
					championPassiveStats.hpRegen = regenPer5;
					totalPreMultipliersStats.hpRegen += championPassiveStats.hpRegen;
					totalStats.hpRegen += championPassiveStats.hpRegen;
					bonusStats.hpRegen += championPassiveStats.hpRegen;
				} else {
					console.warn('[CHAMPION_SPECIFICS wukong] failed to calculate passive hp regen', bonusHPRegen);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.MonkeyKing,
		},
	},
} satisfies IChampionSpecific<'MonkeyKing'>;
