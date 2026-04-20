import type { ISpecificComponents } from '~/utils/types';

export const EFFECT_COMPONENTS: Partial<Record<IEffectObjectName, ISpecificComponents>> = {
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.effect) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1 } = effectSpecific;

		EFFECT_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		// TODO if effect data will have multiple values, this needs to be changed as it only sets the first value. same with `DamageSource.computeAppliedEffect`, it works only on first value
		EFFECT_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= maxValue > 1
			? await numberExtra(abilityId, 0, label, minValue, maxValue)
			: await booleanExtra(abilityId, 0, label);
	}
}
