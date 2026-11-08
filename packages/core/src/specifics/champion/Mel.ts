import { calculatesFromPartExtendedEquals, championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IMel from '@lolcalc/data/files/champion/Mel.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'passive'>()({
			meta: {
				PassiveFlatDamage: {
					type: VariableType.magic,
				},
				PassiveStackDamage: {
					type: VariableType.magic,
				},
				PassiveBonusMissileDamage: {
					type: VariableType.magic,
				},
			},
			/* minion mod is from R */
			uninteresting: ['FlatMinionMod' as any, 'PassiveBonusMissiles', 'MaxPassiveBonusMissiles', 'OverwhelmDuration'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'q'>()({
			meta: {
				InitialDamage: {
					type: VariableType.magic,
				},
				SubsequentDamage: {
					type: VariableType.magic,
				},
				TotalDamageTT: {
					type: VariableType.magic,
					scalesWithStatIcon: undefined,
					/* on patch 26.19 different from what the game shows `= (60 const + (0.55 %i:ap%) + 29.5 const)` but I think it's better */
					extendedEquals(variableValueParams) {
						const projectiles = championAbilityVariableValue('Count', variableValueParams);
						const base = championAbilityVariableValue('InitialDamage', variableValueParams);
						const followup = championAbilityVariableValue('SubsequentDamage', variableValueParams);
						const projectilesCount = (projectiles.value as number) - 1;

						const constPart = (base.calculatesFrom?.[0]?.value as number) + (followup.calculatesFrom?.[0]?.value as number) * projectilesCount;
						const apPart = (base.calculatesFrom?.[1]?.value as number) + (followup.calculatesFrom?.[1]?.value as number) * projectilesCount;

						return `${calculatesFromPartExtendedEquals({ value: constPart, stat: 'const' })} + ${calculatesFromPartExtendedEquals({ value: apPart, stat: 'abilityPower', isPercentage: true })}`;
					},
				},
			},
			uninteresting: [],
		}),
	},
	w: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'w'>()({
			meta: {
				InitialDamage: {
					type: VariableType.magic,
				},
				SubsequentDamage: {
					type: VariableType.magic,
				},
				TotalShield: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['BuffDuration', 'MaxRetaliation'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'e'>()({
			meta: {
				RootDurationMin: {
					type: VariableType.affectedByTenacity,
				},
				RootDurationMax: {
					type: VariableType.affectedByTenacity,
				},
				Damage: {
					type: VariableType.magic,
				},
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				AreaDamagePerSecond: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MinionModTooltip'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'r'>()({
			meta: {
				PassiveFlatDamage: {
					type: VariableType.magic,
				},
				PassiveStackDamage: {
					type: VariableType.magic,
				},
				UltFlatDamage: {
					type: VariableType.magic,
				},
				UltStackDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Mel'>;
