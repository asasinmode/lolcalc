import { data } from '../assets/item.json';

for (const item of Object.values(data)) {
	markRaw(item);
}

export function useItems(): Record<string, IItem> {
	return data satisfies Record<string, IItem>;
}
