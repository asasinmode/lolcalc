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

const { version, minorVersion } = usePatchVersion();

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

const damageSectionOptions = computed(() => props.damageSources
	.filter(source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id))
	.flatMap(source => Object.entries(source.champion.value!.abilities).map(([abilityKey, ability]) => {
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
	}))
	.filter(source => !resultSections.value.some(section => section.id === source.id)),
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
}

const computedResults = ref(new Map<string, IComputedSection>(resultSections.value.map(section => [section.id, computeSection(section)] as [string, IComputedSection])));

function addComputedSection(sectionId: string) {
	computedResults.value.set(sectionId, computeSection(resultSections.value.find(section => section.id === sectionId)!));
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
		rv.value = Math.round(Math.random() * 500);
		rv.numberValue = rv.value;
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

async function addResultsSection(event: SubmitEvent) {
	const rawSectionIndex = new FormData(event.target as HTMLFormElement).get('sectionOptionIndex');

	const option = damageSectionOptions.value[Number.parseInt(rawSectionIndex as string)]!;
	const champion = await useChampion(option.championId);

	const section: IDamageResultTableSection = {
		id: option.id,
		championId: champion.id,
		name: option.name,
		image: option.image,
		rows: abilityVariantListedVariables(champion, option.abilityKey, 0).map(variable => ({ name: variable, id: variable })),
	};

	resultSections.value.push(section);
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
				// TODO update values
			}
		}
	}

	for (const id of addedIds) {
		const source = (target.find(damageSource => damageSource.id === id))!;
		damageSourceWatchers.set(source.id, watch(source.getWatchable(), () => {
			console.log('TODO', source.id, source.champion.value?.id);
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
			computedRow: computedResults.value.get(section.id)!.rows.get(row.id)!.columns.get(column!.id)!,
		};
	});
}
</script>

<template>
	<table id="calculator-results-table" :inert="!showResults">
		<caption>
			comparison table
		</caption>
		<thead>
			<tr>
				<th scope="col" width="240px">
					damage type
				</th>
				<th v-for="(column, index) in resultColumns" :key="column.id" width="100px">
					<div>
						<VSelect
							:id="`results-table-column-source-${index}`"
							:model-value="resultColumns[index]!.source?.id"
							label="column's damage source"
							:options="sourceOptions"
							required
							@update:model-value="resultColumns[index]!.source = damageSources.find(damageSource => damageSource.id === $event)!"
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
						vs
						<VSelect
							:id="`results-table-column-target-${index}`"
							:model-value="resultColumns[index]!.target?.id"
							label="column's damage target"
							:options="targetOptions"
							clearable
							@update:model-value="resultColumns[index]!.target = damageTargets.find(damageSource => damageSource.id === $event)!"
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
						<button class="pretend-ui-button" @click="removeResultsColumn(index)">
							remove
						</button>
					</div>
				</th>
				<td width="100px">
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
						vs
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
		</thead>
		<tbody v-for="(section, index) in resultSections" :key="section.id">
			<tr>
				<th scope="rowgroup" :colspan="resultColumns.length + 2">
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/game/${section.image}`"
						width="64"
						height="64"
						aria-hidden="true"
					>
					{{ section.name }}
					<button v-if="section.id !== 'basicAttack'" class="pretend-ui-button" @click="removeDamageSection(index)">
						remove
					</button>
				</th>
			</tr>
			<tr v-for="row in section.rows" :key="`${section.id}-${row.id}`">
				<th scope="row">
					{{ row.name }}
				</th>
				<td v-for="cell in sectionRowCells(section, row)" :key="cell.key" :class="{ irrelevant: cell.computedRow.irrelevant }">
					{{ cell.computedRow.value }}
				</td>
				<td>
					-
				</td>
			</tr>
		</tbody>
		<tfoot v-show="damageSectionOptions.length">
			<tr>
				<th scope="rowgroup" :colspan="resultColumns.length + 2">
					<form @submit.prevent="addResultsSection">
						<span> add results section </span>
						<VSelect
							id="results-table-row-section"
							label="section ability"
							name="sectionOptionIndex"
							:options="damageSectionOptions.map((option, index) => [index, option.name])"
							required
						/>
						<button class="pretend-ui-button" type="submit">
							add
						</button>
					</form>
				</th>
			</tr>
		</tfoot>
	</table>
</template>

<style>
@layer components {
	#calculator-results {
		--at-apply: 'of-x-auto';
	}

	#calculator-results-table {
		--at-apply: 'mx-auto border-spacing-0 border-collapse b b-[--border-color]';
		--border-color: theme('colors.neutral.400');

		&[inert] {
			--at-apply: 'blur-3';
		}

		> caption {
			--at-apply: 'text-start';
		}

		th,
		td {
			--at-apply: 'b b-[--border-color]';
		}

		th {
			--at-apply: 'text-start font-normal';
		}

		> thead > tr > * {
			--at-apply: 'text-lg';

			&:first-child {
				--at-apply: 'align-bottom text-sm';
			}

			> form,
			> div {
				--at-apply: 'grid grid-cols-[min-content_auto] grid-rows-[1fr_auto_1fr] grid-flow-col text-center';

				> .v-select {
					> select {
						--at-apply: 'rounded-1/2 size-12';
					}

					> label {
						--at-apply: 'rounded-1/2 size-12 of-hidden bg-[--placeholder-champion-bg-clr] b-2 b-[--ui-button-border-clr]';

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

				> button {
					--at-apply: 'row-span-full h-min self-center';
				}
			}
		}

		> tbody > tr {
			&:first-child {
				--at-apply: 'text-lg font-medium bg-[--ui-button-border-clr]/10 whitespace-nowrap';

				> th {
					--at-apply: 'py-1';

					> img {
						--at-apply: 'inline-block size-6 align-middle';
					}

					> button {
						--at-apply: 'float-start me-3';
					}
				}
			}

			&:not(:first-child) {
				> th {
					--at-apply: 'ps-6';
				}

				> td {
					&.irrelevant {
						--at-apply: 'text-neutral-400';
					}
				}
			}

			&:nth-child(2n + 3) {
				--at-apply: 'bg-neutral-400/10';
			}
		}

		> tfoot {
			form {
				--at-apply: 'grid grid-cols-[auto_1fr] auto-rows-min gap-x-2';

				> span {
					--at-apply: 'col-span-full';
				}

				> div {
					--at-apply: 'w-64';

					> select {
						--at-apply: 'inset-unset static w-full h-full';
					}
				}

				> button {
					--at-apply: 'w-fit whitespace-nowrap';
				}
			}
		}
	}
}
</style>
