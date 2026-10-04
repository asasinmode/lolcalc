import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type { IGameVariableValueParameters } from '@lolcalc/core/variables/game.ts';
import type IAshe from '@lolcalc/data/files/champion/Ashe.json';
import type { IChampion } from '@lolcalc/data/types.ts';
import type { IChampionSpecific } from '../champion.ts';
import type { IDeriveProgressFn } from '../index.ts';
import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import { defineChampionVariables } from './shared.ts';

function calculatePassiveSlow(champion: IChampion, progress: number, level: number) {
	const passiveParams: IGameVariableValueParameters['championAbility'] = { abilityKey: 'passive', abilityVariant: champion.abilities.passive.variants[0]!, damageSource: { level: { value: level } } as DamageSource };
	const minSlow = championAbilityVariableValue('SlowAmount', passiveParams);
	const maxSlow = championAbilityVariableValue('EmpoweredSlowAmount', passiveParams);

	if (typeof minSlow.value === 'number' && typeof maxSlow.value === 'number') {
		return progress === 1
			? minSlow.value
			: progress
				? (minSlow.value + (maxSlow.value - minSlow.value) * progress / 100)
				: 0;
	}

	console.warn('[CHAMPION_SPECIFICS ashe] failed to calculate passive slow vars', minSlow, maxSlow);
	return Number.NaN;
}

export default {
	setupData(self) {
		return {
			frostShot: clamp(0, Math.round(self.internalData.value.frostShot ?? 0), 100),
		};
	},
	passive: {
		derivedSlow: ((progress, self): number => {
			return (self?.effectsOntoTargetVars.value.ashePSlow ?? calculatePassiveSlow(self.champion.value!, progress, self.level.value)) * 100;
		}) satisfies IDeriveProgressFn,
		calculateSlow: calculatePassiveSlow,
		variables: defineChampionVariables<'Ashe', typeof IAshe, 'passive'>()({
			meta: {
				SlowDuration: {
					type: VariableType.affectedByTenacity,
				},
				SlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				EmpoweredSlowAmount: {
					type: VariableType.affectedBySlowResist,
				},
				DamageBonus: {
					type: VariableType.physical,
				},
			},
		}),
	},
} satisfies IChampionSpecific<'Ashe'>;
