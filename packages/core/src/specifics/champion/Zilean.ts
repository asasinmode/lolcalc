import type IZilean from '@lolcalc/data/files/champion/Zilean.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	variables: defineChampionVariables<'Zilean', typeof IZilean>()({
		known: {
			'{79ba1a32}': [],
			GameModeInteger: [1],
		},
		calculate() {
			return {
				'{79ba1a32}': { value: 0 },
				GameModeInteger: { value: 1 },
			};
		},
		meta: {
			'{79ba1a32}': {
				/* not displayed anywhere but added here to know what it is */
				displayedName: 'XPGiven',
			},
		},
	}),
	passive: {
		variables: defineChampionVariables<'Zilean', typeof IZilean, 'passive'>()({
			meta: {
				TotalXP: {
					calculatesFrom: [],
				},
			},
			uninteresting: ['PassiveCooldown', 'TotalXP'],
		}),
	},
} satisfies IChampionSpecific<'Zilean'>;
