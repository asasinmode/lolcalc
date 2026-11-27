import { linkedFormattedItemImage } from '@lolcalc/core/misc.ts';
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
				DaisyTotalBasicAttackDPS: [],
			},
			calculate(self, target) {
				const DaisyTotalBasicAttackDamage = Number.NaN;
				const DaisyTotalBasicAttackDPS = Number.NaN;

				return {
					DaisyTotalBasicAttackDamage: {
						value: DaisyTotalBasicAttackDamage,
					},
					DaisyTotalBasicAttackDPS: {
						value: DaisyTotalBasicAttackDPS,
					},
				};
			},
			meta: {
				TotalShockwaveDamage: {
					type: VariableType.magic,
				},
				DaisyTotalBasicAttackDamage: {
					additionalInfo: `Daisy's <var>TotalDaisyAD</var> plus the <onhit>%i:${STAT_ICON.OnHit}% On-Hit</onhit>, damage from Ivern's items. Affected by the <i>column target's</i> resists`,
					isCustom: true,
					type: VariableType.physical,
				},
				DaisyTotalBasicAttackDPS: {
					isCustom: true,
					additionalInfo: `<var>DaisyTotalBasicAttackDamage</var> times Daisy's attack speed. Affected by ${linkedFormattedItemImage('frozenHeart', "Frozen Heart's")} <b>Winter's Caress</b> if Ivern is`,
				},
			},
			uninteresting: ['DaisyDuration', 'ShockwaveCCDuration', 'ShockwaveCD'],
		}),
	},
} satisfies IChampionSpecific<'Ivern'>;
