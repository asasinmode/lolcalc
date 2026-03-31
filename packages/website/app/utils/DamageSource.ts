import type { ShallowRef, UnwrapRef, WatchHandle } from 'vue';

type IDamageSource<T extends IChampionId | undefined = undefined> = InstanceType<typeof DamageSource<T>>;

interface IOverrides<Id extends IChampionId | undefined = undefined> {
	champion: UnwrapRef<IDamageSource['listedChampion']>;
	level: UnwrapRef<IDamageSource['level']>;
	items: UnwrapRef<IDamageSource['items']>;
	runes: UnwrapRef<IDamageSource['runes']>;
	abilityLevels: Partial<UnwrapRef<IDamageSource['abilityLevels']>>;
	abilityVariants: Partial<UnwrapRef<IDamageSource['abilityVariants']>>;
	currentHealth: UnwrapRef<IDamageSource['currentHealth']>;
	currentAbilityResource: UnwrapRef<IDamageSource['currentAbilityResource']>;
	dragonStacks: UnwrapRef<IDamageSource['dragonStacks']>;
	dragonSoul: UnwrapRef<IDamageSource['dragonSoul']>;
	roleQuest: UnwrapRef<IDamageSource['roleQuest']>;
	internalData: UnwrapRef<IDamageSource<Id>['internalData']>;
}

type INonPassiveAbilityKey = Exclude<IChampionAbilityKey, 'passive'>;

export class DamageSource<Id extends IChampionId | undefined = any> {
	id: string;
	color: string;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;

	level: Ref<number>;
	maxLevel = computed(() => this.roleQuest.value === 'top' ? 20 : 18);

	isRanged = computed(() => this.champion.value && ((this.champion.value.stats.attackrange || 0) > 325));
	stats = computed(() => calculateChampionStats(this));
	itemDamageCalculationTarget = computed<IItemVariableCalculationTarget>(() => ({
		isRanged: this.isRanged.value,
		stats: this.stats.value?.stats.total,
	}));

	runes: Ref<IChampionRunes>;
	runePathsEmpty = computed(() => runePathsEmpty(this.runes.value));
	runesInvalid = computed(() => runesInvalid(this.runes.value, this.runePathsEmpty.value));

	currentHealth: Ref<number>;
	maxHealth = computed<number>(() => Math.round(this.stats.value?.stats.total.hp || 1));
	currentAbilityResource: Ref<number>;
	abilityResourceName = computed(() => this.champion.value ? (this.champion.value?.partype || '<unknown>') : 'mana');
	maxAbilityResource = computed<number>(() => Math.round(this.champion.value?.partype === 'Mana' ? this.stats.value?.stats.total.mana! : 0));

	items: Ref<(IItem | undefined)[]>;
	itemsUndoSnapshots: Ref<(IItem | undefined)[][]>;

	abilityLevels: Ref<Record<INonPassiveAbilityKey, number>>;
	maxAbilityLevels = computed(() => Object.fromEntries(Object.keys(this.abilityLevels.value).map(key => [
		key as INonPassiveAbilityKey,
		this.champion.value?.abilities[key as IChampionAbilityKey].maxLevel ?? 5,
	])) as Record<INonPassiveAbilityKey, number>);

	abilityVariants: Ref<Record<IChampionAbilityKey, number>>;
	maxAbilityVariants = computed(() => Object.fromEntries(Object.keys(this.abilityVariants.value).map(key => [
		key as IChampionAbilityKey,
		(this.champion.value?.abilities[key as IChampionAbilityKey].variants.length ?? 1) - 1,
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
		return Boolean(this.listedChampion.value || this.items.value.some(Boolean) || !this.runePathsEmpty.value || this.dragonStacks.value.some(Boolean) || this.dragonSoul.value || this.roleQuest.value);
	});

	internalData: Ref<Id extends IInternalDataSetupChampions
		? ReturnType<(typeof CHAMPION_SPECIFICS)[Id]['setupInternalData']>
		: undefined>;
	watchHandles: WatchHandle[];

	/** if true, first call of champion watch will not set anything, used when parsing stringified data */
	skipInitialChampionOverrides: boolean;

	constructor(overrides: (Partial<Omit<IOverrides<Id>, 'champion'>> & {
		champion?: { id: Id } & IListedChampion;
	}) = {}) {
		/* + 1 because it's a nicer color */
		const counter = useState<number>('damageSourceCounter', () => 1);
		const hue = (counter.value++ * 137.508) % 360;
		this.color = `oklch(0.7 0.15 ${hue.toFixed(4)})`;

		this.id = counter.value.toString();
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
		this.currentHealth = ref(overrides.currentHealth ?? (this.stats.value?.stats.total.hp ?? 0));
		this.currentAbilityResource = ref(overrides.currentAbilityResource ?? (this.stats.value?.stats.total.mana ?? 0));
		this.abilityLevels = ref({ q: 0, w: 0, e: 0, r: 0, ...overrides.abilityLevels });
		this.abilityVariants = ref({ passive: 0, q: 0, w: 0, e: 0, r: 0, ...overrides.abilityVariants });
		this.dragonStacks = ref(overrides.dragonStacks ?? Array.from({ length: 4 }));
		this.dragonSoul = ref(overrides.dragonSoul);
		this.roleQuest = ref(overrides.roleQuest);
		/* expected to be overriden by freshly setup data in `this.champion` watch below */
		this.internalData = ref<any>(overrides.internalData ?? {});
		this.skipInitialChampionOverrides = false;

		this.watchHandles = [
			watch(this.listedChampion, async (c) => {
				this.champion.value = undefined;

				const champion = c && await useChampion(c.id);
				if (this.listedChampion.value?.id === champion?.id) {
					this.champion.value = champion;
				}
			}, { immediate: true }),

			watch(this.champion, (c) => {
				this.internalData.value = (this.champion.value?.id && (CHAMPION_SPECIFICS as any)[this.champion.value?.id]?.setupInternalData?.(this)) || {};

				if (this.skipInitialChampionOverrides) {
					this.skipInitialChampionOverrides = false;

					for (const abilityKey in this.abilityLevels.value) {
						this.abilityLevels.value[abilityKey as INonPassiveAbilityKey] = Math.min(
							this.abilityLevels.value[abilityKey as INonPassiveAbilityKey],
							this.maxAbilityLevels.value[abilityKey as INonPassiveAbilityKey],
						);
					}

					for (const abilityKey in this.abilityVariants.value) {
						this.abilityVariants.value[abilityKey as IChampionAbilityKey] = Math.min(
							this.abilityVariants.value[abilityKey as IChampionAbilityKey],
							this.maxAbilityVariants.value[abilityKey as IChampionAbilityKey],
						);
					}

					return;
				}

				this.currentHealth.value = this.stats.value?.stats.total.hp || 0;
				this.currentAbilityResource.value = this.stats.value?.stats.total.mana || 0;

				const level = c?.id === 'TargetDummy' ? 1 : 0;
				this.abilityLevels.value = { q: level, w: level, e: level, r: level };
				this.abilityVariants.value = { passive: 0, q: 0, w: 0, e: 0, r: 0 };
			}),

			watch(() => [this.stats.value?.stats.total.hp, this.stats.value?.stats.total.mana], (_, [previousTotalHp, previousTotalAbilityResource]) => {
				if (previousTotalHp && this.currentHealth.value === previousTotalHp) {
					this.currentHealth.value = this.stats.value?.stats.total.hp || 0;
				} else {
					this.currentHealth.value = Math.min(this.currentHealth.value, this.stats.value?.stats.total.hp || 0);
				}
				if (previousTotalAbilityResource && this.currentAbilityResource.value === previousTotalAbilityResource) {
					this.currentAbilityResource.value = this.stats.value?.stats.total.mana || 0;
				} else {
					this.currentAbilityResource.value = Math.min(this.currentAbilityResource.value, this.stats.value?.stats.total.mana || 0);
				}
			}),

			watch(this.roleQuest, (value) => {
				if (value !== 'top' && this.level.value > 18) {
					this.level.value = 18;
				}
				if (value === 'bot') {
					const bootsIndex = this.items.value.findIndex(item => item?.isBoots);
					if (~bootsIndex) {
						const boots = this.items.value[bootsIndex]!;
						this.items.value[bootsIndex] = undefined;
						this.items.value[6] = boots;
						cleanupItems(this.items.value);
					}
				} else if (this.items.value[6]?.isBoots) {
					const firstEmptyIndex = this.items.value.indexOf(undefined);
					if (~firstEmptyIndex) {
						this.items.value[firstEmptyIndex] = this.items.value[6];
						this.items.value[6] = undefined;
						cleanupItems(this.items.value);
					}
				}
			}),

			watch(this.isRanged, (value) => {
				if (!value) {
					for (let i = 0; i < this.items.value.length; i++) {
						const item = this.items.value[i];
						if (item && RANGED_ONLY_ITEM_IDS.includes(item.id)) {
							this.items.value[i] = undefined;
						}
					}
				}
			}),
		];
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
			abilityVariants: structuredClone(toRaw(this.abilityVariants.value)),
			dragonStacks: structuredClone(toRaw(this.dragonStacks.value)),
			dragonSoul: this.dragonSoul.value,
			roleQuest: this.roleQuest.value,
			/* not cloned because the `setupInternalData` should handle safely using previous values to create new ones */
			internalData: this.internalData.value,
			...overrides,
		});
	}

	clear() {
		this.listedChampion.value = undefined;
		this.champion.value = undefined;
		this.level.value = 1;
		for (let i = 0; i < this.items.value.length; i++) {
			this.items.value[i] = undefined;
		}
		this.itemsUndoSnapshots.value = [];
		this.runes.value.paths.primary = 'Precision';
		this.runes.value.paths.primarySlots = [];
		this.runes.value.paths.secondary = undefined;
		this.runes.value.paths.secondarySlots = [];
		this.runes.value.shards.offensive = 'adaptive';
		this.runes.value.shards.flex = 'adaptive';
		this.runes.value.shards.defensive = 'health';
		this.currentHealth.value = this.stats.value?.stats.total.hp ?? 0;
		this.currentAbilityResource.value = this.stats.value?.stats.total.mana ?? 0;
		this.abilityLevels.value.q = 0;
		this.abilityLevels.value.w = 0;
		this.abilityLevels.value.e = 0;
		this.abilityLevels.value.r = 0;
		this.abilityVariants.value.passive = 0;
		this.abilityVariants.value.q = 0;
		this.abilityVariants.value.w = 0;
		this.abilityVariants.value.e = 0;
		this.abilityVariants.value.r = 0;
		for (let i = 0; i < this.dragonStacks.value.length; i++) {
			this.dragonStacks.value[i] = undefined;
		}
		this.dragonSoul.value = undefined;
		this.roleQuest.value = undefined;
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
			() => Object.values(this.abilityVariants.value).join('-'),
			this.roleQuest,
			() => this.dragonStacks.value.join('-'),
			this.dragonSoul,
			() => Object.values(this.internalData.value || {}).join('-'),
		];
	}

	stringifiedData = computed<string>(() => {
		const runes = useRunes();
		const text = useText();

		const primarySlots = Array.from({ length: 4 }, (_, i) => {
			const slotOptions = runes.paths[this.runes.value.paths.primary].slots[i]!;
			const slotValue = this.runes.value.paths.primarySlots[i];
			return slotValue ? `${i}${objectKeyIndex(slotValue, slotOptions)}` : '';
		});
		const secondarySlots = this.runes.value.paths.secondary
			? Array.from({ length: 2 }, (_, i) => {
					if (this.runes.value.paths.secondarySlots[i]) {
						const slotIndex = RUNE_SLOT_NAME_TO_NUMBER[this.runes.value.paths.secondarySlots[i]];
						const slotOptions = runes.paths[this.runes.value.paths.secondary!].slots[slotIndex]!;
						return `${slotIndex}${objectKeyIndex(this.runes.value.paths.secondarySlots[i], slotOptions)}`;
					}

					return '';
				})
			: [];
		const shards = Object.entries(this.runes.value.shards).map(([key, shard]) => objectKeyIndex(shard as any, runes.shards[key as IRuneShardSlotName]));

		const runePathKeys = Object.keys(runes.paths);
		const roleQuestKeys = Object.keys(text.roleQuests);
		const dragonKeys = Object.keys(text.dragons);

		const data = [
			this.listedChampion.value?.key,
			this.level.value,
			this.items.value.map(item => item?.id).filter(Boolean).join('-'),
			runePathKeys.indexOf(this.runes.value.paths.primary),
			primarySlots.join('-'),
			this.runes.value.paths.secondary && runePathKeys.indexOf(this.runes.value.paths.secondary),
			secondarySlots.join('-'),
			shards.join('-'),
			this.currentHealth.value,
			this.currentAbilityResource.value,
			Object.values(this.abilityLevels.value).join('-'),
			Object.values(this.abilityVariants.value).join('-'),
			this.dragonStacks.value.filter(Boolean).map(stack => dragonKeys.indexOf(stack!)).join('-'),
			this.dragonSoul.value && dragonKeys.indexOf(this.dragonSoul.value),
			Object.keys(this.internalData.value || {}).length ? JSON.stringify(this.internalData.value) : undefined,
			this.roleQuest.value && roleQuestKeys.indexOf(this.roleQuest.value),
		];

		return data.join('_');
	});

	static fromStringifiedData(data: string): DamageSource {
		const champions = useChampions();
		const items = useItems();
		const runes = useRunes();
		const text = useText();

		const rv = new DamageSource();

		const	[
			championKey,
			rawLevel,
			rawItemIds,
			primaryRunePathIndex,
			rawPrimarySlots,
			secondaryRunePathIndex,
			rawSecondarySlots,
			rawShards,
			rawCurrentHealth,
			rawCurrentAbilityResource,
			rawAbilityLevels,
			rawAbilityVariants,
			rawDragonStacks,
			rawDragonSoulIndex,
			rawInternalData,
			rawRoleQuestIndex,
		] = data.split('_');

		if (championKey && CHAMPION_KEY_TO_ID[championKey]) {
			rv.listedChampion.value = champions[CHAMPION_KEY_TO_ID[championKey]];
			rv.skipInitialChampionOverrides = true;
		}

		if (rawRoleQuestIndex?.length) {
			const parsedIndex = Number.parseInt(rawRoleQuestIndex);
			const roleQuestKeys = Object.keys(text.roleQuests) as IChampionRole[];

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

		const itemIds = rawItemIds?.split('-');
		if (itemIds?.length) {
			for (let i = 0; i < rv.items.value.length; i++) {
				const item = items[itemIds[i]!];
				if (item && itemBuyability(item, rv, items, false) === 1) {
					rv.items.value[i] = markRaw(item);
				}
			}
			cleanupItems(rv.items.value);
		}

		const runePaths = Object.keys(runes.paths);
		if (primaryRunePathIndex) {
			const parsedIndex = Number.parseInt(primaryRunePathIndex);
			if (runePaths[parsedIndex]) {
				rv.runes.value.paths.primary = runePaths[parsedIndex] as IRunePathName;
			}
		}

		if (rawPrimarySlots?.length) {
			for (const slot of parseStringifiedRunePathSlots(rawPrimarySlots)) {
				if (slot) {
					const [slotIndex, optionIndex] = slot;
					if (slotIndex >= 0 && slotIndex <= 3) {
						const slotOptions = runes.paths[rv.runes.value.paths.primary].slots[slotIndex]!;
						const slotOptionKeys = Object.keys(slotOptions);
						rv.runes.value.paths.primarySlots[slotIndex] = slotOptionKeys[optionIndex] as IRuneSlotName | undefined;
					}
				}
			}
		}

		if (secondaryRunePathIndex) {
			const parsedIndex = Number.parseInt(secondaryRunePathIndex);
			if (runePaths[parsedIndex]) {
				rv.runes.value.paths.secondary = runePaths[parsedIndex] as IRunePathName;
			}
		}

		if (rv.runes.value.paths.secondary && rawSecondarySlots?.length) {
			const slots = parseStringifiedRunePathSlots(rawSecondarySlots);
			for (let i = 0; i < 2; i++) {
				if (slots[i]) {
					const [slotIndex, optionIndex] = slots[i]!;
					const slotOptions = runes.paths[rv.runes.value.paths.secondary].slots[slotIndex];
					if (slotOptions) {
						const slotOptionKeys = Object.keys(slotOptions);
						rv.runes.value.paths.secondarySlots[i] = slotOptionKeys[optionIndex] as IRuneSlotName | undefined;
					}
				}
			}
		}

		if (rawShards?.length) {
			const shardIndexes = rawShards.split('-');
			let i = 0;
			for (const [shardSlotKey, shardSlot] of Object.entries(runes.shards)) {
				const shardOptionIndex = shardIndexes[i];
				if (shardOptionIndex !== undefined) {
					const parsedIndex = Number.parseInt(shardOptionIndex);
					if (!Number.isNaN(parsedIndex)) {
						const shardSlotOptionKeys = Object.keys(shardSlot);
						if (shardSlotOptionKeys[parsedIndex]) {
							// @ts-expect-error both key and value should match now
							rv.runes.value.shards[shardSlotKey] = shardSlotOptionKeys[parsedIndex] as any;
						}
					}
				}
				i++;
			}
		}

		if (rawCurrentHealth) {
			const parsedValue = Number.parseInt(rawCurrentHealth);
			if (!Number.isNaN(parsedValue)) {
				rv.currentHealth.value = Math.max(0, rv.champion.value ? Math.min(rv.maxHealth.value, parsedValue) : parsedValue);
			}
		}

		if (rawCurrentAbilityResource) {
			const parsedValue = Number.parseInt(rawCurrentAbilityResource);
			if (!Number.isNaN(parsedValue)) {
				rv.currentAbilityResource.value = Math.max(0, rv.champion.value ? Math.min(rv.maxAbilityResource.value, parsedValue) : parsedValue);
			}
		}

		if (rawAbilityLevels?.length) {
			const abilityLevels = rawAbilityLevels.split('-');
			const abilityKeys = Object.keys(rv.abilityLevels.value);
			for (let i = 0; i < abilityKeys.length; i++) {
				if (abilityLevels[i]) {
					const parsedLevel = Number.parseInt(abilityLevels[i]!);
					if (!Number.isNaN(parsedLevel)) {
						const abilityKey = abilityKeys[i] as INonPassiveAbilityKey;
						rv.abilityLevels.value[abilityKey]
							= Math.max(0, rv.champion.value ? Math.min(rv.maxAbilityLevels.value[abilityKey], parsedLevel) : parsedLevel);
					}
				}
			}
		}

		if (rawAbilityVariants?.length) {
			const abilityVariants = rawAbilityVariants.split('-');
			const abilityKeys = Object.keys(rv.abilityVariants.value);
			for (let i = 0; i < abilityKeys.length; i++) {
				if (abilityVariants[i]) {
					const parsedVariant = Number.parseInt(abilityVariants[i]!);
					if (!Number.isNaN(parsedVariant)) {
						const abilityKey = abilityKeys[i] as IChampionAbilityKey;
						rv.abilityVariants.value[abilityKey]
							= Math.max(0, rv.champion.value ? Math.min(rv.maxAbilityVariants.value[abilityKey], parsedVariant) : parsedVariant);
					}
				}
			}
		}

		const dragonKeys = Object.keys(text.dragons) as IDragonName[];

		if (rawDragonStacks?.length) {
			const dragonStacks = rawDragonStacks.split('-');
			for (let i = 0; i < rv.dragonStacks.value.length; i++) {
				const parsedIndex = dragonStacks[i] ? Number.parseInt(dragonStacks[i]!) : undefined;
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

		if (rawInternalData?.length) {
			try {
				rv.internalData.value = JSON.parse(rawInternalData);
			} catch {}
		}

		return rv;
	}

	addItem(item: IItem, allItems: Record<string, IItem>, consumeComponents = true): undefined {
		this.itemsUndoSnapshots.value.push([...this.items.value]);
		if (consumeComponents) {
			const consumedInventoryIndexes = consumeItemComponents(item.id, this.items.value, allItems);
			for (const index of consumedInventoryIndexes) {
				this.items.value[index] = undefined;
			}
		}

		if (this.roleQuest.value === 'bot' && item.isBoots) {
			this.items.value[6] = markRaw(item);
		} else {
			for (let i = 0; i < 6; i++) {
				if (!this.items.value[i]) {
					this.items.value[i] = markRaw(item);
					break;
				}
			}
		}

		cleanupItems(this.items.value);
	}

	removeItem(index: number): IItem | undefined {
		const item = this.items.value[index];
		if (item) {
			this.itemsUndoSnapshots.value.push([...this.items.value]);
			this.items.value[index] = undefined;
			cleanupItems(this.items.value);
			return item;
		}
	}

	computed = {
		stats: computed<Record<IChampionStatName, IComputedDamageSourceChampionStat>>(() => {
			const { stats } = this.stats.value;

			const rv: Record<IChampionStatName, Omit<IComputedDamageSourceChampionStat, 'formattedTotal'> & { formattedTotal?: number }> = {
				hp: {
					base: stats.baseOnLevel.hp,
					bonus: stats.bonus.hp,
					total: stats.total.hp,
				},
				mana: {
					base: stats.baseOnLevel.mana,
					bonus: stats.bonus.mana,
					total: stats.total.mana,
				},
				attackDamage: {
					base: stats.baseOnLevel.attackDamage,
					bonus: stats.bonus.attackDamage,
					total: stats.total.attackDamage,
				},
				abilityPower: {
					bonus: stats.bonus.abilityPower,
					total: stats.total.abilityPower,
				},
				armor: {
					base: stats.baseOnLevel.armor,
					bonus: stats.bonus.armor,
					total: stats.total.armor,
				},
				magicResist: {
					base: stats.baseOnLevel.magicResist,
					bonus: stats.bonus.magicResist,
					total: stats.total.magicResist,
				},
				abilityHaste: {
					bonus: stats.bonus.abilityHaste,
					total: stats.total.abilityHaste,
				},
				attackSpeed: {
					total: stats.total.attackSpeed,
					decimal: 3,
				},
				bonusAttackSpeedPercent: {
					bonus: stats.bonus.bonusAttackSpeedPercent,
					total: stats.total.bonusAttackSpeedPercent,
					isPercentage: true,
					decimal: 5,
				},
				attackSpeedRatio: {
					total: stats.total.attackSpeedRatio,
					decimal: 3,
				},
				critChance: {
					bonus: stats.bonus.critChance,
					total: stats.total.critChance,
					isPercentage: true,
				},
				critDamageMultiplier: {
					base: stats.base.critDamageMultiplier,
					bonus: stats.bonus.critDamageMultiplier,
					total: stats.total.critDamageMultiplier,
					isPercentage: true,
				},
				lethality: {
					bonus: stats.bonus.lethality,
					total: stats.total.lethality,
				},
				percentArmorPen: {
					decimal: 2,
					bonus: stats.bonus.percentArmorPen,
					total: stats.total.percentArmorPen,
					isPercentage: true,
				},
				flatMagicPen: {
					bonus: stats.bonus.flatMagicPen,
					total: stats.total.flatMagicPen,
				},
				percentMagicPen: {
					decimal: 2,
					bonus: stats.bonus.percentMagicPen,
					total: stats.total.percentMagicPen,
					isPercentage: true,
				},
				lifeSteal: {
					bonus: stats.bonus.lifeSteal,
					total: stats.total.lifeSteal,
					isPercentage: true,
				},
				omnivamp: {
					bonus: stats.bonus.omnivamp,
					total: stats.total.omnivamp,
					isPercentage: true,
				},
				moveSpeed: {
					base: stats.baseOnLevel.moveSpeed,
					bonus: stats.bonus.moveSpeed,
					total: stats.total.moveSpeed,
				},
				tenacity: {
					bonus: stats.bonus.tenacity,
					total: stats.total.tenacity,
					isPercentage: true,
				},
				healShieldPower: {
					total: stats.total.healShieldPower,
					bonus: stats.total.healShieldPower,
					isPercentage: true,
				},
				attackRange: {
					base: stats.baseOnLevel.attackRange,
					bonus: stats.bonus.attackRange,
					total: stats.total.attackRange,
				},
				hpRegen: {
					base: stats.baseOnLevel.hpRegen,
					bonus: stats.bonus.hpRegen,
					total: stats.total.hpRegen,
				},
				manaRegen: {
					base: stats.baseOnLevel.manaRegen,
					bonus: stats.bonus.manaRegen,
					total: stats.total.manaRegen,
				},
			};

			for (const championStat in rv) {
				const stat = rv[championStat as keyof typeof rv];
				stat.formattedTotal = formatChampionStatValue(stat.isPercentage ? 100 : 1, stat, 'total');
			}

			return rv as Record<IChampionStatName, IComputedDamageSourceChampionStat>;
		}),
		items: computed<(IComputedDamageSourceItem | undefined)[]>(() => this.items.value.map((item): IComputedDamageSourceItem | undefined => {
			if (!item) {
				return undefined;
			}

			const text = useText();
			const { minorVersion } = usePatchVersion();

			return {
				itemId: item.id,
				descriptionContents: computedItemDescription(text, minorVersion, item, this),
			};
		}),
		),
		abilities: computed<Record<IChampionAbilityKey, IComputedAbilityDescription[]>>(() => {
			const { minorVersion } = usePatchVersion();

			return Object.fromEntries(Object.keys(this.abilityVariants.value).map((key): [IChampionAbilityKey, IComputedAbilityDescription[]] => {
				const ability = this.champion.value?.abilities[key as IChampionAbilityKey];
				return [key as IChampionAbilityKey, ability?.variants.map((_, variantIndex) => computedAbilityDescription(
					minorVersion,
					this.champion.value!,
					key as IChampionAbilityKey,
					variantIndex,
					(this.abilityLevels.value as any)[key],
					this,
				)) || []];
			})) as Record<IChampionAbilityKey, IComputedAbilityDescription[]>;
		}),
	};
}

function cleanupItems(items: (IItem | undefined)[]): void {
	const filledSlots = items.slice(0, 6).filter(Boolean);
	for (let i = 0; i < 6; i++) {
		items[i] = filledSlots[i];
	}
}

type IInternalDataSetupChampions = {
	[K in keyof typeof CHAMPION_SPECIFICS]: (typeof CHAMPION_SPECIFICS)[K] extends { setupInternalData: (...args: any) => any }
		? K
		: never;
}[keyof typeof CHAMPION_SPECIFICS];

export interface IComputedDamageSourceChampionStat {
	decimal?: number;
	isPercentage?: boolean;
	base?: number;
	bonus?: number;
	total: number;
	formattedTotal: string | number;
}

export function formatChampionStatValue(
	multiplier: number,
	value: Pick<IComputedDamageSourceChampionStat, 'base' | 'bonus' | 'total' | 'decimal'>,
	key: 'total' | 'base' | 'bonus',
) {
	return value.decimal
		? roundVariable(value[key] as number * multiplier, value.decimal)
		: Math.round(value[key] as number * multiplier);
}

export interface IComputedDamageSourceItem {
	itemId: string;
	descriptionContents: IComputedItemDescription;
}

// TODO maybe try to include all stuff <itemdescription> uses so it doesn't need additional props when it's passed
export interface IComputedItemDescription {
	subtitleLeft?: string;
	subtitleRight?: string;
	stats: [iconName: string, value: number, name: string][];
	extra?: string[][];
	variables: ReturnType<typeof replaceGameDescriptionVariables>['variables'];
	unknownVariables: ReturnType<typeof replaceGameDescriptionVariables>['unknownVariables'];
	anyUnknownExtraVariables?: boolean;
}

export function computedItemDescription(
	text: ITextData,
	minorVersion: string,
	item?: IItem,
	damageSource?: DamageSource<any>,
	replaceOptions?: Parameters<typeof replaceGameDescriptionVariables>[3],
): IComputedItemDescription {
	const variables: IComputedItemDescription['variables'] = new Map();
	const unknownVariables: IComputedItemDescription['unknownVariables'] = [];

	if (!item) {
		return {
			stats: [],
			variables,
			unknownVariables,
		};
	}

	const cooldownIcon = `<img src="https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png" width="20" height="20" aria-hidden="true">`;
	const onHitIcon = `<img src="https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON_NAMES.OnHit}.png" width="20" height="20" aria-hidden="true">`;

	const { subtitleLeft = '', subtitleRight = '', extra = [] } = text.items[item.id]?.tooltipShop || {};
	const stats = Object.entries(item.stats)
		.filter(([statName]) => (statName as IItemStat) !== 'FlatHPRegenMod')
		.sort((a, b) => ITEM_STAT_META[b[0] as IItemStat].order - ITEM_STAT_META[a[0] as IItemStat].order)
		.map(([statName, value]) => {
			const { name, displayMultiplier, isPercentage } = ITEM_STAT_META[statName as IItemStat];
			return [
				STAT_ICON_NAMES[statName as IItemStat],
				displayMultiplier ? Math.round(value * displayMultiplier) : isPercentage ? `${Math.round(value * 100)}%` : value,
				name,
			] as [string, number, string];
		});

	let anyUnknownExtraVariables = false;
	const extraFormatted = extra?.map(([heading, ...paragraphs]) => {
		const { variables: headingVariables, replaced: replacedHeading, unknownVariables: headingUnknown } = replaceGameDescriptionVariables(
			heading!
				.replace(/\{\{ ?Item_Cooldown ?\}\}/g, () => {
					const { value } = itemVariableValue('Cooldown', item, damageSource?.itemDamageCalculationTarget.value);
					anyUnknownExtraVariables ||= !value;
					return `${cooldownIcon}(${value || '<unknown>UNKNOWN</unknown>'}s<span> cooldown</span>)`;
				})
				.replace('(', '<span>(')
				.replace(')', ')</span>'),
			'item',
			[item, damageSource?.itemDamageCalculationTarget.value],
			replaceOptions,
		);

		anyUnknownExtraVariables ||= !!headingUnknown.length;
		unknownVariables.push(...headingUnknown);
		mergeMaps(variables, headingVariables);

		return [
			replaceGameDescriptionIcons(replacedHeading),
			...paragraphs.map((paragraph) => {
				const { variables: paragraphVariables, replaced: replacedParagraph, unknownVariables: paragraphUnknown } = replaceGameDescriptionVariables(
					paragraph!,
					'item',
					[item, damageSource?.itemDamageCalculationTarget.value],
					replaceOptions,
				);

				anyUnknownExtraVariables ||= !!paragraphUnknown.length;
				unknownVariables.push(...paragraphUnknown);
				mergeMaps(variables, paragraphVariables);

				return replaceGameDescriptionIcons(replacedParagraph, onHitIcon);
			},
			),
		];
	});

	return {
		variables,
		unknownVariables,
		anyUnknownExtraVariables,
		subtitleLeft,
		subtitleRight,
		stats,
		extra: extraFormatted,
	};
}

function mergeMaps<T, U>(map1: Map<T, U>, map2: Map<T, U>) {
	for (const [variableKey, variableValue] of map2.entries()) {
		map1.set(variableKey, variableValue);
	}
}

export function allChampionAbilityVariants(champion?: IChampion) {
	return champion ? Object.values(champion.abilities).flatMap(ability => ability.variants) : [];
}

// TODO maybe try to include all stuff <lolchampionabilityhovertooltip> uses so it doesn't need additional props when it's passed
export interface IComputedAbilityDescription {
	name: string;
	tooltip: string;
	tooltipExtended: string;
	tooltipExtendedBelowLine: string;
	anyUnknownVariables: number;
	cooldown?: number;
	cost?: number;
	extendedVariables?: {
		name: string;
		values?: (string | number)[];
		isNameUnknown?: boolean;
	}[];
	variables: IReplaceGameDescriptionVariablesRV['variables'];
	unknownVariables: IReplaceGameDescriptionVariablesRV['unknownVariables'];
	variant: IChampionAbilityVariant;
}

export function computedAbilityDescription(
	minorVersion: string,
	champion: IChampion,
	abilityKey: IChampionAbilityKey,
	abilityVariant: number,
	abilityLevel?: number,
	_damageSource?: DamageSource<any>,
	replaceOptions?: Parameters<typeof replaceGameDescriptionVariables>[3],
): IComputedAbilityDescription {
	const onHitIcon = `<img src="https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON_NAMES.OnHit}.png" width="20" height="20" aria-hidden="true">`;

	abilityLevel = abilityKey !== 'passive' ? abilityLevel || 1 : undefined;
	const ability = champion.abilities[abilityKey];
	const variant = ability.variants[abilityVariant]!;
	const allVariants = allChampionAbilityVariants(champion);

	const { replaced: nameReplaced, unknownStringtableVariables: nameUnknownSV } = replaceGameDescriptionStringtableVariables(
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
		onHitIcon,
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
		onHitIcon,
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
		onHitIcon,
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

		name ||= variable.type;

		return {
			name,
			values: (tooltipVariablesAV.get(variable.type) || tooltipExtendedVariablesAV.get(variable.type))?.slice(1, lastExtendedVariableIndex),
			isNameUnknown,
		};
	});

	if (champion.id !== 'TargetDummy' && cooldown) {
		extendedVariables ||= [];
		extendedVariables.push({
			name: 'Cooldown',
			values: variant.cooldownTime!.slice(1, lastExtendedVariableIndex),
		});
	}

	// TODO detect unknown cost/cooldown
	const anyUnknownVariables = nameUnknownSV.size || tooltipUnknownSV.size || tooltipUnknownV.length || tooltipExtendedUnknownSV.size || tooltipExtendedUnknownV.length || tooltipExtendedBelowLineUnknownSV.size || tooltipExtendedBelowLineUnknownV.length;

	return {
		name: nameReplaced,
		tooltip: tooltipReplaced,
		tooltipExtended: tooltipExtendedReplaced,
		tooltipExtendedBelowLine: tooltipExtendedBelowLineReplaced,
		anyUnknownVariables,
		cooldown,
		cost,
		extendedVariables,
		variables,
		unknownVariables,
		variant,
	};
}

function abilityVariantText(
	onHitIcon: string,
	allAbilityVariants: IChampionAbilityVariant[],
	value: string,
	variant: IChampionAbilityVariant,
	level?: number,
	stringtable?: Record<string, string>,
	replaceVariablesWithNames?: boolean,
) {
	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceGameDescriptionStringtableVariables(
		value,
		stringtable,
	);

	const { replaced, unknownVariables, variablesAllValues, variables } = replaceGameDescriptionVariables(
		stringtableReplaced,
		'championAbility',
		[variant, level, allAbilityVariants],
		{ replaceWithName: replaceVariablesWithNames },
	);

	return {
		replaced: replaceGameDescriptionIcons(replaced, onHitIcon),
		unknownSV: unknownStringtableVariables,
		unknownV: unknownVariables,
		variablesAllValues,
		variables,
	};
}

function objectKeyIndex<T extends object>(key: keyof T | undefined, object: T): string | number {
	return key ? Object.keys(object).indexOf(key as string) : '';
}

function parseStringifiedRunePathSlots(data: string): ([slotIndex: number, slotOptionIndex: number] | undefined)[] {
	return data.split('-').map((value): [slotIndex: number, slotOptionIndex: number] | undefined => {
		const rawSlotIndex = value[0];
		const rawOptionIndex = value[1];
		if (!rawSlotIndex || !rawOptionIndex) {
			return undefined;
		}

		const parsedSlotIndex = Number.parseInt(rawSlotIndex);
		const parsedOptionIndex = Number.parseInt(rawOptionIndex);

		if (Number.isNaN(parsedSlotIndex) || Number.isNaN(parsedOptionIndex)) {
			return undefined;
		}

		return [parsedSlotIndex, parsedOptionIndex];
	});
}
