import type IKhazix from '@lolcalc/data/files/champion/Khazix.json';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

const rEvolvesMask = 2 ** 4;

export default {
	setupData(self) {
		return {
			rEvolvesMask: clamp(0, Math.round(self.internalData.value.rEvolvesMask ?? 0), rEvolvesMask),
		};
	},
	q: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask ^ 0,
					},
				};
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask ^ 0,
					},
				};
			},
		}),
	},
	e: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask ^ 0,
					},
				};
			},
		}),
	},
	r: {
		evolvesMask: rEvolvesMask,
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask ^ 0,
					},
				};
			},
		}),
	},
} satisfies IChampionSpecific<'Khazix'>;
