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
		.map((source, i) => [source, `(${i + 1}) ${source.listedChampion.value?.name!}`] as [DamageSource, string]);
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
			name: `${source.champion.value!.name} ${abilityKey === 'passive' ? abilityKey : abilityKey.toUpperCase()} - ${nameReplaced}`,
		};
	}))
	.filter(source => !resultSections.value.some(section => section.id === source.id)),
);

async function addDamageSection(event: SubmitEvent) {
	const rawSectionIndex = new FormData(event.target as HTMLFormElement).get('sectionOptionIndex');

	const option = damageSectionOptions.value[Number.parseInt(rawSectionIndex as string)]!;
	const champion = await useChampion(option.championId);

	resultSections.value.push({
		id: option.id,
		name: option.name,
		rows: abilityVariantListedVariables(champion, option.abilityKey, 0).map(variable => ({ name: variable, property: variable })),
	});

	(event.target as HTMLFormElement).reset();
}

function removeDamageSection(section: IDamageResultTableSection) {
	const index = resultSections.value.indexOf(section);
	if (~index) {
		resultSections.value.splice(index, 1);
	}
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

	// TODO
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
						TODO
					</VSelect>
					vs
					<VSelect
						id="results-table-column-target"
						label="column's damage target"
						:options="targetOptions"
						clearable
					>
						TODO
					</VSelect>
					<button>
						add
					</button>
				</td>
			</tr>
		</thead>
		<tbody v-for="section in resultSections" :key="section.id">
			<tr>
				<th scope="rowgroup" :colspan="resultColumns.length + 2">
					{{ section.name }}
					<button v-if="section.id !== 'basicAttack'" @click="removeDamageSection(section)">
						remove
					</button>
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
		<tbody v-show="damageSectionOptions.length" id="results-table-new-section">
			<tr>
				<th scope="rowgroup" :colspan="resultColumns.length + 2">
					<form @submit.prevent="addDamageSection">
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

		> #results-table-new-section {
			form {
				--at-apply: 'grid grid-cols-[auto_1fr] auto-rows-min gap-y-1 gap-x-2';

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
					--at-apply: 'w-fit whitespace-nowrap px-3 py-1';
				}
			}
		}
	}
}
</style>
