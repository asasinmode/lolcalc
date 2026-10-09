import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ICassiopeia from '@lolcalc/data/files/champion/Cassiopeia.json';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	calculateHooks: {
		postInit: {
			handler(self, _stats, { calculatedVariables }) {
				const msMultiplier = championAbilityVariableValue('PercentHasteMod', {
					abilityKey: 'passive',
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					allAbilitiesVariants: self.allAbilityVariants.value,
					damageSource: { level: { value: self.level.value } } as DamageSource,
				});

				if (typeof msMultiplier.value === 'number') {
					calculatedVariables.cassiopeiaPassiveMSMultiplier = msMultiplier.value;
				} else {
					console.warn('[CHAMPION_SPECIFICS cassiopeia] failed to calculate passive ms multiplier');
				}
			},
		},
	},
	passive: {
		variables: defineChampionVariables<'Cassiopeia', typeof ICassiopeia, 'passive'>()({
			meta: {
				PercentHasteMod: {
					displayedName: 'MoveSpeedPercent',
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Cassiopeia'>;
