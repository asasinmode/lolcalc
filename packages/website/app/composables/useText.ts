import { data } from '../assets/text.json';

export function useText(): ITextData {
	return data;
}

export interface ITextData {
	items: Record<string, {
		subtitleLeft?: string;
		subtitleRight?: string;
		/** the <rules> tag shown below the extras when holding shift */
		rules?: string;
		/** the extra text that's below the stats when hovering item in shop */
		tooltipShop?: string[][];
		/**
		 * same as `extrasShop` but in inventory
		 * present if source has it and is different from the shop one
		 * differs in for example using the computed variables for the champion like AD gained from Overlord's Bloodmail
		 */
		tooltipInventory?: string[][];
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
				/** the tooltip displayed when hovering over in game stats panel */
				tooltipStats: string;
			}>;
		};
	};
	dragons: Record<IDragonName, {
		stack: string;
		soul: string;
	}>;
	roleQuests: Record<IChampionRole, string[]>;
	stringtable: Record<string, string>;
}
