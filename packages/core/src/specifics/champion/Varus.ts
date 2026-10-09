import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IVarus from '@lolcalc/data/files/champion/Varus.json';
import { clamp } from '@lolcalc/shared/utils.ts';

import type { IChampionSpecific } from '../champion.ts';
import type { IVariableValueResult } from '../index.ts';
import { defineChampionVariables } from './shared.ts';

const passiveOptions = {
	none: 0,
	generic: 1,
	champion: 2,
};

export default {
	setupData(self) {
		return {
			passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), passiveOptions.champion),
		};
	},
	passive: {
		options: passiveOptions,
		variables: defineChampionVariables<'Varus', typeof IVarus, 'passive'>()({
			uninteresting: ['ASDuration'],
		}),
	},
	calculateHooks: {
		onChampionPassive: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				const { passiveVariantActive } = self.internalData.value;
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				let bonusAS: IVariableValueResult | undefined;

				if (passiveVariantActive === passiveOptions.champion) {
					bonusAS = championAbilityVariableValue('PassiveAS', passiveParams);

					const asCap = championAbilityVariableValue('NewASCap', passiveParams);
					if (typeof asCap.value === 'number') {
						calculatedVariables.attackSpeedCap = asCap.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive as cap', asCap);
					}
				} else if (passiveVariantActive) {
					bonusAS = championAbilityVariableValue('PassiveASMinion', passiveParams);
				}

				if (bonusAS) {
					if (typeof bonusAS.value === 'number') {
						championPassiveStats.bonusAttackSpeedPercent = bonusAS.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive bonus as', bonusAS);
					}
				}
			},
		},
		onTotalPreMultipliers: {
			handler(self, { bonusStats, totalPreMultipliersStats, championPassiveStats, itemPassivesStats, itemTotalStats }, { calculatedVariables }) {
				const { passiveVariantActive } = self.internalData.value;
				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};

				let asToAD: IVariableValueResult | undefined;
				let asToAP: IVariableValueResult | undefined;

				if (passiveVariantActive === passiveOptions.champion) {
					asToAD = championAbilityVariableValue('AStoADChampion', passiveParams);
					asToAP = championAbilityVariableValue('AStoAPChampion', passiveParams);
				} else if (passiveVariantActive) {
					asToAD = championAbilityVariableValue('AStoADMinion', passiveParams);
					asToAP = championAbilityVariableValue('AStoAPMinion', passiveParams);
				}

				const bonusASPercent = bonusStats.bonusAttackSpeedPercent - (championPassiveStats.bonusAttackSpeedPercent ?? 0);
				if (asToAD) {
					if (typeof asToAD.value === 'number') {
						const value = asToAD.value * bonusASPercent;
						championPassiveStats.attackDamage = value;
						bonusStats.attackDamage += value;
						totalPreMultipliersStats.attackDamage += value;
					} else {
						console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive bonus ad', asToAD);
					}
				}
				if (asToAP) {
					if (typeof asToAP.value === 'number') {
						const value = asToAP.value * bonusASPercent;
						calculatedVariables.apMultipliersBase += value;
						championPassiveStats.abilityPower = value;
						bonusStats.abilityPower += value;
						totalPreMultipliersStats.abilityPower += value;

						if (calculatedVariables.rabadonApMultiplier) {
							const rabadonAP = calculatedVariables.rabadonApMultiplier * value;
							itemPassivesStats.abilityPower += rabadonAP;
							itemTotalStats.abilityPower += rabadonAP;
							totalPreMultipliersStats.abilityPower += rabadonAP;
							calculatedVariables.rabadonMagicalOpus! += rabadonAP;
						}

						if (calculatedVariables.blackfireTorchBBlazeMultiplier) {
							const rabadonAP = calculatedVariables.blackfireTorchBBlazeMultiplier * value;
							itemPassivesStats.abilityPower += rabadonAP;
							itemTotalStats.abilityPower += rabadonAP;
							totalPreMultipliersStats.abilityPower += rabadonAP;
							calculatedVariables.blackfireTorchBBlazeAP! += rabadonAP;
						}
					} else {
						console.warn('[CHAMPION_SPECIFICS varus] failed to calculate passive bonus ap', asToAP);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Varus'>;
