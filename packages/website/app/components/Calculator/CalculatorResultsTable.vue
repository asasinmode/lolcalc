<script setup lang="ts">
import type { IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';

const props = defineProps<{
	damageSources: DamageSource[];
	damageTargets: DamageSource[];
	showResults: boolean;
}>();

const resultSections = defineModel<IDamageResultTableSection[]>('sections', { required: true });
const resultColumns = defineModel<IDamageResultTableColumn[]>('columns', { required: true });

function columnOptions(from: DamageSource[]): [DamageSource, string][] {
	return from
		.filter(source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id))
		.map((source, i) => [source, `(${i}) ${source.listedChampion.value?.name!}`] as [DamageSource, string]);
}

const sourceOptions = computed(() => columnOptions(props.damageSources));
const targetOptions = computed(() => columnOptions(props.damageTargets));

function damageSectionRowCellValue(
	_section: IDamageResultTableSection,
	_row: IDamageResultTableSection['rows'][number],
	columnIndex: number,
) {
	const column = resultColumns.value[columnIndex];
	if (!column?.sourceId) {
		return '-';
	}

	return Math.round(Math.random() * 500);
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
				<th v-for="column in resultColumns" :key="column.id" width="100px">
					{{ column.sourceId }} vs {{ column.targetId }}
				</th>
				<td width="100px">
					<VSelect
						id="results-table-column-source"
						label="column's damage source"
						:options="sourceOptions"
					>
						s
					</VSelect>
					vs
					<VSelect
						id="results-table-column-target"
						label="column's damage target"
						:options="targetOptions"
						clearable
					>
						t
					</VSelect>
				</td>
			</tr>
		</thead>
		<tbody v-for="section in resultSections" :key="section.id">
			<tr>
				<th scope="rowgroup" :colspan="resultColumns.length + 2">
					{{ section.name }}
				</th>
			</tr>
			<tr v-for="row in section.rows" :key="`${section.id}-${row.name}`">
				<th scope="row">
					{{ row.name }}
				</th>
				<td v-for="i in (resultColumns.length + 1)" :key="`${section.id}-total-${resultColumns[i - 1]?.id || 'new'}`">
					{{ damageSectionRowCellValue(section, row, i - 1) }}
				</td>
			</tr>
		</tbody>
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

		&[inert]{
			--at-apply: 'blur-3';
		}

		> caption {
			--at-apply: 'text-start';
		}

		th,
		td {
			--at-apply: 'py-1 px-2 b b-[--border-color]';
		}

		th {
			--at-apply: 'text-start font-normal';
		}

		> thead > tr > th {
			&:first-child {
				--at-apply: 'align-bottom text-sm';
			}
		}

		> tbody > tr {
			&:first-child {
				--at-apply: 'text-lg font-medium';
			}

			&:nth-child(n + 2) {
				> th {
					--at-apply: 'ps-6';
				}
			}

			&:nth-child(2n + 3) {
				--at-apply: 'bg-neutral-400/10';
			}
		}
	}
}
</style>
