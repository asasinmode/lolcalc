import type INidalee from '@lolcalc/data/files/champion/Nidalee.json';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

const passiveShapeshiftOptions = {
	none: 0,
	justBush: 1,
	towardsChampion: 2,
};

export default {
	setupData(self) {
		self.abilityLevels.value.r ||= 1;
		return {
			passiveVariantActive: clamp(0, Math.round(self.internalData.value.passiveVariantActive ?? 0), passiveShapeshiftOptions.none),
		};
	},
	passive: {
		shapeshiftOptions: passiveShapeshiftOptions,
		preplaceTooltipText(value) {
			/** use a custom var for hunting ms, otherwise it's displayed as `30%` always and in places where the tooltip shows `10%` */
			return value.replaceAll('spell.AspectOfTheCougar:PassivePercentMS*3', 'HuntingPercentMS');
		},
		modifyVariantData(abilityVariant) {
			/* game doesn't show it, maybe a leftover from some previous patch */
			abilityVariant.tooltipExtended = undefined;
		},
		variables: defineChampionVariables<'Nidalee', typeof INidalee, 'passive'>()({
			known: {
				HuntingPercentMS: [],
			},
			calculate(self) {
				const msVariable = championAbilityVariableValue('PassivePercentMS', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self });
				(msVariable.value as number) *= 3;

				return {
					HuntingPercentMS: msVariable,
				};
			},
		}),
	},
	w: {
		0: {
			/* add a variable used in MaxTraps formula but not saved in the data because the original value is empty and is override only for arena */
			modifyVariantData(abilityVariant) {
				abilityVariant.dataValues ??= {};
				abilityVariant.dataValues.ModesBonusMaxTraps = Array.from({ length: 7 }).fill(0);
			},
		},
	},
	calculateHooks: {
		postInit: {
			handler(self, { baseStats }) {
				const { q, w, e } = self.abilityVariantsIndexes.value;

				if (q & w & e) {
					/* doesn't seem to be in a variable */
					baseStats.attackRange = 125;
				}
			},
		},
		onChampionPassive: {
			handler(self, _stats, { calculatedVariables }) {
				if (!self.internalData.value.passiveVariantActive) {
					return;
				}

				const msVariable = championAbilityVariableValue('PassivePercentMS', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.r.variants[0]!, allAbilitiesVariants: self.allAbilityVariants.value, abilityLevel: self.abilityLevels.value.r, damageSource: self });
				let bonusMS = 0;

				if (typeof msVariable.value === 'number') {
					bonusMS = msVariable.value * 0.01;
				} else {
					console.warn('[CHAMPION_SPECIFICS nidalee] failed to calculate passive move speed');
				}

				if (self.internalData.value.passiveVariantActive === passiveShapeshiftOptions.towardsChampion) {
					bonusMS *= 3;
				}

				calculatedVariables.totalBonusPercentMoveSpeed += bonusMS;
			},
		},
	},
} satisfies IChampionSpecific<'Nidalee'>;
