import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import type { EffectObjectName } from '@lolcalc/shared';
import { AbilityType } from '@lolcalc/shared';

export const EFFECT_COMPONENTS: Partial<Record<EffectObjectName, Component>> = {};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.effect) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue, maxValue, enumOptions, deriveProgressValue } = effectSpecific;

		EFFECT_COMPONENTS[effectSpecific.sourceAbility.id] = enumOptions
			? enumConfigEl(
					abilityId,
					0,
					label,
					Object.entries(enumOptions).map(([key, value]) => [value, key]),
				)
			: deriveProgressValue
				? progressConfigEl(abilityId, 0, label, deriveProgressValue, {
						selectEffectSourceProps: effectSpecific.sourceControls,
						effectControlsProps: effectSpecific.effectControls,
						derivedSymbolSuffix: effectSpecific.progressComponentSymbol,
						onUpdate: effectSpecific.onValueUpdate,
					})
				: minValue !== undefined || maxValue !== undefined
					? numberConfigEl(abilityId, 0, label, minValue, maxValue, undefined, {
							onUpdate: effectSpecific.onValueUpdate,
							effectControlsProps: effectSpecific.effectControls,
						})
					: booleanConfigEl(abilityId, 0, label, false, undefined, effectSpecific.componentTooltip, { onUpdate: effectSpecific.onValueUpdate, selectEffectSourceProps: effectSpecific.sourceControls });
	}
}

for (const key in EFFECT_COMPONENTS) {
	markRaw(EFFECT_COMPONENTS[key as keyof typeof EFFECT_COMPONENTS]!);
}
