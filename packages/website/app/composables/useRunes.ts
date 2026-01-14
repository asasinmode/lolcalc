import type { UnionKeys } from '~/utils/types';
import { data } from '../assets/rune.json';

export function useRunes() {
	return data as unknown as IRunes;
}

type IDataShards = typeof data.shards;
type IDataPaths = typeof data.paths;

export type IRuneShardSlotName = keyof IDataShards;
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
	shards: {
		[S in IRuneShardSlotName]: {
			[V in keyof IDataShards[S]]: {
				id: number;
				icon: string;
				effectAmount: Record<string, number>;
			}
		}
	};
}

export interface IChampionRunes {
	paths: {
		primary: IRunePathName | undefined;
		primarySlots: (IRuneSlotName | undefined)[];
		secondary: IRunePathName | undefined;
		secondarySlots: (IRuneSlotName | undefined)[];
	};
	shards: {
		[K in IRuneShardSlotName]: keyof IDataShards[K];
	};
}
