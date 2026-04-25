import type ExampleChampion from '../../public/data/champion/Ahri.json';
import { data } from '../assets/champion.json';

export function useChampions(): IChampionData {
	return data satisfies Record<IChampionId, IListedChampion<any>> as IChampionData;
}

export const CHAMPION_KEY_TO_ID: Record<string, IChampionId> = Object.fromEntries(
	Object.entries(data).map(([id, { key }]) => [key, id as IChampionId]),
);

export const CHAMPION_ID_TO_KEY: Record<IChampionId, string> = Object.fromEntries(
	Object.entries(CHAMPION_KEY_TO_ID).map(([key, id]) => [id as IChampionId, key]),
) as Record<IChampionId, string>;

const championCache = new Map<IChampionId, Promise<IChampion>>();

export async function useChampion(id: string): Promise<IChampion> {
	const cacheHit = championCache.get(id as IChampionId);
	if (cacheHit) {
		return cacheHit;
	}
	/*
	 * if this runs on server, for example a DamageSource with champion id is present during `nuxt generate`, the build will fail with out of memory error because it rerequests itself over and over or something
	 */
	const promise = $fetch<IChampion>(`/data/champion/${id}.json`);
	championCache.set(id as IChampionId, promise);
	return promise;
}

export type IChampionId = keyof typeof data;

type IChampionData = { [Id in IChampionId]: IListedChampion<Id> };

export type IChampionRole = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

export type IChampionStat = keyof typeof ExampleChampion['stats'];

export interface IChampion<T extends IChampionId = IChampionId> {
	version: string;
	id: T;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	abilities: Record<'passive' | 'q' | 'w' | 'e' | 'r', IChampionAbility>;
	/** nested stringtable variables used in champion abilities' descriptions */
	stringtable: Record<string, string>;
}

export interface IListedChampion<T extends IChampionId = any> extends Pick<IChampion<T>, 'id' | 'key' | 'name'> {
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
}

export interface IChampionAbilityVariant {
	name: string;
	image: string;
	mana?: number[];
	cooldownTime?: number[];
	// TODO not sure if still needed, Aphelios variants use it maybe?
	// /** if present, means the variant uses the tooltip of another variant at the specified index */
	// tooltipVariantIndex?: number;
	tooltip?: string;
	/** tooltip shown when holding shift */
	tooltipExtended?: string;
	// TODO unused at the moment? dont remember what it was for, maybe for when all abilities' (not just passive) are fully resolved
	tooltipExtendedBelowLine?: string;
	/** the variables shown below the description when holding shift. Cooldown excluded, it's added manually */
	extendedVariables?: {
		/** like `QBaseDamage` */
		name: string;
		/**
		 * the stringtable key to override the default variable name with
		 * like `QBaseDamage` -> `spell_listtype_damage` -> `Damage`
		 */
		nameOverride?: string;
	}[];
	dataValues?: any;
	spellCalculations?: any;
	effectAmount?: any;
	dataKey: string;
	objectName: string;
}

export interface IChampionAbility {
	maxLevel: number;
	cooldownTime?: number[];
	/**
	 * champion ability can have multiple variants. Most champions abilities have 1 variant, but shapeshifters like Elise/Nidalee/Jayce have a variant for each form and Aphelios has many Q/E variants
	 * except for Aphelios, only first 2 variants are actually meaningful (used/shown in game as that ability). Abilities can have more variants than just 2 though (for example Elise Q). These additional variants are used for resolving the variables shown in the main 2 variants' tooltips and aren't supposed to be otherwise shown to the user
	 * for additional information see `scripts/updateGameData.ts` -> `championAbilityVariants`
	 */
	variants: IChampionAbilityVariant[];
}

export type IChampionAbilityKey = keyof IChampion['abilities'];
