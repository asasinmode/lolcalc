import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IZaahen from '@lolcalc/data/files/champion/Zaahen.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveMaxStacks = (self: DamageSource<'Zaahen'>): number => (self.champion.value! as typeof IZaahen).abilities.passive.variants[0]!.dataValues.MaxStacks[1]!;

export default {
	setupData(self) {
		const maxStacks: number = passiveMaxStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxStacks),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Zaahen', typeof IZaahen, 'passive'>()({
			known: {
				BonusADPercent: [],
				BonusAD: [],
			},
			calculate(self) {
				return {
					BonusADPercent: {
						value: self.stats.value.variables.zaahenPassiveAdMultiplier ?? 0,
					},
					BonusAD: {
						value: self.stats.value.championPassive.attackDamage ?? 0,
					},
				};
			},
			meta: {
				BonusADPercent: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				BonusAD: {
					isCustom: true,
				},
			},
			uninteresting: ['MaxStacks', 'ReviveDuration'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalPreMultipliersStats, totalMultipliersStats, championPassiveStats, bonusStats, totalStats, dragonStats }, { calculatedVariables }) {
				const { passiveStacks } = self.internalData.value;
				if (!passiveStacks) {
					return;
				}

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const adPercentPerStack = championAbilityVariableValue('PercentBonusADCalc', passiveParams);
				const maxStacksMult = championAbilityVariableValue('MaxStacksMultiplier', passiveParams);
				if (typeof adPercentPerStack.value !== 'number' || typeof maxStacksMult.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS zaahen] failed to calculate passive ad per stack', adPercentPerStack, maxStacksMult);
					return;
				}

				const maxStacks = passiveMaxStacks(self);
				const bonusADPercent = passiveStacks * adPercentPerStack.value * (passiveStacks === maxStacks ? maxStacksMult.value : 1);
				calculatedVariables.zaahenPassiveAdMultiplier = bonusADPercent;

				const passiveAd = totalPreMultipliersStats.attackDamage * bonusADPercent;

				if (calculatedVariables.midQuestMultiplier) {
					const preMultiplierBonusAd = bonusStats.attackDamage - (dragonStats.attackDamage ?? 0) - calculatedVariables.midQuestAd!;
					const midQuestAd = preMultiplierBonusAd * calculatedVariables.midQuestMultiplier * bonusADPercent;

					calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + midQuestAd;
					totalMultipliersStats.attackDamage += midQuestAd;
					totalStats.attackDamage += midQuestAd;
					bonusStats.attackDamage += midQuestAd;
					calculatedVariables.bloodmailRetributionExcludedAd = (calculatedVariables.bloodmailRetributionExcludedAd ?? 0) + midQuestAd;
				}

				championPassiveStats.attackDamage = passiveAd;
				totalMultipliersStats.attackDamage += passiveAd;
				totalStats.attackDamage += passiveAd;
				bonusStats.attackDamage += passiveAd;

				calculatedVariables.bloodmailRetributionExcludedAd += passiveAd;
			},
			priority: HOOK_PRIORITIES.postTotal.Zaahen,
		},
	},
} satisfies IChampionSpecific<'Zaahen'>;
