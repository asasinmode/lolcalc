<script setup lang="ts">
import type { DamageSource, IComputedAppliedEffect } from '@lolcalc/core/DamageSource';
import type { IChampionAbilityId, IDragonAbilityId, IGameAbilityId, IItemAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IHypotheticalChampionSpecifics } from '@lolcalc/core/specifics/champion';
import type { IHypotheticalDragonSpecifics } from '@lolcalc/core/specifics/dragon';
import type { IHypotheticalEffectSpecifics } from '@lolcalc/core/specifics/effect';
import type { IHypotheticalItemSpecifics } from '@lolcalc/core/specifics/item';
import type { IReplaceGameVariablesRV } from '@lolcalc/core/variables/game';
import type { IChampion, IDragonName } from '@lolcalc/data/types';
import type { IChampionAbilityKey, IChampionStatName, TAbilityType } from '@lolcalc/shared';
import type { UnwrapRef, WatchHandle } from 'vue';
import type { IChampionAbilityHoverTooltipProps, ICustomTotalSectionRow, IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';
import { computeAbilityDescription, computeDragonAbilityDescription, computeItemDescription } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { gameAbilityImage, simpleDescriptionFormatting } from '@lolcalc/core/misc';
import { specificKnownVariables } from '@lolcalc/core/specifics';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { DRAGON_SPECIFICS } from '@lolcalc/core/specifics/dragon';
import { applyEffectsFromTo, EFFECT_SPECIFICS, EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item';
import { replaceStringtableVariables } from '@lolcalc/core/variables/stringtable';
import { CHAMPION_ID_TO_KEY, CHAMPION_IMAGES, imgUrl, INTERESTING_SOULS_DRAGONS, ITEMS, PATCH_VERSION, useChampion } from '@lolcalc/data';
import { AbilityType, CHAMPION_STAT_META } from '@lolcalc/shared';
import { roundVariable } from '@lolcalc/shared/utils';

defineProps<{
	showResults: boolean;
}>();

const { damageSources, damageTargets, resultSections, resultColumns, expandedSections, resultsTableFlip: flipResults, customTotalRowIds, computedCustomTotalRows } = useCalculatorState();
const { debouncedSaveState } = useManageCalculatorState();
const { championImage, abilityImage, championImageSize, abilityImageSize } = CHAMPION_IMAGES;
const enableUnimplementedUi = useEnableUnimplementedUi();
const iconButtonsShowText = useIconButtonsShowText();
const globalKeyModifiers = useGlobalKeyModifiers();
const highlightedDamageSources = useHighlightedDamageSources();
const { showTooltip: showRowTooltip, hideTooltip: hideRowTooltip } = useInfoTooltip();
const { vMinor } = PATCH_VERSION;

const highlightedColumnId = ref<string>();

function columnOptions(from: DamageSource[]): [string, string][] {
	return from.map((source, i) => [source.id, `(${i + 1}) ${source.listedChampion.value?.name || '<empty>'}`]);
}
const sourceOptions = computed(() => columnOptions(damageSources.value));
const targetOptions = computed(() => columnOptions(damageTargets.value));

function setColumnChampion(column: IDamageResultTableColumn, sources: DamageSource[], damageSourceId?: string) {
	const oldDamageSourceId = column[sources === damageSources.value ? 'source' : 'target']?.id;
	oldDamageSourceId && highlightedDamageSources.remove(oldDamageSourceId);

	const property = sources === damageSources.value ? 'source' : 'target';

	column[property] = damageSourceId
		? sources.find(damageSource => damageSource.id === damageSourceId)
		: undefined;
	recalculateColumn(column);

	column[property] && highlightedDamageSources.add(column[property].id);
	debouncedSaveState();
}

interface IDamageSectionOption {
	type: TAbilityType;
	/** champion or item id */
	optionId: string;
	optionName: string;
	abilities: {
		id: IGameAbilityId;
		name: string;
	}[];
}

/** array containing `boolean` of whether a section is implemented or not, used for `enableUnimplementedUi` */
const implementedDamageSectionsMap = computed(() => resultSections.value.map(section => enableUnimplementedUi.value || !(section.abilityId.type === 'champion' && section.abilityId.abilityKey !== 'passive')));

const uniqueDamageSourceChampions = computed<Set<IChampion>>(() => new Set(
	damageSources.value
		.concat(damageTargets.value)
		.filter(source =>
			source.champion.value && (source.listedChampion.value?.id === source.champion.value.id) && source.champion.value.id !== 'TargetDummy',
		)
		.map(source => source.champion.value!),
));
const damageSectionChampionAbilityOptions = computed<IDamageSectionOption[]>((): IDamageSectionOption[] => uniqueDamageSourceChampions.value
	.values()
	.map((champion): IDamageSectionOption => {
		const championId = champion.id;
		let abilityEntries = Object.entries(champion.abilities);

		if (championId === 'Aphelios') {
			abilityEntries = abilityEntries.filter(([abilityKey]) => abilityKey === 'q' || abilityKey === 'r');
		}

		return {
			type: AbilityType.champion,
			optionId: championId,
			optionName: champion.name,
			abilities: abilityEntries
				.flatMap(([abilityKey, ability]): IDamageSectionOption['abilities'] =>
					ability.variants
						/*
						 * some champions like `Elise` have additional variants saved. These are expected to be used only for resolving the variables in the main variants (first 2)
						 * only Aphelios has more variants that are expected to be actually shown
						 */
						.slice(0, championId === 'Aphelios' ? undefined : 2)
						.map((variant, abilityVariantIndex): IDamageSectionOption['abilities'][number] => {
							const { replaced: nameReplaced } = replaceStringtableVariables(
								variant.name,
								champion.stringtable,
							);

							return {
								id: GameAbilityId.build(AbilityType.champion, champion.id, abilityKey as IChampionAbilityKey, abilityVariantIndex),
								name: championAbilitySectionName(champion.name, abilityKey as IChampionAbilityKey, nameReplaced),
							};
						}),
				),
		} satisfies IDamageSectionOption;
	})
	.toArray());

const damageSectionItemAbilities = computed<IDamageSectionOption['abilities']>((): IDamageSectionOption['abilities'] => {
	const itemIds = new Set(damageSources.value
		.concat(damageTargets.value)
		.flatMap(damageSource => damageSource.computed.items.value.map((item, index) =>
			item?.hasAnyInterestingVariables || item?.unknownVariables.length ? damageSource.items.value[index]!.id : undefined,
		))
		.filter(Boolean));

	return itemIds.values()
		.map((itemId): IDamageSectionOption['abilities'][number] => ({
			name: ITEMS[itemId!]!.name,
			id: GameAbilityId.build(AbilityType.item, itemId!),
		}))
		.toArray()
		.sort((a, b) => a.name.localeCompare(b.name));
});

const damageSectionDragonAbilities = computed<IDamageSectionOption['abilities']>((): IDamageSectionOption['abilities'] => {
	const dragons: IDragonName[] = [];
	for (const damageSource of damageSources.value) {
		const { value } = damageSource.dragonSoul;
		if (value && INTERESTING_SOULS_DRAGONS.includes(value) && !dragons.includes(value)) {
			dragons.push(value);
		}
	}
	for (const damageSource of damageTargets.value) {
		const { value } = damageSource.dragonSoul;
		if (value && INTERESTING_SOULS_DRAGONS.includes(value) && !dragons.includes(value)) {
			dragons.push(value);
		}
	}

	return dragons
		.map((dragon): IDamageSectionOption['abilities'][number] => ({
			name: `${dragon} Soul`,
			id: GameAbilityId.build(AbilityType.dragon, dragon, 'soul'),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
});

const damageSectionEffectAbilities = computed<IDamageSectionOption['abilities']>((): IDamageSectionOption['abilities'] => {
	const effectObjectNames = new Set(damageSources.value
		.flatMap(damageSource =>
			damageSource.computed.effects.value
				.map(effect => effect.resultVariables && effect.abilityId.id)
				.concat(damageSource.effectsAppliedToTarget.value.map(([effectAbilityId, effectSpecific]) => effectSpecific.variables && effectAbilityId.id)))
		.concat(damageTargets.value.flatMap(damageSource => damageSource.computed.effects.value.map(effect =>
			effect.resultVariables && effect.abilityId.id)))
		.filter(Boolean));

	return effectObjectNames.values()
		.map((effectObjectName): IDamageSectionOption['abilities'][number] => ({
			name: (EFFECT_SPECIFICS as IHypotheticalEffectSpecifics)[effectObjectName!]!.label,
			id: GameAbilityId.build(AbilityType.effect, effectObjectName!),
		}))
		.toArray()
		.sort((a, b) => a.name.localeCompare(b.name));
});

const damageSectionOptions = computed<IDamageSectionOption[]>(() => {
	const options: IDamageSectionOption[] = damageSectionChampionAbilityOptions.value.map((option): IDamageSectionOption => ({
		type: option.type,
		optionId: option.optionId,
		optionName: option.optionName,
		abilities: option.abilities.filter(ability => !resultSections.value.some(section =>
			section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id),
		)),
	}));

	options.push({
		optionId: 'items',
		optionName: 'items',
		type: 'item',
		abilities: damageSectionItemAbilities.value.filter(ability =>
			!resultSections.value.some(section => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id)),
		),
	});

	options.push({
		optionId: 'dragons',
		optionName: 'dragons',
		type: 'dragon',
		abilities: damageSectionDragonAbilities.value.filter(ability =>
			!resultSections.value.some(section => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id)),
		),
	});

	options.push({
		optionId: 'effects',
		optionName: 'effects',
		type: 'effect',
		abilities: damageSectionEffectAbilities.value.filter(ability =>
			!resultSections.value.some(section => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id)),
		),
	});

	return options.filter(option => option.abilities.length);
});

function championAbilitySectionName(championName: string, abilityKey: IChampionAbilityKey, abilityName: string) {
	return `${championName} ${abilityKey === 'passive' ? 'P' : abilityKey.toUpperCase()} - ${abilityName}`;
}

interface IComputedSection {
	sectionId: string;
	rows: Map<string, IComputedSectionRow>;
}

interface IComputedSectionRow {
	rowId: string;
	columns: Map<string, IComputedSectionRowColumn>;
}

interface IComputedSectionRowColumn {
	columnId: string;
	isIrrelevant?: boolean;
	isUnknown?: boolean;
	numberValue?: number;
	value: string | number;
	comparisonMap: Record<string, number>;
}

const customTotalSection = resultSections.value.find(section => section.isCustomTotal)!;
const customTotalSectionTotalRow = customTotalSection.rows[0]!;

const computedResults = ref(new Map<string, IComputedSection>(
	[[customTotalSection.id, computeSection(customTotalSection)] as [ string, IComputedSection ]]
		.concat(resultSections.value.map(section => [section.id, computeSection(section)] as [string, IComputedSection])),
));

const customTotalComputedSection = computedResults.value.get(ResultSectionId.CustomTotal)!;
const customTotalComputedSectionTotalRow = customTotalComputedSection.rows.get('cTtl-total')!;

function addComputedSection(sectionId: string) {
	const section = computeSection(resultSections.value.find(section => section.id === sectionId)!);
	calculateComputedSectionComparisonMaps(section);
	computedResults.value.set(sectionId, section);
}

function computeSection(section: IDamageResultTableSection): IComputedSection {
	return {
		sectionId: section.id,
		rows: new Map(section.rows.map(row => [row.id, computeSectionRow(section, row)])),
	};
}

function computeSectionRow(section: IDamageResultTableSection, row: IDamageResultTableSection['rows'][number]): IComputedSectionRow {
	return {
		rowId: row.id,
		columns: new Map(resultColumns.value.map(column => [column.id, computeSectionRowColumn(section, row, column)])),
	};
}

function computeSectionRowColumn(
	section: IDamageResultTableSection,
	row: IDamageResultTableSection['rows'][number],
	column: IDamageResultTableColumn,
): IComputedSectionRowColumn {
	const source = column[flipResults.value ? '_computedTarget' : '_computedSource'];
	const target = column[flipResults.value ? '_computedSource' : '_computedTarget'];
	const rv: IComputedSectionRowColumn = {
		columnId: column.id,
		isIrrelevant: true,
		value: '-',
		comparisonMap: {},
		isUnknown: false,
	};

	if (!source || (!source.listedChampion.value && section.abilityId.type === AbilityType.champion)) {
		rv.value = '-';
	} else if (source.listedChampion.value && source.listedChampion.value.id !== source.champion.value?.id) {
		rv.value = 'loading...';
	} else if (
		(section.abilityId.type === 'champion' && source.champion.value?.id !== section.abilityId.id)
		|| (section.id === 'aa' && source.champion.value?.id === 'Zeri')
	) {
		rv.value = 'n/a';
	} else if (section.id === ResultSectionId.CustomTotal) {
		/* this branch is expected to happen only for the total row, other custom total rows use computedCustomTotalRows */
		if (!customTotalRowIds.value.length) {
			return rv;
		}

		const sum = computedCustomTotalRows.value.slice(1).reduce((acc, curr) => {
			if (curr.id === row.id) {
				return acc;
			}

			const computedColumn = computedResults.value
				.get(curr.sectionId)!
				.rows
				.get(curr.id)!
				.columns
				.get(column!.id)!;

			return acc + (computedColumn.numberValue ?? 0);
		}, 0) ?? 0;

		rv.isIrrelevant = false;
		rv.numberValue = sum;
		rv.value = sum;
	} else {
		const cellValue = section.getCellValue?.(section, row.id, source, target);
		if (cellValue) {
			({ value: rv.value, numberValue: rv.numberValue, isUnknown: rv.isUnknown } = cellValue);
			rv.isIrrelevant = false;
		} else {
			rv.value = 'n/a';
		}
	}

	return rv;
}

function addResultsColumn() {
	const column: IDamageResultTableColumn = {
		id: crypto.randomUUID(),
	};
	resultColumns.value.push(column);
	addComputedColumn(column);
	debouncedSaveState();
}

function addComputedColumn(column: IDamageResultTableColumn) {
	for (const section of computedResults.value.values()) {
		const resultSection = resultSections.value.find(rSection => rSection.id === section.sectionId)!;
		for (const row of section.rows.values()) {
			const resultRow = resultSection.rows.find(rRow => rRow.id === row.rowId)!;
			row.columns.set(column.id, computeSectionRowColumn(resultSection, resultRow, column));
		}
	}
}

function startRemovingColumn(event: MouseEvent, index: number) {
	const removeButton = (event.target as HTMLElement).closest('button');
	const undoRemoveButton = (iconButtonsShowText.value && (index === resultColumns.value.length - 1) ? removeButton?.nextElementSibling : removeButton?.nextElementSibling?.nextElementSibling) as HTMLButtonElement | undefined;
	if (!undoRemoveButton || !(resultColumns.value[index]?.source || resultColumns.value[index]?.target)) {
		removeResultsColumn(index);
		return;
	}

	const container = removeButton?.closest('td');

	function removeAndFocusNext() {
		undoRemoveButton!.removeEventListener('focusout', removeAndFocusNext);
		container?.removeEventListener('mouseleave', removeAndFocusNext);
		const nextElement = container?.nextElementSibling;
		removeResultsColumn(index);
		nextTick(() => {
			nextElement?.querySelector('button')?.focus();
		});
	}

	function undoRemove() {
		undoRemoveButton!.removeEventListener('click', undoRemove);
		undoRemoveButton!.removeEventListener('focusout', removeAndFocusNext);
		container?.removeEventListener('mouseleave', removeAndFocusNext);
		undoRemoveButton!.style.display = 'none';
		removeButton?.focus();
	}

	undoRemoveButton.addEventListener('click', undoRemove);
	undoRemoveButton.addEventListener('focusout', removeAndFocusNext);
	container?.addEventListener('mouseleave', removeAndFocusNext);
	undoRemoveButton.style.display = 'grid';
	undoRemoveButton.focus();
}

function removeResultsColumn(index: number) {
	const [column] = resultColumns.value.splice(index, 1);
	for (const section of computedResults.value.values()) {
		for (const row of section.rows.values()) {
			row.columns.delete(column!.id);
		}
	}
	debouncedSaveState();
}

function toggleResultsSection(sectionId: string) {
	const index = expandedSections.value.indexOf(sectionId);
	if (~index) {
		expandedSections.value.splice(index, 1);
	} else {
		expandedSections.value.push(sectionId);
	}
	debouncedSaveState();
}

function preventDoubleClickSelect(event: MouseEvent) {
	event.detail > 1 && event.preventDefault();
}

const itemVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, rowId, source, _target) => {
	const computedItem = source?.computed.items.value.find(item =>
		item?.item!.id === (section.abilityId as IItemAbilityId).id,
	);
	return gameVariablesCellValue(rowId, computedItem?.variables);
};

const dragonVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, rowId, source, _target) => {
	if (source?.computed.dragonSoulAbility.value?.dragon === (section.abilityId as IDragonAbilityId).id) {
		return gameVariablesCellValue(rowId, source.computed.dragonSoulAbility.value.variables);
	}
};

const abilityVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, rowId, source, _target) => {
	if (source) {
		const { gameAbilityId } = (section.hoverTooltipData as IChampionAbilityHoverTooltipProps).precomputedDescription!;
		const computedDescription = source.computed.abilities.value[gameAbilityId.abilityKey!][gameAbilityId.abilityVariantIndex!];
		return gameVariablesCellValue(rowId, computedDescription?.variables);
	}
};

const effectVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, rowId, source, _target) => {
	/* unwrapped computed here because it's passed from template and is already `toValued` */
	const rv = gameVariablesCellValue(rowId, source?.computed.effects.value.find(effect => effect.abilityId.id === section.abilityId.id)?.resultVariables as UnwrapRef<IComputedAppliedEffect['resultVariables']>);
	/* other variable's values are rounded by `replaceGameVariables` but these are gotten raw from IEffectSpecifics.variables.calulate() so round them here */
	if (typeof rv?.numberValue === 'number') {
		rv.value = `${roundVariable(rv.numberValue * (rv.meta?.resultsMultiplier ?? 1))}${rv.meta?.resultsIsPercentage ? '%' : ''}`;
	}
	return rv;
};

function gameVariablesCellValue(variableName: string, variables?: IReplaceGameVariablesRV['variables']): ReturnType<NonNullable<IDamageResultTableSection['getCellValue']>> {
	if (variables) {
		const rv: ReturnType<NonNullable<IDamageResultTableSection['getCellValue']>> = {
			value: '?',
			isUnknown: false,
		};
		const variable = variables.get(variableName);
		rv.meta = variable?.meta;
		const suffix = variable?.isPercentage || rv.meta?.resultsIsPercentage ? '%' : '';
		const multiplier = rv.meta?.resultsMultiplier;

		const value = variable?.value;
		if (value === undefined) {
			rv.numberValue = 0;
			rv.value = '?';
			rv.isUnknown = true;
		} else if (Array.isArray(value)) {
			rv.value = `${typeof value[0] === 'number' && multiplier ? roundVariable(value[0] * multiplier) : value[0]}${suffix} | ${typeof value[1] === 'number' && multiplier ? roundVariable(value[1] * multiplier) : value[1]}${suffix}`;
		} else {
			if (typeof value === 'number') {
				const totalValue = multiplier ? roundVariable(value * multiplier) : value;
				rv.value = `${totalValue}${suffix}`;
				rv.numberValue = totalValue;
			} else {
				rv.value = `${value}${suffix}`;
			}
		}

		return rv;
	}
}

function submitResultsSection(event: SubmitEvent) {
	const value = new FormData(event.target as HTMLFormElement).get('sectionOptionIndex')! as string;
	if (!value) {
		return;
	}

	const [rawOptionIndex, rawAbilityIndex] = value.split('-');
	(event.target as HTMLFormElement).reset();
	const ability = damageSectionOptions.value[Number.parseInt(rawOptionIndex!)]!.abilities[Number.parseInt(rawAbilityIndex!)]!;
	addResultsSection(ability.id, ability.name);
	debouncedSaveState();
}

/** to be used for removing a section that was eagerly added but during full resolve turned out to be incorrect */
function removeBeingAddedSection(section: IDamageResultTableSection) {
	const index = resultSections.value.indexOf(section);
	~index && resultSections.value.splice(index, 1);
	const expandedIndex = expandedSections.value.indexOf(section.id);
	~expandedIndex && expandedSections.value.splice(expandedIndex, 1);
	triggerRef(resultSections);
}

async function addResultsSection(
	abilityId: IGameAbilityId,
	name?: string,
	expand = true,
	spliceAt = 0,
) {
	const id = GameAbilityId.stringify(abilityId, CHAMPION_ID_TO_KEY, EFFECT_SPECIFICS_OBJECT_ENTRIES);
	if (resultSections.value.some(section => section.id === id) || (abilityId.type === 'champion' && abilityId.id === 'TargetDummy')) {
		return;
	}

	const section = {
		id,
		/* if empty, it's set when underlying ability is resolved but put it here to avoid recomputing if adding from options (it's empty when restoring) */
		name: name!,
		abilityId,
		/* expected to be filled by async stuff below */
		image: undefined,
		rows: [],
	} satisfies Omit<IDamageResultTableSection, 'getCellValue'> as unknown as IDamageResultTableSection;

	resultSections.value.splice(spliceAt, 0, section);
	expand && expandedSections.value.push(section.id);

	if (abilityId.type === AbilityType.champion) {
		const champion = await useChampion(abilityId.id);
		/* since abilities are added eagerly despite potentially needing to await something to fully resolve, if the champion is not resolved then remove the section. Unknown champions can be added when restoring state */
		if (!champion?.abilities[abilityId.abilityKey].variants[abilityId.abilityVariantIndex]) {
			removeBeingAddedSection(section);
			return;
		}

		const precomputedDescription = computeAbilityDescription(champion, abilityId, undefined, {
			replaceWithName: true,
			overrideVariables: specificKnownVariables((CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[abilityId.id]?.[abilityId.abilityKey]?.variables,
			),
		});

		section.name ??= championAbilitySectionName(champion.name, abilityId.abilityKey, precomputedDescription.name);
		section.image = [abilityImage(precomputedDescription.variant.image, champion.id, `${flipResults.value ? 'target' : 'source'}s`), abilityImageSize(champion.id)];
		section.rows = await getAbilitySectionRows(precomputedDescription);
		section.getCellValue = abilityVariableCellValue;
		section.hoverTooltipData = {
			precomputedDescription,
		};
	} else if (abilityId.type === AbilityType.item) {
		const item = ITEMS[abilityId.id]!;

		const precomputedDescription = computeItemDescription(item, undefined, {
			replaceWithName: true,
			overrideVariables: specificKnownVariables((ITEM_SPECIFICS as IHypotheticalItemSpecifics)[abilityId.id as keyof IHypotheticalItemSpecifics]?.variables),
		})!;

		section.name ??= item.name;
		section.image = [imgUrl(`img/item/${item.image}`, true), 64];
		section.rows = await getAbilitySectionRows(precomputedDescription);
		section.getCellValue = itemVariableCellValue;
		section.hoverTooltipData = { precomputedDescription };
	} else if (abilityId.type === AbilityType.dragon) {
		if (!INTERESTING_SOULS_DRAGONS.includes(abilityId.id)) {
			removeBeingAddedSection(section);
			return;
		}

		const precomputedDescription = computeDragonAbilityDescription(abilityId.id, abilityId.subtype, undefined, false, {
			replaceWithName: true,
			overrideVariables: specificKnownVariables((DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[abilityId.id]?.[abilityId.subtype]?.variables),
		}); ;
		section.name ??= `${abilityId.id} Soul`;
		section.image = await gameAbilityImage(abilityId);
		section.rows = await getAbilitySectionRows(precomputedDescription);
		section.getCellValue = dragonVariableCellValue;
		section.hoverTooltipData = { precomputedDescription };
	} else {
		const effectSpecific = EFFECT_SPECIFICS[abilityId.id]!;
		if (!effectSpecific.variables) {
			removeBeingAddedSection(section);
			return;
		}

		section.name ??= effectSpecific.label;
		section.image = await gameAbilityImage(abilityId);
		section.rows = await getAbilitySectionRows({ variables: effectSpecific.variables.known, unknownVariables: [] });
		section.getCellValue = effectVariableCellValue;
		section.hoverTooltipData = { abilityId };
	}

	addComputedSection(section.id);
	triggerRef(resultSections);
}

async function getAbilitySectionRows({ variables, unknownVariables }: Pick<IReplaceGameVariablesRV, 'variables' | 'unknownVariables'>): Promise<IDamageResultTableSection['rows']> {
	const rows: IDamageResultTableSection['rows'] = await Promise.all(variables
		.entries()
		.filter(entry => !entry[1].isUninteresting)
		.map(async (entry): Promise<IDamageResultTableSection['rows'][number]> => ({
			id: entry[0],
			name: entry[1].meta?.displayedName ?? entry[1].actualName ?? entry[0],
			isCustom: entry[1].meta?.isCustom,
			additionalInfo: entry[1].meta?.additionalInfo && await simpleDescriptionFormatting(entry[1].meta?.additionalInfo),
		})));

	return markRaw(rows.concat(unknownVariables.map(([rawName]) => ({
		id: rawName,
		name: rawName,
		isUnknown: true,
	}))));
}

function removeResultsSection(index: number) {
	const section = resultSections.value[index];
	if (section!.isCustomTotal) {
		customTotalRowIds.value.length = 0;
	} else {
		const [section] = resultSections.value.splice(index, 1);
		for (let i = customTotalRowIds.value.length - 1; i >= 0; i--) {
			if (customTotalRowIds.value[i]!.startsWith(section!.id)) {
				customTotalRowIds.value.splice(i, 1);
			}
		}
		computedResults.value.delete(section!.id);
	}
	debouncedSaveState();
}

const damageSourceWatchers = new Map<string, WatchHandle>();

watch(
	() => damageSources.value.map(source => source.id),
	(newV, oldV) => handleSourceUpdate(damageSources.value, newV, oldV),
	{ immediate: true },
);
watch(
	() => damageTargets.value.map(source => source.id),
	(newV, oldV) => handleSourceUpdate(damageTargets.value, newV, oldV),
	{ immediate: true },
);

function handleSourceUpdate(target: DamageSource[], currIds: string[], prevIds: string[] = []) {
	debouncedSaveState();
	const addedIds = currIds.filter(id => !prevIds.includes(id));
	const removedIds = prevIds.filter(id => !currIds.includes(id));
	const columnProperty = target === damageSources.value ? 'source' : 'target';

	for (const id of removedIds) {
		damageSourceWatchers.get(id)?.();
		damageSourceWatchers.delete(id);

		for (let i = 0; i < resultColumns.value.length; i++) {
			const column = resultColumns.value[i]!;
			if (column[columnProperty]?.id === id) {
				column[columnProperty] = undefined;
				recalculateColumn(column);
			}
		}
	}

	for (const id of addedIds) {
		const source = (target.find(damageSource => damageSource.id === id))!;
		damageSourceWatchers.set(source.id, watch(source.getWatchable(), () => {
			debouncedSaveState();
			const columns = resultColumns.value.filter(column => column.source?.id === source.id || column.target?.id === source.id);
			for (const column of columns) {
				recalculateColumn(column);
			}
		}));
	}
}

onBeforeUnmount(() => {
	for (const unwatch of damageSourceWatchers.values()) {
		unwatch();
	}
});

function sectionRowCells(section: IDamageResultTableSection, row: IDamageResultTableSection['rows'][number]) {
	return resultColumns.value.map((column) => {
		return {
			key: `${section.id}-${row.id}-${column.id}`,
			computedColumn: computedResults.value
				.get((row as ICustomTotalSectionRow).sectionId ?? section.id)!
				.rows
				.get(row.id)!
				.columns
				.get(column!.id)!,
		};
	});
}

function columnDamageSourcesColorStyles(column: Pick<IDamageResultTableColumn, 'source' | 'target'>) {
	return {
		'--col-damage-source-clr': column.source?.color,
		'--col-damage-target-clr': column.target?.color,
	};
}

const columnDamageSourceColors = computed(() => resultColumns.value.map(column => columnDamageSourcesColorStyles(column)));

function recalculateAllColumns() {
	/* for now it's only called when `flipResults` is flipped */
	debouncedSaveState();
	for (const column of resultColumns.value) {
		for (const section of resultSections.value) {
			for (const row of section.rows) {
				computedResults.value.get(section.id)!.rows.get(row.id)!.columns.set(
					column.id,
					computeSectionRowColumn(section, row, column),
				);
			}
		}
	}
	recalculateResultCellComparisonNumbers();
}

function recalculateColumn(column: IDamageResultTableColumn) {
	addComputedColumnSources(column);

	for (const section of resultSections.value) {
		for (const row of section.rows) {
			computedResults.value.get(section.id)!.rows.get(row.id)!.columns.set(
				column.id,
				computeSectionRowColumn(section, row, column),
			);
		}
	}
	recalculateResultCellComparisonNumbers();
}

function addComputedColumnSources(column: IDamageResultTableColumn) {
	if (column.source) {
		column._computedSource = column.source.clone({}, true);
		column._computedSource.champion.value = column.source.champion.value;
	}

	if (column.target) {
		column._computedTarget = column.target.clone({}, true);
		column._computedTarget.champion.value = column.target.champion.value;
		if (column.source) {
			applyEffectsFromTo(column.source, column._computedTarget);
			column._computedTarget.calculationDamageTarget.value = column.source;
			column._computedSource!.calculationDamageTarget.value = column._computedTarget;
		}
	}
}

function recalculateResultCellComparisonNumbers() {
	for (const section of computedResults.value.values()) {
		calculateComputedSectionComparisonMaps(section);
	}
}

function calculateComputedSectionComparisonMaps(section: IComputedSection) {
	for (const row of section.rows.values()) {
		calculateComputedRowComparisonMap(row, section.sectionId);
	}
}

function calculateComputedRowComparisonMap(row: IComputedSectionRow, sectionId: string) {
	const columns = Array.from(row.columns.entries());

	for (const [idA, colA] of columns) {
		const map: IComputedSectionRowColumn['comparisonMap'] = {};

		for (const [idB, colB] of columns) {
			if (idA === idB) {
				continue;
			}

			const a = colA.numberValue;
			const b = colB.numberValue;
			if (a !== undefined && b !== undefined) {
				const meta = sectionId === 'a-stats' ? CHAMPION_STAT_META[row.rowId as IChampionStatName] : undefined;
				map[idB] = roundVariable((a - b) * (meta?.isPercentage ? 100 : 1));
			}
		}

		colA.comparisonMap = map;
	}
}

const cleanableColumnsSections = computed<[
	[index: number, column: IDamageResultTableColumn][],
	[index: number, section: IDamageResultTableSection][],
]>(() => {
	const anyColumnFilled = resultColumns.value.some(column => column.source || column.target);
	const columns = (resultColumns.value
		.map((column, index) => [index, column]) as [number, IDamageResultTableColumn][])
		.filter(([index, column]) => (anyColumnFilled || index !== resultColumns.value.length - 1) && !column.source && !column.target);

	const sections = (resultSections.value
		.map((section, index) => [index, section]) as [number, IDamageResultTableSection][])
		.filter(([, section]) => {
			if (section.abilityId.type === 'all') {
				return false;
			} else if (section.abilityId.type === AbilityType.item) {
				return !resultColumns.value.some(column =>
					column.source?.items.value.some(item => item?.id === section.abilityId.id) || column.target?.items.value.some(item => item?.id === section.abilityId.id),
				);
			} else if (section.abilityId.type === AbilityType.champion) {
				return !resultColumns.value.some(column =>
					column.source?.listedChampion.value?.id === section.abilityId.id || column.target?.listedChampion.value?.id === section.abilityId.id);
			} else if (section.abilityId.type === AbilityType.effect) {
				return !resultColumns.value.some(column =>
					column.source?.appliedEffects.value.some(effect => effect.abilityId.id === section.abilityId.id)
					|| column.source?.effectsAppliedToTarget.value.some(effectEntry => effectEntry[0].id === section.abilityId.id)
					|| column._computedTarget?.appliedEffects.value.some(effect => effect.abilityId.id === section.abilityId.id),
				);
			}

			/* this could consider dragon stacks too but atm only souls have abilities that can be added to results */
			return !resultColumns.value.some(column =>
				column.source?.dragonSoul.value === section.abilityId.id || column._computedTarget?.dragonSoul.value === section.abilityId.id,
			);
		},
		);

	return [columns, sections];
});

function cleanupUnused() {
	for (let i = cleanableColumnsSections.value[0].length - 1; i >= 0; i--) {
		const [columnIndex, column] = cleanableColumnsSections.value[0][i]!;
		for (const section of computedResults.value.values()) {
			for (const row of section.rows.values()) {
				row.columns.delete(column.id);
			}
		}
		resultColumns.value.splice(columnIndex, 1);
	}

	for (let i = cleanableColumnsSections.value[1].length - 1; i >= 0; i--) {
		const [sectionIndex, section] = cleanableColumnsSections.value[1][i]!;
		computedResults.value.delete(section.id);
		resultSections.value.splice(sectionIndex, 1);

		for (let i = customTotalRowIds.value.length - 1; i >= 0; i--) {
			const [sectionId] = customTotalRowIds.value[i]!.split('_');
			if (sectionId === section.id) {
				customTotalRowIds.value.splice(i, 1);
			}
		}
	}
}

function highlightColumnSources(column: IDamageResultTableColumn) {
	highlightedColumnId.value = column.id;
	column.source && highlightedDamageSources.add(column.source.id);
	column.target && highlightedDamageSources.add(column.target.id);
}

function lowlightColumnSources(column: IDamageResultTableColumn) {
	highlightedColumnId.value = undefined;
	column.source && highlightedDamageSources.remove(column.source.id);
	column.target && highlightedDamageSources.remove(column.target.id);
}

function highlightColumnIdSources(id: string) {
	const column = resultColumns.value.find(column => column.id === id);
	column && highlightColumnSources(column);
}

function lowlightColumnIdSources(id: string) {
	const column = resultColumns.value.find(column => column.id === id);
	column && lowlightColumnSources(column);
}

const highlightedColumns = computed(() => resultColumns.value.map(column =>
	highlightedColumnId.value
		? column.id === highlightedColumnId.value
		: (column.source && highlightedDamageSources.has(column.source.id)) || (column.target && highlightedDamageSources.has(column.target.id)),
));

function moveResultColumn(fromIndex: number, toIndex: number, copy: boolean) {
	const column: IDamageResultTableColumn = copy
		? { id: crypto.randomUUID(), source: resultColumns.value[fromIndex]!.source, target: resultColumns.value[fromIndex]!.target }
		: resultColumns.value.splice(fromIndex, 1)[0]!;

	resultColumns.value.splice(toIndex, 0, column);
	copy && addComputedColumn(column);
	debouncedSaveState();
}

const columnDragDropIndex = ref<number>();
let columnDraggedFromIndex: number | undefined;

function onResultColumnDragstart(index: number, event: DragEvent) {
	event.dataTransfer!.effectAllowed = globalKeyModifiers.value.alt ? 'copy' : 'move';
	columnDraggedFromIndex = index;

	const el = (event.target as HTMLElement).closest('div')!;
	event.dataTransfer!.setDragImage(el, 0, 0);
}

function onResultColumnDragenter(event: DragEvent, index: number) {
	if (columnDraggedFromIndex !== undefined) {
		([columnDragDropIndex.value] = getDropTargetIndex(event, index, columnDraggedFromIndex, false));
	}
}

function onResultColumnDragover(event: DragEvent, index: number) {
	if (columnDraggedFromIndex !== undefined) {
		([columnDragDropIndex.value] = getDropTargetIndex(event, index, columnDraggedFromIndex, false));
		if (columnDragDropIndex.value !== undefined) {
			event.preventDefault();
		}
	}
}

function onResultColumnDragleave(event: DragEvent) {
	if (columnDraggedFromIndex !== undefined) {
		if (
			!event.currentTarget || !event.relatedTarget
			|| !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)
		) {
			columnDragDropIndex.value = undefined;
		}
	}
}

function onResultColumnDrop(event: DragEvent, index: number) {
	columnDragDropIndex.value = undefined;

	const [toIndex, fromIndex] = getDropTargetIndex(event, index, columnDraggedFromIndex, false);
	if (toIndex === undefined || fromIndex === undefined) {
		return;
	}

	columnDraggedFromIndex = undefined;
	if (globalKeyModifiers.value.alt) {
		const column: IDamageResultTableColumn = {
			id: crypto.randomUUID(),
			source: resultColumns.value[fromIndex]!.source,
			target: resultColumns.value[fromIndex]!.target,
		};
		resultColumns.value.splice(toIndex, 0, column);
		addComputedColumn(column);
		return;
	}

	const [column] = resultColumns.value.splice(fromIndex, 1);
	const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

	resultColumns.value.splice(adjustedIndex, 0, column!);
	debouncedSaveState();
}

function endResultColumnDrag() {
	columnDraggedFromIndex = undefined;
}

function getDropTargetIndex(
	event: DragEvent,
	index: number,
	fromIndex: number | undefined,
	isVertical: boolean,
	combinedSiblingIsNext?: boolean,
): [toIndex: number | undefined, fromIndex: number | undefined] {
	if (fromIndex === undefined || fromIndex === index) {
		return [undefined, undefined];
	}

	let toIndex;
	if (index === fromIndex - 1) {
		toIndex = index;
	} else if (index === fromIndex + 1) {
		toIndex = index + 1;
	} else {
		const el = event.currentTarget as HTMLElement;
		const rect = combinedSiblingIsNext !== undefined ? combinedSiblingsRect(el, combinedSiblingIsNext) : el.getBoundingClientRect();
		const rectSize = rect[isVertical ? 'height' : 'width'];
		const posInEl = event[isVertical ? 'clientY' : 'clientX'] - rect[isVertical ? 'top' : 'left'];

		const midpoint = rectSize / 2;

		toIndex = posInEl < midpoint ? index : index + 1;
	}

	return [toIndex, fromIndex];
}

function moveResultSection(fromIndex: number, toIndex: number) {
	const [section] = resultSections.value.splice(fromIndex, 1);
	resultSections.value.splice(toIndex, 0, section!);
	debouncedSaveState();
}

const sectionDragDropIndex = ref<number>();
let sectionDraggedFromIndex: number | undefined;

function startResultSectionDrag(event: DragEvent, index: number) {
	event.dataTransfer!.effectAllowed = 'move';
	sectionDraggedFromIndex = index;

	const el = (event.target as HTMLElement).closest('tr')!;
	event.dataTransfer!.setDragImage(el, 0, 0);
}

function onResultSectionDragenter(event: DragEvent, index: number, isHeader?: boolean) {
	if (sectionDraggedFromIndex !== undefined) {
		([sectionDragDropIndex.value] = getDropTargetIndex(event, index, sectionDraggedFromIndex, true, isHeader));
	}
}

function onResultSectionDragover(event: DragEvent, index: number, isHeader?: boolean) {
	if (sectionDraggedFromIndex !== undefined) {
		([sectionDragDropIndex.value] = getDropTargetIndex(event, index, sectionDraggedFromIndex, true, isHeader));
		if (sectionDragDropIndex.value !== undefined) {
			event.preventDefault();
		}
	}
}

function onResultSectionDragleave(event: DragEvent) {
	if (sectionDraggedFromIndex !== undefined) {
		if (
			!event.currentTarget || !event.relatedTarget
			|| !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)
		) {
			sectionDragDropIndex.value = undefined;
		}
	}
}

function onResultSectionDrop(event: DragEvent, index: number, isHeader?: boolean) {
	sectionDragDropIndex.value = undefined;

	const [toIndex, fromIndex] = getDropTargetIndex(event, index, sectionDraggedFromIndex, true, isHeader);
	if (toIndex === undefined || fromIndex === undefined) {
		return;
	}

	sectionDraggedFromIndex = undefined;

	const [section] = resultSections.value.splice(fromIndex, 1);
	const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

	resultSections.value.splice(adjustedIndex, 0, section!);
	debouncedSaveState();
}

function endResultSectionDrag() {
	sectionDraggedFromIndex = undefined;
}

function combinedSiblingsRect(el: HTMLElement, isNext: boolean): DOMRect {
	let el1, el2;
	if (isNext) {
		el1 = el;
		el2 = (el.nextElementSibling as HTMLElement);
	} else {
		el1 = (el.previousElementSibling as HTMLElement);
		el2 = el;
	}

	const rect1 = el1.getBoundingClientRect();
	const rect2 = el2.getBoundingClientRect();

	/* section header row is sticky, this should take care of top of body possibly being above header */
	const top = rect2.top < rect1.top ? rect1.top : Math.min(rect1.top, rect2.top);
	const bottom = Math.max(rect1.bottom, rect2.bottom);
	const left = Math.min(rect1.left, rect2.left);
	const right = Math.max(rect1.right, rect2.right);

	return new DOMRect(left, top, right - left, bottom - top);
}

const { addItemTooltipViewListeners, removeItemTooltipViewListeners } = useItemHoverTooltipView('Inventory');

function sectionHasTooltip(sectionIndex: number, section: IDamageResultTableSection) {
	return implementedDamageSectionsMap.value[sectionIndex] && (section.hoverTooltipData || section.id === 'a-aa');
}

let hoveredSectionType: undefined | IDamageResultTableSection['abilityId']['type'];

function showSectionHoverTooltip(event: MouseEvent, abilityId: IDamageResultTableSection['abilityId']['type']) {
	hoveredSectionType = abilityId;
	const popover = (event.target as HTMLElement).querySelector('[popover]');
	if (popover) {
		(popover as HTMLElement).showPopover();
		(event.target as HTMLElement).addEventListener('mouseleave', hideSectionHoverTooltip, { once: true });
		if (hoveredSectionType === 'item') {
			addItemTooltipViewListeners();
		}
	}
}

function hideSectionHoverTooltip(event: MouseEvent) {
	const popover = (event.target as HTMLElement).querySelector('[popover]');
	(popover as HTMLElement)?.hidePopover();
	if (hoveredSectionType === 'item') {
		removeItemTooltipViewListeners();
	}
	hoveredSectionType = undefined;
}

interface IColumnAddableOption {
	championOptionIndex?: number;
	itemOptionsIndexes: number[];
}

const columnAddableSourceOptions = computed<IColumnAddableOption[]>(() =>
	resultColumns.value.map(column => columnAddableOption(column.source)),
);
const columnAddableTargetOptions = computed<IColumnAddableOption[]>(() =>
	resultColumns.value.map(column => columnAddableOption(column.target)),
);
const columnAddableOptions = computed(() => flipResults.value ? columnAddableTargetOptions.value : columnAddableSourceOptions.value);

function columnAddableOption(damageSource?: DamageSource): IColumnAddableOption {
	const rv: IColumnAddableOption = {
		championOptionIndex: undefined,
		itemOptionsIndexes: [],
	};

	if (damageSource?.champion.value) {
		rv.championOptionIndex = damageSectionOptions.value.findIndex(option => option.type === 'champion' && option.optionId === damageSource!.champion.value!.id);
		if (rv.championOptionIndex === -1) {
			rv.championOptionIndex = undefined;
		}
	}

	const itemOptions = damageSectionOptions.value.findLast(option => option.type === 'item');
	rv.itemOptionsIndexes = damageSource && itemOptions
		? damageSource!.items.value
			.map(item => item ? itemOptions.abilities.findIndex(ability => ability.id.id === item.id) : undefined)
			.filter(index => index !== undefined && ~index) as number[]
		: [];

	return rv;
}

async function addColumnAbilities(columnIndex: number) {
	const { championOptionIndex } = columnAddableOptions.value[columnIndex]!;
	const option = damageSectionOptions.value[championOptionIndex!];
	if (option) {
		for (let i = option.abilities.length - 1; i >= 0; i--) {
			addResultsSection(option.abilities[i]!.id, option.abilities[i]!.name);
		}
	}
	debouncedSaveState();
}

function addColumnItems(columnIndex: number) {
	const { itemOptionsIndexes } = columnAddableOptions.value[columnIndex]!;
	const option = damageSectionOptions.value.findLast(option => option.type === 'item');
	if (option) {
		/* `addResultsSection` causes the underlying ability to disappear, which would make indexes not match so first collect the relevant abilities then add them */
		const abilities = [];
		for (let i = itemOptionsIndexes.length - 1; i >= 0; i--) {
			const abilityIndex = itemOptionsIndexes[i]!;
			abilities.push(option.abilities[abilityIndex]!);
		}
		for (const ability of abilities) {
			addResultsSection(ability.id, ability.name);
		}
	}
	debouncedSaveState();
}

function onCustomTotalRowsChange() {
	recomputeCustomTotalRow();
	if (!expandedSections.value.includes(customTotalSection.id) && customTotalRowIds.value.length) {
		expandedSections.value.push(customTotalSection.id);
	}
	debouncedSaveState();
}

function recomputeCustomTotalRow() {
	for (const column of resultColumns.value) {
		customTotalComputedSectionTotalRow.columns.set(
			column.id,
			computeSectionRowColumn(customTotalSection, customTotalSectionTotalRow, column),
		);
	}
	calculateComputedRowComparisonMap(customTotalComputedSectionTotalRow, ResultSectionId.CustomTotal);
}

const colW = computed(() => {
	if (iconButtonsShowText.value) {
		return {
			controls: 160,
			header: 280,
			result: 172,
		};
	}

	const growUpToCols = 4;
	const n = growUpToCols - Math.min(resultColumns.value.length, growUpToCols);

	return {
		controls: 60,
		header: Math.round(280 + 140 * n / (growUpToCols + 1)),
		result: Math.round(120 + 90 * n / (growUpToCols + 1)),
	};
});

defineExpose({
	addResultsColumn,
	addComputedColumnSources,
	addResultsSection,
});
</script>

<template>
	<ClientOnly>
		<table
			id="results-table"
			:inert="!showResults"
			:aria-busy="resultColumns.some(column => column.source?.listedChampion.value && column.source.listedChampion.value.id !== column.source.champion.value?.id)"
			:data-flip-results="flipResults || undefined"
		>
			<caption>
				comparison table
			</caption>
			<thead>
				<tr>
					<th :width="`${colW.controls}px`" scope="col">
						<span>row controls</span>
					</th>
					<th id="results-table-header-damage-type" scope="col" :width="`${colW.header}px`">
						<span>damage type</span>
					</th>
					<th
						v-for="column in resultColumns"
						:key="column.id"
						scope="col"
						:width="`${colW.result}px`"
					>
						<span>
							{{ column.source && sourceOptions.find(option => option[0] === column.source!.id)?.[1] || 'undefined source' }}
							vs
							{{ column.target && targetOptions.find(option => option[0] === column.target!.id)?.[1] || 'undefined target' }}
						</span>
					</th>
				</tr>
				<tr>
					<td :width="`${colW.controls + colW.header}px`" colspan="2">
						<div>
							<a href="#results-table-section-header-aa" class="skip-link">
								skip column controls
							</a>
							<label for="results-table-values-for">
								<input
									id="results-table-values-for"
									v-model="flipResults"
									type="checkbox"
									@update:model-value="recalculateAllColumns"
								>
								flip results (target vs source)
							</label>
							<button
								class="pretend-ui-btn"
								:disabled="!cleanableColumnsSections[0].length && !cleanableColumnsSections[1].length"
								title="remove empty columns and sections without corresponding damage source"
								@click="cleanupUnused"
							>
								remove unused
								<span>(empty columns and sections without corresponding damage source)</span>
							</button>
							<form @submit.prevent="submitResultsSection">
								<label for="results-table-row-new-section-ability">add section</label>
								<select
									id="results-table-row-new-section-ability"
									name="sectionOptionIndex"
									required
									:disabled="!damageSectionOptions.length"
								>
									<option v-if="!damageSectionOptions.length">
										no options left
									</option>
									<optgroup v-for="(option, optionIndex) in damageSectionOptions" :key="option.optionId" :label="`${option.optionName}${enableUnimplementedUi || option.optionId === 'items' ? '' : ' NOT IMPLEMENTED, COMING SOON'}`">
										<option
											v-for="(ability, abilityIndex) in option.abilities"
											:key="GameAbilityId.stringify(ability.id, CHAMPION_ID_TO_KEY, EFFECT_SPECIFICS_OBJECT_ENTRIES)"
											:value="`${optionIndex}-${abilityIndex}`"
											:disabled="enableUnimplementedUi ? undefined : !(ability.id.type !== AbilityType.champion || ability.id.abilityKey === 'passive')"
										>
											{{ ability.name }}
										</option>
									</optgroup>
								</select>
								<button
									class="pretend-ui-btn"
									type="submit"
									:disabled="!damageSectionOptions.length
										|| !enableUnimplementedUi
										&& !damageSectionOptions.some(option => option.type !== AbilityType.champion || option.abilities.some(ability => (ability.id as IChampionAbilityId).abilityKey === 'passive'))"
								>
									add
								</button>
							</form>
						</div>
					</td>
					<td
						v-for="(column, index) in resultColumns"
						:key="column.id"
						:width="`${colW.result}px`"
						:data-drop-direction="columnDragDropIndex === index ? 'before' : columnDragDropIndex === index + 1 ? 'after' : undefined"
						:class="{ highlighted: highlightedColumns[index] }"
						:style="columnDamageSourcesColorStyles(column)"
						@mouseenter="highlightColumnSources(column)"
						@focusin="highlightColumnSources(column)"
						@mouseleave="lowlightColumnSources(column)"
						@focusout="lowlightColumnSources(column)"
						@dragenter="onResultColumnDragenter($event, index)"
						@dragover="onResultColumnDragover($event, index)"
						@dragleave="onResultColumnDragleave"
						@drop="onResultColumnDrop($event, index)"
					>
						<div>
							<VSelect
								:id="`results-table-column-source-${index}`"
								:model-value="resultColumns[index]!.source?.id"
								label="column's damage source"
								:options="sourceOptions"
								clearable
								@update:model-value="setColumnChampion(column, damageSources, $event)"
							>
								<img
									v-if="column.source?.listedChampion.value"
									:src="championImage(column.source.listedChampion.value!.image, column.source.listedChampion.value!.id)"
									loading="lazy"
									:width="championImageSize(column.source.listedChampion.value!.id)"
									:height="championImageSize(column.source.listedChampion.value!.id)"
									style="--focus-brightness: 1.2"
									aria-hidden="true"
								>
								<img
									v-else
									:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
									width="256"
									height="256"
									style="--focus-brightness: 1.5"
									aria-hidden="true"
								>
							</VSelect>
							<span>vs</span>
							<VSelect
								:id="`results-table-column-target-${index}`"
								:model-value="resultColumns[index]!.target?.id"
								label="column's damage target"
								:options="targetOptions"
								clearable
								@update:model-value="setColumnChampion(column, damageTargets, $event)"
							>
								<img
									v-if="column.target?.listedChampion.value"
									:src="championImage(column.target.listedChampion.value!.image, column.target.listedChampion.value!.id)"
									loading="lazy"
									:width="championImageSize(column.target.listedChampion.value!.id)"
									:height="championImageSize(column.target.listedChampion.value!.id)"
									style="--focus-brightness: 1.2"
									aria-hidden="true"
								>
								<img
									v-else
									:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
									width="256"
									height="256"
									style="--focus-brightness: 1.5"
									aria-hidden="true"
								>
							</VSelect>
							<button v-if="index === resultColumns.length - 1" class="pretend-ui-btn" @click="addResultsColumn()">
								add column
							</button>
							<template v-if="index === resultColumns.length - 1 && iconButtonsShowText">
								<button
									title="remove"
									class="pretend-ui-btn remove"
									:disabled="resultColumns.length === 1"
									@click="startRemovingColumn($event, index)"
								>
									<span>remove</span>
									<Icon class="i-ph:trash" />
								</button>
								<button style="display: none">
									restore
								</button>
							</template>
							<template v-else-if="index !== resultColumns.length - 1">
								<button
									:title="`${iconButtonsShowText ? '' : 'move left, '}alt+click to duplicate to the left`"
									class="pretend-ui-btn"
									:disabled="index === 0"
									draggable="true"
									@click="moveResultColumn(index, index + (globalKeyModifiers.alt ? 0 : -1), globalKeyModifiers.alt)"
									@dragstart="onResultColumnDragstart(index, $event)"
									@dragend="endResultColumnDrag"
								>
									<span>move left <span>(alt+click to duplicate to the left)</span></span>
									<Icon class="i-ph:arrow-left" />
								</button>
								<button
									title="remove"
									class="pretend-ui-btn remove"
									@click="startRemovingColumn($event, index)"
								>
									<span>remove</span>
									<Icon class="i-ph:trash" />
								</button>
								<button
									:title="`${iconButtonsShowText ? '' : 'move right, '}alt+click to duplicate to the right`"
									class="pretend-ui-btn"
									draggable="true"
									@click="moveResultColumn(index, index + 1, globalKeyModifiers.alt)"
									@dragstart="onResultColumnDragstart(index, $event)"
									@dragend="endResultColumnDrag"
								>
									<span>move right <span>(alt+click to duplicate to the right)</span></span>
									<Icon class="i-ph:arrow-right" />
								</button>
								<button style="display: none">
									restore
								</button>
							</template>
							<button
								class="pretend-ui-btn"
								:disabled="columnAddableOptions[index]?.championOptionIndex === undefined"
								@click="addColumnAbilities(index)"
							>
								add abilities
							</button>
							<button
								class="pretend-ui-btn"
								:disabled="!columnAddableOptions[index]?.itemOptionsIndexes.length"
								@click="addColumnItems(index)"
							>
								add items
							</button>
						</div>
					</td>
				<!-- TODO figure out where to put these -->
				<!-- <a href="#results-header" class="skip-link"> -->
				<!-- 	skip back to results start -->
				<!-- </a> -->
				<!-- <a id="results-table-skip-rows" href="#results-table-row-new-section-ability" class="skip-link"> -->
				<!-- 	skip result rows -->
				<!-- </a> -->
				</tr>
			</thead>
			<template v-for="(section, index) in resultSections" :key="section.id">
				<tbody
					:data-drop-direction="sectionDragDropIndex === index
						? 'before'
						: (!expandedSections.includes(section.id) && sectionDragDropIndex === index + 1) ? 'after' : undefined"
					:aria-busy="!section.image"
					@mousedown="preventDoubleClickSelect"
					@dblclick="toggleResultsSection(section.id)"
					@dragenter="onResultSectionDragenter($event, index, true)"
					@dragover="onResultSectionDragover($event, index, true)"
					@dragleave="onResultSectionDragleave"
					@drop="onResultSectionDrop($event, index, true)"
				>
					<tr>
						<td :headers="`results-table-section-header-${section.id}`">
							<button
								title="move up"
								class="pretend-ui-btn"
								:disabled="index === 0"
								draggable="true"
								@dblclick.stop=""
								@click.stop="moveResultSection(index, index - 1)"
								@dragstart="startResultSectionDrag($event, index)"
								@dragend="endResultSectionDrag"
							>
								<span>move up</span>
								<Icon class="i-ph:arrow-up" />
							</button>
							<button
								title="move down"
								class="pretend-ui-btn"
								draggable="true"
								:disabled="index === (resultSections.length - 1)"
								@dblclick.stop=""
								@click.stop="moveResultSection(index, index + 1)"
								@dragstart="startResultSectionDrag($event, index)"
								@dragend="endResultSectionDrag"
							>
								<span>move down</span>
								<Icon class="i-ph:arrow-down" />
							</button>
							<button
								class="pretend-ui-btn remove"
								:title="section.isCustomTotal ? 'clear' : 'remove'"
								:disabled="section.isCustomTotal ? !customTotalRowIds.length : section.isPermanent"
								@dblclick.stop=""
								@click.stop="removeResultsSection(index)"
							>
								<span>{{ section.isCustomTotal ? 'clear' : 'remove' }}</span>
								<Icon :class="section.isCustomTotal ? 'i-ph:eraser' : 'i-ph:trash'" />
							</button>
							<button
								:title="expandedSections.includes(section.id) ? 'collapse' : 'expand'"
								class="pretend-ui-btn"
								:aria-expanded="expandedSections.includes(section.id)"
								:aria-controls="`results-table-section-body-${section.id}`"
								@dblclick.stop=""
								@click.stop="toggleResultsSection(section.id)"
							>
								<span>
									{{ expandedSections.includes(section.id) ? 'collapse' : 'expand' }}
								</span>
								<Icon class="i-ph:caret-down" />
							</button>
						</td>
						<th
							:id="`results-table-section-header-${section.id}`"
							scope="colgroup"
							:colspan="1 + resultColumns.length"
						>
							<div @mouseenter="sectionHasTooltip(index, section) && showSectionHoverTooltip($event, section.abilityId.type)">
								<img
									v-bind="section.image && gameImageAttrs(section.image, 24)"
									aria-hidden="true"
								>
								<span v-html="section.image ? section.name : 'loading...'" />
								<template v-if="sectionHasTooltip(index, section)">
									<article v-if="section.abilityId.type === AbilityType.item" popover="manual" class="hover-tooltip champion-item">
										<LolItemDescription v-bind="section.hoverTooltipData as any" hover-tooltip source="Inventory" />
									</article>
									<LolChampionAbilityHoverTooltip
										v-else-if="section.abilityId.type === AbilityType.champion"
										v-bind="section.hoverTooltipData as any"
									/>
									<LolEffectHoverTooltip
										v-else-if="section.abilityId.type === AbilityType.effect"
										v-bind="section.hoverTooltipData as any"
									/>
									<LolDragonHoverTooltip
										v-else-if="section.abilityId.type === AbilityType.dragon"
										v-bind="section.hoverTooltipData as any"
									/>
									<article v-else-if="section.id === 'a-aa'" popover="hint" class="hover-tooltip custom">
										TODO aa hover tooltip
									</article>
								</template>
								<template v-if="section.selectOptions?.length">
									<label :for="`results-table-header-select-${section.id}`">
										{{ section.selectLabel }}
									</label>
									<select
										:id="`results-table-header-select-${section.id}`"
										v-model="section.selectValue"
										@update:model-value="addComputedSection(section.id)"
									>
										<option v-for="[value, optionText] in section.selectOptions" :key="value" :value>
											{{ optionText }}
										</option>
									</select>
								</template>
							</div>
						</th>
					</tr>
				</tbody>
				<tbody
					:id="`results-table-section-body-${section.id}`"
					:aria-labelledby="`results-table-section-header-${section.id}`"
					:hidden="!expandedSections.includes(section.id)"
					:data-drop-direction="sectionDragDropIndex === index + 1 ? 'after' : undefined"
					:aria-busy="!section.image"
					@dragenter="onResultSectionDragenter($event, index, false)"
					@dragover="onResultSectionDragover($event, index, false)"
					@dragleave="onResultSectionDragleave"
					@drop="onResultSectionDrop($event, index, false)"
				>
					<tr v-if="!implementedDamageSectionsMap[index]" class="info-row">
						<td :colspan="2 + resultColumns.length">
							<ComingSoonCover feature="champion abilities" class="text-neutral-400" />
						</td>
					</tr>
					<tr v-else-if="!section.image" class="info-row">
						<td :colspan="2 + resultColumns.length">
							loading...
						</td>
					</tr>
					<tr v-else-if="section.isCustomTotal ? computedCustomTotalRows.length < 2 : !section.rows.length" class="info-row">
						<td :colspan="2 + resultColumns.length">
							{{ section.isCustomTotal ? 'check boxes next to variable rows to sum them' : 'no variables detected' }}
						</td>
					</tr>
					<tr
						v-for="row in section.isCustomTotal
							? (computedCustomTotalRows.length > 1 ? computedCustomTotalRows : [])
							: implementedDamageSectionsMap[index] ? section.rows : []"
						:key="`${section.id}_${row.id}`"
						:class="{ unknown: row.isUnknown }"
					>
						<td v-if="!section.isCustomTotal && section.id !== ResultSectionId.Stats">
							<label>
								<span>include in custom total</span>
								<input
									v-model="customTotalRowIds"
									type="checkbox"
									:value="`${section.id}_${row.id}`"
									@update:model-value="onCustomTotalRowsChange"
								>
							</label>
						</td>
						<th
							scope="row"
							:colspan="section.isCustomTotal || section.id === ResultSectionId.Stats ? 2 : undefined"
							headers="results-table-header-damage-type"
						>
							<img
								v-if="row.image"
								v-bind="gameImageAttrs(row.image)"
								aria-hidden="true"
							>
							<span v-if="row.isUnknown">unknown</span>
							{{ row.name }}
							<span
								v-if="row.isCustom"
								:aria-describedby="`${section.id}-${row.id}-tooltip-custom`"
								tabindex="0"
								class="info-tooltip-trigger"
								@focus="showRowTooltip($event, true)"
								@mouseenter="showRowTooltip($event, true)"
								@mouseleave="hideRowTooltip($event, true)"
								@blur="hideRowTooltip($event, true)"
							>
								<img
									src="/logo_dark.webp"
									alt="lolcalc logo"
									width="192"
									height="192"
								>
							</span>
							<p
								:id="`${section.id}-${row.id}-tooltip-custom`"
								popover="hint"
								class="hover-tooltip"
								@focus="showRowTooltip($event, false)"
								@mouseenter="showRowTooltip($event, false)"
								@mouseleave="hideRowTooltip($event, false)"
								@focusout="hideRowTooltip($event, false)"
							>
								this variable is added by <strong>lolcalc</strong>. It's either not present in the original description or a calculated version of an existent one
							</p>
							<span
								v-if="row.additionalInfo"
								:aria-describedby="`${section.id}-${row.id}-tooltip-info`"
								class="info-tooltip-trigger"
								tabindex="0"
								@focus="showRowTooltip($event, true)"
								@mouseenter="showRowTooltip($event, true)"
								@mouseleave="hideRowTooltip($event, true)"
								@blur="hideRowTooltip($event, true)"
							>
								<span>additional info</span>
								<Icon class="i-ph:info-fill" />
							</span>
							<p
								:id="`${section.id}-${row.id}-tooltip-info`"
								popover="hint"
								class="hover-tooltip"
								@focus="showRowTooltip($event, false)"
								@mouseenter="showRowTooltip($event, false)"
								@mouseleave="hideRowTooltip($event, false)"
								@focusout="hideRowTooltip($event, false)"
								v-html="row.additionalInfo"
							/>
						</th>
						<td
							v-for="(cell, cellIndex) in sectionRowCells(section, row)"
							:key="cell.key"
							:class="{
								unknown: cell.computedColumn.isUnknown,
								irrelevant: cell.computedColumn.isIrrelevant,
								highlighted: highlightedColumns[cellIndex],
							}"
							:style="columnDamageSourceColors[cellIndex]"
							:data-drop-direction="columnDragDropIndex === cellIndex ? 'before' : columnDragDropIndex === cellIndex + 1 ? 'after' : undefined"
							@mouseenter="highlightColumnIdSources(cell.computedColumn.columnId)"
							@mouseleave="lowlightColumnIdSources(cell.computedColumn.columnId)"
							@dragenter="onResultColumnDragenter($event, cellIndex)"
							@dragover="onResultColumnDragover($event, cellIndex)"
							@dragleave="onResultColumnDragleave"
							@drop="onResultColumnDrop($event, cellIndex)"
						>
							<span
								v-bind="highlightedColumnId && (cell.computedColumn.comparisonMap[highlightedColumnId] !== 0) ? {
									[cell.computedColumn.comparisonMap[highlightedColumnId!]! < 0 ? 'data-lower' : 'data-higher']:
										cell.computedColumn.comparisonMap[highlightedColumnId!],
								} : undefined"
							>
								{{ cell.computedColumn.value }}
							</span>
						</td>
					</tr>
				</tbody>
			</template>
			<tfoot>
				<tr>
					<td colspan="-1" />
				</tr>
			</tfoot>
		</table>
		<template #fallback>
			<table id="results-table" inert>
				<caption>
					comparison table
				</caption>
				<thead>
					<tr>
						<th :width="`${colW.controls}px`" scope="col">
							<span>row controls</span>
						</th>
						<th id="results-table-header-damage-type" scope="col" :width="`${colW.header}px`">
							<span>damage type</span>
						</th>
						<th
							scope="col"
							:width="`${colW.result}px`"
						>
							<span>
								undefined source
								vs
								undefined target
							</span>
						</th>
					</tr>
					<tr>
						<td :width="`${colW.controls + colW.header}px`" colspan="2">
							<div>
								<label for="results-table-values-for">
									<input
										id="results-table-values-for"
										type="checkbox"
									>
									flip results (target vs source)
								</label>
								<button class="pretend-ui-btn">
									remove unused
								</button>
								<span aria-hidden="true">damage type</span>
							</div>
						</td>
						<td :width="`${colW.result}px`">
							<div>
								<VSelect
									id="results-table-column-source-0"
									label="column's damage source"
									:options="[]"
									clearable
								>
									<img
										:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
										width="256"
										height="256"
										aria-hidden="true"
									>
								</VSelect>
								<span>vs</span>
								<VSelect
									id="results-table-column-target-0"
									label="column's damage target"
									:options="[]"
									clearable
								>
									<img
										:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
										width="256"
										height="256"
										aria-hidden="true"
									>
								</VSelect>
								<button class="pretend-ui-btn">
									add column
								</button>
							</div>
						</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<button class="pretend-ui-btn">
								move up
							</button>
							<button class="pretend-ui-btn">
								move down
							</button>
							<button class="pretend-ui-btn">
								move remove
							</button>
							<button class="pretend-ui-btn">
								move expand
							</button>
						</td>
						<th scope="colgroup" colspan="2">
							<div>
								<img
									src=""
									width=""
									height=""
									aria-hidden="true"
								>
								<span>loading...</span>
							</div>
						</th>
					</tr>
				</tbody>
				<tbody hidden />
				<tfoot>
					<tr>
						<td colspan="-1" />
					</tr>
				</tfoot>
			</table>
		</template>
	</ClientOnly>
</template>

<style>
@layer components {
	#results-table {
		--at-apply: 'mx-auto border-separate border-spacing-0 bg-[--bg-clr] b b-[--b-clr] mb-10 h-px';
		--b-clr: theme('colors.neutral.600');
		--bg-clr: theme('colors.slate.950');
		--table-ps: calc(3 * var(--spacing));
		--control-btn-size: calc(6 * var(--spacing));
		--header-row-gap-y: calc(3 * var(--spacing));
		--header-champion-select-size: calc(10 * var(--spacing));
		--header-row-pb: calc(3 * var(--spacing));
		--header-row-pt: calc(2 * var(--spacing));
		--header-h: calc(
			var(--header-row-pt) + var(--header-row-pb) + var(--header-champion-select-size) + 2 * var(--header-row-gap-y) +
				3 * var(--control-btn-size) - 1px
		); /* offset by 1 px to undouble button borders */
		--section-header-row-pt: calc(2 * var(--spacing));
		--section-header-row-pb: calc(1 * var(--spacing));
		--section-body-pb: 0px;
		--section-row-btn-size: calc(6 * var(--spacing));

		[data-icon-btns-show-text] & {
			--header-h: calc(
				var(--header-row-pt) + var(--header-row-pb) + var(--header-champion-select-size) + 2 * var(--header-row-gap-y) +
					4 * var(--control-btn-size) - 2px
			);
		}

		&[inert],
		&[inert] > caption {
			--at-apply: 'blur-3';
		}

		> caption {
			--at-apply: 'sr-only';
		}

		th {
			--at-apply: 'text-start font-normal';
		}

		> thead {
			--at-apply: 'sticky top-0 z-5';

			> tr:nth-child(1) > th > * {
				--at-apply: 'sr-only';
			}

			> tr:nth-child(2) {
				--at-apply: 'min-h-px h-full';

				> * {
					--at-apply: 'pt-[--header-row-pt] b-b b-[--b-clr]';
				}
			}

			> tr:nth-child(2) > td:first-child {
				--at-apply: 'ps-[--table-ps] pb-[--header-row-pb] bg-[--bg-clr] min-h-px h-inherit text-start align-top';

				> div {
					--at-apply: 'flex flex-col items-start h-full';

					> button {
						--at-apply: 'px-1 leading-5 h-[--control-btn-size] text-base mb-auto mt-2';

						> span {
							--at-apply: 'sr-only';
						}
					}

					> form {
						--at-apply: 'grid grid-cols-[auto_1fr] auto-rows-min gap-x-2';

						> label {
							--at-apply: 'col-span-full text-start';
						}

						> select {
							--at-apply: 'w-64 px-1.5 bg-white text-black';
							color-scheme: light;

							&:disabled {
								--at-apply: 'text-neutral-700 bg-neutral-200';
							}
						}

						> button {
							--at-apply: 'w-fit px-2 h-[--control-btn-size]';
						}
					}
				}
			}

			> tr:nth-child(2) > td:not(:first-child) {
				--at-apply: 'pb-[--header-row-pb] bg-[--bg-clr] align-top';

				&[data-drop-direction]::after {
					--at-apply: 'content-empty absolute z-3 start-0.25 top-0 translate-y-[--control-btn-size] size-4 rotate-270 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}

				&[data-drop-direction='after']::after {
					--at-apply: 'end-0.25 start-auto rotate-90';
				}

				> div {
					--at-apply: 'grid grid-rows-[auto_1fr] relative grid-cols-[1fr_var(--control-btn-size)_1fr]';
					grid-template-areas:
						'move-left remove move-right'
						'source vs target'
						'add-abilities add-abilities add-abilities'
						'add-items add-items add-items';

					[data-icon-btns-show-text] & {
						--at-apply: 'grid-rows-[auto_auto_1fr] grid-cols-[1fr_auto_auto_1fr] px-2';
						--btn-w: calc(26 * var(--spacing));
						grid-template-areas:
							'move-left move-left move-right move-right'
							'remove remove remove remove'
							'source vs vs target'
							'add-abilities add-abilities add-abilities add-abilities'
							'add-items add-items add-items add-items';
					}

					> .v-select {
						--at-apply: 'size-[--header-champion-select-size] my-[--header-row-gap-y]';
						--b-width: 2px;

						&:has(> select[value]) {
							--b-width: 2.5px;
						}

						&:nth-of-type(1) {
							--at-apply: 'justify-self-end';
							grid-area: source;
						}

						&:nth-of-type(2) {
							grid-area: target;
						}

						> select {
							--at-apply: 'rounded-1/2 size-full';
						}

						> label {
							--at-apply: 'rounded-1/2 size-full of-hidden bg-[--placeholder-champion-bg-clr] b-[length:--b-width]';
							border-color: var(--col-damage-source-clr, var(--ui-btn-border-clr));

							> img {
								--at-apply: 'max-w-none size-[115%] -ms-[7.5%] -mt-[7.5%]';
							}
						}

						> select:is(:hover, :focus-visible) + label {
							--at-apply: 'bg-neutral-800';

							> img {
								--at-apply: 'brightness-[--focus-brightness]';
							}
						}

						&:nth-of-type(2) > label {
							border-color: var(--col-damage-target-clr, var(--ui-btn-border-clr));
						}
					}

					> span {
						--at-apply: 'pointer-events-none text-center self-center text-lg font-600 z-1';
						-webkit-text-stroke: black 0.15em;
						paint-order: stroke fill;
						grid-area: vs;

						[data-icon-btns-show-text] & {
							--at-apply: 'px-0.75';
						}
					}

					> button {
						&:nth-last-of-type(2) {
							grid-area: add-abilities;
						}

						&:nth-last-of-type(1) {
							--at-apply: '-mt-px z-1';
							grid-area: add-items;
						}

						&:nth-last-of-type(-n + 2) {
							--at-apply: 'mx-2 h-[--control-btn-size] leading-5';

							[data-icon-btns-show-text] & {
								--at-apply: 'mx-auto w-26';
							}
						}

						[data-icon-btns-show-text] & {
							--at-apply: 'text-sm';
						}
					}
				}

				&:not(:last-child) > div {
					> button {
						--at-apply: 'grid place-items-center self-center';

						&:nth-of-type(-n + 3):not(:last-child) {
							--at-apply: 'size-[--control-btn-size]';

							> .icon {
								--at-apply: 'size-5';
							}

							[data-icon-btns-show-text] & {
								--at-apply: 'px-1.5';

								> span {
									--at-apply: 'whitespace-nowrap';
								}
							}
						}

						&:nth-of-type(1) {
							--at-apply: 'justify-self-end -me-px';
							grid-area: move-left;

							[data-icon-btns-show-text] & {
								--at-apply: '-me-[0.5px] w-full';
							}
						}

						&:nth-of-type(2) {
							--at-apply: 'z-1';
							grid-area: remove;

							[data-icon-btns-show-text] & {
								--at-apply: 'mx-auto w-[--btn-w] -mt-px z-1';
							}
						}

						&:nth-of-type(3) {
							--at-apply: 'justify-self-start -ms-px z-1';
							grid-area: move-right;

							[data-icon-btns-show-text] & {
								--at-apply: '-ms-[0.5px] w-full';
							}
						}

						&:nth-of-type(4) {
							--at-apply: 'absolute inset-0 -top-[--header-row-pt] h-[calc(100%+2*var(--header-row-pt))] grid place-items-center text-center text-xl font-600 backdrop-blur-2 z-10 tracking-wide focus-visible:outline-none bg-black/20';
							-webkit-text-stroke: black 0.15em;
							paint-order: stroke fill;

							&::before {
								--at-apply: 'content-empty absolute top-1/2 start-1/2 translate-center outline-auto h-7 w-[4.5em]';
							}
						}
					}
				}

				&:last-child > div {
					> button {
						&:nth-of-type(1) {
							--at-apply: 'w-auto px-1 justify-self-center h-[--control-btn-size]';
							grid-area: 1 / 1 / 2 / 4;

							[data-icon-btns-show-text] & {
								grid-area: 1 / 1 / 2 / 5;
							}
						}

						[data-icon-btns-show-text] & {
							--at-apply: 'w-[--btn-w] mx-auto';

							&:nth-of-type(2) {
								--at-apply: 'mx-auto -mt-px z-1 col-span-full h-[--control-btn-size]';
							}

							&:nth-of-type(3):not(:nth-last-of-type(2)) {
								--at-apply: 'absolute inset-0 h-full grid place-items-center text-center text-xl font-600 backdrop-blur-2 z-10 tracking-wide focus-visible:outline-none bg-black/20';
								-webkit-text-stroke: black 0.15em;
								paint-order: stroke fill;

								&::before {
									--at-apply: 'content-empty absolute top-1/2 start-1/2 translate-center outline-auto h-7 w-[4.5em]';
								}
							}
						}
					}
				}
			}
		}

		> tbody {
			anchor-scope: all;

			&:not([aria-labelledby]) {
				--at-apply: 'sticky top-[--header-h] z-4 bg-[--bg-clr]';

				> tr {
					anchor-name: --section-header-row;

					> td {
						--at-apply: 'grid grid-flow-col grid-cols-2 grid-rows-2 ps-[--table-ps]';

						[data-icon-btns-show-text] & {
							--at-apply: 'grid-cols-[1fr_calc(16*var(--spacing))]';
						}

						> button {
							--at-apply: 'size-(--section-row-btn-size) grid place-items-center';

							> .icon {
								--at-apply: 'size-5';
							}

							&[aria-expanded='true'] > span {
								--at-apply: 'rotate-180';
							}

							[data-icon-btns-show-text] &[aria-expanded='true'] > span {
								--at-apply: 'rotate-0';
							}

							&:nth-of-type(2),
							&:nth-of-type(4) {
								--at-apply: '-mt-px z-1';
							}

							&:nth-of-type(3),
							&:nth-of-type(4) {
								--at-apply: '-ms-px z-2';
							}

							[data-icon-btns-show-text] & {
								--at-apply: 'w-auto px-1.5 text-center';

								> span {
									--at-apply: 'whitespace-nowrap';
								}
							}
						}
					}

					> * {
						--at-apply: 'pt-[--section-header-row-pt] pb-[--section-header-row-pb]';
					}

					> th > div {
						--at-apply: 'w-max';

						> span,
						> select {
							--at-apply: 'text-lg font-500 whitespace-nowrap';
						}

						> span {
							> unknown {
								color: var(--unknown-clr);
							}
						}

						> img {
							--at-apply: 'size-6 ms-3 me-1.5 inline-block';
						}

						> [popover] {
							position-anchor: --section-header-row;
							inset-block-start: auto;
							inset-block-end: calc(
								anchor(end) + var(--section-header-row-pb) + 2 * var(--section-row-btn-size) - 0.5px
							);
						}

						> .hover-tooltip.custom {
							--at-apply: 'max-inline-160';

							justify-self: anchor-center;
							position-try: flip-block;
						}

						> label {
							--at-apply: 'sr-only';
						}

						> select {
							--at-apply: 'px-1 ms-[0.5ch]';
						}
					}
				}

				&:not(:first-of-type) {
					--at-apply: 'top-[calc(var(--header-h)-var(--pt)+var(--section-header-row-pt))]';
					--pt: calc(6 * var(--spacing));

					> tr > * {
						--at-apply: 'pt-[--pt]';
					}
				}
			}

			&[aria-labelledby] {
				--at-apply: 'text-neutral-200';

				> tr {
					&.info-row {
						--at-apply: 'text-neutral-400 font-600';
					}

					&:where(:not(.info-row)):hover {
						--at-apply: 'text-white';

						> * {
							--at-apply: 'b-[--ui-btn-border-clr]';
						}

						> td:not(.irrelevant) {
							&:has(> span[data-higher]) {
								--at-apply: 'text-green-400';

								> span::after {
									content: '+' attr(data-higher);
								}
							}

							&:has(> span[data-lower]) {
								--at-apply: 'text-red-400';

								> span::after {
									content: attr(data-lower);
								}
							}
						}
					}

					&.unknown {
						--at-apply: 'text-[#f0f]';
					}

					> * {
						--at-apply: 'py-1 b-y b-transparent';
					}

					> th {
						--at-apply: 'hyphens-auto wrap-anywhere';
						--ps: calc(2 * var(--control-btn-size));
						anchor-scope: --parent;

						&[colspan] {
							--at-apply: 'ps-[calc(var(--table-ps)+var(--ps))]';
						}

						> img {
							--at-apply: 'inline-block size-[--size] align-middle -ms-[--ms] me-[calc(0.5*var(--size))]';
							--size: calc(5 * var(--spacing));
							--ms: calc(0.5 * (var(--ps) + var(--size)));
						}

						> span:not([aria-describedby]) {
							--at-apply: 'sr-only';
						}
					}

					> td {
						--at-apply: 'px-3';

						&:first-child {
							> label {
								--at-apply: 'absolute inset-0 grid-center ms-[--table-ps]';

								> span {
									--at-apply: 'sr-only';
								}

								[data-icon-btns-show-text] & {
									--at-apply: 'justify-items-end pe-6';
								}
							}
						}

						&.irrelevant {
							--at-apply: 'text-neutral-500';
						}

						&.unknown {
							--at-apply: 'text-[#f0f]';
						}

						&:not(.irrelevant) > span {
							--at-apply: 'relative';

							&::after {
								--at-apply: 'absolute text-xs top-1/2 -translate-y-1/2 -end-1.5 translate-x-full whitespace-nowrap brightness-70';
							}
						}
					}

					&:nth-child(even) {
						--at-apply: 'bg-white/05';
					}
				}
			}
		}

		&:not([inert]) {
			> thead > tr:nth-child(2) > td:nth-child(n + 2).highlighted,
			> tbody[aria-labelledby] > tr > td.highlighted {
				background-image: linear-gradient(
					to right,
					oklch(from var(--source-clr, var(--col-damage-source-clr, white)) l c h / 0.12),
					oklch(from var(--target-clr, var(--col-damage-target-clr, white)) l c h / 0.12)
				);
			}
		}

		> thead > tr:nth-child(2) > td,
		> tbody[aria-labelledby] > tr > td,
		> tbody[aria-labelledby] {
			--at-apply: 'relative isolate';
		}

		> thead > tr:nth-child(2) > td,
		> tbody[aria-labelledby] > tr > td,
		> tbody {
			&[data-drop-direction] {
				--drop-indicator-bg-direction: 90deg;
				--drop-indicator-b-w: 1px;

				&::before {
					--at-apply: 'content-empty absolute z-3 start-0 -end-[0.5px] -top-px -bottom-px';
					background-image: linear-gradient(
						var(--drop-indicator-bg-direction),
						hsl(0 100% 100%) 0px,
						hsl(0 100% 100%) var(--drop-indicator-b-w),
						hsl(0 100% 100% / 0.2) var(--drop-indicator-b-w),
						transparent 1rem
					);
				}
			}

			&[data-drop-direction='after'] {
				--drop-indicator-bg-direction: 270deg;
				--drop-indicator-b-w: 0px;

				&::before {
					--at-apply: 'start-[0.5px] end-0';
				}
			}
		}

		> tbody:not([aria-labelledby]):has(+ tbody[data-drop-direction='after']) {
			&::before {
				--at-apply: 'content-empty absolute inset-0 z-3';
			}
		}

		> tfoot {
			> tr > td {
				--at-apply: 'pb-[--header-row-pt]';
			}
		}
	}
}

@layer overrides {
	#results-table {
		&[data-flip-results] {
			> thead > tr:nth-child(2) > td:not(:first-child) > div {
				.v-select {
					--at-apply: 'justify-self-start';
					grid-area: target;

					&:nth-of-type(2) {
						--at-apply: 'justify-self-end';
						grid-area: source;
					}
				}
			}

			> thead > tr:nth-child(2) > td:nth-child(n + 2).highlighted,
			> tbody[aria-labelledby] > tr > td.highlighted {
				--source-clr: var(--col-damage-target-clr, white);
				--target-clr: var(--col-damage-source-clr, white);
			}
		}

		> tbody {
			&[data-drop-direction] {
				--drop-indicator-bg-direction: 180deg;

				&::before {
					--at-apply: 'inset-x-0 bottom-0 -top-[0.5px]';
				}

				&::after {
					--at-apply: 'content-empty absolute z-3 start-1/2 top-0.5 -translate-x-1/2 size-4 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}
			}

			&[data-drop-direction='after'] {
				--drop-indicator-bg-direction: 0deg;

				&::before {
					--at-apply: 'bottom-[0.5px] top-0';
				}

				&::after {
					--at-apply: 'bottom-0.5 top-auto rotate-180';
				}

				&:last-of-type::before,
				&:nth-last-of-type(2):has(+ [hidden])::before {
					--at-apply: 'bottom-px';
					--drop-indicator-b-w: 1px;
				}
			}
		}

		> thead > tr:nth-child(2) > td,
		> tbody[aria-labelledby] > tr > td {
			&:last-child[data-drop-direction='after']::before {
				--drop-indicator-b-w: 1px;

				--at-apply: '-end-[0.5px]';
			}
		}

		> tbody:first-of-type[data-drop-direction]::before {
			--at-apply: 'top-0';
		}
	}
}
</style>
