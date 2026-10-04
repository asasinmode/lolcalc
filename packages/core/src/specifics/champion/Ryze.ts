import type { DetectChampionVariables } from '@lolcalc/core/types.js';
import type IRyze from '@lolcalc/data/files/champion/Ryze.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Ryze', typeof IRyze, 'passive'>()({
			known: {
				PassiveMana: [],
			},
			calculate(self) {
				return {
					PassiveMana: {
						value: self.stats.value.variables.ryzePMana ?? 0,
					},
				};
			},
			meta: {
				PassiveMana: {
					isCustom: true,
				},
			},
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, bonusStats, itemPassivesStats, itemTotalStats, championPassiveStats, dragonStats, dragonStatMultipliers }, { calculatedVariables }) {
				const apToMana = championAbilityVariableValue(
							'PercentManaIncrease' satisfies DetectChampionVariables<typeof IRyze, 'passive'>,
							{
								abilityKey: 'passive',
								abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
								allAbilitiesVariants: self.allAbilityVariants.value,
								damageSource: self,
							},
				);

				if (typeof apToMana.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS ryze] failed to resolve PercentManaIncrease variable', apToMana);
					return;
				}

				const seraphManaToAp = calculatedVariables.archangelSeraphManaToAp ?? 0;
				const approachFimbulManaToHp = calculatedVariables.approachFimbulManaToHp ?? 0;
				const riftmakerBonusHPToAP = calculatedVariables.riftmakerBonusHPToAP ?? 0;

				const totalApMultiplier = (calculatedVariables.totalItemApMultipliers ?? 1)
					+ (dragonStatMultipliers?.abilityPower ?? 0)
					+ (calculatedVariables.midQuestMultiplier ?? 0);

				const effectiveManaToAp = seraphManaToAp + (approachFimbulManaToHp * riftmakerBonusHPToAP);

				const apToManaRatio = apToMana.value / 10_000;
				const loopDivisor = 1 - (totalStats.mana * apToManaRatio * effectiveManaToAp * totalApMultiplier);

				calculatedVariables.ryzePassivePercentManaIncrease = totalStats.abilityPower / loopDivisor * apToManaRatio;
				const passiveMana = totalStats.mana * calculatedVariables.ryzePassivePercentManaIncrease;
				calculatedVariables.ryzePMana = passiveMana;

				const passiveHp = passiveMana * approachFimbulManaToHp;
				const basePassiveAp = (passiveMana * seraphManaToAp) + (passiveHp * riftmakerBonusHPToAP);
				let passiveAd = passiveMana * (calculatedVariables.manaMuraManaToAd ?? 0);

				totalStats.mana += passiveMana;
				bonusStats.mana += passiveMana;
				championPassiveStats.mana = passiveMana;

				if (passiveHp > 0) {
					championPassiveStats.hp = passiveHp;
					totalStats.hp += passiveHp;
					bonusStats.hp += passiveHp;

					calculatedVariables.approachFimbulAwe = (calculatedVariables.approachFimbulAwe ?? 0) + passiveHp;
				}

				if (passiveAd) {
					const dragonAd = passiveAd * dragonStatMultipliers.attackDamage;
					dragonStats.attackDamage = (dragonStats.attackDamage ?? 0) + dragonAd;
					passiveAd += dragonAd;

					if (calculatedVariables.midQuestMultiplier) {
						const midQuestAd = passiveAd * calculatedVariables.midQuestMultiplier;
						calculatedVariables.midQuestAd! += midQuestAd;
						passiveAd += midQuestAd;
					}

					championPassiveStats.attackDamage = passiveAd;
					totalStats.attackDamage += passiveAd;
					bonusStats.attackDamage += passiveAd;

					if (calculatedVariables.manaMuraManaToAd) {
						calculatedVariables.manaMuraAwe! += passiveMana * calculatedVariables.manaMuraManaToAd;
					}
					if (calculatedVariables.bloodmailTyrannyBonusHpToAd) {
						calculatedVariables.bloodmailTyranny! += passiveHp * calculatedVariables.bloodmailTyrannyBonusHpToAd;
					}
				}

				if (basePassiveAp > 0) {
					const multipliedPassiveAp = basePassiveAp * totalApMultiplier;

					totalStats.abilityPower += multipliedPassiveAp;
					bonusStats.abilityPower += multipliedPassiveAp;
					championPassiveStats.abilityPower = multipliedPassiveAp;

					calculatedVariables.apMultipliersBase += basePassiveAp;

					if (seraphManaToAp > 0) {
						const seraphBaseAp = passiveMana * seraphManaToAp;
						calculatedVariables.archangelSeraphAwe = (calculatedVariables.archangelSeraphAwe ?? 0) + seraphBaseAp;
						itemPassivesStats.abilityPower += seraphBaseAp;
						itemTotalStats.abilityPower += seraphBaseAp;
					}

					if (riftmakerBonusHPToAP > 0) {
						const riftmakerBaseAp = passiveHp * riftmakerBonusHPToAP;
						calculatedVariables.riftmakerVoidInfusion = (calculatedVariables.riftmakerVoidInfusion ?? 0) + riftmakerBaseAp;
						itemPassivesStats.abilityPower += riftmakerBaseAp;
						itemTotalStats.abilityPower += riftmakerBaseAp;
					}

					if (calculatedVariables.rabadonApMultiplier) {
						const rabadonBonusAp = basePassiveAp * calculatedVariables.rabadonApMultiplier;
						calculatedVariables.rabadonMagicalOpus = (calculatedVariables.rabadonMagicalOpus ?? 0) + rabadonBonusAp;
						itemPassivesStats.abilityPower += rabadonBonusAp;
						itemTotalStats.abilityPower += rabadonBonusAp;
					}

					if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
						const bBlazeBonusAp = basePassiveAp * calculatedVariables.blackfireTorchBBlazeMultiplier;
						calculatedVariables.blackfireTorchBBlazeAP = (calculatedVariables.blackfireTorchBBlazeAP ?? 0) + bBlazeBonusAp;
						itemPassivesStats.abilityPower += bBlazeBonusAp;
						itemTotalStats.abilityPower += bBlazeBonusAp;
					}
					if (calculatedVariables.midQuestMultiplier) {
						calculatedVariables.midQuestAp! += basePassiveAp * calculatedVariables.midQuestMultiplier;
					}
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Ryze,
		},
	},
} satisfies IChampionSpecific<'Ryze'>;
