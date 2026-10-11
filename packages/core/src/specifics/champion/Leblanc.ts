import type ILeblanc from '@lolcalc/data/files/champion/Leblanc.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	q: {
		variables: defineChampionVariables<'Leblanc', typeof ILeblanc, 'q'>()({
			// known: {
			// },
			// calculate(self, target) {
			// },
			meta: {},
			uninteresting: [],
		}),
	},
	r: {
		omittedVariantObjectNames: ['LeblancRQ', 'LeblancRW', 'LeblancRE'],
	},
} satisfies IChampionSpecific<'Leblanc'>;
