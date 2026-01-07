export class DamageSource {
	champion: Ref<IChampion | undefined>;
	level: Ref<number>;
	items: Ref<IItem[]>;
	runes: Ref<IChampionRunes>;

	isRanged = computed(() => this.champion.value && ((this.champion.value.stats.attackrange || 0) > 325));
	stats = computed(() => this.champion.value && calculateChampionStats(this));

	constructor() {
		this.champion = ref();
		this.level = ref(1);
		this.items = ref([]);
		this.runes = ref<IChampionRunes>({
			shards: {
				offensive: 'adaptiveForce',
				flex: 'adaptiveForce',
				defensive: 'flatHealth',
			},
		});
	}
}
