import type IPantheon from '@lolcalc/data/files/champion/Pantheon.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Pantheon', typeof IPantheon, 'passive'>()({
			uninteresting: ['ActionsToEmpower'],
		}),
	},
} satisfies IChampionSpecific<'Pantheon'>;
