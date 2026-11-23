import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { simpleFormattingGameAbilityImage } from '@lolcalc/core/misc';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { ITEMS_BY_NAME } from '@lolcalc/data/index';
import type { IChampionId } from '@lolcalc/data/types';
import { AbilityType, ITEM_NAME_TO_ID } from '@lolcalc/shared';
import { ChampionExtrasAphelios, ChampionExtrasKhaZix, ChampionExtrasOrnn, ChampionExtrasTargetDummy, ChampionExtrasViktor, ChampionExtrasMilio } from '#components';
import type { ISpecificComponents } from '~/utils/types';

export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	TargetDummy: {
		config: ChampionExtrasTargetDummy,
	},
	Akali: {
		config: [
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Akali', 'passive', 0), 'isPassiveMSActive', 'MS active (towards/after crossing the ring)'),
			booleanConfigEl(
				GameAbilityId.build(AbilityType.champion, 'Akali', 'passive', 0),
				'passiveRangeSnapshot',
				'attack range active (after crossing the ring)',
				false,
				undefined,
				`Under the hood Akali's passive snapshots the attack range at the moment of crossing the ring, then grants it as bonus (which for example makes ${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rfc))} ${ITEMS_BY_NAME.rfc?.name}'s Sharpshooter apply twice)`,
				{
					effectControlsProps: CHAMPION_SPECIFICS.Akali.passive.extraControls,
				},
			),
			progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Akali', 'w', 0), 'wMSProgress', 'Twilight Shroud move speed (after cast)', CHAMPION_SPECIFICS.Akali.w.derivedMS),
		],
	},
	Akshan: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Akshan', 'passive', 0), 'passiveMSProgress', 'additional shot cancel MS', CHAMPION_SPECIFICS.Akshan.passive.derivedMS, { derivedSymbolSuffix: '' }),
	},
	Ambessa: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Ambessa', 'passive', 0), 'hasPassiveStack', 'has stack (from using an ability)', false),
	},
	Amumu: {
		config: booleanConfigEl(
			GameAbilityId.build(AbilityType.champion, 'Amumu', 'passive', 0),
			'applyPassive',
			'Cursed Touch',
			true,
			true,
			"Used in the basic attack damage results. Abilities' values do not factor it in. (TODO - not implemented yet)",
		),
	},
	Anivia: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Anivia', 'passive', 0), 'isEgg', 'is egg', false),
	},
	Aphelios: {
		config: ChampionExtrasAphelios,
	},
	Ashe: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Ashe', 'passive', 0), 'frostShot', 'apply Frost Shot on target', CHAMPION_SPECIFICS.Ashe.passive.derivedSlow),
	},
	AurelionSol: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'AurelionSol', 'passive', 0), 'passiveStacks', 'Cosmic Creator stacks'),
	},
	Bard: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Bard', 'passive', 0), 'passiveStacks', 'Chimes collected'),
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Bard', 'passive', 0), 'chimeMoveSpeed', 'Chime move speed', 0, CHAMPION_SPECIFICS.Bard.passive.maxChimeMS),
		],
	},
	Belveth: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Belveth', 'passive', 0), 'passiveStacks', 'Lavender stacks'),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Belveth', 'passive', 0), 'hasPassiveStack', 'has stack (from using an ability)', false),
		],
	},
	Chogath: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Chogath', 'r', 0), 'ultStacks', 'Feast stacks'),
	},
	Darius: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Darius', 'passive', 0), 'isChampionAtMaxBleed', 'is champion at max bleed stacks', false),
	},
	Diana: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Diana', 'passive', 0), 'isPassiveEmpowered', 'empowered Moonsilver Blade', true),
	},
	Draven: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Draven', 'passive', 0), 'passiveStacks', 'League of Draven stacks'),
	},
	Ekko: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Ekko', 'passive', 0), 'isPassiveMSActive', 'is MS active (3 hits)', false),
	},
	Ezreal: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Ezreal', 'passive', 0), 'passiveStacks', 'Spell Force stacks', 0, CHAMPION_SPECIFICS.Ezreal.passive.maxStacks),
	},
	Fiora: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Fiora', 'passive', 0), 'passiveMSProgress', "Duelist's Dance move speed", CHAMPION_SPECIFICS.Fiora.passive.derivedMS),
	},
	Gangplank: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Gangplank', 'passive', 0), 'isPassiveMSActive', 'is MS active', false),
	},
	Garen: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Garen', 'passive', 0), 'isPassiveActive', 'apply HP regen (not hit recently)', false),
	},
	Graves: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Graves', 'e', 0), 'eStacks', 'True Grit stacks', 0, CHAMPION_SPECIFICS.Graves.e.maxStacks),
	},
	Heimerdinger: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Heimerdinger', 'passive', 0), 'isPassiveMSActive', 'is MS active (close to turret)', false),
	},
	Irelia: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Irelia', 'passive', 0), 'passiveStacks', 'Ionian Fervor stacks', 0, CHAMPION_SPECIFICS.Irelia.passive.maxStacks),
	},
	Jax: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Jax', 'passive', 0), 'passiveStacks', 'Relentless Assault stacks', 0, CHAMPION_SPECIFICS.Jax.passive.maxStacks),
	},
	Jayce: {
		config: [
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Jayce', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (after form swap)', false),
			progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Jayce', 'e', 1), 'eMSProgress', 'Acceleration Gate MS', CHAMPION_SPECIFICS.Jayce.e.derivedMS),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Jayce', 'r', 0), 'applyRShred', 'resists shred', true, true),
		],
	},
	Jhin: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Jhin', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (after crit)', false),
	},
	Jinx: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Jinx', 'passive', 0), 'passiveStacks', 'Get Excited stacks', 0, CHAMPION_SPECIFICS.Jinx.passive.maxStacks),
			progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Jinx', 'passive', 0), 'passiveMSProgress', 'Get Excited MS value', CHAMPION_SPECIFICS.Jinx.passive.derivedMS),
			enumConfigEl(
				GameAbilityId.build(AbilityType.champion, 'Jinx', 'q', 0),
				'qBuff',
				'gun buff',
				[
					[CHAMPION_SPECIFICS.Jinx.q.buffOptions.minigun0, 'minigun no stacks'],
					[CHAMPION_SPECIFICS.Jinx.q.buffOptions.minigun1, 'minigun 1'],
					[CHAMPION_SPECIFICS.Jinx.q.buffOptions.minigun2, 'minigun 2'],
					[CHAMPION_SPECIFICS.Jinx.q.buffOptions.minigun3, 'minigun 3'],
					[CHAMPION_SPECIFICS.Jinx.q.buffOptions.fishbones, 'fishbones'],
				],
				{ variantImgIndex: CHAMPION_SPECIFICS.Jinx.q.abilityImgVariantIndex },
			),
		],
	},
	Kayle: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Kayle', 'passive', 0), 'passiveStacks', 'Divine Ascent stacks', 0, CHAMPION_SPECIFICS.Kayle.passive.maxStacks),
	},
	Kaisa: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Kaisa', 'passive', 0), 'passiveStacksOnTarget', 'Plasma stacks on target', 0, CHAMPION_SPECIFICS.Kaisa.passive.maxStacks),
			enumConfigEl(GameAbilityId.build(AbilityType.champion, 'Kaisa', 'e', 0), 'eBuff', 'Supercharge buff', [
				[CHAMPION_SPECIFICS.Kaisa.e.buffOptions.none, 'none'],
				[CHAMPION_SPECIFICS.Kaisa.e.buffOptions.attackSpeed, 'attack speed'],
				[CHAMPION_SPECIFICS.Kaisa.e.buffOptions.moveSpeed, 'move speed'],
				[CHAMPION_SPECIFICS.Kaisa.e.buffOptions.both, 'move and attack speed'],
			]),
		],
	},
	Kayn: {
		config: enumConfigEl(
			GameAbilityId.build(AbilityType.champion, 'Kayn', 'passive', 0),
			'form',
			'Form',
			Object.entries(CHAMPION_SPECIFICS.Kayn.passive.formOptions).map(([key, value]) => [value, key]),
			{ variantImgIndex: CHAMPION_SPECIFICS.Kayn.passive.abilityImgVariantIndex },
		),
	},
	Kindred: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Kindred', 'passive', 0), 'passiveStacks', 'Marks collected'),
	},
	Khazix: {
		config: ChampionExtrasKhaZix,
	},
	Kled: {
		config: [
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Kled', 'passive', 0), 'runningTowardsEnemy', 'running towards enemy (dismounted)', false, undefined, undefined, {
				inactive: CHAMPION_SPECIFICS.Kled.dismountedComponentsInactive,
			}),
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Kled', 'passive', 0), 'enemiesNearby', 'enemies nearby (dismounted)', 0, 5, undefined, {
				inactive: CHAMPION_SPECIFICS.Kled.dismountedComponentsInactive,
			}),
		],
	},
	KogMaw: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'KogMaw', 'passive', 0), 'passiveMSProgress', 'apply Icathian Surprise MS (dead)', CHAMPION_SPECIFICS.KogMaw.passive.derivedMS),
	},
	LeeSin: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'LeeSin', 'passive', 0), 'hasPassiveStack', 'has stack (from using an ability)', false),
	},
	Lissandra: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Lissandra', 'passive', 0), 'applyZombieSlow', 'zombie slow', true, true),
	},
	Locke: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Locke', 'r', 0), 'rStacks', 'Enemies sealed'),
	},
	Lucian: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Lucian', 'w', 0), 'isWMSActive', 'Vigilance (attacked W target)'),
	},
	Malphite: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Malphite', 'passive', 0), 'isPassiveActive', 'Granite Shield (used for W calc)'),
	},
	Mel: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Mel', 'w', 0), 'wMSTotalAP', 'Rebuttal move speed', true, undefined, undefined, {
			effectControlsProps: CHAMPION_SPECIFICS.Mel.w.extraControls,
		}),
	},
	Milio: {
		config: ChampionExtrasMilio,
	},
	Mordekaiser: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Mordekaiser', 'passive', 0), 'isPassiveMSActive', 'active (3 hits)', false),
	},
	Naafiri: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Naafiri', 'passive', 0), 'passiveStacks', 'Packmates', 0, CHAMPION_SPECIFICS.Naafiri.passive.maxStacks),
	},
	Nami: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Nami', 'passive', 0), 'passiveMSProgress', 'Surging Tides move speed', CHAMPION_SPECIFICS.Nami.passive.derivedMS, {
			effectControlsProps: CHAMPION_SPECIFICS.Nami.passive.effectControls,
			derivedSymbolSuffix: '',
		}),
	},
	Nasus: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Nasus', 'w', 0), 'wProgress', 'apply Wither on target', CHAMPION_SPECIFICS.Nasus.w.derivedSlow),
	},
	Nidalee: {
		config: enumConfigEl(GameAbilityId.build(AbilityType.champion, 'Nidalee', 'passive', 0), 'passiveVariantActive', 'passive bonus MS', [
			[CHAMPION_SPECIFICS.Nidalee.passive.shapeshiftOptions.none, 'none'],
			[CHAMPION_SPECIFICS.Nidalee.passive.shapeshiftOptions.justBush, 'in bush'],
			[CHAMPION_SPECIFICS.Nidalee.passive.shapeshiftOptions.towardsChampion, 'towards champions'],
		]),
	},
	Nunu: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Nunu', 'passive', 0), 'isPassiveActive', 'Call of the Freljord', true),
	},
	Orianna: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Orianna', 'passive', 0), 'passiveStacksOnTarget', 'Windup stacks on target', 0, CHAMPION_SPECIFICS.Orianna.passive.maxStacks, undefined, {
				tooltip: "in the <i>results table's</i> <b>basic attack</b> section, the damage is calculated for the number of stacks set here",
			}),
			progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Orianna', 'w', 0), 'wMSProgress', 'Dissonance field move speed', CHAMPION_SPECIFICS.Orianna.w.derivedMS),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Orianna', 'e', 0), 'applyEResists', 'The Ball (bonus resists)', undefined, undefined, undefined, { onUpdate: CHAMPION_SPECIFICS.Orianna.e.onComponentUpdateValue }),
		],
	},
	Ornn: {
		config: ChampionExtrasOrnn,
	},
	Poppy: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Poppy', 'passive', 0), 'isPassiveActive', 'Iron Ambassador active', false),
	},
	Rammus: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Rammus', 'w', 0), 'defensiveCurl', 'Defensive Curl'),
	},
	Rell: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Rell', 'passive', 0), 'passiveStacksOnTarget', 'Break the Mold stacks on target', 0, CHAMPION_SPECIFICS.Rell.passive.maxStacks, undefined, {
			tooltip: 'the stolen stats will be shown in the results table (needs target)',
		}),
	},
	Rengar: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Rengar', 'passive', 0), 'passiveStacks', 'Bonetooth Necklace stacks', 0, CHAMPION_SPECIFICS.Rengar.passive.maxStacks),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Rengar', 'passive', 0), 'isPassiveMSActive', 'MS active (after empowered ability)', false),
		],
	},
	Rumble: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Rumble', 'passive', 0), 'isOverheated', 'overheated', false),
	},
	Samira: {
		config: enumConfigEl(
			GameAbilityId.build(AbilityType.champion, 'Samira', 'passive', 0),
			'passiveStacks',
			'Grade',
			Object.entries(CHAMPION_SPECIFICS.Samira.passive.styleOptions).map(([grade, value]) => [value, value ? grade.toUpperCase() : grade]),
		),
	},
	Sejuani: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Sejuani', 'passive', 0), 'isPassiveActive', 'Fury of the North active', false),
	},
	Senna: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Senna', 'passive', 0), 'passiveStacks', 'Absolution stacks'),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Senna', 'passive', 0), 'passiveStealTargetMS', "grant % of attacked target's MS", false, undefined, 'the move speed will be shown in the results table (needs target)'),
		],
	},
	Seraphine: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Seraphine', 'passive', 0), 'passiveStacks', 'Notes collected', 0, CHAMPION_SPECIFICS.Seraphine.passive.maxStacks),
	},
	Shyvana: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Shyvana', 'passive', 0), 'passiveStacks', 'Scalemail stacks'),
	},
	Sion: {
		config: [
			progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Sion', 'q', 1), 'passiveMSProgress', 'Death Surge MS', CHAMPION_SPECIFICS.Sion.passive.bonusMS, {
				inactive: CHAMPION_SPECIFICS.Sion.passive.deathSurgeComponentInactive,
			}),
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Sion', 'w', 0), 'wStacks', 'Soul Furnace stacks'),
		],
	},
	Singed: {
		config: [
			numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Singed', 'passive', 0), 'passiveStacks', 'Slipstream stacks', 0, CHAMPION_SPECIFICS.Singed.passive.maxStacks),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Singed', 'r', 0), 'isRActive', 'Insanity Potion'),
		],
	},
	Sivir: {
		config: progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Sivir', 'passive', 0), 'passiveMSProgress', 'Fleet of Foot MS', CHAMPION_SPECIFICS.Sivir.passive.bonusMS, { derivedSymbolSuffix: '' }),
	},
	Smolder: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Smolder', 'passive', 0), 'passiveStacks', 'Dragon Practice stacks'),
	},
	Sona: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Sona', 'passive', 0), 'passiveStacks', 'Accelerando stacks', 0, CHAMPION_SPECIFICS.Sona.passive.maxStacks),
	},
	Soraka: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Soraka', 'passive', 0), 'isPassiveMSActive', 'moving towards low health ally', false),
	},
	Swain: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Swain', 'passive', 0), 'passiveStacks', 'Soul Fragments collected'),
	},
	Sylas: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Sylas', 'passive', 0), 'hasPassiveStack', 'has stack (from using an ability)', false),
	},
	Syndra: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Syndra', 'passive', 0), 'passiveStacks', 'Splinters collected', 0, CHAMPION_SPECIFICS.Syndra.passive.maxStacks),
	},
	Taliyah: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Taliyah', 'passive', 0), 'isPassiveMSActive', 'MS active (next to wall OOC)', false),
	},
	Taric: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Taric', 'passive', 0), 'hasPassiveStack', 'has stack (from using an ability)', false),
	},
	Teemo: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Teemo', 'passive', 0), 'isPassiveASActive', 'AS active (exiting invisibility)', false),
	},
	Thresh: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Thresh', 'passive', 0), 'passiveStacks', 'Souls collected'),
	},
	Tristana: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Tristana', 'q', 0), 'isQActive', 'active', false),
	},
	Trundle: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Trundle', 'q', 0), 'isQActive', 'gain AD (chomped something)', false),
	},
	Udyr: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Udyr', 'passive', 0), 'hasPassiveStack', 'has stack (from using an ability)', false),
	},
	Varus: {
		config: enumConfigEl(
			GameAbilityId.build(AbilityType.champion, 'Varus', 'passive', 0),
			'passiveVariantActive',
			'buff from enemy',
			Object.entries(CHAMPION_SPECIFICS.Varus.passive.options).map(([key, value]) => [value, key]),
		),
	},
	Vayne: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Vayne', 'passive', 0), 'isPassiveMSActive', 'moving towards enemy', false),
	},
	Veigar: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Veigar', 'passive', 0), 'passiveStacks', 'Phenomenal Evil stacks'),
	},
	Vi: {
		config: [
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Vi', 'w', 0), 'isWASActive', '3 hit attack speed', false),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Vi', 'w', 0), 'applyWPen', 'armor reduction', true, true),
		],
	},
	Viktor: {
		config: ChampionExtrasViktor,
	},
	Volibear: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Volibear', 'passive', 0), 'passiveStacks', 'Relentless Storm stacks', 0, CHAMPION_SPECIFICS.Volibear.passive.maxStacks),
	},
	XinZhao: {
		config: booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'XinZhao', 'e', 0), 'isEASActive', 'active', false),
	},
	Warwick: {
		config: [
			enumConfigEl(
				GameAbilityId.build(AbilityType.champion, 'Warwick', 'w', 0),
				'wVariantActive',
				'apply Blood Hunt',
				Object.entries(CHAMPION_SPECIFICS.Warwick.w.options).map(([key, value]) => [value, key]),
			),
			booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Warwick', 'e', 0), 'isEActive', 'active', false, undefined, 'TODO not implemented yet'),
		],
	},
	MonkeyKing: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'MonkeyKing', 'passive', 0), 'passiveStacks', 'Stone Skin stacks', 0, CHAMPION_SPECIFICS.MonkeyKing.passive.maxStacks),
	},
	Zeri: {
		config: [booleanConfigEl(GameAbilityId.build(AbilityType.champion, 'Zeri', 'r', 0), 'rActive', 'active', false), numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Zeri', 'r', 0), 'rStacks', 'Overdrive stacks')],
	},
	Zaahen: {
		config: numberConfigEl(GameAbilityId.build(AbilityType.champion, 'Zaahen', 'passive', 0), 'passiveStacks', 'Determination stacks', 0, CHAMPION_SPECIFICS.Zaahen.passive.maxStacks),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.champion) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1, enumOptions, deriveProgressValue } = effectSpecific;

		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= {};
		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]!.effects![effectObjectName] = enumOptions
			? enumConfigEl(
					abilityId,
					0,
					label,
					Object.entries(enumOptions).map(([key, value]) => [value, key]),
					{
						selectEffectSourceProps: effectSpecific.sourceControls,
						onUpdate: effectSpecific.onValueUpdate,
					},
				)
			: deriveProgressValue
				? progressConfigEl(abilityId, 0, label, deriveProgressValue, {
						selectEffectSourceProps: effectSpecific.sourceControls,
						effectControlsProps: effectSpecific.effectControls,
						derivedSymbolSuffix: effectSpecific.progressComponentSymbol,
						onUpdate: effectSpecific.onValueUpdate,
					})
				: maxValue !== 1
					? numberConfigEl(abilityId, 0, label, minValue, maxValue, undefined, {
							effectControlsProps: effectSpecific.effectControls,
							selectEffectSourceProps: effectSpecific.sourceControls,
						})
					: booleanConfigEl(abilityId, 0, label, false, undefined, effectSpecific.componentTooltip, { onUpdate: effectSpecific.onValueUpdate, selectEffectSourceProps: effectSpecific.sourceControls });
	}
}

for (const key in CHAMPION_COMPONENTS) {
	const { config, effects } = CHAMPION_COMPONENTS[key as keyof typeof CHAMPION_COMPONENTS]!;
	config && (Array.isArray(config) ? config.forEach((component) => markRaw(component)) : markRaw(config));
	for (const key in effects) {
		markRaw(effects[key]!);
	}
}
