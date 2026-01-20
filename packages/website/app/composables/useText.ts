import { data } from '../assets/text.json';

export function useText(): ITextData {
	return data;
}

export interface ITextData {
	items: Record<string, {
		tooltipShop: {
			subtitleLeft?: string;
			subtitleRight?: string;
			/** the extra text that's below the stats */
			extra?: string[][];
		};
	}>;
	runes: {
		paths: Record<string, { name: string; tooltip: string }>;
		slots: Record<string, {
			name: string;
			/** champ select rune dialog hover */
			tooltipShort: string;
			/** champ select rune dialog hover + shift */
			tooltipLong: string;
			/** the tooltip displayed when hovering over the in game stats panel */
			tooltipStats: string;
		}>;
		shards: {
			slotNames: Record<string, { name: string }>;
			slotValues: Record<string, {
				name: string;
				/** champ select rune dialog hover */
				tooltip: string;
			}>;
		};
	};
	stringtable: Record<string, string>;
}
