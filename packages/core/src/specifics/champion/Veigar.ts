import type IVeigar from '@lolcalc/data/files/champion/Veigar.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			passiveStacks: Math.max(0, Math.round(self.internalData.value.passiveStacks ?? 0)),
		};
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }, { calculatedVariables }) {
				championPassiveStats.abilityPower = self.internalData.value.passiveStacks;
				calculatedVariables.apMultipliersBase += self.internalData.value.passiveStacks;
			},
		},
	},
	passive: {
		variables: defineChampionVariables<'Veigar', typeof IVeigar, 'passive'>()({
			known: {
				f1: [],
			},
			calculate(self) {
				return {
					f1: {
						value: self.internalData.value.passiveStacks,
					},
				};
			},
			uninteresting: ['dAbilityStacks', 'dTakedownStacks', 'APPerStack'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Veigar', typeof IVeigar, 'passive'>()({
			meta: {
				MinDamage: {
					type: VariableType.magic,
				},
				MaxDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Veigar'>;
