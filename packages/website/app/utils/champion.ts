export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

const aph1to5 = [1, 2, 3, 4, 5];

type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

export const CHAMPION_SPECIFICS = {
	Aphelios: {
		WEAPON_ORDER_MAP: { calibrum: 0, severum: 1, gravitum: 2, infernum: 3, crescendum: 4 } satisfies Record<IApheliosWeapon, number>,
		/* stringtable variants are different from order. `apheliosgun_name_1` is for calibrum and so on */
		WEAPON_VARIANT_MAP: { calibrum: 1, severum: 2, infernum: 3, crescendum: 4, gravitum: 5 } satisfies Record<IApheliosWeapon, number>,
		POSSIBLE_DYNAMIC_VALUES: {
			/* f2-f5 variants are covered by f1, they seem to be intended for different guns but resolve to the same values */
			f1: aph1to5,
			f2: [],
			f3: [],
			f4: [],
			f5: [],
			f7: Array.from({ length: 5 }, (_, i) => i + 1).flatMap(i => Array.from({ length: 5 }, (_, j) => i === (j + 1) ? undefined : `${i}${j + 1}`).filter(Boolean)) as string[],
		},
		setupInternalData(self: DamageSource): {
			mainHand: IApheliosWeapon;
			offHand: IApheliosWeapon;
		} {
			self.abilityVariants.value.w = CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP.severum;
			self.abilityVariants.value.e = CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP.gravitum;
			return {
				mainHand: 'calibrum',
				offHand: 'severum',
			};
		},
	},
	Kayn: {
		POSSIBLE_DYNAMIC_VALUES: {
			f1: [0, 1, 2],
		},
	},
};
