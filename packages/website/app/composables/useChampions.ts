import type ExampleChampion from '../../public/data/champion/Ahri.json';
import { data } from '../assets/champion.json';

export function useChampions(): Record<IChampionId, IListedChampion> {
	return data satisfies Record<IChampionId, IListedChampion>;
}

const championCache = new Map<IChampionId, IChampion>();

export async function useChampion(id: string): Promise<IChampion> {
	const cacheHit = championCache.get(id as IChampionId);
	if (cacheHit) {
		return cacheHit;
	}
	const champion = await $fetch<IChampion>(`/data/champion/${id}.json`);
	championCache.set(id as IChampionId, champion);
	return champion;
}

export type IChampionId = keyof typeof data;

export interface IChampionData {
	version: string;
	champions: Record<IChampionId, IChampion>;
}

export type IChampionRole = 'top' | 'jungle' | 'middle' | 'bottom' | 'support';

export type IChampionStat = keyof typeof ExampleChampion['stats'];

export interface IChampion {
	version: string;
	id: string;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	abilities: Record<'passive' | 'q' | 'w' | 'e' | 'r', IChampionAbility>;
	/** nested stringtable variables used in champion abilities' descriptions */
	stringtable: Record<string, string>;
}

export interface IListedChampion extends Pick<IChampion, 'id' | 'name'> {
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
}

export interface IChampionAbilityVariant {
	name?: string;
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
