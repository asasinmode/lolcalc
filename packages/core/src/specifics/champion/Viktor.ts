import type IViktor from '@lolcalc/data/files/champion/Viktor.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

const passiveUpgradesMask = 2 ** 4;

export default {
	setupData(self) {
		let passiveAbilityUpgradesMask = clamp(0, Math.round(self.internalData.value.passiveAbilityUpgradesMask ?? 0), passiveUpgradesMask);

		/* unevolve R if not all basic are evolved */
		const rBit = 1 << 3;
		const notAllEvolved = (passiveAbilityUpgradesMask & (rBit - 1)) !== rBit - 1;
		if (notAllEvolved) {
			passiveAbilityUpgradesMask &= ~rBit;
		}

		return {
			passiveAbilityUpgradesMask,
		};
	},
	passive: {
		upgradesMask: passiveUpgradesMask,
		variables: defineChampionVariables<'Viktor', typeof IViktor, 'passive'>()({
			uninteresting: ['EvolutionStackBreakpoint', 'MinionStacks', 'CannonStacks', 'ChampionStacks'],
		}),
	},
	q: {
		variables: defineChampionVariables<'Viktor', typeof IViktor, 'q'>()({
			meta: {
				TotalMissileDamage: {
					type: VariableType.magic,
				},
				ShieldLevelScaling: {
					type: VariableType.shield,
				},
				AttackTotalDMG: {
					type: VariableType.magic,
				},
				TotalAugmentedShieldValue: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['BuffDuration', 'AugmentMoveSpeedBonus'],
		}),
	},
	w: {
		variables: defineChampionVariables<'Viktor', typeof IViktor, 'w'>()({
			meta: {
				SlowPotency: {
					type: VariableType.affectedBySlowResist,
				},
				StunDuration: {
					type: VariableType.affectedByTenacity,
				},
				AugmentSlow: {
					type: VariableType.affectedBySlowResist,
				},
			},
			uninteresting: ['FieldDuration'],
		}),
	},
	e: {
		variables: defineChampionVariables<'Viktor', typeof IViktor, 'e'>()({
			meta: {
				LaserDamage: {
					type: VariableType.magic,
				},
				AftershockDamage: {
					type: VariableType.magic,
				},
			},
		}),
	},
	r: {
		variables: defineChampionVariables<'Viktor', typeof IViktor, 'r'>()({
			meta: {
				InitialBurstDamage: {
					type: VariableType.magic,
				},
				SubsequentBurstDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['StormDuration', 'AugmentBoost', 'Tooltip_DurationExtension', 'MaxGrowths'],
		}),
	},
} satisfies IChampionSpecific<'Viktor'>;
