import type { ISpecificComponents } from '~/utils/types';
import { ItemExtrasTerminus, ItemExtraTearItem } from '#components';

export const ITEM_COMPONENTS: Record<string, ISpecificComponents> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.hubris), 'eminence', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.darkSeal), 'glory', 'Glory stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.mejai), 'glory', 'Glory stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.hauntingGuise), 'madness', 'Madness stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.roa]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.roa), 'eternity', 'Eternity stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.blackfireTorch), 'bBlaze', 'Balefully blazing'),
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.heartsteel), 'cConsumption', 'Colossal consumption'),
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.guinsoo), 'seething', 'Seething strikes stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.terminus]: {
		extras: ItemExtrasTerminus,
	},
	[ITEM_NAME_TO_ID.liandry]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.liandry), 'madness', 'Suffering stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.yunTal), 'practice', 'Practice stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.shojin]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.shojin), 'fWill', 'Focused will stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.riftmaker), 'corruption', 'Corruption stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.tear]: {
		extras: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.tear), 'manaflow', 'Manaflow stacks', 0, 360, 3),
	},
	[ITEM_NAME_TO_ID.whisperingCirclet]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.diademOfSongs]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.archangelsStaff]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.seraphsEmbrace]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.manamune]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.muramana]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.wintersApproach]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.fimbulwinter]: {
		extras: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.trinity]: {
		extras: booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.trinity), 'quicken', 'Quicken'),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		effects: numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'effects', ITEM_NAME_TO_ID.blackCleaver), 0, 'Carve stacks', 0, 5),
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		effects: booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, 'effects', ITEM_NAME_TO_ID.shurelya), 0, 'Inspiring speech'),
	},
};
