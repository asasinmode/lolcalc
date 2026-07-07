import type { TMiscData } from '@lolcalc/data';
import type { IChampionRole } from '@lolcalc/shared/types';
import type { ISpecificVariables } from './index.ts';
import { MISC } from '@lolcalc/data';
import { defineVariables } from './index.ts';

export const MISC_SPECIFICS = {
	roleQuests: {
		top: {
			variables: defineVariables({
				known: {
					f1: [],
				},
				calculate() {
					return {
						f1: { value: (MISC as TMiscData).roleQuests.top.dataValues.ChannelDuration },
					};
				},
			}),
		},
		mid: {
			variables: defineVariables({
				known: {
					f1: [],
					f2: [],
				},
				calculate(self) {
					return {
						f1: { value: self.stats.value.variables.midQuestAd },
						f2: { value: self.stats.value.variables.midQuestAp },
					};
				},
			}),
		},
	},
} satisfies IHypotheticalMiscSpecifics;

export interface IHypotheticalMiscSpecifics {
	roleQuests: {
		[K in IChampionRole]?: IRoleQuestSpecific<K>
	};
}

type RoleQuestDataValues<T extends IChampionRole>
	= TMiscData['roleQuests'][T] extends { dataValues: infer D } ? D : never;

interface IRoleQuestSpecific<T extends IChampionRole> {
	variables?: ISpecificVariables<keyof RoleQuestDataValues<T> & string, string>;
}
