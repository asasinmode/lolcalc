import type { UnionKeys } from '.';
import type IRunesData from '~/assets/rune.json';

type IDataShards = typeof IRunesData['data']['shards'];
type IDataPaths = typeof IRunesData['data']['paths'];

export type IRuneShardSlotName = keyof IDataShards;
export type IRuneShardSlotValue = {
	[K in keyof IDataShards]: keyof IDataShards[K]
}[keyof IDataShards];
export type IRunePathName = keyof IDataPaths;
export type IRuneSlotName = UnionKeys<IDataPaths[IRunePathName]['slots'][number]>;

export interface IRunePath {
	id: number;
	name: IRunePathName;
	icon: string;
	iconColor: string;
	slots: Partial<Record<IRuneSlotName, IRunePathSlot>>[];
}

export interface IRunePathSlot {
	id: number;
	name: IRuneSlotName;
	icon: string;
	effectAmount?: Record<string, number>;
	/** mCalculations from rune data, maybe should be kept as just calculations */
	calculations?: Record<string, any>;
}

export interface IRuneShard {
	id: number;
	icon: string;
	effectAmount?: Record<string, number>;
}

export type IRune = IRunePath | IRunePathSlot | IRuneShard;

export interface IRunes {
	paths: Record<IRunePathName, IRunePath>;
	shards: {
		[S in IRuneShardSlotName]: {
			[V in keyof IDataShards[S]]: IRuneShard
		}
	};
}

export interface IChampionRunes {
	paths: {
		primary: IRunePathName;
		primarySlots: (IRuneSlotName | undefined)[];
		secondary: IRunePathName | undefined;
		secondarySlots: (IRuneSlotName | undefined)[];
	};
	shards: {
		[K in IRuneShardSlotName]: keyof IDataShards[K];
	};
}
