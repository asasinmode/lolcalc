import type { ISpecificComponents } from '~/utils/types';
import { ItemExtraTearItem } from '#components';

export const ITEM_COMPONENTS: Record<string, ISpecificComponents> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hubris), 'eminence', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.darkSeal), 'glory', 'Glory stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.mejai), 'glory', 'Glory stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hauntingGuise), 'madness', 'Madness stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.roa]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.roa), 'eternity', 'Eternity stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackfireTorch), 'bBlaze', 'Balefully blazing'),
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.heartsteel), 'cConsumption', 'Colossal consumption'),
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.guinsoo), 'seething', 'Seething strikes stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.terminus]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.terminus), 'jxtpL', 'Juxtaposition light stacks', 0, 3),
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.terminus), 'jxtpD', 'Juxtaposition dark stacks', 0, 3),
		],
	},
	[ITEM_NAME_TO_ID.liandry]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.liandry), 'madness', 'Suffering stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.yunTal), 'practice', 'Practice stacks', 0, 25),
	},
	[ITEM_NAME_TO_ID.shojin]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shojin), 'fWill', 'Focused will stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.riftmaker), 'corruption', 'Corruption stacks', 0, 4),
	},
	[ITEM_NAME_TO_ID.tear]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.tear), 'manaflow', 'Manaflow stacks', 0, 360, 3),
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
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.trinity), 'quicken', 'Quicken'),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver), 'carve', 'Carve stacks on target', 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.blackCleaverCarve].maxValue),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver), 'fervor', 'Fervor'),
		],
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.item) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, maxValue, minValue } = effectSpecific;

		ITEM_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		ITEM_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= (maxValue ?? 1) > 1
			? await numberExtra(abilityId, 0, label, maxValue ?? 0, minValue)
			: await booleanExtra(abilityId, 0, label);
	}
}
