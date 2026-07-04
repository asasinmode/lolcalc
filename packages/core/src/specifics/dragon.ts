import type { TMiscData } from '@lolcalc/data';
import type { IDragonName } from '@lolcalc/data/types';
import type { ICalculateChampionStatsHookSource, IProviderGroupInternalDragonData } from '../DamageSource';
import { MISC } from '@lolcalc/data';
import { clamp } from '@lolcalc/shared/utils.ts';
import { addMultiplicative } from '../calculate/util.ts';

/**
 * dragon ability specifics
 * order of the keys matters for stringifying game ability id, if it changes it could warrant updating stringified state version
 */
export const DRAGON_SPECIFICS = {
	Cloud: {
		stack: {
			internalDataProperties: ['isOOC'],
			setupData(self) {
				self.internalDragonData.value.isOOC = clamp(0, self.internalDragonData.value.isOOC ?? 0, 1);
				return { isOOC: 0 };
			},
			calculateHooks: {
				onDragon: {
					handler(_self, { dragonStats }, { calculatedVariables }) {
						calculatedVariables.totalBonusPercentMoveSpeed += (MISC as TMiscData).dragons.Cloud.stack.dataValues.MSAmountPerStack[1]!;
						dragonStats.slowResist = addMultiplicative(dragonStats.slowResist, (MISC as TMiscData).dragons.Cloud.stack.dataValues.SRAmountPerStack[1]!);
					},
				},
			},
		},
		soul: {
			internalDataProperties: ['isOOC', 'hasUlted'],
			setupData(self) {
				self.internalDragonData.value.isOOC = clamp(0, self.internalDragonData.value.isOOC ?? 0, 1);
				self.internalDragonData.value.hasUlted = clamp(0, self.internalDragonData.value.hasUlted ?? 0, 1);
				return { isOOC: 0, hasUlted: 0 };
			},
		},
	},
} satisfies IHypotheticalDragonSpecifics;

export type IHypotheticalDragonSpecifics = Partial<Record<IDragonName, IDragonSpecific>>;

export type TDragonSpecifics = typeof DRAGON_SPECIFICS;

export interface IDragonSpecific {
	stack?: IDragonAbilitySpecific;
	soul?: IDragonAbilitySpecific;
};

export type IDragonAbilitySpecific = IProviderGroupInternalDragonData & {
	calculateHooks?: ICalculateChampionStatsHookSource;
};
