import type { ISpecificComponents } from '~/utils/types';
import { ItemExtraTearItem } from '#components';
import itemsData from '~/assets/item.json';

const { data: items } = itemsData;

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
	[ITEM_NAME_TO_ID.shurelya]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shurelya), 'iSpeech', 'Inspiring Speech'),
	},
	[ITEM_NAME_TO_ID.ardentCensor]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.ardentCensor), 'sanctify', 'Sanctify'),
	},
	[ITEM_NAME_TO_ID.staffOfFlowingWater]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.staffOfFlowingWater), 'rapids', 'Rapids'),
	},
	[ITEM_NAME_TO_ID.roa]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.roa), 'eternity', 'Eternity stacks', 0, 10),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackfireTorch), 'bBlaze', 'Balefully blazing'),
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
	[ITEM_NAME_TO_ID.celestialOpposition]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.celestialOpposition), 'mBlessing', 'Blessing of the Mountain'),
	},
	[ITEM_NAME_TO_ID.phage]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.phage), 'rage', 'Rage'),
	},
	[ITEM_NAME_TO_ID.bandlepipes]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bandlepipes), 'fanfare', 'Fanfare'),
	},
	[ITEM_NAME_TO_ID.trailblazer]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.trailblazer), 'leadWay', 'Built up movement speed', 0, items[ITEM_NAME_TO_ID.trailblazer].dataValues.MaxMovementSpeed),
	},
	[ITEM_NAME_TO_ID.protoplasmHarness]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.protoplasmHarness), 'pHLifeline', 'Lifeline'),
	},
	[ITEM_NAME_TO_ID.frozenHeart]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.frozenHeart), 'wCaress', 'Winter\'s Caress', undefined, true),
	},
	[ITEM_NAME_TO_ID.serpentsFang]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.serpentsFang), 'sVenom', 'Shield Reave', undefined, true),
	},
	[ITEM_NAME_TO_ID.rylaisScepter]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.rylaisScepter), 'rimefrost', 'Rimefrost', undefined, true),
	},
	[ITEM_NAME_TO_ID.fiendhunterBolts]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.fiendhunterBolts), 'oBarrage', 'Opening Barrage'),
	},
	[ITEM_NAME_TO_ID.abyssalMask]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.abyssalMask), 'unmake', 'Unmake', undefined, true),
	},
	[ITEM_NAME_TO_ID.horizonFocus]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.horizonFocus), 'hypershot', 'Hypershot', undefined, true),
	},
	[ITEM_NAME_TO_ID.opportunity]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.opportunity), 'preparation', 'Preparation'),
	},
	[ITEM_NAME_TO_ID.actualizer]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.actualizer), 'empowered', 'Mana Made Real'),
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hexoptics), 'magnification', 'Distance between target', 0, items[ITEM_NAME_TO_ID.hexoptics].dataValues.MaxRange),
	},
	[ITEM_NAME_TO_ID.youmuu]: {
		extras: [
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.youmuu), 'haunt', 'Haunt'),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.youmuu), 'wStep', 'Wraith Step'),
		],
	},
	[ITEM_NAME_TO_ID.forceOfNature]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.forceOfNature), 'steadfast', 'Steadfast'),
	},
	[ITEM_NAME_TO_ID.deadMansPlate]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.deadMansPlate), 'shipwrecker', 'Built up movement speed', 0, items[ITEM_NAME_TO_ID.deadMansPlate].dataValues.MaxMovementSpeed),
	},
	[ITEM_NAME_TO_ID.bloodlettersCurse]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bloodlettersCurse), 'vDecay', 'Vile Decay stacks on target', 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.bloodletterVileDecay].maxValue),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver), 'carve', 'Carve stacks on target', 0, EFFECT_SPECIFICS[EFFECT_OBJECT_NAME.blackCleaverCarve].maxValue),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver), 'fervor', 'Fervor'),
		],
	},
	[ITEM_NAME_TO_ID.experimentalHexplate]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.experimentalHexplate), 'overdrive', 'Overdrive'),
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.heartsteel), 'cConsumption', 'Colossal consumption'),
	},
	[ITEM_NAME_TO_ID.cosmicDrive]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.cosmicDrive), 'spelldance', 'Spelldance'),
	},
	[ITEM_NAME_TO_ID.liandry]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.liandry), 'madness', 'Suffering stacks', 0, 3),
	},
	[ITEM_NAME_TO_ID.endlessHunger]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.endlessHunger), 'feast', 'Feast'),
	},
	[ITEM_NAME_TO_ID.mawOfMalmortius]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.mawOfMalmortius), 'mawLifeline', 'Lifeline'),
	},
	[ITEM_NAME_TO_ID.jakSho]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.jakSho), 'vbResistance', 'Voidborn Resistance'),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.item) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1 } = effectSpecific;

		ITEM_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		ITEM_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= maxValue > 1
			? await numberExtra(abilityId, 0, label, minValue, maxValue!)
			: await booleanExtra(abilityId, 0, label);
	}
}
