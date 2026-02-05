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
	id: string;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	abilities: Record<'passive' | 'q' | 'w' | 'e' | 'r', {
		image: string;
		maxLevel: number;
	}>;
}

export interface IListedChampion extends Pick<IChampion, 'id' | 'name'> {
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
}
