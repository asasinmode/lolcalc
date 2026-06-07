<script setup lang="ts">
import type { DamageSource, IComputedAppliedEffect } from '@lolcalc/core/DamageSource';
import type { IEffectAbilityId, IGameAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IChampionId, IDragonName, IRunePathName, IRuneShardSlotName, IRuneSlotName } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStatName, INonPassiveAbilityKey } from '@lolcalc/shared';
import type { IChampionRole } from '@lolcalc/shared/types';
import type { IExtraComponentEmits } from '~/utils/types';
import { calculateResistPercentageReduction } from '@lolcalc/core/calculate/damage';
import { formatChampionStatValue, isMasterworkSlot } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { cooldownReductionPercentageFromHaste } from '@lolcalc/core/specifics/champion';
import { replaceGameIcons, replaceGameVariables } from '@lolcalc/core/variables/game';
import { replaceStringtableVariables } from '@lolcalc/core/variables/stringtable';
import { ALL_DRAGON_NAMES, CHAMPION_IMAGES, ICON_GOLD, ICON_RUNE_SRC, MISC, PATCH_VERSION, RUNE_SLOT_NAME_TO_NUMBER, RUNES, TEXT, UI } from '@lolcalc/data';
import { SHAPESHIFTING_CHAMPION_IDS } from '@lolcalc/data/meta';
import { ABILITY_TYPE, CHAMPION_STAT_META } from '@lolcalc/shared';
import { CHAMPION_COMPONENTS } from '~/components/Champion';
import { ITEM_COMPONENTS } from '~/components/Item';

type IShowTooltipEventArgs = IExtraComponentEmits['imgMouseenter'];

const props = defineProps<{
	index: number;
	value: DamageSource;
	/** side of the scoreboard it's on, left (damage sources) by default */
	isRight?: boolean;
	canRemove?: boolean;
	canMoveDown?: boolean;
	/** if `true` and is first item, will be expanded */
	expandOnMounted?: boolean;
}>();

const emit = defineEmits<{
	clear: [];
	remove: [];
	duplicate: [shift: boolean];
	changeGroup: [alt: boolean];
	move: [toIndex: number, alt: boolean];
	dragstart: [event: DragEvent, isDuplicate: boolean];
	itemListDragenter: [event: DragEvent];
	itemListDragover: [event: DragEvent];
	itemListDragleave: [event: DragEvent];
	itemListDrop: [event: DragEvent, slotIndex: number | undefined];
	itemDragstart: [event: DragEvent, slotIndex: number];
	mounted: [];
}>();

const enableUnimplementedUi = useEnableUnimplementedUi();
const highlightedDamageSources = useHighlightedDamageSources();
const { championImage, abilityImage, abilityImageSize, championImageSize } = CHAMPION_IMAGES;
const { vSemver, vMinor } = PATCH_VERSION;
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelect();
const { selectItems } = useItemShop();
const { selectEffects } = useEffectsDialog();
const { openDebugDialog } = useDamageSourceDebug();
const globalKeyModifiers = useGlobalKeyModifiers();

const el = useTemplateRef('el');

const iconButtonsShowText = useIconButtonsShowText();

const group = computed(() => props.isRight ? 'targets' : 'sources');
const otherGroup = computed(() => props.isRight
	? iconButtonsShowText.value ? 'left' : 'sources'
	: iconButtonsShowText.value ? 'right' : 'targets',
);
const isLoading = computed(() => Boolean(!props.value.champion.value && props.value.listedChampion.value));

const idPrefix = computed(() => `${group.value}-${props.index}`);

const imageSizes = computed(() => {
	let champion = 128;
	let ability = 64;

	if (props.value.champion.value?.id) {
		champion = championImageSize(props.value.champion.value.id);
		ability = abilityImageSize(props.value.champion.value.id);
	}

	return { champion, ability };
});

const runePathPrimary = computed(() => {
	const { primary, primarySlots } = props.value.runes.value.paths;
	if (primarySlots[0]) {
		const { icon } = RUNES.paths[primary].slots[0]![primarySlots[0]]!;
		const { name } = TEXT.runes.slots[primarySlots[0]!]!;
		const { name: pathName } = TEXT.runes.paths[primary]!;
		return {
			icon: `https://raw.communitydragon.org/${vMinor}/game/${icon}`,
			name,
			pathName,
		};
	}
	return undefined;
});

const runePathSecondary = computed(() => {
	const { secondary } = props.value.runes.value.paths;
	if (secondary) {
		const { iconColor } = RUNES.paths[secondary]!;
		const { name } = TEXT.runes.paths[secondary]!;
		return {
			icon: `https://raw.communitydragon.org/${vMinor}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
			name,
		};
	}
	return undefined;
});

const isFirstAndOnly = computed(() => props.index === 0 && !props.canMoveDown);

function emitClear() {
	secondStepRemove();
}

function emitRemove() {
	if (globalKeyModifiers.value.shift) {
		emit('clear');
	} else {
		secondStepRemove();
	}
}

const undoRemoveButton = useTemplateRef('undoRemoveButton');

function secondStepRemove() {
	if (props.value.anythingFilled.value) {
		undoRemoveButton.value!.style.display = 'grid';
		undoRemoveButton.value!.focus();
		undoRemoveButton.value!.addEventListener('focusout', removeAndFocusNext);
		el.value!.addEventListener('mouseleave', removeAndFocusNext);
	} else {
		removeAndFocusNext();
	}
}

function undoRemove() {
	el.value!.removeEventListener('mouseleave', removeAndFocusNext);
	undoRemoveButton.value!.removeEventListener('focusout', removeAndFocusNext);
	undoRemoveButton.value!.style.display = 'none';
	(undoRemoveButton.value!.nextElementSibling as HTMLButtonElement)?.focus();
}

function removeAndFocusNext() {
	const nextElement = el.value!.nextElementSibling;
	if (isFirstAndOnly.value) {
		emit('clear');
		undoRemoveButton.value!.style.display = 'none';
		el.value!.removeEventListener('mouseleave', removeAndFocusNext);
		undoRemoveButton.value!.removeEventListener('focusout', removeAndFocusNext);
	} else {
		emit('remove');
	}
	nextTick(() => {
		nextElement?.querySelector('button')?.focus();
	});
}

const removeButtonAttrs = computed(() => (isFirstAndOnly.value
	? {
			title: 'clear',
			disabled: !props.value.anythingFilled.value,
			emit: emitClear,
		}
	: {
			title: 'remove',
			subtext: 'shift+click to clear',
			disabled: !props.canRemove,
			emit: emitRemove,
		}));

const detailsContainer = useTemplateRef('details');
const isExpanded = ref(false);

function toggleExpanded() {
	if (detailsContainer.value!.getAttribute('open') === null) {
		detailsContainer.value!.setAttribute('open', '');
	} else {
		detailsContainer.value!.removeAttribute('open');
	}
}

onMounted(() => {
	props.expandOnMounted && toggleExpanded();
	isExpanded.value = detailsContainer.value?.getAttribute('open') !== null;
	emit('mounted');
});

const effectsEl = useTemplateRef('effects');
const effectsListEl = useTemplateRef('effectsList');
const abiltiesEl = useTemplateRef('abilities');
const healthAbilityResourceEl = useTemplateRef('healthAbilityResource');
const roleQuestEl = useTemplateRef('roleQuest');
const dragonsEl = useTemplateRef('dragons');
const extrasEl = useTemplateRef('extras');

function doubleClickToggle(event: MouseEvent) {
	if ([
		event.currentTarget,
		detailsContainer.value,
		effectsEl.value,
		effectsListEl.value,
		abiltiesEl.value,
		healthAbilityResourceEl.value,
		roleQuestEl.value,
		dragonsEl.value,
		extrasEl.value,
	].includes(event.target)) {
		toggleExpanded();
		event.preventDefault();
	};
}

const { addItemTooltipViewListeners, removeItemTooltipViewListeners } = useItemHoverTooltipView('Inventory');
const itemHoverTooltip = useTemplateRef('itemHoverTooltip');
const hoveredItemIndex = ref<number>();

function showItemHoverTooltip(event: MouseEvent, index: number, fromExtras = false) {
	hoveredItemIndex.value = index;
	event.target?.addEventListener('mouseleave', leaveTooltipableItemElement, { passive: true, once: true });
	addItemTooltipViewListeners();

	if (fromExtras) {
		el.value!.setAttribute('data-item-tooltip-extras', '');
	} else {
		el.value!.removeAttribute('data-item-tooltip-extras');
	}

	itemHoverTooltip.value?.showPopover();
}

function leaveTooltipableItemElement() {
	itemHoverTooltip.value?.hidePopover();
	el.value!.removeAttribute('data-item-tooltip-extras');
	removeItemTooltipViewListeners();
}

function removeItem(event: MouseEvent, index: number) {
	if (props.value.items.value[index]) {
		event.preventDefault();
		props.value.removeItem(index);
		if (props.value.items.value[index]) {
			showItemHoverTooltip(event, index);
		} else {
			itemHoverTooltip.value?.hidePopover();
		}
	}
}

function startItemDrag(event: DragEvent, index: number) {
	itemHoverTooltip.value?.hidePopover();
	emit('itemDragstart', event, index);
}

const championExtra = computed<[Component, IGameAbilityId][]>((): [Component, IGameAbilityId][] => {
	if (props.value.champion.value) {
		const component = CHAMPION_COMPONENTS[props.value.champion.value.id as IChampionId]?.extras;

		return component
			? (Array.isArray(component) ? component : [component]).map(c =>
					// TODO handle other abilities components, dont hardcode everything to passive
					[markRaw(c), GameAbilityId.build(ABILITY_TYPE.champion, props.value.champion.value!.id, 'passive', props.value.abilityVariantsIndexes.value.passive)])
			: [];
	}
	return [];
});

type IItemComponent = [is: Component, itemId: string, itemIndex: number];
const itemExtras = computed<IItemComponent[]>(() => props.value.items.value.flatMap((item, index) => {
	const component = item && ITEM_COMPONENTS[item.id]?.extras;
	if (component) {
		const components = Array.isArray(component) ? component : [component];
		return components.map(c => [markRaw(c), item.id, index]);
	}
	return [];
}) as [is: Component, itemId: string, itemIndex: number][]);

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
	const shardDescriptions = Object.entries(shards).map(([shardSlot, shardValue]) => {
		if (!shardValue) {
			return 'unset';
		}

		const rune = (RUNES.shards[shardSlot as IRuneShardSlotName] as any)[shardValue as string];

		const { replaced: stringtableVariableReplaced, unknownStringtableVariables: unknownSV } = replaceStringtableVariables(
			TEXT.runes.shards.slotValues[shardValue as string]!.tooltipStats,
			TEXT.stringtable,
			props.value?.computed.variables.value.runes.shards[shardSlot as IRuneShardSlotName],
		);

		const { replaced, unknownVariables: unknownV } = replaceGameVariables(
			stringtableVariableReplaced,
			'rune',
			{ rune, damageSource: props.value, dynamicVariables: props.value?.computed.variables.value.runes.shards[shardSlot as IRuneShardSlotName] },
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
			icon: ICON_RUNE_SRC,
			iconDimensions: 80,
		}]);
});

function getRuneText(slotName: IRuneSlotName, slotNumber: number, path: IRunePathName, isPrimary: boolean): IChampionRune {
	const rune = RUNES.paths[path].slots[isPrimary ? slotNumber : RUNE_SLOT_NAME_TO_NUMBER[slotName]!]![slotName]!;
	const { name, tooltipStats } = TEXT.runes.slots[slotName]!;

	const icon = `https://raw.communitydragon.org/${vMinor}/game/${rune.icon}`;

	const { replaced: stringtableVariableReplaced, unknownStringtableVariables: unknownSV } = replaceStringtableVariables(
		tooltipStats,
		TEXT.stringtable,
	);

	const { replaced, unknownVariables: unknownV } = replaceGameVariables(
		stringtableVariableReplaced,
		'rune',
		{ rune, damageSource: props.value },
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
	iconTextureKey: keyof (typeof UI)['playerStats'];
	description: string;
	values: {
		stat: IChampionStatName;
		/** if not present, `CHAMPION_STAT_META[stat].name` will be used */
		name?: string;
		base?: number;
		bonus: number;
		valueSuffix?: string;
	}[];
	displayedValue: string;
	bottomText?: string;
}

const minorStats = computed<IChampionStat[]>(() => {
	const minorStats = [
		{
			name: 'Health | Resource Regeneration',
			description: 'The amount of <scalehealth>Health</scalehealth> you regenerate over 5 seconds.<br/><br/>The amount of Ability resource you regenerate over 5 seconds (usually <scalemana>Mana</scalemana> or <scaleenergy>Energy</scaleenergy>).',
			iconTextureKey: 'healthResourceRegen',
			values: [
				{
					stat: 'hpRegen',
					name: 'Health Regen',
				},
				{
					stat: 'manaRegen',
					name: 'Resource Regen',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.healShieldPower.name,
			description: 'Increases the effectiveness of <healing>Heals</healing> and <shields>Shields</shields>.',
			iconTextureKey: 'healShieldPower',
			values: [
				{
					stat: 'healShieldPower',
				},
			],
		},
		{
			name: 'Lethality | Armor Penetration',
			description: 'Ignores an amount of your target\'s <scalearmor>Armor</scalearmor> when applying <physicaldamage>physical damage</physicaldamage>.<br><br><scalelethality>Lethality</scalelethality> ignores a flat amount, <scalelethality>Armor Penetration</scalelethality> ignores a percentage amount',
			iconTextureKey: 'armorPen',
			values: [
				{
					stat: 'lethality',
				},
				{
					name: 'Armor Penetration',
					stat: 'percentArmorPen',
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
					stat: 'flatMagicPen',
				},
				{
					name: 'Magic Penetration',
					stat: 'percentMagicPen',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.lifeSteal.name,
			description: 'Returns a portion of the damage you deal with Attacks as <scalehealth>Health</scalehealth>.',
			iconTextureKey: 'lifeSteal',
			values: [
				{
					stat: 'lifeSteal',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.omnivamp.name,
			description: 'Returns a portion of all damage you deal as <scalehealth>Health</scalehealth>.<br><br><br>Reduced to 20% effectiveness when dealing damage to minions or monsters.',
			iconTextureKey: 'omnivamp',
			values: [
				{
					stat: 'omnivamp',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.attackRange.name,
			description: 'The distance at which you can Attack.',
			iconTextureKey: 'attackRange',
			values: [
				{
					stat: 'attackRange',
					valueSuffix: 'units',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.tenacity.name,
			description: 'Reduces the duration of crowd control debuffs, such as <keyword>Slows</keyword> and <keyword>Stuns</keyword>.<br><br>Does not affect <keyword>Airborne</keyword> and <keyword>Suppression</keyword>.',
			iconTextureKey: 'tenacity',
			values: [
				{
					stat: 'tenacity',
				},
			],
		},
	] as IChampionStat[];

	updateComputedStats(minorStats);

	return minorStats;
});

const majorStats = computed<IChampionStat[]>(() => {
	const majorStats = [
		{
			name: CHAMPION_STAT_META.attackDamage.name,
			description: 'The amount of <physicaldamage>physical damage</physicaldamage> your Attack deal.<br><br><br>Also increases the amount of damage you deal with certain Abilities.',
			iconTextureKey: 'attackDamage',
			values: [
				{
					stat: 'attackDamage',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.abilityPower.name,
			description: 'Increases the amount of damage you deal with most Abilities.',
			iconTextureKey: 'abilityPower',
			values: [
				{
					stat: 'abilityPower',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.armor.name,
			description: 'Reduces the amount of <physicaldamage>physical damage</physicaldamage> you take.',
			iconTextureKey: 'armor',
			values: [
				{
					stat: 'armor',
				},
			],
			bottomText: `You take <span data-total="">${Math.round(calculateResistPercentageReduction(props.value.stats.value.total.armor) * 100)}</span>% reduced physical damage.`,
		},
		{
			name: CHAMPION_STAT_META.magicResist.name,
			description: 'Reduces the amount of <magicdamage>magic damage</magicdamage> you take.',
			iconTextureKey: 'magicResist',
			values: [
				{
					stat: 'magicResist',
				},
			],
			bottomText: `You take <span data-total="">${Math.round(calculateResistPercentageReduction(props.value.stats.value.total.magicResist) * 100)}</span>% reduced magic damage.`,
		},
		{
			name: CHAMPION_STAT_META.attackSpeed.name,
			description: 'Increases the rate at which you can Attack.<br><br><br>Ratio determines the effectiveness of bonus Attack Speed.',
			iconTextureKey: 'attackSpeed',
			values: [
				{
					stat: 'bonusAttackSpeedPercent',
				},
				{
					name: 'Attacks per second',
					stat: 'attackSpeed',
				},
				{
					name: 'Ratio',
					stat: 'attackSpeedRatio',
				},
			],
			displayedValue: props.value.stats.value.total.attackSpeed.toFixed(2),
		},
		{
			name: CHAMPION_STAT_META.abilityHaste.name,
			description: 'Allows you to cast your Abilities more often',
			iconTextureKey: 'abilityHaste',
			values: [
				{
					name: 'Current Ability Haste',
					stat: 'abilityHaste',
				},
			],
			bottomText: `Equivalent to reducing your Ability cooldowns by <span data-total="">${Math.round(cooldownReductionPercentageFromHaste(props.value.stats.value.total.abilityHaste))}</span>%`,
		},
		{
			name: CHAMPION_STAT_META.critChance.name,
			description: 'Grants a change to deal 100% increased damage on each Attack.',
			iconTextureKey: 'crit',
			values: [
				{
					stat: 'critChance',
				},
			],
		},
		{
			name: CHAMPION_STAT_META.moveSpeed.name,
			description: 'The speed at which you travel.',
			iconTextureKey: 'moveSpeed',
			values: [
				{
					stat: 'moveSpeed',
					valueSuffix: 'units per second',
				},
			],
		},
	] as IChampionStat[];

	updateComputedStats(majorStats);

	return majorStats;
});

function updateComputedStats(stats: IChampionStat[]) {
	for (const championStat of stats) {
		const displayedValue: string[] = [];

		for (let i = 0; i <= championStat.values.length - 1; i++) {
			const value = championStat.values[i]!;
			let formattedTotal = props.value.computed.formattedStatTotals.value[value.stat];

			if (CHAMPION_STAT_META[value.stat].maxDisplayed) {
				formattedTotal = Math.min(CHAMPION_STAT_META[value.stat].maxDisplayed!, formattedTotal);
			}

			displayedValue.push(`${formattedTotal}${CHAMPION_STAT_META[value.stat].isPercentage ? '%' : ''}`);

			value.bonus = formatChampionStatValue(value.stat, props.value.stats.value.bonus[value.stat]);

			const baseValue = props.value.stats.value[value.stat === 'bonusAttackSpeedPercent' ? 'base' : 'baseOnLevel'][value.stat];
			if (baseValue) {
				value.base = formatChampionStatValue(value.stat, baseValue);
			}
		}

		championStat.displayedValue ||= displayedValue.join(' | ');
	}
}

const updateChampionHealth = useNumberInput(props.value.currentHealth, true, props.value.maxHealth);
const updateChampionAbilityResource = useNumberInput(props.value.currentAbilityResource, true, props.value.maxAbilityResource);

const healthBarEl = useTemplateRef('healthBar');
const {
	onMousedown: startHealthBarDrag,
	cleanup: healthBarCleanup,
	dragValueRef: healthDragValueRef,
} = healthResourceSliderEvents(props.value.currentHealth, props.value.maxHealth, healthBarEl);
const resourceBarEl = useTemplateRef('resourceBar');
const {
	onMousedown: startAbilityResourceBarDrag,
	cleanup: abilityResourceBarCleanup,
	dragValueRef: abilityResourceDragValueRef,
} = healthResourceSliderEvents(props.value.currentAbilityResource, props.value.maxAbilityResource, resourceBarEl);

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

	const dragValueRef = ref(target.value);
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

	function updateValue(mousePosition: number) {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		const { left, right } = element.value!.getBoundingClientRect();
		mousePosition = Math.max(left, Math.min(right, mousePosition));
		const fillPercentage = (mousePosition - left) / (right - left);
		const value = Math.max(0, Math.min(max.value, Math.round(fillPercentage * max.value)));
		dragValueRef.value = value;

		debounceTimeout = setTimeout(() => {
			target.value = value;
			debounceTimeout = undefined;
		}, 500);
	}

	const watchHandle = watch(target, (value) => {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
			debounceTimeout = undefined;
		}
		dragValueRef.value = value;
	});

	onBeforeUnmount(() => watchHandle());

	return { onMousedown, cleanup, dragValueRef };
}

function resetAbilityLevel(event: MouseEvent, ability: INonPassiveAbilityKey) {
	event.preventDefault();
	// eslint-disable-next-line vue/no-mutating-props
	props.value.abilityLevels.value[ability] = 0;
}

type ITooltipSource = '' | 'extras' | 'effects';

function showGameAbilityTooltip(source: ITooltipSource, ...[event, abilityId]: IShowTooltipEventArgs) {
	if (abilityId.type === 'champion') {
		showAbilityTooltip(event, abilityId.abilityKey, abilityId.abilityVariantIndex, source === 'extras');
	} else {
		console.warn('[showGameAbilityTooltip] did not expect it to be used for item?');
	}
}

const hoveredAbilityKey = ref<IChampionAbilityKey>();
const hoveredAbilityVariantIndex = ref<number>();
const abilityHoverTooltipEl = useTemplateRef('championAbilityHoverTooltip');

function showAbilityTooltip(
	event: MouseEvent,
	key: IChampionAbilityKey,
	variantIndex?: number,
	fromExtras = false,
) {
	hoveredAbilityKey.value = key;
	hoveredAbilityVariantIndex.value = variantIndex ?? props.value.abilityVariantsIndexes.value[key];
	event.target?.addEventListener('mouseleave', hideAbilityTooltip, { passive: true, once: true });

	if (fromExtras) {
		detailsContainer.value!.setAttribute('data-ability-tooltip-extras', '');
	} else {
		detailsContainer.value!.removeAttribute('data-ability-tooltip-extras');
	}

	abilityHoverTooltipEl.value?.el?.showPopover();
}

function hideAbilityTooltip() {
	abilityHoverTooltipEl.value?.el?.hidePopover();
	detailsContainer.value!.removeAttribute('data-ability-tooltip-extras');
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
	const ability = MISC.dragons[dragonName][abilityName];
	const string = TEXT.dragons[dragonName][abilityName];
	const isStack = abilityName === 'stack';

	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceStringtableVariables(string);

	const { replaced, unknownVariables } = replaceGameVariables(
		stringtableReplaced,
		'championAbility',
		{ abilityVariant: ability, allAbilitiesVariants: [MISC.dragons[dragonName].stack, MISC.dragons[dragonName].soul] },
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
		description: replaceGameIcons(replaced),
		anyUnknown: unknownStringtableVariables.size || unknownVariables.length,
		invalid,
	};
});

const activeEffects = computed<[IComputedAppliedEffect, number][]>(() =>
	props.value.computed.effects.value
		.map((effect, index) => [effect, index] as unknown as [IComputedAppliedEffect, number])
		.filter(([effect]) => effect.isActive),
);

const hoveredEffectId = shallowRef<IEffectAbilityId>();
const effectHoverTooltipEl = useTemplateRef('effectHoverTooltip');

function showEffectTooltip(event: MouseEvent, effect: IComputedAppliedEffect) {
	hoveredEffectId.value = effect.abilityId;
	event.target?.addEventListener('mouseleave', hideEffectTooltip, { passive: true, once: true });
	effect.specific.sourceAbility.type === ABILITY_TYPE.item && addItemTooltipViewListeners();
	effectHoverTooltipEl.value?.el?.showPopover();
}

function hideEffectTooltip() {
	effectHoverTooltipEl.value?.el?.hidePopover();
	removeItemTooltipViewListeners();
}

function modifyEffectValue(effectIndex: number, by: 1 | -1) {
	const effect = props.value.appliedEffects.value[effectIndex]!;
	const computedEffect = props.value.computed.effects.value[effectIndex]!;

	const min = computedEffect.specific.minValue ?? 0;
	const max = computedEffect.maxValue;

	if (globalKeyModifiers.value.ctrl) {
		if (globalKeyModifiers.value.shift) {
			effect.data[0] = by < 0
				/* this branch doesn't happen, right click + ctrl + shift is hijacked by the browser and the event doesn't fire, potential TODO */
				? min
				: max === undefined
					? effect.data[0] + 100
					: max;
		} else {
			effect.data[0] = by < 0
				? computedEffect.specific.minValue === 0 || computedEffect.maxValue !== undefined ? Math.max(min, effect.data[0] - 10) : min
				: max === undefined
					? effect.data[0] + 10
					: Math.min(max, effect.data[0] + 10);
		}
	} else {
		effect.data[0] = Math.max(min, max !== undefined ? Math.min(max, effect.data[0] + by) : (effect.data[0] + by));
	}
	nextTick(() => {
		if (!effect.data[0] && hoveredEffectId.value === effect.abilityId) {
			hideEffectTooltip();
		}
	});
}

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
		@dblclick="doubleClickToggle"
		@mouseenter="highlightedDamageSources.add(value.id)"
		@focusin="highlightedDamageSources.add(value.id)"
		@mouseleave="highlightedDamageSources.remove(value.id)"
		@focusout="highlightedDamageSources.remove(value.id)"
	>
		<h3>
			{{ group.slice(0, -1) }} {{ index + 1 }}{{ value.listedChampion.value ? ` (${value.listedChampion.value.name})` : '' }}
		</h3>
		<button
			:title="`${iconButtonsShowText ? '' : 'move up, '}alt+click to duplicate above`"
			class="pretend-ui-btn"
			:disabled="index === 0"
			draggable="true"
			@click="$emit('move', index + (globalKeyModifiers.alt ? 0 : -1), globalKeyModifiers.alt)"
			@dragstart="$emit('dragstart', $event, globalKeyModifiers.alt)"
		>
			<span>move up <span>(alt+click to duplicate above)</span></span>
			<Icon class="i-ph:arrow-up" />
		</button>
		<button
			:title="`${iconButtonsShowText ? '' : 'move down, '}alt+click to duplicate below`"
			class="pretend-ui-btn"
			:disabled="!canMoveDown"
			draggable="true"
			@click="$emit('move', index + 1, globalKeyModifiers.alt)"
			@dragstart="$emit('dragstart', $event, globalKeyModifiers.alt)"
		>
			<span>move down <span>(alt+click to duplicate below)</span></span>
			<Icon class="i-ph:arrow-down" />
		</button>
		<button
			:title="`${iconButtonsShowText ? '' : `move to ${otherGroup}, `}alt+click to duplicate ${iconButtonsShowText ? otherGroup : `into ${otherGroup}`}`"
			class="pretend-ui-btn"
			draggable="true"
			:disabled="!canRemove && !value.anythingFilled.value"
			@click="$emit('changeGroup', globalKeyModifiers.alt)"
			@dragstart="$emit('dragstart', $event, globalKeyModifiers.alt)"
		>
			<span>move {{ iconButtonsShowText ? otherGroup : `to ${otherGroup}` }} <span>(alt+click to duplicate {{ iconButtonsShowText ? otherGroup : `to ${otherGroup}` }})</span></span>
			<Icon :class="isRight ? 'i-ph:arrow-left' : 'i-ph:arrow-right'" />
		</button>
		<button
			:title="`${iconButtonsShowText ? '' : 'duplicate, '}shift+click to duplicate ${iconButtonsShowText ? otherGroup : `into ${otherGroup}`}`"
			class="pretend-ui-btn"
			:disabled="!canRemove && !value.anythingFilled.value"
			draggable="true"
			@click="$emit('duplicate', globalKeyModifiers.shift)"
			@dragstart="$emit('dragstart', $event, true)"
		>
			<span>duplicate<span>(shift+click to duplicate {{ iconButtonsShowText ? otherGroup : `into ${otherGroup}` }})</span></span>
			<Icon class="i-ph:copy" />
		</button>
		<div data-select-champion="">
			<button
				title="select champion"
				@click="selectChampion(value.listedChampion)"
			>
				<span>
					{{ value.listedChampion.value ? `selected champion: ${value.listedChampion.value.name}` : 'select champion' }}
				</span>
				<img
					v-if="value.listedChampion.value"
					:src="championImage(value.listedChampion.value.image, value.listedChampion.value.id)"
					loading="lazy"
					:width="imageSizes.champion"
					:height="imageSizes.champion"
					style="--focus-brightness: 1.2"
				>
				<img
					v-else
					:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
					width="256"
					height="256"
					style="--focus-brightness: 1.5"
				>
			</button>
			<VSelect
				:id="`${idPrefix}-level-select`"
				label="level"
				:model-value="value.level.value as unknown as string"
				data-select-champion-level=""
				:options="Array.from({ length: value.maxLevel.value }, (_, i) => [i + 1, (i + 1).toString()])"
				@update:model-value="value.level.value = Number.parseInt($event!)"
			>
				<span>{{ value.level.value }}</span>
			</VSelect>
		</div>
		<button
			:title="value.runesInvalid.value ? 'runes (invalid)' : 'runes'"
			data-select-runes=""
			class="other-ui-btn"
			@click="selectRunes(value.runes)"
		>
			<span>{{ value.runePathsEmpty ? 'select runes' : 'runes' }}</span>
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
				:src="ICON_RUNE_SRC"
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
		<button data-select-items="" class="other-ui-btn" @click="selectItems(value)">
			items
			<img
				v-bind="ICON_GOLD"
				aria-hidden="true"
				loading="lazy"
			>
		</button>
		<ul
			:data-role-quest="value.roleQuest.value"
			@click="selectItems(value)"
			@dragenter="$emit('itemListDragenter', $event)"
			@dragover="$emit('itemListDragover', $event)"
			@dragleave="$emit('itemListDragleave', $event)"
			@drop="$emit('itemListDrop', $event, undefined)"
		>
			<li
				v-for="i in 7"
				:key="i"
				@drop.stop="$emit('itemListDrop', $event, i - 1)"
			>
				<component
					:is="value.items.value[i - 1] ? 'button' : 'div'"
					:draggable="value.items.value[i - 1] ? 'true' : undefined"
					:class="{ active: value.coComputed.itemImage.value[i - 1]?.isActive }"
					v-bind="typeof value.coComputed.itemImage.value[i - 1]?.isActive === 'object' ? {
						'data-active-0': (value.coComputed.itemImage.value[i - 1]!.isActive as number[])[0] ? 'true' : '',
						'data-active-1': (value.coComputed.itemImage.value[i - 1]!.isActive as number[])[1] ? 'true' : '',
					} : undefined"
					:data-masterwork="isMasterworkSlot(value, i - 1) ? '' : undefined"
					@mouseenter="value.items.value[i - 1] && showItemHoverTooltip($event, i - 1)"
					@click.right="removeItem($event, i - 1)"
					@dragstart="startItemDrag($event, i - 1)"
				>
					<span>{{ value.items.value[i - 1]?.name || `item ${i}` }}</span>
					<img
						v-if="value.items.value[i - 1]"
						:src="`https://ddragon.leagueoflegends.com/cdn/${vSemver}/img/item/${value.items.value[i - 1]!.image}`"
						width="64"
						height="64"
						loading="lazy"
					>
					<span v-if="value.coComputed.itemImage.value[i - 1]?.text">
						<span>{{ value.computed.itemSpecifics.value[i - 1]!.specific.imgTextLabel }}:</span>
						{{ value.coComputed.itemImage.value[i - 1]!.text }}
					</span>
				</component>
			</li>
		</ul>
		<article ref="itemHoverTooltip" popover="manual" class="hover-tooltip champion-item">
			<LolItemDescription
				:precomputed-description="hoveredItemIndex !== undefined ? value.computed.items.value[hoveredItemIndex] : undefined"
				source="Inventory"
				hover-tooltip
			/>
		</article>
		<button ref="undoRemoveButton" style="display: none" @click="undoRemove">
			restore
		</button>
		<button
			:title="`${iconButtonsShowText ? '' : `${removeButtonAttrs.title}${removeButtonAttrs.subtext ? ', ' : ''}`}${removeButtonAttrs.subtext ?? ''}`"
			class="pretend-ui-btn remove"
			:disabled="removeButtonAttrs.disabled"
			@click="removeButtonAttrs.emit"
		>
			<span>{{ removeButtonAttrs.title }} <span v-show="removeButtonAttrs.subtext">({{ removeButtonAttrs.subtext }})</span></span>
			<Icon class="i-ph:trash size-5" />
		</button>
		<button
			:title="iconButtonsShowText ? undefined : (isExpanded ? 'collapse' : 'expand')"
			class="pretend-ui-btn"
			:aria-controls="`${idPrefix}-details`"
			:aria-expanded="isExpanded"
			@click="toggleExpanded"
		>
			<span>{{ isExpanded ? 'collapse' : 'expand' }}</span>
			<Icon class="i-ph:caret-down size-5" />
		</button>
		<details
			:id="`${idPrefix}-details`"
			ref="details"
			:aria-busy="isLoading"
			:data-empty="!value.champion.value ? '' : undefined"
			@toggle="isExpanded = $event.newState === 'open'"
		>
			<summary>
				details
			</summary>
			<h4 data-loading="">
				loading...
			</h4>
			<section data-runes="" :inert="isLoading" @click="selectRunes(value.runes)">
				<h4>runes</h4>
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
					<ComingSoonCover feature="rune paths" class="text-xs px-1 end-1/2 start-0 inset-y-0 absolute" />
				</dl>
				<article ref="championRuneTooltip" class="hover-tooltip champion-rune" popover="manual">
					<h5>{{ hoveredRune?.name }}</h5>
					<p class="game-description" v-html="hoveredRune?.description" />
					<UnresolvedVariablesAlert v-if="hoveredRune?.anyUnknownVariables" />
				</article>
			</section>
			<section data-stats="" :inert="isLoading" @dblclick.ctrl="openDebugDialog(value)">
				<h4>stats</h4>
				<dl
					v-for="(stats, statKindIndex) in [minorStats, majorStats]"
					:key="statKindIndex"
				>
					<template v-for="stat in stats" :key="stat.name">
						<dt @mouseenter="showStatTooltip($event, stat)" @mouseleave="hideStatTooltip">
							<span>{{ stat.name }}</span>
							<img v-bind="textureBgImageAttrs(UI.playerStats[stat.iconTextureKey]!, 20)">
						</dt>
						<dd
							:data-has-bonus="stat.values.some(statValue => statValue.bonus) || undefined"
							@mouseenter="showStatTooltip($event, stat)"
							@mouseleave="hideStatTooltip"
						>
							{{ stat.displayedValue }}
						</dd>
					</template>
				</dl>
				<article ref="championStatTooltip" class="hover-tooltip champion-stat" popover="manual">
					<h5>{{ hoveredStat?.name }}</h5>
					<p class="game-description" v-html="hoveredStat?.description" />
					<dl>
						<template v-for="(statValue, valueIndex) in hoveredStat?.values" :key="valueIndex">
							<dt>{{ statValue.name ?? CHAMPION_STAT_META[statValue.stat].name }}:</dt>
							<dd :data-has-bonus="statValue.bonus || undefined">
								<span data-total="">{{
									CHAMPION_STAT_META[statValue.stat].maxDisplayed
										? Math.min(CHAMPION_STAT_META[statValue.stat].maxDisplayed!, value.computed.formattedStatTotals.value[statValue.stat])
										: value.computed.formattedStatTotals.value[statValue.stat]
								}}</span>{{ CHAMPION_STAT_META[statValue.stat].isPercentage ? '%' : '' }}
								<template v-if="'base' in statValue && !(statValue.stat === 'attackSpeed' || statValue.stat === 'attackSpeedRatio')">
									(<span data-base="">{{ statValue.base }}</span> base + <span data-bonus="">{{ statValue.bonus }}</span> bonus)
								</template>
								{{ statValue.valueSuffix }}
							</dd>
							<br v-if="valueIndex !== ((hoveredStat?.values.length || 1) - 1)">
						</template>
					</dl>
					<p v-if="hoveredStat?.bottomText" :data-has-bonus="hoveredStat?.values.some(v => v.bonus) || undefined" v-html="hoveredStat?.bottomText" />
				</article>
			</section>
			<section
				ref="effects"
				data-effects=""
				:inert="isLoading"
				:style="`--effects-number: ${value.computed.effects.value.filter(effect => effect.isActive).length}`"
			>
				<h4>effects</h4>
				<button class="other-ui-btn" @click="selectEffects(value)">
					effects
					<img v-bind="textureBgImageAttrs(UI.practiceTool.statusEffect, 24)">
				</button>
				<ul ref="effectsList">
					<li
						v-for="[effect, effectIndex] in activeEffects"
						:key="effect.abilityId.id"
						@mouseenter="showEffectTooltip($event, effect)"
					>
						<span>{{ effect.specific.label }}</span>
						<button @click="modifyEffectValue(effectIndex, 1)" @click.right.prevent="modifyEffectValue(effectIndex, -1)">
							<img
								v-show="effect.imgSrc"
								:src="effect.imgSrc"
								:width="effect.imgSize"
								:height="effect.imgSize"
								loading="lazy"
							>
							<span v-if="effect.specific.imgText" v-show="effect.imgText">
								{{ effect.imgText }}
							</span>
						</button>
					</li>
				</ul>
				<LolEffectHoverTooltip
					ref="effectHoverTooltip"
					:ability-id="hoveredEffectId"
				/>
			</section>
			<section ref="abilities" data-abilities="" :inert="isLoading">
				<h4>abilties</h4>
				<ChampionApheliosAbilities
					v-if="value.listedChampion.value?.id === 'Aphelios'"
					:id-prefix
					:value
					:is-loading
					@ability-hover="(...args: IShowTooltipEventArgs) => showGameAbilityTooltip('', ...args)"
				/>
				<template v-else>
					<div data-passive="">
						<h5>passive</h5>
						<img
							v-show="!isLoading && value.champion.value"
							:src="value.champion.value ? abilityImage(value.champion.value.abilities.passive.variants[value.abilityVariantsIndexes.value.passive]!.image, value.champion.value.id, group) : undefined"
							:width="imageSizes.ability"
							:height="imageSizes.ability"
							aria-hidden="true"
							@mouseenter="value.champion.value && showAbilityTooltip($event, 'passive')"
						>
						<a
							v-show="value.champion.value"
							class="wiki-link"
							:href="`https://wiki.leagueoflegends.com/en-us/${value.champion.value?.name.replaceAll(' ', '_')}`"
							target="_blank"
						>
							wiki
						</a>
					</div>
					<ComingSoonCover feature="abilities" class="text-white pt-1 inset-0 start-[calc(var(--ability-size-passive)+0.25*var(--abilities-gap))] absolute items-start!" />
					<div
						v-for="abilityKey in ['q', 'w', 'e', 'r'] satisfies INonPassiveAbilityKey[]"
						v-bind="{ [`data-${abilityKey}`]: '' }"
						:key="abilityKey"
						:data-level="value.abilityLevels.value[abilityKey]"
						:inert="!enableUnimplementedUi"
					>
						<h5>{{ abilityKey.toUpperCase() }}</h5>
						<img
							v-show="!isLoading && value.champion.value"
							:src="value.champion.value ? abilityImage(value.champion.value.abilities[abilityKey].variants[value.abilityVariantsIndexes.value[abilityKey]]!.image, value.champion.value.id, group) : undefined"
							:width="imageSizes.ability"
							:height="imageSizes.ability"
							aria-hidden="true"
							@mouseenter="value.champion.value && showAbilityTooltip($event, abilityKey)"
						>
						<VButtonRadiogroup
							v-if="value.champion.value"
							:id="`${idPrefix}-ability-${abilityKey}`"
							v-model="value.abilityLevels.value[abilityKey]"
							:label="`${abilityKey} level`"
							:options="Array.from({ length: value.maxAbilityLevels.value[abilityKey] }, (_, index) => ({ level: index + 1 }))"
							value-key="level"
							@option-right-click="(event) => resetAbilityLevel(event, abilityKey)"
						>
							<template #default="{ option }">
								<span>{{ option.level }}</span>
							</template>
						</VButtonRadiogroup>
					</div>
				</template>
				<button
					v-if="value.champion.value && SHAPESHIFTING_CHAMPION_IDS.includes(value.champion.value.id)"
					class="other-ui-btn"
					title="shapeshift"
					@click="value.shapeshift"
				>
					<span>shapeshift</span>
					<Icon class="i-ph:arrows-clockwise-bold" />
				</button>
				<LolChampionAbilityHoverTooltip
					ref="championAbilityHoverTooltip"
					:group
					:precomputed-description="hoveredAbilityKey && value.computed.abilities.value[hoveredAbilityKey][hoveredAbilityVariantIndex!]"
				/>
			</section>
			<section ref="healthAbilityResource" data-health-ability-resource="">
				<h4>health and ability resource</h4>
				<div
					ref="healthBar"
					data-current-health=""
					:style="`--fill-percentage: ${!value.anythingFilled.value || value.maxHealth.value === 0 ? 1 : Math.min(healthDragValueRef / value.maxHealth.value, 1)}`"
					@mousedown="startHealthBarDrag"
				>
					<template v-if="value.anythingFilled.value && value.maxHealth.value !== 0">
						<label :for="`${idPrefix}-current-ability-health`">
							health
						</label>
						<input
							:id="`${idPrefix}-current-ability-health`"
							:value="Math.round(healthDragValueRef)"
							min="0"
							:max="value.maxHealth.value"
							type="number"
							@input="updateChampionHealth"
						>
						<span>/ {{ value.maxHealth.value }}</span>
					</template>
				</div>
				<div
					ref="resourceBar"
					data-current-ability-resource=""
					:data-partype="value.champion.value ? value.champion.value?.partype?.toLowerCase() : 'mana'"
					:style="value.maxAbilityResource.value ? `--fill-percentage: ${Math.min(abilityResourceDragValueRef / value.maxAbilityResource.value, 1)}` : undefined"
					@mousedown="startAbilityResourceBarDrag"
				>
					<template v-if="value.maxAbilityResource.value">
						<label :for="`${idPrefix}-current-ability-resource`">
							{{ value.abilityResourceName.value }}
						</label>
						<input
							:id="`${idPrefix}-current-ability-resource`"
							:value="Math.round(abilityResourceDragValueRef)"
							min="0"
							:max="value.maxAbilityResource.value"
							type="number"
							@input="updateChampionAbilityResource"
						>
						<span>/ {{ value.maxAbilityResource.value }}</span>
					</template>
				</div>
			</section>
			<section ref="roleQuest" data-role-quest="">
				<h4>role quest</h4>
				<VSelect
					:id="`${idPrefix}-role-quest`"
					:model-value="value.roleQuest.value"
					:options="Object.keys(TEXT.roleQuests).map(role => [role, role]) as [IChampionRole, string][]"
					label="role quest"
					clearable
					@update:model-value="updateRoleQuest"
					@label-mouseenter="showRoleQuestTooltip"
				>
					<template v-if="value.roleQuest.value">
						<img

							:src="`https://raw.communitydragon.org/${vMinor}/game/assets/ux/lol/rolequest_icon${value.roleQuest.value}_complete.png`"
							width="64"
							height="64"
							loading="lazy"
							aria-hidden="true"
						>
						<img
							:src="`https://raw.communitydragon.org/${vMinor}/game/assets/ux/lol/rolequest_icon${value.roleQuest.value}32.png`"
							width="32"
							height="32"
							loading="lazy"
							aria-hidden="true"
						>
					</template>
				</VSelect>
				<article ref="roleQuestHoverTooltip" popover="hint" class="hover-tooltip role-quest game-description">
					<h5>{{ value.roleQuest.value }}{{ value.roleQuest.value !== 'jungle' && value.roleQuest.value !== 'support' ? ' lane' : '' }} quest rewards</h5>
					<ul class="game-description">
						<li v-for="(reward, i) in value.roleQuest.value ? TEXT.roleQuests[value.roleQuest.value] : []" :key="i">
							{{ reward }}
						</li>
					</ul>
				</article>
			</section>
			<section ref="dragons" data-dragons="">
				<h4>dragons</h4>
				<VSelect
					v-for="i in 4"
					:id="`${idPrefix}-dragon-stack-${i}`"
					:key="i"
					:model-value="value.dragonStacks.value[i - 1]"
					:options="dragonOptions"
					label="soul"
					data-dragon-stack=""
					clearable
					@update:model-value="updateDragonThing($event, 'stack', i - 1)"
					@label-mouseenter="value.dragonStacks.value[i - 1] && showDragonTooltip($event, [value.dragonStacks.value[i - 1]!, 'stack'])"
				>
					<div v-if="value.dragonStacks.value[i - 1]" v-bind="textureBgImageAttrs(UI.dragons[value.dragonStacks.value[i - 1]!].stack, 28)" />
					<template #post>
						<div v-show="value.dragonStacksInvalid.value">
							<span>(invalid)</span>
							<Icon class="i-ph:exclamation-mark-bold" />
						</div>
					</template>
				</VSelect>
				<VSelect
					:id="`${idPrefix}-dragon-soul`"
					:model-value="value.dragonSoul.value"
					:options="dragonOptions"
					data-dragon-soul=""
					label="soul"
					clearable
					@update:model-value="updateDragonThing($event, 'soul')"
					@label-mouseenter="value.dragonSoul.value && showDragonTooltip($event, [value.dragonSoul.value, 'soul'])"
				>
					<div v-if="value.dragonSoul.value" v-bind="textureBgImageAttrs(UI.dragons[value.dragonSoul.value].soulActive, 44)" />
					<template #post>
						<div v-show="value.dragonSoulInvalid.value">
							<span>(invalid)</span>
							<Icon class="i-ph:exclamation-mark-bold" />
						</div>
					</template>
				</VSelect>
				<article ref="dragonTooltip" popover="hint" class="dragon-thing hover-tooltip">
					<h5>{{ hoveredDragonThingText?.title }}</h5>
					<p class="game-description" v-html="hoveredDragonThingText?.description" />
					<UnresolvedVariablesAlert v-if="hoveredDragonThingText?.anyUnknown" />
					<p v-if="hoveredDragonThingText?.invalid" class="alert error">
						{{ hoveredDragonThingText.invalid }}
						<Icon class="i-ph:warning-circle-light" />
					</p>
				</article>
			</section>
			<section ref="extras" data-extras="">
				<component
					:is="extra[0]"
					v-for="(extra, extraIndex) in championExtra"
					:key="`${extra[1].id}-${extraIndex}`"
					:id-prefix
					:damage-source="value"
					:ability-id="extra[1]"
					@img-mouseenter="(...args: IShowTooltipEventArgs) => showGameAbilityTooltip('extras', ...args)"
				/>
				<component
					:is
					v-for="([is, itemId, itemIndex], extraIndex) in itemExtras"
					:key="`${itemId}-${extraIndex}`"
					:id-prefix
					:damage-source="value"
					:ability-id="GameAbilityId.build(ABILITY_TYPE.item, itemId)"
					@img-mouseenter="(mouseEvent: IShowTooltipEventArgs[0]) => showItemHoverTooltip(mouseEvent, itemIndex, true)"
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

	#scoreboard > div > ul {
		--extras-gap: calc(2 * var(--spacing));
		--extra-item-w: calc(64 * var(--spacing));

		min-width: calc(3 * var(--extra-item-w) + 2 * var(--extras-gap));
	}

	#scoreboard > div > ul > [data-scoreboard-item] {
		--at-apply: 'relative grid auto-cols-max grid-flow-col grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_0fr)] of-hidden py-[--py] px-4 box-content';
		min-width: calc(3 * var(--extra-item-w) + 2 * var(--extras-gap));

		--py: calc(3 * var(--spacing));
		--select-champion-size: calc(var(--spacing) * 14);
		--non-expanded-row-height: calc(var(--select-champion-size) / 2);
		--transition-duration: 150ms;

		--runes-stats-img-w: calc(5 * var(--spacing));
		--runes-stats-text-w: calc(20 * var(--spacing));
		--runes-stats-px: calc(0.5 * var(--spacing));
		--runes-stats-section-w: calc(
			2 * var(--runes-stats-px) + 2 * (var(--runes-stats-img-w) + var(--runes-stats-text-w)) + 1px /* 1px is border */
		);

		--ability-size-passive: calc(var(--spacing) * 10);
		--ability-size: calc(var(--spacing) * 14);
		--ability-level-btn-indicator-size: calc(2 * var(--spacing));
		--ability-level-btn-py: calc(1 * var(--spacing));
		--ability-level-buttons-size: calc(var(--ability-level-btn-indicator-size) + 2 * var(--ability-level-btn-py));
		--abilities-gap: calc(var(--spacing) * 2);
		--abilities-width: calc(4 * var(--ability-size) + var(--ability-size-passive) + 4 * var(--abilities-gap));
		--abilities-height: calc(var(--ability-size) + var(--ability-level-buttons-size));
		--soul-size: calc(10 * var(--spacing));
		--stack-size: calc(8 * var(--spacing));
		--soul-rotation-size-diff: calc((var(--soul-size) * sqrt(2) - var(--soul-size)) / 2);
		--gap-x: calc(4 * var(--spacing));

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
			oklch(from var(--damage-source-clr) l c h / 0.1),
			oklch(from var(--damage-source-clr) l c h / 0.1)
		);

		&.highlighted {
			background-image: linear-gradient(
				var(--bg-direction, 90deg),
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.35) 0%,
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.25) 12.5%,
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.2) 20%,
				oklch(from var(--damage-source-clr) calc(l * 1.15) c h / 0.15) 100%
			);
		}

		&:has(> details[open]) {
			--at-apply: 'grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_1fr)]';

			> button:nth-last-of-type(1) {
				--at-apply: 'rotate-180';
			}

			[data-icon-btns-show-text] & > button:nth-last-of-type(1) {
				--at-apply: 'rotate-0';
			}
		}

		> h3 {
			--at-apply: 'sr-only';
		}

		> button {
			&:nth-of-type(1) {
				grid-area: move-up;
			}

			&:nth-of-type(2) {
				grid-area: move-down;
			}

			&:nth-of-type(3) {
				grid-area: move-column;
			}

			&:nth-of-type(4) {
				grid-area: duplicate;
			}

			&:nth-of-type(1),
			&:nth-of-type(3),
			&:nth-last-of-type(2) {
				--at-apply: '-mb-[0.5px] self-end';
			}

			&:nth-of-type(2),
			&:nth-of-type(4),
			&:nth-last-of-type(1) {
				--at-apply: '-mt-[0.5px] self-start z-1';
			}

			&:nth-of-type(3),
			&:nth-of-type(4) {
				--at-apply: '-ms-px z-2';
			}

			&:nth-last-of-type(3) {
				--at-apply: 'absolute inset-0 grid place-items-center text-center text-xl font-600 backdrop-blur-2 z-10 tracking-wide focus-visible:outline-none bg-black/20';
				-webkit-text-stroke: black 0.15em;
				paint-order: stroke fill;

				&::before {
					--at-apply: 'content-empty absolute top-1/2 start-1/2 translate-center outline-auto h-7 w-[4.5em]';
				}
			}

			&:nth-last-of-type(2) {
				grid-area: clear;
			}

			&:nth-last-of-type(1) {
				grid-area: expand;
			}

			&:nth-of-type(-n + 4),
			&:nth-last-of-type(-n + 2) {
				--at-apply: 'size-6 grid-center';

				[data-icon-btns-show-text] & {
					--at-apply: 'w-auto px-1.5';
				}

				.icon {
					--at-apply: 'size-5';
				}
			}

			[data-icon-btns-show-text] &:nth-last-of-type(-n + 2) {
				--at-apply: 'min-w-19';
			}
		}

		> [data-select-champion] {
			--at-apply: 'size-[--select-champion-size] ms-[--ms] me-[--me] relative';
			--ms: calc(3 * var(--spacing));
			--me: calc(2 * var(--spacing));
			grid-area: select-champion;

			> button {
				--at-apply: 'group b b-2 b-[--ui-btn-border-clr] rounded-full size-full of-hidden';

				> span {
					--at-apply: 'sr-only';
				}

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
				--at-apply: 'absolute -bottom-0.5 end-[--inset-end]';
				--inset-end: calc(-0.5 * var(--spacing));

				> select {
					--at-apply: 'rounded-full';
				}

				> label > span:last-child {
					--at-apply: 'size-5 bg-black text-white b b-[--ui-btn-border-clr] text-center text-sm/4 rounded-full grid-center';
				}

				> :is(select:hover, select:focus-visible) + label > span:last-child {
					--at-apply: 'bg-neutral-800';
				}
			}
		}

		> [data-select-runes] {
			--at-apply: 'rounded-full grid-center size-8 relative self-center';
			--secondary-path-icon-size: calc(3 * var(--spacing));
			--secondary-path-inset-end: calc(-0.5 * var(--spacing));
			grid-area: select-runes;

			> span:first-of-type {
				--at-apply: 'sr-only';
			}

			[data-secondary-path-icon] {
				--at-apply: 'size-[--secondary-path-icon-size] block -bottom-0.5 z-11 end-[--secondary-path-inset-end] absolute';
			}

			&:has([data-secondary-path-icon]):before {
				--at-apply: 'content-empty z-10 absolute end-[--secondary-path-inset-end] -bottom-0.5 bg-inherit b b-[--ui-btn-border-clr] size-[calc(var(--secondary-path-icon-size)_+_var(--spacing))] rounded-full translate-x-0.5 translate-y-0.5';
			}
		}

		> [data-select-items] {
			--at-apply: 'self-center relative ms-[--ms]';
			--ms: calc(2 * var(--spacing));
			grid-area: select-items;

			> img {
				--at-apply: 'w-4';
			}
		}

		> ul {
			--at-apply: 'flex h-[--item-size] self-center relative me-[--me] ms-[--ms] w-min';
			grid-area: items;
			anchor-name: --scoreboard-item-items;
			--item-size: calc(8 * var(--spacing));
			--me: calc(3 * var(--spacing));
			--ms: calc(5 * var(--spacing));

			> li {
				--at-apply: 'pe-[--pe]';
				--pe: calc(0.5 * var(--spacing));

				&:nth-child(6) {
					--at-apply: 'pe-0';
				}

				&:last-child {
					--at-apply: 'pe-0 ps-[--pe]';
				}

				> * {
					--at-apply: 'bg-black size-[--item-size] inline-block cursor-default relative';

					&:before {
						--at-apply: 'size-1.5 rounded-1/2 outline outline-black z-1 absolute top-0.5 end-0.5 pointer-events-none';
						background:
							linear-gradient(var(--left, transparent) 0 0) left / 50% 100% no-repeat,
							linear-gradient(var(--right, transparent) 0 0) right / 50% 100% no-repeat;
					}

					&.active::before {
						content: '';
					}

					&:not([data-active-0], [data-active-1]) {
						--left: theme('colors.green.400');
						--right: var(--left);
					}

					&[data-active-0],
					&[data-active-1] {
						--left: theme('colors.black');
						--right: theme('colors.black');

						/* unset it like that because `.active` is always applied for array `isActive`, so actually show with css below on `data-active-0/1='true'` */
						&::before {
							content: initial;
						}
					}

					&[data-active-0='true'] {
						--left: theme('colors.green.400');

						&::before {
							content: '';
						}
					}

					&[data-active-1='true'] {
						--right: theme('colors.green.400');

						&::before {
							content: '';
						}
					}

					> span:first-child {
						--at-apply: 'sr-only';
					}

					> span:last-child {
						--at-apply: 'absolute text-xs bottom-0.5 end-0.25 leading-[1] pointer-events-none z-2';
						paint-order: stroke fill;
						-webkit-text-stroke: black 0.2em;

						> span {
							--at-apply: 'sr-only';
						}
					}

					> img {
						border-radius: inherit;
					}
				}

				&:last-child > * {
					--at-apply: 'rounded-1/2 size-7 m-0.5';
				}
			}

			&:not([data-role-quest='bot']) {
				--at-apply: 'me-[calc(var(--item-size)+var(--me))]';

				> li:last-child {
					--at-apply: 'hidden';
				}
			}

			&[data-drop-buyability]:not([data-drop-buyability='1']) {
				&::before {
					--at-apply: 'pointer-events-none inset-0 content-empty absolute z-10 bg-white/10 bg-red/25';
				}

				&::after {
					--at-apply: 'pointer-events-none start-1/2 top-1/2 absolute translate-center tracking-wide bg-transparent size-auto text-white font-600 z-11';
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

		> .hover-tooltip.champion-item {
			position-anchor: --scoreboard-item-items;
			inset-block-start: calc(anchor(end) + 4 * var(--spacing));
		}

		&[data-item-tooltip-extras] > .hover-tooltip.champion-item {
			position-anchor: --scoreboard-item-extras;
			inset-block-start: auto;
			inset-block-end: calc(anchor(top));
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
				--at-apply: 'pt-4 -mt-6 grid grid-cols-[min-content_min-content_1fr_auto] grid-rows-[auto_min-content_min-content_1fr]';
				grid-template-areas:
					'effects stats abilities abilities'
					'effects stats resources resources'
					'runes stats resources resources'
					'runes stats role-quest dragons';
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

			> [data-runes],
			> [data-stats],
			> [data-effects],
			> [data-abilities],
			> [data-health-ability-resource] {
				> h4 {
					--at-apply: 'sr-only';
				}
			}

			> [data-runes],
			> [data-stats] {
				--at-apply: 'grid grid-cols-subgrid grid-rows-subgrid';

				> dl {
					--at-apply: 'grid grid-rows-[repeat(4,1.5rem)] items-center whitespace-nowrap bg-[--cyan-bg] b b-[--ui-btn-border-clr] py-0.5 px-[--runes-stats-px] w-fit row-span-2';
					grid-template-columns: repeat(2, var(--runes-stats-img-w) var(--runes-stats-text-w));

					> dt {
						--at-apply: 'py-0.5 ps-0.5';

						> :first-child {
							--at-apply: 'sr-only';
						}
					}

					> dd {
						--at-apply: 'leading-5 h-full w-full ps-1.5 py-0.5 pe-0.5';

						&[data-has-bonus] {
							--at-apply: 'text-yellow-200';
						}
					}
				}

				.hover-tooltip.champion-rune,
				.hover-tooltip.champion-stat {
					--at-apply: 'max-w-156';

					position-anchor: --scoreboard-item-stats;
					position-try: flip-block;
					inset-block-start: calc(anchor(end) - 1px);
					inset-inline-start: calc(anchor(start));
					justify-self: anchor-start;
					translate: -50% 0%;
				}
			}

			> [data-runes] {
				grid-area: runes;

				> dl {
					--at-apply: 'b-e-0 self-end relative';
					grid-area: runes;

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

				.hover-tooltip.champion-rune {
					.game-description {
						rules {
							--at-apply: 'italic';
						}

						> hr {
							--at-apply: 'b-[--ui-btn-border-clr] my-[--description-mt]';
						}

						> hr + br {
							--at-apply: 'hidden';
						}
					}
				}
			}

			> [data-stats] {
				grid-area: stats;
				anchor-name: --scoreboard-item-stats;

				> dl:nth-of-type(1) {
					--at-apply: 'b-b-0';
				}

				.hover-tooltip.champion-stat {
					dl {
						--at-apply: 'leading-5.5 b-t b-[--ui-btn-border-clr] pt-[--footer-pt] mt-[--footer-mt]';

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

			> [data-effects] {
				--at-apply: 'size-full relative flex flex-col items-center pb-[--pb]';
				--gap: calc(0.5 * var(--spacing));
				--img-w: calc((var(--runes-stats-section-w) - 8 * var(--gap)) / 8);
				--pb: calc(round(up, var(--effects-number, 0) / 8) * (var(--img-w) + var(--gap)) + var(--gap));
				grid-area: effects;
				anchor-name: --scoreboard-item-effects;

				> button {
					--at-apply: 'my-auto hoverable:z-2';

					> img {
						--at-apply: '-mx-1';
					}
				}

				> ul {
					--at-apply: 'grid grid-cols-8 gap-[--gap] absolute bottom-[--gap] inset-x-0 rotate-180';
					direction: rtl;

					> li {
						--at-apply: 'size-[--img-w] rotate-180';
						direction: ltr;

						> span {
							--at-apply: 'sr-only';
						}

						> button {
							--at-apply: 'relative b b-[--ui-btn-border-clr] size-full bg-[--placeholder-champion-bg-clr]';

							> img {
								--at-apply: 'size-full';
							}

							> img + span {
								--at-apply: 'absolute bottom-0.25 end-0.25 leading-[1] text-xs z-1';
								-webkit-text-stroke: black 0.2em;
								paint-order: stroke fill;
							}
						}
					}
				}

				> .effect-hover-tooltip-container {
					position-anchor: --scoreboard-item-effects;
					inset-block-start: calc(anchor(end));
					inset-inline-start: calc(anchor(start));
				}
			}

			> [data-abilities] {
				--at-apply: 'relative gap-x-[--abilities-gap] flex justify-self-center ms-[--gap-x]';
				grid-area: abilities;
				anchor-name: --scoreboard-item-abilities;
				width: var(--abilities-width);
				height: var(--abilities-height);

				[data-passive],
				[data-q],
				[data-w],
				[data-e],
				[data-r] {
					--at-apply: 'relative size-[--ability-size] b b-[--ui-btn-border-clr]';

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
					--at-apply: 'mb-[calc(var(--ability-level-btn-indicator-size)+2*var(--ability-level-btn-py))]';

					&[data-level='0'],
					&:not([data-level]) {
						--at-apply: 'b-neutral-400';

						img {
							--at-apply: 'grayscale-70 brightness-80';
						}
					}
				}

				[data-loading] {
					--at-apply: 'grid-center';
					grid-column: 1 / -1;
					grid-row: 1 / span 1;
				}

				[data-passive] {
					--at-apply: 'size-[--ability-size-passive] flex flex-col';

					> h5 {
						--at-apply: 'sr-only';
					}

					> a {
						--at-apply: 'inline-flex mx-auto';
					}
				}

				> button {
					--at-apply: 'absolute -end-[--abilities-gap] top-[calc(0.5*var(--ability-size))] -translate-y-1/2 translate-x-full z-1 size-7 grid-center rounded-full';

					> span:first-child {
						--at-apply: 'sr-only';
					}

					> .icon {
						--at-apply: 'size-4';
					}
				}

				.hover-tooltip.champion-ability {
					position-anchor: --scoreboard-item-abilities;
				}
			}

			&[data-ability-tooltip-extras] > [data-abilities] > .hover-tooltip.champion-ability {
				position-anchor: --scoreboard-item-extras;
				inset-block-start: auto;
				inset-block-end: calc(anchor(top));
			}

			> [data-health-ability-resource] {
				--at-apply: 'pt-1.5 pb-2 grid grid-rows-subgrid grid-cols-subgrid ms-[--gap-x]';
				grid-area: resources;

				[data-current-health],
				[data-current-ability-resource] {
					--at-apply: 'relative col-span-full bg-black h-6 flex flex-center gap-x-2 whitespace-nowrap';

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

				> [data-current-health] {
					--fill-bg: theme('colors.green.500');
				}

				> [data-current-ability-resource] {
					--fill-bg: var(--unknown-clr);

					&[data-partype='mana'],
					&[data-partype='ferocity'] {
						--fill-bg: theme('colors.blue.500');
					}

					&[data-partype='energy'] {
						--fill-bg: theme('colors.yellow.400');

						> span {
							mix-blend-mode: difference;
						}
					}

					&[data-partype='fury'],
					&[data-partype='rage'],
					&[data-partype='courage'],
					&[data-partype='heat'],
					&[data-partype='crimson rush'] {
						--mix1: color-mix(
							in oklch,
							theme('colors.white') calc((1 - var(--fill-percentage)) * 100%),
							theme('colors.yellow.400')
						);
						--mix2: color-mix(
							in oklch,
							theme('colors.yellow.400') calc((1 - var(--fill-percentage)) * 100%),
							theme('colors.red.600')
						);
						--fill-bg: color-mix(in oklch, var(--mix1) calc((1 - var(--fill-percentage)) * 100%), var(--mix2));
					}

					&[data-partype='shield'],
					&[data-partype='flow'] {
						--fill-bg: theme('colors.white');

						> * {
							mix-blend-mode: difference;
						}
					}
				}
			}

			> [data-role-quest] {
				--at-apply: 'relative py-[calc(0.5*(var(--soul-size)-var(--stack-size))+var(--soul-rotation-size-diff))] mx-[--gap-x] w-max';
				grid-area: role-quest;
				anchor-name: --scoreboard-item-role-quest;

				> .v-select {
					--at-apply: 'w-max';

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
								--at-apply: 'size-8 absolute start-0 top-0 rounded-full b b-[--ui-btn-border-clr]';
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
				grid-area: dragons;
				anchor-name: --scoreboard-item-dragons;

				&::before {
					--end: calc(var(--soul-size) + 2 * var(--soul-rotation-size-diff) + var(--gap) + var(--stack-size) / 2);
					--start: calc(var(--stack-size) / 2);
					--at-apply: 'absolute top-1/2 -translate-y-1/2 content-empty start-[--start] bg-black h-[calc(var(--stack-size)*0.2)] end-[--end]';
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
					--at-apply: 'absolute -top-0.5 start-0 text-xs uppercase font-500 text-neutral-300 leading-3 whitespace-nowrap';
				}
			}

			> [data-extras] {
				--at-apply: 'col-span-full w-full grid grid-cols-[repeat(3,minmax(0,var(--extra-item-w)))] auto-rows-min gap-[--extras-gap] pt-3';
				anchor-name: --scoreboard-item-extras;

				&:empty {
					--at-apply: 'hidden';
				}
			}
		}

		> [data-select-items],
		> details > [data-effects] > button {
			--at-apply: 'rounded-full h-8 ps-2.5 pe-2 w-max whitespace-nowrap';

			img {
				--at-apply: 'inline-block align-middle -mt-0.5';
			}
		}
	}

	#scoreboard > div > ul > [data-scoreboard-item] > details[open]:not(:has(> [data-extras]:not(:empty))) {
		--at-apply: 'pb-1.5';
	}

	#scoreboard
		> div
		> ul
		> [data-scoreboard-item]
		> details
		> [data-abilities]
		> :is([data-q], [data-w], [data-e], [data-r]),
	#scoreboard
		> div
		> ul
		> [data-scoreboard-item='Aphelios']
		> details
		> [data-extras]
		> .extras-aphelios-ability-levels {
		> [role='radiogroup'] {
			--at-apply: 'flex justify-center';

			> button {
				--at-apply: 'py-[--ability-level-btn-py] px-0.25';

				&::before {
					--at-apply: 'content-empty block b b-[--ui-btn-border-clr] size-[--ability-level-btn-indicator-size] rounded-full bg-black';
				}

				&[aria-checked='true']::before,
				&:has(~ [aria-checked='true'])::before {
					--at-apply: 'bg-[--ui-btn-border-clr]';
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

	#dialog-effects > ul > li,
	#scoreboard > div > ul > [data-scoreboard-item] > details > [data-extras] {
		> article {
			--at-apply: 'b b-[--ui-btn-border-clr] bg-[--placeholder-champion-bg-clr] px-[--p] rounded-md w-[--extra-item-w,auto]';
			--p: calc(2 * var(--spacing));

			> img {
				--at-apply: 'row-span-full b b-[--ui-btn-border-clr] size-[--ability-size] my-[--p] me-[--p] self-center';
			}

			> label + button {
				--at-apply: 'absolute end-[--p] top-[--p] grid-center size-5.5 z-1';

				> span:first-child {
					--at-apply: 'sr-only';
				}

				> span.icon {
					--at-apply: 'size-4';
				}
			}

			> label:has(+ button) {
				--at-apply: 'pe-6';
			}
		}
	}
}

@layer overrides {
	#scoreboard > div > ul > [data-scoreboard-item='Yone'] {
		> details {
			> [data-health-ability-resource] {
				> [data-current-ability-resource] {
					&[data-partype='flow'] {
						--fill-bg: theme('colors.orange.500');

						> * {
							mix-blend-mode: normal;
						}
					}
				}
			}
		}
	}

	#scoreboard > div > ul > [data-scoreboard-item='Belveth'] {
		> details {
			> [data-health-ability-resource] {
				> [data-current-ability-resource] {
					--fill-bg: theme('colors.purple.500');
				}
			}
		}
	}

	#scoreboard[data-mirrored] > div > ul:nth-of-type(1) > [data-scoreboard-item] {
		grid-template-columns: max-content 1fr repeat(5, max-content);
		grid-template-areas:
			'clear			items				select-items		select-runes	select-champion move-column move-up'
			'expand			items				select-items		select-runes	select-champion	duplicate		move-down'
			'expanded		expanded		expanded				expanded			expanded				expanded		expanded';

		> button {
			&:nth-of-type(3),
			&:nth-of-type(4) {
				--at-apply: '-me-px ms-0 z-1';
			}
		}

		> [data-select-champion] {
			--at-apply: 'ms-[--me] me-[--ms]';

			> [data-select-champion-level] {
				--at-apply: 'end-auto start-[--inset-end]';
			}
		}

		> [data-select-runes] {
			[data-secondary-path-icon] {
				--at-apply: 'end-auto start-[--secondary-path-inset-end]';
			}

			&:has([data-secondary-path-icon]):before {
				--at-apply: 'end-auto start-[--secondary-path-inset-end] -translate-x-0.5';
			}
		}

		> [data-select-items] {
			--at-apply: 'me-[--ms] ms-0';
		}

		> ul {
			--at-apply: 'ms-[--me] me-[--ms] justify-self-end flex-row-reverse';

			> li {
				--at-apply: 'ps-[--pe] pe-0';

				&:nth-child(6) {
					--at-apply: 'ps-0';
				}

				&:last-child {
					--at-apply: 'ps-0 pe-[--pe]';
				}
			}
		}

		> details {
			> [data-extras] {
				direction: rtl;

				> * {
					direction: ltr;
				}
			}
		}
	}

	#scoreboard[data-mirrored] > div > ul:nth-of-type(2) > [data-scoreboard-item] {
		> details {
			&::details-content {
				--at-apply: 'grid-cols-[auto_1fr_min-content_min-content]';
				grid-template-areas:
					'abilities abilities stats effects'
					'resources resources stats effects'
					'resources resources stats runes'
					'dragons role-quest stats runes';
			}

			> [data-effects] {
				> ul {
					direction: ltr;
				}

				> .effect-hover-tooltip-container {
					--at-apply: 'items-end';
					inset-inline-start: auto;
					inset-inline-end: calc(anchor(end));
				}
			}

			> [data-runes] {
				> dl {
					&:nth-of-type(1) {
						--at-apply: 'b-e b-s-0';
					}
				}
			}

			> [data-abilities],
			> [data-health-ability-resource] {
				--at-apply: 'ms-0 me-[--gap-x]';
			}

			> [data-role-quest],
			> [data-dragons] {
				> h4 {
					--at-apply: 'start-auto end-0';
				}
			}

			> [data-role-quest] {
				--at-apply: 'justify-self-end';

				> .v-select {
					--at-apply: 'ms-auto';

					> select {
						--at-apply: 'start-auto end-0';
					}

					> label {
						--at-apply: 'flex-row-reverse';

						> img:first-of-type {
							--at-apply: 'start-auto end-0';
						}
					}
				}
			}

			> [data-dragons] {
				--at-apply: 'flex-row-reverse';

				&::before {
					--at-apply: 'start-[--end] end-[--start]';
				}
			}
		}
	}
}
</style>
