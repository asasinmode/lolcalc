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

export class DamageSource<Id extends IChampionId | undefined = undefined> {
	id: string;
	color: string;
	listedChampion: ShallowRef<IListedChampion | undefined>;
	champion: ShallowRef<IChampion | undefined>;
	level: Ref<number>;

	isRanged = computed(() => this.champion.value && ((this.champion.value.stats.attackrange || 0) > 325));
	stats = computed(() => calculateChampionStats(this));
	itemDamageCalculationTarget = computed<IItemVariableCalculationTarget>(() => ({
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

	abilityLevels: Ref<Record<Exclude<IChampionAbilityKey, 'passive'>, number>>;
	abilityVariants: Ref<Record<IChampionAbilityKey, number>>;
	// TODO unused
	allAbilityVariants = computed(() => allChampionAbilityVariants(this.champion.value));

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

	constructor(overrides: Partial<Omit<IOverrides<Id>, 'champion'>> & {
		champion?: { id: Id } & IListedChampion;
	} = {}) {
		const counter = useState<number>('damageSourceCounter', () => 0);
		/* + 1 because it's a nicer color */
		const hue = ((counter.value++ + 1) * 137.508) % 360;
		this.color = `oklch(0.7 0.15 ${hue.toFixed(4)})`;

		this.id = counter.value.toString();
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
		this.dragonStacks = ref(overrides.dragonStacks ?? Array.from({ length: 4 }));
		this.dragonSoul = ref(overrides.dragonSoul);
		this.roleQuest = ref(overrides.roleQuest);
		/* expected to be overriden by freshly setup data in `this.champion` watch below */
		this.internalData = ref<any>(overrides.internalData ?? {});

		this.watchHandles = [
			watch(this.listedChampion, async (c) => {
				this.champion.value = undefined;
				this.abilityLevels.value = { q: 0, w: 0, e: 0, r: 0 };
				this.abilityVariants.value = { passive: 0, q: 0, w: 0, e: 0, r: 0 };

				const champion = c && await useChampion(c.id);
				if (this.listedChampion.value?.id === champion?.id) {
					this.champion.value = champion;
				}
			}, { immediate: true }),

			watch(this.champion, () => {
				this.internalData.value = (this.champion.value?.id && (CHAMPION_SPECIFICS as any)[this.champion.value?.id]?.setupInternalData?.(this)) || {};
				this.currentHealth.value = this.stats.value?.stats.total.hp || 0;
				this.currentAbilityResource.value = this.stats.value?.stats.total.mana || 0;
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
		];
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
		mergeMapsWithWarnDuplicate(variables, headingVariables, `[computedItemDescription] item ${item.id}`);

		return [
			replaceGameDescriptionIcons(replacedHeading),
			...paragraphs.map((paragraph) => {
				const { variables: paragraphVariables, replaced: replacedParagraph, unknownVariables: paragraphUnknown } = replaceGameDescriptionVariables(
					paragraph!.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${onHitIcon} <onhit>On-Hit</onhit>`),
					'item',
					[item, damageSource?.itemDamageCalculationTarget.value],
					replaceOptions,
				);

				anyUnknownExtraVariables ||= !!paragraphUnknown.length;
				unknownVariables.push(...paragraphUnknown);
				mergeMapsWithWarnDuplicate(variables, paragraphVariables, `[computedItemDescription] item ${item.id}`);

				return replaceGameDescriptionIcons(replacedParagraph);
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

function mergeMapsWithWarnDuplicate<T, U>(map1: Map<T, U>, map2: Map<T, U>, warnPrefix: string) {
	for (const [variableKey, variableValue] of map2.entries()) {
		if (map1.has(variableKey)) {
			console.warn(`${warnPrefix} variable "${variableKey}" resolves multiple times`);
		}
		map1.set(variableKey, variableValue);
	}
}

export function allChampionAbilityVariants(champion?: IChampion) {
	return champion ? Object.values(champion.abilities).flatMap(ability => ability.variants) : [];
}
