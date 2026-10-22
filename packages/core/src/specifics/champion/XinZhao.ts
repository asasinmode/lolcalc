import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IXinZhao from '@lolcalc/data/files/champion/XinZhao.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

function calculateEBonusAS(self: DamageSource): number {
	let rv = Number.NaN;

	const eParams: IGameVariableValueParameters['championAbility'] = {
		abilityKey: 'e',
		abilityVariant: self.champion.value!.abilities.e.variants[0]!,
		damageSource: self,
	};
	const baseAS = championAbilityVariableValue('ASMod', eParams);
	const asPerBonusPercent = championAbilityVariableValue('PermanentASToASRatio', eParams);
	const apPerAS = championAbilityVariableValue('APToASRatio', eParams);
	if (typeof baseAS.value === 'number' && typeof asPerBonusPercent.value === 'number' && typeof apPerAS.value === 'number') {
		rv =
			baseAS.value +
			(self.stats.value.bonus.bonusAttackSpeedPercent - self.stats.value.effect.bonusAttackSpeedPercent - (self.stats.value.championPassive.bonusAttackSpeedPercent ?? 0)) / asPerBonusPercent.value +
			apPerAS.value * self.stats.value.total.abilityPower;
	} else {
		console.warn('[CHAMPION_SPECIFICS xin zhao] failed to calculate E as vars', { baseAS, asPerBonusPercent, apPerAS });
	}

	return rv;
}

export default {
	setupData(self) {
		return {
			isEASActive: clamp(0, Math.round(self.internalData.value.isEASActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'XinZhao', typeof IXinZhao, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.physical,
				},
				TotalHealing: {
					type: VariableType.heal,
				},
			},
		}),
	},
	e: {
		variables: defineChampionVariables<'XinZhao', typeof IXinZhao, 'e'>()({
			known: {
				f1: [],
			},
			calculate(self) {
				return {
					f1: {
						value: calculateEBonusAS(self),
					},
				};
			},
			meta: {
				f1: {
					displayedName: 'BonusAS',
					multiplier: 100,
				},
				ChargeDamage: {
					type: VariableType.magic,
				},
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['ASDuration', 'PermanentASToASRatio', 'APToASRatio'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { baseOnLevelStats, championPassiveStats, bonusStats, effectStats, totalPreMultipliersStats, totalStats }, { debuffs }) {
				if (!self.internalData.value.isEASActive) return;

				const as = calculateEBonusAS({
					champion: self.champion,
					stats: {
						value: {
							bonus: { bonusAttackSpeedPercent: bonusStats.bonusAttackSpeedPercent },
							effect: { bonusAttackSpeedPercent: effectStats.bonusAttackSpeedPercent },
							total: { abilityPower: totalStats.abilityPower },
							championPassive: championPassiveStats,
						},
					},
					abilityLevels: self.abilityLevels,
				} as DamageSource);
				if (!Number.isNaN(as)) {
					championPassiveStats.bonusAttackSpeedPercent = as;
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
				}
			},
			priority: HOOK_PRIORITIES.postTotal.XinZhao,
		},
	},
} satisfies IChampionSpecific<'XinZhao'>;
