import { data } from '../assets/text.json';

export function useText(): ITextData {
	return data;
}

interface ITextData {
	items: Record<string, {
		tooltipShop: string;
	}>;
}
