import { ItemExtrasTerminus } from '#components';

/**
 * any item-related components
 */
export const ITEM_COMPONENTS: Record<string, { extras?: Component }> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: numberExtra(ITEM_NAME_TO_ID.hubris, 'eminence', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		extras: numberExtra(ITEM_NAME_TO_ID.darkSeal, 'glory', 'Glory stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		extras: numberExtra(ITEM_NAME_TO_ID.mejai, 'glory', 'Glory stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		extras: numberExtra(ITEM_NAME_TO_ID.hauntingGuise, 'madness', 'Madness stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.roa]: {
		extras: numberExtra(ITEM_NAME_TO_ID.roa, 'eternity', 'Eternity stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		extras: numberExtra(ITEM_NAME_TO_ID.blackfireTorch, 'bBlaze', 'Balefully blazing'),
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		extras: numberExtra(ITEM_NAME_TO_ID.heartsteel, 'cConsumption', 'Colossal consumption'),
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		extras: numberExtra(ITEM_NAME_TO_ID.guinsoo, 'seething', 'Seething strikes stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.terminus]: {
		extras: ItemExtrasTerminus,
	},
	[ITEM_NAME_TO_ID.liandry]: {
		extras: numberExtra(ITEM_NAME_TO_ID.liandry, 'madness', 'Suffering stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		extras: numberExtra(ITEM_NAME_TO_ID.yunTal, 'practice', 'Practice stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.shojin]: {
		extras: numberExtra(ITEM_NAME_TO_ID.shojin, 'fWill', 'Focused will stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		extras: numberExtra(ITEM_NAME_TO_ID.riftmaker, 'corruption', 'Corruption stacks', 0, 4),
	},
};
