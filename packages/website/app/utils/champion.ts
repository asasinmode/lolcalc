import type { IPossibleDynamicValues } from './types';

export function cooldownReductionPercentageFromHaste(haste: number) {
	return haste / (haste + 100) * 100;
}

export const CHAMPION_STATS = ['hp', 'hpRegen', 'mana', 'manaRegen', 'healShieldPower', 'lethality', 'percentArmorPen', 'flatMagicPen', 'percentMagicPen', 'lifeSteal', 'omnivamp', 'attackRange', 'tenacity', 'attackDamage', 'abilityPower', 'armor', 'magicResist', 'attackSpeed', 'attackSpeedRatio', 'abilityHaste', 'critChance', 'critDamageMultiplier', 'moveSpeed', 'bonusAttackSpeedPercent'] as const;

export type IChampionStatName = (typeof CHAMPION_STATS)[number];

export const CHAMPION_STAT_NAMES: Record<IChampionStatName, string> = {
	hp: 'Health',
	mana: 'Mana',
	attackDamage: 'Attack Damage',
	abilityPower: 'Ability Power',
	armor: 'Armor',
	magicResist: 'Magic Resist',
	abilityHaste: 'Ability Haste',
	attackSpeed: 'Attack Speed',
	attackSpeedRatio: 'Attack Speed Ratio',
	bonusAttackSpeedPercent: 'Bonus Attack Speed',
	critChance: 'Critical Strike Chance',
	critDamageMultiplier: 'Critical Strike Damage',
	lethality: 'Lethality',
	percentArmorPen: 'Percentage Armor Penetration',
	flatMagicPen: 'Magic penetration',
	percentMagicPen: 'Percentage Magic Penetration',
	lifeSteal: 'Life Steal',
	omnivamp: 'Omnivamp',
	moveSpeed: 'Move Speed',
	tenacity: 'Tenacity',
	healShieldPower: 'Heal and Shield power',
	attackRange: 'Attack Range',
	hpRegen: 'Health every 5 seconds',
	manaRegen: 'Mana/Resource every 5 seconds',
};

const aph1to5 = [1, 2, 3, 4, 5];

export type IApheliosWeapon = 'calibrum' | 'severum' | 'gravitum' | 'infernum' | 'crescendum';

/**
 * object containing specific champion's helpers, utils and calculations
 * for `POSSIBLE_DYNAMIC_VALUES` see `./types.d.ts`
 */
export const CHAMPION_SPECIFICS = {
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
		} satisfies IPossibleDynamicValues,
		setupInternalData(self: DamageSource<'Aphelios'>): {
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
			all: {
				f1: [0, 1, 2],
			},
		} satisfies IPossibleDynamicValues,
	},
	Veigar: {
		setupInternalData(self: DamageSource<'Veigar'>): {
			phenomenalEvilStacks: number;
		} {
			return {
				phenomenalEvilStacks: Math.max(0, self.internalData.value.phenomenalEvilStacks ?? 0),
			};
		},
	},
};
