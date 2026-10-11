import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type ILissandra from '@lolcalc/data/files/champion/Lissandra.json';
import type { IChampion } from '@lolcalc/data/types.js';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			applyZombieSlow: clamp(0, Math.round(self.internalData.value.applyZombieSlow ?? 0), 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Lissandra', typeof ILissandra, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
			},
			uninteresting: ['MoveSpeedMod', 'ExplosionDelay'],
		}),
		calculateSlow(champion: IChampion) {
			const slow = championAbilityVariableValue('MoveSpeedMod', {
				abilityKey: 'passive',
				abilityVariant: champion.abilities.passive.variants[0]!,
			});

			if (typeof slow.value === 'number') {
				return slow.value * -1;
			} else {
				console.warn('[CHAMPION_SPECIFICS lissandra] failed to calculate passive slow', slow);
				return Number.NaN;
			}
		},
	},
} satisfies IChampionSpecific<'Lissandra'>;
