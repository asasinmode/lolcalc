import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IRell from '@lolcalc/data/files/champion/Rell.json';
import type { IChampion } from '@lolcalc/data/types.js';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { EffectObjectName, VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Rell'>): number {
	return (self.champion.value as typeof IRell)?.abilities?.passive.variants[0]!.dataValues.MaxStacks[1]!;
}

function passiveStolenResists([stacks, totalArmor = 0, totalMR = 0]: [stacks: number, totalArmor?: number, totalMR?: number], champion: IChampion, level = 1): {
	stealPercent: number;
	stolenArmor: number;
	stolenMR: number;
} {
	const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: champion.abilities.passive.variants[0]!, damageSource: { level: { value: level } } as DamageSource };
	const minResistsSteal = championAbilityVariableValue('StealFloor', passiveParams);
	const stackStealPercent = championAbilityVariableValue('StealPercent', passiveParams);
	if (typeof minResistsSteal.value === 'number' && typeof stackStealPercent.value === 'number') {
		const minSteal = stacks * minResistsSteal.value;
		const stealPercent = stacks * stackStealPercent.value;
		return {
			stealPercent,
			stolenArmor: Math.max(minSteal, totalArmor * stealPercent),
			stolenMR: Math.max(minSteal, totalMR * stealPercent),
		};
	} else {
		console.warn('[CHAMPION_SPECIFICS rell] failed to calculate passive steal variables', minResistsSteal, stackStealPercent);
		return {
			stealPercent: Number.NaN,
			stolenArmor: Number.NaN,
			stolenMR: Number.NaN,
		};
	}
}

export default {
	setupData(self) {
		return {
			passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), passiveMaxStacks(self)),
		};
	},
	passive: {
		variables: defineChampionVariables<'Rell', typeof IRell, 'passive'>()({
			known: {
				ResistsStealPercent: [],
				StolenArmor: [],
				StolenMagicResist: [],
			},
			calculate(self, target) {
				return {
					ResistsStealPercent: {
						value: self.effectsOntoTargetVars.value.rellPResistsStealPercent ?? 0,
					},
					StolenArmor: {
						value: (self.internalData.value.passiveStacksOnTarget && target?.stats.value.effectVars.rellPArmorStolen) ?? 0,
					},
					StolenMagicResist: {
						value: (self.internalData.value.passiveStacksOnTarget && target?.stats.value.effectVars.rellPMRStolen) ?? 0,
					},
				};
			},
			meta: {
				OnHitDamage: {
					type: VariableType.magic,
				},
				ResistsStealPercent: {
					isCustom: true,
					resultsIsPercentage: true,
					resultsMultiplier: 100,
				},
				StolenArmor: {
					isCustom: true,
				},
				StolenMagicResist: {
					isCustom: true,
				},
			},
			uninteresting: ['StealPercent', 'ShredDuration', 'MaxPercentTooltipOnly'],
		}),
		maxStacks: passiveMaxStacks,
		stolenResists: passiveStolenResists,
	},
	effectOntoTargetVars(self, vars) {
		const { passiveStacksOnTarget } = self.internalData.value;
		const stealPercent = championAbilityVariableValue('StealPercent', { abilityKey: 'passive', abilityVariant: self.champion.value!.abilities.passive.variants[0]! });
		if (typeof stealPercent.value === 'number') {
			vars.rellPResistsStealPercent = passiveStacksOnTarget * stealPercent.value;
		} else {
			console.warn('[CHAMPION_SPECIFICS rell] failed to calculate passive resists steal percent', stealPercent);
		}
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				if (!self.internalData.value.passiveStacksOnTarget) {
					return;
				}
				const targetEffect = self.calculationDamageTarget.value?.getEffect(EffectObjectName.rellPBreakMold)?.[0];
				if (!targetEffect) {
					return;
				}

				const { stolenArmor, stolenMR } = passiveStolenResists(targetEffect.data.value, self.champion.value!, self.level.value);
				championPassiveStats.armor = stolenArmor;
				championPassiveStats.magicResist = stolenMR;
			},
		},
	},
} satisfies IChampionSpecific<'Rell'>;
