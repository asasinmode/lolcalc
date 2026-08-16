import type { IEffectObjectName } from '@lolcalc/shared';
import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { AbilityType } from '@lolcalc/shared';

export const EFFECT_COMPONENTS: Partial<Record<IEffectObjectName, ISpecificComponents>> = {
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.effect) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue, maxValue, enumOptions } = effectSpecific;

		EFFECT_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		EFFECT_COMPONENTS[effectSpecific.sourceAbility.id]!.effects
			??= enumOptions
				? await enumExtra(abilityId, 0, label, Object.fromEntries(Object.entries(enumOptions).map(([key, value]) => [value, key])))
				: minValue !== undefined || maxValue !== undefined
					? await numberExtra(abilityId, 0, label, minValue, maxValue, undefined, { onUpdate: effectSpecific.onValueUpdate })
					: await booleanExtra(abilityId, 0, label, false, undefined, undefined, { onUpdate: effectSpecific.onValueUpdate });
	}
}

for (const key in EFFECT_COMPONENTS) {
	const { extras, effects } = EFFECT_COMPONENTS[key as keyof typeof EFFECT_COMPONENTS]!;
	extras && (Array.isArray(extras) ? extras.forEach(component => markRaw(component)) : markRaw(extras));
	effects && (Array.isArray(effects) ? effects.forEach(component => markRaw(component)) : markRaw(effects));
}
