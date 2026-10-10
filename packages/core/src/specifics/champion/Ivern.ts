import type IIvern from '@lolcalc/data/files/champion/Ivern.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Ivern', typeof IIvern, 'passive'>()({
			known: {
				SpellModifierDescriptionAppend: [''],
			},
			calculate() {
				return {
					SpellModifierDescriptionAppend: { value: '' },
				};
			},
			uninteresting: ['SpellModifierDescriptionAppend'],
		}),
	},
} satisfies IChampionSpecific<'Ivern'>;
