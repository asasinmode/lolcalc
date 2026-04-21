import type Ezreal from '../../public/data/champion/Ezreal.json';
import type { IPossibleDynamicValues, IProviderGroupDataSetup, IProviderGroupImageText } from './types';

export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

/**
 * object containing specific champion's helpers, utils and calculations
 * for `POSSIBLE_DYNAMIC_VALUES` see `./types.d.ts`
 */
export const CHAMPION_SPECIFICS = {
	Ambessa: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, self.internalData.value.hasPassiveStack ?? 0, 1),
			};
		},
	},
	Amumu: {
		setupData(self): { applyPassive: number } {
			return {
				applyPassive: clamp(0, self.internalData.value.applyPassive ?? 0, 1),
			};
		},
	},
	Anivia: {
		setupData(self): { isEgg: number } {
			return {
				isEgg: clamp(0, self.internalData.value.isEgg ?? 0, 1),
			};
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
		setupData(self): IDamageSourceInternalDataBase & {
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
	AurelionSol: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Bard: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Belveth: {
		setupData(self): { passiveStacks: number; hasPassiveStack: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
				hasPassiveStack: clamp(0, self.internalData.value.passiveStacks ?? 0, 1),
			};
		},
	},
	Darius: {
		setupData(self): { isChampionAtMaxBleed: number } {
			return {
				isChampionAtMaxBleed: clamp(0, self.internalData.value.isChampionAtMaxBleed ?? 0, 1),
			};
		},
	},
	Diana: {
		setupData(self): { isPassiveEmpowered: number } {
			return {
				isPassiveEmpowered: clamp(0, self.internalData.value.isPassiveEmpowered ?? 0, 1),
			};
		},
	},
	Draven: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Ekko: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Ezreal: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Garen: {
		setupData(self): { isPassiveActive: number } {
			return {
				isPassiveActive: clamp(0, self.internalData.value.isPassiveActive ?? 0, 1),
			};
		},
	},
	Heimerdinger: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Irelia: {
		MAX_PASSIVE_STACKS: 4,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Jax: {
		MAX_PASSIVE_STACKS: 8,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Jhin: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Jinx: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Kaisa: {
		MAX_PASSIVE_STACKS: 4,
		setupData(self): { passiveStacksOnTarget: number } {
			return {
				passiveStacksOnTarget: clamp(0, self.internalData.value.passiveStacksOnTarget ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Kayn: {
		POSSIBLE_DYNAMIC_VALUES: {
			f1: [0, 1, 2],
		},
		FORM_OPTIONS: {
			base: 0,
			assassin: 1,
			rhaast: 2,
		},
		setupData(self): { form: number } {
			return {
				form: clamp(0, self.internalData.value.form ?? 0, this.FORM_OPTIONS.rhaast),
			};
		},
	},
	Kindred: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Kled: {
		setupData(self): { isDismounted: number } {
			return {
				isDismounted: clamp(0, self.internalData.value.isDismounted ?? 0, 1),
			};
		},
	},
	LeeSin: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, self.internalData.value.hasPassiveStack ?? 0, 1),
			};
		},
	},
	Mordekaiser: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Nidalee: {
		PASSIVE_OPTIONS: {
			none: 0,
			justBush: 1,
			towardsChampion: 2,
		},
		setupData(self): { passiveVariantActive: number } {
			return {
				passiveVariantActive: clamp(0, self.internalData.value.passiveVariantActive ?? 0, this.PASSIVE_OPTIONS.towardsChampion),
			};
		},
	},
	Nunu: {
		setupData(self): { isPassiveActive: number } {
			return {
				isPassiveActive: clamp(0, self.internalData.value.isPassiveActive ?? 0, 1),
			};
		},
	},
	Orianna: {
		MAX_PASSIVE_STACKS: 2,
		setupData(self): { passiveStacksOnTarget: number } {
			return {
				passiveStacksOnTarget: clamp(0, self.internalData.value.passiveStacksOnTarget ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Ornn: {
		MASTERWORK_LEVEL: 13,
		MAX_UPGRADED_ALLIES: 4,
		setupData(self): { masterworkItemSlot: number; passiveUpgradedAllies: number } {
			return {
				masterworkItemSlot: clamp(1, self.internalData.value.passiveUpgradedAllies ?? 0, 6),
				passiveUpgradedAllies: clamp(0, self.internalData.value.passiveUpgradedAllies ?? 0, this.MAX_UPGRADED_ALLIES),
			};
		},
	},
	Rell: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self): { passiveStacksOnTarget: number } {
			return {
				passiveStacksOnTarget: clamp(0, self.internalData.value.passiveStacksOnTarget ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Rengar: {
		MAX_PASSIVE_STACKS: 5,
		setupData(self): { passiveStacks: number; isPassiveMSActive: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Rumble: {
		setupData(self): { isOverheated: number } {
			return {
				isOverheated: clamp(0, self.internalData.value.isOverheated ?? 0, 1),
			};
		},
	},
	Samira: {
		PASSIVE_OPTIONS: {
			none: 0,
			e: 1,
			d: 2,
			c: 3,
			b: 4,
			a: 5,
			s: 6,
		},
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.PASSIVE_OPTIONS.s),
			};
		},
	},
	Sejuani: {
		setupData(self): { isPassiveActive: number } {
			return {
				isPassiveActive: clamp(0, self.internalData.value.isPassiveActive ?? 0, 1),
			};
		},
	},
	Senna: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Seraphine: {
		MAX_PASSIVE_STACKS: 20,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Shyvana: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Singed: {
		MAX_PASSIVE_STACKS: 9,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Smolder: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Sona: {
		MAX_PASSIVE_STACKS: 120,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Soraka: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Swain: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Sylas: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, self.internalData.value.hasPassiveStack ?? 0, 1),
			};
		},
	},
	Syndra: {
		MAX_PASSIVE_STACKS: 120,
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: clamp(0, self.internalData.value.passiveStacks ?? 0, this.MAX_PASSIVE_STACKS),
			};
		},
	},
	Taliyah: {
		setupData(self): { isPassiveMSActive: number } {
			return {
				isPassiveMSActive: clamp(0, self.internalData.value.isPassiveMSActive ?? 0, 1),
			};
		},
	},
	Taric: {
		setupData(self): { hasPassiveStack: number } {
			return {
				hasPassiveStack: clamp(0, self.internalData.value.hasPassiveStack ?? 0, 1),
			};
		},
	},
	Teemo: {
		setupData(self): { isPassiveASActive: number } {
			return {
				isPassiveASActive: clamp(0, self.internalData.value.isPassiveASActive ?? 0, 1),
			};
		},
	},
	Thresh: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
	Veigar: {
		setupData(self): { passiveStacks: number } {
			return {
				passiveStacks: Math.max(0, self.internalData.value.passiveStacks ?? 0),
			};
		},
	},
} satisfies IHypotheticalChampionSpecifics;

export type TChampionSpecifics = typeof CHAMPION_SPECIFICS;
export type IHypotheticalChampionSpecifics = Partial<Record<IChampionId, IChampionSpecific>>;

export type IChampionSpecific = IProviderGroupDataSetup & {
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

export type IChampionAbilityVariantSpecific = IProviderGroupImageText & {
	// TODO unused at the moment, possibly no need for it and just the one on ability level is fine
	// if used, `updateGameData` script should also merge it in `possibleChampionDynamicVariableValues`
	POSSIBLE_DYNAMIC_VALUES?: IPossibleDynamicValues;
};
