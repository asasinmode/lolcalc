import type { IMiscSpecificKey } from '@lolcalc/shared';
import type { IProviderGroupInternalMiscData } from '../DamageSource';
import type { IGameImageData } from '../misc';
import { UI } from '@lolcalc/data';
import { clamp } from '@lolcalc/shared/utils.ts';

export const MISC_SPECIFICS = {
	CloudStack: {
		abilityImage: UI.dragons.Cloud.stack,
		internalDataProperties: ['isOOC'],
		setupData(self) {
			self.internalMiscData.value.isOOC = clamp(0, self.internalMiscData.value.isOOC ?? 0, 1);
			return { isOOC: 0 };
		},
	},
	CloudSoul: {
		abilityImage: UI.dragons.Cloud.soulActive,
		internalDataProperties: ['isOOC', 'hasUlted'],
		setupData(self) {
			self.internalMiscData.value.isOOC = clamp(0, self.internalMiscData.value.isOOC ?? 0, 1);
			self.internalMiscData.value.hasUlted = clamp(0, self.internalMiscData.value.hasUlted ?? 0, 1);
			return { isOOC: 0, hasUlted: 0 };
		},
	},
} satisfies IHypotheticalMiscSpecifics;

export type IHypotheticalMiscSpecifics = Partial<Record<IMiscSpecificKey, IMiscSpecific>>;

export type TMiscSpecifics = typeof MISC_SPECIFICS;

export type IMiscSpecific = IProviderGroupInternalMiscData & {
	abilityImage: IGameImageData;
};
