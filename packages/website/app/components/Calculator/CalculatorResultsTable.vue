<script setup lang="ts">
import type { WatchHandle } from 'vue';
import type { IChampionAbilityHoverTooltipProps, IChampionAbilityId, IDamageResultTableColumn, IDamageResultTableSection, IGameAbilityId, IItemAbilityId } from '~/utils/types';

const props = defineProps<{
	damageSources: DamageSource[];
	damageTargets: DamageSource[];
	showResults: boolean;
}>();

const emit = defineEmits<{
	configurationChanged: [];
}>();

const resultSections = defineModel<IDamageResultTableSection[]>('sections', { required: true });
const resultColumns = defineModel<IDamageResultTableColumn[]>('columns', { required: true });

const text = useText();
const items = useItems();
const { championImage, abilityImage, championImageSize, abilityImageSize } = useChampionImages();
const enableUnimplementedUi = useEnableUnimplementedUi();
const globalKeyModifiers = useGlobalKeyModifiers();
const highlightedDamageSources = useHighlightedDamageSources();
const { version, minorVersion } = usePatchVersion();

const STATS_SECTION_ID = 'a-stats';
const CUSTOM_TOTAL_SECTION_ID = 'a-cTtl';

const flipResults = ref(false);
const sourceProperty = computed(() => flipResults.value ? 'target' : 'source');
const targetProperty = computed(() => flipResults.value ? 'source' : 'target');

const highlightedColumnId = ref<string>();

function columnOptions(from: DamageSource[]): [string, string][] {
	return from.map((source, i) => [source.id, `(${i + 1}) ${source.listedChampion.value?.name || '<empty>'}`]);
}
const sourceOptions = computed(() => columnOptions(props.damageSources));
const targetOptions = computed(() => columnOptions(props.damageTargets));

function setColumnChampion(column: IDamageResultTableColumn, damageSources: DamageSource[], championId?: string) {
	const oldDamageSourceId = column[damageSources === props.damageSources ? 'source' : 'target']?.id;
	oldDamageSourceId && highlightedDamageSources.remove(oldDamageSourceId);

	const property = damageSources === props.damageSources ? 'source' : 'target';

	column[property] = championId
		? damageSources.find(damageSource => damageSource.id === championId)
		: undefined;
	recalculateColumn(column);

	column[property] && highlightedDamageSources.add(column[property].id);
	emit('configurationChanged');
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
	props.damageSources
		.concat(props.damageTargets)
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
			type: ABILITY_TYPE.champion,
			optionId: championId,
			optionName: champion.name,
			abilities: abilityEntries
				.flatMap(([abilityKey, ability]): IDamageSectionOption['abilities'] =>
					ability.variants.map((variant, abilityVariantIndex): IDamageSectionOption['abilities'][number] => {
						const { replaced: nameReplaced } = replaceGameDescriptionStringtableVariables(
							variant.name,
							champion.stringtable,
						);

						return {
							id: GameAbilityId.build(ABILITY_TYPE.champion, champion.id, abilityKey as IChampionAbilityKey, abilityVariantIndex),
							name: championAbilitySectionName(champion.name, abilityKey as IChampionAbilityKey, nameReplaced),
						};
					}),
				),
		} satisfies IDamageSectionOption;
	})
	.toArray());

const damageSectionItemAbilities = computed<IDamageSectionOption['abilities']>((): IDamageSectionOption['abilities'] => {
	const itemIds = new Set(props.damageSources
		.concat(props.damageTargets)
		.flatMap(damageSource => damageSource.computed.items.value.map((item, index) =>
			item?.variables.size || item?.unknownVariables.length ? damageSource.items.value[index]!.id : undefined,
		))
		.filter(Boolean));

	return itemIds.values()
		.map((itemId): IDamageSectionOption['abilities'][number] => ({
			name: items[itemId!]!.name,
			id: GameAbilityId.build(ABILITY_TYPE.item, itemId!),
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
	comparisonMap: Record<string, 'higher' | 'lower'>;
}

const customTotalRows = ref<string[]>([]);
const customTotalSection = resultSections.value.find(section => section.isCustomTotal)!;
const customTotalSectionTotalRow = customTotalSection.rows[0]!;

const computedResults = ref(new Map<string, IComputedSection>(
	[[customTotalSection.id, computeSection(customTotalSection)] as [ string, IComputedSection ]]
		.concat(resultSections.value.map(section => [section.id, computeSection(section)] as [string, IComputedSection])),
));

const customTotalComputedSection = computedResults.value.get(CUSTOM_TOTAL_SECTION_ID)!;
const customTotalComputedSectionTotalRow = customTotalComputedSection.rows.get('cTtl-total')!;

const computedCustomTotalRows = computed<ICustomTotalSectionRow[]>(() => {
	/** `customTotalSection` is expected contain only the `total` row which technically doesn't have `sectionId` but it's not expected to be used */
	const rows: ICustomTotalSectionRow[] = (customTotalSection.rows as ICustomTotalSectionRow[]).concat(customTotalRows.value.map((combinedId) => {
		const [sectionId, rowId] = combinedId.split('_');

		const section = resultSections.value.find(section => section.id === sectionId)!;
		const rowIndex = section.rows.findIndex(row => row.id === rowId)!;
		const row = section.rows[rowIndex]!;

		return {
			...row,
			sectionId: section.id,
			rowIndex,
			image: section.image ? { src: section.image, width: section.imageSize, height: section.imageSize } : undefined,
		};
	}));

	return rows;
});

recalculateResultCellComparisonNumbers();

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
	const source = column[sourceProperty.value];
	const target = column[targetProperty.value];
	const rv: IComputedSectionRowColumn = {
		columnId: column.id,
		isIrrelevant: true,
		value: '-',
		comparisonMap: {},
		isUnknown: false,
	};

	if (!source || (!source.listedChampion.value && section.abilityId.type !== 'item')) {
		rv.value = '-';
	} else if (source.listedChampion.value && source.listedChampion.value.id !== source.champion.value?.id) {
		rv.value = 'loading...';
	} else if (
		(section.abilityId.type === 'champion' && source.champion.value?.id !== section.abilityId.id)
		|| (section.id === 'aa' && source.champion.value?.id === 'Zeri')
	) {
		rv.value = 'n/a';
	} else if (section.id === CUSTOM_TOTAL_SECTION_ID) { /* expected to be called only for the total row */
		if (!customTotalRows.value.length) {
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
	emit('configurationChanged');
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
	const undoRemoveButton = removeButton?.nextElementSibling?.nextElementSibling as HTMLButtonElement | undefined;
	if (!undoRemoveButton || !(resultColumns.value[index]?.source || resultColumns.value[index]?.target)) {
		removeResultsColumn(index);
		return;
	}

	const container = removeButton?.closest('td');

	function removeAndFocusNext() {
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
	emit('configurationChanged');
}

const expandedSections = ref<string[]>(resultSections.value.filter(section => section.id !== STATS_SECTION_ID).map(section => section.id));

function toggleResultsSection(sectionId: string) {
	const index = expandedSections.value.indexOf(sectionId);
	if (~index) {
		expandedSections.value.splice(index, 1);
	} else {
		expandedSections.value.push(sectionId);
	}
	emit('configurationChanged');
}

const itemVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, rowId, source, _target) => {
	const computedItem = section.abilityId.type === 'item'
		? source?.computed.items.value.find(item =>
				item?.item!.id === (section.abilityId as IItemAbilityId).id,
			)
		: undefined;
	if (computedItem) {
		let numberValue = computedItem.variables.get(rowId);
		let value: string | number = numberValue as unknown as string;
		let isUnknown = false;

		if (numberValue === undefined) {
			numberValue = 0;
			value = '?';
			isUnknown = true;
		} else if (typeof numberValue !== 'number') {
			value = `${numberValue[0]} | ${numberValue[1]}`;
			numberValue = undefined;
		}

		return {
			numberValue,
			value,
			isUnknown,
		};
	}
};

const abilityVariableCellValue: IDamageResultTableSection['getCellValue'] = (section, rowId, source, _target) => {
	if (!source) {
		return;
	}

	const { gameAbilityId } = (section.hoverTooltipData as IChampionAbilityHoverTooltipProps).precomputedDescription!;

	const computedDescription = source.computed.abilities.value[gameAbilityId.abilityKey!][gameAbilityId.abilityVariantIndex!];
	if (computedDescription) {
		const rv: ReturnType<NonNullable<IDamageResultTableSection['getCellValue']>> = {
			value: '?',
			isUnknown: false,
		};
		const value = computedDescription.variables.get(rowId);

		if (value === undefined) {
			rv.numberValue = 0;
			rv.value = '?';
			rv.isUnknown = true;
		} else if (typeof value !== 'number') {
			rv.value = `${value[0]} | ${value[1]}`;
		} else {
			rv.value = value;
			rv.numberValue = value;
		}

		return rv;
	}
};

function submitResultsSection(event: SubmitEvent) {
	const value = new FormData(event.target as HTMLFormElement).get('sectionOptionIndex')! as string;
	if (!value) {
		return;
	}

	const [rawOptionIndex, rawAbilityIndex] = value.split('-');
	(event.target as HTMLFormElement).reset();
	const ability = damageSectionOptions.value[Number.parseInt(rawOptionIndex!)]!.abilities[Number.parseInt(rawAbilityIndex!)]!;
	addResultsSection(ability.id, ability.name);
	emit('configurationChanged');
}

async function addResultsSection(
	abilityId: IGameAbilityId,
	name = '',
	expand = true,
) {
	const id = GameAbilityId.stringify(abilityId);
	if (resultSections.value.some(section => section.id === id) || (abilityId.type === 'champion' && abilityId.id === 'TargetDummy')) {
		return;
	}

	const section = {
		id,
		abilityId,
		name,
		image: undefined,
		imageSize: 64,
		rows: [],
	} satisfies Omit<IDamageResultTableSection, 'getCellValue'> as unknown as IDamageResultTableSection;

	/* when name is undefined it's being restored from state which does so in order */
	resultSections.value[name === undefined ? 'push' : 'unshift'](section);
	expand && expandedSections.value.push(section.id);

	if (abilityId.type === 'champion') {
		const champion = await useChampion(abilityId.id);
		if (!champion?.abilities[abilityId.abilityKey].variants[abilityId.abilityVariantIndex]) {
			const index = resultSections.value.indexOf(section);
			~index && resultSections.value.splice(index, 1);
			const expandedIndex = expandedSections.value.indexOf(section.id);
			~expandedIndex && expandedSections.value.splice(expandedIndex, 1);
			triggerRef(resultSections);

			return;
		}

		const precomputedDescription = computeAbilityDescription(minorVersion, champion, abilityId, undefined, { replaceWithName: true });

		section.name ||= championAbilitySectionName(champion.name, abilityId.abilityKey, precomputedDescription.name);
		section.image = abilityImage(precomputedDescription.variant.image, champion.id, `${sourceProperty.value}s`);
		section.imageSize = abilityImageSize(champion.id);
		section.rows = getAbilitySectionRows(precomputedDescription);
		section.hoverTooltipData = {
			precomputedDescription,
		};
		section.getCellValue = abilityVariableCellValue;
	} else {
		const item = items[abilityId.id];
		if (!item) {
			const index = resultSections.value.indexOf(section);
			~index && resultSections.value.splice(index, 1);
			const expandedIndex = expandedSections.value.indexOf(section.id);
			~expandedIndex && expandedSections.value.splice(expandedIndex, 1);
			triggerRef(resultSections);

			return;
		}

		const precomputedDescription = computeItemDescription(text, minorVersion, item, undefined, { replaceWithName: true })!;

		section.name ||= item.name;
		section.rows = getAbilitySectionRows(precomputedDescription);
		section.image = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`;
		section.getCellValue = itemVariableCellValue;
		section.hoverTooltipData = { precomputedDescription };
	}

	addComputedSection(section.id);
	triggerRef(resultSections);
}

function getAbilitySectionRows({ variables, unknownVariables }: Pick<IReplaceGameDescriptionVariablesRV, 'variables' | 'unknownVariables'>): IDamageResultTableSection['rows'] {
	return markRaw(variables
		.keys()
		.toArray()
		.map(name => ({ id: name, name }))
		.concat(unknownVariables.map(([rawName, actualName]) => ({
			id: rawName,
			name: actualName || rawName,
			isUnknown: true,
		}))));
}

function removeResultsSection(index: number) {
	const section = resultSections.value[index];
	if (section!.isCustomTotal) {
		customTotalRows.value.length = 0;
	} else {
		const [section] = resultSections.value.splice(index, 1);
		computedResults.value.delete(section!.id);
	}
	emit('configurationChanged');
}

const damageSourceWatchers = new Map<string, WatchHandle>();

watch(
	() => props.damageSources.map(source => source.id),
	(newV, oldV) => handleSourceUpdate(props.damageSources, newV, oldV),
	{ immediate: true },
);
watch(
	() => props.damageTargets.map(source => source.id),
	(newV, oldV) => handleSourceUpdate(props.damageTargets, newV, oldV),
	{ immediate: true },
);

function handleSourceUpdate(target: DamageSource[], currIds: string[], prevIds: string[] = []) {
	emit('configurationChanged');
	const addedIds = currIds.filter(id => !prevIds.includes(id));
	const removedIds = prevIds.filter(id => !currIds.includes(id));

	for (const id of removedIds) {
		damageSourceWatchers.get(id)?.();
		damageSourceWatchers.delete(id);

		for (const column of resultColumns.value) {
			const columnProperty = target === props.damageSources ? 'source' : 'target';
			if (column[columnProperty]?.id === id) {
				column[columnProperty] = undefined;
				recalculateColumn(column);
			}
		}
	}

	for (const id of addedIds) {
		const source = (target.find(damageSource => damageSource.id === id))!;
		damageSourceWatchers.set(source.id, watch(source.getWatchable(), () => {
			emit('configurationChanged');
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
	emit('configurationChanged');
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

function recalculateResultCellComparisonNumbers() {
	for (const section of computedResults.value.values()) {
		calculateComputedSectionComparisonMaps(section);
	}
}

function calculateComputedSectionComparisonMaps(section: IComputedSection) {
	for (const row of section.rows.values()) {
		calculateComputedRowComparisonMap(row);
	}
}

function calculateComputedRowComparisonMap(row: IComputedSectionRow) {
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
				if (a > b) {
					map[idB] = 'higher';
				} else if (a < b) {
					map[idB] = 'lower';
				}
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
		.filter(([, section]) =>
			section.abilityId.type === 'item'
				? !resultColumns.value.some(column =>
						column.source?.items.value.some(item => item?.id === section.abilityId.id) || column.target?.items.value.some(item => item?.id === section.abilityId.id),
					)
				: section.abilityId.type === 'champion' && !resultColumns.value.some(column =>
					column.source?.listedChampion.value?.id === section.abilityId.id || column.target?.listedChampion.value?.id === section.abilityId.id,
				));

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

		for (let i = customTotalRows.value.length - 1; i >= 0; i--) {
			const [sectionId] = customTotalRows.value[i]!.split('_');

			if (sectionId === section.id) {
				customTotalRows.value.splice(i, 1);
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
	emit('configurationChanged');
}

const columnDragDropIndex = ref<number>();
let columnDraggedFromIndex: number | undefined;

function startResultColumnDrag(index: number, event: DragEvent) {
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
	emit('configurationChanged');
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
	emit('configurationChanged');
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
	emit('configurationChanged');
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
const columnAddableOptions = computed(() => sourceProperty.value === 'source' ? columnAddableSourceOptions.value : columnAddableTargetOptions.value);

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

	const itemOptions = damageSectionOptions.value.at(-1)!;
	rv.itemOptionsIndexes = damageSource && damageSectionOptions.value.at(-1)?.type === 'item'
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
			addResultsSection(option.abilities[i]!.id, '');
		}
	}
	emit('configurationChanged');
}

function addColumnItems(columnIndex: number) {
	const { itemOptionsIndexes } = columnAddableOptions.value[columnIndex]!;
	const option = damageSectionOptions.value.at(-1);
	if (option?.type === 'item') {
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
	emit('configurationChanged');
}

type IDamageResultTableSectionRow = IDamageResultTableSection['rows'][number];
interface ICustomTotalSectionRow extends IDamageResultTableSectionRow {
	sectionId: string;
	/** the index the target row is at in its section */
	rowIndex: number;
}

function onCustomTotalRowsChange() {
	recomputeCustomTotalRow();
	if (!expandedSections.value.includes(customTotalSection.id) && customTotalRows.value.length) {
		expandedSections.value.push(customTotalSection.id);
	}
	emit('configurationChanged');
}

function recomputeCustomTotalRow() {
	for (const column of resultColumns.value) {
		customTotalComputedSectionTotalRow.columns.set(
			column.id,
			computeSectionRowColumn(customTotalSection, customTotalSectionTotalRow, column),
		);
	}
	calculateComputedRowComparisonMap(customTotalComputedSectionTotalRow);
}

const colW = {
	controls: 60,
	header: 280,
	result: 120,
};

defineExpose({
	resultColumns,
	resultSections,
	flipResults,
	addResultsColumn,
	recalculateAllColumns,
	addResultsSection,
	expandedSections,
	customTotalRows,
	computedCustomTotalRows,
	recomputeCustomTotalRow,
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
						v-for="(column) in resultColumns"
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
											:key="GameAbilityId.stringify(ability.id)"
											:value="`${optionIndex}-${abilityIndex}`"
											:disabled="enableUnimplementedUi ? undefined : !(ability.id.type !== ABILITY_TYPE.champion || ability.id.abilityKey === 'passive')"
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
										&& !damageSectionOptions.some(option => option.type !== ABILITY_TYPE.champion || option.abilities.some(ability => (ability.id as IChampionAbilityId).abilityKey === 'passive'))"
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
									:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
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
									:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
									width="256"
									height="256"
									style="--focus-brightness: 1.5"
									aria-hidden="true"
								>
							</VSelect>
							<button v-if="index === resultColumns.length - 1" class="pretend-ui-btn" @click="addResultsColumn()">
								add column
							</button>
							<template v-else>
								<button
									title="move left, alt+click to duplicate to the left"
									class="pretend-ui-btn"
									:disabled="index === 0"
									draggable="true"
									@click="moveResultColumn(index, index + (globalKeyModifiers.alt ? 0 : -1), globalKeyModifiers.alt)"
									@dragstart="startResultColumnDrag(index, $event)"
									@dragend="endResultColumnDrag"
								>
									<span>move left, alt+click to duplicate to the left</span>
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
									title="move right, alt+click to duplicate to the right"
									class="pretend-ui-btn"
									draggable="true"
									@click="moveResultColumn(index, index + 1, globalKeyModifiers.alt)"
									@dragstart="startResultColumnDrag(index, $event)"
									@dragend="endResultColumnDrag"
								>
									<span>move right, alt+click to duplicate to the right</span>
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
								@click="moveResultSection(index, index - 1)"
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
								@click="moveResultSection(index, index + 1)"
								@dragstart="startResultSectionDrag($event, index)"
								@dragend="endResultSectionDrag"
							>
								<span>move down</span>
								<Icon class="i-ph:arrow-down" />
							</button>
							<button
								class="pretend-ui-btn remove"
								:title="section.isCustomTotal ? 'clear' : 'remove'"
								:disabled="section.isCustomTotal ? !customTotalRows.length : section.isPermanent"
								@click="removeResultsSection(index)"
							>
								<span>{{ section.isCustomTotal ? 'clear' : 'remove' }}</span>
								<Icon :class="section.isCustomTotal ? 'i-ph:eraser' : 'i-ph:trash'" />
							</button>
							<button
								:title="expandedSections.includes(section.id) ? 'collapse' : 'expand'"
								class="pretend-ui-btn"
								:aria-expanded="expandedSections.includes(section.id)"
								:aria-controls="`results-table-section-body-${section.id}`"
								@click="toggleResultsSection(section.id)"
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
							<div @mouseenter="implementedDamageSectionsMap[index] && section.hoverTooltipData && showSectionHoverTooltip($event, section.abilityId.type)">
								<img
									:src="section.image"
									:width="section.imageSize"
									:height="section.imageSize"
									aria-hidden="true"
								>
								<span v-html="section.image ? section.name : 'loading...'" />
								<template v-if="implementedDamageSectionsMap[index] && section.hoverTooltipData">
									<div v-if="section.abilityId.type === 'item'" popover="hint" class="hover-tooltip champion-item">
										<LolItemDescription v-bind="section.hoverTooltipData as any" hover-tooltip source="Inventory" />
									</div>
									<LolChampionAbilityHoverTooltip
										v-else-if="section.abilityId.type === 'champion'"
										v-bind="section.hoverTooltipData as any"
									/>
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
						<td v-if="!section.isCustomTotal && section.id !== STATS_SECTION_ID">
							<label>
								<span>include in custom total</span>
								<input
									v-model="customTotalRows"
									type="checkbox"
									:value="`${section.id}_${row.id}`"
									@update:model-value="onCustomTotalRowsChange"
								>
							</label>
						</td>
						<th
							scope="row"
							:colspan="section.isCustomTotal || section.id === STATS_SECTION_ID ? 2 : undefined"
							headers="results-table-header-damage-type"
						>
							<img
								v-if="row.image"
								:src="row.image.src"
								:width="row.image.width"
								:height="row.image.height"
								aria-hidden="true"
							>
							<span v-if="row.isUnknown">unknown</span>
							{{ row.name }}
						</th>
						<td
							v-for="(cell, cellIndex) in sectionRowCells(section, row)"
							:key="cell.key"
							:class="[{
								unknown: cell.computedColumn.isUnknown,
								irrelevant: cell.computedColumn.isIrrelevant,
								highlighted: highlightedColumns[cellIndex],
							}, highlightedColumnId && cell.computedColumn.comparisonMap[highlightedColumnId]]"
							:style="columnDamageSourceColors[cellIndex]"
							:data-drop-direction="columnDragDropIndex === cellIndex ? 'before' : columnDragDropIndex === cellIndex + 1 ? 'after' : undefined"
							@mouseenter="highlightColumnIdSources(cell.computedColumn.columnId)"
							@mouseleave="lowlightColumnIdSources(cell.computedColumn.columnId)"
							@dragenter="onResultColumnDragenter($event, cellIndex)"
							@dragover="onResultColumnDragover($event, cellIndex)"
							@dragleave="onResultColumnDragleave"
							@drop="onResultColumnDrop($event, cellIndex)"
						>
							<span>{{ cell.computedColumn.value }}</span>
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
										:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
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
										:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
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
		--bg-clr: theme('colors.neutral.950');
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
							--at-apply: 'w-64 px-2';

							&:disabled {
								--at-apply: 'text-neutral-400';
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
						}
					}
				}

				&:not(:last-child) > div {
					> button {
						--at-apply: 'grid place-items-center self-center';

						&:nth-of-type(-n + 3):not(:last-child) {
							--at-apply: 'size-[--control-btn-size]';

							> span:nth-child(2) {
								--at-apply: 'size-5';
							}
						}

						&:nth-of-type(1) {
							--at-apply: 'justify-self-end';
							grid-area: move-left;
						}

						&:nth-of-type(2) {
							grid-area: remove;
						}

						&:nth-of-type(3) {
							--at-apply: 'justify-self-start';
							grid-area: move-right;
						}

						&:nth-of-type(4) {
							--at-apply: 'absolute inset-0 h-full grid place-items-center text-center text-xl font-600 backdrop-blur-2 z-10 tracking-wide focus-visible:outline-none bg-black/20';
							-webkit-text-stroke: black 0.15em;
							paint-order: stroke fill;

							&::before {
								--at-apply: 'content-empty absolute top-1/2 start-1/2 translate-center outline-auto h-7 w-[4.5em]';
							}
						}

						> span:nth-child(1) {
							--at-apply: 'sr-only';
						}
					}
				}

				&:last-child > div {
					> button:first-of-type {
						--at-apply: 'w-auto px-1 justify-self-center h-[--control-btn-size] leading-5';
						grid-area: 1 / 1 / 2 / 4;
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

						> button {
							--at-apply: 'size-6 grid place-items-center';

							> span {
								--at-apply: 'size-5';
							}

							> span:nth-child(1) {
								--at-apply: 'sr-only';
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
							inset-block-end: calc(anchor(start) - 1px);
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
							&.higher {
								--at-apply: 'text-green-400';

								> span::after {
									content: '▲';
								}
							}

							&.lower {
								--at-apply: 'text-red-400';

								> span::after {
									content: '▼';
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

						&[colspan] {
							--at-apply: 'ps-[calc(var(--table-ps)+var(--ps))]';
						}

						> img {
							--at-apply: 'inline-block size-[--size] align-middle -ms-[--ms] me-[calc(0.5*var(--size))]';
							--size: calc(5 * var(--spacing));
							--ms: calc(0.5 * (var(--ps) + var(--size)));
						}

						> span {
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
								--at-apply: 'absolute text-xs top-1/2 -translate-y-1/2 -end-4';
							}
						}
					}

					&:nth-child(even) {
						--at-apply: 'bg-white/05';
					}
				}
			}
		}

		> thead > tr:nth-child(2) > td:nth-child(n + 2).highlighted,
		> tbody[aria-labelledby] > tr > td.highlighted {
			background-image: linear-gradient(
				to right,
				oklch(from var(--source-clr, var(--col-damage-source-clr, white)) l c h / 0.12),
				oklch(from var(--target-clr, var(--col-damage-target-clr, white)) l c h / 0.12)
			);
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
