import type { ISpecificComponents } from '~/utils/types';
import { ChampionExtrasAphelios, ChampionExtrasVeigar } from '#components';
import { booleanExtra } from '#imports';

/**
 * same as `IWithPossibleDynamicValues` except for components
 */
export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	Amumu: {
		effects: booleanExtra('Amumu', [GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0), 0], 'Cursed Touch'),
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
	Veigar: {
		extras: ChampionExtrasVeigar,
		// extras: numberExtra('Veigar', 'veigarP'),
	},
};
