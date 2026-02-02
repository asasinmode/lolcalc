import type { ShallowRef, UnwrapRef } from 'vue';

type IDamageSource = InstanceType<typeof DamageSource>;

interface IOverrides {
	champion: UnwrapRef<IDamageSource['champion']>;
	level: UnwrapRef<IDamageSource['level']>;
	items: UnwrapRef<IDamageSource['items']>;
	runes: UnwrapRef<IDamageSource['runes']>;
}

export class DamageSource {
	id: string;
	champion: ShallowRef<IChampion | undefined>;
	level: Ref<number>;
	items: Ref<IItem[]>;
	runes: Ref<IChampionRunes>;

	currentHealth: Ref<number>;
	currentAbilityResource: Ref<number>;

	isRanged = computed(() => this.champion.value && ((this.champion.value.stats.attackrange || 0) > 325));
	stats = computed(() => this.champion.value && calculateChampionStats(this));
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
		return Boolean(this.champion.value || this.items.value.length || !this.runePathsEmpty.value);
	});

	abilityResourceName = computed(() => this.champion.value ? (this.champion.value?.partype || '<unknown>') : 'mana');
	maxAbilityResource = computed(() => this.champion.value?.partype === 'mana' ? this.stats.value?.stats.total.mana : 0);

	constructor(id: string = crypto.randomUUID(), overrides: Partial<IOverrides> = {}) {
		this.id = id;
		this.champion = shallowRef(overrides.champion);
		this.level = ref(overrides.level ?? 1);
		this.items = ref(overrides.items ? structuredClone(toRaw(overrides.items)) : []);
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
		this.currentHealth = ref(this.stats.value?.stats.total.hp || 0);
		this.currentAbilityResource = ref(this.stats.value?.stats.total.mana || 0);
	}

	clone(id?: string, overrides: Partial<IOverrides> = {}) {
		return new DamageSource(id, {
			champion: this.champion.value,
			level: this.level.value,
			items: this.items.value,
			runes: this.runes.value,
			...overrides,
		});
	}
}
