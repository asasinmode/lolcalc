import type { ITextData } from '@lolcalc/data';
import type { IChampion, IChampionAbilityVariant, IChampionId, IChampionRunes, IDragonName, IItem, IItemStat, IListedChampion, IRunePathName, IRuneShardSlotName, IRuneSlotName } from '@lolcalc/data/types';
import type { IAdaptiveForceStatRv, IChampionAbilityKey, IChampionStatName, INonPassiveAbilityKey, IStatsCalculationMiscDebug, IStatsCalculationResult, IStatsCalculationVariables, IVariableType } from '@lolcalc/shared';
import type { IChampionRole } from '@lolcalc/shared/types';
import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef, UnwrapRef, WatchHandle } from 'vue';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from './GameAbilityId';
import type { IGameImageData } from './misc.ts';
import type { IHypotheticalChampionSpecifics } from './specifics/champion';
import type { IHypotheticalDragonSpecifics } from './specifics/dragon';
import type { IEffectSpecific, IHypotheticalEffectSpecifics } from './specifics/effect';
import type { IGameAbilityData, IGameAbilitySpecific } from './specifics/index';
import type { IHypotheticalItemSpecifics, IItemSpecific, TItemSpecifics } from './specifics/item';
import type { IHypotheticalRuneSpecifics } from './specifics/rune';
import type { IDynamicVariables, IModifyVariableFunction, IReplaceGameVariablesOptions, IReplaceGameVariablesRV } from './variables/game.ts';

import type { IReplaceStringtableVariablesRV } from './variables/stringtable.ts';
import { CHAMPION_KEY_TO_ID, CHAMPIONS, ICON_COOLDOWN_IMG, ITEMS, MISC, RUNE_SLOT_NAME_TO_NUMBER, RUNES, STAT_ICON, TEXT, useChampion } from '@lolcalc/data';
import { ITEM_STAT_META, SHAPESHIFTING_CHAMPION_IDS } from '@lolcalc/data/meta.ts';
import { AbilityType, ALL_CHAMPION_ABILITY_KEYS, ALL_CHAMPION_STATS, CHAMPION_STAT_META, EFFECT_OBJECT_NAME, RANGED_ONLY_ITEMS, UPGRADED_SUPPORT_ITEMS } from '@lolcalc/shared';
import { roundVariable } from '@lolcalc/shared/utils.ts';
import { computed, markRaw, ref, shallowRef, toRaw, watch } from 'vue';
import { calculateChampionStats } from './calculate/championStats.ts';
import { GameAbilityId } from './GameAbilityId.ts';
import { gameAbilityImage } from './misc.ts';
import { CHAMPION_SPECIFICS } from './specifics/champion.ts';
import { DRAGON_SPECIFICS } from './specifics/dragon.ts';
import { EFFECT_SPECIFICS, EFFECT_SPECIFICS_OBJECT_ENTRIES, effectsAppliedBy } from './specifics/effect.ts';
import { calculateDynamicVariables } from './specifics/index.ts';
import { consumeItemComponents, ITEM_SPECIFICS, itemBuyability } from './specifics/item.ts';
import { RUNE_SPECIFICS, runesEmpty, runesInvalid } from './specifics/rune.ts';
import { itemVariableValue, replaceGameIcons, replaceGameVariables } from './variables/game.ts';
import { replaceStringtableVariables } from './variables/stringtable.ts';

export type IDamageSource<T extends IChampionId | undefined = undefined> = InstanceType<typeof DamageSource<T>>;

export interface IOverrides<Id extends IChampionId | undefined = undefined> {
	champion?: UnwrapRef<IDamageSource['listedChampion']>;
	level?: UnwrapRef<IDamageSource['level']>;
	items?: UnwrapRef<IDamageSource['items']>;
	runes?: Partial<UnwrapRef<IDamageSource['runes']>>;
	abilityLevels?: Partial<UnwrapRef<IDamageSource['abilityLevels']>>;
	abilityVariants?: Partial<UnwrapRef<IDamageSource['abilityVariantsIndexes']>>;
	currentHealth?: UnwrapRef<IDamageSource['currentHealth']>;
	currentAbilityResource?: UnwrapRef<IDamageSource['currentAbilityResource']>;
	dragonStacks?: UnwrapRef<IDamageSource['dragonStacks']>;
	dragonSoul?: UnwrapRef<IDamageSource['dragonSoul']>;
	roleQuest?: UnwrapRef<IDamageSource['roleQuest']>;
	internalData?: UnwrapRef<IDamageSource<Id>['internalData']>;
	internalItemData?: UnwrapRef<IDamageSource<Id>['internalItemData']>;
	internalDragonData?: UnwrapRef<IDamageSource<Id>['internalDragonData']>;
	appliedEffects?: UnwrapRef<IDamageSource<Id>['appliedEffects']>;
}

let damageSourcesCount = 0;
let hueIncrement = 0;

export class DamageSource<Id extends IChampionId | undefined = any> {
	id: string;
	color: string;
	isResultsCopy: boolean;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;

	level: Ref<number>;
	maxLevel = computed((): number => this.roleQuest.value === 'top' ? 20 : 18);

	stats = computed((): IStatsCalculationResult => calculateChampionStats(this));

	runes: Ref<IChampionRunes>;
	runePathsEmpty = computed((): boolean => runesEmpty(this.runes.value));
	runesInvalid = computed((): boolean => runesInvalid(this.runes.value, this.runePathsEmpty.value));

	/** can go up to `maxHealth` which is ceiled, so when used in calculations should be `Math.min(stats.value.total.hp, value)` */
	currentHealth: Ref<number>;
	/**
	 * intended to be used only for displaying the value in ui, for actual max health use `stats.value.total.hp`
	 * it's ceiled on purpose as that's what the game does, which also results in stuff like `2773.000001` showing up as `2774` (16.9.1 Ahri test)
	 */
	maxHealth = computed((): number => Math.ceil(this.stats.value.total.hp ?? 0));
	currentAbilityResource: Ref<number>;
	// TODO make available under dynamic variables `@AbilityResourceName@`
	abilityResourceName = computed((): string => this.champion.value ? (this.champion.value?.partype.toLowerCase() || '<unknown>') : 'mana');
	maxAbilityResource = computed((): number => Math.floor(this.stats.value?.total.mana ?? 0));
	hasMana = computed((): boolean => this.abilityResourceName.value === 'mana');

	items: Ref<(IItem | undefined)[]>;
	itemsUndoSnapshots: Ref<(IItem | undefined)[][]>;

	abilityLevels: Ref<Record<INonPassiveAbilityKey, number>>;
	maxAbilityLevels = computed((): Record<INonPassiveAbilityKey, number> => Object.fromEntries(Object.keys(this.abilityLevels.value).map(key => [
		key as INonPassiveAbilityKey,
		this.champion.value?.abilities[key as IChampionAbilityKey].maxLevel ?? 5,
	])) as Record<INonPassiveAbilityKey, number>);

	abilityVariantsIndexes: Ref<Record<IChampionAbilityKey, number>>;
	maxAbilityVariantsIndexes = computed((): Record<IChampionAbilityKey, number> => Object.fromEntries(Object.keys(this.abilityVariantsIndexes.value).map(key => [
		key as IChampionAbilityKey,
		/* Aphelios' `W` index is used for the offhand weapon tooltip which itself is based on his `E` ability */
		this.champion.value?.id === 'Aphelios' && key as IChampionAbilityKey === 'w'
			? (this.champion.value?.abilities.e.variants.length ?? 1) - 1
			: (this.champion.value?.abilities[key as IChampionAbilityKey].variants.length ?? 1) - 1,
	])) as Record<IChampionAbilityKey, number>);
	allAbilityVariants = computed(() => allChampionAbilitiesVariants(this.champion.value));

	dragonStacks: Ref<(IDragonName | undefined)[]>;
	dragonSoul: Ref<IDragonName | undefined>;
	/**
	 * 0 - stacks valid
	 * 1 - more than 1 type repeated, i.e infernal, infernal, cloud, cloud
	 * 2 - 4 different stacks (only 3 are possible), i.e infernal, cloud, ocean, mountain
	 */
	dragonStacksInvalid = computed((): 0 | 1 | 2 => {
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
	dragonSoulInvalid = computed((): boolean => this.dragonSoul.value
		? this.dragonStacks.value.filter(Boolean).length < 4 || (this.dragonStacks.value.filter(stack => stack === this.dragonSoul.value).length < 2)
		: false);

	roleQuest: Ref<IChampionRole | undefined>;

	anythingFilled = computed((): boolean => {
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
	/* object containing the internal data dragon soul/stacks, same as `internalItemData` */
	internalDragonData: Ref<any>;
	/* object containing the internal data of applied effects, like item passives or champion abilities */
	appliedEffects: Ref<IDamageSourceEffect<IEffectAbilityId>[]>;

	watchHandles: WatchHandle[];

	calculationDamageTarget: ShallowRef<DamageSource | undefined>;

	/**
	 * set to the values of the `this.internalData.value` being restored when parsing back from stringified
	 * if not `undefined`, the champion watch will assume the `DamageSource` is being restored and handle it specially
	 */
	fromStringifiedInternalData: any[] | undefined;
	/**
	 * one time use when restoring with `fromStringifiedData`, without it the maxHealth/abilityResource watcher will run and override the restored values after loading the champion
	 */
	hpAbilityResourceOverridesOnFirstChampLoad?: { hp?: number; abilityResource?: number };

	constructor(
		overrides: (Omit<IOverrides<Id>, 'champion'> & {
			champion?: { id: Id } & IListedChampion;
		}) = {},
		cloned = false,
		/**
		 * when DamageSource is one & done cloned for results (`CalculatorResultsTable`'s `recalculateColumn`). It's intended to have source's effects applied and calculationDamageTarget set
		 * note that `this.champion.value` will be empty without it and needs to be set manually after cloning/creating with this set to `true`
		 */
		isResultsCopy = false,
	) {
		const hue = ((isResultsCopy ? hueIncrement : hueIncrement++) * 137.508) % 360;
		this.isResultsCopy = isResultsCopy;
		this.color = `oklch(0.7 0.15 ${hue.toFixed(4)})`;

		damageSourcesCount += 1;
		this.id = damageSourcesCount.toString();
		this.listedChampion = shallowRef(overrides.champion);
		this.champion = shallowRef();
		this.level = ref(overrides.level ?? 1);
		this.items = ref(Array.from({ length: 7 }, (_, i) => overrides.items?.[i]));
		this.itemsUndoSnapshots = ref([]);
		this.runes = ref<IChampionRunes>({
			paths: {
				primary: 'Precision',
				primarySlots: [],
				secondary: undefined,
				secondarySlots: [],
				...overrides.runes?.paths,
			},
			shards: {
				offensive: undefined,
				flex: undefined,
				defensive: undefined,
				...overrides.runes?.shards,
			},
		});
		this.currentHealth = ref(overrides.currentHealth ?? 0);
		this.currentAbilityResource = ref(overrides.currentAbilityResource ?? 0);
		this.abilityLevels = ref({ q: 0, w: 0, e: 0, r: 0, ...overrides.abilityLevels });
		this.abilityVariantsIndexes = ref({ passive: 0, q: 0, w: 0, e: 0, r: 0, ...overrides.abilityVariants });
		this.dragonStacks = ref(overrides.dragonStacks ?? Array.from({ length: 4 }));
		this.dragonSoul = ref(overrides.dragonSoul);
		this.roleQuest = ref(overrides.roleQuest);
		/* expected to be overriden by freshly setup data in `this.champion` watch below */
		this.internalData = ref<any>(overrides.internalData ?? {});
		this.internalItemData = ref(overrides.internalItemData ?? {});
		this.internalDragonData = ref(overrides.internalDragonData ?? {});
		this.appliedEffects = ref([]);
		/** set in results on a duplicate of the underlying source to the configured target */
		this.calculationDamageTarget = shallowRef();
		this.fromStringifiedInternalData = undefined;

		for (let i = 0; i < (overrides.appliedEffects?.length ?? 0); i++) {
			const effect = overrides.appliedEffects![i]!;
			this.addEffect(effect.abilityId, effect.data);
		}

		/** used in maxHealth/abilityResource watcher to ensure overrides are used only once */
		let hpAbilityResourceWatchUsedOverrides = false;

		this.watchHandles = isResultsCopy
			? []
			: [
					watch(this.listedChampion, async (c) => {
						this.champion.value = undefined;

						const champion = c && await useChampion(c.id);
						if (this.listedChampion.value?.id === champion?.id) {
							this.champion.value = champion;
						}
					}, { immediate: true }),

					watch(this.champion, (c) => {
						for (const unwatch of this.internalData.value?._watchHandles || []) {
							unwatch();
						}

						if (this.fromStringifiedInternalData) {
							for (const abilityKey in this.abilityLevels.value) {
								this.abilityLevels.value[abilityKey as INonPassiveAbilityKey] = Math.max(0, Math.min(
									this.abilityLevels.value[abilityKey as INonPassiveAbilityKey],
									this.maxAbilityLevels.value[abilityKey as INonPassiveAbilityKey],
								));
							}

							for (const abilityKey in this.abilityVariantsIndexes.value) {
								this.abilityVariantsIndexes.value[abilityKey as IChampionAbilityKey] = Math.max(0, Math.min(
									this.abilityVariantsIndexes.value[abilityKey as IChampionAbilityKey],
									this.maxAbilityVariantsIndexes.value[abilityKey as IChampionAbilityKey],
								));
							}

							this.internalData.value = (c?.id && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[c.id]?.setupData?.(this as any)) ?? {};

							const internalDataKeys = Object.keys(this.internalData.value).filter(key => !key.startsWith('_'));
							if (internalDataKeys.length && this.fromStringifiedInternalData.length) {
								for (let i = 0; i < internalDataKeys.length; i++) {
									const key = internalDataKeys[i]!;
									if (this.fromStringifiedInternalData[i] !== undefined) {
										this.internalData.value[key as keyof typeof this.internalData['value']] = this.fromStringifiedInternalData[i];
									}
								}
								for (const unwatch of this.internalData.value?._watchHandles || []) {
									unwatch();
								}
								this.internalData.value = (c?.id && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[c.id]?.setupData?.(this as any)) || {};
								this.internalData.value._watchHandles && markRaw(this.internalData.value._watchHandles);
							}

							this.fromStringifiedInternalData = undefined;
							return;
						}

						if (cloned) {
							cloned = false;
						} else {
							const level = c?.id === 'TargetDummy' ? 1 : 0;
							this.abilityLevels.value = { q: level, w: level, e: level, r: level };
							this.abilityVariantsIndexes.value = { passive: 0, q: 0, w: 0, e: 0, r: 0 };
						}

						this.internalData.value = (this.champion.value?.id && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[this.champion.value?.id]?.setupData?.(this as any)) ?? {};
						this.internalData.value._watchHandles && markRaw(this.internalData.value._watchHandles);
					}, { flush: 'sync' }),

					watch(() => [this.maxHealth.value, this.maxAbilityResource.value, this.champion.value?.id] as [number, number, string | undefined], ([currentMaxHp, currentMaxAbilityResource, championId], previousValues) => {
						let markOverridesUsed = false;
						let useFirstChampionLoadOverride = false;

						if (championId !== previousValues?.[2]) {
							this.currentHealth.value = this.hpAbilityResourceOverridesOnFirstChampLoad?.hp ?? this.stats.value?.total.hp ?? 0;
							this.currentAbilityResource.value = this.hpAbilityResourceOverridesOnFirstChampLoad?.abilityResource ?? this.stats.value?.total.mana ?? 0;
							useFirstChampionLoadOverride = true;
						}

						if (this.listedChampion.value?.id === this.champion.value?.id) {
							if (!hpAbilityResourceWatchUsedOverrides && overrides.currentHealth !== undefined) {
								this.currentHealth.value = Math.max(0, Math.min(overrides.currentHealth, currentMaxHp ?? 0));
								markOverridesUsed = true;
							} else if (this.currentHealth.value === previousValues?.[0] && !useFirstChampionLoadOverride) {
								this.currentHealth.value = currentMaxHp ?? 0;
							} else {
								this.currentHealth.value = previousValues?.[0] === undefined ? (currentMaxHp ?? 0) : Math.min(this.currentHealth.value, currentMaxHp ?? 0);
							}

							if (!hpAbilityResourceWatchUsedOverrides && overrides.currentAbilityResource !== undefined) {
								this.currentAbilityResource.value = Math.max(0, Math.min(overrides.currentAbilityResource, currentMaxAbilityResource ?? 0));
								markOverridesUsed = true;
							} else if (this.currentAbilityResource.value === previousValues?.[1] && !useFirstChampionLoadOverride) {
								this.currentAbilityResource.value = currentMaxAbilityResource ?? 0;
							} else {
								this.currentAbilityResource.value = previousValues?.[1] === undefined ? (currentMaxAbilityResource ?? 0) : Math.min(this.currentAbilityResource.value, currentMaxAbilityResource ?? 0);
							}
						}

						hpAbilityResourceWatchUsedOverrides ||= markOverridesUsed;
						if (useFirstChampionLoadOverride) {
							this.hpAbilityResourceOverridesOnFirstChampLoad = undefined;
						}
					}, { immediate: true }),

					watch(this.roleQuest, (value) => {
						if (value !== 'top' && this.level.value > 18) {
							this.level.value = 18;
						}

						if (value === 'bot') {
							const bootsIndex = this.items.value.findIndex(item => item?.isBoots);
							const boots = this.items.value[bootsIndex];
							if (~bootsIndex) {
								this.items.value[bootsIndex] = undefined;
								this.items.value[6] = boots;
							}
						} else if (this.items.value[6]?.isBoots) {
							const firstEmptyIndex = this.items.value.indexOf(undefined);
							if (~firstEmptyIndex) {
								this.items.value[firstEmptyIndex] = this.items.value[6];
								this.items.value[6] = undefined;
							}
						}

						handleRoleQuestItems(this.items.value, this.roleQuest.value);
					}, { immediate: true }),

					watch(() => this.stats.value.isRanged, (value) => {
						if (!value) {
							for (let i = 0; i < this.items.value.length; i++) {
								const item = this.items.value[i];
								if (item && (RANGED_ONLY_ITEMS as string[]).includes(item.id)) {
									this.items.value[i] = undefined;
								}
							}
						}
					}),

					watch(() => this.items.value.map(i => i?.id), (newIds, oldIds) => {
						const removedItems = (oldIds?.filter(id => !newIds.includes(id)) ?? []) as (keyof TItemSpecifics | undefined)[];
						const addedItems = newIds.filter(id => !oldIds?.includes(id)) as (keyof TItemSpecifics | undefined)[];
						for (const addedId of addedItems) {
							(addedId && (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[addedId])?.setupData?.(this);
						}

						const usedProperties = newIds.flatMap(id => id ? (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[id as keyof IHypotheticalItemSpecifics]?.internalDataProperties ?? [] : []);
						for (const removedId of removedItems) {
							if (removedId && (ITEM_SPECIFICS[removedId] as any)?.internalDataProperties?.length) {
								for (const key of (ITEM_SPECIFICS[removedId] as any).internalDataProperties) {
									if (!usedProperties.includes(key)) {
										this.internalItemData.value[key] = undefined;
									}
								}
							}
						}
					}, { immediate: true, deep: true }),

					/* watcher for internalMiscData, atm only dragonSoul has any but watch source should be adjusted when new ones are added */
					watch(() => [this.dragonSoul.value, this.dragonStacks.value.map(stack => stack)], ([newSoul, newStacks], oldValue) => {
						const newSoulSpecific = (newSoul && (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[newSoul as IDragonName])?.soul;
						newSoulSpecific?.setupData?.(this);

						const addedStacks: IDragonName[] = [];
						const removedStacks: IDragonName[] = [];

						for (const newStack of newStacks as IDragonName[]) {
							if (!(oldValue?.[1] as IDragonName[] | undefined)?.includes(newStack)) {
								!addedStacks.includes(newStack) && addedStacks.push(newStack);
								const newStackSpecific = (newStack && (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[newStack as IDragonName])?.stack;
								newStackSpecific?.setupData?.(this);
							}
						}
						if (oldValue?.[1]) {
							for (const oldStack of (oldValue?.[1] as IDragonName[])) {
								if (!(newStacks as IDragonName[]).includes(oldStack)) {
									!removedStacks.includes(oldStack) && removedStacks.push(oldStack);
								}
							}
						}

						const usedProperties: string[] = [];

						if (newSoulSpecific?.internalDataProperties) {
							for (const property of newSoulSpecific.internalDataProperties) {
								usedProperties.push(property);
							}
						}
						for (const stack of newStacks as IDragonName[]) {
							const properties = (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[stack]?.stack?.internalDataProperties;
							if (properties) {
								for (const property of properties) {
									usedProperties.push(property);
								}
							}
						}

						if (oldValue?.[0] && oldValue?.[0] !== newSoul) {
							const oldProperties = (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[oldValue[0] as IDragonName]?.soul?.internalDataProperties;
							if (oldProperties) {
								for (const property of oldProperties) {
									if (!usedProperties.includes(property)) {
										this.internalDragonData.value[property] = undefined;
									}
								}
							}
						}
						for (const dragon of removedStacks) {
							const oldProperties = (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[dragon]?.stack?.internalDataProperties;
							if (oldProperties) {
								for (const property of oldProperties) {
									if (!usedProperties.includes(property)) {
										this.internalDragonData.value[property] = undefined;
									}
								}
							}
						}
					}, { immediate: true, deep: true }),
				];

		markRaw(this);
	}

	clone(overrides: IOverrides = {}, noWatch?: boolean): DamageSource<Id> {
		return new DamageSource<Id>({
			champion: this.listedChampion.value,
			level: this.level.value,
			items: [...toRaw(this.items.value)],
			runes: structuredClone(toRaw(this.runes.value)),
			currentHealth: this.currentHealth.value,
			currentAbilityResource: this.currentAbilityResource.value,
			abilityLevels: structuredClone(toRaw(this.abilityLevels.value)),
			abilityVariants: structuredClone(toRaw(this.abilityVariantsIndexes.value)),
			dragonStacks: structuredClone(toRaw(this.dragonStacks.value)),
			dragonSoul: this.dragonSoul.value,
			roleQuest: this.roleQuest.value,
			/* not cloned because the `IChampionSpecific.setupData` should handle safely using previous values to create new ones */
			internalData: this.internalData.value as any,
			/* has to be cloned because multiple items use the same object and only set its properties */
			internalItemData: structuredClone(toRaw(this.internalItemData.value)),
			/* same as `internalItemData` */
			internalDragonData: structuredClone(toRaw(this.internalDragonData.value)),
			/* not cloned, same as `internalData` */
			appliedEffects: this.appliedEffects.value,
			...overrides,
		}, true, noWatch);
	}

	clear(): void {
		this.listedChampion.value = undefined;
		this.champion.value = undefined;
		this.level.value = 1;
		for (let i = 0; i < this.items.value.length; i++) {
			this.items.value[i] = undefined;
		}
		this.itemsUndoSnapshots.value.length = 0;
		this.runes.value.paths.primary = 'Precision';
		this.runes.value.paths.primarySlots.length = 0;
		this.runes.value.paths.secondary = undefined;
		this.runes.value.paths.secondarySlots.length = 0;
		this.runes.value.shards.offensive = undefined;
		this.runes.value.shards.flex = undefined;
		this.runes.value.shards.defensive = undefined;
		this.currentHealth.value = this.stats.value?.total.hp ?? 0;
		this.currentAbilityResource.value = this.stats.value?.total.mana ?? 0;
		this.abilityLevels.value.q = 0;
		this.abilityLevels.value.w = 0;
		this.abilityLevels.value.e = 0;
		this.abilityLevels.value.r = 0;
		this.abilityVariantsIndexes.value.passive = 0;
		this.abilityVariantsIndexes.value.q = 0;
		this.abilityVariantsIndexes.value.w = 0;
		this.abilityVariantsIndexes.value.e = 0;
		this.abilityVariantsIndexes.value.r = 0;
		for (let i = 0; i < this.dragonStacks.value.length; i++) {
			this.dragonStacks.value[i] = undefined;
		}
		this.dragonSoul.value = undefined;
		this.roleQuest.value = undefined;
		this.appliedEffects.value.length = 0;
		this.computed.effects.value.length = 0;
	}

	getWatchable(): MaybeRefOrGetter[] {
		return [
			this.champion,
			this.level,
			() => this.items.value.map(item => item?.id).join('-'),
			() => this.runes.value.paths.primary,
			() => this.runes.value.paths.secondary,
			() => this.runes.value.paths.primarySlots.join('-').concat(this.runes.value.paths.secondarySlots.join('-')),
			() => Object.values(this.runes.value.shards).join('-'),
			this.currentHealth,
			this.currentAbilityResource,
			() => Object.values(this.abilityLevels.value).join('-'),
			() => Object.values(this.abilityVariantsIndexes.value).join('-'),
			this.roleQuest,
			() => this.dragonStacks.value.join('-'),
			this.dragonSoul,
			() => Object.values(this.internalData.value || {}).join('-'),
			() => Object.values(this.internalItemData.value || {}).join('-'),
			() => Object.values(this.internalDragonData.value || {}).join('-'),
			() => this.appliedEffects.value.map(effect => `${effect.abilityId.id}-${effect.data.join('-')}`).join('|'),
		];
	}

	stringifiedData = computed((): string => {
		const primarySlots = Array.from({ length: 4 }, (_, i) => {
			const slotOptions = RUNES.paths[this.runes.value.paths.primary].slots[i]!;
			const slotValue = this.runes.value.paths.primarySlots[i];
			return slotValue ? `${i}${objectKeyIndex(slotValue, slotOptions)}` : '';
		});
		const secondarySlots = this.runes.value.paths.secondary
			? Array.from({ length: 2 }, (_, i) => {
					if (this.runes.value.paths.secondarySlots[i]) {
						const slotIndex = RUNE_SLOT_NAME_TO_NUMBER[this.runes.value.paths.secondarySlots[i]];
						const slotOptions = RUNES.paths[this.runes.value.paths.secondary!].slots[slotIndex]!;
						return `${slotIndex}${objectKeyIndex(this.runes.value.paths.secondarySlots[i], slotOptions)}`;
					}

					return '';
				})
			: [];
		const shards = Object.entries(this.runes.value.shards).map(([key, shard]) => objectKeyIndex(shard as any, RUNES.shards[key as IRuneShardSlotName]));

		const internalData = this.internalData.value && Object.entries(this.internalData.value)
			.filter(([key]) => !key.startsWith('_'))
			.map(([, value]) => value)
			.join('.');

		const runePathKeys = Object.keys(RUNES.paths);
		const roleQuestKeys = Object.keys(TEXT.roleQuests);
		const dragonKeys = Object.keys(TEXT.dragons);

		const data = [
			this.listedChampion.value?.key,
			this.level.value,
			this.items.value.map(item => item?.id).filter(Boolean).join('-'),
			`${runePathKeys.indexOf(this.runes.value.paths.primary)}${primarySlots.join('')}`,
			`${this.runes.value.paths.secondary ? runePathKeys.indexOf(this.runes.value.paths.secondary) : ''}${secondarySlots.join('')}`,
			shards.join(''),
			roundVariable(this.currentHealth.value, 3),
			roundVariable(this.currentAbilityResource.value, 3),
			Object.values(this.abilityLevels.value).map(level => level ?? 0).join(''),
			Object.values(this.abilityVariantsIndexes.value).join(''),
			this.dragonStacks.value.filter(Boolean).map(stack => dragonKeys.indexOf(stack!)).join(''),
			this.dragonSoul.value && dragonKeys.indexOf(this.dragonSoul.value),
			internalData?.length ? internalData : undefined,
			Object.entries(this.internalItemData.value).filter(([key, value]) => !key.startsWith('_') && value).map(([key, value]) => `${key}~${value}`).join('-'),
			Object.entries(this.internalDragonData.value).filter(([key, value]) => !key.startsWith('_') && value).map(([key, value]) => `${key}~${value}`).join('-'),
			this.appliedEffects.value
				.filter((_, index) => this.computed.effects.value[index]?.isActive)
				.map(effect => `${EFFECT_SPECIFICS_OBJECT_ENTRIES.findIndex(([objectName]) => objectName === effect.abilityId.id)}-${effect.data.join('-')}`)
				.join('.'),
			this.roleQuest.value && roleQuestKeys.indexOf(this.roleQuest.value),
		];

		return data.join('_');
	});

	static fromStringifiedData(data: string): DamageSource {
		const rv = new DamageSource();

		const [
			championKey,
			rawLevel,
			rawItemIds,
			rawPrimaryRunes,
			rawSecondaryRunes,
			rawShards,
			rawCurrentHealth,
			rawCurrentAbilityResource,
			rawAbilityLevels,
			rawAbilityVariants,
			rawDragonStacks,
			rawDragonSoulIndex,
			rawInternalData,
			rawInternalItemData,
			rawInternalDragonData,
			rawEffectsData,
			rawRoleQuestIndex,
		] = data.split('_');

		if (rawRoleQuestIndex?.length) {
			const parsedIndex = Number.parseInt(rawRoleQuestIndex);
			const roleQuestKeys = Object.keys(TEXT.roleQuests) as IChampionRole[];

			if (!Number.isNaN(parsedIndex)) {
				rv.roleQuest.value = roleQuestKeys[parsedIndex];
			}
		}

		if (rawLevel) {
			const level = Number.parseInt(rawLevel);
			if (!Number.isNaN(level)) {
				rv.level.value = Math.max(1, Math.min(rv.maxLevel.value, level));
			}
		}

		if (rawInternalItemData?.length) {
			for (const keyValue of rawInternalItemData.split('-')) {
				const [key, rawValue] = keyValue.split('~');
				if (key && rawValue) {
					const value = Number.parseFloat(rawValue);
					if (!Number.isNaN(value)) {
						rv.internalItemData.value[key] = value;
					}
				}
			}
		}

		if (rawInternalDragonData?.length) {
			for (const keyValue of rawInternalDragonData.split('-')) {
				const [key, rawValue] = keyValue.split('~');
				if (key && rawValue) {
					const value = Number.parseFloat(rawValue);
					if (!Number.isNaN(value)) {
						rv.internalDragonData.value[key] = value;
					}
				}
			}
		}

		const itemIds = rawItemIds?.split('-').filter(Boolean);
		if (itemIds?.length) {
			for (let i = 0; i < rv.items.value.length; i++) {
				const item = ITEMS[itemIds[i]!];
				if (item && itemBuyability(item, rv, false) === 1) {
					rv.items.value[i] = item;
				}
			}
			handleRoleQuestItems(rv.items.value, rv.roleQuest.value);
		}

		const runePaths = Object.keys(RUNES.paths);
		if (rawPrimaryRunes?.length) {
			const primaryRunePathIndex = rawPrimaryRunes[0]!;
			const parsedIndex = Number.parseInt(primaryRunePathIndex);
			if (runePaths[parsedIndex]) {
				rv.runes.value.paths.primary = runePaths[parsedIndex] as IRunePathName;

				for (const slot of parseStringifiedRunePathSlots(rawPrimaryRunes.slice(1))) {
					if (slot) {
						const [slotIndex, optionIndex] = slot;
						if (slotIndex >= 0 && slotIndex <= 3) {
							const slotOptions = RUNES.paths[rv.runes.value.paths.primary].slots[slotIndex]!;
							const slotOptionKeys = Object.keys(slotOptions);
							rv.runes.value.paths.primarySlots[slotIndex] = slotOptionKeys[optionIndex] as IRuneSlotName | undefined;
						}
					}
				}
			}
		}

		if (rawSecondaryRunes?.length) {
			const rawSecondaryRunePathIndex = rawSecondaryRunes[0]!;
			const parsedIndex = Number.parseInt(rawSecondaryRunePathIndex);
			if (runePaths[parsedIndex]) {
				rv.runes.value.paths.secondary = runePaths[parsedIndex] as IRunePathName;

				const slots = parseStringifiedRunePathSlots(rawSecondaryRunes.slice(1));
				for (let i = 0; i < 2; i++) {
					if (slots[i]) {
						const [slotIndex, optionIndex] = slots[i]!;
						const slotOptions = RUNES.paths[rv.runes.value.paths.secondary].slots[slotIndex];
						if (slotOptions) {
							const slotOptionKeys = Object.keys(slotOptions);
							rv.runes.value.paths.secondarySlots[i] = slotOptionKeys[optionIndex] as IRuneSlotName | undefined;
						}
					}
				}
			}
		}

		if (rawShards?.length) {
			let i = 0;
			for (const [shardSlotKey, shardSlot] of Object.entries(RUNES.shards)) {
				const shardOptionIndex = rawShards[i];
				if (shardOptionIndex !== undefined) {
					const parsedIndex = Number.parseInt(shardOptionIndex);
					if (!Number.isNaN(parsedIndex)) {
						const shardSlotOptionKeys = Object.keys(shardSlot);
						if (shardSlotOptionKeys[parsedIndex]) {
							// @ts-expect-error both key and value should match
							rv.runes.value.shards[shardSlotKey] = shardSlotOptionKeys[parsedIndex] as any;
						}
					}
				}
				i++;
			}
		}

		let restoredHp: number | undefined;
		if (rawCurrentHealth) {
			const parsedValue = Number.parseFloat(rawCurrentHealth);
			if (!Number.isNaN(parsedValue)) {
				rv.currentHealth.value = Math.max(0, rv.champion.value ? Math.min(rv.maxHealth.value, parsedValue) : parsedValue);
				restoredHp = rv.currentHealth.value;
			}
		}

		let restoredAbilityResource: number | undefined;
		if (rawCurrentAbilityResource) {
			const parsedValue = Number.parseFloat(rawCurrentAbilityResource);
			if (!Number.isNaN(parsedValue)) {
				rv.currentAbilityResource.value = Math.max(0, rv.champion.value ? Math.min(rv.maxAbilityResource.value, parsedValue) : parsedValue);
				restoredAbilityResource = rv.currentHealth.value;
			}
		}

		if (rawAbilityLevels?.length) {
			const abilityKeys = Object.keys(rv.abilityLevels.value);
			for (let i = 0; i < abilityKeys.length; i++) {
				if (rawAbilityLevels[i]) {
					const parsedLevel = Number.parseInt(rawAbilityLevels[i]!);
					if (!Number.isNaN(parsedLevel)) {
						const abilityKey = abilityKeys[i] as INonPassiveAbilityKey;
						rv.abilityLevels.value[abilityKey]
							= Math.max(0, parsedLevel);
					}
				}
			}
		}

		if (rawAbilityVariants?.length) {
			const abilityKeys = Object.keys(rv.abilityVariantsIndexes.value);
			for (let i = 0; i < abilityKeys.length; i++) {
				if (rawAbilityVariants[i]) {
					const parsedVariant = Number.parseInt(rawAbilityVariants[i]!);
					if (!Number.isNaN(parsedVariant)) {
						const abilityKey = abilityKeys[i] as IChampionAbilityKey;
						rv.abilityVariantsIndexes.value[abilityKey]
							= Math.max(0, parsedVariant);
					}
				}
			}
		}

		const dragonKeys = Object.keys(TEXT.dragons) as IDragonName[];
		if (rawDragonStacks?.length) {
			for (let i = 0; i < rv.dragonStacks.value.length; i++) {
				const parsedIndex = rawDragonStacks[i] ? Number.parseInt(rawDragonStacks[i]!) : undefined;
				if (parsedIndex !== undefined && !Number.isNaN(parsedIndex) && ~parsedIndex) {
					rv.dragonStacks.value[i] = dragonKeys[parsedIndex];
				}
			}
		}

		if (rawDragonSoulIndex?.length) {
			const parsedIndex = Number.parseInt(rawDragonSoulIndex);

			if (!Number.isNaN(parsedIndex)) {
				rv.dragonSoul.value = dragonKeys[parsedIndex];
			}
		}

		const fromStringifiedInternalData: (number | undefined)[] = [];
		if (rawInternalData?.length) {
			for (const rawValue of rawInternalData.split('.')) {
				const value = Number.parseFloat(rawValue);
				fromStringifiedInternalData.push(Number.isNaN(value) ? undefined : value);
			}
		}

		if (rawEffectsData?.length) {
			for (const rawEffect of rawEffectsData.split('.')) {
				const [effectObjectNameIndex, ...rawData] = rawEffect.split('-');
				const effectSpecificEntry = effectObjectNameIndex && EFFECT_SPECIFICS_OBJECT_ENTRIES[Number.parseInt(effectObjectNameIndex)];
				if (effectSpecificEntry) {
					const data = rawData.map((rawValue) => {
						const value = rawValue ? Number.parseInt(rawValue) : undefined;
						if (value && !Number.isNaN(value)) {
							return value;
						}
						return undefined;
					}).filter(v => v !== undefined) as number[];
					rv.addEffect(GameAbilityId.build(AbilityType.effect, effectSpecificEntry[0]), data as any);
				}
			}
		}

		if (championKey && CHAMPION_KEY_TO_ID[championKey]) {
			rv.fromStringifiedInternalData = fromStringifiedInternalData;
			rv.listedChampion.value = CHAMPIONS[CHAMPION_KEY_TO_ID[championKey]];
			rv.hpAbilityResourceOverridesOnFirstChampLoad = { hp: restoredHp, abilityResource: restoredAbilityResource };
		}

		return rv;
	}

	/**
	 * supposed to be used when `new DamageSource({ champion: CHAMPIONS.TargetDummy })` is expected to have `this.champion.value` resolved to the one passed in the constructor
	 * @example
	 * ```ts
	 * const source1 = new DamageSource({ champion: CHAMPIONS.XinZhao });
	 * const source2 = await new DamageSource({ champion: CHAMPIONS.Zaahen }).await();
	 * console.log(source1.champion.value?.name, source2.champion.value?.name); // undefined, Zaahen
	 * ```
	 */
	await<T extends IChampionId | undefined = Id>(championId: T = this.listedChampion.value?.id): Promise<DamageSource<T>> {
		return new Promise<DamageSource<T>>((resolve) => {
			if (championId === this.champion.value?.id) {
				return this;
			}
			watch(this.champion, (champion) => {
				if (champion?.id !== championId) {
					console.warn('[damageSource] different champion than awaited arrived', { expected: championId, actual: champion?.id });
				}
				resolve(this as unknown as DamageSource<T>);
			}, { once: true });
		});
	}

	addItem(item: IItem, consumeComponents = true, slotIndex?: number): undefined {
		this.itemsUndoSnapshots.value.push([...this.items.value]);
		if (consumeComponents) {
			const consumedInventoryIndexes = consumeItemComponents(item.id, this.items.value);
			for (const index of consumedInventoryIndexes) {
				this.items.value[index] = undefined;
			}
		}

		if (this.roleQuest.value === 'bot' && item.isBoots) {
			this.items.value[6] = item;
		} else if (slotIndex !== undefined) {
			const itemAtSlot = this.items.value[slotIndex];
			this.items.value[slotIndex] = item;
			if (itemAtSlot) {
				for (let i = 0; i < 6; i++) {
					if (!this.items.value[i]) {
						this.items.value[i] = itemAtSlot;
						break;
					}
				}
			}
		} else {
			for (let i = 0; i < 6; i++) {
				if (!this.items.value[i]) {
					this.items.value[i] = item;
					break;
				}
			}
		}

		handleRoleQuestItems(this.items.value, this.roleQuest.value);
	}

	removeItem(index: number): IItem | undefined {
		const item = this.items.value[index];
		if (item) {
			this.itemsUndoSnapshots.value.push([...this.items.value]);
			this.items.value[index] = undefined;
			return item;
		}
	}

	moveItem(item: IItem, targetSlotIndex: number, source: DamageSource, fromSlotIndex: number): void {
		let itemAtSlot = this.items.value[targetSlotIndex];
		const isBotQuest = this.roleQuest.value === 'bot';

		if (isBotQuest && item.isBoots) {
			itemAtSlot = this.items.value[6];
			targetSlotIndex = 6;
			this.items.value[6] = item;
		} else if (isBotQuest && targetSlotIndex === 6) {
			this.addItem(item, false);
			return;
		} else {
			this.items.value[targetSlotIndex] = item;
		}

		if (item.isBoots) {
			const otherBootsIndex = this.items.value.findIndex((item, index) => item?.isBoots && index !== targetSlotIndex);
			if (~otherBootsIndex) {
				itemAtSlot = this.removeItem(otherBootsIndex)!;
			}
		}

		itemAtSlot && source.addItem(
			itemAtSlot,
			false,
			!itemAtSlot.isBoots && fromSlotIndex === 6 ? undefined : fromSlotIndex,
		);
		handleRoleQuestItems(this.items.value, this.roleQuest.value);
	}

	getEffect(abilityId: IGameAbilityId): [IDamageSourceEffect, index: number] | undefined {
		const index = this.appliedEffects.value.findIndex(effect => effect.abilityId.id === abilityId.id);

		return ~index ? [this.appliedEffects.value[index]!, index] : undefined;
	}

	addEffect<T extends IEffectAbilityId>(
		abilityId: T,
		data?: IDamageSourceEffect<T>['data'],
		/** when data is already expected to be "safe", not in need of `setupData`, like from `EFFECT_SPECIFICS.itemAppliedOnTargetEffectData` */
		trustData = false,
	): IDamageSourceEffect<T> {
		const specific = EFFECT_SPECIFICS[abilityId.id];
		const existingEffectIndex = this.appliedEffects.value.findIndex(effect => GameAbilityId.isSame(effect.abilityId, abilityId));

		if (~existingEffectIndex) {
			console.warn('[DamageSource addEffect] adding existing effect', abilityId);

			if (data && trustData) {
				this.appliedEffects.value[existingEffectIndex]!.data = data;
			} else {
				const newData = specific.setupData(data);
				if ('then' in newData) {
					newData.then(value => this.appliedEffects.value[existingEffectIndex]!.data = value);
				} else {
					this.appliedEffects.value[existingEffectIndex]!.data = newData;
				}
			}

			return this.appliedEffects.value[existingEffectIndex] as unknown as IDamageSourceEffect<T>;
		} else {
			const rv: IDamageSourceEffect<any> = {
				abilityId,
				data: [],
			};

			if (data && trustData) {
				rv.data = data;
			} else {
				const newData = specific.setupData(data);
				if ('then' in newData) {
					newData.then(value => rv.data = value);
				} else {
					rv.data = newData;
				}
			}

			this.appliedEffects.value.push(rv);
			this.computed.effects.value.push(computeAppliedEffect(this, this.appliedEffects.value.at(-1)!));
			return rv;
		}
	}

	removeEffect(abilityId: IEffectAbilityId): void {
		const index = this.appliedEffects.value.findIndex(effect => effect.abilityId.id === abilityId.id);
		if (~index) {
			this.appliedEffects.value.splice(index, 1);
			this.computed.effects.value.splice(index, 1);
		}
	}

	shapeshift(): void {
		if (this.champion.value?.id && !SHAPESHIFTING_CHAMPION_IDS.includes(this.champion.value.id)) {
			console.warn('shapeshift called on not a shapeshifter', this.champion.value.id);
			return;
		}

		for (const abilityKey in this.abilityVariantsIndexes.value) {
			if (this.computed.abilities.value[abilityKey as IChampionAbilityKey].length > 1) {
				this.abilityVariantsIndexes.value[abilityKey as IChampionAbilityKey] ^= 1;
			}
		}
	}

	computed: IDamageSourceComputed = {
		/** the stats shown in the "panel" on extended scoreboard item & results table */
		formattedStatTotals: computed((): UnwrapRef<IDamageSourceComputed['formattedStatTotals']> => {
			const rv = Object.fromEntries(
				ALL_CHAMPION_STATS.map(statName => [
					statName,
					formatChampionStatValue(statName, this.stats.value.total[statName as IChampionStatName]),
				]),
			) as UnwrapRef<IDamageSourceComputed['formattedStatTotals']>;
			return rv;
		}),
		items: computed((): (IComputedItemDescription | undefined)[] => {
			return this.items.value.map((item): IComputedItemDescription | undefined =>
				item && computeItemDescription(item, this),
			);
		}),
		itemSpecifics: computed((): UnwrapRef<IDamageSourceComputed['itemSpecifics']> => this.items.value.map((item) => {
			if (item) {
				const abilityId = GameAbilityId.build(AbilityType.item, item.id);
				const specific = resolveAbilitySpecific<any>(abilityId) as IItemSpecific;
				return {
					specific,
					abilityId,
				};
			}
			return undefined;
		})),
		masterworkItemSlotIndex: computed((): UnwrapRef<IDamageSourceComputed['masterworkItemSlotIndex']> => {
			let index = -1;

			if (this.champion.value?.id === 'Ornn') {
				if (this.level.value >= (this as DamageSource<'Ornn'>).internalData.value._masterworkLevel) {
					index = (this as DamageSource<'Ornn'>).internalData.value.masterworkItemSlot - 1;
				}
			} else {
				const effectAbilityId = GameAbilityId.build(AbilityType.effect, EFFECT_OBJECT_NAME.ornnPLivingForge);
				const effect = this.getEffect(effectAbilityId);

				if (effect) {
					index = (effect[0].data as IGameAbilityData<typeof effectAbilityId>)[0] - 1;
				}
			}

			return index;
		}),
		abilities: computed((): UnwrapRef<IDamageSourceComputed['abilities']> => {
			return Object.fromEntries(Object.keys(this.abilityVariantsIndexes.value).map((key): [IChampionAbilityKey, IComputedAbilityDescription[]] => {
				const ability = this.champion.value?.abilities[key as IChampionAbilityKey];
				return [key as IChampionAbilityKey, ability?.variants.map((_, variantIndex) => computeAbilityDescription(
					this.champion.value!,
					GameAbilityId.build(AbilityType.champion, this.champion.value!.id, key as IChampionAbilityKey, variantIndex),
					this,
				)) || []];
			})) as UnwrapRef<IDamageSourceComputed['abilities']>;
		}),
		dragonSoulAbility: computed(() => this.dragonSoul.value && computeDragonAbilityDescription(this.dragonSoul.value, 'soul', this, true)),
		effects: ref([]),
		variables: computed((): UnwrapRef<IDamageSourceComputed['variables']> => {
			const championSpecific = this.champion.value && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[this.champion.value.id];
			const championDynamicVariables = calculateDynamicVariables(this, this.calculationDamageTarget.value, championSpecific?.variables);

			return {
				items: Object.fromEntries(
					this.items.value.filter(Boolean).map(item => [
						item!.id,
						calculateDynamicVariables(this, this.calculationDamageTarget.value, (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[item!.id as keyof IHypotheticalItemSpecifics]?.variables) ?? {},
					]),
				),
				runes: {
					shards: Object.fromEntries(Object.entries(this.runes.value.shards).map(([shardSlot, shardValue]) => [
						shardSlot,
						shardValue && calculateDynamicVariables(this, this.calculationDamageTarget.value, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).shards[shardValue]?.variables),
					])) as UnwrapRef<IDamageSourceComputed['variables']>['runes']['shards'],
				},
				abilities: Object.fromEntries(ALL_CHAMPION_ABILITY_KEYS.map((abilityKey) => {
					return [
						abilityKey,
						/* test fixtures might not have all abilities filled so check against it */
						this.champion.value?.abilities[abilityKey]
							? this.champion.value!.abilities[abilityKey].variants.map((): IDynamicVariables => {
									const abilitySpecific = championSpecific?.[abilityKey];
									const abilityDynamicVariables = calculateDynamicVariables(this, this.calculationDamageTarget.value, abilitySpecific?.variables);

									return {
										values: Object.assign({ ...championDynamicVariables?.values }, abilityDynamicVariables?.values),
										meta: Object.assign({ ...championDynamicVariables?.meta }, abilityDynamicVariables?.meta),
									};
								})
							: [],
					];
				})) as UnwrapRef<IDamageSourceComputed>['variables']['abilities'],
			};
		}),
	};

	/** like computed but can depend on the computed */
	coComputed: {
		itemImage: ComputedRef<({ text?: string | number; isActive?: ReturnType<NonNullable<IItemSpecific['imgActive']>> } | undefined)[]>;
	} = {
		itemImage: computed((): ({ text?: string | number; isActive?: ReturnType<NonNullable<IItemSpecific['imgActive']>> } | undefined)[] => this.computed.itemSpecifics.value.map(computedSpecific => computedSpecific && ({
			text: computedSpecific.specific?.imgText?.(this),
			isActive: computedSpecific.specific?.imgActive?.(this.internalItemData.value),
		}))),
	};

	effectsAppliedToTarget = computed(() => effectsAppliedBy(this));

	/** the specifics' hooks grouped by type */
	calculateStatsHooks = {
		runes: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			for (const shard of Object.values(this.runes.value.shards)) {
				shard && groupCalculateStatsHooks(rv, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).shards[shard]);
			}
			for (const rune of this.runes.value.paths.primarySlots) {
				rune && groupCalculateStatsHooks(rv, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).slots[rune]);
			}
			for (const rune of this.runes.value.paths.secondarySlots) {
				rune && groupCalculateStatsHooks(rv, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).slots[rune]);
			}
			return rv;
		}),
		dragons: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			for (const stack of this.dragonStacks.value) {
				stack && groupCalculateStatsHooks(rv, (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[stack]?.stack);
			}
			this.dragonSoul.value && groupCalculateStatsHooks(rv, (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[this.dragonSoul.value]?.soul);
			return rv;
		}),
		items: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			for (const item of this.items.value) {
				item && groupCalculateStatsHooks(rv, (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[item.id as keyof IHypotheticalItemSpecifics]);
			}
			return rv;
		}),
		effects: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			if (this.appliedEffects) {
				for (const effect of this.appliedEffects.value) {
					const specific = (EFFECT_SPECIFICS as IHypotheticalEffectSpecifics)[effect.abilityId.id];
					/* deliberately not using the `computed.effects` because `modifyVariableFunctions` is used in game descriptions so I didn't want it to depend on that */
					specific?.isActive(effect.data) && groupCalculateStatsHooks(rv, specific);
				}
			}
			return rv;
		}),
		/* all of the specifics' hooks grouped by type */
		all: computed((): {
			[K in keyof ICalculateChampionStatsHookSource]?: NonNullable<ICalculateChampionStatsHookSource[K]>['handler'][]
		} => {
			const rv: ICalculateStatsGroupedHooks = {};
			for (const key in this.calculateStatsHooks.runes.value) {
				rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.runes.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			for (const key in this.calculateStatsHooks.dragons.value) {
				rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.dragons.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			for (const key in this.calculateStatsHooks.items.value) {
				rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.items.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			for (const key in this.calculateStatsHooks.effects.value) {
				rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.effects.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			if (this.champion.value?.id) {
				const championHooks = groupCalculateStatsHooks({}, (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[this.champion.value.id]);
				for (const key in championHooks) {
					rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
					rv[key as keyof ICalculateChampionStatsHookSource]!.push(...championHooks[key as keyof ICalculateChampionStatsHookSource]!);
				}
			}

			return Object.fromEntries(Object.entries(rv).map(([key, value]) => [
				key,
				value.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map(value => value.handler),
			]));
		}),
	};

	modifyVariableFunctions = computed((): IDamageSourceModifyVariableFunctions => {
		const rv: IDamageSourceModifyVariableFunctions = {};

		/*
		 * if this is not a results copy, the variables will be used in displayed descriptions for items/abilities and they shouldn't be modified by any effects
		 * `isResultsCopy` being true means that this damage source was cloned so that the effects/calculationDamageTarget can be set on it without modifying the original one. Then the variable values are displayed in the table and should be affected by effects
		 * this is probably a dirty way of doing so and ideally original damage sources could be used (no cloning) with external `calculateVariables(source, target)` stored in results but atm this stays, there's a TODO about it
		 */
		if (!this.isResultsCopy) {
			return rv;
		}

		for (const effect of this.appliedEffects.value) {
			const specific = (EFFECT_SPECIFICS as IHypotheticalEffectSpecifics)[effect.abilityId.id];
			/* deliberately not using the `computed.effects` because `modifyVariableFunctions` is used in game descriptions so I didn't want it to depend on that */
			if (specific?.modifyVariable && specific.isActive(effect.data)) {
				rv[specific.modifyVariable.type] ??= [];
				rv[specific.modifyVariable.type]!.push(value => specific.modifyVariable!.handler(value, effect.data));
			}
		}

		return rv;
	});
}

function handleRoleQuestItems(items: (IItem | undefined)[], roleQuest?: IChampionRole): void {
	const bootsIndex = items.findIndex(item => item?.isBoots);
	const boots = items[bootsIndex]!;

	if (boots?.epicness) {
		if (roleQuest === 'mid' && boots.into?.length) {
			items[bootsIndex] = ITEMS[boots.into[0]!];
		} else if (roleQuest !== 'mid' && boots.epicness === 7) {
			items[bootsIndex] = ITEMS[boots.from![0]!];
		}
	}

	if (roleQuest !== 'support') {
		const itemIndexes = items.map((item, index) => item && UPGRADED_SUPPORT_ITEMS.includes(item.id) ? index : undefined).filter(index => index !== undefined);

		for (const index of itemIndexes) {
			items[index] = undefined;
		}
	}
}

export function formatChampionStatValue(statName: IChampionStatName, value: number): number {
	const meta = CHAMPION_STAT_META[statName];
	const multiplier = meta.isPercentage ? 100 : 1;
	return meta.decimal
		? roundVariable(value * multiplier, meta.decimal)
		: Math.round(value * multiplier);
}

export function computeItemDescription(
	item?: IItem,
	damageSource?: DamageSource<any>,
	replaceOptions?: IReplaceGameVariablesOptions,
): IComputedItemDescription | undefined {
	const variables: IComputedItemDescription['variables'] = new Map();
	const unknownVariables: IComputedItemDescription['unknownVariables'] = [];

	if (!item) {
		return;
	}

	const {
		subtitleLeft,
		subtitleRight,
		tooltipShop,
		tooltipInventory,
		extended,
		footerLeft,
		keywordDefinitions,
	} = TEXT.items[item.id] || {};
	const stats: IComputedItemDescription['stats'] = Object.entries(item.stats)
		.filter(([statName]) => (statName as IItemStat) !== 'FlatHPRegenMod')
		.sort((a, b) => ITEM_STAT_META[b[0] as IItemStat].order - ITEM_STAT_META[a[0] as IItemStat].order)
		.map(([statName, value]): IComputedItemDescription['stats'][number] => {
			const { displayMultiplier, isPercentage } = ITEM_STAT_META[statName as IItemStat];
			const increasedBy = damageSource?.stats.value?.itemStatIncreases[item.id]?.[statName as IItemStat];
			const baseValue = displayMultiplier ? Math.round(value * displayMultiplier) : isPercentage ? Math.round(value * 100) : value;
			return {
				icon: STAT_ICON[statName as IItemStat],
				statName: statName as IItemStat,
				baseValue,
				totalValue: baseValue + (increasedBy ?? 0),
				increasedBy,
			};
		});
	for (const key in damageSource?.stats.value?.itemStatIncreases[item.id] ?? {}) {
		if (!stats.some(stat => stat.statName === key)) {
			const value = damageSource!.stats.value.itemStatIncreases[item.id]![key as IItemStat] as number;
			stats.push({
				icon: STAT_ICON[key as IItemStat],
				statName: key as IItemStat,
				baseValue: 0,
				totalValue: value,
				increasedBy: value,
			});
		}
	}

	/* dynamic variables not passed as they shouldn't be needed */
	const gp10 = itemVariableValue('GP10', { item, damageSource, isRanged: damageSource?.stats.value.isRanged });
	/* should probably handle the array output (value for melee/ranged) but not necessary for now */
	if (typeof gp10.value === 'number') {
		stats.push({
			icon: STAT_ICON.GP10,
			statName: 'GP10',
			baseValue: gp10.value,
			totalValue: gp10.value,
		});
	}

	const { text: tooltipShopReplaced, anyExtendedVariables: shopAnyExtendedVariables } = formatItemDescriptionText(tooltipShop, item, damageSource, variables, unknownVariables, replaceOptions);
	const { text: tooltipInventoryReplaced, anyExtendedVariables: inventoryAnyExtendedVariables } = formatItemDescriptionText(tooltipInventory, item, damageSource, variables, unknownVariables, replaceOptions);

	const { text: tooltipShopExtended } = formatItemDescriptionText(tooltipShop, item, damageSource, variables, unknownVariables, { ...replaceOptions, isExtended: true });
	const { text: tooltipInventoryExtended } = formatItemDescriptionText(tooltipInventory, item, damageSource, variables, unknownVariables, { ...replaceOptions, isExtended: true });

	const replacedExtended = additionalItemText(extended, item, damageSource, variables, unknownVariables, { ...replaceOptions, isExtended: true });
	const { replaced: replacedFooterLeft, anyExtendedVariables: footerLeftAnyExtendedVariables } = additionalItemText(footerLeft, item, damageSource, variables, unknownVariables, replaceOptions);
	const { replaced: replacedFooterLeftExtended } = additionalItemText(footerLeft, item, damageSource, variables, unknownVariables, { ...replaceOptions, isExtended: true });
	const { replaced: replacedKeywordDefinitions } = additionalItemText(keywordDefinitions, item, damageSource, variables, unknownVariables, replaceOptions);

	const hasAnyInterestingVariables = variables.values().some(variable => !variable.isUninteresting);

	return {
		item,
		variables,
		unknownVariables,
		extended: replacedExtended.replaced && replaceGameIcons(replacedExtended.replaced),
		footerLeft: replacedFooterLeft && replaceGameIcons(replacedFooterLeft),
		footerLeftExtended: replacedFooterLeftExtended && replaceGameIcons(replacedFooterLeftExtended),
		footerLeftAnyExtendedVInfo: footerLeftAnyExtendedVariables,
		keywordDefinitions: replacedKeywordDefinitions,
		subtitleLeft,
		subtitleRight,
		stats,
		tooltipShop: tooltipShopReplaced,
		tooltipInventory: tooltipInventoryReplaced,
		tooltipShopExtended,
		tooltipInventoryExtended,
		tooltipShopAnyExtendedVInfo: shopAnyExtendedVariables,
		tooltipInventoryAnyExtendedVInfo: tooltipInventoryReplaced ? inventoryAnyExtendedVariables : shopAnyExtendedVariables,
		hasAnyInterestingVariables,
	};
}

function additionalItemText(
	value: string | undefined,
	item: IItem,
	damageSource: DamageSource | undefined,
	variables: IComputedItemDescription['variables'],
	unknownVariables: IComputedItemDescription['unknownVariables'],
	replaceOptions?: IReplaceGameVariablesOptions,
): { replaced?: string; anyExtendedVariables?: boolean } {
	const { replaced, variables: newVariables, unknownVariables: newUnknownVariables, anyExtendedVariables } = value
		? replaceGameVariables(
			/* technically unknown here should be noted and an alert should be shown but for now all of them were resolved and if any unknown occur, `updateGameData` script should report them */
				replaceStringtableVariables(value, TEXT.stringtable).replaced,
				'item',
				{ item, dynamicVariables: damageSource?.computed.variables.value.items[item.id], isRanged: damageSource?.stats.value.isRanged, damageSource },
				damageSource?.modifyVariableFunctions.value,
				replaceOptions,
			)
		: {};

	for (const unknownVariable of newUnknownVariables || []) {
		if (!unknownVariables.some(v => v[0] === unknownVariable[0])) {
			unknownVariables.push(unknownVariable);
		}
	}
	newVariables && mergeMaps(variables, newVariables);

	return { replaced, anyExtendedVariables };
}

function mergeMaps<T, U>(map1: Map<T, U>, map2: Map<T, U>) {
	for (const [variableKey, variableValue] of map2.entries()) {
		map1.set(variableKey, variableValue);
	}
}

function allChampionAbilitiesVariants(champion?: IChampion): IChampionAbilityVariant[] {
	return champion ? Object.values(champion.abilities).flatMap(ability => ability.variants) : [];
}

export function computeAbilityDescription(
	champion: IChampion,
	gameAbilityId: IChampionAbilityId,
	damageSource?: DamageSource<any>,
	replaceOptions?: IReplaceGameVariablesOptions,
): IComputedAbilityDescription {
	const abilityLevel = gameAbilityId.abilityKey !== 'passive' ? damageSource?.abilityLevels.value[gameAbilityId.abilityKey] || 1 : undefined;
	const ability = champion.abilities[gameAbilityId.abilityKey];
	const variant = ability.variants[gameAbilityId.abilityVariantIndex]!;
	const allVariants = allChampionAbilitiesVariants(champion);

	const dynamicVariables = damageSource?.computed.variables.value.abilities[gameAbilityId.abilityKey][gameAbilityId.abilityVariantIndex];

	const { replaced: nameReplaced, unknownStringtableVariables: nameUnknownSV } = replaceStringtableVariables(
		variant.name,
		champion.stringtable,
		replaceOptions?.overrideVariables ?? dynamicVariables,
	);

	const variables: IComputedAbilityDescription['variables'] = new Map();
	const unknownVariables: IComputedAbilityDescription['unknownVariables'] = [];

	const {
		replaced: tooltipReplaced,
		unknownSV: tooltipUnknownSV,
		unknownV: tooltipUnknownV,
		variablesAllValues: tooltipVariablesAV,
		variables: tooltipVariables,
		anyExtendedVariables: tooltipAnyExtendedVariables,
	} = abilityVariantText(
		allVariants,
		variant.tooltip || '<unknown>UNKNOWN</unknown>',
		variant,
		dynamicVariables,
		abilityLevel,
		champion.stringtable,
		damageSource,
		replaceOptions,
	);
	const {
		replaced: tooltipExtendedReplaced,
		unknownSV: tooltipExtendedUnknownSV,
		unknownV: tooltipExtendedUnknownV,
		variablesAllValues: tooltipExtendedVariablesAV,
		variables: tooltipExtendedVariables,
		anyExtendedVariables: tooltipExtendedAnyExtendedVariables,
	} = abilityVariantText(
		allVariants,
		variant.tooltipExtended ?? (tooltipAnyExtendedVariables ? variant.tooltip : '') ?? '',
		variant,
		dynamicVariables,
		abilityLevel,
		champion.stringtable,
		damageSource,
		{ ...replaceOptions, isExtended: true },
	);
	const {
		replaced: tooltipExtendedBLReplaced,
		unknownSV: tooltipExtendedBLUnknownSV,
		unknownV: tooltipExtendedBLUnknownV,
		variables: tooltipExtendedBLVariables,
		anyExtendedVariables: tooltipExtendedBLAnyExtendedVariables,
	} = abilityVariantText(
		allVariants,
		variant.tooltipExtendedBelowLine || '',
		variant,
		dynamicVariables,
		abilityLevel,
		champion.stringtable,
		damageSource,
		{ ...replaceOptions, isExtended: true },
	);

	mergeMaps(variables, tooltipVariables);
	mergeMaps(variables, tooltipExtendedVariables);
	mergeMaps(variables, tooltipExtendedBLVariables);

	for (const unknownVariablesGroup of [tooltipUnknownV, tooltipExtendedUnknownV, tooltipExtendedBLUnknownV]) {
		for (const unknownVariable of unknownVariablesGroup) {
			if (!unknownVariables.some(unknownV => unknownV[0] === unknownVariable[0])) {
				unknownVariables.push(unknownVariable);
			}
		}
	}

	const cooldown = variant.cooldownTime?.[abilityLevel ?? 1];
	const cost = variant.mana?.[abilityLevel ?? 1];
	const lastExtendedVariableIndex = ability.maxLevel + 1;

	let extendedVariables: IComputedAbilityDescription['extendedVariables'] | undefined = variant.extendedVariables?.map((variable) => {
		let isNameUnknown = false;
		let name;
		if (variable.nameOverride) {
			name = champion.stringtable[variable.nameOverride];
			if (!name) {
				isNameUnknown = true;
			}
		}
		name ||= variable.name;

		return {
			name,
			values: (tooltipVariablesAV.get(variable.name) || tooltipExtendedVariablesAV.get(variable.name))?.slice(1, lastExtendedVariableIndex),
			isNameUnknown,
		};
	});

	if (champion.id !== 'TargetDummy' && cooldown && gameAbilityId.abilityKey !== 'passive') {
		extendedVariables ||= [];
		extendedVariables.push({
			name: 'Cooldown',
			values: variant.cooldownTime!.slice(1, lastExtendedVariableIndex),
		});
	}

	// TODO detect unknown cost/cooldown
	const anyUnknownVariables = nameUnknownSV.size || tooltipUnknownSV.size || tooltipUnknownV.length || tooltipExtendedUnknownSV.size || tooltipExtendedUnknownV.length || tooltipExtendedBLUnknownSV.size || tooltipExtendedBLUnknownV.length;

	return {
		gameAbilityId,
		name: nameReplaced,
		tooltip: tooltipReplaced,
		tooltipExtended: tooltipExtendedReplaced,
		tooltipExtendedBelowLine: tooltipExtendedBLReplaced,
		anyUnknownVariables,
		cooldown,
		cost,
		partype: champion.partype,
		extendedVariables,
		variables,
		unknownVariables,
		variant,
		anyExtendedVariableInfo: tooltipAnyExtendedVariables || tooltipExtendedAnyExtendedVariables || tooltipExtendedBLAnyExtendedVariables,
	};
}

function abilityVariantText(
	allAbilitiesVariants: IChampionAbilityVariant[],
	value: string,
	abilityVariant: IChampionAbilityVariant,
	dynamicVariables?: IDynamicVariables,
	abilityLevel?: number,
	/** champion's stringtable */
	stringtable?: Record<string, string>,
	damageSource?: DamageSource,
	replaceOptions?: IReplaceGameVariablesOptions,
): {
	replaced: string;
	unknownSV: IReplaceStringtableVariablesRV['unknownStringtableVariables'];
	unknownV: IReplaceGameVariablesRV['unknownVariables'];
	variablesAllValues: IReplaceGameVariablesRV['variablesAllValues'];
	variables: IReplaceGameVariablesRV['variables'];
	anyExtendedVariables: IReplaceGameVariablesRV['anyExtendedVariables'];
} {
	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceStringtableVariables(
		value,
		stringtable,
		replaceOptions?.overrideVariables ?? dynamicVariables,
	);

	const { replaced, unknownVariables, variablesAllValues, variables, anyExtendedVariables } = replaceGameVariables(
		stringtableReplaced,
		'championAbility',
		{ abilityVariant, dynamicVariables, abilityLevel, allAbilitiesVariants, damageSource },
		damageSource?.modifyVariableFunctions.value,
		replaceOptions,
	);

	return {
		replaced: replaceGameIcons(replaced),
		unknownSV: unknownStringtableVariables,
		unknownV: unknownVariables,
		variablesAllValues,
		variables,
		anyExtendedVariables,
	};
}

function objectKeyIndex(key: string | undefined, object: object): string | number {
	return key ? Object.keys(object).indexOf(key) : '';
}

function parseStringifiedRunePathSlots(data: string): ([slotIndex: number, slotOptionIndex: number] | undefined)[] {
	const rv: ([number, number] | undefined)[] = [];

	let rawSlotIndex, rawOptionIndex;
	do {
		rawSlotIndex = data[0];
		rawOptionIndex = data[1];
		data = data.slice(2);

		if (!rawSlotIndex || !rawOptionIndex) {
			break;
		}

		const parsedSlotIndex = Number.parseInt(rawSlotIndex);
		const parsedOptionIndex = Number.parseInt(rawOptionIndex);

		if (Number.isNaN(parsedSlotIndex) || Number.isNaN(parsedOptionIndex)) {
			continue;
		}

		rv.push([parsedSlotIndex, parsedOptionIndex]);
	} while (rawSlotIndex && rawOptionIndex);

	return rv;
}

function formatItemDescriptionText(
	value: ITextData['items'][keyof ITextData['items']]['tooltipShop'],
	item: IItem,
	damageSource: DamageSource | undefined,
	variables: IComputedItemDescription['variables'],
	unknownVariables: IComputedItemDescription['unknownVariables'],
	replaceOptions?: IReplaceGameVariablesOptions,
): {
	text: [string, ...string[]][] | undefined;
	anyExtendedVariables: boolean;
} {
	let anyExtendedVariables = false;
	return {
		text: value?.map(([heading, ...paragraphs]) => {
		/* technically unknown here and for paragraphs should be noted and an alert should be shown but for now all of them were resolved and if any unknown occur, `updateGameData` script should report them */
			const { replaced: headingStringtableReplaced } = replaceStringtableVariables(heading!
				.replace(/\{\{ ?Item_Cooldown ?\}\}/g, () => {
					const { value } = itemVariableValue('Cooldown', { item, damageSource, dynamicVariables: damageSource?.computed.variables.value.items[item.id], isRanged: damageSource?.stats.value.isRanged });
					return `${ICON_COOLDOWN_IMG}(${value || '<unknown>UNKNOWN</unknown>'}s<span> cooldown</span>)`;
				})
				.replace('(', '<span>(')
				.replace(')', ')</span>'), TEXT.stringtable);

			const { variables: headingVariables, replaced: replacedHeading, unknownVariables: headingUnknown, anyExtendedVariables: headingAnyExtendedVariables } = replaceGameVariables(
				headingStringtableReplaced,
				'item',
				{ item, dynamicVariables: damageSource?.computed.variables.value.items[item.id], isRanged: damageSource?.stats.value.isRanged, damageSource },
				damageSource?.modifyVariableFunctions.value,
				replaceOptions,
			);

			anyExtendedVariables ||= headingAnyExtendedVariables;

			for (const unknownVariable of headingUnknown || []) {
				if (!unknownVariables.some(v => v[0] === unknownVariable[0])) {
					unknownVariables.push(unknownVariable);
				}
			}
			mergeMaps(variables, headingVariables);

			return [
				replaceGameIcons(replacedHeading),
				...paragraphs.map((paragraph) => {
					const { replaced: paragraphStringtableReplaced } = replaceStringtableVariables(paragraph, TEXT.stringtable);
					const { variables: paragraphVariables, replaced: replacedParagraph, unknownVariables: paragraphUnknown, anyExtendedVariables: paragraphAnyExtendedVariables } = replaceGameVariables(
						paragraphStringtableReplaced,
						'item',
						{ item, damageSource, dynamicVariables: damageSource?.computed.variables.value.items[item.id], isRanged: damageSource?.stats.value.isRanged },
						damageSource?.modifyVariableFunctions.value,
						replaceOptions,
					);

					anyExtendedVariables ||= paragraphAnyExtendedVariables;

					for (const unknownVariable of paragraphUnknown || []) {
						if (!unknownVariables.some(v => v[0] === unknownVariable[0])) {
							unknownVariables.push(unknownVariable);
						}
					}
					mergeMaps(variables, paragraphVariables);

					return replaceGameIcons(replacedParagraph);
				},
				),
			];
		}),
		anyExtendedVariables,
	};
}

function computeAppliedEffect(self: DamageSource, effect: IDamageSourceEffect): IComputedAppliedEffect {
	const specific = EFFECT_SPECIFICS[effect.abilityId.id];
	const rv: IComputedAppliedEffect = {
		abilityId: effect.abilityId,
		imgData: ['', 0],
		imgText: computed((): string | number | undefined => specific.imgText?.(effect.data)),
		isActive: computed((): number | boolean => specific.isActive(effect.data)),
		specific,
		maxValue: undefined,
	};

	const maxValue = typeof specific.maxValue === 'function' ? specific.maxValue() : specific.maxValue;

	if (typeof maxValue === 'number') {
		rv.maxValue = maxValue;
	} else if (maxValue) {
		maxValue.then(value => rv.maxValue = value);
	}

	if (specific.variables) {
		rv.resultVariables = computed(() => specific.variables!.calculate(self));
	}

	gameAbilityImage(specific.sourceAbility).then(value => rv.imgData = value);

	return rv;
}

export function computeDragonAbilityDescription(
	dragon: IDragonName,
	type: 'stack' | 'soul',
	damageSource?: DamageSource,
	checkIfValid = false,
): IComputedDragonAbilityDescription {
	const ability = MISC.dragons[dragon][type];
	const string = TEXT.dragons[dragon][type];
	const isStack = type === 'stack';

	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceStringtableVariables(string);

	const { replaced, variables, unknownVariables, anyExtendedVariables } = replaceGameVariables(
		stringtableReplaced,
		'championAbility',
		{ abilityVariant: ability, allAbilitiesVariants: [MISC.dragons[dragon].stack, MISC.dragons[dragon].soul] },
	);

	let invalidMessage: string | undefined;

	if (checkIfValid) {
		if (isStack) {
			if (damageSource?.dragonStacksInvalid.value) {
				invalidMessage = damageSource.dragonStacksInvalid.value === 1 ? 'Only 1 dragon type can be repeated' : 'There can be only 3 different dragon types';
			}
		} else if (damageSource?.dragonSoulInvalid.value) {
			invalidMessage = 'Soul needs at least 4 total and 2 matching stacks';
		}
	}

	let extendedReplaced: string | undefined;

	if (anyExtendedVariables) {
		({ replaced: extendedReplaced } = replaceGameVariables(
			stringtableReplaced,
			'championAbility',
			{ abilityVariant: ability, allAbilitiesVariants: [MISC.dragons[dragon].stack, MISC.dragons[dragon].soul] },
			damageSource?.modifyVariableFunctions.value,
			{ isExtended: true },
		));
	}

	return {
		dragon,
		type,
		title: `${dragon} ${isStack ? 'Dragon' : 'Soul'}`,
		text: replaceGameIcons(replaced),
		textExtended: extendedReplaced ? replaceGameIcons(extendedReplaced) : undefined,
		invalidMessage,
		variables,
		unknownVariables,
		anyUnknownVariables: unknownStringtableVariables.size || unknownVariables.length,
		anyExtendedVariables,
	};
}

export function isMasterworkSlot(self: DamageSource, itemIndex: number): boolean {
	const item = self.computed.items.value[itemIndex];
	return self.computed.masterworkItemSlotIndex.value === itemIndex && (!item || item.item.epicness === 5);
}

function groupCalculateStatsHooks(target: ICalculateStatsGroupedHooks, hookSource?: { calculateHooks?: ICalculateChampionStatsHookSource }): ICalculateStatsGroupedHooks {
	if (hookSource?.calculateHooks) {
		for (const hook in hookSource.calculateHooks) {
			target[hook as keyof ICalculateChampionStatsHookSource] ??= [];
			target[hook as keyof ICalculateChampionStatsHookSource]!.push(hookSource.calculateHooks[hook as keyof ICalculateChampionStatsHookSource]!);
		}
	}
	return target;
}

export function resolveAbilitySpecific<T extends IGameAbilityId>(abilityId: T, warnPrefix?: string): IGameAbilitySpecific<T> | undefined {
	const specific = abilityId.type === AbilityType.item
		? ITEM_SPECIFICS[abilityId.id as keyof TItemSpecifics] as IGameAbilitySpecific<T>
		: abilityId.type === AbilityType.champion
			? (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[abilityId.id]?.[abilityId.abilityKey]?.[abilityId.abilityVariantIndex] as IGameAbilitySpecific<T>
			: abilityId.type === AbilityType.effect
				? EFFECT_SPECIFICS[abilityId.id] as IGameAbilitySpecific<T>
				: abilityId.type === AbilityType.dragon
					? (DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[abilityId.id]?.[abilityId.subtype] as IGameAbilitySpecific<T>
					: undefined;

	if (!specific && warnPrefix) {
		console.warn(`[${warnPrefix}] failed to resolve specific for`, abilityId);
	}

	return specific;
}

type IInternalDataSetupChampions = {
	[K in keyof typeof CHAMPION_SPECIFICS]: (typeof CHAMPION_SPECIFICS)[K] extends { setupData: (...args: any) => any }
		? K
		: never;
}[keyof typeof CHAMPION_SPECIFICS];

export interface IDamageSourceInternalDataBase {
	_watchHandles?: WatchHandle[];
}

export interface IDamageSourceInternalDataProvider<Id extends IChampionId | undefined = undefined> {
	/**
	 * returns the `internalData.value` for specific `DamageSource`'s champion
	 * should reuse the existing `DamageSource.internalData` to set the values (for cloning)
	 * and expects the previous `internalData` values to be of correct type (from parsing stringified state), as in `DamageSource.fromStringifiedData` should ensure the values are parsed (but not validated/clamped, that's done by the `setupData`)
	 */
	setupData?: (self: DamageSource<Id>) => any;
}

export interface IDamageSourceInternalItemDataProvider {
	/**
	 * same as `IDamageSourceInternalDataProvider.setupData` for `DamageSource.internalItemData`
	 * the return value is used only for types, function updates the `internalItemData` properties directly (multiple items need to be able to set it)
	 *
	 * `internalDataProperties` should contain all of the properties set up by this for cleanup by a watcher in `DamageSource` when item is removed
	 */
	setupData: (self: DamageSource) => any;
	/** the properties `setupData` uses, needed for cleanup */
	internalDataProperties: string[];
}

export type IProviderGroupInternalItemData = {
	setupData?: never;
	internalDataProperties?: never;
} | IDamageSourceInternalItemDataProvider;

export type IProviderGroupDataSetup<Id extends IChampionId | undefined = undefined> = { setupData?: never } | IDamageSourceInternalDataProvider<Id>;

export interface IDamageSourceInternalDragonDataProvider {
	/**
	 * same as `IDamageSourceInternalItemDataProvider.setupData` for `DamageSource.internalDragonData`
	 */
	setupData: (self: DamageSource) => any;
	/** the properties `setupData` uses, needed for cleanup */
	internalDataProperties: string[];
}

export type IProviderGroupInternalDragonData = {
	setupData?: never;
	internalDataProperties?: never;
} | IDamageSourceInternalDragonDataProvider;

export interface IAbilityImageTextProvider {
	/**
	 * text on the item's image, like current heartsteel/mejai stacks
	 */
	imgText: (damageSource: DamageSource, dataProperty?: any) => string | number;
	/** sr only label for the shown image text */
	imgTextLabel: string;
}

export type IProviderGroupImageText = {
	imgText?: never;
	imgTextLabel?: never;
} | IAbilityImageTextProvider;

export interface IDamageSourceEffect<T extends IEffectAbilityId = IEffectAbilityId> {
	abilityId: T;
	/** any effect data, stored in array like `[carve: number]` for easier stringifying/parsing */
	data: IGameAbilityData<T>;
}

export interface IComputedAbilityDescription {
	gameAbilityId: IChampionAbilityId;
	name: string;
	tooltip: string;
	/** will be empty if there are no extended variables in normal `tooltip` and the game data itself doesn't have it/is identical to normal `tooltip` */
	tooltipExtended: string;
	tooltipExtendedBelowLine: string;
	anyUnknownVariables: number;
	cooldown?: number;
	cost?: number;
	partype?: string;
	extendedVariables?: {
		name: string;
		values?: (string | number)[];
		isNameUnknown?: boolean;
	}[];
	variables: IReplaceGameVariablesRV['variables'];
	unknownVariables: IReplaceGameVariablesRV['unknownVariables'];
	variant: IChampionAbilityVariant;
	/** see original type's docs */
	anyExtendedVariableInfo: IReplaceGameVariablesRV['anyExtendedVariables'];
}

export interface IComputedItemDescription extends Pick<ITextData['items'][keyof ITextData['items']], 'subtitleLeft' | 'subtitleRight' | 'tooltipShop' | 'tooltipInventory' | 'extended' | 'footerLeft' | 'keywordDefinitions'> {
	item: IItem;
	stats: {
		icon: typeof STAT_ICON[keyof typeof STAT_ICON];
		statName: IItemStat;
		baseValue: string | number;
		/** base value modified by `increasedBy` */
		totalValue: string | number;
		/** set in items like tear or gluttonous greaves which passives' modify the displayed number */
		increasedBy?: number;
	}[];
	variables: ReturnType<typeof replaceGameVariables>['variables'];
	unknownVariables: ReturnType<typeof replaceGameVariables>['unknownVariables'];
	tooltipShopAnyExtendedVInfo: boolean;
	tooltipInventoryAnyExtendedVInfo: boolean;
	footerLeftAnyExtendedVInfo?: boolean;
	/** same as `tooltipShop` but with `replaceGameVariables`' `replaceOptions.isExtended: true` */
	tooltipShopExtended?: ITextData['items'][keyof ITextData['items']]['tooltipShop'];
	/** same as `tooltipInventory` but with `replaceGameVariables`' `replaceOptions.isExtended: true` */
	tooltipInventoryExtended?: ITextData['items'][keyof ITextData['items']]['tooltipInventory'];
	/** same as `footerLeft` but with `replaceGameVariables`' `replaceOptions.isExtended: true` */
	footerLeftExtended?: ITextData['items'][keyof ITextData['items']]['footerLeft'];
	/** if any variable found doesn't have `isUninteresting: true` (which itself is set based on item specifics) */
	hasAnyInterestingVariables: boolean;
}

export interface IComputedDragonAbilityDescription {
	dragon: IDragonName;
	type: 'stack' | 'soul';
	title: string;
	text: string;
	textExtended?: string;
	invalidMessage?: string;
	anyUnknownVariables?: number;
	variables: ReturnType<typeof replaceGameVariables>['variables'];
	unknownVariables: ReturnType<typeof replaceGameVariables>['unknownVariables'];
	/** see original type's docs */
	anyExtendedVariables: IReplaceGameVariablesRV['anyExtendedVariables'];
}

export interface IComputedAppliedEffect {
	abilityId: IEffectAbilityId;
	imgData: IGameImageData;
	imgText: ComputedRef<ReturnType<NonNullable<IEffectSpecific['imgText']>> | undefined>;
	isActive: ComputedRef<ReturnType<IEffectSpecific['isActive']>>;
	specific: IEffectSpecific;
	/** the `maxValue` computed from the effect specific */
	maxValue?: number;
	/** output of `IEffectSpecific.variables?.calculate()` */
	resultVariables?: ComputedRef<ReturnType<NonNullable<IEffectSpecific['variables']>['calculate']>>;
}

interface IDamageSourceComputed {
	formattedStatTotals: ComputedRef<Record<IChampionStatName, number>>;
	items: ComputedRef<(IComputedItemDescription | undefined)[]>;
	itemSpecifics: ComputedRef<({
		specific: IItemSpecific;
		abilityId: IItemAbilityId;
	} | undefined)[]>;
	masterworkItemSlotIndex: ComputedRef<number>;
	abilities: ComputedRef<Record<IChampionAbilityKey, IComputedAbilityDescription[]>>;
	dragonSoulAbility: ComputedRef<IComputedDragonAbilityDescription | undefined>;
	effects: ShallowRef<IComputedAppliedEffect[]>;
	variables: ComputedRef<{
		items: Record<string, IDynamicVariables | undefined>;
		runes: {
			shards: Record<IRuneShardSlotName, IDynamicVariables | undefined>;
		};
		abilities: Record<IChampionAbilityKey, (IDynamicVariables | undefined)[]>;
	}>;
}

/**
 * any hooks that will be called at various points in calculations, if provided
 */
export interface ICalculateChampionStatsHookSource<Id extends IChampionId | undefined = undefined> {
	/** runs after resolving the champion in `calculateChampionStats` */
	postInit?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		baseStats: IStatsCalculationResult['base'];
		bonusStats: IStatsCalculationResult['bonus'];
		championPassiveStats: IStatsCalculationResult['championPassive'];
	}) => void>;
	/** runs after base stats are calculated, before any item stats calculations */
	onDragon?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		dragonStats: IStatsCalculationResult['dragon'];
		totalStatMultipliers: IStatsCalculationResult['totalStatMultipliers'];
	}) => void>;
	preItemTotal?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		itemBaseStats: IStatsCalculationResult['itemBase'];
		itemPassivesStats: IStatsCalculationResult['itemPassive'];
		baseStats: IStatsCalculationResult['base'];
		baseOnLevelStats: IStatsCalculationResult['baseOnLevel'];
		itemStatIncreases: IStatsCalculationResult['itemStatIncreases'];
		effectStats: IStatsCalculationResult['effect'];
	}) => void>;
	/** runs after creating empty `runeShardStats`, before adding them up to `levelAndRunesStats` */
	onRuneShards?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		baseStats: IStatsCalculationResult['base'];
		runeShardStats: IStatsCalculationResult['runeShards'];
		adaptiveForceMeta: IAdaptiveForceStatRv;
	}) => void>;
	/** runs after creating empty `championPassiveStats` */
	onChampionPassive?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		baseStats: IStatsCalculationResult['base'];
		championPassiveStats: IStatsCalculationResult['championPassive'];
	}) => void>;
	/** runs before totalling all stats to total bonus */
	preBonus?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		runeShardStats: IStatsCalculationResult['runeShards'];
		baseStats: IStatsCalculationResult['base'];
		itemBaseStats: IStatsCalculationResult['itemBase'];
		itemPassivesStats: IStatsCalculationResult['itemPassive'];
		itemTotalStats: IStatsCalculationResult['itemTotal'];
		baseOnLevelStats: IStatsCalculationResult['baseOnLevel'];
	}) => void>;
	/** runs when total stats have been calculated but before any total multipliers like mid quest or dragons */
	onTotalPreMultipliers?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		totalPreMultipliersStats: IStatsCalculationResult['totalPreMultipliers'];
		totalMultipliersStats: IStatsCalculationResult['totalMultipliers'];
		bonusStats: IStatsCalculationResult['bonus'];
		effectStats: IStatsCalculationResult['effect'];
		itemPassivesStats: IStatsCalculationResult['itemPassive'];
		itemTotalStats: IStatsCalculationResult['itemTotal'];
		adaptiveForceMeta: IAdaptiveForceStatRv;
	}) => void>;
	postTotal?: ICalculateChampionStatsHook<(self: DamageSource<Id>, args: {
		isRanged: IStatsCalculationResult['isRanged'];
		totalStats: IStatsCalculationResult['total'];
		totalMultipliersStats: IStatsCalculationResult['totalMultipliers'];
		totalStatMultipliers: IStatsCalculationResult['totalStatMultipliers'];
		bonusStats: IStatsCalculationResult['bonus'];
		itemPassivesStats: IStatsCalculationResult['itemPassive'];
		itemTotalStats: IStatsCalculationResult['itemTotal'];
		championPassiveStats: IStatsCalculationResult['championPassive'];
		roleQuest: IChampionRole | undefined;
	}) => void>;
};

type ICalculateStatsGroupedHooks = {
	[K in keyof ICalculateChampionStatsHookSource]?: NonNullable<ICalculateChampionStatsHookSource[K]>[]
};

interface ICalculateChampionStatsHook<T extends (self: DamageSource, args: any) => void> {
	handler: (self: Parameters<T>[0], args: Parameters<T>[1], meta: {
		/** see the type definition for info */
		calculatedVariables: IStatsCalculationVariables;
		/** see the type definition for info */
		miscDebug: IStatsCalculationMiscDebug;
	}) => void;
	/** the higher the, the **later** it will run */
	priority?: number;
}

export type IDamageSourceModifyVariableFunctions = Partial<Record<IVariableType, IModifyVariableFunction[]>>;
