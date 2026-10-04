import type IMel from '@lolcalc/data/files/champion/Mel.json';
import type { IChampionSpecific } from '../champion.ts';
import { calculatesFromPartExtendedEquals, championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
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
			uninteresting: ['MinionModTooltip' as any, 'PassiveBonusMissiles', 'MaxPassiveBonusMissiles', 'OverwhelmDuration'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Mel', typeof IMel, 'q'>()({
			meta: {
				InitialExplosionDamage: {
					type: VariableType.magic,
				},
				TotalExplosionDamage: {
					type: VariableType.magic,
				},
				AllDamageHit: {
					type: VariableType.magic,
					scalesWithStatIcon: undefined,
					/* on patch 26.19 different from what the game shows `= (60 const + (0.55 %i:ap%) + 29.5 const)` but I think it's better */
					extendedEquals(variableValueParams) {
						const projectiles = championAbilityVariableValue('ExplosionCount', variableValueParams);
						const base = championAbilityVariableValue('InitialExplosionDamage', variableValueParams);
						const followup = championAbilityVariableValue('TotalExplosionDamage', variableValueParams);
						const projectilesCount = (projectiles.value as number) - 1;

						const constPart = (base.calculatesFrom?.[0]?.value as number) + (followup.calculatesFrom?.[0]?.value as number) * projectilesCount;
						const apPart = (base.calculatesFrom?.[1]?.value as number) + (followup.calculatesFrom?.[1]?.value as number) * projectilesCount;

						return `${calculatesFromPartExtendedEquals({ value: constPart, stat: 'const' })} + ${calculatesFromPartExtendedEquals({ value: apPart, stat: 'abilityPower', isPercentage: true })}`;
					},
				},
			},
			uninteresting: ['ExplosionCount'],
		}),
	},
} satisfies IChampionSpecific<'Mel'>;
