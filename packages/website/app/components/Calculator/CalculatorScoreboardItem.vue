<script setup lang="ts">
const props = defineProps<{
	index: number;
	value: DamageSource;
	/** side of the scoreboard it's on, left (damage sources) by default */
	isRight?: boolean;
	canRemove?: boolean;
	canMoveDown?: boolean;
}>();

const emit = defineEmits<{
	clear: [];
	remove: [];
	duplicate: [shift: boolean];
	changeGroup: [alt: boolean];
	move: [toIndex: number, alt: boolean];
	startDrag: [event: MouseEvent, duplicate?: boolean];
	itemListDragenter: [event: DragEvent];
	itemListDragover: [event: DragEvent];
	itemListDragleave: [event: DragEvent];
	itemListDrop: [event: DragEvent];
	itemDragstart: [ event: DragEvent, itemIndex: number];
}>();

const runes = useRunes();
const ui = useUi();
const { version, minorVersion } = usePatchVersion();
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelect();
const { selectItems } = useItemShop();
const text = useText();
const globalKeyModifiers = useGlobalKeyModifiers();

const group = computed(() => props.isRight ? 'targets' : 'sources');
const otherGroup = computed(() => props.isRight ? 'sources' : 'targets');
const isLoading = computed(() => Boolean(!props.value.champion.value && props.value.listedChampion.value));

const runePathPrimary = computed(() => {
	const { primary, primarySlots } = props.value.runes.value.paths;
	if (primarySlots[0]) {
		const { icon } = runes.paths[primary].slots[0]![primarySlots[0]]!;
		const { name } = text.runes.slots[primarySlots[0]!]!;
		const { name: pathName } = text.runes.paths[primary]!;
		return {
			icon: `https://raw.communitydragon.org/${minorVersion}/game/${icon}`,
			name,
			pathName,
		};
	}
	return undefined;
});

const runePathSecondary = computed(() => {
	const { secondary } = props.value.runes.value.paths;
	if (secondary) {
		const { iconColor } = runes.paths[secondary]!;
		const { name } = text.runes.paths[secondary]!;
		return {
			icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
			name,
		};
	}
	return undefined;
});

const isFirstAndOnly = computed(() => props.index === 0 && !props.canMoveDown);

function emitClear() {
	emit('clear');
}

function emitRemove() {
	if (globalKeyModifiers.value.shift) {
		emit('clear');
	} else {
		emit('remove');
	}
}

const removeButtonAttrs = computed(() => (isFirstAndOnly.value
	? {
			title: 'clear',
			disabled: !props.value.anythingFilled.value,
			emit: emitClear,
		}
	: {
			title: 'remove, shift+click to clear',
			disabled: !props.canRemove,
			emit: emitRemove,
		}));

const detailsContainer = useTemplateRef('details');

function toggleExpanded() {
	if (detailsContainer.value!.getAttribute('open') === null) {
		detailsContainer.value!.setAttribute('open', '');
	} else {
		detailsContainer.value!.removeAttribute('open');
	}
}

// TMP
onMounted(() => props.index === 0 && props.value && toggleExpanded());

const itemHoverTooltip = useTemplateRef('itemHoverTooltip');
const hoveredItem = shallowRef<IItem>();

function showItemHoverTooltip(event: MouseEvent, item: IItem) {
	itemHoverTooltip.value?.showPopover();
	event.target?.addEventListener('mouseleave', leaveTooltipableElement, { passive: true, once: true });
	hoveredItem.value = item;
}

function leaveTooltipableElement() {
	itemHoverTooltip.value?.hidePopover();
}

function removeItem(event: MouseEvent, index: number) {
	if (props.value.items.value[index]) {
		event.preventDefault();
		// eslint-disable-next-line vue/no-mutating-props
		props.value.items.value.splice(index, 1);
		itemHoverTooltip.value?.hidePopover();
	}
}

function startItemDrag(event: DragEvent, index: number) {
	itemHoverTooltip.value?.hidePopover();
	emit('itemDragstart', event, index);
}

interface IChampionStat {
	name: string;
	iconTextureKey: keyof (typeof ui)['playerStats'];
	description: string;
	values: {
		name: string;
		decimal?: number;
		isPercentage?: boolean;
		base?: number | string;
		bonus: number | string;
		total: number | string;
	}[];
	displayedValue: string;
	bottomText?: string;
}

const minorStats = computed<IChampionStat[]>(() => {
	const { stats } = props.value.stats.value;
	const minorStats = [
		{
			name: 'Health | Resource Regeneration',
			description: 'The amount of <scalehealth>Health</scalehealth> you regenerate over 5 seconds.<br/><br/>The amount of Ability resource you regenerate over 5 seconds (usually <scalemana>Mana</scalemana> or <energy>Energy</energy>).',
			iconTextureKey: 'healthResourceRegen',
			values: [
				{
					name: 'Health Regen',
					base: stats.baseOnLevel.hpRegen,
					bonus: stats.bonus.hpRegen,
					total: stats.total.hpRegen,
				},
				{
					name: 'Resource Regen',
					base: stats.baseOnLevel.manaRegen,
					bonus: stats.bonus.manaRegen,
					total: stats.total.manaRegen,
				},
			],
		},
		{
			name: 'Heal and Shield Power',
			description: 'Increases the effectiveness of <healing>Heals</healing> and <shields>Shields</shields>.',
			iconTextureKey: 'healShieldPower',
			values: [
				{
					name: 'Heal and Shield Power',
					total: stats.total.healShieldPower,
					bonus: stats.total.healShieldPower,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Lethality | Armor Penetration',
			description: 'Ignores an amount of your target\'s <scalearmor>Armor</scalearmor> when applying <physicaldamage>physical damage</physicaldamage>.<br><br><scalelethality>Lethality</scalelethality> ignores a flat amount, <scalelethality>Armor Penetration</scalelethality> ignores a percentage amount',
			iconTextureKey: 'armorPen',
			values: [
				{
					name: 'Lethality',
					bonus: stats.bonus.lethality,
					total: stats.total.lethality,
				},
				{
					name: 'Armor Penetration',
					decimal: 2,
					bonus: stats.bonus.percentArmorPen,
					total: stats.total.percentArmorPen,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Magic Penetration',
			description: 'Ignores an amount of your target\'s <scalemr>Magic Resist</scalemr> when applying <magicdamage>magic damage</magicdamage>.',
			iconTextureKey: 'magicPen',
			values: [
				{
					name: 'Flat Magic Penetration',
					bonus: stats.bonus.flatMagicPen,
					total: stats.total.flatMagicPen,
				},
				{
					name: 'Magic Penetration',
					decimal: 2,
					bonus: stats.bonus.percentMagicPen,
					total: stats.total.percentMagicPen,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Life Steal',
			description: 'Returns a portion of the damage you deal with Attacks as <scalehealth>Health</scalehealth>.',
			iconTextureKey: 'lifeSteal',
			values: [
				{
					name: 'Life Steal',
					bonus: stats.bonus.lifeSteal,
					total: stats.total.lifeSteal,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Omnivamp',
			description: 'Returns a portion of all damage you deal as <scalehealth>Health</scalehealth>.<br><br>Reduced to 20% effectiveness when dealing damage to minions or monsters.',
			iconTextureKey: 'omnivamp',
			values: [
				{
					name: 'Omnivamp',
					bonus: stats.bonus.omnivamp,
					total: stats.total.omnivamp,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Attack Range',
			description: 'The distance at which you can Attack.',
			iconTextureKey: 'attackRange',
			values: [
				{
					name: 'Attack Range',
					base: stats.baseOnLevel.attackRange,
					bonus: stats.bonus.attackRange,
					total: stats.total.attackRange,
				},
			],
		},
		{
			name: 'Tenacity',
			description: 'Reduces the duration of crowd control debuffs, such as <keyword>Slows</keyword> and <keyword>Stuns</keyword>.<br><br>Does not affect <keyword>Airborne</keyword> and <keyword>Suppression</keyword>.',
			iconTextureKey: 'tenacity',
			values: [
				{
					name: 'Tenacity',
					bonus: stats.bonus.tenacity,
					total: stats.total.tenacity,
					isPercentage: true,
				},
			],
		},
	] as IChampionStat[];

	updateComputedStats(minorStats);

	return minorStats;
});

const majorStats = computed<IChampionStat[]>(() => {
	const { stats } = props.value.stats.value;
	const majorStats = [
		{
			name: 'Attack Damage',
			description: 'The amount of <physicaldamage>physical damage</physicaldamage> your Attack deal.<br><br>Also increases the amount of damage you deal with certain Abilities.',
			iconTextureKey: 'attackDamage',
			values: [
				{
					name: 'Attack Damage',
					base: stats.baseOnLevel.attackDamage,
					bonus: stats.bonus.attackDamage,
					total: stats.total.attackDamage,
				},
			],
		},
		{
			name: 'Ability Power',
			description: 'Increases the amount of damage you deal with most Abilities.',
			iconTextureKey: 'abilityPower',
			values: [
				{
					name: 'Ability Power',
					bonus: stats.bonus.abilityPower,
					total: stats.total.abilityPower,
				},
			],
		},
		{
			name: 'Armor',
			description: 'Reduces the amount of <physicaldamage>magic damage</physicaldamage> you take.',
			iconTextureKey: 'armor',
			values: [
				{
					name: 'Armor',
					base: stats.baseOnLevel.armor,
					bonus: stats.bonus.armor,
					total: stats.total.armor,
				},
			],
			bottomText: `You take <span data-total="">${Math.round(calculateResistPercentageReduction(stats.total.magicResist) * 100)}</span>% reduced physical damage.`,
		},
		{
			name: 'Magic Resist',
			description: 'Reduces the amount of <magicdamage>magic damage</magicdamage> you take.',
			iconTextureKey: 'magicResist',
			values: [
				{
					name: 'Magic Resist',
					base: stats.baseOnLevel.magicResist,
					bonus: stats.bonus.magicResist,
					total: stats.total.magicResist,
				},
			],
			bottomText: `You take <span data-total="">${Math.round(calculateResistPercentageReduction(stats.total.magicResist) * 100)}</span>% reduced magic damage.`,
		},
		{
			name: 'Attack Speed',
			description: 'Increases the rate at which you can Attack.<br><br>Ratio determines the effectiveness of bonus Attack Speed.',
			iconTextureKey: 'attackSpeed',
			values: [
				{
					name: 'Bonus Attack Speed',
					bonus: stats.bonus.bonusAttackSpeedPercent,
					total: stats.total.bonusAttackSpeedPercent,
					isPercentage: true,
					decimal: 5,
				},
				{
					name: 'Attacks per second',
					total: stats.total.attackSpeed,
					decimal: 3,
				},
				{
					name: 'Ratio',
					total: stats.total.attackSpeedRatio,
					decimal: 3,
				},
			],
			displayedValue: stats.total.attackSpeed.toFixed(2),
		},
		{
			name: 'Ability Haste',
			description: 'Allows you to cast your Abilities more often',
			iconTextureKey: 'abilityHaste',
			values: [
				{
					name: 'Current Ability Haste',
					bonus: stats.bonus.abilityHaste,
					total: stats.total.abilityHaste,
				},
			],
			bottomText: `Equivalent to reducing your Ability cooldowns by <span data-total="">${Math.round(cooldownReductionPercentageFromHaste(stats.total.abilityHaste))}</span>%`,
		},
		{
			name: 'Critical Strike Chance',
			description: 'Grants a change to deal 100% increased damage on each Attack.',
			iconTextureKey: 'crit',
			values: [
				{
					name: 'Critical Strike Chance',
					bonus: stats.bonus.critChance,
					total: stats.total.critChance,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Move Speed',
			description: 'The speed at which you travel.',
			iconTextureKey: 'moveSpeed',
			values: [
				{
					name: 'Move Speed',
					base: stats.baseOnLevel.moveSpeed,
					bonus: stats.bonus.moveSpeed,
					total: stats.total.moveSpeed,
				},
			],
		},
	] as IChampionStat[];

	updateComputedStats(majorStats);

	return majorStats;
});

function updateComputedStats(stats: IChampionStat[]) {
	for (const stat of stats) {
		const displayedValue: string[] = [];

		for (let i = 0; i <= stat.values.length - 1; i++) {
			const value = stat.values[i]!;
			const multiplier = value.isPercentage ? 100 : 1;

			displayedValue.push(`${formatStatValue(multiplier, value, 'total')}${value.isPercentage ? '%' : ''}`);

			value.total = formatStatValue(multiplier, value, 'total');

			if (value.bonus) {
				value.bonus = formatStatValue(multiplier, value, 'bonus');
			}

			if ('base' in value) {
				value.base = formatStatValue(multiplier, value, 'base');
			}
		}

		stat.displayedValue ||= displayedValue.join(' | ');
	}
}

function formatStatValue(multiplier: number, value: IChampionStat['values'][number], key: 'total' | 'base' | 'bonus') {
	return value.decimal
		? roundVariable(value[key] as number * multiplier, value.decimal)
		: Math.round(value[key] as number * multiplier);
}

const hoveredStat = shallowRef<IChampionStat>();
const hoveredStatTooltip = useTemplateRef('championStatTooltip');

function showStatTooltip(event: MouseEvent, stat: IChampionStat) {
	hoveredStat.value = stat;
	// @ts-expect-error source is ok
	hoveredStatTooltip.value?.showPopover({ source: event.target });
}

function hideStatTooltip() {
	hoveredStatTooltip.value?.hidePopover();
}

const maxHealth = computed(() => Math.round(props.value.stats.value?.stats.total.hp || 1));

const updateChampionHealth = useNumberInput(props.value.currentHealth, true, maxHealth);
const updateChampionAbilityResource = useNumberInput(props.value.currentAbilityResource, true, props.value.maxAbilityResource);

const healthBarEl = useTemplateRef('healthBar');
const { onMousedown: startHealthBarDrag, cleanup: healthBarCleanup } = healthResourceSliderEvents(props.value.currentHealth, maxHealth, healthBarEl);
const resourceBarEl = useTemplateRef('resourceBar');
const { onMousedown: startAbilityResourceBarDrag, cleanup: abilityResourceBarCleanup } = healthResourceSliderEvents(props.value.currentAbilityResource, props.value.maxAbilityResource, resourceBarEl);

function healthResourceSliderEvents(target: Ref<number>, max: Ref<number>, element: Ref<HTMLElement | null>) {
	function onMousedown(event: MouseEvent) {
		if (!max.value || event.button !== 0 || event.target !== element.value) {
			return;
		}
		document.addEventListener('mousemove', onMousemove);
		document.addEventListener('mouseup', onMouseup);
		updateValue(event.clientX);
		event.preventDefault();
	}

	function onMousemove(event: MouseEvent) {
		updateValue(event.clientX);
	}

	function onMouseup(event: MouseEvent) {
		updateValue(event.clientX);
		cleanup();
	}

	function cleanup() {
		document.removeEventListener('mousemove', onMousemove);
		document.removeEventListener('mouseup', onMouseup);
	}

	function updateValue(mousePosition: number) {
		const { left, right } = element.value!.getBoundingClientRect();
		mousePosition = Math.max(left, Math.min(right, mousePosition));
		const fillPercentage = (mousePosition - left) / (right - left);
		target.value = Math.max(0, Math.min(max.value, Math.round(fillPercentage * max.value)));
	}

	return { onMousedown, cleanup };
}

function resetAbilityLevel(event: MouseEvent, ability: Exclude<keyof IChampion['abilities'], 'passive'>) {
	event.preventDefault();
	// eslint-disable-next-line vue/no-mutating-props
	props.value.abilityLevels.value[ability] = 0;
}

const hoveredAbility = ref<keyof IChampion['abilities']>();
const hoveredAbilityVariant = shallowRef<IChampionAbility['variants'][number]>();
const hoveredAbilityTooltip = useTemplateRef('championAbilityHoverTooltip');

const hoveredAbilityTooltipText = computed(() => {
	if (!hoveredAbilityVariant.value) {
		return undefined;
	}

	const abilityLevel = hoveredAbility.value && hoveredAbility.value !== 'passive' ? props.value.abilityLevels.value[hoveredAbility.value] : undefined;

	const { replaced: nameReplaced, unknownStringtableVariables: nameUnknownSV } = replaceGameDescriptionStringtableVariables(
		hoveredAbilityVariant.value.name || '<unknown>UNKNOWN</unknown>',
		props.value.champion.value?.stringtable,
	);

	const { replaced: tooltipReplaced, unknownSV: tooltipUnknownSV, unknownV: tooltipUnknownV } = abilityText(
		hoveredAbilityVariant.value.tooltip || '<unknown>UNKNOWN</unknown>',
		hoveredAbilityVariant.value,
		props.value.champion.value?.stringtable,
		abilityLevel,
	);
	const { replaced: tooltipExtendedReplaced, unknownSV: tooltipExtendedUnknownSV, unknownV: tooltipExtendedUnknownV } = abilityText(
		hoveredAbilityVariant.value.tooltipExtended || '',
		hoveredAbilityVariant.value,
		props.value.champion.value?.stringtable,
		abilityLevel,
	);
	const { replaced: tooltipExtendedBelowLineReplaced, unknownSV: tooltipExtendedBelowLineUnknownSV, unknownV: tooltipExtendedBelowLineUnknownV } = abilityText(
		hoveredAbilityVariant.value.tooltipExtendedBelowLine || '',
		hoveredAbilityVariant.value,
		props.value.champion.value?.stringtable,
		abilityLevel,
	);

	const cooldown = hoveredAbilityVariant.value.cooldownTime?.[abilityLevel ?? 1];
	const cost = hoveredAbilityVariant.value.mana?.[abilityLevel ?? 1];

	// TODO
	const extendedVariableInfo: [string, number[]][] = [
		['Cooldown', [1, 2, 3, 4, 5]],
		['Another', [1, 2, 3, 4, 5]],
		['More', [1, 2, 3, 4, 5]],
	];

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
		extendedVariableInfo,
	};
});

function abilityText(value: string, variant: IChampionAbility['variants'][number], stringtable?: Record<string, string>, level?: number) {
	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceGameDescriptionStringtableVariables(
		value,
		stringtable,
	);

	const { replaced, unknownVariables } = replaceGameDescriptionVariables(
		stringtableReplaced,
		'championAbility',
		[variant, level],
	);

	return { replaced, unknownSV: unknownStringtableVariables, unknownV: unknownVariables };
}

function showAbilityTooltip(event: MouseEvent, ability: keyof IChampion['abilities']) {
	if (props.value.champion.value) {
		hoveredAbility.value = ability;
		hoveredAbilityVariant.value = props.value.champion.value.abilities[ability].variants[0];
		event.target?.addEventListener('mouseleave', hideAbilityTooltip, { passive: true, once: true });
		hoveredAbilityTooltip.value?.showPopover();
	}
}

function hideAbilityTooltip() {
	hoveredAbilityTooltip.value?.hidePopover();
}

const el = useTemplateRef('el');

onBeforeUnmount(() => {
	healthBarCleanup();
	abilityResourceBarCleanup();
});

defineExpose({ el });
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<li ref="el" data-scoreboard-item="">
		<h3 class="sr-only">
			{{ group.slice(0, -1) }} {{ index + 1 }}{{ value.listedChampion.value ? ` (${value.listedChampion.value.name})` : '' }}
		</h3>
		<button
			title="move up, alt+click to duplicate above"
			class="pretend-ui-button"
			:disabled="index === 0"
			@click="$emit('move', index + (globalKeyModifiers.alt ? 0 : -1), globalKeyModifiers.alt)"
			@mousedown.left="$emit('startDrag', $event)"
		>
			<span class="sr-only">move up, alt+click to duplicate above</span>
			<Icon class="i-ph:arrow-up" />
		</button>
		<button
			title="move down, alt+click to duplicate below"
			class="pretend-ui-button"
			:disabled="!canMoveDown"
			@click="$emit('move', index + 1, globalKeyModifiers.alt)"
			@mousedown.left="$emit('startDrag', $event)"
		>
			<span class="sr-only">move down, alt+click to duplicate below</span>
			<Icon class="i-ph:arrow-down" />
		</button>
		<button
			:title="`move to ${otherGroup}, alt+click to duplicate into ${otherGroup}`"
			class="pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="$emit('changeGroup', globalKeyModifiers.alt)"
			@mousedown.left="$emit('startDrag', $event)"
		>
			<span class="sr-only">move to {{ otherGroup }}, alt+click to duplicate into {{ otherGroup }}</span>
			<Icon :class="isRight ? 'i-ph:arrow-left' : 'i-ph:arrow-right'" />
		</button>
		<button
			:title="`duplicate, shift+click to duplicate into ${otherGroup}`"
			class="pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="$emit('duplicate', globalKeyModifiers.shift)"
			@mousedown.left="$emit('startDrag', $event, true)"
		>
			<span class="sr-only">duplicate, shift+click to duplicate into {{ otherGroup }}</span>
			<Icon class="i-ph:copy" />
		</button>
		<div data-select-champion="">
			<button
				title="select champion"
				@click="selectChampion(value.listedChampion)"
			>
				<span class="sr-only">
					{{ value.listedChampion.value ? `selected champion: ${value.listedChampion.value.name}` : 'select champion' }}
				</span>
				<img
					v-if="value.listedChampion.value"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${value.listedChampion.value.image}`"
					loading="lazy"
					width="128"
					height="128"
					style="--focus-brightness: 1.2"
				>
				<img
					v-else
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
					width="256"
					height="256"
					style="--focus-brightness: 1.5"
				>
			</button>
			<label :for="`${group}-${index}-level-select`" class="sr-only">Level</label>
			<select :id="`${group}-${index}-level-select`" v-model="value.level.value" data-select-champion-level="">
				<option v-for="i in 18" :key="i" :value="i">
					{{ i }}
				</option>
			</select>
		</div>
		<button title="runes" data-select-runes="" @click="selectRunes(value.runes)">
			<span class="sr-only">{{ value.runePathsEmpty ? 'select runes' : 'runes' }}</span>
			<span v-show="value.runesInvalid.value" class="text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -end-0.5 -top-0.5">
				<span class="sr-only">(invalid)</span>
				<Icon class="i-ph:exclamation-mark-bold size-2.5" />
			</span>
			<template v-if="runePathPrimary">
				<span class="sr-only">
					primary: {{ runePathPrimary.pathName }} - {{ runePathPrimary.name }}
				</span>
				<img
					:src="runePathPrimary.icon"
					aria-hidden="true"
					width="32"
					height="32"
					loading="lazy"
					data-primary-path-keystone=""
					class="size-5.5"
				>
			</template>
			<img
				v-else
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
				aria-hidden="true"
				width="32"
				height="32"
				loading="lazy"
				class="size-5"
			>
			<template v-if="runePathSecondary">
				<span class="sr-only">
					secondary: {{ runePathSecondary.name }}
				</span>
				<span
					:style="`background-color: ${runePathSecondary.iconColor}; mask: url(${runePathSecondary.icon}) no-repeat center;`"
					aria-hidden="true"
					data-secondary-path-icon=""
				/>
			</template>
		</button>
		<button
			data-select-items=""
			@click="selectItems(value.items, value.itemDamageCalculationTarget.value)"
		>
			items
			<img
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`"
				width="32"
				height="28"
				aria-hidden="true"
				loading="lazy"
				class="w-4"
			>
		</button>
		<ul
			@dragenter="$emit('itemListDragenter', $event)"
			@dragover="$emit('itemListDragover', $event)"
			@dragleave="$emit('itemListDragleave', $event)"
			@drop="$emit('itemListDrop', $event)"
		>
			<li v-for="i in 6" :key="i">
				<component
					:is="value.items.value[i - 1] ? 'button' : 'div'"
					:draggable="value.items.value[i - 1] ? 'true' : undefined"
					@mouseenter="value.items.value[i - 1] && showItemHoverTooltip($event, value.items.value[i - 1]!)"
					@click.right="removeItem($event, i - 1)"
					@dragstart="startItemDrag($event, i - 1)"
				>
					<span>{{ value.items.value[i - 1]?.name || `item ${i}` }}</span>
					<img
						v-if="value.items.value[i - 1]"
						:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${value.items.value[i - 1]!.image}`"
						width="64"
						height="64"
						loading="lazy"
					>
				</component>
			</li>
		</ul>
		<div ref="itemHoverTooltip" popover="hint" class="hover-tooltip scoreboard-item-hover-tooltip">
			<ItemDescription :item="hoveredItem" :target="value.getItemVariableCalculationTarget()" />
		</div>
		<button
			:title="removeButtonAttrs.title"
			class="pretend-ui-button"
			:disabled="removeButtonAttrs.disabled"
			@click="removeButtonAttrs.emit"
		>
			<span class="sr-only">{{ removeButtonAttrs.title }}</span>
			<Icon class="i-ph:x size-5" />
		</button>
		<button
			title="expand"
			class="pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="toggleExpanded"
		>
			<span class="sr-only">expand</span>
			<Icon class="i-ph:caret-down size-5" />
		</button>
		<details ref="details" :aria-busy="isLoading">
			<summary>
				details
			</summary>
			<h3 data-loading="">
				loading...
			</h3>
			<section data-champion-stats="" :inert="isLoading || undefined">
				<dl
					v-for="(stats, statKindIndex) in [minorStats, majorStats]"
					:key="statKindIndex"
				>
					<template v-for="(stat, statIndex) in stats" :key="`${statKindIndex}-${statIndex}`">
						<dt @mouseenter="showStatTooltip($event, stat)" @mouseleave="hideStatTooltip">
							<span>{{ stat.name }}</span>
							<img v-bind="textureBgImageAttrs(ui.playerStats[stat.iconTextureKey], 20)">
						</dt>
						<dd
							:data-has-bonus="stat.values.some(value => value.bonus) || undefined"
							@mouseenter="showStatTooltip($event, stat)"
							@mouseleave="hideStatTooltip"
						>
							{{ stat.displayedValue }}
						</dd>
					</template>
				</dl>
				<div ref="championStatTooltip" class="hover-tooltip champion-stat-hover-tooltip" popover="hint">
					<h4>{{ hoveredStat?.name }}</h4>
					<p class="game-description" v-html="hoveredStat?.description" />
					<dl>
						<template v-for="(statValue, valueIndex) in hoveredStat?.values" :key="valueIndex">
							<dt>{{ statValue.name }}:</dt>
							<dd :data-has-bonus="statValue.bonus || undefined">
								<span data-total="">{{ statValue.total }}</span>{{ statValue.isPercentage ? '%' : '' }}
								<template v-if="'base' in statValue">
									(<span data-base="">{{ statValue.base }}</span> base + <span data-bonus="">{{ statValue.bonus }}</span> bonus)
								</template>
							</dd>
							<br v-if="valueIndex !== ((hoveredStat?.values.length || 1) - 1)">
						</template>
					</dl>
					<p v-if="hoveredStat?.bottomText" :data-has-bonus="hoveredStat?.values.some(v => v.bonus) || undefined" v-html="hoveredStat?.bottomText" />
				</div>
			</section>
			<section data-champion-abilities="" :inert="isLoading || undefined">
				<div data-passive="">
					<img
						v-show="!isLoading"
						:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.passive.variants[value.abilityVariants.value.passive]?.image}` : undefined"
						width="64"
						height="64"
						aria-hidden="true"
						@mouseenter="value.champion.value && showAbilityTooltip($event, 'passive')"
					>
					<span>passive</span>
				</div>
				<template v-if="value.listedChampion.value?.id === 'Aphelios'">
					aphelios catdespair
				</template>
				<template v-else>
					<div
						v-for="ability in ['q', 'w', 'e', 'r'] as const"
						v-bind="{ [`data-${ability}`]: '' }"
						:key="ability"
					>
						<img
							v-show="!isLoading"
							:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities[ability].variants[value.abilityVariants.value[ability]]?.image}` : undefined"
							width="64"
							height="64"
							aria-hidden="true"
							@mouseenter="value.champion.value && showAbilityTooltip($event, ability)"
						>
						<span>{{ ability }}</span>
						<VButtonRadiogroup
							v-if="value.champion.value"
							:id="`${group}-${index}-ability-${ability}`"
							v-model="value.abilityLevels.value[ability]"
							:label="`${ability} level`"
							:options="Array.from({ length: value.champion.value.abilities[ability].maxLevel }, (_, index) => ({ level: index + 1 }))"
							value-key="level"
							:on-option-right-click="(event) => resetAbilityLevel(event, ability)"
						>
							<template #default="{ option }">
								<span>{{ option.level }}</span>
							</template>
						</VButtonRadiogroup>
					</div>
				</template>
				<div ref="championAbilityHoverTooltip" popover="hint" class="hover-tooltip champion-ability-hover-tooltip game-description">
					<img
						v-show="!isLoading"
						:src="!isLoading && hoveredAbilityVariant ? `https://raw.communitydragon.org/${minorVersion}/game/${hoveredAbilityVariant?.image}` : undefined"
						width="64"
						height="64"
						aria-hidden="true"
					>
					<h4>
						{{ hoveredAbility && hoveredAbility !== 'passive' ? `[${hoveredAbility.toUpperCase()}] ` : '' }}{{ hoveredAbilityTooltipText?.name }}
					</h4>
					<span>
						<template v-if="hoveredAbility !== 'passive' && hoveredAbilityTooltipText?.cooldown">
							{{ hoveredAbilityTooltipText?.cooldown }}s
							<img
								:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png`"
								width="20"
								height="20"
								aria-hidden="true"
							>
						</template>
						<template v-else-if="hoveredAbility !== 'passive'">
							<Unknown>UNKNOWN</Unknown>
						</template>
					</span>
					<span>
						{{ hoveredAbility === 'passive' ? '' : hoveredAbilityTooltipText?.cost ? `${hoveredAbilityTooltipText.cost} ${value.champion.value?.partype}` : 'No Cost' }}
					</span>
					<div class="game-description" v-html="globalKeyModifiers.shift && hoveredAbilityTooltipText?.tooltipExtended || hoveredAbilityTooltipText?.tooltip" />
					<UnresolvedVariablesAlert v-if="hoveredAbilityTooltipText?.anyUnknownVariables" class="col-span-full" />
					<footer v-if="hoveredAbilityTooltipText?.tooltipExtendedBelowLine || hoveredAbilityTooltipText?.extendedVariableInfo.length">
						<div
							v-if="hoveredAbilityTooltipText?.tooltipExtendedBelowLine"
							v-show="globalKeyModifiers.shift"
							v-html="hoveredAbilityTooltipText.tooltipExtendedBelowLine"
						/>
						<dl v-show="globalKeyModifiers.shift && hoveredAbilityTooltipText?.extendedVariableInfo">
							<template v-for="[variableName, variableValues] in hoveredAbilityTooltipText?.extendedVariableInfo" :key="variableName">
								<dt>
									{{ variableName }}
								</dt>
								<dd>
									[
									<template
										v-for="(variable, variableIndex) in variableValues"
										:key="`${variableName}-${variableIndex}`"
									>
										<span
											:data-current="hoveredAbility
												? (variableIndex + 1 === (hoveredAbility === 'passive'
													? 1
													: value.abilityLevels.value[hoveredAbility])) ? '' : undefined
												: undefined"
										>
											{{ variable }}
										</span>
										{{ variableIndex === (variableValues.length - 1) ? '' : ' / ' }}
									</template>
									]
								</dd>
							</template>
						</dl>
						<p v-show="!globalKeyModifiers.shift">
							Press [Shift] to show more info
						</p>
					</footer>
				</div>
			</section>
			<section data-champion-health-ability-resource="">
				<div
					ref="healthBar"
					data-current-health=""
					:style="`--fill-percentage: ${value.champion.value ? Math.min(value.currentHealth.value / maxHealth, 1) : 1}`"
					@mousedown="startHealthBarDrag"
				>
					<template v-if="value.champion.value">
						<label :for="`${group}-${index}-current-ability-health`">
							health
						</label>
						<input
							:id="`${group}-${index}-current-ability-health`"
							:value="Math.round(value.currentHealth.value)"
							min="0"
							:max="maxHealth"
							type="number"
							@input="updateChampionHealth"
						>
						<span>/ {{ maxHealth }}</span>
					</template>
				</div>
				<div
					ref="resourceBar"
					data-current-ability-resource=""
					:style="value.maxAbilityResource.value ? `--fill-percentage: ${Math.min(value.currentAbilityResource.value / value.maxAbilityResource.value, 1)}` : undefined"
					@mousedown="startAbilityResourceBarDrag"
				>
					<template v-if="value.maxAbilityResource.value">
						<label :for="`${group}-${index}-current-ability-resource`">
							{{ value.abilityResourceName.value }}
						</label>
						<input
							:id="`${group}-${index}-current-ability-resource`"
							:value="Math.round(value.currentAbilityResource.value)"
							min="0"
							:max="value.maxAbilityResource.value"
							type="number"
							@input="updateChampionAbilityResource"
						>
						<span>/ {{ value.maxAbilityResource.value }}</span>
					</template>
				</div>
			</section>
		</details>
	</li>
</template>

<style>
@layer components {
	#calculator-scoreboard [data-scoreboard-item] {
		--at-apply: 'grid auto-cols-max grid-flow-col grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_0fr)] of-hidden py-2 px-4';

		--select-champion-size: calc(var(--spacing) * 14);
		--placeholder-champion-bg-clr: #020a13;
		--non-expanded-row-height: calc(var(--select-champion-size) / 2);
		--transition-duration: 150ms;
		grid-template-areas:
			'move-up		move-column	select-champion	select-runes	select-items	items			clear'
			'move-down	duplicate		select-champion	select-runes	select-items	items			expand'
			'expanded		expanded		expanded				expanded			expanded			expanded	expanded';
		grid-template-columns: repeat(5, max-content) 1fr max-content;
		transition-duration: var(--transition-duration);
		transition-timing-function: ease-in-out;
		transition-property: grid-template-rows;
		anchor-scope: --scoreboard-item-items, --scoreboard-item-abilities;

		&:has(> details[open]) {
			--at-apply: 'grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_1fr)]';

			> button:nth-last-of-type(1) {
				--at-apply: 'rotate-180';
			}
		}

		> button {
			&:nth-of-type(1) {
				--at-apply: 'self-end mb-0.5 me-0.5';
				grid-area: move-up;
			}

			&:nth-of-type(2) {
				--at-apply: 'self-start mt-0.5 me-0.5';
				grid-area: move-down;
			}

			&:nth-of-type(3) {
				--at-apply: 'self-end mb-0.5 ms-0.5';
				grid-area: move-column;
			}

			&:nth-of-type(4) {
				--at-apply: 'self-start mt-0.5 ms-0.5';
				grid-area: duplicate;
			}

			&:nth-last-of-type(1) {
				--at-apply: 'self-start mt-0.5';
				grid-area: expand;
			}

			&:nth-last-of-type(2) {
				--at-apply: 'self-end mb-0.5';
				grid-area: clear;
			}

			&:nth-of-type(-n + 4),
			&:nth-last-of-type(-n + 2) {
				--at-apply: 'size-5 grid-center';

				.icon {
					--at-apply: 'size-4';
				}
			}
		}

		> [data-select-champion] {
			--at-apply: 'size-[--select-champion-size] mx-3 relative';
			grid-area: select-champion;

			> button {
				--at-apply: 'group b b-2 b-[--ui-button-border-clr] rounded-full size-full of-hidden';

				img {
					--at-apply: 'max-w-none size-[calc(100%_+_var(--spacing)_*_2)] -ms-1 -mt-1';
				}

				&:hover,
				&:focus-visible {
					img {
						--at-apply: 'brightness-[--focus-brightness]';
					}
				}
			}

			> [data-select-champion-level] {
				--at-apply: 'absolute -bottom-1 -end-2';
			}
		}

		> [data-select-runes] {
			--at-apply: 'b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 grid-center size-8 relative self-center';
			--secondary-path-icon-size: calc(var(--spacing) * 3);
			background-color: var(--placeholder-champion-bg-clr);
			grid-area: select-runes;

			[data-secondary-path-icon] {
				--at-apply: 'size-[--secondary-path-icon-size] block -bottom-0.5 z-11 -end-0.5 absolute';
			}

			&:has([data-secondary-path-icon]):before {
				--at-apply: 'content-empty z-10 absolute -end-0.5 -bottom-0.5 bg-inherit b b-[--ui-button-border-clr] size-[calc(var(--secondary-path-icon-size)_+_var(--spacing))] rounded-full translate-x-0.5 translate-y-0.5';
			}
		}

		> [data-select-items] {
			--at-apply: 'mx-2 b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 relative h-8 ps-2.5 pe-2 self-center w-max whitespace-nowrap';
			background-color: var(--placeholder-champion-bg-clr);
			grid-area: select-items;

			img {
				--at-apply: 'inline-block align-middle -mt-0.5';
			}
		}

		> ul {
			--at-apply: 'flex h-8 self-center relative me-3 w-min';
			grid-area: items;
			anchor-name: --scoreboard-item-items;

			> li {
				--at-apply: 'me-0.5 last:me-0';

				> * {
					--at-apply: 'bg-black size-8 inline-block cursor-default';

					> span {
						--at-apply: 'sr-only';
					}
				}
			}

			&[data-drop-target] {
				> li {
					--at-apply: 'op-50';
				}

				&::before {
					--at-apply: 'inset-0 content-empty absolute z-10 bg-white/10';
				}

				&::after {
					--at-apply: 'content-empty start-1/2 top-1/2 absolute translate-center size-4.5 bg-white';
					mask: icon('i-ph:plus-bold') center / 100% 100% no-repeat;
				}
			}

			&[data-drop-target='true'] {
				&::before {
					--at-apply: 'bg-red/25';
				}

				&::after {
					--at-apply: "content-['FULL'] tracking-wide bg-transparent size-auto text-white font-semibold";
					mask: unset;
					-webkit-text-stroke: black 0.15em;
					paint-order: stroke fill;
				}
			}
		}

		.scoreboard-item-hover-tooltip {
			--at-apply: 'w-160 max-w-screen';
			inset: unset;
			justify-self: anchor-center;
			position-anchor: --scoreboard-item-items;
			position-try: flip-block;
			top: calc(anchor(bottom) + 4 * var(--spacing));
		}

		/* TODO either accept partial animation or use js for animating the height/check if https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size#browser_compatibility is implemented yet and do the below */
		/* > ::details-content { */
		/* 	--at-apply: '-mt-6'; */
		/* 	interpolate-size: allow-keywords; */
		/* 	height: 0; */
		/* 	overflow: clip; */
		/* 	transition-duration: 2s; */
		/* 	transition-timing-function: ease-in-out; */
		/* 	transition-property: height, content-visibility; */
		/* 	transition-behavior: allow-discrete; */
		/* } */

		/* > [open]::details-content { */
		/* 	height: auto; */
		/* } */

		> details {
			--at-apply: 'relative';
			anchor-scope: --champion-stats-minor;
			grid-area: expanded;

			&::details-content {
				--at-apply: 'pt-4 -mt-6 grid grid-cols-[auto_1fr] grid-rows-[auto_1fr]';
			}

			[data-loading] {
				--at-apply: 'hidden z-10 text-center pt-10 absolute -inset-1 inset-t-3 font-600 text-2xl backdrop-blur-2';
				-webkit-text-stroke: black 0.1em;
				paint-order: stroke fill;
			}

			&[aria-busy='true'] [data-loading] {
				--at-apply: 'block';
			}

			summary {
				--at-apply: 'list-none invisible pointer-events-none';
			}

			> [data-champion-stats] {
				--at-apply: 'row-span-2';

				> dl {
					--at-apply: 'grid grid-rows-4 items-center whitespace-nowrap bg-cyan-950 b b-[--ui-button-border-clr] p-0.5 w-fit';

					&:first-of-type {
						anchor-name: --champion-stats-minor;
					}

					grid-template-columns: 1.25rem 5rem 1.25rem 5rem;

					&:nth-of-type(2) {
						--at-apply: 'b-t-0';
					}

					> dt {
						--at-apply: 'py-0.5 ps-0.5';

						> :first-child {
							--at-apply: 'sr-only';
						}
					}

					> dd {
						--at-apply: 'leading-5 h-full w-max ps-1.5 py-0.5 pe-0.5';

						&[data-has-bonus] {
							--at-apply: 'text-yellow-200';
						}
					}
				}
			}

			.champion-stat-hover-tooltip {
				--at-apply: 'py-1 px-1.5';
				inset: unset;
				position-anchor: --champion-stats-minor;
				bottom: calc(anchor(top) - 1px);
				justify-self: anchor-center;

				h4 {
					--at-apply: 'text-lg/6 font-500 text-white';
				}

				dl {
					--at-apply: 'leading-5.5';

					dt,
					dd {
						--at-apply: 'inline';
					}

					dd {
						--at-apply: 'ms-[0.5ch]';
					}
				}

				[data-total],
				[data-base] {
					--at-apply: 'text-cyan-300 font-500';
				}

				[data-bonus] {
					--at-apply: 'text-[#0f0] font-500';
				}

				[data-has-bonus] {
					[data-total] {
						--at-apply: 'text-[#0f0]';
					}
				}

				p:last-child {
					--at-apply: 'mt-1';
				}
			}

			.champion-stat-hover-tooltip p:first-of-type,
			.champion-ability-hover-tooltip > div {
				--at-apply: 'mt-0.5 b-b b-t b-[--ui-button-border-clr] pt-1.5 pb-1 mb-1.25 leading-4.5';
			}

			> [data-champion-abilities] {
				--at-apply: 'grid gap-x-2 auto-rows-max';
				grid-template-areas:
					'passive	q					w					e					r'
					'health		health		health		health		health'
					'resource	resource	resource	resource	resource';
				anchor-name: --scoreboard-item-abilities;

				[data-passive],
				[data-q],
				[data-w],
				[data-e],
				[data-r] {
					--at-apply: 'relative size-14 b b-neutral-300';

					> span {
						--at-apply: 'absolute uppercase bottom-0 start-0 leading-[1] -translate-x-1/2 translate-y-1/3 pointer-events-none';

						-webkit-text-stroke: black 0.1em;
						paint-order: stroke fill;
					}
				}

				[data-q],
				[data-w],
				[data-e],
				[data-r] {
					--at-apply: 'mb-[calc(var(--button-indicator-size)+2*var(--button-py))]';
					--button-indicator-size: calc(2 * var(--spacing));
					--button-py: calc(1 * var(--spacing));

					> [role='radiogroup'] {
						--at-apply: 'flex justify-center';

						> button {
							--at-apply: 'py-[--button-py] px-0.25';

							&::before {
								--at-apply: 'content-empty block b b-[--ui-button-border-clr] size-[--button-indicator-size] rounded-full bg-black mx-auto';
							}

							&[aria-checked='true']::before,
							&:has(~ [aria-checked='true'])::before {
								--at-apply: 'bg-[--ui-button-border-clr]';
							}

							&:has(~ :hover)::before,
							&:has(~ :focus-visible)::before {
								--at-apply: 'bg-white/50';
							}

							&:hover ~ *::before,
							&:focus-visible ~ *::before {
								--at-apply: 'bg-black';
							}

							&:hover::before,
							&:focus-visible::before {
								--at-apply: 'bg-white';
							}

							> span {
								--at-apply: 'sr-only';
							}
						}
					}
				}

				[data-loading] {
					--at-apply: 'grid-center';
					grid-column: 1 / -1;
					grid-row: 1 / span 1;
				}

				[data-passive] {
					--at-apply: 'size-10';
					grid-area: passive;

					> span {
						--at-apply: 'sr-only';
					}
				}

				[data-q] {
					grid-area: q;
				}

				[data-w] {
					grid-area: w;
				}

				[data-e] {
					grid-area: e;
				}

				[data-r] {
					grid-area: r;
				}
			}

			[data-champion-health-ability-resource] {
				[data-current-health],
				[data-current-ability-resource] {
					--at-apply: 'relative bg-black h-6 flex flex-center gap-x-2 whitespace-nowrap';

					&:before {
						--at-apply: 'content-empty block absolute z-0 inset-0 origin-left bg-[--fill-bg] scale-x-[var(--fill-percentage,0)]';
					}

					> label {
						--at-apply: 'z-1 sr-only';
					}

					> span {
						--at-apply: 'z-1 pointer-events-none select-none';
					}

					/* TODO add field-sizing: content; once firefox has it */
					> input {
						--at-apply: 'z-1 w-12 bg-white text-black text-center leading-[1] px-1';
						-webkit-appearance: textfield;
						-moz-appearance: textfield;
						appearance: textfield;
					}
				}

				[data-current-health] {
					--at-apply: 'mt-2';
					--fill-bg: theme('colors.green.500');
					grid-area: health;
				}

				[data-current-ability-resource] {
					--fill-bg: theme('colors.blue.500');
					grid-area: resource;
				}
			}

			.champion-ability-hover-tooltip {
				--at-apply: 'max-w-160 p-2 relative grid-cols-[auto_1fr_auto] auto-rows-min';
				inset: unset;
				justify-self: anchor-center;
				position-anchor: --scoreboard-item-abilities;
				position-try: flip-block;
				top: calc(anchor(bottom) - 1px);

				&:popover-open {
					--at-apply: 'grid';
				}

				> img {
					--at-apply: 'row-span-2';
				}

				> h4 {
					--at-apply: 'text-white text-lg row-span-2';
				}

				> span {
					--at-apply: 'text-end text-lg';

					&:first-of-type {
						--at-apply: 'flex gap-[0.5ch] justify-end items-center text-yellow-100';

						img {
							--at-apply: '';
						}
					}

					&:nth-of-type(2) {
						--at-apply: 'self-start';
					}
				}

				> div {
					--at-apply: 'col-span-full mt-2';
				}

				> footer {
					--at-apply: 'col-span-full';

					> p {
						--at-apply: 'text-end';
					}

					> dl {
						--at-apply: 'grid grid-cols-[1fr_auto] leading-5';

						&:not(:first-child) {
							--at-apply: 'mt-1.5';
						}

						> dd {
							> span {
								--at-apply: 'text-neutral-400';
							}

							[data-current] {
								--at-apply: 'text-white font-medium';
							}
						}
					}
				}
			}
		}
	}
}
</style>
