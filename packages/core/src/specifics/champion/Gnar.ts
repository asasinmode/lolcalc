import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IGnar from '@lolcalc/data/files/champion/Gnar.json';
import type { IChampion } from '@lolcalc/data/types.js';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { roundNumber } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		modifyVariantData(abilityVariant, binData) {
			const rootData = binData['Characters/GnarBig/CharacterRecords/Root'];
			if (!rootData) {
				throw new Error('no mega gnar character root data');
			}

			const megaStats: Partial<IChampion['stats']> = {
				hp: rootData.baseHPModifiable.baseValue,
				hpperlevel: rootData.hpPerLevelModifiable.baseValue,
				hpregen: rootData.baseStaticHPRegenModifiable.baseValue,
				hpregenperlevel: rootData.hpRegenPerLevelModifiable.baseValue,
				attackdamage: rootData.baseDamageModifiable.baseValue,
				attackdamageperlevel: rootData.damagePerLevelModifiable.baseValue,
				armor: rootData.baseArmorModifiable.baseValue,
				armorperlevel: rootData.armorPerLevelModifiable.baseValue,
				spellblock: rootData.baseMR.baseValue,
				spellblockperlevel: rootData.mrPerLevel.baseValue,
				attackspeed: rootData.attackSpeedModifiable.baseValue,
				attackspeedratio: rootData.attackSpeedRatioModifiable.baseValue,
				attackspeedperlevel: rootData.attackSpeedPerLevelModifiable.baseValue,
			};

			for (const stat in megaStats) {
				// @ts-expect-error keys are fine
				megaStats[stat] = roundNumber(megaStats[stat], 4);
			}

			(abilityVariant as any).megaStats = megaStats;
		},
	},
	q: {
		additionalVariantsObjectNames: ['GnarBigQ'],
		variables: defineChampionVariables<'Gnar', typeof IGnar, 'q'>()({
			meta: {
				MiniTotalDamage: {
					type: VariableType.physical,
				},
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				MegaTotalDamage: {
					type: VariableType.physical,
				},
				MegaSlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				MegaSlowDuration: {
					type: VariableType.affectedBySlowResist,
				},
			},
			uninteresting: ['MiniCDRefund', 'MiniSubsequentMult', 'MegaCDRefund'],
		}),
	},
	w: {
		additionalVariantsObjectNames: ['GnarBigW'],
	},
	e: {
		additionalVariantsObjectNames: ['GnarBigE'],
	},
	calculateHooks: {
		postInit: {
			handler(self, { baseStats, levelStats, championPassiveStats }) {
				const { q, w, e } = self.abilityVariantsIndexes.value;
				if (q & w & e) {
					const { attackdamage, attackdamageperlevel, armor, armorperlevel, spellblock, spellblockperlevel, hp, hpperlevel, hpregen, hpregenperlevel, attackspeed, attackspeedratio, attackspeedperlevel } = ((self.champion.value! as typeof IGnar).abilities.passive.variants[0]!.megaStats);
					baseStats.attackDamage = attackdamage;
					levelStats.attackDamage = attackdamageperlevel;
					baseStats.armor = armor;
					levelStats.armor = armorperlevel;
					baseStats.magicResist = spellblock;
					levelStats.magicResist = spellblockperlevel;
					baseStats.hp = hp;
					levelStats.hp = hpperlevel;
					baseStats.hpRegen = hpregen;
					levelStats.hpRegen = hpregenperlevel;
					baseStats.attackSpeed = attackspeed;
					baseStats.attackSpeedRatio = attackspeedratio;
					levelStats.attackSpeed = attackspeedperlevel * 0.01 * attackspeedratio;
					levelStats.bonusAttackSpeedPercent = (attackspeedperlevel ?? 0) / 100 + baseStats.bonusAttackSpeedPercent;
				} else {
					championPassiveStats.attackRange = 225;
				}
			},
		},
		onChampionPassive: {
			handler(self, { championPassiveStats }) {
				const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: self.level.value } } as DamageSource };

				const { q, w, e } = self.abilityVariantsIndexes.value;

				if (!(q & w & e)) {
					/* the passive states it grants 0%-99% attack speed but all of it except for the lvl 1 bonus is handled by attack speed per level, so add only the missing lvl 1 value */
					const attackSpeed = championAbilityVariableValue('TotalAS', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, damageSource: { level: { value: 1 } } as DamageSource });
					if (typeof attackSpeed.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = attackSpeed.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS gnar] failed to calculate passive attack speed', attackSpeed);
					}

					const moveSpeed = championAbilityVariableValue('TotalMS', passiveParams);
					if (typeof moveSpeed.value === 'number') {
						championPassiveStats.moveSpeed = moveSpeed.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS gnar] failed to calculate passive move speed', moveSpeed);
					}

					const attackRange = championAbilityVariableValue('TotalAttackRange', passiveParams);
					if (typeof attackRange.value === 'number') {
						championPassiveStats.attackRange = (championPassiveStats.attackRange ?? 0) + attackRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS gnar] failed to calculate passive attack range', attackRange);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Gnar'>;
