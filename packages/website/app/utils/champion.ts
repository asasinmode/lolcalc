import type { IDamageSourceEffectApplier, IPossibleDynamicValues } from './types';

export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

const aph1to5 = [1, 2, 3, 4, 5];

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

export type TChampionSpecifics = typeof CHAMPION_SPECIFICS;

/**
	* `IChampionAbilityKey` are arrays which objects containing per variant specifics
	* so something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be all specifics for variant 0 of Amumu's passive
	*
	*/
export type IChampionSpecificsWithAbilities = {
	[AbilityKey in IChampionAbilityKey]?: IChampionAbilitySpecific;
};

export interface IChampionAbilitySpecific {
	/**
	 * ability's variant specific
	 * something like `CHAMPION_SPECIFICS.Amumu.passive[0]` would be all specific for variant 0 of Amumu's passive
	 */
	[key: number]: IChampionAbilityVariantSpecific;
}

export interface IChampionAbilityVariantSpecific extends IDamageSourceEffectApplier {
}

/**
 * object containing specific champion's helpers, utils and calculations
 * for `POSSIBLE_DYNAMIC_VALUES` see `./types.d.ts`
 */
export const CHAMPION_SPECIFICS = {
	Amumu: {
		passive: {
			0: {
				setupEffectData(self, effect): [cursedTouch: boolean] {
					console.log('setting up amumu passive effect', effect, self);
					return [Boolean(effect?.data[0])];
				},
				isEffectActive(data) {
					return (data as [cursedTouch: boolean])[0];
				},
			},
		},
	},
	Aphelios: {
		WEAPON_ORDER_MAP: { calibrum: 0, severum: 1, gravitum: 2, infernum: 3, crescendum: 4 } satisfies Record<IApheliosWeapon, number>,
		/* stringtable variants are different from order. `apheliosgun_name_1` is for calibrum and so on */
		WEAPON_VARIANT_MAP: { calibrum: 1, severum: 2, infernum: 3, crescendum: 4, gravitum: 5 } satisfies Record<IApheliosWeapon, number>,
		POSSIBLE_DYNAMIC_VALUES: {
			all: {
			/* f2-f5 variants are covered by f1, they seem to be intended for different guns but resolve to the same values */
				f1: aph1to5,
				f2: [],
				f3: [],
				f4: [],
				f5: [],
				f7: Array.from({ length: 5 }, (_, i) => i + 1).flatMap(i => Array.from({ length: 5 }, (_, j) => i === (j + 1) ? undefined : `${i}${j + 1}`).filter(Boolean)) as string[],
			},
			e: {
				f1: [1, 2, 3],
			},
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
	},
	Kayn: {
		POSSIBLE_DYNAMIC_VALUES: {
			all: {
				f1: [0, 1, 2],
			},
		},
	},
	Veigar: {
		setupInternalData(self): {
			veigarP: number;
		} {
			return {
				veigarP: Math.max(0, self.internalData.value.veigarP ?? 0),
			};
		},
	},
} satisfies Partial<{
	[Id in IChampionId]: {
		/**
		 * returns an `internalData` for specific `DamageSource`'s champion
		 * should reuse the existing `DamageSource.internalData` to set the values (for cloning)
		 * and expects the previous `internalData` values to be of correct type (from parsing stringified state), as in `DamageSource.fromStringifiedData` should ensure the values are parsed
		 * the property names should be fairly short for storing in state string
		 */
		setupInternalData?: (self: DamageSource<Id>) => any;
		POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
		passive?: IChampionAbilitySpecific;
		q?: IChampionAbilitySpecific;
		w?: IChampionAbilitySpecific;
		e?: IChampionAbilitySpecific;
		r?: IChampionAbilitySpecific;
		[key: string]: any;
	}
}>;
