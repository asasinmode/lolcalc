import type IKhazix from '@lolcalc/data/files/champion/Khazix.json';
import { VariableType } from '@lolcalc/shared';
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
	passive: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'passive'>()({
			meta: {
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				TotalDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	q: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'q'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask & 1 ? 1 : 0,
					},
				};
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'w'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask & 2 ? 1 : 0,
					},
				};
			},
		}),
	},
	e: {
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'e'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask & 4 ? 1 : 0,
					},
				};
			},
		}),
	},
	r: {
		evolvesMask: rEvolvesMask,
		variables: defineChampionVariables<'Khazix', typeof IKhazix, 'r'>()({
			known: {
				IsEvolved: [0, 1],
			},
			calculate(self) {
				return {
					IsEvolved: {
						value: self.internalData.value.rEvolvesMask & 8 ? 1 : 0,
					},
				};
			},
		}),
	},
} satisfies IChampionSpecific<'Khazix'>;
