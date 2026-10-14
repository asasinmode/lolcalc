import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type ISejuani from '@lolcalc/data/files/champion/Sejuani.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveActive: clamp(0, Math.round(self.internalData.value.isPassiveActive ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Sejuani', typeof ISejuani, 'passive'>()({
			known: {
				StunnedTargetDamage: [],
			},
			calculate(self, target) {
				let StunnedTargetDamage = Number.NaN;

				const procDamage = championAbilityVariableValue('PercentHPDamage', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				});
				if (typeof procDamage.value === 'number') {
					StunnedTargetDamage = procDamage.value * (target?.stats.value.total.hp ?? 0);
				} else {
					console.warn('[CHAMPION_SPECIFICS sejuani] failed to calculate passive percent dmg', procDamage);
				}

				return {
					StunnedTargetDamage: {
						value: StunnedTargetDamage,
					},
				};
			},
			meta: {
				StunnedTargetDamage: {
					type: VariableType.magic,
					isCustom: true,
				},
			},
			uninteresting: ['PercentHPDamage', 'EpicMonsterCap', 'FrostArmorDuration'],
		}),
	},
	w: {
		dataOverrides: {
			isImmobilizing: false,
		},
	},
	calculateHooks: {
		preShred: {
			handler(self, { totalStats, championPassiveStats, baseOnLevelStats, totalPreMultipliersStats, bonusStats, itemPassivesStats, itemTotalStats, dragonStatMultipliers, totalMultipliersStats, dragonStats }, { calculatedVariables }) {
				if (!self.internalData.value.isPassiveActive) {
					return;
				}

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { stats: { value: { bonus: bonusStats } } } as DamageSource,
				};

				const passiveArmor = championAbilityVariableValue('TotalArmorTooltip', passiveParams);
				const passiveMR = championAbilityVariableValue('TotalMRTooltip', passiveParams);
				if (typeof passiveArmor.value !== 'number' || typeof passiveMR.value !== 'number') {
					console.warn('[CHAMPION_SPECIFICS sejuani] failed to calculate passive resists', passiveArmor, passiveMR);
					return;
				}

				const armorConst = passiveArmor.calculatesFrom?.[0]?.value ?? 0;
				const armorPercent = passiveArmor.calculatesFrom?.[1]?.value ?? 0;
				const mrConst = passiveMR.calculatesFrom?.[0]?.value ?? 0;
				const mrPercent = passiveMR.calculatesFrom?.[1]?.value ?? 0;
				if (typeof armorConst !== 'number' || typeof armorPercent !== 'number' || typeof mrConst !== 'number' || typeof mrPercent !== 'number') {
					console.warn('[CHAMPION_SPECIFICS sejuani] failed to calculate passive resists calculate froms', passiveArmor.calculatesFrom, passiveMR.calculatesFrom);
					return;
				}

				const armorMultBase = bonusStats.armor - (calculatedVariables.jakShoArmor ?? 0) - (dragonStats.armor ?? 0);
				const mrMultBase = bonusStats.magicResist - (calculatedVariables.jakShoMagicResist ?? 0) - (dragonStats.magicResist ?? 0);

				/* rounding is sus but it matches the test cases from the game */
				let armor = Math.round(armorConst + armorPercent * armorMultBase);
				let mr = Math.round(mrConst + mrPercent * mrMultBase);

				if (calculatedVariables.jakShoBonusResistMultiplier) {
					const jakShoArmor = armor * calculatedVariables.jakShoBonusResistMultiplier;
					const jakShoMR = mr * calculatedVariables.jakShoBonusResistMultiplier;
					calculatedVariables.jakShoArmor! += jakShoArmor;
					calculatedVariables.jakShoMagicResist! += jakShoMR;
					armor += jakShoArmor;
					mr += jakShoMR;
					itemPassivesStats.armor += jakShoArmor;
					itemPassivesStats.magicResist += jakShoMR;
					itemTotalStats.armor += jakShoArmor;
					itemTotalStats.magicResist += jakShoMR;
					totalPreMultipliersStats.armor += jakShoArmor;
					totalPreMultipliersStats.magicResist += jakShoMR;
				}

				if (dragonStatMultipliers.armor) {
					const dragonArmor = armor * dragonStatMultipliers.armor;
					armor += dragonArmor;
					dragonStats.armor! += dragonArmor;
					totalMultipliersStats.armor += dragonArmor;
				}
				if (dragonStatMultipliers.magicResist) {
					const dragonMR = mr * dragonStatMultipliers.magicResist;
					mr += dragonMR;
					dragonStats.armor! += dragonMR;
					totalMultipliersStats.armor += dragonMR;
				}

				championPassiveStats.armor = armor;
				championPassiveStats.magicResist = mr;
				bonusStats.armor += armor;
				bonusStats.magicResist += mr;
				totalStats.armor += armor;
				totalStats.magicResist += mr;
			},
		},
	},
} satisfies IChampionSpecific<'Sejuani'>;
