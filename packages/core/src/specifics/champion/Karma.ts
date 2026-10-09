import type IKarma from '@lolcalc/data/files/champion/Karma.json';

import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		self.abilityLevels.value.r ||= 1;
		return {} as never;
	},
	variables: defineChampionVariables<'Karma', typeof IKarma>()({
		known: {
			IsEmpowered: [0, 1],
		},
		calculate() {
			return {
				IsEmpowered: {
					value: 0,
				},
			};
		},
	}),
} satisfies IChampionSpecific<'Karma'>;
