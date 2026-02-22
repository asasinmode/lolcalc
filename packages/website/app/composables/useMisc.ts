import { data } from '../assets/misc.json';

export function useMisc() {
	return data satisfies IMiscData;
}

export const ALL_DRAGON_TYPES = Object.keys(data.dragons) as IDragonName[];

export type IDragonName = 'Cloud' | 'Mountain' | 'Infernal' | 'Ocean' | 'Chemtech' | 'Hextech';

interface IMiscData {
	dragons: Record<IDragonName, {
		name: string;
		stack: {
			objectName: string;
			dataValues: any;
		};
		soul: {
			objectName: string;
			dataValues: any;
		};
	}>;
}
