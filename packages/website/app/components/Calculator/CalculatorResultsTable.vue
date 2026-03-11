<script setup lang="ts">
import type { IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';

defineProps<{
	damageSources: DamageSource[];
	damageTargets: DamageSource[];
}>();

const resultSections = defineModel<IDamageResultTableSection[]>('sections', { required: true });
const resultColumns = defineModel<IDamageResultTableColumn[]>('columns', { required: true });

function columnOptions(from: DamageSource[]): [DamageSource, string][] {
	return from
		.filter(source => source.listedChampion.value)
		.map(source => [source, source.listedChampion.value?.name!] as [DamageSource, string]);
}

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
	<table id="calculator-results-table">
		<caption>
			comparison table
		</caption>
		<thead>
			<tr>
				<th scope="col">
					damage type
				</th>
				<th v-for="column in resultColumns" :key="column.id">
					{{ column.sourceId }} vs {{ column.targetId }}
				</th>
				<td>
					<VSelect
						id="results-table-column-source"
						label="column's damage source"
						:options="columnOptions(damageSources)"
					>
						s
					</VSelect>
					<VSelect
						id="results-table-column-target"
						label="column's damage target"
						:options="columnOptions(damageTargets)"
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
	#calculator-results-table {
		--at-apply: 'mx-auto border-spacing-0 border-separate b b-[--border-color]';
		--border-color: theme('colors.neutral.400');

		th:not(:last-child),
		td:not(:last-child) {
			--at-apply: 'b-r b-[--border-color]';
		}

		th,
		td {
			--at-apply: 'py-1 px-2';
		}

		> thead > tr > th,
		> thead > tr > td,
		> tbody > tr:not(:last-child) > th,
		> tbody > tr:not(:last-child) > td,
		> tfoot > tr > th,
		> tfoot > tr > td,
		> tr:not(:last-child) > td,
		> tr:not(:last-child) > th,
		> thead:not(:last-child),
		> tbody:not(:last-child),
		> tfoot:not(:last-child) {
			--at-apply: 'b-b b-[--border-color]';
		}

		th {
			--at-apply: 'text-start font-normal';
		}

		> thead > tr > th {
			&:first-child {
				--at-apply: 'align-bottom';
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
