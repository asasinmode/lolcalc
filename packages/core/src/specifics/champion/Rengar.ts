import type IRengar from '@lolcalc/data/files/champion/Rengar.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveMaxStacks = 6;

export default {
	setupData(self) {
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), passiveMaxStacks),
			isPassiveMSActive: clamp(0, Math.round(self.internalData.value.isPassiveMSActive ?? 0), 1),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Rengar', typeof IRengar, 'passive'>()({
			known: {
				BonusADPercent: [],
				BonusAD: [],
			},
			calculate(self) {
				return {
					BonusADPercent: {
						value: self.internalData.value.passiveStacks ** 2,
					},
					BonusAD: {
						value: self.stats.value.championPassive.attackDamage ?? 0,
					},
				};
			},
			meta: {
				BonusADPercent: {
					isCustom: true,
				},
				BonusAD: {
					isCustom: true,
				},
			},
			uninteresting: ['MaxFerocity', 'EmpoweredMSDuration', 'InCombatTimer'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (self.internalData.value.isPassiveMSActive) {
					const bonusMS = championAbilityVariableValue('EmpoweredMS', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: self });
					if (typeof bonusMS.value === 'number') {
						calculatedVariables.totalBonusPercentMoveSpeed += bonusMS.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS rengar] failed to calculate passive empowered ms', bonusMS);
					}
				}
			},
		},
		postTotal: {
			handler(self, { championPassiveStats, dragonStatMultipliers, itemPassivesStats, itemTotalStats, dragonStats, totalStats, bonusStats, totalMultipliersStats }, { calculatedVariables }) {
				const bonusADPercent = self.internalData.value.passiveStacks ** 2 / 100;
				if (!bonusADPercent) {
					return;
				}

				const dragonMult = dragonStatMultipliers?.attackDamage ?? 0;
				const midQuestMult = calculatedVariables.midQuestMultiplier;
				const bloodmailMult = calculatedVariables.bloodmailRetributionPercentage ?? 0;

				const dDragon = dragonMult;
				const dMidQuest = (1 + dragonMult) * midQuestMult;
				const dBloodmail = (1 + midQuestMult) * bloodmailMult;

				const K1 = dDragon + dMidQuest + dBloodmail;
				const denominator = 1 - bonusADPercent * K1;
				const passiveAd = (bonusADPercent * bonusStats.attackDamage) / (denominator > 0 ? denominator : 1);

				championPassiveStats.attackDamage = passiveAd;
				totalMultipliersStats.attackDamage += passiveAd;
				totalStats.attackDamage += passiveAd;
				bonusStats.attackDamage += passiveAd;

				if (midQuestMult) {
					const midQuestDiff = passiveAd * dMidQuest;
					calculatedVariables.midQuestAd = (calculatedVariables.midQuestAd ?? 0) + midQuestDiff;
					totalMultipliersStats.attackDamage += midQuestDiff;
					bonusStats.attackDamage += midQuestDiff;
					totalStats.attackDamage += midQuestDiff;
				}

				if (dragonMult) {
					const dragonDiff = passiveAd * dDragon;
					dragonStats.attackDamage! += dragonDiff;
					totalMultipliersStats.attackDamage += dragonDiff;
					bonusStats.attackDamage += dragonDiff;
					totalStats.attackDamage += dragonDiff;
				}

				if (bloodmailMult) {
					const bloodmailDiff = passiveAd * dBloodmail;
					calculatedVariables.bloodmailRetribution! += bloodmailDiff;
					itemPassivesStats.attackDamage += bloodmailDiff;
					itemTotalStats.attackDamage += bloodmailDiff;
					totalMultipliersStats.attackDamage += bloodmailDiff;
					bonusStats.attackDamage += bloodmailDiff;
					totalStats.attackDamage += bloodmailDiff;
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Rengar,
		},
	},
} satisfies IChampionSpecific<'Rengar'>;
