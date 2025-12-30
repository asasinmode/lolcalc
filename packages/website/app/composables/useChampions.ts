import { data } from '../assets/champion.json';

export function useChampions(): Record<IChampionId, IChampion> {
	return data satisfies Record<IChampionId, IChampion>;
}

export type IChampionId = keyof typeof data;

export interface IChampionData {
	version: string;
	champions: Record<IChampionId, IChampion>;
}

export type IChampionRole = 'top' | 'jungle' | 'middle' | 'bottom' | 'support';

export type IChampionStat = keyof (typeof data)[keyof typeof data]['stats'];

export interface IChampion {
	id: string;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
}
