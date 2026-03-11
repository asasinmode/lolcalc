<script setup lang="ts">
import type { IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';

defineProps<{
	damageSources: DamageSource[];
	damageTargets: DamageSource[];
}>();

const resultSections = defineModel<IDamageResultTableSection[]>('sections', {required: true});
const resultColumns = defineModel<IDamageResultTableColumn[]>('columns', {required: true});

function columnOptions(from: DamageSource[]): [DamageSource, string][] {
	return from
		.filter(source => source.listedChampion.value)
		.map(source => [source, source.listedChampion.value?.name!] as [DamageSource, string]);
}

function damageSectionRowCellValue(section: IDamageResultTableSection, row: IDamageResultTableSection['rows'][number], columnIndex: number){
	const column = resultColumns.value[columnIndex];

	if(!column?.sourceId){
		return '-'
	}

	return Math.round(Math.random() * 500);
}
</script>

<template>
	<table id="calculator-scoreboard">
		<caption>
			results / TODO please configure a source and a target
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
				<th scope="rowgroup" :colspan="resultColumns.length + 1">
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
	#calculator-scoreboard {
		--at-apply: 'mx-auto';
	}
}
</style>
