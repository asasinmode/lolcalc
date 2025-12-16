import { data, version } from '~/assets/champion.json';

export function useChampions(): IChampionData {
	return {
		version,
		champions: data satisfies Record<IChampionId, IChampion>,
	};
}

export type IChampionId = keyof typeof data;

export interface IChampionData {
	version: string;
	champions: Record<IChampionId, IChampion>;
}

export type IChampionRole = 'top' | 'jungle' | 'middle' | 'bottom' | 'support';

export interface IChampion {
	id: string;
	key: string;
	name: string;
	partype: string;
	stats: {
		hp: number;
		hpperlevel: number;
		mp: number;
		mpperlevel: number;
		movespeed: number;
		armor: number;
		armorperlevel: number;
		spellblock: number;
		spellblockperlevel: number;
		attackrange: number;
		hpregen: number;
		hpregenperlevel: number;
		mpregen: number;
		mpregenperlevel: number;
		crit: number;
		critperlevel: number;
		attackdamage: number;
		attackdamageperlevel: number;
		attackspeedperlevel: number;
		attackspeed: number;
	};
	image: {
		full: string;
		sprite: string;
		group: string;
		x: number;
		y: number;
		w: number;
		h: number;
	};
	roles: Partial<Record<IChampionRole, boolean>>;
}
