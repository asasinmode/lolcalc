import type { IDragonName } from '@lolcalc/data/types';
import type { IProviderGroupInternalMiscData } from '../DamageSource';
import { clamp } from '@lolcalc/shared/utils';

export const MISC_SPECIFICS = {
	CloudStack: {
		internalDataProperties: ['isOOC'],
		setupData(self) {
			self.internalMiscData.value.isOOC = clamp(0, self.internalMiscData.value.isOOC ?? 0, 1);
			return { isOOC: 0 };
		},
	},
	CloudSoul: {
		internalDataProperties: ['isOOC', 'hasUlted'],
		setupData(self) {
			self.internalMiscData.value.isOOC = clamp(0, self.internalMiscData.value.isOOC ?? 0, 1);
			self.internalMiscData.value.hasUlted = clamp(0, self.internalMiscData.value.hasUlted ?? 0, 1);
			return { isOOC: 0, hasUlted: 0 };
		},
	},
} satisfies IHypotheticalMiscSpecifics;

export type IHypotheticalMiscSpecifics = Partial<Record<IMiscSpecificKey, IMiscSpecific>>;

type IMiscSpecificKey = `${IDragonName}Stack` | `${IDragonName}Soul`;

export type IMiscSpecific = IProviderGroupInternalMiscData;
