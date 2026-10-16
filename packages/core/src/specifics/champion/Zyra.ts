import type IZyra from '@lolcalc/data/files/champion/Zyra.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Zyra', typeof IZyra, 'passive'>()({
			meta: {
				PlantDamage: {
					type: VariableType.magic,
				},
				MonsterMod: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Zyra'>;
