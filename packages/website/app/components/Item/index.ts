import ItemExtrasHubris from './ItemExtrasHubris.vue';

/**
 * any item-related components
 */
export const ITEM_COMPONENTS: Record<string, { extras?: Component }> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: ItemExtrasHubris,
	},
};
