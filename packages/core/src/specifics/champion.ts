import type { IChampionAbilityVariant, IChampionId } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStats } from '@lolcalc/shared';
import { ALL_CHAMPION_STATS_ENTRIES } from '@lolcalc/shared';
import type { ComputedRef } from 'vue';
import type { DamageSource, ICalculateChampionStatsHookSource, IEffectOntoTargetVarsHook, IProviderGroupDataSetup, IProviderGroupImageText } from '../DamageSource';
import Aatrox from './champion/Aatrox.ts';
import Ahri from './champion/Ahri.ts';
import Akali from './champion/Akali.ts';
import Akshan from './champion/Akshan.ts';
import Alistar from './champion/Alistar.ts';
import Ambessa from './champion/Ambessa.ts';
import Amumu from './champion/Amumu.ts';
import Anivia from './champion/Anivia.ts';
import Annie from './champion/Annie.ts';
import Aphelios from './champion/Aphelios.ts';
import Ashe from './champion/Ashe.ts';
import AurelionSol from './champion/AurelionSol.ts';
import Aurora from './champion/Aurora.ts';
import Azir from './champion/Azir.ts';
import Bard from './champion/Bard.ts';
import Belveth from './champion/Belveth.ts';
import Blitzcrank from './champion/Blitzcrank.ts';
import Brand from './champion/Brand.ts';
import Braum from './champion/Braum.ts';
import Briar from './champion/Briar.ts';
import Caitlyn from './champion/Caitlyn.ts';
import Camille from './champion/Camille.ts';
import Cassiopeia from './champion/Cassiopeia.ts';
import Chogath from './champion/Chogath.ts';
import Corki from './champion/Corki.ts';
import Darius from './champion/Darius.ts';
import Diana from './champion/Diana.ts';
import Draven from './champion/Draven.ts';
import DrMundo from './champion/DrMundo.ts';
import Ekko from './champion/Ekko.ts';
import Elise from './champion/Elise.ts';
import Evelynn from './champion/Evelynn.ts';
import Ezreal from './champion/Ezreal.ts';
import Fiddlesticks from './champion/Fiddlesticks.ts';
import Fiora from './champion/Fiora.ts';
import Fizz from './champion/Fizz.ts';
import Galio from './champion/Galio.ts';
import Gangplank from './champion/Gangplank.ts';
import Garen from './champion/Garen.ts';
import Gnar from './champion/Gnar.ts';
import Graves from './champion/Graves.ts';
import Gwen from './champion/Gwen.ts';
import Hecarim from './champion/Hecarim.ts';
import Heimerdinger from './champion/Heimerdinger.ts';
import Hwei from './champion/Hwei.ts';
import Illaoi from './champion/Illaoi.ts';
import Irelia from './champion/Irelia.ts';
import Ivern from './champion/Ivern.ts';
import Janna from './champion/Janna.ts';
import JarvanIV from './champion/JarvanIV.ts';
import Jax from './champion/Jax.ts';
import Jayce from './champion/Jayce.ts';
import Jhin from './champion/Jhin.ts';
import Jinx from './champion/Jinx.ts';
import Kaisa from './champion/Kaisa.ts';
import Kalista from './champion/Kalista.ts';
import Karma from './champion/Karma.ts';
import Karthus from './champion/Karthus.ts';
import Kassadin from './champion/Kassadin.ts';
import Katarina from './champion/Katarina.ts';
import Kayle from './champion/Kayle.ts';
import Kayn from './champion/Kayn.ts';
import Kennen from './champion/Kennen.ts';
import Khazix from './champion/Khazix.ts';
import Kindred from './champion/Kindred.ts';
import Kled from './champion/Kled.ts';
import KogMaw from './champion/KogMaw.ts';
import KSante from './champion/KSante.ts';
import Leblanc from './champion/Leblanc.ts';
import LeeSin from './champion/LeeSin.ts';
import Leona from './champion/Leona.ts';
import Lillia from './champion/Lillia.ts';
import Lissandra from './champion/Lissandra.ts';
import Locke from './champion/Locke.ts';
import Lucian from './champion/Lucian.ts';
import Lulu from './champion/Lulu.ts';
import Lux from './champion/Lux.ts';
import Malphite from './champion/Malphite.ts';
import Malzahar from './champion/Malzahar.ts';
import Maokai from './champion/Maokai.ts';
import MasterYi from './champion/MasterYi.ts';
import Mel from './champion/Mel.ts';
import Milio from './champion/Milio.ts';
import MissFortune from './champion/MissFortune.ts';
import MonkeyKing from './champion/MonkeyKing.ts';
import Mordekaiser from './champion/Mordekaiser.ts';
import Morgana from './champion/Morgana.ts';
import Naafiri from './champion/Naafiri.ts';
import Nami from './champion/Nami.ts';
import Nasus from './champion/Nasus.ts';
import Nautilus from './champion/Nautilus.ts';
import Neeko from './champion/Neeko.ts';
import Nidalee from './champion/Nidalee.ts';
import Nilah from './champion/Nilah.ts';
import Nocturne from './champion/Nocturne.ts';
import Nunu from './champion/Nunu.ts';
import Olaf from './champion/Olaf.ts';
import Orianna from './champion/Orianna.ts';
import Ornn from './champion/Ornn.ts';
import Pantheon from './champion/Pantheon.ts';
import Poppy from './champion/Poppy.ts';
import Pyke from './champion/Pyke.ts';
import Qiyana from './champion/Qiyana.ts';
import Quinn from './champion/Quinn.ts';
import Rakan from './champion/Rakan.ts';
import Rammus from './champion/Rammus.ts';
import RekSai from './champion/RekSai.ts';
import Rell from './champion/Rell.ts';
import Renata from './champion/Renata.ts';
import Renekton from './champion/Renekton.ts';
import Rengar from './champion/Rengar.ts';
import Riven from './champion/Riven.ts';
import Rumble from './champion/Rumble.ts';
import Ryze from './champion/Ryze.ts';
import Samira from './champion/Samira.ts';
import Sejuani from './champion/Sejuani.ts';
import Senna from './champion/Senna.ts';
import Seraphine from './champion/Seraphine.ts';
import Sett from './champion/Sett.ts';
import Shaco from './champion/Shaco.ts';
import Shen from './champion/Shen.ts';
import Shyvana from './champion/Shyvana.ts';
import Singed from './champion/Singed.ts';
import Sion from './champion/Sion.ts';
import Sivir from './champion/Sivir.ts';
import Skarner from './champion/Skarner.ts';
import Smolder from './champion/Smolder.ts';
import Sona from './champion/Sona.ts';
import Soraka from './champion/Soraka.ts';
import Swain from './champion/Swain.ts';
import Sylas from './champion/Sylas.ts';
import Syndra from './champion/Syndra.ts';
import TahmKench from './champion/TahmKench.ts';
import Taliyah from './champion/Taliyah.ts';
import Taric from './champion/Taric.ts';
import Teemo from './champion/Teemo.ts';
import Thresh from './champion/Thresh.ts';
import TwistedFate from './champion/TwistedFate.ts';
import Udyr from './champion/Udyr.ts';
import Varus from './champion/Varus.ts';
import Vayne from './champion/Vayne.ts';
import Veigar from './champion/Veigar.ts';
import Viego from './champion/Viego.ts';
import Viktor from './champion/Viktor.ts';
import Vladimir from './champion/Vladimir.ts';
import Volibear from './champion/Volibear.ts';
import Yasuo from './champion/Yasuo.ts';
import Yone from './champion/Yone.ts';
import Zaahen from './champion/Zaahen.ts';
import Zeri from './champion/Zeri.ts';
import Zilean from './champion/Zilean.ts';
import type { IEffectControlsProps, ISpecificVariables, IAbilityImgIndexGetter } from './index';

/** specific champions' helpers, utils and calculations */
export const CHAMPION_SPECIFICS = {
	TargetDummy: {
		setupData(self) {
			return Object.fromEntries(
				ALL_CHAMPION_STATS_ENTRIES.map(([statName, statMeta]) => {
					return [statName, Math.max(0, self.internalData.value[statName] ?? self.stats.value.initial[statName] * (statMeta.isPercentage ? 100 : 1))];
				}),
			) as IChampionStats;
		},
		calculateHooks: {
			postInit: {
				handler(self, { baseStats, championPassiveStats }) {
					for (const [statName, statMeta] of ALL_CHAMPION_STATS_ENTRIES) {
						if (statName === 'bonusAttackSpeedPercent') {
							championPassiveStats.bonusAttackSpeedPercent = self.internalData.value[statName] * (statMeta.isPercentage ? 0.01 : 1);
						} else if (self.internalData.value[statName] !== undefined) {
							baseStats[statName] = self.internalData.value[statName] * (statMeta.isPercentage ? 0.01 : 1);
						}
					}
				},
			},
		},
	},
	Aatrox,
	Ahri,
	Akali,
	Akshan,
	Alistar,
	Ambessa,
	Amumu,
	Anivia,
	Annie,
	Aphelios,
	Ashe,
	AurelionSol,
	Aurora,
	Azir,
	Bard,
	Belveth,
	Blitzcrank,
	Brand,
	Braum,
	Briar,
	Caitlyn,
	Camille,
	Cassiopeia,
	Chogath,
	Corki,
	Darius,
	Diana,
	DrMundo,
	Draven,
	Ekko,
	Elise,
	Evelynn,
	Ezreal,
	Fiddlesticks,
	Fiora,
	Fizz,
	Galio,
	Gangplank,
	Garen,
	Gnar,
	Graves,
	Gwen,
	Hecarim,
	Heimerdinger,
	Hwei,
	Illaoi,
	Irelia,
	Ivern,
	Janna,
	JarvanIV,
	Jax,
	Jayce,
	Jhin,
	Jinx,
	KSante,
	Kaisa,
	Kalista,
	Karma,
	Karthus,
	Kassadin,
	Katarina,
	Kayle,
	Kayn,
	Kennen,
	Khazix,
	Kindred,
	Kled,
	KogMaw,
	Leblanc,
	LeeSin,
	Leona,
	Lillia,
	Lissandra,
	Locke,
	Lucian,
	Lulu,
	Lux,
	Malphite,
	Malzahar,
	Maokai,
	MasterYi,
	Mel,
	Milio,
	MissFortune,
	MonkeyKing,
	Mordekaiser,
	Morgana,
	Naafiri,
	Nami,
	Nasus,
	Nautilus,
	Neeko,
	Nidalee,
	Nilah,
	Nocturne,
	Nunu,
	Olaf,
	Orianna,
	Ornn,
	Pantheon,
	Poppy,
	Pyke,
	Qiyana,
	Quinn,
	Rakan,
	Rammus,
	RekSai,
	Rell,
	Renata,
	Renekton,
	Rengar,
	Riven,
	Rumble,
	Ryze,
	Samira,
	Sejuani,
	Senna,
	Seraphine,
	Sett,
	Shaco,
	Shen,
	Shyvana,
	Singed,
	Sion,
	Sivir,
	Skarner,
	Smolder,
	Sona,
	Soraka,
	Swain,
	Sylas,
	Syndra,
	TahmKench,
	Taliyah,
	Taric,
	Teemo,
	Thresh,
	TwistedFate,
	Udyr,
	Varus,
	Vayne,
	Veigar,
	Viego,
	Viktor,
	Vladimir,
	Volibear,
	Yasuo,
	Yone,
	Zaahen,
	Zeri,
	Zilean,
} satisfies IHypotheticalChampionSpecifics;

export type TChampionSpecifics = typeof CHAMPION_SPECIFICS;
export type IHypotheticalChampionSpecifics = {
	[Id in IChampionId]?: IChampionSpecific<Id>;
};

export type IChampionSpecific<Id extends IChampionId | undefined = undefined> = IProviderGroupDataSetup<Id, Id extends keyof IChampionInternalDataMap ? IChampionInternalDataMap[Id] : never> & {
	[AbilityKey in IChampionAbilityKey]?: IChampionAbilitySpecific<Id>;
} & {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	calculateHooks?: ICalculateChampionStatsHookSource<Id>;
	effectOntoTargetVars?: IEffectOntoTargetVarsHook<Id>;
	[key: string]: any;
};

export interface IChampionAbilitySpecific<Id extends IChampionId | undefined = undefined> {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	effectControls?: IEffectControlsProps<any, Id>;
	/** ability will be styled as disabled (grayscale), for example Kled dismounted E & R */
	isDisabled?: (self: DamageSource) => boolean | number | undefined;
	/** overrides for every ability's variant data */
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	/** called in `scripts/updateData`, if present the tooltip text will be replaced with the value returned from this function. It's passed the original text */
	preplaceTooltipText?: (value: string) => string;
	/**
	 * called in `scripts/updateData` after ability variant's data is extracted (before resolving tooltip stringtable values)
	 * @note it's called for every variant of the ability, put it under variant index to run it only for that one
	 */
	modifyVariantData?: (
		abilityVariant: IChampionAbilityVariant,
		/** is the champion.bin.json file, merged with any additional characters */
		binData: any,
		/** the champion.bin.json's original variant object */
		variantData: any,
	) => void;
	/**
	 * object names of additional ability variants to be extracted during `updateData`
	 * maybe there's a way not to have to declare these manually but in the ability's data I don't see anything that would point an ability's object to what it belongs to (QWER). `updateData` script warns about potential detected but missed ability variants
	 */
	additionalVariantsObjectNames?: string[];
	/** additional variants to omit from any potential detected ones. They are not skipped when found, just not warned about when detecting any missed ones */
	omittedVariantObjectNames?: string[];

	/** for when an ability variant has multiple images and they should dynamically change */
	abilityImgVariantIndex?: IAbilityImgIndexGetter<any, Id>;
	[key: string]: any;
	/**
	 * ability's variant specific
	 * something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be for variant 0 of Amumu's passive
	 */
	[key: number]: IChampionAbilityVariantSpecific<Id>;
}

export type IChampionAbilityVariantSpecific<Id extends IChampionId | undefined = undefined> = IProviderGroupImageText & {
	variables?: ISpecificVariables<any, any, Id, 'championAbility'>;
	dataOverrides?: IChampionAbilityVariantDataOverrides;
	modifyVariantData?: (abilityVariant: IChampionAbilityVariant) => void;
};

interface IChampionAbilityVariantDataOverrides {
	isImmobilizing?: boolean;
}

export interface IChampionInternalDataMap {
	TargetDummy: IChampionStats;
	Akali: { isPassiveMSActive: number; passiveRangeSnapshot?: number };
	Akshan: { passiveMSProgress: number };
	Ambessa: { hasPassiveStack: number };
	Amumu: { applyPassive: number };
	Anivia: { isEgg: number };
	Aphelios: { lastRotatedVariantIndex: number; gravitumSlowProgress: number };
	Ashe: { frostShot: number };
	AurelionSol: { passiveStacks: number };
	Bard: { passiveStacks: number; chimeMoveSpeed: number };
	Belveth: { passiveStacks: number; hasPassiveStack: number };
	Chogath: { ultStacks: number };
	Darius: { isChampionAtMaxBleed: number };
	Diana: { isPassiveEmpowered: number };
	Draven: { passiveStacks: number };
	Ekko: { isPassiveMSActive: number };
	Ezreal: { passiveStacks: number };
	Fiora: { passiveMSProgress: number };
	Gangplank: { isPassiveMSActive: number };
	Garen: { isPassiveActive: number };
	Graves: { eStacks: number };
	Heimerdinger: { isPassiveMSActive: number };
	Irelia: { passiveStacks: number };
	Jax: { passiveStacks: number };
	Jayce: { isPassiveMSActive: number };
	Jhin: { isPassiveMSActive: number };
	Jinx: { passiveStacks: number; passiveMSProgress: number; qBuff: number };
	Kaisa: { passiveStacksOnTarget: number; eBuff: number };
	Kayle: { passiveStacks: number };
	Kayn: { form: number };
	Khazix: { rEvolvesMask: number };
	Kindred: { passiveStacks: number };
	Kled: {
		kledCurrentHP: number;
		skaarlCurrentHP: number;
		runningTowardsEnemy: number;
		enemiesNearby: number;
	};
	KogMaw: { passiveMSProgress: number };
	LeeSin: { hasPassiveStack: number };
	Lissandra: { applyZombieSlow: number };
	Locke: { rStacks: number };
	Malphite: { isPassiveActive: number };
	Milio: { passiveAllySourceId: string; _passiveAllyAD: ComputedRef<number> };
	Mordekaiser: { isPassiveMSActive: number };
	Naafiri: { passiveStacks: number };
	Nami: {
		passiveMSProgress: number;
		/**
		 * passive MS needs total AP. Snapshot it on extra component `calculate/recalculate` press, then use it in calculation
		 * basically lets you do something like: apply passive -> you gain stats -> apply passive again with the stats you have from the previous application
		 */
		passiveMSTotalAp?: number;
	};
	MonkeyKing: { passiveStacks: number };
	Nasus: { wProgress: number };
	Nidalee: { passiveVariantActive: number };
	Nunu: { isPassiveActive: number };
	Orianna: { passiveStacksOnTarget: number };
	Ornn: { _masterworkLevel: number; masterworkItemSlot: number; passiveUpgradedAllies: number };
	Poppy: { isPassiveActive: number };
	Rammus: { defensiveCurl: number };
	Rell: { passiveStacksOnTarget: number };
	Rengar: { passiveStacks: number; isPassiveMSActive: number };
	Rumble: { isOverheated: number };
	Samira: { passiveStacks: number };
	Sejuani: { isPassiveActive: number };
	Senna: { passiveStacks: number; passiveStealTargetMS: number };
	Seraphine: { passiveStacks: number };
	Shyvana: { passiveStacks: number };
	Sion: { wStacks: number };
	Singed: { passiveStacks: number };
	Sivir: { passiveMSProgress: number };
	Smolder: { passiveStacks: number };
	Sona: { passiveStacks: number };
	Soraka: { isPassiveMSActive: number };
	Swain: { passiveStacks: number };
	Sylas: { hasPassiveStack: number };
	Syndra: { passiveStacks: number };
	Taliyah: { isPassiveMSActive: number };
	Taric: { hasPassiveStack: number };
	Teemo: { isPassiveASActive: number };
	Thresh: { passiveStacks: number };
	Udyr: { hasPassiveStack: number };
	Varus: { passiveVariantActive: number };
	Vayne: { isPassiveMSActive: number };
	Veigar: { passiveStacks: number };
	Viktor: { passiveAbilityUpgradesMask: number };
	Volibear: { passiveStacks: number };
	Zaahen: { passiveStacks: number };
	Zeri: { rActive: number; rStacks: number };
}
