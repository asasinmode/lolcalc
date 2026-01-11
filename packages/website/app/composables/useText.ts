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
			tooltipShort: string;
			tooltipLong: string;
		}>;
	};
}
