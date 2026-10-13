import { championAbilityVariableValue } from '@lolcalc/core/variables/game.ts';
import type IPoppy from '@lolcalc/data/files/champion/Poppy.json';
import { VariableType } from '@lolcalc/shared';
import { clamp } from '@lolcalc/shared/utils.ts';
import type { IChampionSpecific } from '../champion.ts';
import { defineChampionVariables } from './shared.ts';

export default {
	setupData(self) {
		return {
			isPassiveActive: clamp(0, self.internalData.value.isPassiveActive ?? 0, 1),
		};
	},
	passive: {
		variables: defineChampionVariables<'Poppy', typeof IPoppy, 'passive'>()({
			meta: {
				TotalDamage: {
					type: VariableType.magic,
				},
				ShieldValue: {
					type: VariableType.shield,
				},
			},
			uninteresting: ['BonusRange'],
		}),
	},
	calculateHooks: {
		postInit: {
			handler(self, { championPassiveStats }) {
				if (self.internalData.value.isPassiveActive) {
					const attackRange = championAbilityVariableValue('BonusRange', {
						abilityKey: 'passive',
						abilityVariant: self.champion.value!.abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
					});
					if (typeof attackRange.value === 'number') {
						championPassiveStats.attackRange = attackRange.value;
					} else {
						console.warn('[CHAMPION_SPECIFICS poppy] failed to calculate passive attack range', attackRange);
					}
				}
			},
		},
	},
} satisfies IChampionSpecific<'Poppy'>;
