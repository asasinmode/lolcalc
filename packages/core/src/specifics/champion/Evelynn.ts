import type IEvelynn from '@lolcalc/data/files/champion/Evelynn.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Evelynn', typeof IEvelynn, 'passive'>()({
			uninteresting: ['DemonShadeTimer', 'StealthDropTimer'],
		}),
	},
} satisfies IChampionSpecific<'Evelynn'>;
