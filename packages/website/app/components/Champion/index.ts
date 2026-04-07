import { ChampionExtrasAphelios, ChampionExtrasVeigar } from '#components';

/**
 * same as `IWithPossibleDynamicValues` except for components
 */
export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, { extras?: Component }>> = {
	Veigar: {
		extras: ChampionExtrasVeigar,
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
};
