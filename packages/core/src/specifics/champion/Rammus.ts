import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IRammus from '@lolcalc/data/files/champion/Rammus.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { HOOK_PRIORITIES } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			defensiveCurl: clamp(0, self.internalData.value.defensiveCurl ?? 0, 1),
		};
	},
	w: {
		// TODO not sure if actually desired, looks weird without styling the W as active (the border animation) and only clutters results, skip for now
		// additionalVariantsObjectNames: ['DefensiveBallCurlCancel'],
		variables: defineChampionVariables<'Rammus', typeof IRammus, 'w'>()({
			meta: {
				ReturnDamageCalc: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['BuffDuration'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, championPassiveStats, bonusStats }, { calculatedVariables, debuffs }) {
				let wBonusArmor = 0;
				let wBonusMr = 0;
				if (self.internalData.value.defensiveCurl) {
					const wParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'w', abilityVariant: (self.champion.value as typeof IRammus).abilities.w.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.w, damageSource: { stats: { value: { total: totalStats } } } as DamageSource };
					/*
					 * rammus W bonus resists consist of a base value + a % of total armor, however this % also applies to base
					 * i.e base 20 + 50% armor = (20 * 1.5) + armor * 0.5
					 * so get that base & multiplier from tooltip variables' calculatesFrom
					 */
					const { calculatesFrom: armorCalculatesFrom } = championAbilityVariableValue('BonusArmorTooltip', wParams);
					const { calculatesFrom: mrCalculatesFrom } = championAbilityVariableValue('BonusMRTooltip', wParams);

					if (!armorCalculatesFrom || !mrCalculatesFrom) {
						console.warn('[CHAMPION_SPECIFICS Rammus] failed to resolve W bonus resists', armorCalculatesFrom, mrCalculatesFrom);

						return;
					}

					const wArmorMultiplier = armorCalculatesFrom[1]!.value as number;
					const wMrMultiplier = mrCalculatesFrom[1]!.value as number;
					const wConstArmorBonus = (armorCalculatesFrom[0]!.value as number) / (1 + wArmorMultiplier);
					const wConstMrBonus = (mrCalculatesFrom[0]!.value as number) / (1 + wMrMultiplier);
					const jakShoMultiplier = 1 + (calculatedVariables.jakShoBonusResistMultiplier ?? 0);
					const preDragonArmor = totalPreMultipliersStats.armor + (calculatedVariables.jakShoArmor ?? 0);
					const preDragonMr = totalPreMultipliersStats.magicResist + (calculatedVariables.jakShoMagicResist ?? 0);

					const rawArmorBonus = ((preDragonArmor + wConstArmorBonus * jakShoMultiplier) * wArmorMultiplier + wConstArmorBonus * jakShoMultiplier) * (1 + dragonStatMultipliers.armor);
					const rawMRBonus = ((preDragonMr + wConstMrBonus * jakShoMultiplier) * wMrMultiplier + wConstMrBonus * jakShoMultiplier) * (1 + dragonStatMultipliers.magicResist);

					const armorShredMultiplier = (1 - debuffs.percentageArmorShred);
					const mrShredMultiplier = (1 - debuffs.percentageMRShred);
					wBonusArmor = rawArmorBonus * armorShredMultiplier;
					wBonusMr = rawMRBonus * mrShredMultiplier;

					debuffs.shreddedArmor += rawArmorBonus * debuffs.percentageArmorShred;
					debuffs.shreddedMR += rawMRBonus * debuffs.percentageMRShred;
				}

				totalPreMultipliersStats.armor += wBonusArmor;
				totalPreMultipliersStats.magicResist += wBonusMr;
				championPassiveStats.armor = wBonusArmor;
				championPassiveStats.magicResist = wBonusMr;
				bonusStats.armor += wBonusArmor;
				bonusStats.magicResist += wBonusMr;
				totalStats.armor += wBonusArmor;
				totalStats.magicResist += wBonusMr;

				const bonusAd = championAbilityVariableValue('TotalDamage', { abilityKey: 'passive', abilityVariant: (self.champion.value as typeof IRammus).abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { stats: { value: { total: totalStats } } } as DamageSource });

				if (typeof bonusAd.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS Rammus] failed to resolve passive bonus ad', bonusAd);

					return;
				}

				championPassiveStats.attackDamage = bonusAd.value;
				const passiveAd = championPassiveStats.attackDamage;

				const infernalMultiplierValue = passiveAd * dragonStatMultipliers.attackDamage;
				calculatedVariables.bloodmailRetributionExcludedAd += infernalMultiplierValue;

				const midQuestMultiplierValue = passiveAd * (1 + dragonStatMultipliers.attackDamage) * calculatedVariables.midQuestMultiplier;

				calculatedVariables.midQuestAd! += midQuestMultiplierValue;
				let value = infernalMultiplierValue + midQuestMultiplierValue;
				totalMultipliersStats.attackDamage += value;
				value += passiveAd;
				totalStats.attackDamage += value;
				bonusStats.attackDamage += value;
			},
			priority: HOOK_PRIORITIES.postTotal.Rammus,
		},
	},
} satisfies IChampionSpecific<'Rammus'>;
