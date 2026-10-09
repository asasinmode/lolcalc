import type ICaitlyn from '@lolcalc/data/files/champion/Caitlyn.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Caitlyn', typeof ICaitlyn, 'passive'>()({
			meta: {
				HeadShotBonusDamage: {
					type: VariableType.physical,
				},
				HeadshotBonusDamage: {
					type: VariableType.physical,
				},
				HeadShotMinionBonusDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['AttacksPerHeadshot', 'BrushAttackTotal'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Caitlyn', typeof ICaitlyn, 'q'>()({
			meta: {
				InitialDamage: {
					type: VariableType.physical,
				},
				SecondaryDamage: {
					type: VariableType.physical,
				},
			},
		}),
	},
	w: {
		variables: defineChampionVariables<'Caitlyn', typeof ICaitlyn, 'w'>()({
			meta: {
				RootDuration: {
					type: VariableType.affectedByTenacity,
				},
				HeadshotBonusDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: [],
		}),
	},
	e: {
		variables: defineChampionVariables<'Caitlyn', typeof ICaitlyn, 'e'>()({
			meta: {
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				NetDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Caitlyn', typeof ICaitlyn, 'r'>()({
			meta: {
				RTotalDamage: {
					type: VariableType.physical,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Caitlyn'>;
