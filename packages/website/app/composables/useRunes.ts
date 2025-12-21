import { data } from '~/assets/runes.json';

export function useRunes() {
	return data;
}

type IDataShards = typeof data.shards;

export type IRuneShards = {
	[K in keyof IDataShards]: keyof IDataShards[K];
};

export interface IChampionRunes {
	shards: IRuneShards;
}
