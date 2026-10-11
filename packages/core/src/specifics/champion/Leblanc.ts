import type ILeblanc from '@lolcalc/data/files/champion/Leblanc.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	q: {
		variables: defineChampionVariables<'Leblanc', typeof ILeblanc, 'q'>()({
			meta: {
				Damage: {
					type: VariableType.magic,
				},
				MarkDamage: {
					type: VariableType.magic,
				},
				BonusMinionDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MarkDuration', 'ManaRefund', 'CooldownRefund'],
		}),
	},
	r: {
		omittedVariantObjectNames: ['LeblancRQ', 'LeblancRW', 'LeblancRE'],
	},
} satisfies IChampionSpecific<'Leblanc'>;
