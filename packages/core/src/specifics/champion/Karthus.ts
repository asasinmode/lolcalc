import type IKarthus from '@lolcalc/data/files/champion/Karthus.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Karthus', typeof IKarthus, 'passive'>()({
			uninteresting: ['PassiveDuration'],
		}),
	},
} satisfies IChampionSpecific<'Karthus'>;
