import type {ShallowRef} from 'vue';
import type { IChampionAbilityKey, IItemCategory } from '@lolcalc/shared';
import type { UnionKeys } from '@lolcalc/shared/types';
import type IChampionsData from '../files/champion.json';
import type TExampleChampion from '../files/champion/Ahri.json';
import type IItemsData from '../files/item.json';
import type IDragonsData from '../files/misc.json';

export type IDragonName = keyof typeof IDragonsData['data']['dragons'];

export type IItemStat = UnionKeys<(typeof IItemsData)['data'][keyof typeof IItemsData['data']]['stats']> | 'PercentOmnivampMod';

export interface IItem {
	id: string;
	name: string;
	/** joined search terms of the item */
	searchString: string;
	stats: Partial<Record<IItemStat, number>>;
	gold: {
		total: number;
		sell: number;
		sellBackModifier?: number;
	};
	image: string;
	into?: string[];
	from?: string[];
	epicness?: number;
	categories?: Partial<Record<IItemCategory, boolean>>;
	/** item "buy" groups, cant buy multiple from the same group */
	itemGroups?: string[];
	/** has 'Boots' in `tags` */
	isBoots?: boolean;
	/** has 'OnHit' in `tags` */
	isOnHit?: boolean;
	dataValues?: Record<string, number>;
	stringCalculations?: Record<string, Record<'MeleeResult' | 'RangedResult' | 'DefaultResult', string>>;
	itemCalculations?: Record<string, {
		mFormulaParts?: any[];
		mDisplayAsPercent?: boolean;
		[key: string]: any;
	}>;
	effectAmount?: number[];
}

export type IChampionId = keyof typeof IChampionsData['data'];

export type IChampionStat = keyof typeof TExampleChampion['stats'];

export interface IChampion<T extends IChampionId = IChampionId> {
	id: T;
	key: string;
	name: string;
	partype: string;
	stats: Record<IChampionStat, number>;
	abilities: Record<IChampionAbilityKey, IChampionAbility>;
	/** nested stringtable variables used in champion abilities' descriptions */
	stringtable: Record<string, string>;
}

export interface IListedChampion extends Pick<IChampion, 'id' | 'key' | 'name'> {
	image: string;
	roles: Partial<Record<IChampionRole, boolean>>;
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

export interface IDamageSource {
	id: string;
	color: string;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;

	level: Ref<number>;
	maxLevel = computed(() => this.roleQuest.value === 'top' ? 20 : 18);

	isRanged = computed(() => this.champion.value && (this.stats.value.base.attackRange > 325));
	stats = computed(() => calculateChampionStats(this));
	itemDamageCalculationTarget = computed<IItemVariableCalculationTarget>(() => ({
		isRanged: this.isRanged.value,
		stats: this.stats.value?.total,
	}));

	runes: Ref<IChampionRunes>;
	runePathsEmpty = computed(() => runePathsEmpty(this.runes.value));
	runesInvalid = computed(() => runesInvalid(this.runes.value, this.runePathsEmpty.value));

	currentHealth: Ref<number>;
	maxHealth = computed<number>(() => Math.round(this.stats.value?.total.hp || 1));
	currentAbilityResource: Ref<number>;
	abilityResourceName = computed(() => this.champion.value ? (this.champion.value?.partype || '<unknown>') : 'mana');
	maxAbilityResource = computed<number>(() => Math.round(this.stats.value?.total.mana ?? 0));

	items: Ref<(IItem | undefined)[]>;
	itemsUndoSnapshots: Ref<(IItem | undefined)[][]>;

	abilityLevels: Ref<Record<INonPassiveAbilityKey, number>>;
	maxAbilityLevels = computed(() => Object.fromEntries(Object.keys(this.abilityLevels.value).map(key => [
		key as INonPassiveAbilityKey,
		this.champion.value?.abilities[key as IChampionAbilityKey].maxLevel ?? 5,
	])) as Record<INonPassiveAbilityKey, number>);

	abilityVariantsIndexes: Ref<Record<IChampionAbilityKey, number>>;
	maxAbilityVariantsIndexes = computed(() => Object.fromEntries(Object.keys(this.abilityVariantsIndexes.value).map(key => [
		key as IChampionAbilityKey,
		/* Aphelios' `W` index is used for the offhand weapon tooltip which itself is based on his `E` ability */
		this.champion.value?.id === 'Aphelios' && key as IChampionAbilityKey === 'w'
			? (this.champion.value?.abilities.e.variants.length ?? 1) - 1
			: (this.champion.value?.abilities[key as IChampionAbilityKey].variants.length ?? 1) - 1,
	])) as Record<IChampionAbilityKey, number>);

	dragonStacks: Ref<(IDragonName | undefined)[]>;
	dragonSoul: Ref<IDragonName | undefined>;
	/**
	 * 0 - stacks valid
	 * 1 - more than 1 type repeated, i.e infernal, infernal, cloud, cloud
	 * 2 - 4 different stacks (only 3 are possible), i.e infernal, cloud, ocean, mountain
	 */
	dragonStacksInvalid = computed<0 | 1 | 2>(() => {
		const counts: [IDragonName, number][] = [];
		for (const dragon of this.dragonStacks.value) {
			if (dragon) {
				const count = counts.find(c => c[0] === dragon);
				if (count) {
					count[1] += 1;
				} else {
					counts.push([dragon, 1]);
				}
			}
		}
		return counts.length > 3
			? 2
			: counts.filter(c => c[1] >= 2).length > 1
				? 1
				: 0;
	});
	dragonSoulInvalid = computed(() => this.dragonSoul.value
		? this.dragonStacks.value.filter(Boolean).length < 4 || (this.dragonStacks.value.filter(stack => stack === this.dragonSoul.value).length < 2)
		: false);

	roleQuest: Ref<IChampionRole | undefined>;

	anythingFilled = computed(() => {
		return Boolean(this.listedChampion.value || this.level.value !== 1 || this.items.value.some(Boolean) || !this.runePathsEmpty.value || this.dragonStacks.value.some(Boolean) || this.dragonSoul.value || this.roleQuest.value || this.computed.effects.value.some(effect => effect.isActive));
	});

	/**
	 * any data the champion needs for their abilities, keys prefixed with `_` will not be stringified
	 *
	 * when stringifying, only the values are saved, something like
	 * `{ "masterworkItemSlot": 0, "passiveUpgradedAllies": 0 }`
	 * turns into `0|0` which when restoring is parsed into array `[0, 0]`
	 * then when creating, the `this.champion` watch checks if `this.fromStringifiedData` is `true` and if so, it will run the `setupData` function with no values, then extract the keys of the returned object, set the properties one by one taking them from the array and setting their values then run the setup function again to validate/clamp the values restored from original array
	 *   1. champion is selected, `this.internalData.value = championSpecific?.setupData(this)`
	 *   2. data is stringified, `Object.values(this.internalData.value).join('|')`
	 *   3. data is restored, `const rawValues = rawInternalData.split('|')`, then every value is converted into a number or set undefined if invalid
	 *   4. champion watch handles parsing back to object
	 */
	internalData: Ref<Id extends IInternalDataSetupChampions
		? IDamageSourceInternalDataBase & ReturnType<(typeof CHAMPION_SPECIFICS)[Id]['setupData']>
		: IDamageSourceInternalDataBase>;
	/* object containing the internal data of champion items, similar to `internalData` but untyped */
	internalItemData: Ref<any>;
	/* object containing the internal data of applied effects, like item passives or champion abilities */
	appliedEffects: Ref<IDamageSourceEffect[]>;

	watchHandles: WatchHandle[];

	/**
	 * set to the values of the `this.internalData.value` being restored when parsing back from stringified
	 * if not `undefined`, the champion watch will assume the `DamageSource` is being restored and handle it specially
	 */
	fromStringifiedInternalData: any[] | undefined;
}
