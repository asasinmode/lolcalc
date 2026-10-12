import type IMorgana from '@lolcalc/data/files/champion/Morgana.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Morgana', typeof IMorgana, 'passive'>()({
			uninteresting: ['HealPercent'],
		}),
	},
} satisfies IChampionSpecific<'Morgana'>;
