import type { ShallowRef, UnwrapRef } from 'vue';

type IDamageSource = InstanceType<typeof DamageSource>;

interface IOverrides {
	champion: UnwrapRef<IDamageSource['listedChampion']>;
	level: UnwrapRef<IDamageSource['level']>;
	items: UnwrapRef<IDamageSource['items']>;
	runes: UnwrapRef<IDamageSource['runes']>;
	abilityLevels: Partial<UnwrapRef<IDamageSource['abilityLevels']>>;
	abilityVariants: Partial<UnwrapRef<IDamageSource['abilityVariants']>>;
	currentHealth: UnwrapRef<IDamageSource['currentHealth']>;
	currentAbilityResource: UnwrapRef<IDamageSource['currentAbilityResource']>;
}

export class DamageSource {
	id: string;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;
	level: Ref<number>;
	items: Ref<IItem[]>;
	runes: Ref<IChampionRunes>;
	abilityLevels: Ref<Record<Exclude<keyof IChampion['abilities'], 'passive'>, number>>;
	abilityVariants: Ref<Record<keyof IChampion['abilities'], number>>;

	currentHealth: Ref<number>;
	currentAbilityResource: Ref<number>;

	isRanged = computed(() => this.champion.value && ((this.champion.value.stats.attackrange || 0) > 325));
	stats = computed(() => calculateChampionStats(this));
	itemDamageCalculationTarget = computed((): IGameVariableCalculationTarget => ({
		isRanged: this.isRanged.value,
		stats: this.stats.value?.stats.total,
	}));

	runePathsEmpty = computed(() => {
		const { primarySlots, secondary, secondarySlots } = this.runes.value.paths;
		return !(primarySlots.length || secondary || secondarySlots.length);
	});

	runesInvalid = computed(() => {
		const { primarySlots, secondary, secondarySlots } = this.runes.value.paths;
		return !this.runePathsEmpty.value && !(secondary && primarySlots.length === 4 && secondarySlots.length === 2);
	});

	anythingFilled = computed(() => {
		return Boolean(this.listedChampion.value || this.items.value.length || !this.runePathsEmpty.value);
	});

	abilityResourceName = computed(() => this.champion.value ? (this.champion.value?.partype || '<unknown>') : 'mana');
	maxAbilityResource = computed(() => Math.round(this.champion.value?.partype === 'Mana' ? this.stats.value?.stats.total.mana! : 0));

	inventoryFull = computed(() => {
		return this.items.value.length === 6;
	});

	constructor(id: string = crypto.randomUUID(), overrides: Partial<IOverrides> = {}) {
		this.id = id;
		this.listedChampion = shallowRef(overrides.champion);
		this.champion = shallowRef();
		this.level = ref(overrides.level ?? 1);
		this.items = ref(overrides.items ? [...toRaw(overrides.items)] : []);
		this.runes = ref<IChampionRunes>(overrides.runes
			? structuredClone(toRaw(overrides.runes))
			: {
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
		this.currentHealth = ref(overrides.currentHealth ?? (this.stats.value?.stats.total.hp || 0));
		this.currentAbilityResource = ref(overrides.currentAbilityResource ?? (this.stats.value?.stats.total.mana || 0));
		this.abilityLevels = ref({ q: 0, w: 0, e: 0, r: 0, ...(overrides.abilityLevels || {}) });
		this.abilityVariants = ref({ passive: 0, q: 0, w: 0, e: 0, r: 0, ...(overrides.abilityVariants || {}) });

		watch(this.listedChampion, async (c) => {
			this.champion.value = undefined;
			if (c) {
				this.champion.value = await useChampion(c.id);
			}
		}, { immediate: true });

		watch(this.champion, () => {
			this.currentHealth.value = this.stats.value?.stats.total.hp || 0;
			this.currentAbilityResource.value = this.stats.value?.stats.total.mana || 0;
		}, { flush: 'post' });

		watch(() => [this.stats.value?.stats.total.hp, this.stats.value?.stats.total.mana], () => {
			this.currentHealth.value = Math.min(this.currentHealth.value, this.stats.value?.stats.total.hp || 0);
			this.currentAbilityResource.value = Math.min(this.currentAbilityResource.value, this.stats.value?.stats.total.mana || 0);
		}, { flush: 'post' });
	}

	clone(id?: string, overrides: Partial<IOverrides> = {}) {
		return new DamageSource(id, {
			champion: this.listedChampion.value,
			level: this.level.value,
			items: this.items.value,
			runes: this.runes.value,
			currentHealth: this.currentHealth.value,
			currentAbilityResource: this.currentAbilityResource.value,
			abilityLevels: structuredClone(toRaw(this.abilityLevels.value)),
			abilityVariants: structuredClone(toRaw(this.abilityVariants.value)),
			...overrides,
		});
	}
}
