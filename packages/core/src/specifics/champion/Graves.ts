import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IGraves from '@lolcalc/data/files/champion/Graves.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

function eMaxStacks(self: DamageSource<'Graves'>): number {
	return (self.champion.value! as typeof IGraves).abilities.e.variants[0]!.dataValues.MaxStacks[1]!;
}

export default {
	setupData(self) {
		return {
			eStacks: clamp(0, self.internalData.value.eStacks ?? 0, eMaxStacks(self)),
		};
	},
	passive: {
		variables: defineChampionVariables<'Graves', typeof IGraves, 'passive'>()({
			meta: {
				SingleBulletDamage: {
					type: VariableType.physical,
				},
				MultiBulletDamage: {
					type: VariableType.physical,
				},
				CritDamageMult: {
					/* game doesn't show anything there */
					calculatesFrom({ abilityVariant, damageSource }) {
						const critRatio = (abilityVariant as typeof IGraves['abilities']['passive']['variants'][0]).dataValues.CritDamageRatio[1]!;
						return [
							{
								stat: 'const',
								/* recreate CritDamageMult */
								value: ((damageSource?.stats.value.baseOnLevel.critDamageMultiplier ?? 2) - 1) * critRatio * 100,
							},
							{
								stat: 'critDamageMultiplier',
								value: critRatio,
								isPercentage: true,
							},
						];
					},
				},
			},
			uninteresting: ['StructureDamageReduction'],
		}),
	},
	e: {
		maxStacks: eMaxStacks,
		variables: defineChampionVariables<'Graves', typeof IGraves, 'e'>()({
			known: {
				BonusArmor: [],
				BonusMR: [],
			},
			calculate(self) {
				return {
					BonusArmor: {
						value: self.stats.value.championPassive.armor ?? 0,
					},
					BonusMR: {
						value: self.stats.value.championPassive.magicResist ?? 0,
					},
				};
			},
			meta: {
				BonusArmor: {
					isCustom: true,
				},
				BonusMR: {
					isCustom: true,
				},
			},
			uninteresting: ['BuffDuration', 'MaxStacks', 'CooldownPerHit'],
		}),
	},
	calculateHooks: {
		/* normally mountain multiplies jakSho value but for graves armor these 2 stack additively */
		postTotal: {
			handler(self, { championPassiveStats, bonusStats, totalStats, totalPreMultipliersStats, itemPassivesStats, itemTotalStats, totalMultipliersStats, dragonStatMultipliers, dragonStats }, { calculatedVariables }) {
				const { eStacks } = self.internalData.value;
				if (eStacks) {
					const eParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'e', abilityVariant: self.champion.value!.abilities.e.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.e };

					const eArmor = championAbilityVariableValue('ArmorPerStack', eParams);
					if (typeof eArmor.value === 'number') {
						let armor = eArmor.value * eStacks;
						championPassiveStats.armor = armor;

						if (calculatedVariables.jakShoBonusResistMultiplier) {
							const value = armor * calculatedVariables.jakShoBonusResistMultiplier;
							calculatedVariables.jakShoArmor! += value;
							itemPassivesStats.armor += value;
							itemTotalStats.armor += value;
							armor += value;
						}

						if (dragonStatMultipliers.armor) {
							const value = armor * dragonStatMultipliers.armor;
							dragonStats.armor! += value;
							totalMultipliersStats.armor += value;
							armor += value;
						}

						totalPreMultipliersStats.armor += armor;
						bonusStats.armor += armor;
						totalStats.armor += armor;
					} else {
						console.warn('[CHAMPION_SPECIFICS graves] failed to calculate e armor', eArmor);
					}

					const eMR = championAbilityVariableValue('MRGrant', eParams);
					if (typeof eMR.value === 'number') {
						let magicResist = eMR.value * eStacks;
						championPassiveStats.magicResist = magicResist;

						if (calculatedVariables.jakShoBonusResistMultiplier) {
							const value = magicResist * calculatedVariables.jakShoBonusResistMultiplier;
							calculatedVariables.jakShoMagicResist! += value;
							itemPassivesStats.magicResist += value;
							itemTotalStats.magicResist += value;
							magicResist += value;
						}

						if (dragonStatMultipliers.magicResist) {
							const value = magicResist * dragonStatMultipliers.magicResist;
							dragonStats.magicResist! += value;
							totalMultipliersStats.magicResist += value;
							magicResist += value;
						}

						totalPreMultipliersStats.magicResist += magicResist;
						bonusStats.magicResist += magicResist;
						totalStats.magicResist += magicResist;
					} else {
						console.warn('[CHAMPION_SPECIFICS graves] failed to calculate e mr', eMR);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Graves'>;
