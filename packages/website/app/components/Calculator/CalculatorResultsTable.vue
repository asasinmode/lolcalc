<script setup lang="ts">
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

function addResultsColumn() {
	resultColumns.value.push({
		id: crypto.randomUUID(),
		sourceId: columnNewSourceId.value!,
		targetId: columnNewTargetId.value,
	});
	columnNewSourceId.value = undefined;
	columnNewTargetId.value = undefined;
}

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

async function addResultsSection(event: SubmitEvent) {
	const rawSectionIndex = new FormData(event.target as HTMLFormElement).get('sectionOptionIndex');

	const option = damageSectionOptions.value[Number.parseInt(rawSectionIndex as string)]!;
	const champion = await useChampion(option.championId);

	resultSections.value.push({
		id: option.id,
		name: option.name,
		image: option.image,
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
		<tbody v-for="section in resultSections" :key="section.id">
			<tr>
				<th scope="rowgroup" :colspan="resultColumns.length + 2">
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/game/${section.image}`"
						width="64"
						height="64"
						aria-hidden="true"
					>
					{{ section.name }}
					<button v-if="section.id !== 'basicAttack'" class="pretend-ui-button" @click="removeDamageSection(section)">
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

		> thead > tr > * {
			--at-apply: 'text-lg';

			&:first-child {
				--at-apply: 'align-bottom text-sm';
			}

			> form {
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
				}
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
