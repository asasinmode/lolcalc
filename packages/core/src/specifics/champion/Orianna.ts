import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { championAbilityVariableValue, type IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IOrianna from '@lolcalc/data/files/champion/Orianna.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

function passiveMaxStacks(self: DamageSource<'Orianna'>): number {
	return (self.champion.value! as typeof IOrianna).abilities.passive.variants[0]!.dataValues.StackCount[1]!;
}

export default {
	setupData(self) {
		return {
			passiveStacksOnTarget: clamp(0, Math.round(self.internalData.value.passiveStacksOnTarget ?? 0), passiveMaxStacks(self)),
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
		variables: defineChampionVariables<'Orianna', typeof IOrianna, 'passive'>()({
			known: {
				WithStacksDamage: [],
			},
			calculate(self) {
				let WithStacksDamage = Number.NaN;

				const passiveParams: IGameVariableValueParameters['championAbility'] = {
					abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
					abilityKey: 'passive',
					damageSource: self,
				};
				const baseDamage = championAbilityVariableValue('TotalDamage', passiveParams);
				const stackDamage = championAbilityVariableValue('StackDamage', passiveParams);
				if (typeof baseDamage.value === 'number' && typeof stackDamage.value === 'number') {
					WithStacksDamage = baseDamage.value + stackDamage.value * self.internalData.value.passiveStacksOnTarget;
				} else {
					console.warn('[CHAMPION_SPECIFICS orianna] failed to calculate passive damage', baseDamage, stackDamage);
				}

				return {
					WithStacksDamage: {
						value: WithStacksDamage,
					},
				};
			},
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				StackDamage: {
					type: VariableType.magic,
				},
				StackDamageMax: {
					type: VariableType.magic,
				},
				WithStacksDamage: {
					isCustom: true,
					type: VariableType.magic,
				},
			},
			uninteresting: ['StackDuration'],
		}),
	},
} satisfies IChampionSpecific<'Orianna'>;
