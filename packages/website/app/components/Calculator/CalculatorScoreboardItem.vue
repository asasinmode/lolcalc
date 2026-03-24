<script setup lang="ts">
import type { IComputedDamageSourceChampionStat } from '~/utils/DamageSource';
import type { IWithCalculateDynamicValues } from '~/utils/types';
import { CHAMPION_COMPONENTS } from '~/components/Champion';

const props = defineProps<{
	index: number;
	value: DamageSource<any>;
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
	itemDragstart: [event: DragEvent, itemIndex: number];
}>();

const enableUnimplementedUi = useEnableUnimplementedUi();
const highlightedDamageSources = useHighlightedDamageSources();
const runes = useRunes();
const ui = useUi();
const misc = useMisc();
const { version, minorVersion } = usePatchVersion();
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelect();
const { selectItems } = useItemShop();
const text = useText();
const globalKeyModifiers = useGlobalKeyModifiers();

const group = computed(() => props.isRight ? 'targets' : 'sources');
const otherGroup = computed(() => props.isRight ? 'sources' : 'targets');
const isLoading = computed(() => Boolean(!props.value.champion.value && props.value.listedChampion.value));

const runeIconImgSrc = `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`;

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

const itemHoverTooltip = useTemplateRef('itemHoverTooltip');
const hoveredItem = shallowRef<IItem>();

function showItemHoverTooltip(event: MouseEvent, item: IItem) {
	itemHoverTooltip.value?.showPopover();
	event.target?.addEventListener('mouseleave', leaveTooltipableItemElement, { passive: true, once: true });
	hoveredItem.value = item;
}

function leaveTooltipableItemElement() {
	itemHoverTooltip.value?.hidePopover();
}

function removeItem(event: MouseEvent, index: number) {
	if (props.value.items.value[index]) {
		event.preventDefault();
		// eslint-disable-next-line vue/no-mutating-props
		props.value.items.value.splice(index, 1);
		if (props.value.items.value[index]) {
			showItemHoverTooltip(event, props.value.items.value[index]);
		} else {
			itemHoverTooltip.value?.hidePopover();
		}
	}
}

function startItemDrag(event: DragEvent, index: number) {
	itemHoverTooltip.value?.hidePopover();
	emit('itemDragstart', event, index);
}

const hoveredRune = shallowRef<IChampionRune>();
const hoveredRuneTooltip = useTemplateRef('championRuneTooltip');

function showRuneTooltip(event: MouseEvent, rune: IChampionRune) {
	hoveredRune.value = rune;
	// @ts-expect-error source is ok
	hoveredRuneTooltip.value?.showPopover({ source: event.target });
}

function hideRuneTooltip() {
	hoveredRuneTooltip.value?.hidePopover();
}

interface IChampionRune {
	name: string;
	description: string;
	anyUnknownVariables?: number;
	icon: string;
	iconDimensions: 256 | 80 | 64;
}

const championRunes = computed<(IChampionRune | undefined)[]>(() => {
	const { paths: { primary, primarySlots, secondary, secondarySlots }, shards } = props.value.runes.value;

	let shardAnyUnknown = 0;
	const shardDescriptions = Object.entries(shards as any).map(([shardSlot, shardName]) => {
		const rune = (runes.shards[shardSlot as IRuneShardSlotName] as any)[shardName as string];

		const dynamicValues = (RUNE_SPECIFICS.shards as IWithCalculateDynamicValues)[shardName as string]?.calculateDynamicVariables?.(props.value);

		const { replaced: stringtableVariableReplaced, unknownStringtableVariables: unknownSV } = replaceGameDescriptionStringtableVariables(
			text.runes.shards.slotValues[shardName as string]!.tooltipStats,
			text.stringtable,
			dynamicValues,
		);

		const { replaced, unknownVariables: unknownV } = replaceGameDescriptionVariables(
			stringtableVariableReplaced,
			'rune',
			[{
				...rune,
				dynamicValues,
			}],
		);

		shardAnyUnknown ||= unknownSV.size || unknownV.length;

		return replaced;
	});

	return Array.from({ length: 4 }, (_, i) => primarySlots[i] && getRuneText(primarySlots[i], i, primary, true))
		.concat(Array.from({ length: 2 }, (_, i) => secondary && secondarySlots[i] && getRuneText(secondarySlots[i], i, secondary, false)))
		.concat([{
			name: 'Rune shards',
			description: shardDescriptions.join('<br>'),
			anyUnknownVariables: shardAnyUnknown,
			icon: runeIconImgSrc,
			iconDimensions: 80,
		}]);
});

function getRuneText(slotName: IRuneSlotName, slotNumber: number, path: IRunePathName, isPrimary: boolean): IChampionRune {
	const rune = runes.paths[path].slots[isPrimary ? slotNumber : RUNE_SLOT_NAME_TO_NUMBER[slotName]!]![slotName]!;
	const { name, tooltipStats } = text.runes.slots[slotName]!;

	const icon = `https://raw.communitydragon.org/${minorVersion}/game/${rune.icon}`;

	const { replaced: stringtableVariableReplaced, unknownStringtableVariables: unknownSV } = replaceGameDescriptionStringtableVariables(
		tooltipStats,
		text.stringtable,
	);

	const { replaced, unknownVariables: unknownV } = replaceGameDescriptionVariables(
		stringtableVariableReplaced,
		'rune',
		[rune],
	);

	return {
		name,
		description: replaced,
		anyUnknownVariables: unknownSV.size || unknownV.length,
		icon,
		iconDimensions: slotNumber === 0 && isPrimary ? 256 : 64,
	};
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

interface IChampionStat {
	name: string;
	iconTextureKey: keyof (typeof ui)['playerStats'];
	description: string;
	values: {
		name: string;
		base?: number;
		bonus: number;
		stat: IComputedDamageSourceChampionStat;
	}[];
	displayedValue: string;
	bottomText?: string;
}

const minorStats = computed<IChampionStat[]>(() => {
	const { stats } = props.value.computed;

	const minorStats = [
		{
			name: 'Health | Resource Regeneration',
			description: 'The amount of <scalehealth>Health</scalehealth> you regenerate over 5 seconds.<br/><br/>The amount of Ability resource you regenerate over 5 seconds (usually <scalemana>Mana</scalemana> or <energy>Energy</energy>).',
			iconTextureKey: 'healthResourceRegen',
			values: [
				{
					name: 'Health Regen',
					stat: stats.value.hpRegen,
				},
				{
					name: 'Resource Regen',
					stat: stats.value.manaRegen,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.healShieldPower,
			description: 'Increases the effectiveness of <healing>Heals</healing> and <shields>Shields</shields>.',
			iconTextureKey: 'healShieldPower',
			values: [
				{
					name: CHAMPION_STAT_NAMES.healShieldPower,
					stat: stats.value.healShieldPower,
				},
			],
		},
		{
			name: 'Lethality | Armor Penetration',
			description: 'Ignores an amount of your target\'s <scalearmor>Armor</scalearmor> when applying <physicaldamage>physical damage</physicaldamage>.<br><br><scalelethality>Lethality</scalelethality> ignores a flat amount, <scalelethality>Armor Penetration</scalelethality> ignores a percentage amount',
			iconTextureKey: 'armorPen',
			values: [
				{
					name: CHAMPION_STAT_NAMES.lethality,
					stat: stats.value.lethality,
				},
				{
					name: 'Armor Penetration',
					stat: stats.value.percentArmorPen,
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
					stat: stats.value.flatMagicPen,
				},
				{
					name: 'Magic Penetration',
					stat: stats.value.percentMagicPen,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.lifeSteal,
			description: 'Returns a portion of the damage you deal with Attacks as <scalehealth>Health</scalehealth>.',
			iconTextureKey: 'lifeSteal',
			values: [
				{
					name: CHAMPION_STAT_NAMES.lifeSteal,
					stat: stats.value.lifeSteal,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.omnivamp,
			description: 'Returns a portion of all damage you deal as <scalehealth>Health</scalehealth>.<br><br>Reduced to 20% effectiveness when dealing damage to minions or monsters.',
			iconTextureKey: 'omnivamp',
			values: [
				{
					name: CHAMPION_STAT_NAMES.omnivamp,
					stat: stats.value.omnivamp,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.attackRange,
			description: 'The distance at which you can Attack.',
			iconTextureKey: 'attackRange',
			values: [
				{
					name: CHAMPION_STAT_NAMES.attackRange,
					stat: stats.value.attackRange,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.tenacity,
			description: 'Reduces the duration of crowd control debuffs, such as <keyword>Slows</keyword> and <keyword>Stuns</keyword>.<br><br>Does not affect <keyword>Airborne</keyword> and <keyword>Suppression</keyword>.',
			iconTextureKey: 'tenacity',
			values: [
				{
					name: CHAMPION_STAT_NAMES.tenacity,
					stat: stats.value.tenacity,
				},
			],
		},
	] as IChampionStat[];

	updateComputedStats(minorStats);

	return minorStats;
});

const majorStats = computed<IChampionStat[]>(() => {
	const { stats } = props.value.computed;
	const majorStats = [
		{
			name: CHAMPION_STAT_NAMES.attackDamage,
			description: 'The amount of <physicaldamage>physical damage</physicaldamage> your Attack deal.<br><br>Also increases the amount of damage you deal with certain Abilities.',
			iconTextureKey: 'attackDamage',
			values: [
				{
					name: CHAMPION_STAT_NAMES.attackDamage,
					stat: stats.value.attackDamage,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.abilityPower,
			description: 'Increases the amount of damage you deal with most Abilities.',
			iconTextureKey: 'abilityPower',
			values: [
				{
					name: CHAMPION_STAT_NAMES.abilityPower,
					stat: stats.value.abilityPower,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.armor,
			description: 'Reduces the amount of <physicaldamage>magic damage</physicaldamage> you take.',
			iconTextureKey: 'armor',
			values: [
				{
					name: CHAMPION_STAT_NAMES.armor,
					stat: stats.value.armor,
				},
			],
			bottomText: `You take <span data-total="">${Math.round(calculateResistPercentageReduction(stats.value.armor.total) * 100)}</span>% reduced physical damage.`,
		},
		{
			name: CHAMPION_STAT_NAMES.magicResist,
			description: 'Reduces the amount of <magicdamage>magic damage</magicdamage> you take.',
			iconTextureKey: 'magicResist',
			values: [
				{
					name: CHAMPION_STAT_NAMES.magicResist,
					stat: stats.value.magicResist,
				},
			],
			bottomText: `You take <span data-total="">${Math.round(calculateResistPercentageReduction(stats.value.magicResist.total) * 100)}</span>% reduced magic damage.`,
		},
		{
			name: CHAMPION_STAT_NAMES.attackSpeed,
			description: 'Increases the rate at which you can Attack.<br><br>Ratio determines the effectiveness of bonus Attack Speed.',
			iconTextureKey: 'attackSpeed',
			values: [
				{
					name: CHAMPION_STAT_NAMES.bonusAttackSpeedPercent,
					stat: stats.value.bonusAttackSpeedPercent,
				},
				{
					name: 'Attacks per second',
					stat: stats.value.attackSpeed,
				},
				{
					name: 'Ratio',
					stat: stats.value.attackSpeedRatio,
				},
			],
			displayedValue: stats.value.attackSpeed.total.toFixed(2),
		},
		{
			name: CHAMPION_STAT_NAMES.abilityHaste,
			description: 'Allows you to cast your Abilities more often',
			iconTextureKey: 'abilityHaste',
			values: [
				{
					name: 'Current Ability Haste',
					stat: stats.value.abilityHaste,
				},
			],
			bottomText: `Equivalent to reducing your Ability cooldowns by <span data-total="">${Math.round(cooldownReductionPercentageFromHaste(stats.value.abilityHaste.total))}</span>%`,
		},
		{
			name: CHAMPION_STAT_NAMES.critChance,
			description: 'Grants a change to deal 100% increased damage on each Attack.',
			iconTextureKey: 'crit',
			values: [
				{
					name: CHAMPION_STAT_NAMES.critChance,
					stat: stats.value.critChance,
				},
			],
		},
		{
			name: CHAMPION_STAT_NAMES.moveSpeed,
			description: 'The speed at which you travel.',
			iconTextureKey: 'moveSpeed',
			values: [
				{
					name: CHAMPION_STAT_NAMES.moveSpeed,
					stat: stats.value.moveSpeed,
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
			const multiplier = value.stat.isPercentage ? 100 : 1;

			displayedValue.push(`${value.stat.formattedTotal}${value.stat.isPercentage ? '%' : ''}`);

			value.bonus = formatChampionStatValue(multiplier, value.stat, 'bonus');

			if ('base' in value.stat) {
				value.base = formatChampionStatValue(multiplier, value.stat, 'base');
			}
		}

		stat.displayedValue ||= displayedValue.join(' | ');
	}
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

function resetAbilityLevel(event: MouseEvent, ability: Exclude<IChampionAbilityKey, 'passive'>) {
	event.preventDefault();
	// eslint-disable-next-line vue/no-mutating-props
	props.value.abilityLevels.value[ability] = 0;
}

const hoveredAbilityKey = ref<IChampionAbilityKey>();
const hoveredAbilityVariantIndex = shallowRef<number>();
const abilityHoverTooltipEl = useTemplateRef('championAbilityHoverTooltip');

function showAbilityTooltip(event: MouseEvent, ability: IChampionAbilityKey, variant = 0) {
	if (props.value.champion.value) {
		hoveredAbilityKey.value = ability;
		hoveredAbilityVariantIndex.value = variant;
		event.target?.addEventListener('mouseleave', hideAbilityTooltip, { passive: true, once: true });
		abilityHoverTooltipEl.value?.el?.showPopover();
	}
}

function hideAbilityTooltip() {
	abilityHoverTooltipEl.value?.el?.hidePopover();
}

const roleQuestHoverTooltipEl = useTemplateRef('roleQuestHoverTooltip');

function updateRoleQuest(value?: IChampionRole) {
	// eslint-disable-next-line vue/no-mutating-props
	props.value.roleQuest.value = value;
	if (!value) {
		hideRoleQuestTooltip();
	}
}

function showRoleQuestTooltip(event: MouseEvent) {
	if (props.value.roleQuest.value) {
		event.target?.addEventListener('mouseleave', hideRoleQuestTooltip, { passive: true, once: true });
		roleQuestHoverTooltipEl.value?.showPopover();
	}
}

function hideRoleQuestTooltip() {
	roleQuestHoverTooltipEl.value?.hidePopover();
}

function updateDragonThing(value: IDragonName | undefined, target: 'stack' | 'soul', subpath?: number) {
	if (target === 'stack') {
		// eslint-disable-next-line vue/no-mutating-props
		props.value.dragonStacks.value[subpath!] = value;
	} else {
		// eslint-disable-next-line vue/no-mutating-props
		props.value.dragonSoul.value = value;
	}

	if (!value) {
		hideDragonTooltip();
	}
}

const dragonOptions = ALL_DRAGON_NAMES.map(name => [name, name.toLowerCase()]) as [IDragonName, string][];

let dragonTooltipAnchor: HTMLElement | undefined;
const hoveredDragonThing = shallowRef<[IDragonName, 'stack' | 'soul']>();
const dragonHoverTooltipEl = useTemplateRef('dragonTooltip');

function showDragonTooltip(event: MouseEvent, dragonThing: [IDragonName, 'stack' | 'soul']) {
	const { target } = event as unknown as { target: HTMLElement };
	dragonHoverTooltipEl.value?.showPopover();
	dragonTooltipAnchor = target;
	dragonTooltipAnchor?.addEventListener('mouseleave', hideDragonTooltip, { passive: true, once: true });
	hoveredDragonThing.value = dragonThing;
}

function hideDragonTooltip() {
	dragonHoverTooltipEl.value?.hidePopover();
	dragonTooltipAnchor?.removeEventListener('mouseleave', hideDragonTooltip);
	dragonTooltipAnchor = undefined;
}

const hoveredDragonThingText = computed(() => {
	if (!hoveredDragonThing.value) {
		return;
	}

	const [dragonName, abilityName] = hoveredDragonThing.value;
	const ability = misc.dragons[dragonName][abilityName];
	const string = text.dragons[dragonName][abilityName];
	const isStack = abilityName === 'stack';

	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceGameDescriptionStringtableVariables(string);

	const { replaced, unknownVariables } = replaceGameDescriptionVariables(
		stringtableReplaced,
		'championAbility',
		[ability, 1, [misc.dragons[dragonName].stack, misc.dragons[dragonName].soul]],
	);

	let invalid: string | undefined;

	if (isStack) {
		if (props.value.dragonStacksInvalid.value) {
			invalid = props.value.dragonStacksInvalid.value === 1 ? 'Only 1 dragon type can be repeated' : 'There can be only 3 different dragon types';
		}
	} else if (props.value.dragonSoulInvalid.value) {
		invalid = 'Soul needs at least 4 total and 2 matching stacks';
	}

	return {
		title: `${dragonName} ${isStack ? 'Dragon' : 'Soul'}`,
		description: replaceGameDescriptionIcons(replaced),
		anyUnknown: unknownStringtableVariables.size || unknownVariables.length,
		invalid,
	};
});

const el = useTemplateRef('el');

onBeforeUnmount(() => {
	healthBarCleanup();
	abilityResourceBarCleanup();
});

defineExpose({ el });
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<li
		ref="el"
		:data-scoreboard-item="value.listedChampion.value?.id || ''"
		:style="`--damage-source-clr: ${value.color};`"
		:class="{ highlighted: highlightedDamageSources.has(value.id) }"
		@mouseenter="highlightedDamageSources.add(value.id)"
		@focusin="highlightedDamageSources.add(value.id)"
		@mouseleave="highlightedDamageSources.remove(value.id)"
		@focusout="highlightedDamageSources.remove(value.id)"
	>
		<h3>
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
			<VSelect
				:id="`${group}-${index}-level-select`"
				label="level"
				:model-value="value.level.value"
				data-select-champion-level=""
				:options="Array.from({ length: 18 }, (_, i) => [i + 1, (i + 1).toString()])"
				@update:model-value="value.level.value = $event!"
			>
				<span>{{ value.level.value }}</span>
			</VSelect>
		</div>
		<button
			:title="value.runesInvalid.value ? 'runes (invalid)' : 'runes'"
			data-select-runes=""
			@click="selectRunes(value.runes)"
		>
			<span class="sr-only">{{ value.runePathsEmpty ? 'select runes' : 'runes' }}</span>
			<span
				v-show="value.runesInvalid.value"
				class="text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -end-0.5 -top-0.5"
			>
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
				:src="runeIconImgSrc"
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
		<button data-select-items="" @click="selectItems(value)">
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
		<div ref="itemHoverTooltip" popover="hint" class="hover-tooltip champion-item">
			<ItemDescription :item="hoveredItem" :damage-source="value" />
		</div>
		<button
			:title="removeButtonAttrs.title"
			class="pretend-ui-button"
			:disabled="removeButtonAttrs.disabled"
			@click="removeButtonAttrs.emit"
		>
			<span class="sr-only">{{ removeButtonAttrs.title }}</span>
			<Icon class="i-ph:trash size-5" />
		</button>
		<button
			title="expand"
			class="pretend-ui-button"
			@click="toggleExpanded"
		>
			<span class="sr-only">expand</span>
			<Icon class="i-ph:caret-down size-5" />
		</button>
		<details ref="details" :aria-busy="isLoading" :data-empty="!value.champion.value ? '' : undefined">
			<summary>
				details
			</summary>
			<h4 data-loading="">
				loading...
			</h4>
			<section data-runes-stats="" :inert="isLoading || undefined">
				<h4>runes and stats</h4>
				<dl>
					<template v-for="(championRune, runeIndex) in championRunes" :key="championRune?.name || runeIndex">
						<dt
							:inert="!enableUnimplementedUi && runeIndex !== 6"
							@mouseenter="championRune && showRuneTooltip($event, championRune)"
							@mouseleave="hideRuneTooltip"
						>
							<span>{{ championRune?.name || `${runeIndex < 4 ? 'primary' : 'secondary'} rune slot ${runeIndex + 1}` }}</span>
							<img
								v-if="championRune"
								:src="championRune.icon"
								:width="championRune.iconDimensions || 80"
								:height="championRune.iconDimensions || 80"
								loading="lazy"
							>
						</dt>
						<dd
							:inert="!enableUnimplementedUi && runeIndex !== 6"
							@mouseenter="championRune && showRuneTooltip($event, championRune)"
							@mouseleave="hideRuneTooltip"
						>
							{{ runeIndex === 6 ? '' : championRune ? 0 : '-' }}
						</dd>
					</template>
					<ComingSoonCover feature="major runes" class="text-xs px-1 end-1/2 start-0 inset-y-0 absolute" />
				</dl>
				<div ref="championRuneTooltip" class="hover-tooltip champion-rune" popover="hint">
					<h5>{{ hoveredRune?.name }}</h5>
					<p class="game-description" v-html="hoveredRune?.description" />
					<UnresolvedVariablesAlert v-if="hoveredRune?.anyUnknownVariables" />
				</div>
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
							:data-has-bonus="stat.values.some(value => value.stat.bonus) || undefined"
							@mouseenter="showStatTooltip($event, stat)"
							@mouseleave="hideStatTooltip"
						>
							{{ stat.displayedValue }}
						</dd>
					</template>
				</dl>
				<div ref="championStatTooltip" class="hover-tooltip champion-stat" popover="hint">
					<h5>{{ hoveredStat?.name }}</h5>
					<p class="game-description" v-html="hoveredStat?.description" />
					<dl>
						<template v-for="(statValue, valueIndex) in hoveredStat?.values" :key="valueIndex">
							<dt>{{ statValue.name }}:</dt>
							<dd :data-has-bonus="statValue.stat.bonus || undefined">
								<span data-total="">{{ statValue.stat.formattedTotal }}</span>{{ statValue.stat.isPercentage ? '%' : '' }}
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
			<section data-abilities="" :inert="isLoading || undefined">
				<h4>abilties</h4>
				<ChampionApheliosAbilities
					v-if="value.listedChampion.value?.id === 'Aphelios'"
					:value
					:is-loading
					@ability-hover="showAbilityTooltip"
				/>
				<template v-else>
					<div data-passive="">
						<h5>passive</h5>
						<img
							v-show="!isLoading"
							:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.passive.variants[value.abilityVariants.value.passive]?.image}` : undefined"
							width="64"
							height="64"
							aria-hidden="true"
							@mouseenter="value.champion.value && showAbilityTooltip($event, 'passive')"
						>
					</div>
					<div
						v-for="ability in ['q', 'w', 'e', 'r'] as const"
						v-bind="{ [`data-${ability}`]: '' }"
						:key="ability"
						:data-level="value.abilityLevels.value[ability]"
					>
						<h5>{{ ability.toUpperCase() }}</h5>
						<img
							v-show="!isLoading"
							:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities[ability].variants[value.abilityVariants.value[ability]]?.image}` : undefined"
							width="64"
							height="64"
							aria-hidden="true"
							@mouseenter="value.champion.value && showAbilityTooltip($event, ability)"
						>
						<VButtonRadiogroup
							v-if="value.champion.value"
							:id="`${group}-${index}-ability-${ability}`"
							v-model="value.abilityLevels.value[ability]"
							:label="`${ability} level`"
							:options="Array.from({ length: value.champion.value.abilities[ability].maxLevel }, (_, index) => ({ level: index + 1 }))"
							value-key="level"
							@option-right-click="(event) => resetAbilityLevel(event, ability)"
						>
							<template #default="{ option }">
								<span>{{ option.level }}</span>
							</template>
						</VButtonRadiogroup>
					</div>
				</template>
				<LolChampionAbilityHoverTooltip
					ref="championAbilityHoverTooltip"
					:champion-id="value.champion.value?.id"
					:ability-key="hoveredAbilityKey"
					:ability-variant="hoveredAbilityVariantIndex"
					:ability-level="hoveredAbilityKey === 'passive' ? 1 : hoveredAbilityKey ? value.abilityLevels.value[hoveredAbilityKey] : undefined"
				/>
			</section>
			<section data-health-ability-resource="">
				<h4>health and ability resource</h4>
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
			<section data-role-quest="">
				<h4>role quest</h4>
				<VSelect
					:id="`${group}-${index}-role-quest`"
					:model-value="value.roleQuest.value"
					:options="Object.keys(text.roleQuests).map(role => [role, role]) as [IChampionRole, string][]"
					label="role quest"
					clearable
					@update:model-value="updateRoleQuest"
					@label-mouseenter="showRoleQuestTooltip"
				>
					<template v-if="value.roleQuest.value">
						<img

							:src="`https://raw.communitydragon.org/latest/game/assets/ux/lol/rolequest_icon${value.roleQuest.value}_complete.png`"
							width="64"
							height="64"
							loading="lazy"
						>
						<img
							:src="`https://raw.communitydragon.org/latest/game/assets/ux/lol/rolequest_icon${value.roleQuest.value}32.png`"
							width="32"
							height="32"
							loading="lazy"
						>
					</template>
				</VSelect>
				<div ref="roleQuestHoverTooltip" popover="hint" class="hover-tooltip role-quest game-description">
					<h5>{{ value.roleQuest.value }}{{ value.roleQuest.value !== 'jungle' && value.roleQuest.value !== 'support' ? ' lane' : '' }} quest rewards</h5>
					<ul class="game-description">
						<li v-for="(reward, i) in value.roleQuest.value ? text.roleQuests[value.roleQuest.value] : []" :key="i">
							{{ reward }}
						</li>
					</ul>
				</div>
			</section>
			<section data-dragons="">
				<h4>dragons</h4>
				<VSelect
					v-for="i in 4"
					:id="`${group}-${index}-dragon-stack-${i}`"
					:key="i"
					:model-value="value.dragonStacks.value[i - 1]"
					:options="dragonOptions"
					label="soul"
					data-dragon-stack=""
					clearable
					@update:model-value="updateDragonThing($event, 'stack', i - 1)"
					@label-mouseenter="value.dragonStacks.value[i - 1] && showDragonTooltip($event, [value.dragonStacks.value[i - 1]!, 'stack'])"
				>
					<div v-if="value.dragonStacks.value[i - 1]" v-bind="textureBgImageAttrs(ui.dragons[value.dragonStacks.value[i - 1]!].stack, 28)" />
					<template #post>
						<div v-show="value.dragonStacksInvalid.value">
							<span>(invalid)</span>
							<Icon class="i-ph:exclamation-mark-bold" />
						</div>
					</template>
				</VSelect>
				<VSelect
					:id="`${group}-${index}-dragon-soul`"
					:model-value="value.dragonSoul.value"
					:options="dragonOptions"
					data-dragon-soul=""
					label="soul"
					clearable
					@update:model-value="updateDragonThing($event, 'soul')"
					@label-mouseenter="value.dragonSoul.value && showDragonTooltip($event, [value.dragonSoul.value, 'soul'])"
				>
					<div v-if="value.dragonSoul.value" v-bind="textureBgImageAttrs(ui.dragons[value.dragonSoul.value].soulActive, 44)" />
					<template #post>
						<div v-show="value.dragonSoulInvalid.value">
							<span>(invalid)</span>
							<Icon class="i-ph:exclamation-mark-bold" />
						</div>
					</template>
				</VSelect>
				<div ref="dragonTooltip" popover="hint" class="dragon-thing hover-tooltip">
					<h5>{{ hoveredDragonThingText?.title }}</h5>
					<p class="game-description" v-html="hoveredDragonThingText?.description" />
					<UnresolvedVariablesAlert v-if="hoveredDragonThingText?.anyUnknown" />
					<p v-if="hoveredDragonThingText?.invalid" class="alert error">
						<Icon class="i-ph:warning-circle-light" />
						{{ hoveredDragonThingText.invalid }}
					</p>
				</div>
			</section>
			<section v-if="value.champion.value && CHAMPION_COMPONENTS[value.champion.value.id as IChampionId]?.extras" data-extras="">
				<component
					:is="CHAMPION_COMPONENTS[value.champion.value.id as IChampionId]!.extras"
					:value
					:id-prefix="`${group}-${index}`"
					@ability-hover="showAbilityTooltip"
				/>
			</section>
		</details>
	</li>
</template>

<style>
@layer components {
	#scoreboard > div > ul:nth-of-type(1) > [data-scoreboard-item] {
		border-inline-start: 0.25rem solid var(--damage-source-clr);
	}

	#scoreboard > div > ul:nth-of-type(2) > [data-scoreboard-item] {
		--bg-direction: 270deg;
		border-inline-end: 0.25rem solid var(--damage-source-clr);
	}

	#scoreboard > div > ul > [data-scoreboard-item] {
		--at-apply: 'grid auto-cols-max grid-flow-col grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_0fr)] of-hidden py-2 px-4';

		--select-champion-size: calc(var(--spacing) * 14);
		--non-expanded-row-height: calc(var(--select-champion-size) / 2);
		--transition-duration: 150ms;

		--ability-size-passive: calc(var(--spacing) * 10);
		--ability-size: calc(var(--spacing) * 14);
		--ability-level-button-indicator-size: calc(2 * var(--spacing));
		--ability-level-button-py: calc(1 * var(--spacing));
		--ability-level-buttons-size: calc(var(--ability-level-button-indicator-size) + 2 * var(--ability-level-button-py));
		--abilities-gap: calc(var(--spacing) * 2);
		--abilities-width: calc(4 * var(--ability-size) + var(--ability-size-passive) + 4 * var(--abilities-gap));
		--abilities-height: calc(var(--ability-size) + var(--ability-level-buttons-size));
		--soul-size: calc(10 * var(--spacing));
		--stack-size: calc(8 * var(--spacing));
		--soul-rotation-size-diff: calc((var(--soul-size) * sqrt(2) - var(--soul-size)) / 2);

		grid-template-areas:
			'move-up		move-column	select-champion	select-runes	select-items	items			clear'
			'move-down	duplicate		select-champion	select-runes	select-items	items			expand'
			'expanded		expanded		expanded				expanded			expanded			expanded	expanded';
		grid-template-columns: repeat(5, max-content) 1fr max-content;
		transition-duration: var(--transition-duration);
		transition-timing-function: ease-in-out;
		transition-property: grid-template-rows;
		anchor-scope: all;
		background-image: linear-gradient(
			var(--bg-direction, 90deg),
			oklch(from var(--damage-source-clr) l c h / 0.08),
			oklch(from var(--damage-source-clr) l c h / 0.08)
		);

		&.highlighted {
			background-image: linear-gradient(
				var(--bg-direction, 90deg),
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.35) 0%,
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.15) 12.5%,
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.15) 100%
			);
		}

		&:has(> details[open]) {
			--at-apply: 'grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_1fr)]';

			> button:nth-last-of-type(1) {
				--at-apply: 'rotate-180';
			}
		}

		> h3 {
			--at-apply: 'sr-only';
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
					--at-apply: 'max-w-none size-[115%] -ms-[7.5%] -mt-[7.5%]';
				}

				&:hover,
				&:focus-visible {
					img {
						--at-apply: 'brightness-[--focus-brightness]';
					}
				}
			}

			> [data-select-champion-level] {
				--at-apply: 'absolute -bottom-0.5 -end-0.5';

				> select {
					--at-apply: 'rounded-full';
				}

				> label > span:last-child {
					--at-apply: 'size-5 bg-black text-white b b-[--ui-button-border-clr] text-center text-sm/4 rounded-full grid-center';
				}
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

			&[data-drop-buyability] {
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

				&:not([data-drop-buyability='1']) {
					&::before {
						--at-apply: 'bg-red/25';
					}

					&::after {
						--at-apply: 'tracking-wide bg-transparent size-auto text-white font-semibold';
						mask: unset;
						-webkit-text-stroke: black 0.15em;
						paint-order: stroke fill;
					}
				}

				&[data-drop-buyability='-1']::after {
					content: 'INVALID';
				}

				&[data-drop-buyability='0']::after {
					content: 'FULL';
				}
			}
		}

		.hover-tooltip.champion-item {
			position-anchor: --scoreboard-item-items;
			inset-block-start: calc(anchor(end) + 4 * var(--spacing));
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
			grid-area: expanded;

			&::details-content {
				--at-apply: 'pt-4 -mt-6 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto_1fr]';
			}

			[data-loading] {
				--at-apply: 'hidden z-10 text-center pt-10 absolute -inset-1 inset-t-1 font-600 text-2xl backdrop-blur-2';
				-webkit-text-stroke: black 0.1em;
				paint-order: stroke fill;
			}

			&[aria-busy='true'] > [data-loading] {
				--at-apply: 'block';
			}

			> summary {
				--at-apply: 'list-none invisible pointer-events-none';
			}

			> section {
				--at-apply: 'h-min';
			}

			> [data-runes-stats],
			> [data-abilities],
			> [data-health-ability-resource] {
				> h4 {
					--at-apply: 'sr-only';
				}
			}

			> [data-runes-stats] {
				--at-apply: 'row-span-3 grid grid-cols-2 grid-rows-2';
				anchor-name: --scoreboard-item-runes-stats;

				> dl {
					--at-apply: 'grid grid-rows-[repeat(4,1.5rem)] items-center whitespace-nowrap bg-cyan-950 b b-[--ui-button-border-clr] p-0.5 w-fit';

					grid-template-columns: 1.25rem 5rem 1.25rem 5rem;

					&:nth-of-type(1) {
						--at-apply: 'row-span-2 b-e-0 self-end relative';

						&:has(> .coming-soon-cover)::before {
							--at-apply: 'content-empty absolute end-0 start-1/2 top-0 bottom-1/2 bg-neutral-950/30';
						}

						> dt:nth-of-type(1) {
							grid-column: 1;
							grid-row: 1;
						}
						> dd:nth-of-type(1) {
							grid-column: 2;
							grid-row: 1;
						}

						> dt:nth-of-type(2) {
							grid-column: 1;
							grid-row: 2;
						}
						> dd:nth-of-type(2) {
							grid-column: 2;
							grid-row: 2;
						}

						> dt:nth-of-type(3) {
							grid-column: 1;
							grid-row: 3;
						}
						> dd:nth-of-type(3) {
							grid-column: 2;
							grid-row: 3;
						}

						> dt:nth-of-type(4) {
							grid-column: 1;
							grid-row: 4;
						}
						> dd:nth-of-type(4) {
							grid-column: 2;
							grid-row: 4;
						}

						> dt:nth-of-type(5) {
							grid-column: 3;
							grid-row: 1;
						}
						> dd:nth-of-type(5) {
							grid-column: 4;
							grid-row: 1;
						}

						> dt:nth-of-type(6) {
							grid-column: 3;
							grid-row: 2;
						}
						> dd:nth-of-type(6) {
							grid-column: 4;
							grid-row: 2;
						}

						> dt:nth-of-type(7) {
							grid-column: 3;
							grid-row: 3;
						}
						> dd:nth-of-type(7) {
							grid-column: 4;
							grid-row: 3;
						}

						> dt:has(> span:last-child) {
							&::before {
								--at-apply: 'content-empty block size-4.5 rounded-full bg-black';
							}
						}
					}

					&:nth-of-type(2) {
						--at-apply: 'b-b-0';
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

				.hover-tooltip.champion-rune,
				.hover-tooltip.champion-stat {
					--at-apply: 'max-w-156';

					position-anchor: --scoreboard-item-runes-stats;
					position-try: flip-block;
					top: calc(anchor(bottom) - 1px);
					justify-self: anchor-center;
				}

				.hover-tooltip.champion-rune {
					.game-description {
						rules {
							--at-apply: 'italic';
						}
					}
				}

				.hover-tooltip.champion-stat {
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
			}

			> [data-abilities] {
				--at-apply: 'gap-x-[--abilities-gap] col-span-2 flex';
				anchor-name: --scoreboard-item-abilities;
				width: var(--abilities-width);
				height: var(--abilities-height);

				[data-passive],
				[data-q],
				[data-w],
				[data-e],
				[data-r] {
					--at-apply: 'relative size-[--ability-size] b b-[--ui-button-border-clr]';

					> h5 {
						--at-apply: 'absolute bottom-0 start-0 leading-[1] -translate-x-1/2 translate-y-1/3 pointer-events-none z-1';

						-webkit-text-stroke: black 0.1em;
						paint-order: stroke fill;
					}
				}

				details[data-empty] & [data-passive] {
					--at-apply: 'b-neutral-400';
				}

				[data-q],
				[data-w],
				[data-e],
				[data-r] {
					--at-apply: 'mb-[calc(var(--ability-level-button-indicator-size)+2*var(--ability-level-button-py))]';

					&[data-level='0'],
					&:not([data-level]) {
						--at-apply: 'b-neutral-400';

						img {
							--at-apply: 'grayscale-70 brightness-80';
						}
					}

					> [role='radiogroup'] {
						--at-apply: 'flex justify-center';

						> button {
							--at-apply: 'py-[--ability-level-button-py] px-0.25';

							&::before {
								--at-apply: 'content-empty block b b-[--ui-button-border-clr] size-[--ability-level-button-indicator-size] rounded-full bg-black mx-auto';
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
					--at-apply: 'size-[--ability-size-passive]';

					> h5 {
						--at-apply: 'sr-only';
					}
				}

				.hover-tooltip.champion-ability {
					position-anchor: --scoreboard-item-abilities;
				}
			}

			> [data-health-ability-resource] {
				--at-apply: 'col-span-2 pt-1.375';

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

						&::-webkit-outer-spin-button,
						&::-webkit-inner-spin-button {
							appearance: none;
						}
					}
				}

				[data-current-health] {
					--fill-bg: theme('colors.green.500');
				}

				[data-current-ability-resource] {
					--fill-bg: theme('colors.blue.500');
				}
			}

			> [data-role-quest] {
				--at-apply: 'relative py-[calc(0.5*(var(--soul-size)-var(--stack-size))+var(--soul-rotation-size-diff))]';
				anchor-name: --scoreboard-item-role-quest;

				> .v-select {
					> select {
						--at-apply: 'rounded-full size-8';
					}

					> select:focus-visible + label {
						outline: none;

						&::before {
							outline: auto;
						}
					}

					> label {
						--at-apply: 'relative flex items-center gap-1 w-fit';

						&::before {
							--at-apply: 'size-8 content-empty rounded-full bg-black';
						}

						> img {
							&:nth-of-type(1) {
								--at-apply: 'size-8 absolute start-0 top-0 rounded-full b b-[--ui-button-border-clr]';
							}

							&:nth-of-type(2) {
								--at-apply: 'size-5';
							}
						}
					}
				}

				.hover-tooltip.role-quest {
					justify-self: anchor-center;
					position-anchor: --scoreboard-item-role-quest;
					top: calc(anchor(bottom));

					> h5:first-letter {
						--at-apply: 'capitalize';
					}

					> ul {
						--at-apply: 'list-disc';

						> li {
							--at-apply: 'ms-4';
						}
					}
				}
			}

			> [data-dragons] {
				--at-apply: 'flex-center mx-auto h-max relative items-center gap-[--gap]';
				--gap: calc(2 * var(--spacing));
				anchor-name: --scoreboard-item-dragons;

				&::before {
					--at-apply: 'absolute top-1/2 -translate-y-1/2 content-empty start-[calc(var(--stack-size)/2)] bg-black h-[calc(var(--stack-size)*0.2)] end-[calc(var(--soul-size)+2*var(--soul-rotation-size-diff)+var(--gap)+var(--stack-size)/2)]';
				}

				> [data-dragon-stack] {
					> select {
						--at-apply: 'rounded-full';
					}

					> label {
						--at-apply: 'size-[--stack-size] grid-center bg-black rounded-full of-hidden';
					}
				}

				> [data-dragon-soul] {
					--at-apply: 'm-[--soul-rotation-size-diff]';

					> select {
						--at-apply: 'size-full rotate-45';
					}

					> label {
						--at-apply: 'size-[--soul-size] grid-center bg-black of-hidden rotate-45';

						> div {
							--at-apply: '-rotate-45 -translate-[calc(var(--soul-rotation-size-diff)/4)]';
						}
					}
				}

				> [data-dragon-stack],
				> [data-dragon-soul] {
					> :last-child {
						--at-apply: 'text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -end-0 -top-0 z-1';

						> span {
							&:nth-child(1) {
								--at-apply: 'sr-only';
							}

							&:nth-child(2) {
								--at-apply: 'size-3';
							}
						}
					}
				}

				.dragon-thing.hover-tooltip {
					--at-apply: 'w-fit max-w-screen fixed whitespace-nowrap';
					top: calc(anchor(bottom));
					position-anchor: --scoreboard-item-dragons;
				}
			}

			> [data-role-quest],
			> [data-dragons] {
				--at-apply: 'self-center';

				> h4 {
					--at-apply: 'absolute top-0 start-0 text-xs uppercase font-medium text-neutral-300 leading-3';
				}
			}

			> [data-extras] {
				--at-apply: 'col-span-full';

				> article {
					--at-apply: 'b b-[--ui-button-border-clr] bg-[--placeholder-champion-bg-clr] p-2 w-fit rounded-md';
				}

				> .number-extra {
					--at-apply: 'grid grid-cols-[auto_auto_min-content_1fr] grid-rows-[min-content_min-content]';

					> img {
						--at-apply: 'row-span-full b b-[--ui-button-border-clr] size-[--ability-size] me-2';
					}

					> label {
						--at-apply: 'col-span-3';
					}

					> input {
						--at-apply: 'box-content h-min w-[6ch] px-1 py-0.5 row-span-2 bg-white text-black me-2';
					}

					> button {
						--at-apply: 'w-12 h-7';
					}
				}
			}
		}
	}
}
</style>
