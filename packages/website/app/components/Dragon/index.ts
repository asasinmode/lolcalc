import type { IDragonName } from '@lolcalc/data/types';
import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { DRAGON_SPECIFICS } from '@lolcalc/core/specifics/dragon';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { AbilityType } from '@lolcalc/shared/index';

export const DRAGON_COMPONENTS: Partial<Record<IDragonName, { stack?: ISpecificComponents; soul?: ISpecificComponents }>> = {
	Cloud: {
		stack: {
			extras: await booleanExtra(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'stack'), 'isOOC', 'is out of combat', false),
		},
		soul: {
			extras: [
				await booleanExtra(GameAbilityId.build(AbilityType.dragon, 'Cloud', 'soul'), 'hasUlted', 'bonus ms after ult'),
			],
		},
	},
	Hextech: {
		soul: {
			extras: await progressExtra(GameAbilityId.build(AbilityType.dragon, 'Hextech', 'soul'), 'hextechTagged', 'apply lightning slow on target', DRAGON_SPECIFICS.Hextech.soul.LIGHTNING_SLOW),
		},
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.dragon) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1, enumOptions, deriveProgressValue } = effectSpecific;

		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id]![effectSpecific.sourceAbility.subtype] ??= {};
		DRAGON_COMPONENTS[effectSpecific.sourceAbility.id]![effectSpecific.sourceAbility.subtype]!.effects
			??= enumOptions
				? await enumExtra(abilityId, 0, label, Object.fromEntries(Object.entries(enumOptions).map(([key, value]) => [value, key])))
				: deriveProgressValue
					? await progressExtra(abilityId, 0, label, deriveProgressValue)
					: maxValue !== 1
						? await numberExtra(abilityId, 0, label, minValue, maxValue)
						: await booleanExtra(abilityId, 0, label, false);
	}
}

for (const key in DRAGON_COMPONENTS) {
	const { stack, soul } = DRAGON_COMPONENTS[key as keyof typeof DRAGON_COMPONENTS]!;
	if (stack) {
		stack.extras && (Array.isArray(stack.extras) ? stack.extras.forEach(component => markRaw(component)) : markRaw(stack.extras));
		stack.effects && (Array.isArray(stack.effects) ? stack.effects.forEach(component => markRaw(component)) : markRaw(stack.effects));
	}
	if (soul) {
		soul.extras && (Array.isArray(soul.extras) ? soul.extras.forEach(component => markRaw(component)) : markRaw(soul.extras));
		soul.effects && (Array.isArray(soul.effects) ? soul.effects.forEach(component => markRaw(component)) : markRaw(soul.effects));
	}
}
