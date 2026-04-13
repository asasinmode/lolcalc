import type { ISpecificComponents } from '~/utils/types';
import { ItemExtraTearItem } from '#components';

export const ITEM_COMPONENTS: Record<string, ISpecificComponents> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.hubris), 'eminence', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.darkSeal), 'glory', 'Glory stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.mejai), 'glory', 'Glory stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.hauntingGuise), 'madness', 'Madness stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.roa]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.roa), 'eternity', 'Eternity stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.blackfireTorch), 'bBlaze', 'Balefully blazing'),
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.heartsteel), 'cConsumption', 'Colossal consumption'),
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.guinsoo), 'seething', 'Seething strikes stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.terminus]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.terminus), 'jxtpL', 'Juxtaposition light stacks', 0, 3),
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.terminus), 'jxtpD', 'Juxtaposition dark stacks', 0, 3),
		],
	},
	[ITEM_NAME_TO_ID.liandry]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.liandry), 'madness', 'Suffering stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.yunTal), 'practice', 'Practice stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.shojin]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.shojin), 'fWill', 'Focused will stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.riftmaker), 'corruption', 'Corruption stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.tear]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.tear), 'manaflow', 'Manaflow stacks', 0, 360, 3),
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
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.trinity), 'quicken', 'Quicken'),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.blackCleaver), 'carve', 'Carve stacks on target', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].effectMax),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, 'internal', ITEM_NAME_TO_ID.blackCleaver), 'fervor', 'Fervor'),
		],
	},
};

for (const [itemId, itemSpecific] of Object.entries(ITEM_SPECIFICS) as [string, IItemSpecific][]) {
	if ('setupEffectData' in itemSpecific) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.item, 'effects', itemId);
		const { effectMin, effectMax, effectLabel } = itemSpecific as IDamageSourceEffectProvider;

		ITEM_COMPONENTS[itemId] ??= {};
		ITEM_COMPONENTS[itemId].effects ??= ((itemSpecific as IDamageSourceEffectProvider).effectMax ?? 1) > 1
			? await numberExtra(abilityId, 0 as never, effectLabel, effectMin ?? 0, effectMax)
			: await booleanExtra(abilityId, 0 as never, effectLabel);
	};
}
