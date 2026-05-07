import type { ITextData } from '@lolcalc/data';
import type { IChampion, IChampionAbilityVariant, IChampionId, IChampionRunes, IDragonName, IItem, IItemStat, IListedChampion, IRunePathName, IRuneShardSlotName, IRuneSlotName } from '@lolcalc/data/types';
import type { IAdaptiveForceStatRv, IChampionAbilityKey, IChampionStatName, IChampionStats, INonPassiveAbilityKey, IStatsCalculationResult } from '@lolcalc/shared';
import type { IChampionRole } from '@lolcalc/shared/types';
import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef, UnwrapRef, WatchHandle } from 'vue';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from './GameAbilityId';
import type { IHypotheticalChampionSpecifics } from './specifics/champion';
import type { IEffectSpecific, IHypotheticalEffectSpecifics } from './specifics/effect';
import type { IGameAbilityData } from './specifics/index';
import type { IHypotheticalItemSpecifics, IItemSpecific, TItemSpecifics } from './specifics/item';
import type { IHypotheticalRuneSpecifics } from './specifics/rune.ts';
import type { IReplaceGameVariablesRV } from './types';
import { CHAMPION_ID_TO_KEY, CHAMPION_KEY_TO_ID, CHAMPIONS, ICON_COOLDOWN_IMG, ITEMS, RUNE_SLOT_NAME_TO_NUMBER, RUNES, TEXT, useChampion } from '@lolcalc/data';
import { ITEM_STAT_META, SHAPESHIFTING_CHAMPION_IDS, STAT_ICON } from '@lolcalc/data/meta.ts';
import { ABILITY_TYPE, ALL_CHAMPION_STATS, CHAMPION_STAT_META, EFFECT_OBJECT_NAME, RANGED_ONLY_ITEM_IDS } from '@lolcalc/shared';
import { roundVariable } from '@lolcalc/shared/utils.ts';
import { computed, markRaw, ref, shallowRef, toRaw, watch } from 'vue';
import { calculateChampionStats } from './calculate/championStats.ts';
import { GameAbilityId } from './GameAbilityId.ts';
import { gameAbilityImage } from './misc.ts';
import { CHAMPION_SPECIFICS } from './specifics/champion.ts';
import { EFFECT_SPECIFICS, EFFECT_SPECIFICS_OBJECT_ENTRIES } from './specifics/effect.ts';
import { resolveAbilitySpecific } from './specifics/index.ts';
import { consumeItemComponents, ITEM_SPECIFICS, itemBuyability } from './specifics/item.ts';
import { RUNE_SPECIFICS, runePathsEmpty, runesInvalid } from './specifics/rune.ts';
import { itemVariableValue, replaceGameIcons, replaceGameVariables } from './variables/game.ts';
import { replaceStringtableVariables } from './variables/stringtable.ts';

export type IDamageSource<T extends IChampionId | undefined = undefined> = InstanceType<typeof DamageSource<T>>;

interface IOverrides<Id extends IChampionId | undefined = undefined> {
	champion: UnwrapRef<IDamageSource['listedChampion']>;
	level: UnwrapRef<IDamageSource['level']>;
	items: UnwrapRef<IDamageSource['items']>;
	runes: UnwrapRef<IDamageSource['runes']>;
	abilityLevels: Partial<UnwrapRef<IDamageSource['abilityLevels']>>;
	abilityVariants: Partial<UnwrapRef<IDamageSource['abilityVariantsIndexes']>>;
	currentHealth: UnwrapRef<IDamageSource['currentHealth']>;
	currentAbilityResource: UnwrapRef<IDamageSource['currentAbilityResource']>;
	dragonStacks: UnwrapRef<IDamageSource['dragonStacks']>;
	dragonSoul: UnwrapRef<IDamageSource['dragonSoul']>;
	roleQuest: UnwrapRef<IDamageSource['roleQuest']>;
	internalData: UnwrapRef<IDamageSource<Id>['internalData']>;
	internalItemData: UnwrapRef<IDamageSource<Id>['internalItemData']>;
	appliedEffects: UnwrapRef<IDamageSource<Id>['appliedEffects']>;
}

let damageSourcesCount = 0;

export class DamageSource<Id extends IChampionId | undefined = any> implements IDamageSource<Id> {
	id: string;
	color: string;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;

	level: Ref<number>;
	maxLevel = computed((): number => this.roleQuest.value === 'top' ? 20 : 18);

	isRanged = computed((): boolean => Boolean(this.champion.value && (this.stats.value.base.attackRange > 325)));
	stats = computed((): IStatsCalculationResult => calculateChampionStats(this));

	runes: Ref<IChampionRunes>;
	runePathsEmpty = computed((): boolean => runePathsEmpty(this.runes.value));
	runesInvalid = computed((): boolean => runesInvalid(this.runes.value, this.runePathsEmpty.value));

	currentHealth: Ref<number>;
	maxHealth = computed((): number => Math.round(this.stats.value?.total.hp || 1));
	currentAbilityResource: Ref<number>;
	// TODO make available under dynamic variables `@AbilityResourceName@`
	abilityResourceName = computed((): string => this.champion.value ? (this.champion.value?.partype || '<unknown>') : 'mana');
	maxAbilityResource = computed((): number => Math.round(this.stats.value?.total.mana ?? 0));

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
	/* object containing the internal data of applied effects, like item passives or champion abilities */
	appliedEffects: Ref<IDamageSourceEffect[]>;

	watchHandles: WatchHandle[];

	/**
	 * set to the values of the `this.internalData.value` being restored when parsing back from stringified
	 * if not `undefined`, the champion watch will assume the `DamageSource` is being restored and handle it specially
	 */
	fromStringifiedInternalData: any[] | undefined;

	constructor(overrides: (Partial<Omit<IOverrides<Id>, 'champion'>> & {
		champion?: { id: Id } & IListedChampion;
	}) = {}) {
		/* + 1 because it's a nicer color */
		const hue = (damageSourcesCount++ * 137.508) % 360;
		this.color = `oklch(0.7 0.15 ${hue.toFixed(4)})`;

		this.id = damageSourcesCount.toString();
		this.listedChampion = shallowRef(overrides.champion);
		this.champion = shallowRef();
		this.level = ref(overrides.level ?? 1);
		this.items = ref(Array.from({ length: 7 }, (_, i) => overrides.items?.[i]));
		this.itemsUndoSnapshots = ref([]);
		this.runes = ref<IChampionRunes>(overrides.runes ?? {
			paths: {
				primary: 'Precision',
				primarySlots: [],
				secondary: undefined,
				secondarySlots: [],
			},
			shards: {
				offensive: 'adaptive',
				flex: 'adaptive',
				defensive: 'health',
			},
		});
		this.currentHealth = ref(overrides.currentHealth ?? (this.stats.value?.total.hp ?? 0));
		this.currentAbilityResource = ref(overrides.currentAbilityResource ?? (this.stats.value?.total.mana ?? 0));
		this.abilityLevels = ref({ q: 0, w: 0, e: 0, r: 0, ...overrides.abilityLevels });
		this.abilityVariantsIndexes = ref({ passive: 0, q: 0, w: 0, e: 0, r: 0, ...overrides.abilityVariants });
		this.dragonStacks = ref(overrides.dragonStacks ?? Array.from({ length: 4 }));
		this.dragonSoul = ref(overrides.dragonSoul);
		this.roleQuest = ref(overrides.roleQuest);
		/* expected to be overriden by freshly setup data in `this.champion` watch below */
		this.internalData = ref<any>(overrides.internalData ?? {});
		this.internalItemData = ref(overrides.internalItemData ?? {});
		this.appliedEffects = ref([]);
		this.fromStringifiedInternalData = undefined;

		for (let i = 0; i < (overrides.appliedEffects?.length ?? 0); i++) {
			const effect = overrides.appliedEffects![i]!;
			this.addEffect(effect.abilityId, effect.data);
		}

		this.watchHandles = [
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

					this.internalData.value = (c?.id && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[c.id]?.setupData?.(this)) || {};

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
						this.internalData.value = (c?.id && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[c.id]?.setupData?.(this)) || {};
						this.internalData.value._watchHandles && markRaw(this.internalData.value._watchHandles);
					}

					this.fromStringifiedInternalData = undefined;
					return;
				}

				this.currentHealth.value = this.stats.value?.total.hp ?? 0;
				this.currentAbilityResource.value = this.stats.value?.total.mana ?? 0;

				const level = c?.id === 'TargetDummy' ? 1 : 0;
				this.abilityLevels.value = { q: level, w: level, e: level, r: level };
				this.abilityVariantsIndexes.value = { passive: 0, q: 0, w: 0, e: 0, r: 0 };

				this.internalData.value = (this.champion.value?.id && (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[this.champion.value?.id]?.setupData?.(this)) ?? {};
				this.internalData.value._watchHandles && markRaw(this.internalData.value._watchHandles);
			}),

			watch(() => [this.stats.value?.total.hp, this.stats.value?.total.mana], (_, [previousTotalHp, previousTotalAbilityResource]) => {
				if (!this.champion.value) {
					return;
				}
				if (previousTotalHp && this.currentHealth.value === previousTotalHp) {
					this.currentHealth.value = this.stats.value?.total.hp ?? 0;
				} else {
					this.currentHealth.value = Math.min(this.currentHealth.value, this.stats.value?.total.hp ?? 0);
				}
				if (previousTotalAbilityResource && this.currentAbilityResource.value === previousTotalAbilityResource) {
					this.currentAbilityResource.value = this.stats.value?.total.mana ?? 0;
				} else {
					this.currentAbilityResource.value = Math.min(this.currentAbilityResource.value, this.maxAbilityResource.value);
				}
			}),

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

				handleMidQuestBoots(this.items.value, this.roleQuest.value);
			}),

			watch(this.isRanged, (value) => {
				if (!value) {
					for (let i = 0; i < this.items.value.length; i++) {
						const item = this.items.value[i];
						if (item && (RANGED_ONLY_ITEM_IDS as string[]).includes(item.id)) {
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

				const usedProperties = newIds.flatMap(id => id ? (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[id]?.internalDataProperties ?? [] : []);
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
		];

		markRaw(this);
	}

	clone(overrides: Partial<IOverrides> = {}): DamageSource<Id> {
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
			/* not cloned, same as `internalData` */
			appliedEffects: this.appliedEffects.value,
			...overrides,
		});
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
		this.runes.value.shards.offensive = 'adaptive';
		this.runes.value.shards.flex = 'adaptive';
		this.runes.value.shards.defensive = 'health';
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
			() => this.appliedEffects.value.map(effect => `${effect.id}-${effect.data.join('-')}`).join('|'),
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
			.join('|');

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
			Object.entries(this.internalItemData.value).filter(([key]) => !key.startsWith('_')).map(([key, value]) => `${key}~${value}`).join('|'),
			this.appliedEffects.value
				.filter((_, index) => this.computed.effects.value[index]?.isActive)
				.map(effect => `${EFFECT_SPECIFICS_OBJECT_ENTRIES.findIndex(([objectName]) => objectName === effect.abilityId.id)}-${effect.data.join('-')}`)
				.join('|'),
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
			for (const keyValue of rawInternalItemData.split('|')) {
				const [key, rawValue] = keyValue.split('~');
				if (key && rawValue) {
					const value = Number.parseInt(rawValue);
					if (!Number.isNaN(value)) {
						rv.internalItemData.value[key] = value;
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
			handleMidQuestBoots(rv.items.value, rv.roleQuest.value);
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

		if (rawCurrentHealth) {
			const parsedValue = Number.parseFloat(rawCurrentHealth);
			if (!Number.isNaN(parsedValue)) {
				rv.currentHealth.value = Math.max(0, rv.champion.value ? Math.min(rv.maxHealth.value, parsedValue) : parsedValue);
			}
		}

		if (rawCurrentAbilityResource) {
			const parsedValue = Number.parseFloat(rawCurrentAbilityResource);
			if (!Number.isNaN(parsedValue)) {
				rv.currentAbilityResource.value = Math.max(0, rv.champion.value ? Math.min(rv.maxAbilityResource.value, parsedValue) : parsedValue);
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
			for (const rawValue of rawInternalData.split('|')) {
				const value = Number.parseFloat(rawValue);
				fromStringifiedInternalData.push(Number.isNaN(value) ? undefined : value);
			}
		}

		if (rawEffectsData?.length) {
			for (const rawEffect of rawEffectsData.split('|')) {
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
					rv.addEffect(GameAbilityId.build(ABILITY_TYPE.effect, effectSpecificEntry[0]), data);
				}
			}
		}

		if (championKey && CHAMPION_KEY_TO_ID[championKey]) {
			rv.fromStringifiedInternalData = fromStringifiedInternalData;
			rv.listedChampion.value = CHAMPIONS[CHAMPION_KEY_TO_ID[championKey]];
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

		handleMidQuestBoots(this.items.value, this.roleQuest.value);
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
		handleMidQuestBoots(this.items.value, this.roleQuest.value);
	}

	getEffect(abilityId: IGameAbilityId): [IDamageSourceEffect, index: number] | undefined {
		const index = this.appliedEffects.value.findIndex(effect => effect.abilityId.id === abilityId.id);

		return ~index ? [this.appliedEffects.value[index]!, index] : undefined;
	}

	async addEffect(abilityId: IEffectAbilityId, data?: IDamageSourceEffect['data']): Promise<void> {
		const specific = EFFECT_SPECIFICS[abilityId.id];
		const existingEffectIndex = this.appliedEffects.value.findIndex(effect => GameAbilityId.isSame(effect.abilityId, abilityId));

		if (~existingEffectIndex) {
			console.warn(`[DamageSource addEffect] adding existing effect`, abilityId);
			this.appliedEffects.value[existingEffectIndex]!.data = await specific.setupData(data);
		} else {
			this.appliedEffects.value.push({
				id: GameAbilityId.stringify(abilityId, CHAMPION_ID_TO_KEY, EFFECT_SPECIFICS_OBJECT_ENTRIES),
				abilityId,
				data: await specific.setupData(data),
			});
			this.computed.effects.value.push(await computeAppliedEffect(this, this.appliedEffects.value.at(-1)!));
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

	computed: {
		formattedStatTotals: ComputedRef<Record<IChampionStatName, string>>;
		items: ComputedRef<(IComputedItemDescription | undefined)[]>;
		itemSpecifics: ComputedRef<({
			specific: IItemSpecific;
			abilityId: IItemAbilityId;
		} | undefined)[]>;
		masterworkItemSlotIndex: ComputedRef<number>;
		abilities: ComputedRef<Record<IChampionAbilityKey, IComputedAbilityDescription[]>>;
		effects: ShallowRef<IComputedAppliedEffect[]>;
	} = {
		/** the stats shown in the "panel" on extended scoreboard item & results table */
		formattedStatTotals: computed((): Record<IChampionStatName, string> => Object.fromEntries(
			ALL_CHAMPION_STATS.map(statName => [
				statName,
				formatChampionStatValue(statName, this.stats.value.total[statName as IChampionStatName]),
			]),
		) as unknown as Record<IChampionStatName, string>),
		items: computed((): (IComputedItemDescription | undefined)[] => {
			return this.items.value.map((item): IComputedItemDescription | undefined =>
				item && computeItemDescription(item, this),
			);
		}),
		itemSpecifics: computed((): ({
			specific: IItemSpecific;
			abilityId: IItemAbilityId;
		} | undefined)[] => this.items.value.map((item) => {
			if (item) {
				const abilityId = GameAbilityId.build(ABILITY_TYPE.item, item.id);
				const specific = resolveAbilitySpecific<any>(abilityId) as IItemSpecific;
				return {
					specific,
					abilityId,
				};
			}
			return undefined;
		})),
		masterworkItemSlotIndex: computed((): number => {
			let index = -1;

			if (this.champion.value?.id === 'Ornn') {
				if (this.level.value >= (this as DamageSource<'Ornn'>).internalData.value.masterworkLevel) {
					index = (this as DamageSource<'Ornn'>).internalData.value.masterworkItemSlot - 1;
				}
			} else {
				const effectAbilityId = GameAbilityId.build(ABILITY_TYPE.effect, EFFECT_OBJECT_NAME.ornnPLivingForge);
				const effect = this.getEffect(effectAbilityId);

				if (effect) {
					index = (effect[0].data as IGameAbilityData<typeof effectAbilityId>)[0] - 1;
				}
			}

			return index;
		}),
		abilities: computed((): Record<IChampionAbilityKey, IComputedAbilityDescription[]> => {
			return Object.fromEntries(Object.keys(this.abilityVariantsIndexes.value).map((key): [IChampionAbilityKey, IComputedAbilityDescription[]] => {
				const ability = this.champion.value?.abilities[key as IChampionAbilityKey];
				return [key as IChampionAbilityKey, ability?.variants.map((_, variantIndex) => computeAbilityDescription(
					this.champion.value!,
					GameAbilityId.build(ABILITY_TYPE.champion, this.champion.value!.id, key as IChampionAbilityKey, variantIndex),
					this,
				)) || []];
			})) as Record<IChampionAbilityKey, IComputedAbilityDescription[]>;
		}),
		effects: ref<IComputedAppliedEffect[]>([]) as unknown as ShallowRef<IComputedAppliedEffect[]>,
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

	/** the specifics' hooks grouped by type */
	calculateStatsHooks = {
		runes: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			for (const shard of Object.values(this.runes.value.shards)) {
				groupCalculateStatsHooks(rv, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).shards[shard]);
			}
			for (const rune of this.runes.value.paths.primarySlots) {
				rune && groupCalculateStatsHooks(rv, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).slots[rune]);
			}
			for (const rune of this.runes.value.paths.secondarySlots) {
				rune && groupCalculateStatsHooks(rv, (RUNE_SPECIFICS as IHypotheticalRuneSpecifics).slots[rune]);
			}
			return rv;
		}),
		items: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			for (const item of this.items.value) {
				item && groupCalculateStatsHooks(rv, (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[item.id]);
			}
			return rv;
		}),
		effects: computed((): ICalculateStatsGroupedHooks => {
			const rv: ICalculateStatsGroupedHooks = {};
			if (this.appliedEffects) {
				for (const effect of this.appliedEffects.value) {
					groupCalculateStatsHooks(rv, (EFFECT_SPECIFICS as IHypotheticalEffectSpecifics)[effect.abilityId.id]);
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
				// @ts-expect-error the hook being pushed is of correct type
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.runes.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			for (const key in this.calculateStatsHooks.items.value) {
				rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
				// @ts-expect-error the hook being pushed is of correct type
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.items.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			for (const key in this.calculateStatsHooks.effects.value) {
				rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
				// @ts-expect-error the hook being pushed is of correct type
				rv[key as keyof ICalculateChampionStatsHookSource]!.push(...this.calculateStatsHooks.effects.value[key as keyof ICalculateChampionStatsHookSource]!);
			}
			if (this.champion.value?.id) {
				const championHooks = groupCalculateStatsHooks({}, (CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[this.champion.value.id]);
				for (const key in championHooks) {
					rv[key as keyof ICalculateChampionStatsHookSource] ??= [];
					// @ts-expect-error the hook being pushed is of correct type
					rv[key as keyof ICalculateChampionStatsHookSource]!.push(...championHooks[key as keyof ICalculateChampionStatsHookSource]!);
				}
			}

			return Object.fromEntries(Object.entries(rv).map(([key, value]) => [
				key,
				value.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map(value => value.handler),
			]));
		}),
	};
}

function handleMidQuestBoots(items: (IItem | undefined)[], roleQuest?: IChampionRole): void {
	const bootsIndex = items.findIndex(item => item?.isBoots);
	const boots = items[bootsIndex]!;

	if (boots?.epicness) {
		if (roleQuest === 'mid' && boots.into?.length) {
			items[bootsIndex] = ITEMS[boots.into[0]!];
		} else if (roleQuest !== 'mid' && boots.epicness === 7) {
			items[bootsIndex] = ITEMS[boots.from![0]!];
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
	replaceOptions?: Parameters<typeof replaceGameVariables>[3],
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
	const stats = Object.entries(item.stats)
		.filter(([statName]) => (statName as IItemStat) !== 'FlatHPRegenMod')
		.sort((a, b) => ITEM_STAT_META[b[0] as IItemStat].order - ITEM_STAT_META[a[0] as IItemStat].order)
		.map(([statName, value]) => {
			const { name, displayMultiplier, isPercentage } = ITEM_STAT_META[statName as IItemStat];
			return [
				STAT_ICON[statName as IItemStat],
				displayMultiplier ? Math.round(value * displayMultiplier) : isPercentage ? `${Math.round(value * 100)}%` : value,
				name,
			] as [string, number, string];
		});

	const shopFormatted = formatItemDescriptionText(tooltipShop, item, damageSource, variables, unknownVariables, replaceOptions);
	const inventoryFormatted = formatItemDescriptionText(tooltipInventory, item, damageSource, variables, unknownVariables, replaceOptions);

	const replacedExtended = additionalItemText(extended, item, damageSource, variables, unknownVariables, replaceOptions);
	const replacedFooterLeft = additionalItemText(footerLeft, item, damageSource, variables, unknownVariables, replaceOptions);
	const replacedKeywordDefinitions = additionalItemText(keywordDefinitions, item, damageSource, variables, unknownVariables, replaceOptions);

	return {
		item,
		variables,
		unknownVariables,
		extended: replacedExtended,
		footerLeft: replacedFooterLeft,
		keywordDefinitions: replacedKeywordDefinitions,
		subtitleLeft,
		subtitleRight,
		stats,
		tooltipShop: shopFormatted,
		tooltipInventory: inventoryFormatted,
	};
}

function additionalItemText(
	value: string | undefined,
	item: IItem,
	damageSource: DamageSource | undefined,
	variables: IComputedItemDescription['variables'],
	unknownVariables: IComputedItemDescription['unknownVariables'],
	replaceOptions?: Parameters<typeof replaceGameVariables>[3],
): string | undefined {
	const { replaced, variables: newVariables, unknownVariables: newUnknownVariables } = value
		? replaceGameVariables(
			/* technically unknown here should be noted and an alert should be shown but for now all of them were resolved and if any unknown occur, `updateGameData` script should report them */
				replaceStringtableVariables(value, TEXT.stringtable).replaced,
				'item',
				[item, damageSource?.isRanged.value, damageSource],
				replaceOptions,
			)
		: {};

	for (const unknownVariable of newUnknownVariables || []) {
		if (!unknownVariables.some(v => v[0] === unknownVariable[0])) {
			unknownVariables.push(unknownVariable);
		}
	}
	newVariables && mergeMaps(variables, newVariables);

	return replaced;
}

function mergeMaps<T, U>(map1: Map<T, U>, map2: Map<T, U>) {
	for (const [variableKey, variableValue] of map2.entries()) {
		map1.set(variableKey, variableValue);
	}
}

export function allChampionAbilityVariants(champion?: IChampion): IChampionAbilityVariant[] {
	return champion ? Object.values(champion.abilities).flatMap(ability => ability.variants) : [];
}

export function computeAbilityDescription(
	champion: IChampion,
	gameAbilityId: IChampionAbilityId,
	damageSource?: DamageSource<any>,
	replaceOptions?: Parameters<typeof replaceGameVariables>[3],
): IComputedAbilityDescription {
	const abilityLevel = gameAbilityId.abilityKey !== 'passive' ? damageSource?.abilityLevels.value[gameAbilityId.abilityKey] || 1 : undefined;
	const ability = champion.abilities[gameAbilityId.abilityKey];
	const variant = ability.variants[gameAbilityId.abilityVariantIndex]!;
	const allVariants = allChampionAbilityVariants(champion);

	const { replaced: nameReplaced, unknownStringtableVariables: nameUnknownSV } = replaceStringtableVariables(
		variant.name,
		champion.stringtable,
	);

	const variables: IComputedAbilityDescription['variables'] = new Map();
	const unknownVariables: IComputedAbilityDescription['unknownVariables'] = [];

	const {
		replaced: tooltipReplaced,
		unknownSV: tooltipUnknownSV,
		unknownV: tooltipUnknownV,
		variablesAllValues: tooltipVariablesAV,
		variables: tooltipVariables,
	} = abilityVariantText(
		allVariants,
		variant.tooltip || '<unknown>UNKNOWN</unknown>',
		variant,
		abilityLevel,
		champion.stringtable,
		replaceOptions?.replaceWithName,
	);
	const {
		replaced: tooltipExtendedReplaced,
		unknownSV: tooltipExtendedUnknownSV,
		unknownV: tooltipExtendedUnknownV,
		variablesAllValues: tooltipExtendedVariablesAV,
		variables: tooltipExtendedVariables,
	} = abilityVariantText(
		allVariants,
		variant.tooltipExtended || '',
		variant,
		abilityLevel,
		champion.stringtable,
		replaceOptions?.replaceWithName,
	);
	const {
		replaced: tooltipExtendedBelowLineReplaced,
		unknownSV: tooltipExtendedBelowLineUnknownSV,
		unknownV: tooltipExtendedBelowLineUnknownV,
		variables: tooltipExtendedBelowLineVariables,
	} = abilityVariantText(
		allVariants,
		variant.tooltipExtendedBelowLine || '',
		variant,
		abilityLevel,
		champion.stringtable,
		replaceOptions?.replaceWithName,
	);

	mergeMaps(variables, tooltipVariables);
	mergeMaps(variables, tooltipExtendedVariables);
	mergeMaps(variables, tooltipExtendedBelowLineVariables);

	for (const unknownVariablesGroup of [tooltipUnknownV, tooltipExtendedUnknownV, tooltipExtendedBelowLineUnknownV]) {
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
	const anyUnknownVariables = nameUnknownSV.size || tooltipUnknownSV.size || tooltipUnknownV.length || tooltipExtendedUnknownSV.size || tooltipExtendedUnknownV.length || tooltipExtendedBelowLineUnknownSV.size || tooltipExtendedBelowLineUnknownV.length;

	return {
		gameAbilityId,
		name: nameReplaced,
		tooltip: tooltipReplaced,
		tooltipExtended: tooltipExtendedReplaced,
		tooltipExtendedBelowLine: tooltipExtendedBelowLineReplaced,
		anyUnknownVariables,
		cooldown,
		cost,
		partype: champion.partype,
		extendedVariables,
		variables,
		unknownVariables,
		variant,
	};
}

function abilityVariantText(
	allAbilityVariants: IChampionAbilityVariant[],
	value: string,
	variant: IChampionAbilityVariant,
	level?: number,
	/** champion's stringtable */
	stringtable?: Record<string, string>,
	replaceVariablesWithNames?: boolean,
) {
	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceStringtableVariables(
		value,
		stringtable,
	);

	const { replaced, unknownVariables, variablesAllValues, variables } = replaceGameVariables(
		stringtableReplaced,
		'championAbility',
		[variant, level, allAbilityVariants],
		{ replaceWithName: replaceVariablesWithNames },
	);

	return {
		replaced: replaceGameIcons(replaced),
		unknownSV: unknownStringtableVariables,
		unknownV: unknownVariables,
		variablesAllValues,
		variables,
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
	replaceOptions?: Parameters<typeof replaceGameVariables>[3],
): [string, ...string[]][] | undefined {
	return value?.map(([heading, ...paragraphs]) => {
		/* technically unknown here and for paragraphs should be noted and an alert should be shown but for now all of them were resolved and if any unknown occur, `updateGameData` script should report them */
		const { replaced: headingStringtableReplaced } = replaceStringtableVariables(heading!
			.replace(/\{\{ ?Item_Cooldown ?\}\}/g, () => {
				const { value } = itemVariableValue('Cooldown', item, damageSource?.isRanged.value, damageSource);
				return `${ICON_COOLDOWN_IMG}(${value || '<unknown>UNKNOWN</unknown>'}s<span> cooldown</span>)`;
			})
			.replace('(', '<span>(')
			.replace(')', ')</span>'), TEXT.stringtable);

		const { variables: headingVariables, replaced: replacedHeading, unknownVariables: headingUnknown } = replaceGameVariables(
			headingStringtableReplaced,
			'item',
			[item, damageSource?.isRanged.value, damageSource],
			replaceOptions,
		);

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
				const { variables: paragraphVariables, replaced: replacedParagraph, unknownVariables: paragraphUnknown } = replaceGameVariables(
					paragraphStringtableReplaced,
					'item',
					[item, damageSource?.isRanged.value, damageSource],
					replaceOptions,
				);

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
	});
}

async function computeAppliedEffect(_self: DamageSource, effect: IDamageSourceEffect): Promise<IComputedAppliedEffect> {
	const specific = EFFECT_SPECIFICS[effect.abilityId.id] as IEffectSpecific;
	const rv: IComputedAppliedEffect = {
		id: effect.id,
		abilityId: effect.abilityId,
		imgSrc: '',
		imgSize: 0,
		imgText: computed((): string | number | undefined => specific.imgText?.(effect.data)),
		isActive: computed((): number | boolean => specific.isActive(effect.data)),
		specific,
		maxValue: typeof specific.maxValue === 'function' ? await specific.maxValue() : specific.maxValue,
	};

	gameAbilityImage(specific.sourceAbility).then(([imgSrc, imgSize]) => {
		rv.imgSrc = imgSrc;
		rv.imgSize = imgSize;
	});

	return rv;
}

export function isMasterworkSlot(self: DamageSource, itemIndex: number): boolean {
	const item = self.computed.items.value[itemIndex];
	return self.computed.masterworkItemSlotIndex.value === itemIndex && (!item || item.item.epicness === 5);
}

function groupCalculateStatsHooks(target: ICalculateStatsGroupedHooks, hookSource?: { calculateHooks?: ICalculateChampionStatsHookSource }): ICalculateStatsGroupedHooks {
	if (hookSource?.calculateHooks) {
		for (const hook in hookSource.calculateHooks) {
			target[hook as keyof ICalculateChampionStatsHookSource] ??= [];
			// @ts-expect-error the hook being pushed is of correct type
			target[hook as keyof ICalculateChampionStatsHookSource]!.push(hookSource.calculateHooks[hook as keyof ICalculateChampionStatsHookSource]!);
		}
	}
	return target;
}

type IInternalDataSetupChampions = {
	[K in keyof typeof CHAMPION_SPECIFICS]: (typeof CHAMPION_SPECIFICS)[K] extends { setupData: (...args: any) => any }
		? K
		: never;
}[keyof typeof CHAMPION_SPECIFICS];

export interface IDamageSourceInternalDataBase {
	_watchHandles?: WatchHandle[];
}

export interface IDamageSourceInternalDataProvider {
	/**
	 * returns the `internalData.value` for specific `DamageSource`'s champion
	 * should reuse the existing `DamageSource.internalData` to set the values (for cloning)
	 * and expects the previous `internalData` values to be of correct type (from parsing stringified state), as in `DamageSource.fromStringifiedData` should ensure the values are parsed (but not validated/clamped, that's done by the `setupData`)
	 */
	setupData: (self: DamageSource) => any;
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

export type IProviderGroupDataSetup = { setupData?: never } | IDamageSourceInternalDataProvider;

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

export interface IDamageSourceEffect<T extends any[] = any[]> {
	/** stringified `abilityId` */
	id: string;
	abilityId: IEffectAbilityId;
	/** any effect data, stored in array like `[carve: number]` for easier stringifying/parsing */
	data: T;
}

export interface IComputedAbilityDescription {
	gameAbilityId: IChampionAbilityId;
	name: string;
	tooltip: string;
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
}

export interface IComputedItemDescription extends Pick<ITextData['items'][keyof ITextData['items']], 'subtitleLeft' | 'subtitleRight' | 'tooltipShop' | 'tooltipInventory' | 'extended' | 'footerLeft' | 'keywordDefinitions'> {
	item: IItem;
	stats: [iconName: string, value: number, name: string][];
	variables: ReturnType<typeof replaceGameVariables>['variables'];
	unknownVariables: ReturnType<typeof replaceGameVariables>['unknownVariables'];
}

export interface IComputedAppliedEffect {
	id: string;
	abilityId: IEffectAbilityId;
	imgSrc: string;
	imgSize: number;
	imgText: ComputedRef<ReturnType<NonNullable<IEffectSpecific['imgText']>> | undefined>;
	isActive: ComputedRef<ReturnType<IEffectSpecific['isActive']>>;
	specific: IEffectSpecific;
	/** the `maxValue` computed from the effect specific */
	maxValue?: number;
}

/**
 * any hooks that will be called at various points in calculations, if provided
 */
export interface ICalculateChampionStatsHookSource {
	/** runs after resolving the champion in `calculateChampionStats` */
	postInit?: ICalculateChampionStatsHook<(self: DamageSource, baseStats: IChampionStats) => void>;
	postItems?: ICalculateChampionStatsHook<(self: DamageSource, itemStats: IChampionStats, baseStats: IChampionStats, baseWithFlatItemMoveSpeed: number) => void>;
	/** runs after creating empty `runeShardStats`, before adding them up to `levelAndRunesStats` */
	postRuneShards?: ICalculateChampionStatsHook<(self: DamageSource, runeShardStats: Partial<IChampionStats>, baseStats: IChampionStats, adaptiveForceMeta: IAdaptiveForceStatRv, baseWithFlatItemMoveSpeed: number) => void>;
};

type ICalculateStatsGroupedHooks = {
	[K in keyof ICalculateChampionStatsHookSource]?: NonNullable<ICalculateChampionStatsHookSource[K]>[]
};

interface ICalculateChampionStatsHook<T> {
	handler: T;
	/** the higher the, the **later** it will run */
	priority?: number;
}
