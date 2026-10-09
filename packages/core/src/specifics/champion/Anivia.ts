import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IAnivia from '@lolcalc/data/files/champion/Anivia.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isEgg: clamp(0, Math.round(self.internalData.value.isEgg ?? 0), 1),
		};
	},
	w: {
		dataOverrides: {
			isImmobilizing: true,
		},
		variables: defineChampionVariables<'Anivia', typeof IAnivia, 'w'>()({
			uninteresting: ['WallDuration'],
		}),
	},
	calculateHooks: {
		postTotal: {
			handler(self, { championPassiveStats, bonusStats, totalStats, totalPreMultipliersStats, totalMultipliersStats, dragonStatMultipliers, dragonStats, itemTotalStats, itemPassivesStats }, { calculatedVariables }) {
				if (self.internalData.value.isEgg) {
					const resists = championAbilityVariableValue('BonusResists', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: { level: { value: self.level.value } } as DamageSource,
					});

					if (typeof resists.value === 'number') {
						let armor = resists.value;
						let magicResist = resists.value;
						championPassiveStats.armor = armor;
						championPassiveStats.magicResist = magicResist;
						totalPreMultipliersStats.armor += armor;
						totalPreMultipliersStats.magicResist += magicResist;

						// TODO check shredding
						if (calculatedVariables.jakShoBonusResistMultiplier) {
							const jakShoArmor = armor * calculatedVariables.jakShoBonusResistMultiplier;
							const jakShoMagicResist = magicResist * calculatedVariables.jakShoBonusResistMultiplier;
							calculatedVariables.jakShoArmor! += jakShoArmor;
							calculatedVariables.jakShoMagicResist! += jakShoMagicResist;
							itemPassivesStats.armor += jakShoArmor;
							itemPassivesStats.magicResist += jakShoMagicResist;
							itemTotalStats.armor += jakShoArmor;
							itemTotalStats.magicResist += jakShoMagicResist;
							armor += jakShoArmor;
							magicResist += jakShoMagicResist;
						}

						if (dragonStatMultipliers.armor) {
							const dragonValue = armor * dragonStatMultipliers.armor;
							dragonStats.armor! += dragonValue;
							totalMultipliersStats.armor += dragonValue;
							armor += dragonValue;
						}
						if (dragonStatMultipliers.magicResist) {
							const dragonValue = magicResist * dragonStatMultipliers.magicResist;
							dragonStats.magicResist! += dragonValue;
							totalMultipliersStats.magicResist += dragonValue;
							magicResist += dragonValue;
						}

						totalStats.armor += armor;
						totalStats.magicResist += magicResist;
						bonusStats.armor += armor;
						bonusStats.magicResist += magicResist;
					} else {
						console.warn('[CHAMPION_SPECIFICS anivia] failed to calculate passive resists', resists);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Anivia'>;
