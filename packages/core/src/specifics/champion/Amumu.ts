import type IAmumu from '@lolcalc/data/files/champion/Amumu.json';
import type { IChampionSpecific } from '../champion.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			applyPassive: clamp(0, Math.round(self.internalData.value.applyPassive ?? 0), 1),
		};
	},
	r: {
		variables: defineChampionVariables<'Amumu', typeof IAmumu, 'r'>()({
			meta: {
				RCalculatedDamage: {
					type: VariableType.magic,
				},
				RDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Amumu'>;
