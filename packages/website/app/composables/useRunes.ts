import type { UnionKeys } from '~/utils/types';
import fileData from '../assets/rune.json';

const { data } = fileData;

export function useRunes() {
	return data as unknown as IRunes;
}

export const RUNE_SLOT_NAME_TO_NUMBER = Object.fromEntries(Object.entries(data.paths)
	.flatMap(([, { slots }]) =>
		slots.flatMap((slot, slotIndex) => Object.keys(slot).map(slotName => [slotName, slotIndex])),
	),
) as Record<IRuneSlotName, number>;

type IDataShards = typeof data.shards;
type IDataPaths = typeof data.paths;

export type IRuneShardSlotName = keyof IDataShards;
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
