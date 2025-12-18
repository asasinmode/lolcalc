import { data, version } from '~/assets/runes.json';

export function useRunes(): IRuneData {
	return {
		version,
		runes: data,
	};
}

export interface IRuneData {
	version: string;
	runes: typeof data;
}

type IDataShards = typeof data.shards;

export type IRuneShards = {
	[K in keyof IDataShards]: keyof IDataShards[K];
};

export interface IChampionRunes {
	shards: IRuneShards;
}
