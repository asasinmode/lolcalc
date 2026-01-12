import type { UnionKeys } from '~/utils/types';
import { data } from '../assets/rune.json';

export function useRunes() {
	return data as unknown as IRunes;
}

type IDataShards = typeof data.shards;
type IDataPaths = typeof data.paths;

type IRuneShards = {
	[K in keyof IDataShards]: keyof IDataShards[K];
};

export type IRunePathName = keyof IDataPaths;
export type IRuneSlotName = UnionKeys<IDataPaths[IRunePathName]['slots'][number]>;

interface IRunePath {
	id: number;
	name: IRunePathName;
	icon: string;
	iconColor: string;
	slots: [Partial<Record<IRuneSlotName, {
		id: number;
		name: IRuneSlotName;
		icon: string;
		effectAmount?: Record<string, number>;
		calculations?: Record<string, any>;
	}>>];
}

export interface IRunes {
	paths: Record<IRunePathName, IRunePath>;
	shards: IRuneShards;
}

export interface IChampionRunes {
	paths: {
		primary: IRunePathName | undefined;
		primarySlots: (IRuneSlotName | undefined)[];
		secondary: IRunePathName | undefined;
		secondarySlots: (IRuneSlotName | undefined)[];
	};
	shards: IRuneShards;
}
