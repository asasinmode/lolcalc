import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IVolibear from '@lolcalc/data/files/champion/Volibear.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveMaxStacks = (self: DamageSource<'Volibear'>): number => (self.champion.value! as typeof IVolibear).abilities.passive.variants[0]!.dataValues.BounceCounterMax[1]!;

export default {
	setupData(self) {
		const maxStacks: number = passiveMaxStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Volibear', typeof IVolibear, 'passive'>()({
			known: {
				AttackSpeedPercent: [],
			},
			calculate(self) {
				return {
					AttackSpeedPercent: {
						value: self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0,
					},
				};
			},
			meta: {
				ChainLightningDamage: {
					type: VariableType.magic,
				},
				AttackSpeedPercent: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
			},
			uninteresting: ['BuffDuration'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { baseOnLevelStats, championPassiveStats, bonusStats, totalPreMultipliersStats, totalStats }, { debuffs }) {
				const attackSpeedPerStack = championAbilityVariableValue('AttackSpeedCalc', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: {
						level: { value: self.level.value },
						stats: { value: { total: totalStats } },
					} as DamageSource,
				});
				if (typeof attackSpeedPerStack.value === 'number') {
					championPassiveStats.bonusAttackSpeedPercent = self.internalData.value.passiveStacks * attackSpeedPerStack.value;
					championPassiveStats.attackSpeed = championPassiveStats.bonusAttackSpeedPercent * baseOnLevelStats.attackSpeedRatio;
					bonusStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;
					bonusStats.attackSpeed += championPassiveStats.attackSpeed;
					totalPreMultipliersStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;

					const crippleValue = championPassiveStats.attackSpeed * debuffs.cripple;
					const crippledAS = championPassiveStats.attackSpeed - crippleValue;
					debuffs.totalCrippledAttackSpeed += crippleValue;
					totalPreMultipliersStats.attackSpeed += crippledAS;

					totalStats.bonusAttackSpeedPercent += championPassiveStats.bonusAttackSpeedPercent;
					totalStats.attackSpeed += crippledAS;
				} else {
					console.warn('[CHAMPION_SPECIFICS volibear] failed to calculate passive attack speed', attackSpeedPerStack);
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Volibear,
		},
	},
} satisfies IChampionSpecific<'Volibear'>;
