import { data } from '../assets/text.json';

export function useText(): ITextData {
	return data;
}

export interface ITextData {
	items: Record<string, {
		tooltipShop: {
			subtitleLeft?: string;
			subtitleRight?: string;
			/** just the extra text that's below the stats */
			extra?: string[][];
		};
	}>;
}
