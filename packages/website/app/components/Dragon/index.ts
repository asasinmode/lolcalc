import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { DRAGON_SPECIFICS } from '@lolcalc/core/specifics/dragon';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import type { IDragonName } from '@lolcalc/data/types';
import { AbilityType } from '@lolcalc/shared/index';
import type { ISpecificComponents } from '~/utils/types';

export const DRAGON_COMPONENTS: Partial<Record<IDragonName, { stack?: ISpecificComponents; soul?: ISpecificComponents }>> = {
	Cloud: {
		stack: {
			config: booleanConfigEl(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'stack'), 'isOOC', 'is out of combat', false),
		},
		soul: {
			config: booleanConfigEl(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'soul'), 'hasUlted', 'bonus ms after ult'),
		},
	},
	Hextech: {
		soul: {
			config: progressConfigEl(GameAbilityId.build(AbilityType.dragon, 'Hextech', 'soul'), 'hextechTagged', 'apply lightning slow on target', DRAGON_SPECIFICS.Hextech.soul.extraDerivedValue),
		},
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.dragon) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1, enumOptions, deriveProgressValue } = effectSpecific;

		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id]![effectSpecific.sourceAbility.subtype] ??= {};
		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id]![effectSpecific.sourceAbility.subtype]!.effects ??= {};
		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id]![effectSpecific.sourceAbility.subtype]!.effects![effectObjectName] = enumOptions
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
					})
				: maxValue !== 1
					? numberConfigEl(abilityId, 0, label, minValue, maxValue)
					: booleanConfigEl(abilityId, 0, label, false);
	}
}

for (const key in DRAGON_COMPONENTS) {
	const { stack, soul } = DRAGON_COMPONENTS[key as keyof typeof DRAGON_COMPONENTS]!;
	if (stack) {
		stack.config && (Array.isArray(stack.config) ? stack.config.forEach((component) => markRaw(component)) : markRaw(stack.config));
		if (stack.effects) {
			for (const key in stack.effects) {
				markRaw(stack.effects[key]!);
			}
		}
	}
	if (soul) {
		soul.config && (Array.isArray(soul.config) ? soul.config.forEach((component) => markRaw(component)) : markRaw(soul.config));
		if (soul.effects) {
			for (const key in soul.effects) {
				markRaw(soul.effects[key]!);
			}
		}
	}
}
