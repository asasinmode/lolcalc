import type IElise from '@lolcalc/data/files/champion/Elise.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		self.abilityLevels.value.r ||= 1;
		return {} as never;
	},
	passive: {
		variables: defineChampionVariables<'Elise', typeof IElise, 'passive'>()({
			meta: {
				PassiveTotalDamage: {
					type: VariableType.magic,
				},
				PassiveTotalHealing: {
					type: VariableType.heal,
				},
			},
			/* is an R variable */
			uninteresting: ['BaseSpiderlingsStored' as any],
		}),
	},
	r: {
		variables: defineChampionVariables<'Elise', typeof IElise, 'r'>()({
			uninteresting: ['BaseSpiderlingsStored'],
		}),
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
	},
} satisfies IChampionSpecific<'Elise'>;
