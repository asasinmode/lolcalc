<script setup vapor lang="ts">
import type { DamageSource, IComputedAppliedEffect } from '@lolcalc/core/DamageSource';
import { computeAbilityDescription, computeDragonAbilityDescription, computeItemDescription } from '@lolcalc/core/DamageSource';
import type { IDragonAbilityId, IGameAbilityId, IItemAbilityId } from '@lolcalc/core/GameAbilityId';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IGameImageData } from '@lolcalc/core/misc';
import { gameAbilityImage, simpleDescriptionFormatting } from '@lolcalc/core/misc';
import { specificKnownVariables } from '@lolcalc/core/specifics';
import type { IHypotheticalChampionSpecifics } from '@lolcalc/core/specifics/champion';
import { CHAMPION_SPECIFICS, IMPLEMENTED_CHAMPION_IDS } from '@lolcalc/core/specifics/champion';
import type { IHypotheticalDragonSpecifics } from '@lolcalc/core/specifics/dragon';
import { DRAGON_SPECIFICS } from '@lolcalc/core/specifics/dragon';
import type { IHypotheticalEffectSpecifics } from '@lolcalc/core/specifics/effect';
import { applyEffectsFromTo, EFFECT_SPECIFICS } from '@lolcalc/core/specifics/effect';
import type { IHypotheticalItemSpecifics } from '@lolcalc/core/specifics/item';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item';
import type { IReplacedGameVariable, IReplaceGameVariablesRV } from '@lolcalc/core/variables/game';
import { replaceStringtableVariables } from '@lolcalc/core/variables/stringtable';
import { CHAMPION_IMAGES, imgUrl, INTERESTING_SOULS_DRAGONS, ITEMS, PATCH_VERSION, useChampion } from '@lolcalc/data';
import type { IChampion, IDragonName } from '@lolcalc/data/types';
import { VariableType } from '@lolcalc/shared';
import type { IChampionAbilityKey, IChampionStatName, TAbilityType } from '@lolcalc/shared';
import { AbilityType, CHAMPION_STAT_META } from '@lolcalc/shared';
import { roundNumber } from '@lolcalc/shared/utils';
/* `toValue` and `ResultSectionId` imported manually, despite Nuxt autoimporting them, because when app is built they seem to not be available in the template. Started happening on vue@3.6-rc.13 and nuxt@4.6.0 */
import { toValue } from 'vue';
import type { UnwrapRef, WatchHandle } from 'vue';
import { ResultSectionId } from '~/composables/useCalculatorState';
import { gameImageAttrs } from '~/utils/image';
import type { IChampionAbilityHoverTooltipProps, ICustomTotalSectionRow, IDamageResultTableColumn, IDamageResultTableSection, IDamageResultTableSectionRow, IDamageResultTableSectionCustomValueRow } from '~/utils/types';

defineProps<{
	showResults: boolean;
}>();

const { damageSources, damageTargets, resultSections, resultColumns, expandedSections, resultsTableFlip: flipResults, customTotalRowIds, computedCustomTotalRows, restoreSavedCustomTotalRows, customValueRows } = useCalculatorState();
const { debouncedSaveState } = useManageCalculatorState();
const { championImage, abilityImage, championImageSize, abilityImageSize } = CHAMPION_IMAGES;
const globalKeyModifiers = useGlobalKeyModifiers();
const highlightedDamageSources = useHighlightedDamageSources();
const { bindTrigger: bindInfoTriggerAttrs, bindPopover: bindInfoPopoverAttrs } = useInfoTooltip();
const { vMinor } = PATCH_VERSION;
const { isTooltipExpanded } = useTooltipState();

const highlightedColumnId = ref<string>();

function columnOptions(from: DamageSource[]): [string, string][] {
	return from.map((source, i) => [source.id, `(${i + 1}) ${source.listedChampion.value?.name || '<empty>'}`]);
}
const sourceOptions = computed(() => columnOptions(damageSources.value));
const targetOptions = computed(() => columnOptions(damageTargets.value));

function setColumnChampion(column: IDamageResultTableColumn, sources: DamageSource[], damageSourceId?: string) {
	const oldDamageSourceId = column[sources === damageSources.value ? 'source' : 'target'].value?.id;
	oldDamageSourceId && highlightedDamageSources.remove(oldDamageSourceId);

	const property = sources === damageSources.value ? 'source' : 'target';

	column[property].value = damageSourceId ? sources.find((damageSource) => damageSource.id === damageSourceId) : undefined;
	recalculateColumn(column);

	column[property].value && highlightedDamageSources.add(column[property].value.id);
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

const uniqueDamageSourceChampions = computed<Set<IChampion>>(
	() =>
		new Set(
			damageSources.value
				.concat(damageTargets.value)
				.filter((source) => source.champion.value && source.listedChampion.value?.id === source.champion.value.id && source.champion.value.id !== 'TargetDummy')
				.map((source) => source.champion.value!),
		),
);
const damageSectionChampionAbilityOptions = computed<IDamageSectionOption[]>((): IDamageSectionOption[] =>
	uniqueDamageSourceChampions.value
		.values()
		.map((champion): IDamageSectionOption => {
			const championId = champion.id;
			let abilityEntries = Object.entries(champion.abilities);

			if (championId === 'Aphelios') {
				abilityEntries = abilityEntries.filter(([abilityKey]) => abilityKey !== 'w' && abilityKey !== 'e');
			}

			return {
				type: AbilityType.champion,
				optionId: championId,
				optionName: champion.name,
				abilities: abilityEntries.flatMap(([abilityKey, ability]): IDamageSectionOption['abilities'] =>
					ability.variants
						/*
						 * some champions like `Elise` have additional variants saved. These are expected to be used only for resolving the variables in the main variants (first 2)
						 * only Aphelios has more variants that are expected to be actually shown
						 * hwei on the other hand saves all his qwe variants but only for variables, their tooltips are empty and all interesting vars seem to be present in root qwe, so skip others
						 */
						.slice(0, championId === 'Aphelios' ? undefined : championId === 'Hwei' ? 1 : 2)
						.map((variant, abilityVariantIndex): IDamageSectionOption['abilities'][number] => {
							const { replaced: nameReplaced } = replaceStringtableVariables(variant.name ?? ability.variants[0]!.name!, champion.stringtable);

							return {
								id: GameAbilityId.build(AbilityType.champion, champion.id, abilityKey as IChampionAbilityKey, abilityVariantIndex),
								name: championAbilitySectionName(champion.name, abilityKey as IChampionAbilityKey, nameReplaced),
							};
						}),
				),
			} satisfies IDamageSectionOption;
		})
		.toArray(),
);

const damageSectionItemAbilities = computed<IDamageSectionOption['abilities']>((): IDamageSectionOption['abilities'] => {
	const itemIds = new Set(
		damageSources.value
			.concat(damageTargets.value)
			.flatMap((damageSource) => damageSource.computed.items.value.map((item, index) => (item?.hasAnyInterestingVariables || item?.unknownVariables.length ? damageSource.items.value[index]!.id : undefined)))
			.filter(Boolean),
	);

	return itemIds
		.values()
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
	const effectObjectNames = new Set(
		damageSources.value
			.flatMap((damageSource) =>
				damageSource.computed.effects.value
					.map((effect) => effect.resultVariables && effect.abilityId.id)
					.concat(damageSource.effectsAppliedToTarget.value.map(([effectAbilityId, effectSpecific]) => effectSpecific.variables && effectAbilityId.id)),
			)
			.concat(damageTargets.value.flatMap((damageSource) => damageSource.computed.effects.value.map((effect) => effect.resultVariables && effect.abilityId.id)))
			.filter(Boolean),
	);

	return effectObjectNames
		.values()
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
		abilities: option.abilities.filter((ability) => !resultSections.some((section) => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id))),
	}));

	options.push({
		optionId: 'items',
		optionName: 'items',
		type: 'item',
		abilities: damageSectionItemAbilities.value.filter((ability) => !resultSections.some((section) => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id))),
	});

	options.push({
		optionId: 'dragons',
		optionName: 'dragons',
		type: 'dragon',
		abilities: damageSectionDragonAbilities.value.filter((ability) => !resultSections.some((section) => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id))),
	});

	options.push({
		optionId: 'effects',
		optionName: 'effects',
		type: 'effect',
		abilities: damageSectionEffectAbilities.value.filter((ability) => !resultSections.some((section) => section.abilityId.type !== 'all' && GameAbilityId.isSame(section.abilityId, ability.id))),
	});

	return options.filter((option) => option.abilities.length);
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

const customTotalSection = resultSections.find((section) => section.isCustomTotal)!;
const customTotalSectionTotalRow = toValue(customTotalSection.rows)[0]!;
const customValueSection = resultSections.find((section) => section.isCustomValue)!;

const computedResults = ref<Map<string, IComputedSection>>(new Map());
computedResults.value = new Map<string, IComputedSection>(
	(
		[
			[customTotalSection.id, computeSection(customTotalSection)],
			[customValueSection.id, computeSection(customValueSection)],
		] as [string, IComputedSection][]
	).concat(resultSections.map((section) => [section.id, computeSection(section)] as [string, IComputedSection])),
);

const customTotalComputedSection = computedResults.value.get(ResultSectionId.CustomTotal)!;
const customTotalComputedSectionTotalRow = customTotalComputedSection.rows.get('cTtl-total')!;
const customValueComputedSection = computedResults.value.get(ResultSectionId.CustomValue)!;

{
	/* restoring state, basically what app.vue does onMounted but it can do so only when it's being mounted on the index page. If page is entered from somewhere else and there's state, it will be restored but the component needs to update itself on navigation to it */
	const hydrateResultSectionPromises: Promise<void>[] = [];
	for (const section of resultSections) {
		!toValue(section.name) && hydrateResultSectionPromises.push(hydrateResultSection(section));
	}
	for (const cValueRow of customValueRows.value) {
		computeCustomValueRow(cValueRow);
	}
	for (const column of resultColumns) {
		addComputedColumn(column);
		recalculateColumn(column);
	}
	restoreSavedCustomTotalRows.value &&
		Promise.all(hydrateResultSectionPromises).then(() => {
			restoreSavedCustomTotalRows.value?.();
			recomputeCustomTotal();
		});
}

function addComputedSection(sectionId: string) {
	const section = computeSection(resultSections.find((section) => section.id === sectionId)!);
	calculateComputedSectionComparisonMaps(section);
	computedResults.value.set(sectionId, section);
}

function computeSection(section: IDamageResultTableSection): IComputedSection {
	return {
		sectionId: section.id,
		rows: new Map(toValue(section.rows)?.map((row) => [row.id, computeSectionRow(section, row)])),
	};
}

function computeSectionRow(section: IDamageResultTableSection, row: IDamageResultTableSectionRow): IComputedSectionRow {
	return {
		rowId: row.id,
		columns: new Map(resultColumns.map((column) => [column.id, computeSectionRowColumn(section, row, column)])),
	};
}

function computeSectionRowColumn(section: IDamageResultTableSection, row: IDamageResultTableSectionRow, column: IDamageResultTableColumn): IComputedSectionRowColumn {
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
	} else if (source.isLoading.value || (target && target.isLoading.value)) {
		rv.value = 'loading...';
	} else if ((section.abilityId.type === 'champion' && source.champion.value?.id !== section.abilityId.id) || (section.id === 'aa' && source.champion.value?.id === 'Zeri')) {
		rv.value = 'n/a';
	} else if (section.id === ResultSectionId.CustomTotal) {
		/* this branch is expected to happen only for the total row, other custom total rows use computedCustomTotalRows */
		if (!customTotalRowIds.value.length) {
			return rv;
		}

		const sum =
			computedCustomTotalRows.value.slice(1).reduce((acc, curr) => {
				if (curr.id === row.id) {
					return acc;
				}

				const computedColumn = computedResults.value.get(curr.sectionId)?.rows.get(curr.id)?.columns.get(column!.id);

				return acc + (computedColumn?.numberValue ?? 0);
			}, 0) ?? 0;

		rv.isIrrelevant = false;
		rv.numberValue = sum;
		rv.value = roundNumber(sum);
	} else {
		const cellValue = section.getCellValue?.(section, row, source, target);
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
		source: shallowRef(),
		target: shallowRef(),
	};
	resultColumns.push(column);
	addComputedColumn(column);
	debouncedSaveState();
}

function addComputedColumn(column: IDamageResultTableColumn) {
	for (const section of computedResults.value.values()) {
		const resultSection = resultSections.find((rSection) => rSection.id === section.sectionId)!;
		for (const row of section.rows.values()) {
			const resultRow = toValue(resultSection.rows).find((rRow) => rRow.id === row.rowId)!;
			row.columns.set(column.id, computeSectionRowColumn(resultSection, resultRow, column));
		}
	}
}

function startRemovingColumn(event: MouseEvent, index: number) {
	const removeButton = (event.target as HTMLElement).closest('button');
	const undoRemoveButton = removeButton?.nextElementSibling?.nextElementSibling as HTMLButtonElement | undefined;
	if (!undoRemoveButton || !(resultColumns[index]?.source || resultColumns[index]?.target)) {
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
	const [column] = resultColumns.splice(index, 1);
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

const itemVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, row, source, _target) => {
	const computedItem = source?.computed.items.value.find((item) => item?.item!.id === (section.abilityId as IItemAbilityId).id);
	return gameVariablesCellValue(row.id, computedItem?.variables);
};

const dragonVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, row, source, _target) => {
	if (source?.computed.dragonSoulAbility.value?.dragon === (section.abilityId as IDragonAbilityId).id) {
		return gameVariablesCellValue(row.id, source.computed.dragonSoulAbility.value.variables);
	}
};

const abilityVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, row, source, _target) => {
	if (source) {
		const { gameAbilityId } = toValue(section.hoverTooltipData as IChampionAbilityHoverTooltipProps).precomputedDescription!;
		const computedDescription = source.computed.abilities.value[gameAbilityId.abilityKey!][gameAbilityId.abilityVariantIndex!];
		return gameVariablesCellValue(row.id, computedDescription?.variables);
	}
};

const effectVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, row, source, _target) => {
	/* accessing refs here directly because they have already been `toValue`d somewhere, not sure when */
	const computedEffect = source?.computed.effects.value.find((effect) => effect.abilityId.id === section.abilityId.id);
	if (computedEffect && !computedEffect.isActive) {
		return;
	}
	const rv = gameVariablesCellValue(row.id, computedEffect?.resultVariables as UnwrapRef<IComputedAppliedEffect['resultVariables']>);
	/* other variable's values are rounded by `replaceGameVariables` but these are gotten raw from IEffectSpecifics.variables.calulate() so round them here */
	if (typeof rv?.numberValue === 'number') {
		rv.value = `${roundNumber(rv.numberValue)}${rv.meta?.resultsIsPercentage ? '%' : ''}`;
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

		let precision = rv.meta?.roundReplaced ?? (rv.meta?.isCustom ? 2 : undefined);
		if (typeof precision === 'boolean') {
			precision = 0;
		}

		const value = variable?.value;
		if (value === undefined || Number.isNaN(value)) {
			rv.numberValue = (value as number) ?? 0;
			rv.value = '?';
			rv.isUnknown = true;
		} else if (Array.isArray(value)) {
			const v1 = typeof value[0] === 'number' ? (multiplier ? roundNumber(value[0] * multiplier, precision) : roundNumber(value[0], precision)) : value[0];
			const v2 = typeof value[1] === 'number' ? (multiplier ? roundNumber(value[1] * multiplier, precision) : roundNumber(value[1], precision)) : value[1];
			rv.value = `${v1}${suffix} | ${v2}${suffix}`;
		} else {
			if (typeof value === 'number') {
				const totalValue = multiplier ? roundNumber(value * multiplier, precision) : roundNumber(value, precision);
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
	const index = resultSections.indexOf(section);
	~index && resultSections.splice(index, 1);
	const expandedIndex = expandedSections.value.indexOf(section.id);
	~expandedIndex && expandedSections.value.splice(expandedIndex, 1);
}

async function addResultsSection(abilityId: IGameAbilityId, name: string, expand = true, spliceAt = 0) {
	const id = GameAbilityId.stringify(abilityId);
	if (resultSections.some((section) => section.id === id) || (abilityId.type === 'champion' && abilityId.id === 'TargetDummy')) {
		return;
	}

	const section = {
		id,
		name,
		abilityId,
		notImplemented: abilityId.type === AbilityType.champion && abilityId.abilityKey !== 'passive' && !IMPLEMENTED_CHAMPION_IDS.includes(abilityId.id),
		image: shallowRef(),
		rows: shallowRef([]),
		hoverTooltipData: shallowRef(),
	} satisfies Omit<IDamageResultTableSection, 'getCellValue'>;

	resultSections.splice(spliceAt, 0, section);
	expand && expandedSections.value.push(section.id);

	hydrateResultSection(section);
}

async function hydrateResultSection(section: IDamageResultTableSection) {
	const { abilityId } = section;
	if (abilityId.type === 'all') return;

	let name = toValue(section.name),
		image: IGameImageData | undefined,
		rows: IDamageResultTableSectionRow[],
		hoverTooltipData: any;

	if (abilityId.type === AbilityType.champion) {
		const champion = await useChampion(abilityId.id);
		/* since abilities are added eagerly despite potentially needing to await something to fully resolve, if the champion is not resolved then remove the section. Unknown champions can be added when restoring state */
		if (!champion?.abilities[abilityId.abilityKey].variants[abilityId.abilityVariantIndex]) {
			removeBeingAddedSection(section);
			return;
		}

		const championVariables = specificKnownVariables((CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[abilityId.id]?.variables);
		const abilityVariables = specificKnownVariables((CHAMPION_SPECIFICS as IHypotheticalChampionSpecifics)[abilityId.id]?.[abilityId.abilityKey]?.variables);

		const precomputedDescription = computeAbilityDescription(champion, abilityId, undefined, {
			replaceWithName: true,
			overrideVariables: {
				values: Object.assign(championVariables?.values ?? {}, abilityVariables?.values),
				meta: Object.assign(championVariables?.meta ?? {}, abilityVariables?.meta),
				uninteresting: (championVariables?.uninteresting ?? []).concat(abilityVariables?.uninteresting),
			},
		});

		name ??= championAbilitySectionName(champion.name, abilityId.abilityKey, precomputedDescription.name);
		image = [abilityImage(precomputedDescription.image, champion.id, `${flipResults.value ? 'target' : 'source'}s`), abilityImageSize(champion.id)];
		rows = await getAbilitySectionRows(precomputedDescription);
		hoverTooltipData = { precomputedDescription };
		section.getCellValue = abilityVariableCellValue;
	} else if (abilityId.type === AbilityType.item) {
		const item = ITEMS[abilityId.id]!;

		const precomputedDescription = computeItemDescription(item, undefined, {
			replaceWithName: true,
			overrideVariables: specificKnownVariables((ITEM_SPECIFICS as IHypotheticalItemSpecifics)[abilityId.id as keyof IHypotheticalItemSpecifics]?.variables),
		})!;

		name ??= item.name;
		image = [imgUrl(`img/item/${item.image}`, true), 64];
		rows = await getAbilitySectionRows(precomputedDescription);
		hoverTooltipData = { precomputedDescription };
		section.getCellValue = itemVariableCellValue;
	} else if (abilityId.type === AbilityType.dragon) {
		if (!INTERESTING_SOULS_DRAGONS.includes(abilityId.id)) {
			removeBeingAddedSection(section);
			return;
		}

		const precomputedDescription = computeDragonAbilityDescription(abilityId.id, abilityId.subtype, undefined, false, {
			replaceWithName: true,
			overrideVariables: specificKnownVariables((DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[abilityId.id]?.[abilityId.subtype]?.variables),
		});
		name ??= `${abilityId.id} Soul`;
		image = await gameAbilityImage(abilityId);
		rows = await getAbilitySectionRows(precomputedDescription);
		hoverTooltipData = { precomputedDescription };
		section.getCellValue = dragonVariableCellValue;
	} else {
		const effectSpecific = (EFFECT_SPECIFICS as IHypotheticalEffectSpecifics)[abilityId.id]!;
		if (!effectSpecific.variables) {
			removeBeingAddedSection(section);
			return;
		}

		name = effectSpecific.label;
		image = await gameAbilityImage(abilityId);
		rows = await getAbilitySectionRows({
			variables: new Map(
				Object.entries(effectSpecific.variables.known!).map(([variableName, variableValue]) => {
					return [
						variableName,
						{
							baseValue: variableValue[0]!,
							value: variableValue[0]!,
							meta: effectSpecific.variables!.meta?.[variableName],
							modifyMeta: {},
						} satisfies IReplacedGameVariable,
					];
				}) as [string, IReplacedGameVariable][],
			),
			unknownVariables: [],
		});
		hoverTooltipData = { abilityId };
		section.getCellValue = effectVariableCellValue;
	}

	if (name && isRef(section.name)) {
		section.name.value = name;
	}
	(section.image as Ref).value = image;
	(section.rows as Ref).value = rows;
	(section.hoverTooltipData as Ref).value = hoverTooltipData;

	addComputedSection(section.id);
}

async function getAbilitySectionRows({ variables, unknownVariables }: Pick<IReplaceGameVariablesRV, 'variables' | 'unknownVariables'>): Promise<UnwrapRef<IDamageResultTableSection['rows']>> {
	let rows: UnwrapRef<IDamageResultTableSection['rows']> = await Promise.all(
		variables
			.entries()
			.filter((entry) => !entry[1].isUninteresting)
			.map(async (entry): Promise<IDamageResultTableSectionRow> => ({
				id: entry[0],
				name: entry[1].meta?.displayedName ?? entry[1].actualName ?? entry[0],
				isCustom: entry[1].meta?.isCustom,
				additionalInfo: entry[1].meta?.additionalInfo && (await simpleDescriptionFormatting(entry[1].meta?.additionalInfo, true)),
			})),
	);

	rows = rows.concat(
		unknownVariables.map(([rawName]) => ({
			id: rawName,
			name: rawName,
			isUnknown: true,
		})),
	);

	rows.sort((a, _b) => (a.isCustom ? 1 : 0));

	return rows;
}

function removeResultsSection(index: number) {
	const section = resultSections[index]!;
	if (section.isCustomTotal) {
		customTotalRowIds.value.length = 0;
	} else if (section.isCustomValue) {
		for (const row of customValueRows.value) {
			const cTotalIndex = customTotalRowIds.value.indexOf(`${ResultSectionId.CustomValue}_${row.id}`);
			~cTotalIndex && customTotalRowIds.value.splice(cTotalIndex, 1);
		}
		customValueRows.value.length = 0;
		computedResults.value.get(section.id)?.rows.clear();
	} else {
		const [section] = resultSections.splice(index, 1);
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
	() => damageSources.value.map((source) => source.id),
	(newV, oldV) => handleSourceUpdate(damageSources.value, newV, oldV),
	{ immediate: true },
);
watch(
	() => damageTargets.value.map((source) => source.id),
	(newV, oldV) => handleSourceUpdate(damageTargets.value, newV, oldV),
	{ immediate: true },
);

function handleSourceUpdate(target: DamageSource[], currIds: string[], prevIds: string[] = []) {
	debouncedSaveState();
	const addedIds = currIds.filter((id) => !prevIds.includes(id));
	const removedIds = prevIds.filter((id) => !currIds.includes(id));
	const columnProperty = target === damageSources.value ? 'source' : 'target';

	for (const id of removedIds) {
		damageSourceWatchers.get(id)?.();
		damageSourceWatchers.delete(id);

		for (let i = 0; i < resultColumns.length; i++) {
			const column = resultColumns[i]!;
			if (column[columnProperty].value?.id === id) {
				column[columnProperty].value = undefined;
				recalculateColumn(column);
			}
		}
	}

	for (const id of addedIds) {
		const source = target.find((damageSource) => damageSource.id === id)!;
		damageSourceWatchers.set(
			source.id,
			watch(source.getWatchable(), () => {
				debouncedSaveState();
				const columns = resultColumns.filter((column) => column.source.value?.id === source.id || column.target.value?.id === source.id);
				for (const column of columns) {
					recalculateColumn(column);
				}
			}),
		);
	}
}

onBeforeUnmount(() => {
	for (const unwatch of damageSourceWatchers.values()) {
		unwatch();
	}
});

/** `rowSectionId` overrides `sectionId`, expected to be used for custom total rows since they just point to other rows for their values */
function sectionRowCells(sectionId: string, rowId: string, rowSectionId?: string) {
	return resultColumns.map((column) => {
		return {
			key: `${sectionId}-${rowId}-${column.id}`,
			computedColumn: computedResults.value
				.get(rowSectionId ?? sectionId)!
				.rows.get(rowId)!
				.columns.get(column!.id)!,
		};
	});
}

function columnDamageSourcesColorStyles(column: Pick<IDamageResultTableColumn, 'source' | 'target'>) {
	return {
		'--col-damage-source-clr': column.source.value?.color,
		'--col-damage-target-clr': column.target.value?.color,
	};
}

const columnDamageSourceColors = computed(() => resultColumns.map((column) => columnDamageSourcesColorStyles(column)));

function recalculateAllColumns() {
	/* for now it's only called when `flipResults` is flipped */
	debouncedSaveState();
	for (const column of resultColumns) {
		for (const section of resultSections) {
			for (const row of toValue(section.rows)) {
				computedResults.value
					.get(section.id)!
					.rows.get(row.id)!
					.columns.set(column.id, computeSectionRowColumn(section, row, column));
			}
		}
	}
	recalculateResultCellComparisonNumbers();
}

function recalculateColumn(column: IDamageResultTableColumn) {
	addComputedColumnSources(column);

	for (const section of resultSections) {
		const rows = toValue(section.rows);
		if (rows) {
			for (const row of rows) {
				computedResults.value
					.get(section.id)!
					.rows.get(row.id)!
					.columns.set(column.id, computeSectionRowColumn(section, row, column));
			}
		}
	}
	recalculateResultCellComparisonNumbers();
}

function addComputedColumnSources(column: IDamageResultTableColumn) {
	if (column.source.value) {
		column._computedSource = column.source.value.clone({}, true);
		column._computedSource.champion.value = column.source.value.champion.value;
	} else {
		column._computedSource = undefined;
	}

	if (column.target.value) {
		column._computedTarget = column.target.value.clone({}, true);
		column._computedTarget.champion.value = column.target.value.champion.value;
		if (column.source.value) {
			applyEffectsFromTo(column.source.value, column._computedTarget);
			column._computedTarget.calculationDamageTarget.value = column.source.value;
			column._computedSource!.calculationDamageTarget.value = column._computedTarget;
		}
	} else {
		column._computedTarget = undefined;
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
				map[idB] = roundNumber((a - b) * (meta?.isPercentage ? 100 : 1));
			}
		}

		colA.comparisonMap = map;
	}
}

const cleanableColumnsSections = computed<[[index: number, column: IDamageResultTableColumn][], [index: number, section: IDamageResultTableSection][]]>(() => {
	const anyColumnFilled = resultColumns.some((column) => column.source || column.target);
	const columns = (resultColumns.map((column, index) => [index, column]) as [number, IDamageResultTableColumn][]).filter(([index, column]) => (anyColumnFilled || index !== resultColumns.length - 1) && !column.source && !column.target);

	const sections = (resultSections.map((section, index) => [index, section]) as [number, IDamageResultTableSection][]).filter(([, section]) => {
		if (section.abilityId.type === 'all') {
			return false;
		} else if (section.abilityId.type === AbilityType.item) {
			return !resultColumns.some((column) => column.source.value?.items.value.some((item) => item?.id === section.abilityId.id) || column.target.value?.items.value.some((item) => item?.id === section.abilityId.id));
		} else if (section.abilityId.type === AbilityType.champion) {
			return !resultColumns.some((column) => column.source.value?.listedChampion.value?.id === section.abilityId.id || column.target.value?.listedChampion.value?.id === section.abilityId.id);
		} else if (section.abilityId.type === AbilityType.effect) {
			return !resultColumns.some(
				(column) =>
					column.source.value?.appliedEffects.value.some((effect) => effect.abilityId.id === section.abilityId.id) ||
					column.source.value?.effectsAppliedToTarget.value.some((effectEntry) => effectEntry[0].id === section.abilityId.id) ||
					column._computedTarget?.appliedEffects.value.some((effect) => effect.abilityId.id === section.abilityId.id),
			);
		}

		/* this could consider dragon stacks too but atm only souls have abilities that can be added to results */
		return !resultColumns.some((column) => column.source.value?.dragonSoul.value === section.abilityId.id || column._computedTarget?.dragonSoul.value === section.abilityId.id);
	});

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
		resultColumns.splice(columnIndex, 1);
	}

	for (let i = cleanableColumnsSections.value[1].length - 1; i >= 0; i--) {
		const [sectionIndex, section] = cleanableColumnsSections.value[1][i]!;
		computedResults.value.delete(section.id);
		resultSections.splice(sectionIndex, 1);

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
	column.source.value && highlightedDamageSources.add(column.source.value.id);
	column.target.value && highlightedDamageSources.add(column.target.value.id);
}

function lowlightColumnSources(column: IDamageResultTableColumn) {
	highlightedColumnId.value = undefined;
	column.source.value && highlightedDamageSources.remove(column.source.value.id);
	column.target.value && highlightedDamageSources.remove(column.target.value.id);
}

function highlightColumnIdSources(id: string) {
	const column = resultColumns.find((column) => column.id === id);
	column && highlightColumnSources(column);
}

function lowlightColumnIdSources(id: string) {
	const column = resultColumns.find((column) => column.id === id);
	column && lowlightColumnSources(column);
}

const highlightedColumns = computed(() =>
	resultColumns.map((column) =>
		highlightedColumnId.value ? column.id === highlightedColumnId.value : (column.source.value && highlightedDamageSources.has(column.source.value.id)) || (column.target.value && highlightedDamageSources.has(column.target.value.id)),
	),
);

function moveResultColumn(fromIndex: number, toIndex: number, copy: boolean) {
	const column: IDamageResultTableColumn = copy
		? {
				id: crypto.randomUUID(),
				source: resultColumns[fromIndex]!.source,
				target: resultColumns[fromIndex]!.target,
			}
		: resultColumns.splice(fromIndex, 1)[0]!;

	resultColumns.splice(toIndex, 0, column);
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
	event.currentTarget && (event.currentTarget as Node).addEventListener('dragend', () => (columnDraggedFromIndex = undefined), { once: true });
}

function onResultColumnDragenter(event: DragEvent, index: number) {
	if (columnDraggedFromIndex !== undefined) {
		[columnDragDropIndex.value] = getDropTargetIndex(event, index, columnDraggedFromIndex, false);
	}
}

function onResultColumnDragover(event: DragEvent, index: number) {
	if (columnDraggedFromIndex !== undefined) {
		[columnDragDropIndex.value] = getDropTargetIndex(event, index, columnDraggedFromIndex, false);
		if (columnDragDropIndex.value !== undefined) {
			event.preventDefault();
		}
	}
}

function onResultColumnDragleave(event: DragEvent) {
	if (columnDraggedFromIndex !== undefined) {
		if (!event.currentTarget || !event.relatedTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)) {
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
			source: resultColumns[fromIndex]!.source,
			target: resultColumns[fromIndex]!.target,
		};
		resultColumns.splice(toIndex, 0, column);
		addComputedColumn(column);
		return;
	}

	const [column] = resultColumns.splice(fromIndex, 1);
	const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

	resultColumns.splice(adjustedIndex, 0, column!);
	debouncedSaveState();
}

function endResultColumnDrag() {
	columnDraggedFromIndex = undefined;
}

function getDropTargetIndex(event: DragEvent, index: number, fromIndex: number | undefined, isVertical: boolean, combinedSiblingIsNext?: boolean): [toIndex: number | undefined, fromIndex: number | undefined] {
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
	const [section] = resultSections.splice(fromIndex, 1);
	resultSections.splice(toIndex, 0, section!);
	debouncedSaveState();
}

const sectionDragDropIndex = ref<number>();
let sectionDraggedFromIndex: number | undefined;

function startResultSectionDrag(event: DragEvent, index: number) {
	event.dataTransfer!.effectAllowed = 'move';
	sectionDraggedFromIndex = index;

	const el = (event.target as HTMLElement).closest('tr')!;
	event.dataTransfer!.setDragImage(el, 0, 0);
	event.currentTarget && (event.currentTarget as Node).addEventListener('dragend', () => (sectionDraggedFromIndex = undefined), { once: true });
}

function onResultSectionDragenter(event: DragEvent, index: number, isHeader?: boolean) {
	if (sectionDraggedFromIndex !== undefined) {
		[sectionDragDropIndex.value] = getDropTargetIndex(event, index, sectionDraggedFromIndex, true, isHeader);
	}
}

function onResultSectionDragover(event: DragEvent, index: number, isHeader?: boolean) {
	if (sectionDraggedFromIndex !== undefined) {
		[sectionDragDropIndex.value] = getDropTargetIndex(event, index, sectionDraggedFromIndex, true, isHeader);
		if (sectionDragDropIndex.value !== undefined) {
			event.preventDefault();
		}
	}
}

function onResultSectionDragleave(event: DragEvent) {
	if (sectionDraggedFromIndex !== undefined) {
		if (!event.currentTarget || !event.relatedTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)) {
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

	const [section] = resultSections.splice(fromIndex, 1);
	const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

	resultSections.splice(adjustedIndex, 0, section!);
	debouncedSaveState();
}

function endResultSectionDrag() {
	sectionDraggedFromIndex = undefined;
}

function combinedSiblingsRect(el: HTMLElement, isNext: boolean): DOMRect {
	let el1, el2;
	if (isNext) {
		el1 = el;
		el2 = el.nextElementSibling as HTMLElement;
	} else {
		el1 = el.previousElementSibling as HTMLElement;
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

function sectionHasTooltip(section: IDamageResultTableSection) {
	return toValue(section.hoverTooltipData);
}

let hoveredSectionType: undefined | IDamageResultTableSection['abilityId']['type'];
let hoveredSectionPopoverEl: HTMLElement | undefined;

const { bind: bindSectionHoverTooltip } = useHoverTooltip<{ section: IDamageResultTableSection; fromCustom?: boolean }>({
	el: () => hoveredSectionPopoverEl,
	beforeShow({ section, fromCustom }, trigger) {
		const popover = (fromCustom ? document.getElementById(`results-header-${section.id}`) : trigger)?.querySelector<HTMLElement>('[popover]');
		if (popover) {
			if (fromCustom) {
				popover.style.setProperty('position-anchor', '--custom-total-section-header');
			} else {
				/* styles are applied based on `[style]` */
				popover.removeAttribute('style');
			}
			hoveredSectionType = section.abilityId.type;
			hoveredSectionPopoverEl = popover;
			return true;
		}
	},
	onShow() {
		hoveredSectionType === 'item' && addItemTooltipViewListeners();
	},
	onHide() {
		hoveredSectionPopoverEl = undefined;
		hoveredSectionType === 'item' && removeItemTooltipViewListeners();
	},
});

interface IColumnAddableOption {
	championOptionIndex?: number;
	itemOptionsIndexes: number[];
}

const columnAddableSourceOptions = computed<IColumnAddableOption[]>(() => resultColumns.map((column) => columnAddableOption(column.source.value)));
const columnAddableTargetOptions = computed<IColumnAddableOption[]>(() => resultColumns.map((column) => columnAddableOption(column.target.value)));

function columnAddableOption(damageSource?: DamageSource): IColumnAddableOption {
	const rv: IColumnAddableOption = {
		championOptionIndex: undefined,
		itemOptionsIndexes: [],
	};

	if (damageSource?.champion.value) {
		rv.championOptionIndex = damageSectionOptions.value.findIndex((option) => option.type === 'champion' && option.optionId === damageSource!.champion.value!.id);
		if (rv.championOptionIndex === -1) {
			rv.championOptionIndex = undefined;
		}
	}

	const itemOptions = damageSectionOptions.value.findLast((option) => option.type === 'item');
	rv.itemOptionsIndexes =
		damageSource && itemOptions ? (damageSource!.items.value.map((item) => (item ? itemOptions.abilities.findIndex((ability) => ability.id.id === item.id) : undefined)).filter((index) => index !== undefined && ~index) as number[]) : [];

	return rv;
}

async function addColumnAbilities(columnIndex: number, isSource: boolean) {
	const { championOptionIndex } = (isSource ? columnAddableSourceOptions : columnAddableTargetOptions).value[columnIndex]!;
	const option = damageSectionOptions.value[championOptionIndex!];
	if (option) {
		for (let i = option.abilities.length - 1; i >= 0; i--) {
			addResultsSection(option.abilities[i]!.id, option.abilities[i]!.name);
		}
	}
	debouncedSaveState();
}

function addColumnItems(columnIndex: number, isSource: boolean) {
	const { itemOptionsIndexes } = (isSource ? columnAddableSourceOptions : columnAddableTargetOptions).value[columnIndex]!;
	const option = damageSectionOptions.value.findLast((option) => option.type === 'item');
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
	recomputeCustomTotal();
	if (!expandedSections.value.includes(customTotalSection.id) && customTotalRowIds.value.length) {
		expandedSections.value.push(customTotalSection.id);
	}
	debouncedSaveState();
}

function recomputeCustomTotal() {
	if (customTotalSectionTotalRow) {
		for (const column of resultColumns) {
			customTotalComputedSectionTotalRow.columns.set(column.id, computeSectionRowColumn(customTotalSection, customTotalSectionTotalRow, column));
		}
		calculateComputedRowComparisonMap(customTotalComputedSectionTotalRow, ResultSectionId.CustomTotal);
	}
}

const controlButtonSize = ref(28);
const baseHeaderColWidth = ref(280);

function updateColWidth() {
	/* any element that uses --manipulate-btn-size var */
	controlButtonSize.value = document.getElementById('results-remove-unused')?.getBoundingClientRect().height ?? 28;
	baseHeaderColWidth.value = Math.max(160, Math.min(280, Math.round(window.innerWidth * 0.3)));
}

onMounted(() => {
	window.addEventListener('resize', updateColWidth, { passive: true });
	updateColWidth();
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateColWidth);
});

const colW = computed(() => {
	const growUpToCols = 4;
	const n = growUpToCols - Math.min(resultColumns.length, growUpToCols);

	return {
		/* + padding left */
		controls: 2 * controlButtonSize.value + 12,
		header: Math.round(baseHeaderColWidth.value + (140 * n) / (growUpToCols + 1)),
		result: Math.round(120 + (90 * n) / (growUpToCols + 1)),
	};
});

const maxCols = computed(() => 2 + resultColumns.length);

const { updateThumbnail } = useDamageSourceThumbnail();
let thumbnailTooltipPopoverEl: HTMLElement | null = null;

const { bind: bindThumbnailTriggerAttrs, bindPopover: bindThumbnailPopoverAttrs } = useHoverTooltip<{ index: number; isTarget?: boolean }>({
	el: () => thumbnailTooltipPopoverEl,
	beforeShow({ index, isTarget }, trigger) {
		const damageSource = resultColumns[index]![isTarget ? 'target' : 'source'].value;
		if (!damageSource) return false;
		const popover = trigger.parentElement?.lastElementChild;
		if (popover) {
			thumbnailTooltipPopoverEl = popover as HTMLElement;
			popover.firstElementChild && updateThumbnail(popover.firstElementChild as HTMLElement, damageSource);
			return true;
		}
	},
});

const variableTypeOptionNames: Partial<Record<VariableType, string>> = {
	physical: 'physical damage',
	magic: 'magic damage',
	adaptive: 'adaptive damage',
	true: 'true damage',
	heal: 'heal',
	shield: 'shield',
};

const newCustomValueRowType = ref<VariableType>(VariableType.physical);
const newCustomValueRowValue = ref<number>(0);

function submitCustomValueRow() {
	const id = crypto.randomUUID();
	customValueRows.value.push({ id, name: id, type: newCustomValueRowType.value, value: newCustomValueRowValue.value });
	customValueComputedSection.rows.set(id, computeSectionRow(customValueSection, customValueRows.value.at(-1)!));

	newCustomValueRowType.value = VariableType.physical;
	newCustomValueRowValue.value = 0;
	debouncedSaveState();
}

function computeCustomValueRow(row: IDamageResultTableSectionRow) {
	customValueComputedSection.rows.set(row.id, computeSectionRow(customValueSection, row));
}

function onCustomValueRowChange(row: IDamageResultTableSectionRow) {
	recomputeCustomValueRow(row);
	debouncedSaveState();
}

function recomputeCustomValueRow(row: IDamageResultTableSectionRow) {
	const computedRow = customValueComputedSection?.rows.get(row.id);
	if (computedRow) {
		for (const column of resultColumns) {
			computedRow.columns.set(column.id, computeSectionRowColumn(customValueSection, row, column));
		}
		calculateComputedRowComparisonMap(computedRow, ResultSectionId.CustomValue);
		if (customTotalRowIds.value.includes(`${ResultSectionId.CustomValue}_${row.id}`)) {
			recomputeCustomTotal();
		}
	} else {
		console.warn('custom value row not found for recomputing', row.id);
	}
}

let currentCustomValueInputRowRef: IDamageResultTableSectionCustomValueRow | undefined;
const customValueOnInput = useNumberInput(() => [currentCustomValueInputRowRef, 'value']);

function updateCustomValueRowValue(rowIndex: number, event: Event) {
	(event as any).composing = false;
	const row = customValueRows.value[rowIndex];
	if (row) {
		currentCustomValueInputRowRef = row;
		customValueOnInput(event);
		onCustomValueRowChange(row);
	}
}

function updateCustomValueRowType(rowIndex: number, event: Event) {
	const row = customValueRows.value[rowIndex];
	if (row) {
		row.type = (event.target as HTMLInputElement).value as VariableType;
		onCustomValueRowChange(row);
	}
}

function removeCustomValueRow(rowIndex: number) {
	const row = customValueRows.value[rowIndex];
	if (row) {
		const cTotalIndex = customTotalRowIds.value.indexOf(`${ResultSectionId.CustomValue}_${row.id}`);
		~cTotalIndex && customTotalRowIds.value.splice(cTotalIndex, 1);
		customValueRows.value.splice(rowIndex, 1);
		customValueComputedSection.rows.delete(row.id);
		debouncedSaveState();
	}
}

const anyColumnsLoading = computed(() => resultColumns.some((column) => column.source.value?.listedChampion.value && column.source.value.listedChampion.value.id !== column.source.value.champion.value?.id));

defineExpose({
	recomputeCustomTotal,
	hydrateResultSection,
	computeCustomValueRow,
	addComputedColumn,
	recalculateColumn,
});
</script>

<template>
	<ClientOnly>
		<table id="results-table" :inert="!showResults" :aria-busy="anyColumnsLoading" :data-flip-results="flipResults || undefined">
			<caption>
				comparison table
			</caption>
			<thead>
				<tr>
					<th :width="`${colW.controls}px`" scope="col">
						<span>row controls</span>
					</th>
					<th id="results-table-header-variable" scope="col" :width="`${colW.header}px`">
						<span>variable</span>
					</th>
					<th v-for="column in resultColumns" :key="column.id" scope="col" :width="`${colW.result}px`">
						<span>
							{{ (toValue(column.source) && sourceOptions.find((option) => option[0] === toValue(column.source)!.id)?.[1]) || 'undefined source' }}
							vs
							{{ (toValue(column.target) && targetOptions.find((option) => option[0] === toValue(column.target)!.id)?.[1]) || 'undefined target' }}
						</span>
					</th>
				</tr>
				<tr>
					<td :width="`${colW.controls + colW.header}px`" colspan="2">
						<div>
							<a href="#results-header-aa" class="skip-link"> skip column controls </a>
							<label for="results-table-values-for">
								<input id="results-table-values-for" v-model="flipResults" type="checkbox" @change="recalculateAllColumns" />
								flip target vs source
							</label>
							<button
								id="results-remove-unused"
								class="pretend-ui-btn"
								:disabled="!cleanableColumnsSections[0].length && !cleanableColumnsSections[1].length"
								title="remove empty columns and sections without a corresponding damage source"
								@click="cleanupUnused"
							>
								<span>remove empty columns and sections without a corresponding damage source</span>
								<Icon class="i-ph:eraser" />
							</button>
							<form @submit.prevent="submitResultsSection">
								<label for="results-table-row-new-section-ability">add section</label>
								<select id="results-table-row-new-section-ability" name="sectionOptionIndex" required :disabled="!damageSectionOptions.length">
									<option v-if="!damageSectionOptions.length">no options left</option>
									<optgroup v-for="(option, optionIndex) in damageSectionOptions" :key="option.optionId" :label="option.optionName">
										<option v-for="(ability, abilityIndex) in option.abilities" :key="GameAbilityId.stringify(ability.id)" :value="`${optionIndex}-${abilityIndex}`">
											{{ ability.name }}
										</option>
									</optgroup>
								</select>
								<button class="pretend-ui-btn" type="submit" :disabled="!damageSectionOptions.length">add</button>
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
								:model-value="toValue(resultColumns[index]!.source)?.id"
								label="column's damage source"
								:options="sourceOptions"
								clearable
								:tooltip-trigger-attrs="bindThumbnailTriggerAttrs({ index, isTarget: false })"
								@update:model-value="setColumnChampion(column, damageSources, $event)"
							>
								<img
									v-if="toValue(column.source)?.listedChampion.value"
									:src="championImage(toValue(column.source)!.listedChampion.value!.image, toValue(column.source)!.listedChampion.value!.id)"
									loading="lazy"
									:width="championImageSize(toValue(column.source)!.listedChampion.value!.id)"
									:height="championImageSize(toValue(column.source)!.listedChampion.value!.id)"
									style="--focus-brightness: 1.2"
									aria-hidden="true"
								/>
								<img v-else :src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`" width="256" height="256" style="--focus-brightness: 1.5" aria-hidden="true" />
								<template #post>
									<div popover="hint" v-bind="bindThumbnailPopoverAttrs()">
										<CalculatorDamageSourceThumbnail />
									</div>
								</template>
							</VSelect>
							<span>vs</span>
							<VSelect
								:id="`results-table-column-target-${index}`"
								:model-value="toValue(resultColumns[index]!.target)?.id"
								label="column's damage target"
								:options="targetOptions"
								clearable
								:tooltip-trigger-attrs="bindThumbnailTriggerAttrs({ index, isTarget: true })"
								@update:model-value="setColumnChampion(column, damageTargets, $event)"
							>
								<img
									v-if="toValue(column.target)?.listedChampion.value"
									:src="championImage(toValue(column.target)!.listedChampion.value!.image, toValue(column.target)!.listedChampion.value!.id)"
									loading="lazy"
									:width="championImageSize(toValue(column.target)!.listedChampion.value!.id)"
									:height="championImageSize(toValue(column.target)!.listedChampion.value!.id)"
									style="--focus-brightness: 1.2"
									aria-hidden="true"
								/>
								<img v-else :src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`" width="256" height="256" style="--focus-brightness: 1.5" aria-hidden="true" />
								<template #post>
									<div popover="hint" v-bind="bindThumbnailPopoverAttrs()">
										<CalculatorDamageSourceThumbnail />
									</div>
								</template>
							</VSelect>
							<button v-if="index === resultColumns.length - 1" class="pretend-ui-btn" @click="addResultsColumn()">add column</button>
							<template v-if="index !== resultColumns.length - 1">
								<button
									title="move left, alt+click to duplicate to the left"
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
								<VMenu
									:id="`results-col-${index}`"
									:label="`column ${index + 1} actions`"
									:items="[
										['add source abilities', () => addColumnAbilities(index, true), columnAddableSourceOptions[index]?.championOptionIndex === undefined],
										['add source items', () => addColumnItems(index, true), !columnAddableSourceOptions[index]?.itemOptionsIndexes.length],
										['add target abilities', () => addColumnAbilities(index, false), columnAddableTargetOptions[index]?.championOptionIndex === undefined],
										['add target items', () => addColumnItems(index, false), !columnAddableTargetOptions[index]?.itemOptionsIndexes.length],
									]"
									title="column actions"
									class="pretend-ui-btn"
								>
									<span>actions</span>
									<Icon class="i-ph:dots-three-bold" />
								</VMenu>
								<button title="remove" class="pretend-ui-btn remove" @click="startRemovingColumn($event, index)">
									<span>remove</span>
									<Icon class="i-ph:trash" />
								</button>
								<button
									title="move right, alt+click to duplicate to the right"
									class="pretend-ui-btn"
									draggable="true"
									@click="moveResultColumn(index, index + 1, globalKeyModifiers.alt)"
									@dragstart="onResultColumnDragstart(index, $event)"
									@dragend="endResultColumnDrag"
								>
									<span>move right <span>(alt+click to duplicate to the right)</span></span>
									<Icon class="i-ph:arrow-right" />
								</button>
								<button style="display: none">restore</button>
							</template>
							<!-- <button -->
							<!-- 	class="pretend-ui-btn" -->
							<!-- 	:disabled="columnAddableOptions[index]?.championOptionIndex === undefined" -->
							<!-- 	@click="addColumnAbilities(index)" -->
							<!-- > -->
							<!-- 	add abilities -->
							<!-- </button> -->
							<!-- <button -->
							<!-- 	class="pretend-ui-btn" -->
							<!-- 	:disabled="!columnAddableOptions[index]?.itemOptionsIndexes.length" -->
							<!-- 	@click="addColumnItems(index)" -->
							<!-- > -->
							<!-- 	add items -->
							<!-- </button> -->
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
					:data-drop-direction="sectionDragDropIndex === index ? 'before' : !expandedSections.includes(section.id) && sectionDragDropIndex === index + 1 ? 'after' : undefined"
					:aria-busy="!section.image"
					@mousedown="preventDoubleClickSelect"
					@dblclick="toggleResultsSection(section.id)"
					@dragenter="onResultSectionDragenter($event, index, true)"
					@dragover="onResultSectionDragover($event, index, true)"
					@dragleave="onResultSectionDragleave"
					@drop="onResultSectionDrop($event, index, true)"
				>
					<tr :id="`results-header-row-${section.id}`">
						<td :headers="`results-header-${section.id}`">
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
								:disabled="index === resultSections.length - 1"
								@dblclick.stop=""
								@click.stop="moveResultSection(index, index + 1)"
								@dragstart="startResultSectionDrag($event, index)"
								@dragend="endResultSectionDrag"
							>
								<span>move down</span>
								<Icon class="i-ph:arrow-down" />
							</button>
							<button class="pretend-ui-btn remove" :title="toValue(section.clearable) ? 'clear, shift+click to remove' : 'remove'" @dblclick.stop="" @click.stop="removeResultsSection(index)">
								<span>{{ toValue(section.clearable) ? 'clear, shift+click to remove' : 'remove' }}</span>
								<Icon :class="toValue(section.clearable) ? 'i-ph:eraser' : 'i-ph:trash'" />
							</button>
							<button
								:title="expandedSections.includes(section.id) ? 'collapse' : 'expand'"
								class="pretend-ui-btn"
								:aria-expanded="expandedSections.includes(section.id)"
								:aria-controls="`results-body-${section.id}`"
								@dblclick.stop=""
								@click.stop="toggleResultsSection(section.id)"
							>
								<span>
									{{ expandedSections.includes(section.id) ? 'collapse' : 'expand' }}
								</span>
								<Icon class="i-ph:caret-down" />
							</button>
						</td>
						<th :id="`results-header-${section.id}`" scope="colgroup" :colspan="1 + resultColumns.length">
							<div v-bind="sectionHasTooltip(section) ? bindSectionHoverTooltip({ section }) : undefined">
								<img v-bind="toValue(section.image) && gameImageAttrs(toValue(section.image)!, 24)" aria-hidden="true" />
								<span v-html="toValue(section.image) ? `${toValue(section.name)}${section.abilityId.type === AbilityType.effect ? ' effect' : ''}` : 'loading...'" />
								<template v-if="sectionHasTooltip(section)">
									<article v-if="section.abilityId.type === AbilityType.item" popover="hint" class="hover-tooltip champion-item" :data-expanded="isTooltipExpanded || undefined">
										<LolItemDescription v-bind="toValue(section.hoverTooltipData) as any" hover-tooltip source="Inventory" />
									</article>
									<LolChampionAbilityHoverTooltip v-else-if="section.abilityId.type === AbilityType.champion" v-bind="toValue(section.hoverTooltipData) as any" />
									<LolEffectHoverTooltip v-else-if="section.abilityId.type === AbilityType.effect" v-bind="toValue(section.hoverTooltipData) as any" />
									<LolDragonHoverTooltip v-else-if="section.abilityId.type === AbilityType.dragon" v-bind="toValue(section.hoverTooltipData) as any" />
									<article v-else-if="typeof toValue(section.hoverTooltipData) === 'string'" popover="hint" class="hover-tooltip custom game-description info-tooltip" v-html="toValue(section.hoverTooltipData)" />
								</template>
								<template v-if="section.selectOptions?.length">
									<label :for="`results-header-select-${section.id}`">
										{{ section.selectLabel }}
									</label>
									<select :id="`results-header-select-${section.id}`" v-model="section.selectValue" @change="addComputedSection(section.id)">
										<option v-for="[value, optionText] in section.selectOptions" :key="value" :value>
											{{ optionText }}
										</option>
									</select>
								</template>
								<template v-if="section.notImplemented">
									<span :aria-describedby="`${section.id}-tooltip-not-implemented`" tabindex="0" class="info-tooltip-trigger warning" v-bind="bindInfoTriggerAttrs(undefined, true)">
										<span>not fully implemented</span>
										<Icon class="i-ph:warning-fill" />
									</span>
									<p :id="`${section.id}-tooltip-not-implemented`" popover="hint" class="hover-tooltip" v-bind="bindInfoPopoverAttrs()">
										This ability is not fully implemented. The values shown are most likely wrong (not factoring in target's resists, champion's heal and shield power, etc.)<br />
										<NuxtLink to="/about#implemented-champions" target="_blank">list of fully implemented champions</NuxtLink>
									</p>
								</template>
							</div>
						</th>
					</tr>
				</tbody>
				<tbody
					:id="`results-body-${section.id}`"
					:aria-labelledby="`results-header-${section.id}`"
					:hidden="!expandedSections.includes(section.id)"
					:data-drop-direction="sectionDragDropIndex === index + 1 ? 'after' : undefined"
					:aria-busy="!section.image"
					@dragenter="onResultSectionDragenter($event, index, false)"
					@dragover="onResultSectionDragover($event, index, false)"
					@dragleave="onResultSectionDragleave"
					@drop="onResultSectionDrop($event, index, false)"
				>
					<tr v-if="!section.image" class="info-row">
						<td :colspan="maxCols">loading...</td>
					</tr>
					<tr v-else-if="!restoreSavedCustomTotalRows && !section.isCustomValue && (section.isCustomTotal ? computedCustomTotalRows.length < 2 : !toValue(section.rows)?.length)" class="info-row">
						<td :colspan="maxCols">
							{{ section.isCustomTotal ? 'check boxes next to variable rows to sum them' : 'no variables detected' }}
						</td>
					</tr>
					<tr v-for="(row, rowIndex) in section.isCustomTotal ? (computedCustomTotalRows.length > 1 ? computedCustomTotalRows : []) : toValue(section.rows)" :key="`${section.id}_${row.id}`" :class="{ unknown: row.isUnknown }">
						<td v-if="!section.isCustomTotal && section.id !== ResultSectionId.Stats">
							<label>
								<span>include in custom total</span>
								<input v-model="customTotalRowIds" type="checkbox" title="include in custom total" :value="`${section.id}_${row.id}`" @change="onCustomTotalRowsChange" />
							</label>
						</td>
						<th scope="row" :colspan="section.isCustomTotal || section.id === ResultSectionId.Stats ? 2 : undefined" headers="results-table-header-variable" :data-type="(row as IDamageResultTableSectionCustomValueRow).type">
							<img
								v-if="row.image"
								aria-hidden="true"
								v-bind="{
									...gameImageAttrs(row.image, 24),
									...((row as ICustomTotalSectionRow).section && sectionHasTooltip((row as ICustomTotalSectionRow).section) ? bindSectionHoverTooltip({ section: (row as ICustomTotalSectionRow).section, fromCustom: true }) : undefined),
								}"
							/>
							<div v-if="section.isCustomValue">
								<input
									:id="`value-${row.id}`"
									:value="(row as IDamageResultTableSectionCustomValueRow).value"
									type="number"
									min="0"
									step="any"
									aria-labelledby="lbl-result-custom-v-value"
									required
									@input="updateCustomValueRowValue(rowIndex, $event)"
								/>
								<select :id="`type-${row.id}`" :value="(row as IDamageResultTableSectionCustomValueRow).type" aria-labelledby="lbl-result-custom-v-select" @change="updateCustomValueRowType(rowIndex, $event)">
									<option v-for="(name, type) in variableTypeOptionNames" :value="type" :key="type">
										{{ name }}
									</option>
								</select>
								<button class="pretend-ui-btn remove" title="remove" @click="removeCustomValueRow(rowIndex)">
									<span>remove</span>
									<Icon class="i-ph:trash" />
								</button>
							</div>
							<template v-else>
								<span v-if="row.isUnknown">unknown</span>
								<template v-if="(row as IDamageResultTableSectionCustomValueRow).type">
									<span :data-type="(row as IDamageResultTableSectionCustomValueRow).type">{{ (row as IDamageResultTableSectionCustomValueRow).value }}</span>
									<span :data-type="(row as IDamageResultTableSectionCustomValueRow).type">{{ variableTypeOptionNames[(row as IDamageResultTableSectionCustomValueRow).type] }}</span>
								</template>
								<template v-else>
									{{ row.name }}
								</template>
								<span v-if="row.isCustom" :aria-describedby="`${section.id}-${row.id}-tooltip-custom`" tabindex="0" class="info-tooltip-trigger" v-bind="bindInfoTriggerAttrs(undefined, true)">
									<img src="/logo_dark.webp" alt="lolcalc logo" width="192" height="192" />
								</span>
								<p :id="`${section.id}-${row.id}-tooltip-custom`" popover="hint" class="hover-tooltip" v-bind="bindInfoPopoverAttrs()">
									this variable is added by <strong>lolcalc</strong>. It's either not present in the original description or a calculated version of an existing one
								</p>
								<span v-if="row.additionalInfo" :aria-describedby="`${section.id}-${row.id}-tooltip-info`" class="info-tooltip-trigger" tabindex="0" v-bind="bindInfoTriggerAttrs(undefined, true)">
									<span>additional info</span>
									<Icon class="i-ph:info-fill" />
								</span>
								<p :id="`${section.id}-${row.id}-tooltip-info`" popover="hint" class="hover-tooltip game-description" v-bind="bindInfoPopoverAttrs()" v-html="row.additionalInfo" />
							</template>
						</th>
						<td
							v-for="(cell, cellIndex) in sectionRowCells(section.id, row.id, (row as ICustomTotalSectionRow).sectionId)"
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
								v-bind="
									highlightedColumnId && cell.computedColumn.comparisonMap[highlightedColumnId] !== 0
										? {
												[cell.computedColumn.comparisonMap[highlightedColumnId!]! < 0 ? 'data-lower' : 'data-higher']: cell.computedColumn.comparisonMap[highlightedColumnId!],
											}
										: undefined
								"
							>
								{{ cell.computedColumn.value }}
							</span>
						</td>
					</tr>
					<tr v-if="section.isCustomValue" id="results-new-custom-v-row">
						<td>
							<button class="pretend-ui-btn" @click="submitCustomValueRow">add</button>
						</td>
						<th :data-type="newCustomValueRowType">
							<form @submit.prevent="submitCustomValueRow">
								<label id="lbl-result-custom-v-value" for="result-custom-v-value">value</label>
								<input id="result-custom-v-value" v-model="newCustomValueRowValue" type="number" min="0" step="any" required />
								<label id="lbl-result-custom-v-select" for="results-custom-v-select">type</label>
								<select id="results-custom-v-select" v-model="newCustomValueRowType">
									<option v-for="(name, type) in variableTypeOptionNames" :value="type" :key="type">
										{{ name }}
									</option>
								</select>
							</form>
						</th>
						<td :colspan="resultColumns.length" />
					</tr>
					<tr v-else-if="section.id === ResultSectionId.CustomTotal && restoreSavedCustomTotalRows" class="info-row">
						<td :colspan="maxCols">loading...</td>
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
						<th id="results-table-header-variable" scope="col" :width="`${colW.header}px`">
							<span>damage type</span>
						</th>
						<th scope="col" :width="`${colW.result}px`">
							<span> undefined source vs undefined target </span>
						</th>
					</tr>
					<tr>
						<td :width="`${colW.controls + colW.header}px`" colspan="2">
							<div>
								<label for="results-table-values-for">
									<input id="results-table-values-for" type="checkbox" />
									flip results (target vs source)
								</label>
								<button class="pretend-ui-btn">remove unused</button>
								<span aria-hidden="true">damage type</span>
							</div>
						</td>
						<td :width="`${colW.result}px`">
							<div>
								<VSelect id="results-table-column-source-0" label="column's damage source" :options="[]" clearable>
									<img :src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`" width="256" height="256" aria-hidden="true" />
								</VSelect>
								<span>vs</span>
								<VSelect id="results-table-column-target-0" label="column's damage target" :options="[]" clearable>
									<img :src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`" width="256" height="256" aria-hidden="true" />
								</VSelect>
								<button class="pretend-ui-btn">add column</button>
							</div>
						</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<button class="pretend-ui-btn">move up</button>
							<button class="pretend-ui-btn">move down</button>
							<button class="pretend-ui-btn">move remove</button>
							<button class="pretend-ui-btn">move expand</button>
						</td>
						<th scope="colgroup" colspan="2">
							<div>
								<img src="" width="" height="" aria-hidden="true" />
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
	#results-table-scroll-wrapper {
		--at-apply: 'of-auto max-block-[calc(100svb-var(--mbe)-var(--section-header-my)-var(--text-xl-fontSize))] mbe-10 inline-min max-inline-full mx-auto b b-[--b-clr] relative';
		--mbe: calc(10 * var(--spacing));
		--b-clr: theme('colors.neutral.600');
	}

	#results-table {
		--at-apply: 'border-separate border-spacing-0 bg-[--bg-clr] block-px inline-max';
		--bg-clr: theme('colors.slate.950');
		--table-ps: calc(3 * var(--spacing));
		--header-row-gap-y: calc(3 * var(--spacing));
		--header-champion-select-size: calc(10 * var(--spacing));
		--header-row-pb: calc(3 * var(--spacing));
		--header-row-pt: calc(2 * var(--spacing));
		--header-h: calc(var(--header-row-pt) + var(--header-row-pb) + var(--header-champion-select-size) + var(--header-row-gap-y) + var(--manipulate-btn-size) + 1px); /* offset by 1 px to undouble button borders */
		--section-header-row-pt: calc(2 * var(--spacing));
		--section-header-row-pb: calc(1 * var(--spacing));
		--section-body-pb: 0px;
		--manipulate-icon-size: calc(5.5 * var(--spacing));

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
			--at-apply: 'sticky inset-bs-0 z-5';

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
				--at-apply: 'ps-[--table-ps] pb-[--header-row-pb] bg-[--bg-clr] min-block-px block-inherit text-start align-top';

				> div {
					--at-apply: 'grid grid-cols-[auto_max-content] grid-rows-[auto_1fr] inline-min block-full';

					> button {
						--at-apply: 'size-[--manipulate-btn-size] grid-center justify-self-end';

						.icon {
							--at-apply: 'size-[--manipulate-icon-size]';
						}
					}

					> label {
						--at-apply: 'self-center inline-max';

						> input {
							--at-apply: 'size-[--fluid-20-18-t640] align-[-3.5px] me-[0.25ch]';
						}
					}

					> form {
						--at-apply: 'col-span-full grid grid-cols-subgrid rows-1 gap-x-2 self-end';

						> label {
							--at-apply: 'sr-only';
						}

						> select {
							/* make sure to more or less sync `t940` with `baseHeaderColWidth`. Also to `254` so that it aligns with the scoreboard middle divider. Not really necessary, just happened to be close */
							--at-apply: 'inline-[--fluid-164-254-t940] px-1.5 bg-white text-black';
							color-scheme: light;

							&:disabled {
								--at-apply: 'text-neutral-700 bg-neutral-200';
							}
						}

						> button {
							--at-apply: 'w-fit px-2 h-[--manipulate-btn-size]';
						}
					}
				}
			}

			> tr:nth-child(2) > td:not(:first-child) {
				--at-apply: 'pb-[--header-row-pb] bg-[--bg-clr] align-top';

				&[data-drop-direction]::after {
					--at-apply: 'content-empty absolute z-3 start-0.25 top-0 translate-y-[--manipulate-btn-size] size-4 rotate-270 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}

				&[data-drop-direction='after']::after {
					--at-apply: 'end-0.25 start-auto rotate-90';
				}

				> div {
					--at-apply: 'grid grid-rows-[auto_1fr] relative grid-cols-[1fr_auto_min-content_min-content_auto_1fr] gap-y-[--header-row-gap-y]';
					grid-template-areas:
						'move-left manipulate manipulate remove remove move-right'
						'source source vs vs target target';

					> .v-select {
						--at-apply: 'size-[--header-champion-select-size]';
						--b-width: 2px;
						anchor-name: --select;
						anchor-scope: --select;

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

						> [popover] {
							--at-apply: 'shadow';
							position-anchor: --select;
							inset-block-start: calc(anchor(end));
							justify-self: anchor-center;

							> .damage-source-thumbnail {
								/* default py is 1 but add 1px to make it align it with the bottom of manipulate buttons */
								--at-apply: 'py-1.25';
							}
						}
					}

					> span {
						--at-apply: 'pointer-events-none text-center self-center text-lg font-600 z-1 px-[0.33ch]';
						-webkit-text-stroke: black 0.15em;
						paint-order: stroke fill;
						grid-area: vs;
					}
				}

				&:not(:last-child) > div {
					anchor-scope: --v-menu-trigger;

					> button {
						--at-apply: 'grid place-items-center self-center';

						&:not(:last-child) {
							--at-apply: 'size-[--manipulate-btn-size]';

							> .icon {
								--at-apply: 'size-[--manipulate-icon-size]';
							}
						}

						&:nth-of-type(1) {
							--at-apply: 'justify-self-end -me-[1.5px]';
							grid-area: move-left;
						}

						&:nth-of-type(2) {
							--at-apply: 'justify-self-end -me-[0.5px] z-1';
							grid-area: manipulate;
						}

						&:nth-of-type(3) {
							--at-apply: 'z-1 -ms-[0.5px] z-1';
							grid-area: remove;
						}

						&:nth-of-type(4) {
							--at-apply: 'justify-self-start -ms-[1.5px]';
							grid-area: move-right;
						}

						&:nth-of-type(5) {
							--at-apply: 'absolute inset-0 -top-[--header-row-pt] h-[calc(100%+2*var(--header-row-pt))] grid place-items-center text-center text-xl font-600 backdrop-blur-2 z-10 tracking-wide focus-visible:outline-none bg-black/20';
							-webkit-text-stroke: black 0.15em;
							paint-order: stroke fill;

							&::before {
								--at-apply: 'content-empty absolute top-1/2 start-1/2 translate-center outline-auto h-7 w-[4.5em]';
							}
						}
					}

					> .v-menu {
						inset-block-start: calc(anchor(end) - 1px);
						justify-self: anchor-center;
					}
				}

				&:last-child > div {
					> button {
						&:nth-of-type(1) {
							--at-apply: 'inline-auto block-[--manipulate-btn-size] px-2 justify-self-center';
							grid-area: 1 / 1 / 2 / 7;
						}
					}
				}
			}
		}

		> tbody {
			anchor-scope: --section-header-row, --results-section-name;

			&:not([aria-labelledby]) {
				--at-apply: 'sticky inset-bs-[calc(var(--header-h)-0.5px)] z-4 bg-[--bg-clr]';
				--tooltip-offset-y: 0px;

				> tr {
					anchor-name: --section-header-row;

					&#results-header-row-a-cTtl {
						anchor-name: --custom-total-section-header;
					}

					> td {
						--at-apply: 'grid grid-flow-col grid-cols-2 grid-rows-2 ps-[--table-ps]';

						> button {
							--at-apply: 'size-(--manipulate-btn-size) grid-center';

							> .icon {
								--at-apply: 'size-[--manipulate-icon-size]';
							}

							&[aria-expanded='true'] > span {
								--at-apply: 'rotate-180';
							}

							&:nth-of-type(2),
							&:nth-of-type(4) {
								--at-apply: '-mt-px z-1';
							}

							&:nth-of-type(3),
							&:nth-of-type(4) {
								--at-apply: '-ms-px z-2';
							}
						}
					}

					> * {
						--at-apply: 'pt-[--section-header-row-pt] pb-[--section-header-row-pb]';
					}

					> th {
						--at-apply: 'relative';
						anchor-scope: --results-section-name;

						> div {
							--at-apply: 'sticky inset-s-0 ps-3 inline-fit';
							anchor-name: --results-section-name;

							> span,
							> select {
								--at-apply: 'text-lg font-500 align-middle';
							}

							> span {
								> unknown {
									color: var(--unknown-clr);
								}
							}

							> img {
								--at-apply: 'size-7 me-1.5 inline-block';
							}

							/** not implemented warning tooltip has id attribute, don't target it, just use the default info tooltip positioning (from `index.css`) */
							> [popover]:not([id]) {
								position-anchor: --section-header-row;
								inset-block-start: auto;
								inset-block-end: calc(anchor(start) - var(--tooltip-offset-y, 0px));
								position-try-fallbacks: --results-header-flip-block, --hover-tooltip-sheet;

								/* a style attribute is present when the tooltip is shown from a custom total row. The flip block in that case needs to be below the custom total body. This fallback is declared in `index.css` */
								&[style] {
									position-try-fallbacks: --results-ctotal-row-flip-block, --hover-tooltip-sheet;
								}

								.hover-tooltip.effect {
									--at-apply: 'self-center';
								}
							}

							> .hover-tooltip.custom {
								--tooltip-max-w: calc(160 * var(--spacing));
							}

							> label {
								--at-apply: 'sr-only';
							}

							> select {
								--at-apply: 'px-1 ms-[0.5ch] me-2';
							}

							> .info-tooltip-trigger.warning {
								--at-apply: 'inline-block ms-2 size-5';

								&::after {
									--at-apply: 'absolute content-empty inset-x-0 inset-be-0 translate-y-full block-2.25';
								}
							}
						}
					}
				}

				&:not(:first-of-type) {
					--at-apply: 'top-[calc(var(--header-h)-var(--pt)+var(--section-header-row-pt))]';
					--pt: calc(6 * var(--spacing));
					--tooltip-offset-y: calc(var(--pt) - var(--section-header-row-pt));

					> tr > * {
						--at-apply: 'pt-[--pt]';
					}
				}
			}

			&[aria-labelledby] {
				--at-apply: 'text-neutral-200';

				&#results-body-a-cTtl {
					anchor-name: --custom-total-section-body;
				}

				> tr {
					--ps: calc(2 * var(--manipulate-btn-size));
					--at-apply: 'bg-[--bg-clr]';

					&.info-row {
						--at-apply: 'text-neutral-400 font-600';
					}

					&:where(:not(.info-row, #results-new-custom-v-row)):hover {
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
						--at-apply: 'text-[--unknown-clr]';
					}

					> * {
						--row-py: var(--spacing);
						--row-th-ps: var(--spacing);
						--at-apply: 'py-[--row-py] b-y b-transparent';
					}

					> th {
						--at-apply: 'hyphens-auto wrap-anywhere sticky inset-s-0 ps-[--row-th-ps] z-2 bg-inherit';
						anchor-scope: --parent;

						&[colspan] {
							--at-apply: 'ps-[calc(var(--table-ps)+var(--ps))]';
						}

						> img {
							--at-apply: 'inline-block size-[--size] align-middle -ms-[--ms] me-[calc(0.5*var(--size))]';
							--size: calc(5 * var(--spacing));
							--ms: calc(0.5 * (var(--ps) + var(--size)));
						}

						> span:not([aria-describedby], [data-type]) {
							--at-apply: 'sr-only';
						}

						> span[data-type] {
							--at-apply: 'text-[--type-clr]';

							&:first-of-type {
								--at-apply: 'font-600 bg-black px-1 py-0.5 -my-0.5 rounded-sm';
							}

							&:not(:first-of-type) {
								--at-apply: 'ms-[0.33ch]';
							}
						}
					}

					> td {
						--ctl-col-px: calc(3 * var(--spacing));
						--at-apply: 'px-[--ctl-col-px]';

						&:first-child {
							> label {
								--at-apply: 'absolute inset-0 grid-center ms-[--table-ps]';

								> span {
									--at-apply: 'sr-only';
								}

								> input {
									--at-apply: 'size-[--fluid-20-18-t640]';
								}
							}
						}

						&.irrelevant {
							--at-apply: 'text-neutral-500';
						}

						&.unknown {
							--at-apply: 'text-[--unknown-clr]';
						}

						&:not(.irrelevant) > span {
							--at-apply: 'relative';

							&::after {
								--at-apply: 'absolute text-xs top-1/2 -translate-y-1/2 -end-1.5 translate-x-full whitespace-nowrap brightness-70';
							}
						}
					}

					&:nth-child(even) {
						background-color: color-mix(in srgb, white 5%, var(--bg-clr));
					}
				}

				&#results-body-a-cV {
					> tr {
						--ctl-btn-gap: calc(2 * var(--spacing));

						input:not([type='checkbox']),
						select {
							--at-apply: 'ps-1.5 pe-1 leading-7 block-[--manipulate-btn-size] bg-black b b-op-70 b-[--type-clr]';
						}

						input:not([type='checkbox']) {
							/* to 930 because around there the header col reaches max width */
							--at-apply: 'inline-[--fluid-80-87-t930] -me-px';
						}

						select {
							--at-apply: 'truncate inline-full max-inline-40';
						}

						&:not(:last-child) {
							> th {
								> div {
									--at-apply: 'flex items-center inline-full';

									> button {
										--at-apply: 'shrink-0 size-[--manipulate-btn-size] ms-[--ctl-btn-gap] grid place-items-center -my-0.5';

										> .icon {
											--at-apply: 'size-[--manipulate-icon-size]';
										}
									}
								}

								input,
								select {
									--at-apply: '-my-0.5';
								}
							}
						}

						&:last-child {
							button {
								--at-apply: 'leading-7 block-[--manipulate-btn-size] px-2 absolute inset-be-[--row-py] inset-s-[calc(var(--table-ps)*0.5+50%+1px)] -translate-x-1/2';
							}

							form {
								--at-apply: 'relative grid grid-rows-[auto_1fr] grid-cols-[auto_minmax(0,1fr)] grid-flow-col inline-[calc(100%)]';

								label {
									--at-apply: 'text-start';
								}
							}
						}
					}
				}
			}
		}

		&:not([inert]) {
			> thead > tr:nth-child(2) > td:nth-child(n + 2).highlighted,
			> tbody[aria-labelledby] > tr > td.highlighted {
				background-image: linear-gradient(to right, oklch(from var(--source-clr, var(--col-damage-source-clr, white)) l c h / 0.12), oklch(from var(--target-clr, var(--col-damage-target-clr, white)) l c h / 0.12));
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
					background-image: linear-gradient(var(--drop-indicator-bg-direction), hsl(0 100% 100%) 0px, hsl(0 100% 100%) var(--drop-indicator-b-w), hsl(0 100% 100% / 0.2) var(--drop-indicator-b-w), transparent 1rem);
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
