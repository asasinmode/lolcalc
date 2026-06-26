import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item';
import { ABILITY_TYPE, CHAMPION_LEVEL, GRIEVOUS_WOUND_ITEMS, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { ItemExtraTearItem } from '#components';

export const ITEM_COMPONENTS: Record<string, ISpecificComponents> = {
	[ITEM_NAME_TO_ID.hubris]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hubris), 'eminence', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.darkSeal), 'glory', 'Glory stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.darkSeal].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.mejai), 'glory', 'Glory stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.mejai].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hauntingGuise), 'madness', 'Madness stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hauntingGuise].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shurelya), 'iSpeech', 'Inspiring Speech'),
	},
	[ITEM_NAME_TO_ID.ardentCenser]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.ardentCenser), 'sanctify', 'Sanctify'),
	},
	[ITEM_NAME_TO_ID.staffOfFlowingWater]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.staffOfFlowingWater), 'rapids', 'Rapids'),
	},
	[ITEM_NAME_TO_ID.roa]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.roa), 'eternity', 'Eternity stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.roa].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackfireTorch), 'bBlaze', 'Balefully blazing'),
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.guinsoo), 'seething', 'Seething strikes stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.guinsoo].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.terminus]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.terminus), 'jxtpL', 'Juxtaposition light stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus].MAX_STACKS),
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.terminus), 'jxtpD', 'Juxtaposition dark stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus].MAX_STACKS),
		],
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		extras: [
			await numberExtra(
				GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.yunTal),
				'practice',
				'Practice stacks crit chance',
				0,
				ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MAX_PRACTICE_CRIT,
				damageSource => computed(() => damageSource.stats.value.isRanged ? ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].RANGED_CRIT_STEP : ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MELEE_CRIT_STEP),
			),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.yunTal), 'flurry', 'Flurry'),
		],
	},
	[ITEM_NAME_TO_ID.shojin]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.shojin), 'fWill', 'Focused will stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.shojin].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.riftmaker), 'corruption', 'Corruption stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.tear]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.tear), 'manaflow', 'Manaflow stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.tear].MAX_STACKS, 3),
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
		extras: [
			ItemExtraTearItem,
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.fimbulwinter), 'enemiesNearby', 'more than one enemy nearby', false),
		],
	},
	[ITEM_NAME_TO_ID.trinity]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.trinity), 'quicken', 'Quicken'),
	},
	[ITEM_NAME_TO_ID.celestialOpposition]: {
		extras: [
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.celestialOpposition), 'mbReduction', 'Blessing of the Mountain damage reduction'),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.celestialOpposition), 'mbSlow', 'Blessing of the Mountain slow', true, true),
		],
	},
	[ITEM_NAME_TO_ID.phage]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.phage), 'rage', 'Rage'),
	},
	[ITEM_NAME_TO_ID.bandlepipes]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bandlepipes), 'fanfare', 'Fanfare'),
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
	[ITEM_NAME_TO_ID.actualizer]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.actualizer), 'empowered', 'Mana Made Real'),
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hexoptics), 'magnification', 'Distance between target', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hexoptics].MAX_STACKS),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hexoptics), 'arcaneAim', 'Arcane Aim'),
		],
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
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.deadMansPlate), 'shipwrecker', 'Built up stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.deadMansPlate].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.bloodlettersCurse]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bloodlettersCurse), 'vDecay', 'Vile Decay stacks on target', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.bloodlettersCurse].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.blackCleaver), 'carve', 'Carve stacks on target', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS),
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
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.liandry), 'madness', 'Suffering stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.liandry].MAX_STACKS),
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
	[ITEM_NAME_TO_ID.gluttonousGreaves]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.gluttonousGreaves), 'slay', 'Slay stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.gluttonousGreaves].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.immortalPath]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.immortalPath), 'slay', 'Slay stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.immortalPath].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.lichBane]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.lichBane), 'spActive', 'Spellblade'),
	},
	[ITEM_NAME_TO_ID.botrk]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.botrk), 'cShadows', 'Clawing Shadows', true, true),
	},
	[ITEM_NAME_TO_ID.zekesConvergence]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.zekesConvergence), 'fTempest', 'Frosfire Tempest', true, true),
	},
	...Object.fromEntries(await Promise.all(GRIEVOUS_WOUND_ITEMS.map(async (itemId): Promise<[string, ISpecificComponents]> => [
		itemId,
		{
			extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, itemId), 'gWounds', 'Grievous Wounds', true, true),
		},
	]))),
	[ITEM_NAME_TO_ID.redemption]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.redemption), 'aLevel', 'Target ally level', CHAMPION_LEVEL.min, CHAMPION_LEVEL.max),
	},
	[ITEM_NAME_TO_ID.solariLocket]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.solariLocket), 'aLevel', 'Target ally level', CHAMPION_LEVEL.min, CHAMPION_LEVEL.max),
	},
	[ITEM_NAME_TO_ID.mikaelsBlessing]: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.mikaelsBlessing), 'aLevel', 'Target ally level', CHAMPION_LEVEL.min, CHAMPION_LEVEL.max),
	},
	[ITEM_NAME_TO_ID.malignance]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.malignance), 'hatefog', 'Hatefog', true, true),
	},
	[ITEM_NAME_TO_ID.randuinsOmen]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.randuinsOmen), 'humility', 'Humility', true, true),
	},
	[ITEM_NAME_TO_ID.imperialMandate]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.imperialMandate), 'command', 'Command', true, true),
	},
	[ITEM_NAME_TO_ID.stridebreaker]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.stridebreaker), 'tBShockwave', 'Breaking Shockwave', true, true),
	},
	[ITEM_NAME_TO_ID.icebornGauntlet]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.icebornGauntlet), 'frostField', 'Frost Field', true, true),
	},
	[ITEM_NAME_TO_ID.seryldasGrudge]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.seryldasGrudge), 'bitterCold', 'Bitter Cold', true, true),
	},
	[ITEM_NAME_TO_ID.bloodsong]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.bloodsong), 'bloodsonged', 'Spellblade damage increase', true, true),
	},
	[ITEM_NAME_TO_ID.voltaicCyclosword]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.voltaicCyclosword), 'firmanent', 'Firmanent bonus lethality'),
	},
	[ITEM_NAME_TO_ID.crimsonLucidity]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.crimsonLucidity), 'noxianHaste', 'Noxian Haste'),
	},
	[ITEM_NAME_TO_ID.rfc]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.rfc), 'sharpshooter', 'Sharpshooter'),
	},
	[ITEM_NAME_TO_ID.hextechGunblade]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.hextechGunblade), 'lBolt', 'Lightning Bolt', true, true),
	},
	[ITEM_NAME_TO_ID.stormrazor]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.stormrazor), 'bolt', 'Bolt move speed'),
	},
	[ITEM_NAME_TO_ID.mercurialScimitar]: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.item, ITEM_NAME_TO_ID.mercurialScimitar), 'quicksilver', 'Quicksilver'),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.item) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1, enumOptions } = effectSpecific;

		ITEM_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		ITEM_COMPONENTS[effectSpecific.sourceAbility.id]!.effects
			??= enumOptions
				? await enumExtra(abilityId, 0, label, Object.fromEntries(Object.entries(enumOptions).map(([key, value]) => [value, key])))
				: maxValue !== 1
					? await numberExtra(abilityId, 0, label, minValue, maxValue)
					: await booleanExtra(abilityId, 0, label);
	}
}
