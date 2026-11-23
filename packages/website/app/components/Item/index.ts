import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item';
import { AbilityType, CHAMPION_LEVEL, GRIEVOUS_WOUND_ITEMS, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { ItemExtraTearItem } from '#components';
import type { ISpecificComponents } from '~/utils/types';

export const ITEM_COMPONENTS: Record<string, ISpecificComponents> = {
	[ITEM_NAME_TO_ID.hubris]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hubris), 'eminence', 'Eminence stacks'),
	},
	[ITEM_NAME_TO_ID.darkSeal]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.darkSeal), 'glory', 'Glory stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.darkSeal].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.mejai]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.mejai), 'glory', 'Glory stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.mejai].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.hauntingGuise]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hauntingGuise), 'madness', 'Madness stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.hauntingGuise].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.shurelya]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.shurelya), 'iSpeech', 'Inspiring Speech'),
	},
	[ITEM_NAME_TO_ID.ardentCenser]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.ardentCenser), 'sanctify', 'Sanctify'),
	},
	[ITEM_NAME_TO_ID.staffOfFlowingWater]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.staffOfFlowingWater), 'rapids', 'Rapids'),
	},
	[ITEM_NAME_TO_ID.roa]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.roa), 'eternity', 'Eternity stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.roa].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.blackfireTorch]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.blackfireTorch), 'bBlaze', 'Balefully blazing'),
	},
	[ITEM_NAME_TO_ID.guinsoo]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.guinsoo), 'seething', 'Seething strikes stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.guinsoo].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.terminus]: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.terminus), 'jxtpL', 'Juxtaposition light stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus].MAX_STACKS),
			numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.terminus), 'jxtpD', 'Juxtaposition dark stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.terminus].MAX_STACKS),
		],
	},
	[ITEM_NAME_TO_ID.yunTal]: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.yunTal), 'practice', 'Practice stacks crit chance', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MAX_PRACTICE_CRIT, (damageSource) =>
				computed(() => (damageSource.stats.value.isRanged ? ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].RANGED_CRIT_STEP : ITEM_SPECIFICS[ITEM_NAME_TO_ID.yunTal].MELEE_CRIT_STEP)),
			),
			booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.yunTal), 'flurry', 'Flurry'),
		],
	},
	[ITEM_NAME_TO_ID.shojin]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.shojin), 'fWill', 'Focused will stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.shojin].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.riftmaker]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.riftmaker), 'corruption', 'Corruption stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.riftmaker].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.tear]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.tear), 'manaflow', 'Manaflow stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.tear].MAX_STACKS, 3),
	},
	[ITEM_NAME_TO_ID.whisperingCirclet]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.diademOfSongs]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.archangelsStaff]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.seraphsEmbrace]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.manamune]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.muramana]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.wintersApproach]: {
		config: ItemExtraTearItem,
	},
	[ITEM_NAME_TO_ID.fimbulwinter]: {
		config: [ItemExtraTearItem, booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.fimbulwinter), 'enemiesNearby', 'more than one enemy nearby', false)],
	},
	[ITEM_NAME_TO_ID.trinity]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.trinity), 'quicken', 'Quicken'),
	},
	[ITEM_NAME_TO_ID.celestialOpposition]: {
		config: [
			booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.celestialOpposition), 'mbReduction', 'Blessing of the Mountain damage reduction'),
			booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.celestialOpposition), 'mbSlow', 'Blessing of the Mountain slow', true, true),
		],
	},
	[ITEM_NAME_TO_ID.phage]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.phage), 'rage', 'Rage'),
	},
	[ITEM_NAME_TO_ID.bandlepipes]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bandlepipes), 'fanfare', 'Fanfare'),
	},
	[ITEM_NAME_TO_ID.protoplasmHarness]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.protoplasmHarness), 'pHLifeline', 'Lifeline'),
	},
	[ITEM_NAME_TO_ID.frozenHeart]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.frozenHeart), 'wCaress', "Winter's Caress", undefined, true),
	},
	[ITEM_NAME_TO_ID.serpentsFang]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.serpentsFang), 'sVenom', "Serpent's Venom", undefined, true),
	},
	[ITEM_NAME_TO_ID.rylaisScepter]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rylaisScepter), 'rimefrost', 'Rimefrost', undefined, true),
	},
	[ITEM_NAME_TO_ID.fiendhunterBolts]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.fiendhunterBolts), 'oBarrage', 'Opening Barrage'),
	},
	[ITEM_NAME_TO_ID.abyssalMask]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.abyssalMask), 'unmake', 'Unmake', undefined, true),
	},
	[ITEM_NAME_TO_ID.horizonFocus]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.horizonFocus), 'hypershot', 'Hypershot', undefined, true),
	},
	[ITEM_NAME_TO_ID.actualizer]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.actualizer), 'empowered', 'Mana Made Real'),
	},
	[ITEM_NAME_TO_ID.hexoptics]: {
		config: [
			progressConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hexoptics), 'magnification', 'Distance between target', (progress) => progress, {
				max: ITEM_SPECIFICS[ITEM_NAME_TO_ID.hexoptics].MAX_RANGE,
				derivedSymbolSuffix: '',
			}),
			booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hexoptics), 'arcaneAim', 'Arcane Aim'),
		],
	},
	[ITEM_NAME_TO_ID.youmuu]: {
		config: [booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.youmuu), 'haunt', 'Haunt'), booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.youmuu), 'wStep', 'Wraith Step')],
	},
	[ITEM_NAME_TO_ID.forceOfNature]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.forceOfNature), 'steadfast', 'Steadfast'),
	},
	[ITEM_NAME_TO_ID.deadMansPlate]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.deadMansPlate), 'shipwrecker', 'Built up stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.deadMansPlate].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.bloodlettersCurse]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bloodlettersCurse), 'vDecay', 'Vile Decay stacks on target', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.bloodlettersCurse].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.blackCleaver]: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.blackCleaver), 'carve', 'Carve stacks on target', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.blackCleaver].MAX_STACKS),
			booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.blackCleaver), 'fervor', 'Fervor'),
		],
	},
	[ITEM_NAME_TO_ID.experimentalHexplate]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.experimentalHexplate), 'overdrive', 'Overdrive'),
	},
	[ITEM_NAME_TO_ID.heartsteel]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.heartsteel), 'cConsumption', 'Colossal consumption'),
	},
	[ITEM_NAME_TO_ID.cosmicDrive]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.cosmicDrive), 'spelldance', 'Spelldance'),
	},
	[ITEM_NAME_TO_ID.liandry]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.liandry), 'madness', 'Suffering stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.liandry].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.endlessHunger]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.endlessHunger), 'feast', 'Feast'),
	},
	[ITEM_NAME_TO_ID.mawOfMalmortius]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.mawOfMalmortius), 'mawLifeline', 'Lifeline'),
	},
	[ITEM_NAME_TO_ID.jakSho]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.jakSho), 'vbResistance', 'Voidborn Resistance'),
	},
	[ITEM_NAME_TO_ID.gluttonousGreaves]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.gluttonousGreaves), 'slay', 'Slay stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.gluttonousGreaves].MAX_STACKS),
	},
	[ITEM_NAME_TO_ID.immortalPath]: {
		config: [numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.immortalPath), 'slay', 'Slay stacks', 0, ITEM_SPECIFICS[ITEM_NAME_TO_ID.immortalPath].MAX_STACKS)],
	},
	[ITEM_NAME_TO_ID.lichBane]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.lichBane), 'spActive', 'Spellblade'),
	},
	[ITEM_NAME_TO_ID.botrk]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.botrk), 'cShadows', 'Clawing Shadows', true, true),
	},
	[ITEM_NAME_TO_ID.zekesConvergence]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.zekesConvergence), 'fTempest', 'Frosfire Tempest', true, true),
	},
	...Object.fromEntries(
		await Promise.all(
			GRIEVOUS_WOUND_ITEMS.map(async (itemId): Promise<[string, ISpecificComponents]> => [
				itemId,
				{
					config: booleanConfigEl(GameAbilityId.build(AbilityType.item, itemId), 'gWounds', 'Grievous Wounds', true, true),
				},
			]),
		),
	),
	[ITEM_NAME_TO_ID.redemption]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.redemption), 'aLevel', 'Target ally level', CHAMPION_LEVEL.min, CHAMPION_LEVEL.topQuestMax),
	},
	[ITEM_NAME_TO_ID.solariLocket]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.solariLocket), 'aLevel', 'Target ally level', CHAMPION_LEVEL.min, CHAMPION_LEVEL.topQuestMax),
	},
	[ITEM_NAME_TO_ID.mikaelsBlessing]: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.mikaelsBlessing), 'aLevel', 'Target ally level', CHAMPION_LEVEL.min, CHAMPION_LEVEL.topQuestMax),
	},
	[ITEM_NAME_TO_ID.malignance]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.malignance), 'hatefog', 'Hatefog', true, true),
	},
	[ITEM_NAME_TO_ID.randuinsOmen]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.randuinsOmen), 'humility', 'Humility', true, true),
	},
	[ITEM_NAME_TO_ID.imperialMandate]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.imperialMandate), 'command', 'Command', true, true),
	},
	[ITEM_NAME_TO_ID.stridebreaker]: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.stridebreaker), 'sBShockwaveHits', 'Breaking Shockwave champions hit (for ms)'),
			progressConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.stridebreaker), 'sBShockwave', 'Breaking Shockwave move speed', ITEM_SPECIFICS[ITEM_NAME_TO_ID.stridebreaker].PASSIVE_BONUS_MS),
			booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.stridebreaker), 'tBShockwave', 'Breaking Shockwave', true, true),
		],
	},
	[ITEM_NAME_TO_ID.icebornGauntlet]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.icebornGauntlet), 'frostField', 'Frost Field', true, true),
	},
	[ITEM_NAME_TO_ID.seryldasGrudge]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.seryldasGrudge), 'bitterCold', 'Bitter Cold', true, true, "The slow will be applied regardless of the target's current hp"),
	},
	[ITEM_NAME_TO_ID.bloodsong]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bloodsong), 'bloodsonged', 'Spellblade damage increase', true, true),
	},
	[ITEM_NAME_TO_ID.voltaicCyclosword]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.voltaicCyclosword), 'firmanent', 'Firmanent bonus lethality'),
	},
	[ITEM_NAME_TO_ID.crimsonLucidity]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.crimsonLucidity), 'noxianHaste', 'Noxian Haste'),
	},
	[ITEM_NAME_TO_ID.rfc]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rfc), 'sharpshooter', 'Sharpshooter'),
	},
	[ITEM_NAME_TO_ID.hextechGunblade]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hextechGunblade), 'lBolt', 'Lightning Bolt', true, true),
	},
	[ITEM_NAME_TO_ID.stormrazor]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.stormrazor), 'bolt', 'Bolt move speed'),
	},
	[ITEM_NAME_TO_ID.mercurialScimitar]: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.mercurialScimitar), 'quicksilver', 'Quicksilver'),
	},
	[ITEM_NAME_TO_ID.solsticeSleigh]: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.solsticeSleigh), 'sledding', 'Going Sledding move speed', ITEM_SPECIFICS[ITEM_NAME_TO_ID.solsticeSleigh].PASSIVE_BONUS_MS),
	},
	[ITEM_NAME_TO_ID.overlordsBloodmail]: {
		/* 'tyranny' passed here won't actually be updated by boolean extra, because this component controls 2 variables through `extraControls`. For now only this component uses boolean extra's effect controls and it's special cased to do so */
		config: booleanConfigEl(
			GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.overlordsBloodmail),
			'tyranny',
			'count passives towards adaptive',
			false,
			undefined,
			"Unless your build is mixed <scalead>AD</scalead>/<scaleap>AP</scaleap> and the values are close, you shouldn't need to check this<br><br> <rules><scalead>Attack damage</scalead> gained from both Tyranny and Retribution passives counts towards choosing which stat adaptive force grants (<scalead>AD</scalead>/<scaleap>AP</scaleap>).<br> If you need them to be properly factored in, you can check this but you will have to use the refresh button to manually update the stats whenever something changes</rules>",
			{
				effectControlsProps: ITEM_SPECIFICS[ITEM_NAME_TO_ID.overlordsBloodmail].extraControls,
			},
		),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.item) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1, enumOptions } = effectSpecific;

		ITEM_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		ITEM_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= {};
		ITEM_COMPONENTS[effectSpecific.sourceAbility.id]!.effects![effectObjectName] ??= enumOptions
			? enumConfigEl(
					abilityId,
					0,
					label,
					Object.entries(enumOptions).map(([key, value]) => [value, key]),
				)
			: maxValue !== 1
				? numberConfigEl(abilityId, 0, label, minValue, maxValue)
				: booleanConfigEl(abilityId, 0, label, false, undefined, effectSpecific.componentTooltip);
	}
}

for (const key in ITEM_COMPONENTS) {
	const { config, effects } = ITEM_COMPONENTS[key as keyof typeof ITEM_COMPONENTS]!;
	config && (Array.isArray(config) ? config.forEach((component) => markRaw(component)) : markRaw(config));
	for (const key in effects) {
		markRaw(effects[key]!);
	}
}
