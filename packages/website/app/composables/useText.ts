import { data } from '../assets/text.json';

export function useText() {
	return data satisfies ITextData;
}

interface ITextData {
	items: Record<string, {
		tooltipShop: string;
	}>;
}
