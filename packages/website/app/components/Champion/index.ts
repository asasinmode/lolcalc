import type { ISpecificComponents } from '~/utils/types';
import { ChampionExtrasAphelios } from '#components';

export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	Ambessa: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Ambessa', 'passive', 0), 'hasPassiveStack', 'passive stack', false, 'has'),
	},
	Amumu: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0), 'applyPassive', 'Cursed Touch', true),
	},
	Anivia: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Anivia', 'passive', 0), 'isEgg', 'egg', false, 'is'),
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
	AurelionSol: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'AurelionSol', 'passive', 0), 'passiveStacks', 'Cosmic Creator stacks'),
	},
	Bard: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Bard', 'passive', 0), 'passiveStacks', 'Chimes'),
	},
	Belveth: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Belveth', 'passive', 0), 'passiveStacks', 'Lavender stacks'),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Belveth', 'passive', 0), 'hasPassiveStack', 'passive stack (from using ability)', false, 'has'),
		],
	},
	Veigar: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Veigar', 'passive', 0), 'passiveStacks', 'Phenomenal Evil stacks'),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.champion) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1 } = effectSpecific;

		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		// TODO if effect data will have multiple values, this needs to be changed as it only sets the first value. same with `DamageSource.computeAppliedEffect`, it works only on first value
		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= maxValue > 1
			? await numberExtra(abilityId, 0, label, minValue, maxValue)
			: await booleanExtra(abilityId, 0, label);
	}
}
