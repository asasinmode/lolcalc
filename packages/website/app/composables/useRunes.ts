import { data } from '../assets/rune.json';

export function useRunes() {
	return data as unknown as IChampionRunes;
}

type IDataShards = typeof data.shards;
type IDataPaths = typeof data.paths;

type IRuneShards = {
	[K in keyof IDataShards]: keyof IDataShards[K];
};

export type IRunePathName = keyof IDataPaths;

interface IRunePath {
	id: number;
	name: string;
	slots: [{
		id: number;
		name: string;
		effectAmount?: Record<string, number>;
		calculations?: Record<string, any>;
	}];
}

export interface IChampionRunes {
	paths: Record<IRunePathName, IRunePath>;
	shards: IRuneShards;
}
