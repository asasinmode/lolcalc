import type { IGameAbilityId } from '../GameAbilityId';
import { AbilityType, EffectObjectName, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { GameAbilityId } from '../GameAbilityId.ts';

export const EFFECTS_META: Record<EffectObjectName, {
	sourceAbility: IGameAbilityId;
	label: string;
}> = {
	[EffectObjectName.ghost]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.ghost),
		label: 'Ghost',
	},
	[EffectObjectName.cleanse]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.cleanse),
		label: 'Cleanse',
	},
	[EffectObjectName.heal]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.heal),
		label: 'Heal',
	},
	[EffectObjectName.exhaust]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.exhaust),
		label: 'Exhaust',
	},
	[EffectObjectName.hextechSoulSlow]: {
		sourceAbility: GameAbilityId.build(AbilityType.dragon, 'Hextech', 'soul'),
		label: 'Hextech Soul slow',
	},
	[EffectObjectName.stun]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.stun),
		label: 'Stun',
	},
	[EffectObjectName.slowFlat]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.slowFlat),
		label: 'Slow (flat)',
	},
	[EffectObjectName.slowPercent]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.slowPercent),
		label: 'Slow (percent)',
	},
	[EffectObjectName.grievousWounds]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.grievousWounds),
		label: 'Grievous Wounds',
	},
	[EffectObjectName.grievousWoundsPercent]: {
		sourceAbility: GameAbilityId.build(AbilityType.effect, EffectObjectName.grievousWoundsPercent),
		label: 'Grievous Wounds (percent)',
	},
	[EffectObjectName.shurelyaInspiringSpeech]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.shurelya),
		label: 'Inspiring speech',
	},
	[EffectObjectName.ardentSanctify]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.ardentCenser),
		label: 'Sanctify',
	},
	[EffectObjectName.flowingWaterRapids]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.staffOfFlowingWater),
		label: 'Rapids',
	},
	[EffectObjectName.bandlepipesFanfare]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bandlepipes),
		label: 'Fanfare',
	},
	[EffectObjectName.knightsVowSacrifice]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.knightsVow),
		label: 'Sacrifice',
	},
	[EffectObjectName.frozenHeartWintersCaress]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.frozenHeart),
		label: 'Winter\'s Caress',
	},
	[EffectObjectName.serpentsFangVenom]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.serpentsFang),
		label: 'Serpent\'s Venom',
	},
	[EffectObjectName.rylaisRimefrost]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rylaisScepter),
		label: 'Rimefrost',
	},
	[EffectObjectName.abyssalMaskUnmake]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.abyssalMask),
		label: 'Cursed',
	},
	[EffectObjectName.horizonFocusHypershot]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.horizonFocus),
		label: 'Hypershot',
	},
	[EffectObjectName.bloodletterVileDecay]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bloodlettersCurse),
		label: 'Vile Decay stacks',
	},
	[EffectObjectName.blackCleaverCarve]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.blackCleaver),
		label: 'Carve stacks',
	},
	[EffectObjectName.botrkClawingShadows]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.botrk),
		label: 'Clawing Shadows',
	},
	[EffectObjectName.zekesConvergenceFrostfireTempest]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.zekesConvergence),
		label: 'Frostfire Tempest',
	},
	[EffectObjectName.celestialOppositionBlessingShattered]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.celestialOpposition),
		label: 'Mountain Blessing',
	},
	[EffectObjectName.randuinsHumility]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.randuinsOmen),
		label: 'Humility',
	},
	[EffectObjectName.malignanceHatefog]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.malignance),
		label: 'Hatefog',
	},
	[EffectObjectName.imperialMandateCommand]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.imperialMandate),
		label: 'Command',
	},
	[EffectObjectName.stridebreakerBShockwaveSlow]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.stridebreaker),
		label: 'Breaking Shockwave',
	},
	[EffectObjectName.icebornGauntletFrostField]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.icebornGauntlet),
		label: 'Frost Field',
	},
	[EffectObjectName.bloodsongSpellbladed]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.bloodsong),
		label: 'Bloodsong',
	},
	[EffectObjectName.seryldaBitterCold]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.seryldasGrudge),
		label: 'Bitter Cold',
	},
	[EffectObjectName.gunbladeLightningBolt]: {
		sourceAbility: GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.hextechGunblade),
		label: 'Lightning Bolt',
	},
	[EffectObjectName.amumuPCursedTouch]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Amumu', 'passive', 0),
		label: 'Cursed touch',
	},
	[EffectObjectName.jannaPTailwind]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Janna', 'passive', 0),
		label: 'Tailwind',
	},
	[EffectObjectName.ashePFrostShot]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Ashe', 'passive', 0),
		label: 'Frost Shot',
	},
	[EffectObjectName.nunuPCallOfFreljord]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Nunu', 'passive', 0),
		label: 'Call of the Freljord',
	},
	[EffectObjectName.ornnPLivingForge]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0),
		label: 'Masterwork item slot',
	},
	[EffectObjectName.rellPBreakMold]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Rell', 'passive', 0),
		label: 'Break the Mold stacks',
	},
	[EffectObjectName.namiPSurgingTides]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Nami', 'passive', 0),
		label: 'Surging Tides',
	},
	[EffectObjectName.nasusWWither]: {
		sourceAbility: GameAbilityId.build(AbilityType.champion, 'Nasus', 'w', 0),
		label: 'Wither',
	},
};
