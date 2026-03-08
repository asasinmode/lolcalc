import ChampionExtrasVeigar from './ChampionExtrasVeigar.vue';

/**
 * same as `IWithPossibleDynamicValues` except for components
 */
export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, { extras?: Component }>> = {
	Veigar: {
		extras: ChampionExtrasVeigar,
	},
};
