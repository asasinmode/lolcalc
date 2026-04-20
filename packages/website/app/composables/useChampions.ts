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
	// TODO unused at the moment? dont remember what it was for
	tooltipExtendedBelowLine?: string;
	/** the variables shown below the description when holding shift. Cooldown excluded, it's added manually */
	extendedVariables?: {
		type: string;
		/**
		 * the stringtable key to overrid the default variable name with
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
	variants: IChampionAbilityVariant[];
}

export type IChampionAbilityKey = keyof IChampion['abilities'];
