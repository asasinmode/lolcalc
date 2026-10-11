import type IKassadin from '@lolcalc/data/files/champion/Kassadin.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Kassadin', typeof IKassadin, 'passive'>()({
			uninteresting: ['DamageReductionPercent'],
		}),
	},
} satisfies IChampionSpecific<'Kassadin'>;
