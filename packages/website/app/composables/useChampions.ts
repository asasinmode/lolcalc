import type ExampleChampion from '../../public/data/champion/Ahri.json';
import { data } from '../assets/champion.json';

export function useChampions(): IChampionData {
	return data satisfies Record<IChampionId, IListedChampion<any>> as IChampionData;
}

const championCache = new Map<IChampionId, IChampion>();

export async function useChampion(id: string): Promise<IChampion> {
	const cacheHit = championCache.get(id as IChampionId);
	if (cacheHit) {
		return cacheHit;
	}
	/*
	 * if this runs on server, for example a DamageSource with champion id is present during `nuxt generate`, the build will fail with out of memory error because it rerequests itself over and over or something
	 * atm just generate app with empty DamageSource to work around this
	 */
	const champion = await $fetch<IChampion>(`/data/champion/${id}.json`);
	championCache.set(id as IChampionId, champion);
	return champion;
}

export type IChampionId = keyof typeof data;

type IChampionData = { [Id in IChampionId]: IListedChampion<Id> };

export type IChampionRole = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

export type IChampionStat = keyof typeof ExampleChampion['stats'];

export interface IChampion<T extends IChampionId = any> {
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

export interface IListedChampion<T extends IChampionId = any> extends Pick<IChampion<T>, 'id' | 'name'> {
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
	tooltipExtended?: string;
	tooltipExtendedBelowLine?: string;
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
