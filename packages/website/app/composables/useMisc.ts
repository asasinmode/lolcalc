import fileData from '../assets/misc.json' with { type: 'json' };

const { data } = fileData;

export function useMisc() {
	return data satisfies IMiscData;
}

export const ALL_DRAGON_NAMES = Object.keys(data.dragons) as IDragonName[];

export type IDragonName = 'Cloud' | 'Mountain' | 'Infernal' | 'Ocean' | 'Chemtech' | 'Hextech';

export interface IMiscData {
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
