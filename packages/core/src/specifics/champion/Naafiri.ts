import type { DamageSource } from '@lolcalc/core/DamageSource.ts';
import type INaafiri from '@lolcalc/data/files/champion/Naafiri.json';
import type { ComputedRef } from 'vue';
import type { IChampionSpecific } from '../champion.ts';
import { championAbilityVariableValue, VARIABLE_CALCULATION_FNS } from '@lolcalc/core/variables/game.ts';
import { clamp } from '@lolcalc/shared/utils.ts';
import { computed, watch } from 'vue';

function passiveMaxStacks(self: DamageSource<'Naafiri'>): ComputedRef<number> {
	return computed((): number => self.champion.value
		? ((VARIABLE_CALCULATION_FNS.mFormulaParts(
				(self.champion.value as typeof INaafiri).abilities.passive.variants[0]!.spellCalculations.PackmateCap,
				{},
				{
					variableValueFn: championAbilityVariableValue,
					variableValueParams: {
						abilityKey: 'passive',
						abilityVariant: (self.champion.value as typeof INaafiri).abilities.passive.variants[0]!,
						allAbilitiesVariants: self.allAbilityVariants.value,
						damageSource: self,
					},
				},
			)?.value as number ?? 0)
			+ (self.champion.value! as typeof INaafiri).abilities.w.variants[0]!.dataValues.PackmatesToAdd[self.abilityLevels.value.w]!)
		: 0,
	);
}

export default {
	setupData(self) {
		const maxPassiveStacks: ComputedRef<number> = passiveMaxStacks(self);
		return {
			passiveStacks: clamp(0, Math.round(self.internalData.value.passiveStacks ?? 0), maxPassiveStacks.value),
			_watchHandles: [watch(self.level, () => {
				self.internalData.value.passiveStacks = Math.min(self.internalData.value.passiveStacks, maxPassiveStacks.value);
			})],
		};
	},
	passive: {
		maxStacks: passiveMaxStacks,
	},
} satisfies IChampionSpecific<'Naafiri'>;
