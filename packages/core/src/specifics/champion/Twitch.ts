import type ITwitch from '@lolcalc/data/files/champion/Twitch.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Twitch', typeof ITwitch, 'passive'>()({
			meta: {
				DamagePerSecond: {
					type: VariableType.true,
				},
				DamagePerSecondMax: {
					type: VariableType.true,
				},
			},
			uninteresting: ['Duration', 'MaxStacks'],
		}),
	},
} satisfies IChampionSpecific<'Twitch'>;
