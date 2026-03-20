<script setup lang="ts">
import type { WatchHandle } from 'vue';
import type { IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';

const props = defineProps<{
	damageSources: DamageSource[];
	damageTargets: DamageSource[];
	showResults: boolean;
}>();

const resultColumns = defineModel<IDamageResultTableColumn[]>('columns', { required: true });
const resultSections = defineModel<IDamageResultTableSection[]>('sections', { required: true });

const globalKeyModifiers = useGlobalKeyModifiers();
const highlightedDamageSources = useHighlightedDamageSources();
const { version, minorVersion } = usePatchVersion();

const highlightedColumnId = ref<string>();

const columnNewSourceId = ref<string>();
const columnNewTargetId = ref<string>();
const columnNewSource = computed(() => columnNewSourceId.value ? props.damageSources.find(source => source.id === columnNewSourceId.value) : undefined);
const columnNewTarget = computed(() => columnNewTargetId.value ? props.damageTargets.find(source => source.id === columnNewTargetId.value) : undefined);

function columnOptions(from: DamageSource[]): [string, string][] {
	return from
		.filter(source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id))
		.map((source, i) => [source.id, `(${i + 1}) ${source.listedChampion.value?.name!}`]);
}
const sourceOptions = computed(() => columnOptions(props.damageSources));
const targetOptions = computed(() => columnOptions(props.damageTargets));

function setColumnChampion(column: IDamageResultTableColumn, damageSources: DamageSource[], championId?: string) {
	const oldDamageSourceId = column[damageSources === props.damageSources ? 'source' : 'target']?.id;
	oldDamageSourceId && highlightedDamageSources.remove(oldDamageSourceId);

	column[damageSources === props.damageSources ? 'source' : 'target'] = championId
		? damageSources.find(damageSource => damageSource.id === championId)
		: undefined;
	recalculateColumn(column);

	highlightedDamageSources.add(column[damageSources === props.damageSources ? 'source' : 'target']!.id);
}

const damageSectionOptions = computed(() => props.damageSources
	.filter(source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id))
	.map((source) => {
		const championId = source.champion.value!.id;
		let abilityEntries = Object.entries(source.champion.value!.abilities);

		if (championId === 'Aphelios') {
			abilityEntries = abilityEntries.filter(([abilityKey]) => abilityKey === 'q' || abilityKey === 'r');
		}

		return {
			championId,
			championName: source.champion.value!.name,
			abilities: abilityEntries
				.map(([abilityKey, ability]) => {
					const abilityVariant = ability.variants[source.abilityVariants.value[abilityKey as IChampionAbilityKey]]!;
					const { replaced: nameReplaced } = replaceGameDescriptionStringtableVariables(
						abilityVariant.name,
						source.champion.value!.stringtable,
					);

					return {
						id: `${source.champion.value!.id}-${abilityKey}`,
						championId: source.champion.value!.id,
						abilityKey: abilityKey as IChampionAbilityKey,
						image: abilityVariant.image,
						name: `${source.champion.value!.name} ${abilityKey === 'passive' ? abilityKey : abilityKey.toUpperCase()} - ${nameReplaced}`,
					};
				})
				.filter(source => !resultSections.value.some(section => section.id === source.id)),
		};
	})
	.filter(option => option.abilities.length),
);

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
	irrelevant?: boolean;
	numberValue?: number;
	value: string | number;
	comparisonMap: Record<string, 'higher' | 'lower'>;
}

const computedResults = ref(new Map<string, IComputedSection>(resultSections.value.map(section => [section.id, computeSection(section)] as [string, IComputedSection])));

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

function computeSectionRowColumn(section: IDamageResultTableSection, row: IDamageResultTableSection['rows'][number], column: IDamageResultTableColumn): IComputedSectionRowColumn {
	const rv: IComputedSectionRowColumn = {
		columnId: column.id,
		irrelevant: true,
		value: '-',
		comparisonMap: {},
	};

	if (!column.source?.listedChampion.value) {
		rv.value = '-';
	} else if (column.source.listedChampion.value.id !== column.source.champion.value?.id) {
		rv.value = 'loading...';
	} else if (
		(section.championId !== 'all' && column.source.champion.value?.id !== section.championId)
		|| (column.source.champion.value?.id === 'Zeri' && section.id === 'basicAttack')
	) {
		rv.value = 'n/a';
	} else {
		if (section.getCellValue) {
			({ value: rv.value, numberValue: rv.numberValue } = section.getCellValue(row.id, column.source, column.target));
		} else {
			rv.value = Math.round(Math.random() * 500);
			rv.numberValue = rv.value;
		}
		rv.irrelevant = false;
	}

	return rv;
}

function addResultsColumn() {
	const column: IDamageResultTableColumn = {
		id: crypto.randomUUID(),
		source: props.damageSources.find(damageSource => damageSource.id === columnNewSourceId.value!),
		target: props.damageTargets.find(damageSource => damageSource.id === columnNewTargetId.value),
	};
	resultColumns.value.push(column);
	columnNewSourceId.value = undefined;
	columnNewTargetId.value = undefined;
	addComputedColumn(column);
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

function removeResultsColumn(index: number) {
	const [column] = resultColumns.value.splice(index, 1);

	for (const section of computedResults.value.values()) {
		for (const row of section.rows.values()) {
			row.columns.delete(column!.id);
		}
	}
}

const expandedSections = ref<string[]>(resultSections.value.filter(section => section.id !== 'stats').map(section => section.id));

function toggleResultsSection(sectionId: string) {
	const index = expandedSections.value.indexOf(sectionId);
	if (~index) {
		expandedSections.value.splice(index, 1);
	} else {
		expandedSections.value.push(sectionId);
	}
}

async function addResultsSection(event: SubmitEvent) {
	const [rawOptionIndex, rawAbilityIndex] = (new FormData(event.target as HTMLFormElement).get('sectionOptionIndex')! as string).split('-');

	const option = damageSectionOptions.value[Number.parseInt(rawOptionIndex!)]!;
	const ability = option.abilities[Number.parseInt(rawAbilityIndex!)]!;
	const champion = await useChampion(option.championId);

	const section: IDamageResultTableSection = {
		id: ability.id,
		championId: option.championId,
		name: ability.name,
		icon: ability.image,
		rows: abilityVariantListedVariables(champion, ability.abilityKey, 0).map(variable => ({ name: variable, id: variable })),
	};

	resultSections.value.push(section);
	expandedSections.value.push(section.id);
	addComputedSection(section.id);
	(event.target as HTMLFormElement).reset();
}

function removeDamageSection(index: number) {
	const [section] = resultSections.value.splice(index, 1);
	computedResults.value.delete(section!.id);
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
			key: `${section.id}-${row.id}-${column.id || 'new'}`,
			computedColumn: computedResults.value.get(section.id)!.rows.get(row.id)!.columns.get(column!.id)!,
		};
	});
}

function columnDamageSourcesColorStyles(column: IDamageResultTableColumn) {
	return {
		'--col-damage-source-clr': column.source?.color,
		'--col-damage-target-clr': column.target?.color,
	};
}

const columnDamageSourceColors = computed(() => resultColumns.value.map(column => columnDamageSourcesColorStyles(column)));

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
}

const cleanableColumnsSections = computed<[
	[index: number, column: IDamageResultTableColumn][],
	[index: number, section: IDamageResultTableSection][],
]>(() => {
	const columns = (resultColumns.value
		.map((column, index) => [index, column]) as [number, IDamageResultTableColumn][])
		.filter(([, column]) => !column.source && !column.target);

	const sections = (resultSections.value
		.map((section, index) => [index, section]) as [number, IDamageResultTableSection][])
		.filter(([,section]) => section.championId !== 'all' && !resultColumns.value.some(column =>
			column.source?.listedChampion.value?.id === section.championId || column.target?.listedChampion.value?.id === section.championId,
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
		([columnDragDropIndex.value] = getDropTargetIndex(event, index, columnDraggedFromIndex, resultColumns.value.length, false));
	}
}

function onResultColumnDragover(event: DragEvent, index: number) {
	if (columnDraggedFromIndex !== undefined) {
		([columnDragDropIndex.value] = getDropTargetIndex(event, index, columnDraggedFromIndex, resultColumns.value.length, false));
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

	const [toIndex, fromIndex] = getDropTargetIndex(event, index, columnDraggedFromIndex, resultColumns.value.length, false);
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
}

function getDropTargetIndex(
	event: DragEvent,
	index: number,
	fromIndex: number | undefined,
	itemsLength: number,
	isVertical: boolean,
	combinedSiblingIsNext?: boolean,
): [toIndex: number | undefined, fromIndex: number | undefined] {
	if (fromIndex === undefined || fromIndex === index) {
		return [undefined, undefined];
	}

	let toIndex;
	if (index === itemsLength) {
		toIndex = fromIndex === (itemsLength - 1) ? undefined : itemsLength;
	} else if (index === fromIndex - 1) {
		toIndex = index;
	} else if (index === fromIndex + 1) {
		toIndex = index + 1;
	} else {
		const el = event.currentTarget as HTMLElement;
		const rect = combinedSiblingIsNext !== undefined ? combinedSiblingsRect(el, combinedSiblingIsNext) : el.getBoundingClientRect();
		const rectSize = rect[isVertical ? 'height' : 'width'];
		const posInEl = event[isVertical ? 'clientY' : 'clientX'] - rect[isVertical ? 'top' : 'left'];

		const midpoint = rectSize / 2;
		// console.log({ posInEl, rectSize, midpoint }, rectangleLike, posInEl < midpoint ? 'before' : 'after', el);

		toIndex = posInEl < midpoint ? index : index + 1;
	}

	return [toIndex, fromIndex];
}

function moveResultSection(fromIndex: number, toIndex: number) {
	const [section] = resultSections.value.splice(fromIndex, 1);
	resultSections.value.splice(toIndex, 0, section!);
}

const sectionDragDropIndex = ref<number>();
let sectionDraggedFromIndex: number | undefined;

function startResultSectionDrag(event: DragEvent, index: number) {
	event.dataTransfer!.effectAllowed = 'move';
	sectionDraggedFromIndex = index;

	const el = (event.target as HTMLElement).closest('tr')!;
	event.dataTransfer!.setDragImage(el, 0, 0);
}

function onResultSectionDragenter(event: DragEvent, index: number, isHeader: boolean) {
	if (sectionDraggedFromIndex !== undefined) {
		([sectionDragDropIndex.value] = getDropTargetIndex(event, index, sectionDraggedFromIndex, resultSections.value.length, true, isHeader));
	}
}

function onResultSectionDragover(event: DragEvent, index: number, isHeader: boolean) {
	if (sectionDraggedFromIndex !== undefined) {
		([sectionDragDropIndex.value] = getDropTargetIndex(event, index, sectionDraggedFromIndex, resultSections.value.length, true, isHeader));
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

function onResultSectionDrop(event: DragEvent, index: number, isHeader: boolean) {
	sectionDragDropIndex.value = undefined;
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
</script>

<template>
	<table
		id="results-table"
		:inert="!showResults"
		:aria-busy="resultColumns.some(column => column.source?.listedChampion.value && column.source.listedChampion.value.id !== column.source.champion.value?.id)"
	>
		<caption>
			comparison table
			<button
				class="pretend-ui-button"
				:disabled="!cleanableColumnsSections[0].length && !cleanableColumnsSections[1].length"
				@click="cleanupUnused"
			>
				remove unused
			</button>
			<span>
				Columns, except the first and last, contain the corresponding damage source's (left) value applied (if applicable) vs the specified damage target (right, can be empty)
			</span>
		</caption>
		<thead>
			<tr>
				<th width="48px" scope="col">
					<span>section controls</span>
				</th>
				<th id="results-table-header-damage-type" scope="col" width="240px">
					<span>damage type</span>
				</th>
				<th
					v-for="(column) in resultColumns"
					:key="column.id"
					scope="col"
					width="120px"
				>
					<span>
						{{ column.source && sourceOptions.find(option => option[0] === column.source!.id)?.[1] || 'undefined source' }}
						vs
						{{ column.target && targetOptions.find(option => option[0] === column.target!.id)?.[1] || 'undefined target' }}
					</span>
				</th>
				<td
					width="120px"
					rowspan="2"
					:data-drop-direction="columnDragDropIndex === resultColumns.length ? 'before' : undefined"
					@dragenter="onResultColumnDragenter($event, resultColumns.length)"
					@dragover="onResultColumnDragover($event, resultColumns.length)"
					@dragleave="onResultColumnDragleave"
					@drop="onResultColumnDrop($event, resultColumns.length)"
				>
					<span>configure new column</span>
					<form @submit.prevent="addResultsColumn">
						<VSelect
							id="results-table-column-source"
							v-model="columnNewSourceId"
							label="column's damage source"
							:options="sourceOptions"
							required
						>
							<img
								v-if="columnNewSource"
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${columnNewSource.listedChampion.value!.image}`"
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
						</VSelect>
						<span>vs</span>
						<VSelect
							id="results-table-column-target"
							v-model="columnNewTargetId"
							label="column's damage target"
							:options="targetOptions"
							clearable
						>
							<img
								v-if="columnNewTarget"
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${columnNewTarget.listedChampion.value!.image}`"
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
						</VSelect>
						<button class="pretend-ui-button" type="submit">
							add
						</button>
					</form>
				</td>
			</tr>
			<tr>
				<td width="240px" colspan="2">
					<span aria-hidden="true">damage type</span>
					<a href="#results-table-section-header-basicAttack" class="skip-link">
						skip column controls
					</a>
				</td>
				<td
					v-for="(column, index) in resultColumns"
					:key="column.id"
					width="120px"
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
							required
							:style="resultColumns[index]!.source ? `--damage-source-clr: ${resultColumns[index]!.source.color}` : undefined"
							@update:model-value="setColumnChampion(column, damageSources, $event)"
						>
							<img
								v-if="column.source"
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${column.source.listedChampion.value!.image}`"
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
						</VSelect>
						<span>vs</span>
						<VSelect
							:id="`results-table-column-target-${index}`"
							:model-value="resultColumns[index]!.target?.id"
							label="column's damage target"
							:options="targetOptions"
							clearable
							:style="resultColumns[index]!.target ? `--damage-source-clr: ${resultColumns[index]!.target.color}` : undefined"
							@update:model-value="setColumnChampion(column, damageTargets, $event)"
						>
							<img
								v-if="column.target"
								:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${column.target.listedChampion.value!.image}`"
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
						</VSelect>
						<button
							title="move left, alt+click to duplicate to the left"
							class="pretend-ui-button"
							:disabled="index === 0"
							draggable="true"
							@click="moveResultColumn(index, index + (globalKeyModifiers.alt ? 0 : -1), globalKeyModifiers.alt)"
							@dragstart="startResultColumnDrag(index, $event)"
						>
							<span>move left, alt+click to duplicate to the left</span>
							<Icon class="i-ph:arrow-left" />
						</button>
						<button
							title="remove"
							class="pretend-ui-button"
							@click="removeResultsColumn(index)"
						>
							<span>
								remove
							</span>
							<Icon class="i-ph:trash" />
						</button>
						<button
							title="move right, alt+click to duplicate to the right"
							class="pretend-ui-button"
							draggable="true"
							:disabled="index === (resultColumns.length - 1)"
							@click="moveResultColumn(index, index + 1, globalKeyModifiers.alt)"
							@dragstart="startResultColumnDrag(index, $event)"
						>
							<span>move right, alt+click to duplicate to the right</span>
							<Icon class="i-ph:arrow-right" />
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
				@dragenter="onResultSectionDragenter($event, index, true)"
				@dragover="onResultSectionDragover($event, index, true)"
				@dragleave="onResultSectionDragleave"
				@drop="onResultSectionDrop($event, index, true)"
			>
				<tr>
					<td :headers="`results-table-section-header-${section.id}`">
						<button
							title="move up"
							class="pretend-ui-button"
							:disabled="index === 0"
							draggable="true"
							@click="moveResultSection(index, index - 1)"
							@dragstart="startResultSectionDrag($event, index)"
						>
							<span>move up</span>
							<Icon class="i-ph:arrow-up" />
						</button>
						<button
							title="move down"
							class="pretend-ui-button"
							draggable="true"
							:disabled="index === (resultSections.length - 1)"
							@click="moveResultSection(index, index + 1)"
							@dragstart="startResultSectionDrag($event, index)"
						>
							<span>move down</span>
							<Icon class="i-ph:arrow-down" />
						</button>
						<button
							title="remove"
							class="pretend-ui-button"
							:disabled="section.permanent"
							@click="removeDamageSection(index)"
						>
							<span>
								remove
							</span>
							<Icon class="i-ph:trash" />
						</button>
						<button
							:title="expandedSections.includes(section.id) ? 'collapse' : 'expand'"
							class="pretend-ui-button"
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
						:colspan="resultColumns.length + 2"
					>
						<div>
							<img
								:src="`https://raw.communitydragon.org/${minorVersion}/game/${section.icon}`"
								width="64"
								height="64"
								aria-hidden="true"
							>
							{{ section.name }}
						</div>
					</th>
				</tr>
			</tbody>
			<tbody
				:id="`results-table-section-body-${section.id}`"
				:aria-labelledby="`results-table-section-header-${section.id}`"
				:hidden="!expandedSections.includes(section.id)"
				:data-drop-direction="sectionDragDropIndex === index + 1 ? 'after' : undefined"
				@dragenter="onResultSectionDragenter($event, index, false)"
				@dragover="onResultSectionDragover($event, index, false)"
				@dragleave="onResultSectionDragleave"
				@drop="onResultSectionDrop($event, index, false)"
			>
				<tr v-for="row in section.rows" :key="`${section.id}-${row.id}`">
					<th :id="`results-table-section-row-${section.id}-${row.id}`" scope="row" colspan="2" headers="results-table-header-damage-type">
						<img
							v-if="row.icon"
							:src="`https://raw.communitydragon.org/${minorVersion}/${row.icon.path}`"
							:width="row.icon.width"
							:height="row.icon.height"
							aria-hidden="true"
						>
						{{ row.name }}
					</th>
					<td
						v-for="(cell, cellIndex) in sectionRowCells(section, row)"
						:key="cell.key"
						:class="[{
							irrelevant: cell.computedColumn.irrelevant,
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
					<td
						:data-drop-direction="columnDragDropIndex === resultColumns.length ? 'before' : undefined"
						@dragenter="onResultColumnDragenter($event, resultColumns.length)"
						@dragover="onResultColumnDragover($event, resultColumns.length)"
						@dragleave="onResultColumnDragleave"
						@drop="onResultColumnDrop($event, resultColumns.length)"
					>
						-
					</td>
				</tr>
			</tbody>
		</template>
		<tfoot
			v-show="damageSectionOptions.length"
			:data-drop-direction="sectionDragDropIndex === resultSections.length ? 'before' : undefined"
		>
			<tr>
				<td :colspan="resultColumns.length + 2">
					<form @submit.prevent="addResultsSection">
						<label for="results-table-row-new-section-ability"> section ability </label>
						<select
							id="results-table-row-new-section-ability"
							name="sectionOptionIndex"
							required
						>
							<optgroup v-for="(option, optionIndex) in damageSectionOptions" :key="option.championId" :label="option.championName">
								<option v-for="(ability, abilityIndex) in option.abilities" :key="ability.id" :value="`${optionIndex}-${abilityIndex}`">
									{{ ability.name }}
								</option>
							</optgroup>
						</select>
						<button class="pretend-ui-button" type="submit">
							add
						</button>
					</form>
					<a href="#results-table-skip-rows" class="skip-link">
						skip back to column headers
					</a>
				</td>
			</tr>
		</tfoot>
	</table>
</template>

<style>
@layer components {
	#results-table {
		--at-apply: 'mx-auto border-separate border-spacing-0 bg-[--bg-clr]';
		--bg-clr: theme('colors.neutral.950');
		--control-button-size: calc(6 * var(--spacing));
		--header-row-h: calc(22 * var(--spacing));
		--section-header-row-py: calc(1 * var(--spacing));
		--section-body-pb: 0px;
		/* --section-header-row-h: calc( */
		/* 	2 * var(--control-button-size) + var(--section-header-row-pt) + var(--section-header-row-pb) */
		/* ); */

		&[inert] {
			--at-apply: 'blur-3';
		}

		> caption {
			--at-apply: 'text-start text-lg';

			> button {
				--at-apply: 'px-1 leading-5 h-[--control-button-size] float-end text-base';
			}

			> span {
				--at-apply: 'block text-neutral-300 text-base';
			}
		}

		th {
			--at-apply: 'text-start font-normal';
		}

		> thead {
			--at-apply: 'sticky top-0 z-5';

			> tr:nth-child(1) {
				> th > * {
					--at-apply: 'sr-only';
				}

				> td > span:first-child {
					--at-apply: 'sr-only';
				}
			}

			> tr:nth-child(2) > td:first-child {
				--at-apply: 'align-bottom text-start ps-3';
			}

			> tr:nth-child(1) > td,
			> tr:nth-child(2) > * {
				--at-apply: 'pb-3 bg-[--bg-clr]';

				&[data-drop-direction]::after {
					--at-apply: 'content-empty absolute z-3 start-0.25 top-0 translate-y-[--control-button-size] size-4 rotate-270 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}

				&[data-drop-direction='after']::after {
					--at-apply: 'end-0.25 start-auto rotate-90';
				}

				> form,
				> div {
					--at-apply: 'grid grid-rows-[auto_1fr] gap-y-3 relative grid-cols-[1fr_var(--control-button-size)_1fr]';
					--select-size: calc(10 * var(--spacing));
					grid-template-areas:
						'move-left remove move-right'
						'source vs target';

					> .v-select {
						--at-apply: 'size-[--select-size]';
						--b-width: 2px;

						&[style] {
							--b-width: 2.5px;
						}

						&:nth-of-type(1) {
							--at-apply: 'ms-auto';
							grid-area: source;
						}

						&:nth-of-type(2) {
							grid-area: target;
						}

						> select {
							--at-apply: 'rounded-1/2 size-full';
						}

						> label {
							--at-apply: 'rounded-1/2 size-full of-hidden bg-[--placeholder-champion-bg-clr] b-[length:--b-width] b-[--damage-source-clr,var(--ui-button-border-clr)]';

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
					}

					> span {
						--at-apply: 'pointer-events-none text-center self-center text-lg font-semibold z-1';
						-webkit-text-stroke: black 0.15em;
						paint-order: stroke fill;
						grid-area: vs;
					}

					> button {
						--at-apply: 'size-[--control-button-size]';

						> span:nth-child(2) {
							--at-apply: 'size-5';
						}
					}
				}

				> div {
					> button {
						--at-apply: 'grid place-items-center self-center';

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

						> span:nth-child(1) {
							--at-apply: 'sr-only';
						}
					}
				}

				> form {
					> button {
						--at-apply: 'w-auto px-1 justify-self-center leading-5';
						grid-area: 1 / 1 / 2 / 4;
					}
				}
			}
		}

		> tbody {
			&:not([aria-labelledby]) {
				--at-apply: 'sticky top-[--header-row-h] z-4 bg-[--bg-clr]';

				> tr {
					> td {
						--at-apply: 'grid grid-flow-col grid-cols-2 grid-rows-2';

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
						}
					}

					> * {
						--at-apply: 'py-[--section-header-row-py]';
					}

					> th > div {
						--at-apply: 'text-lg font-medium whitespace-nowrap w-max';

						> img {
							--at-apply: 'size-6 ms-2 me-1 inline-block';
						}
					}
				}
			}

			&:not(:first-of-type):not([aria-labelledby]) {
				--at-apply: 'top-[--header-row-h]';
			}

			&[aria-labelledby] {
				--at-apply: 'text-neutral-200';

				> tr {
					&:hover {
						> * {
							--at-apply: 'b-[--ui-button-border-clr]';
						}

						> th,
						> td:not(.irrelevant, :last-child) {
							--at-apply: 'text-white';
						}

						> td:not(.irrelevant, :last-child) {
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

					> * {
						--at-apply: 'py-1 b-y b-transparent';
					}

					> th {
						--at-apply: 'ps-[--ps]';
						--ps: calc(2 * var(--control-button-size));

						> img {
							--at-apply: 'inline-block size-[--size] align-middle -ms-[--ms] me-[calc(0.5*var(--size))]';
							--size: calc(5 * var(--spacing));
							--ms: calc(0.5 * (var(--ps) + var(--size)));
						}
					}

					> td {
						--at-apply: 'px-3';

						&:is(.irrelevant, :last-child) {
							--at-apply: 'text-neutral-500';
						}

						&:not(.irrelevant, :last-child) > span {
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
		> tbody[aria-labelledby] > tr > td:not(:last-child).highlighted {
			background-image: linear-gradient(
				to right,
				oklch(from var(--col-damage-source-clr, white) l c h / 0.1),
				oklch(from var(--col-damage-target-clr, white) l c h / 0.1)
			);
		}

		> thead > tr:nth-child(1) > td,
		> thead > tr:nth-child(2) > td,
		> tbody[aria-labelledby] > tr > td,
		> tbody[aria-labelledby] {
			--at-apply: 'relative isolate';
		}

		> thead > tr:nth-child(1) > td,
		> thead > tr:nth-child(2) > td,
		> tbody[aria-labelledby] > tr > td,
		> :where(thead, tbody, tfoot) {
			&[data-drop-direction] {
				--drop-indicator-bg-direction: 90deg;

				&::before {
					--at-apply: 'content-empty absolute z-3 inset-0 -inset-y-px';
					background-image: linear-gradient(
						var(--drop-indicator-bg-direction),
						hsl(0 100% 100%) 0px,
						hsl(0 100% 100%) 0.5px,
						hsl(0 100% 100% / 0.2) 0.5px,
						transparent 1rem
					);
				}
			}

			&[data-drop-direction='after'] {
				--drop-indicator-bg-direction: 270deg;
			}
		}

		> tfoot {
			> tr > td > form {
				--at-apply: 'grid grid-cols-[auto_1fr] auto-rows-min gap-x-2';

				> label {
					--at-apply: 'col-span-full text-start text-lg';
				}

				> select {
					--at-apply: 'w-64';
				}

				> button {
					--at-apply: 'w-fit px-1 h-6 whitespace-nowrap';
				}
			}
		}
	}
}

@layer overrides {
	#results-table {
		> thead,
		> tbody,
		> tfoot {
			&[data-drop-direction] {
				--drop-indicator-bg-direction: 180deg;

				&::before {
					--at-apply: 'inset-y-0';
				}

				&::after {
					--at-apply: 'content-empty absolute z-3 start-1/2 top-0.5 -translate-x-1/2 size-4 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}
			}

			&[data-drop-direction='after'] {
				--drop-indicator-bg-direction: 0deg;

				&::after {
					--at-apply: 'bottom-0.5 top-auto rotate-180';
				}
			}
		}
	}
}
</style>
