import type IRenekton from '@lolcalc/data/files/champion/Renekton.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Renekton', typeof IRenekton, 'passive'>()({
			uninteresting: ['FuryPerAttack', 'FuryCost', 'LowHealthPercentThreshold', 'FuryIncreasePercent'],
		}),
	},
} satisfies IChampionSpecific<'Renekton'>;
