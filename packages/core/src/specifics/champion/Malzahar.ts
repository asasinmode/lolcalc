import type IMalzahar from '@lolcalc/data/files/champion/Malzahar.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Malzahar', typeof IMalzahar, 'passive'>()({
			uninteresting: ['DRPercent', 'LingerDuration'],
		}),
	},
} satisfies IChampionSpecific<'Malzahar'>;
