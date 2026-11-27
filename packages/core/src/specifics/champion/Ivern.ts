import { linkedFormattedItemImage } from '@lolcalc/core/misc.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { STAT_ICON } from '@lolcalc/data';
import type IIvern from '@lolcalc/data/files/champion/Ivern.json';
import { VariableType } from '@lolcalc/shared';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	passive: {
		variables: defineChampionVariables<'Ivern', typeof IIvern, 'passive'>()({
			known: {
				SpellModifierDescriptionAppend: [''],
			},
			calculate() {
				return {
					SpellModifierDescriptionAppend: { value: '' },
				};
			},
			uninteresting: ['SpellModifierDescriptionAppend'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Ivern', typeof IIvern, 'q'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				RootDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
		}),
	},
	w: {
		calculateCd(_value, cdr, abilityVariant, abilityLevel) {
			let rv = Number.NaN;

			const cd = abilityVariant.ammoRechargeTime?.[abilityLevel || 1];
			if (typeof cd === 'number') {
				rv = cd * cdr;
			} else {
				console.warn('[CHAMPION_SPECIFICS ivern] failed to calculate W cd', cd);
			}

			return rv;
		},
		variables: defineChampionVariables<'Ivern', typeof IIvern, 'w'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				TotalAllyDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['BuffDuration', 'AllyBuffDuration', 'RevealDuration', 'MaxBrushDuration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Ivern', typeof IIvern, 'e'>()({
			meta: {
				TotalShield: {
					type: VariableType.shield,
				},
				TotalDamage: {
					type: VariableType.magic,
				},
				Slow: {
					type: VariableType.affectedBySlowResist,
				},
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
			},
			uninteresting: ['ShieldDuration'],
		}),
	},
	r: {
		variables: defineChampionVariables<'Ivern', typeof IIvern, 'r'>()({
			known: {
				DaisyTotalBasicAttackDamage: [],
			},
			calculate(self) {
				return {
					DaisyTotalBasicAttackDamage: championAbilityVariableValue('TotalDaisyAD', { abilityKey: 'r', abilityVariant: self.champion.value!.abilities.q.variants[0]!, damageSource: self }),
				};
			},
			meta: {
				TotalShockwaveDamage: {
					type: VariableType.magic,
				},
				DaisyTotalBasicAttackDamage: {
					isCustom: true,
					type: VariableType.physical,
					additionalInfo: `This row is just <var>TotalDaisyAD</var> but affected by the <i>column target's</i> <scalearmor>armor</scalearmor>. To compare Daisy's total basic attack damage, try adding it to the <b>custom total</b> results section with Ivern's total <onhit>%i:${STAT_ICON.OnHit}% On-Hit</onhit> damage from the <b>basic attack</b> results section.<br> <rules>No attempt at DPS since it doesn't really make sense with her pausing every 3rd hit to shockwave</rules>`,
				},
			},
			uninteresting: ['DaisyDuration', 'ShockwaveCCDuration', 'ShockwaveCD'],
		}),
	},
} satisfies IChampionSpecific<'Ivern'>;
