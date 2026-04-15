import type { ISpecificComponents } from '~/utils/types';
import { ChampionExtrasAphelios } from '#components';

export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	Amumu: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0), 'applyPassive', 'Cursed Touch', true),
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
	Veigar: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Veigar', 'passive', 0), 'passiveStacks', 'Phenomenal Evil stacks'),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.champion) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, maxValue, minValue } = effectSpecific;

		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		// TODO if effect data will have multiple values, this needs to be changed as it only sets the first value. same with `DamageSource.computeAppliedEffect`, it works only on first value
		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= (maxValue ?? 1) > 1
			? await numberExtra(abilityId, 0, label, maxValue ?? 0, minValue)
			: await booleanExtra(abilityId, 0, label);
	}
}
