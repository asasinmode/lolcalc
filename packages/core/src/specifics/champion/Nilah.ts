import type INilah from '@lolcalc/data/files/champion/Nilah.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Nilah', typeof INilah, 'passive'>()({
			uninteresting: ['ExperiencePercentage', 'HealingIncrease', 'ShieldIncrease', 'ShieldMaxDuration'],
		}),
	},
} satisfies IChampionSpecific<'Nilah'>;
