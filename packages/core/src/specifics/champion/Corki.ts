import type ICorki from '@lolcalc/data/files/champion/Corki.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Corki', typeof ICorki, 'passive'>()({
			meta: {
				BasicAttackTOOLTIP: {
					type: VariableType.true,
				},
				CriticalStrikeTOOLTIP: {
					type: VariableType.true,
				},
			},
			uninteresting: ['AttackConversion'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Corki', typeof ICorki, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['RevealDuration'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Corki', typeof ICorki, 'w'>()({
			meta: {
				MaximumDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['TrailDuration'],
		}),
	},
	e: {
		// TODO shred effect Gatling Gun (x4) This unit's Armor and Magic Resist are reduced.
		variables: defineChampionVariables<'Corki', typeof ICorki, 'e'>()({
			TotalDamage: {
				type: VariableType.physical,
			},
			uninteresting: ['SprayDuration', 'ShredDuration'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Corki', typeof ICorki, 'r'>()({
			meta: {
				RSmallMissileDamage: {
					type: VariableType.physical,
				},
				RBigMissileDamage: {
					type: VariableType.physical,
				},
			},
			uninteresting: ['MaxAmmoTOOLTIP'],
		}),
	},
} satisfies IChampionSpecific<'Corki'>;
