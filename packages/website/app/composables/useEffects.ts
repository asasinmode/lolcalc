import { data, stringtable } from '../assets/effect.json';

const rv = { data, stringtable };

export function useEffects() {
	return rv satisfies IEffectData;
}

export interface IEffectData {
	data: Record<string, {
		description: string;
		dataKey: string;
	}>;
	stringtable: Record<string, string>;
}
