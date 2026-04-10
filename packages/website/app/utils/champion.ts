import type { IPossibleDynamicValues, IProviderGroupEffect, IProviderGroupImageText, IProviderGroupInternalData } from './types';

export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

/**
 * object containing specific champion's helpers, utils and calculations
 * for `POSSIBLE_DYNAMIC_VALUES` see `./types.d.ts`
 */
export const CHAMPION_SPECIFICS = {
	Amumu: {
		setupInternalData(self): { applyPassive: number } {
			return {
				applyPassive: Math.max(0, Math.min(1, self.internalData.value.applyPassive ?? 0)),
			};
		},
		passive: {
			0: {
				setupEffectData(self, effect): [cursedTouch: number] {
					console.log('setting up amumu passive effect', effect, self.appliedEffects.value);
					return [Math.min(0, Math.max(1, effect?.data[0] ?? 0))];
				},
				isEffectActive(data) {
					return (data as [cursedTouch: number])[0];
				},
			},
		},
	},
	Aphelios: {
		WEAPON_ORDER_MAP: { calibrum: 0, severum: 1, gravitum: 2, infernum: 3, crescendum: 4 } satisfies Record<IApheliosWeapon, number>,
		/* stringtable variants are different from order actual weapon order - `apheliosgun_name_1` is for calibrum and so on */
		WEAPON_VARIANT_MAP: { calibrum: 1, severum: 2, infernum: 3, crescendum: 4, gravitum: 5 } satisfies Record<IApheliosWeapon, number>,
		POSSIBLE_DYNAMIC_VALUES: {
			/* f2-f5 variants are covered by f1, they seem to be intended for different guns but resolve to the same values */
			f1: [1, 2, 3, 4, 5],
			f2: [],
			f3: [],
			f4: [],
			f5: [],
			/* array of 12, 13, ..., 21, 23, ..., 53, 53 - no 2 repeated numbers like 11, 22 */
			f7: Array.from({ length: 5 }, (_, i) => i + 1).flatMap(i => Array.from({ length: 5 }, (_, j) => i === (j + 1) ? undefined : `${i}${j + 1}`).filter(Boolean)) as string[],
		},
		setupInternalData(self): IDamageSourceInternalDataBase & {
			mainHand: IApheliosWeapon;
			offHand: IApheliosWeapon;
		} {
			self.abilityVariantsIndexes.value.w = CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP.severum;
			self.abilityVariantsIndexes.value.e = CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP.gravitum;

			return {
				mainHand: 'calibrum',
				offHand: 'severum',
				_watchHandles: markRaw([watch(() => `${self.champion.value?.id}${self.level.value}`, () => {
					self.abilityLevels.value.r = Math.floor((self.level.value - 1) / 5);
				}, { immediate: true })]),
			};
		},
		e: {
			POSSIBLE_DYNAMIC_VALUES: {
				f1: [1, 2, 3],
			},
		},
	},
	Kayn: {
		POSSIBLE_DYNAMIC_VALUES: {
			f1: [0, 1, 2],
		},
	},
	Veigar: {
		setupInternalData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
} satisfies Partial<{
	[Id in IChampionId]: IChampionSpecific
}>;

export type TChampionSpecifics = typeof CHAMPION_SPECIFICS;

export type IChampionSpecific = IProviderGroupInternalData & {
	[AbilityKey in IChampionAbilityKey]?: IChampionAbilitySpecific;
} & {
	/** champion's possible dynamic values, can be overriden per ability and ability variant */
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
	[key: string]: any;
};

export interface IChampionAbilitySpecific {
	/** ability's possible dynamic values, variant can override */
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
	/**
	 * ability's variant specific
	 * something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be for variant 0 of Amumu's passive
	 */
	[key: number]: IChampionAbilityVariantSpecific;
}

export type IChampionAbilityVariantSpecific = IProviderGroupEffect & IProviderGroupImageText & {
	// TODO unused at the moment, possibly no need for it and just the one on ability level is fine
	// if used, `updateGameData` script should also merge it in `possibleChampionDynamicVariableValues`
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
};
