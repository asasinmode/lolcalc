import type { ISpecificComponents } from '~/utils/types';
import { ChampionExtrasAphelios } from '#components';

export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	Amumu: {
		extras: booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'internal', 'Amumu', 'passive', 0), 'applyPassive', 'Cursed Touch'),
		effects: booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'effects', 'Amumu', 'passive', 0), 0, 'Cursed Touch'),
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
	Veigar: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'internal', 'Veigar', 'passive', 0), 'passiveStacks', 'Phenomenal Evil stacks'),
	},
};
