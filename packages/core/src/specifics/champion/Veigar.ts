import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
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
			meta: {
				f1: {
					displayedName: 'Stacks',
				},
			},
			uninteresting: ['dAbilityStacks', 'dTakedownStacks', 'APPerStack'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Veigar', typeof IVeigar, 'w'>()({
			known: {
				'f2.0': [],
			},
			calculate(self) {
				let Cdr = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					damageSource: self,
				};
				const stacksForCdr = championAbilityVariableValue('PStacksPerDarkMatterCDR', passiveParams);
				const cdrForStacks = championAbilityVariableValue('DarkMatterCDRIncrement', passiveParams);
				if (typeof stacksForCdr.value === 'number' && typeof cdrForStacks.value === 'number') {
					Cdr = Math.floor(self.internalData.value.passiveStacks / stacksForCdr.value) * cdrForStacks.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS veigar] failed to calculate w stacks cdr', stacksForCdr, cdrForStacks);
				}

				return {
					'f2.0': {
						value: Cdr,
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				'f2.0': {
					displayedName: 'CurrentCDR',
				},
			},
			/* cdr vars are from passive */
			uninteresting: ['PStacksPerDarkMatterCDR' as any, 'DarkMatterCDRIncrement' as any],
		}),
	},
	r: {
		variables: defineChampionVariables<'Veigar', typeof IVeigar, 'r'>()({
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
