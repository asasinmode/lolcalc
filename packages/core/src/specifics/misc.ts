import type { IMiscSpecificKey } from '@lolcalc/shared';
import type { IProviderGroupInternalMiscData } from '../DamageSource';
import type { IGameImageData } from '../misc';
import { UI } from '@lolcalc/data';
import { clamp } from '@lolcalc/shared/utils.ts';

/**
 * various misc ability specifics
 * order of the keys matters for stringifying game ability id, if it changes it could warrant updating stringified state version
 */
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

export const MISC_SPECIFICS_OBJECT_ENTRIES = Object.entries(MISC_SPECIFICS) as [IMiscSpecificKey, IMiscSpecific][];

export type IHypotheticalMiscSpecifics = Partial<Record<IMiscSpecificKey, IMiscSpecific>>;

export type TMiscSpecifics = typeof MISC_SPECIFICS;

export type IMiscSpecific = IProviderGroupInternalMiscData & {
	abilityImage: IGameImageData;
};
