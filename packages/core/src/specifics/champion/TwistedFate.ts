import type ITwistedFate from '@lolcalc/data/files/champion/TwistedFate.json';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	variables: defineChampionVariables<'TwistedFate', typeof ITwistedFate>()({
		known: {
			GameModeInteger: [1],
		},
		calculate() {
			return {
				GameModeInteger: {
					value: 1,
				},
			};
		},
	}),
	passive: {
		variables: defineChampionVariables<'TwistedFate', typeof ITwistedFate, 'passive'>()({
			known: {
				f1: [],
				f2: [],
			},
			calculate() {
				return {
					f1: { value: 0 },
					f2: { value: 0 },
				};
			},
			uninteresting: ['f1', 'f2'],
		}),
	},
} satisfies IChampionSpecific<'TwistedFate'>;
