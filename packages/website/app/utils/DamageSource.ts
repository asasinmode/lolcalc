import type { ShallowRef, UnwrapRef } from 'vue';

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

export class DamageSource<Id extends IChampionId | undefined = undefined> {
	id: string;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;
	level: Ref<number>;

	isRanged = computed(() => this.champion.value && ((this.champion.value.stats.attackrange || 0) > 325));
	stats = computed(() => calculateChampionStats(this));
	itemDamageCalculationTarget = computed((): IItemVariableCalculationTarget => ({
		isRanged: this.isRanged.value,
		stats: this.stats.value?.stats.total,
	}));

	runes: Ref<IChampionRunes>;
	runePathsEmpty = computed(() => {
		const { primarySlots, secondary, secondarySlots } = this.runes.value.paths;
		return !(primarySlots.length || secondary || secondarySlots.length);
	});
	runesInvalid = computed(() => {
		const { primarySlots, secondary, secondarySlots } = this.runes.value.paths;
		return !this.runePathsEmpty.value && !(secondary && primarySlots.length === 4 && secondarySlots.length === 2);
	});

	currentHealth: Ref<number>;
	currentAbilityResource: Ref<number>;
	abilityResourceName = computed(() => this.champion.value ? (this.champion.value?.partype || '<unknown>') : 'mana');
	maxAbilityResource = computed(() => Math.round(this.champion.value?.partype === 'Mana' ? this.stats.value?.stats.total.mana! : 0));

	items: Ref<(IItem | undefined)[]>;
	// TODO probably can remove
	inventoryFull = computed(() => this.items.value.slice(0, 6).filter(Boolean).length === 6);

	abilityLevels: Ref<Record<Exclude<keyof IChampion['abilities'], 'passive'>, number>>;
	abilityVariants: Ref<Record<keyof IChampion['abilities'], number>>;
	allAbilityVariants = computed(() => this.champion.value ? Object.values(this.champion.value.abilities).flatMap(ability => ability.variants) : []);

	dragonStacks: Ref<(IDragonName | undefined)[]>;
	dragonSoul: Ref<IDragonName | undefined>;
	dragonStacksInvalid = computed(() => {
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
		return counts.filter(c => c[1] >= 2).length > 1;
	});
	dragonSoulInvalid = computed(() => this.dragonSoul.value
		? this.dragonStacks.value.filter(Boolean).length < 4 || (this.dragonStacks.value.filter(stack => stack === this.dragonSoul.value).length < 2)
		: false);

	roleQuest: Ref<IChampionRole | undefined>;

	anythingFilled = computed(() => {
		return Boolean(this.listedChampion.value || this.items.value.length || !this.runePathsEmpty.value || this.dragonStacks.value.some(Boolean) || this.dragonSoul.value || this.roleQuest.value);
	});

	internalData: Ref<Id extends IInternalDataSetupChampions
		? ReturnType<(typeof CHAMPION_SPECIFICS)[Id]['setupInternalData']>
		: undefined>;

	constructor(id: string = crypto.randomUUID(), overrides: Partial<Omit<IOverrides<Id>, 'champion'>> & {
		champion?: { id: Id } & IListedChampion;
	} = {}) {
		this.id = id;
		this.listedChampion = shallowRef(overrides.champion);
		this.champion = shallowRef();
		this.level = ref(overrides.level ?? 1);
		this.items = ref(Array.from({ length: 7 }, (_, i) => overrides.items?.[i]));
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
		this.dragonStacks = ref(overrides.dragonStacks ?? []);
		this.dragonSoul = ref(overrides.dragonSoul);
		this.roleQuest = ref(overrides.roleQuest);
		/* expected to be overriden by freshly setup data in `this.champion` watch below */
		this.internalData = ref<any>(overrides.internalData ?? {});

		watch(this.listedChampion, async (c) => {
			this.champion.value = undefined;
			this.abilityLevels.value = { q: 0, w: 0, e: 0, r: 0 };
			this.abilityVariants.value = { passive: 0, q: 0, w: 0, e: 0, r: 0 };

			const champion = c && await useChampion(c.id);
			if (this.listedChampion.value?.id === champion?.id) {
				this.champion.value = champion;
			}
		}, { immediate: true });

		watch(this.champion, () => {
			this.internalData.value = (this.champion.value?.id && (CHAMPION_SPECIFICS as any)[this.champion.value?.id]?.setupInternalData?.(this)) || {};
			this.currentHealth.value = this.stats.value?.stats.total.hp || 0;
			this.currentAbilityResource.value = this.stats.value?.stats.total.mana || 0;
		}, { flush: 'post' });

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
		}, { flush: 'post' });
	}

	clone(id?: string, overrides: Partial<IOverrides> = {}): DamageSource<Id> {
		return new DamageSource<Id>(id, {
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
			internalData: this.internalData.value,
			...overrides,
		});
	}

	getItemVariableCalculationTarget(): IItemVariableCalculationTarget {
		return {
			isRanged: this.isRanged.value,
			// TODO might be an infinite loop not sure how it's going to work
			stats: this.stats.value.stats.total,
		};
	}

	// TODO role quest handle boots?
	addItem(item: IItem, allItems: Record<string, IItem>, consumeComponents = true): undefined {
		if (consumeComponents) {
			const consumedInventoryIndexes = consumeItemComponents(item.id, this.items.value, allItems);
			for (const index of consumedInventoryIndexes) {
				this.items.value[index] = undefined;
			}
		}

		for (let i = 0; i < 6; i++) {
			if (!this.items.value[i]) {
				this.items.value[i] = markRaw(item);
				break;
			}
		}

		cleanupItems(this.items.value);
	}

	removeItem(index: number): IItem | undefined {
		const item = this.items.value[index];
		if (item) {
			this.items.value[index] = undefined;
			cleanupItems(this.items.value);
			return item;
		}
	}
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
