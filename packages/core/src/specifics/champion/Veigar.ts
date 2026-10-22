import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IVeigar from '@lolcalc/data/files/champion/Veigar.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function calculateWCdr(self: DamageSource): number {
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

	return Cdr;
}

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
		calculateCd(_baseCd, cdr, abilityVariant, abilityLevel, self) {
			let rv = Number.NaN;

			const actualBaseCd = championAbilityVariableValue('BaseCooldown', { abilityKey: 'w', abilityVariant, abilityLevel: abilityLevel ?? self?.abilityLevels.value.w });
			const stacksCdr = self ? calculateWCdr(self) : 0;
			if (typeof actualBaseCd.value === 'number') {
				rv = actualBaseCd.value * cdr * Math.max(0, 1 - stacksCdr);
			} else {
				console.warn('[CHAMPION_SPECIFICS veigar] failed to calculate W base cd', actualBaseCd);
			}

			return rv;
		},
		variables: defineChampionVariables<'Veigar', typeof IVeigar, 'w'>()({
			known: {
				'f2.0': [],
			},
			calculate(self) {
				return {
					'f2.0': {
						value: calculateWCdr(self),
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
