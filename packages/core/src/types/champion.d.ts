import type IChampionsData from '../../app/assets/champion.json';
import type ExampleChampion from '../../public/data/champion/Ahri.json';

export type IChampionId = keyof typeof IChampionsData['data'];

export type IChampionRole = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

export type IChampionStat = keyof typeof ExampleChampion['stats'];

export interface IChampion<T extends IChampionId = IChampionId> {
	id: T;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	abilities: Record<'passive' | 'q' | 'w' | 'e' | 'r', IChampionAbility>;
	/** nested stringtable variables used in champion abilities' descriptions */
	stringtable: Record<string, string>;
}

export interface IListedChampion<T extends IChampionId = any> extends Pick<IChampion<T>, 'id' | 'key' | 'name'> {
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
}

export interface IChampionAbilityVariant {
	name: string;
	image: string;
	mana?: number[];
	cooldownTime?: number[];
	// TODO not sure if still needed, Aphelios variants use it maybe?
	// /** if present, means the variant uses the tooltip of another variant at the specified index */
	// tooltipVariantIndex?: number;
	tooltip?: string;
	/** tooltip shown when holding shift */
	tooltipExtended?: string;
	// TODO unused at the moment? dont remember what it was for, maybe for when all abilities' (not just passive) are fully resolved
	tooltipExtendedBelowLine?: string;
	/** the variables shown below the description when holding shift. Cooldown excluded, it's added manually */
	extendedVariables?: {
		/** like `QBaseDamage` */
		name: string;
		/**
		 * the stringtable key to override the default variable name with
		 * like `QBaseDamage` -> `spell_listtype_damage` -> `Damage`
		 */
		nameOverride?: string;
	}[];
	dataValues?: any;
	spellCalculations?: any;
	effectAmount?: any;
	dataKey: string;
	objectName: string;
}

export interface IChampionAbility {
	maxLevel: number;
	cooldownTime?: number[];
	/**
	 * champion ability can have multiple variants. Most champions abilities have 1 variant, but shapeshifters like Elise/Nidalee/Jayce have a variant for each form and Aphelios has many Q/E variants
	 * except for Aphelios, only first 2 variants are actually meaningful (used/shown in game as that ability). Abilities can have more variants than just 2 though (for example Elise Q). These additional variants are used for resolving the variables shown in the main 2 variants' tooltips and aren't supposed to be otherwise shown to the user
	 * for additional information see `scripts/updateGameData.ts` -> `championAbilityVariants`
	 */
	variants: IChampionAbilityVariant[];
}

export type IChampionAbilityKey = keyof IChampion['abilities'];
