import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IVladimir from '@lolcalc/data/files/champion/Vladimir.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	q: {
		variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'q'>()({
			known: {
				EmpoweredHeal: [],
			},
			calculate(self) {
				const qParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'q',
					abilityVariant: self.champion.value!.abilities.q.variants[0]!,
					damageSource: self,
				};
				const baseHeal = championAbilityVariableValue('EmpoweredHealTooltip', qParams);
				const percentMissing = championAbilityVariableValue('EmpoweredHealPercentTooltip', qParams);
				const missingHealth = Math.max(0, self.stats.value.total.hp - self.currentHealth.value);
				let EmpoweredHeal = 0;
				if (typeof baseHeal.value === 'number' && typeof percentMissing.value === 'number') {
					EmpoweredHeal = baseHeal.value + missingHealth * percentMissing.value;
				}
				return {
					EmpoweredHeal: {
						value: EmpoweredHeal,
					},
				};
			},
			meta: {
				EmpoweredHeal: {
					type: VariableType.heal,
					isCustom: true,
				},
				BaseDamageTooltip: {
					type: VariableType.magic,
				},
				BaseHeal: {
					type: VariableType.heal,
				},
				EmpoweredDamageTooltip: {
					type: VariableType.magic,
				},
				EmpoweredHealTooltip: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['FrenzyDuration'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'w'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				TotalHeal: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['HasteBoost', 'HasteDuration', 'MoveSpeedMod', 'MinionHealingMod'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'e'>()({
			meta: {
				MinDamageTooltip: {
					type: VariableType.magic,
				},
				MaxDamageTooltip: {
					type: VariableType.magic,
				},
				SlowPercent: {
					type: VariableType.affectedBySlowResist,
				},
			},
			uninteresting: ['MaxChannelTime'],
		}),
	},
	r: {
		/** Vladimir's ult uses the same `@Damage@` for both ult's damage and heal (and they are the same value) but in the calculator they need to be 2 separate variables, one being magic damage, the other heal */
		preplaceTooltipText(value) {
			return value.replace('<healing>@Damage@', '<healing>@Heal@');
		},
		modifyVariantData(abilityVariant) {
			if (abilityVariant.abilityLevelVars) {
				const damageVariable = abilityVariant.abilityLevelVars[0];
				if (damageVariable?.name !== 'BaseDamage') {
					console.warn('[CHAMPION_SPECIFICS vladimir r] failed to modify ability level vars, no base damage variable', abilityVariant.abilityLevelVars);
					return;
				}
				abilityVariant.abilityLevelVars.push({
					name: damageVariable.name,
					nameOverride: 'spell_listtype_healing',
				});
			}
		},
		variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'r'>()({
			known: {
				Heal: [],
			},
			calculate(self) {
				return {
					Heal: championAbilityVariableValue('Damage', {
						abilityKey: 'r',
						abilityVariant: self.champion.value!.abilities.r.variants[0]!,
						damageSource: self,
					}),
				};
			},
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				Heal: {
					type: VariableType.heal,
				},
				SecondaryHealingTooltip: {
					type: VariableType.heal,
				},
			},
			uninteresting: ['DamageAmp', 'Duration'],
		}),
	},
	passive: {
		variables: defineChampionVariables<'Vladimir', typeof IVladimir, 'passive'>()({
			known: {
				BonusAP: [],
				BonusHP: [],
			},
			calculate(self) {
				return {
					BonusAP: {
						value: self.stats.value.variables.vladimirPassiveAp ?? 0,
					},
					BonusHP: {
						value: self.stats.value.variables.vladimirPassiveHp ?? 0,
					},
				};
			},
			meta: {
				BonusAP: {
					isCustom: true,
					additionalInfo:
						"This is the actual AP that Vladimir's passive grants. The <var>ApproximateAPBonusAvoidingRecursion</var>, as the name suggests, is just the approximate value the game shows in the description and is, in most cases, incorrect",
				},
				BonusHP: {
					isCustom: true,
					additionalInfo:
						"This is the actual HP that Vladimir's passive grants. The <var>ApproximateHPBonusAvoidingRecursion</var>, as the name suggests, is just the approximate value the game shows in the description and is, in most cases, incorrect",
				},
				ApproximateAPBonusAvoidingRecursion: {
					/* not displayed in game */
					calculatesFrom: [],
				},
				ApproximateHPBonusAvoidingRecursion: {
					/* not displayed in game */
					calculatesFrom: [],
				},
			},
			uninteresting: ['HPforAP', 'APRatioBonusHP'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, bonusStats, dragonStatMultipliers, championPassiveStats, itemPassivesStats, itemTotalStats, totalMultipliersStats, dragonStats }, { calculatedVariables }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
				};
				const hpToAp = championAbilityVariableValue('HPforAP', passiveParams);
				const apToHp = championAbilityVariableValue('APRatioBonusHP', passiveParams);

				if (typeof hpToAp.value !== 'number' || typeof apToHp.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS vladimir] failed to calculate passive ratios', hpToAp, apToHp);
					return;
				}

				const totalApMultiplier = calculatedVariables.totalItemApMultipliers + dragonStatMultipliers.abilityPower + calculatedVariables.midQuestMultiplier;

				const baseAP = bonusStats.hp / hpToAp.value;
				const riftmakerBonusHpToAp = calculatedVariables.riftmakerBonusHPToAP ?? 0;
				const hpAPBase = totalStats.abilityPower + baseAP * (totalApMultiplier - 1);
				const passiveHP = (hpAPBase * apToHp.value) / (1 - riftmakerBonusHpToAp * totalApMultiplier * apToHp.value);

				/* not tracking stats to `totalPreMultipliersStats`, which maybe should be done but don't really know if anything else I'm trying to track below makes sense. Revisit if there are any issues */
				calculatedVariables.vladimirPassiveHp = passiveHP;
				calculatedVariables.apMultipliersBase += baseAP;
				championPassiveStats.hp = passiveHP;
				totalStats.hp += passiveHP;
				bonusStats.hp += passiveHP;

				let passiveAP = baseAP;
				championPassiveStats.abilityPower = passiveAP;
				calculatedVariables.vladimirPassiveAp = passiveAP;

				if (calculatedVariables.rabadonApMultiplier) {
					const value = baseAP * calculatedVariables.rabadonApMultiplier;
					calculatedVariables.rabadonMagicalOpus! += value;
					passiveAP += value;
					itemPassivesStats.abilityPower += value;
					itemTotalStats.abilityPower += value;
				}
				if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
					const value = baseAP * calculatedVariables.blackfireTorchBBlazeMultiplier;
					calculatedVariables.blackfireTorchBBlazeAP! += value;
					passiveAP += value;
					itemPassivesStats.abilityPower += value;
					itemTotalStats.abilityPower += value;
				}
				if (dragonStatMultipliers.abilityPower) {
					const value = baseAP * dragonStatMultipliers.abilityPower;
					passiveAP += value;
					dragonStats.abilityPower! += value;
					totalMultipliersStats.abilityPower += value;
				}
				if (calculatedVariables.midQuestMultiplier) {
					const value = baseAP * calculatedVariables.midQuestMultiplier;
					passiveAP += value;
					calculatedVariables.midQuestAp! += value;
					totalMultipliersStats.abilityPower += value;
				}

				totalStats.abilityPower += passiveAP;
				bonusStats.abilityPower += passiveAP;

				if (riftmakerBonusHpToAp) {
					const passiveHPInfusion = passiveHP * riftmakerBonusHpToAp;
					calculatedVariables.riftmakerVoidInfusion! += passiveHPInfusion;

					let riftmakerTotalAp = passiveHPInfusion;
					if (calculatedVariables.rabadonApMultiplier) {
						const value = passiveHPInfusion * calculatedVariables.rabadonApMultiplier;
						calculatedVariables.rabadonMagicalOpus! += value;
						riftmakerTotalAp += value;
					}
					if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
						const value = passiveHPInfusion * calculatedVariables.blackfireTorchBBlazeMultiplier;
						calculatedVariables.blackfireTorchBBlazeAP! += value;
						riftmakerTotalAp += value;
					}
					if (dragonStatMultipliers.abilityPower) {
						const value = passiveHPInfusion * dragonStatMultipliers.abilityPower;
						riftmakerTotalAp += value;
						dragonStats.abilityPower! += value;
						totalMultipliersStats.abilityPower += value;
					}
					if (calculatedVariables.midQuestMultiplier) {
						const value = passiveHPInfusion * calculatedVariables.midQuestMultiplier;
						riftmakerTotalAp += value;
						calculatedVariables.midQuestAp! += value;
						totalMultipliersStats.abilityPower += value;
					}

					itemPassivesStats.abilityPower += riftmakerTotalAp;
					itemTotalStats.abilityPower += riftmakerTotalAp;
					totalStats.abilityPower += riftmakerTotalAp;
					bonusStats.abilityPower += riftmakerTotalAp;
				}
			},
			priority: HOOK_PRIORITIES.postTotal.Vladimir,
		},
	},
} satisfies IChampionSpecific<'Vladimir'>;
