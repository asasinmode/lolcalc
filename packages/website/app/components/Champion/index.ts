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

for (const [championId, championSpecific] of Object.entries(CHAMPION_SPECIFICS) as [IChampionId, IChampionSpecific][]) {
	for (const abilityKey of ALL_CHAMPION_ABILITY_KEYS) {
		if (abilityKey in championSpecific) {
			const abilitySpecific = championSpecific[abilityKey]!;
			for (const [rawVariantIndex, variantSpecific] of Object.entries(abilitySpecific) as [PropertyKey, IChampionAbilityVariantSpecific][]) {
				if ('setupEffectData' in variantSpecific) {
					const abilityVariantIndex = Number(rawVariantIndex);

					const abilityId = GameAbilityId.build(ABILITY_TYPE.champion, championId, abilityKey, abilityVariantIndex);
					const { effectMin, effectMax, effectLabel } = variantSpecific as IDamageSourceEffectProvider;

					CHAMPION_COMPONENTS[championId] ??= {};
					CHAMPION_COMPONENTS[championId].effects ??= (variantSpecific.effectMax ?? 1) > 1
						? await numberExtra(abilityId, 0 as never, effectLabel, effectMin ?? 0, effectMax)
						: await booleanExtra(abilityId, 0 as never, effectLabel);
				}
			}
		}
	}
}
