<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type { IChampionStatName, IChampionStats } from '@lolcalc/shared';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';
import { formatChampionStatValue } from '@lolcalc/core/DamageSource';
import { PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { ALL_CHAMPION_STATS, ALL_CHAMPION_STATS_ENTRIES, CHAMPION_STAT_META } from '@lolcalc/shared';

const props = defineProps<IExtraComponentProps<'champion'>>();

defineEmits<IExtraComponentEmits>();

const el = useTemplateRef('el');

const { vMinor } = PATCH_VERSION;

const damageSources = inject<Ref<DamageSource[]>>('damageSources')!;
const damageTargets = inject<Ref<DamageSource[]>>('damageTargets')!;

function statImage(statName: IChampionStatName) {
	const icon = STAT_ICON[statName];
	return typeof icon === 'string'
		? {
				src: `https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`,
				width: 20,
				height: 20,
			}
		:	{
				src: icon[0],
				width: icon[1],
				height: icon[2] ?? icon[1],
			};
}

const statInputs = ALL_CHAMPION_STATS_ENTRIES.map(([statName, statMeta]): {
	name: string;
	label: string;
	onInput: (event: Event) => void;
} => {
	return {
		name: statMeta.name,
		label: statMeta.isPercentage && !statMeta.name.startsWith('Percent') ? ' %' : '',
		onInput: useNumberInput(
			[props.damageSource.internalData as Ref<IChampionStats>, statName as IChampionStatName],
			Boolean(!statMeta.decimal || statMeta.isPercentage),
		),
	};
});

onMounted(() => {
	for (const statName of ALL_CHAMPION_STATS) {
		updateStat(
			undefined,
			props.damageSource.internalData.value[statName],
			el.value?.querySelector(`#${props.idPrefix}-${statName}`) as HTMLInputElement,
		);
	}
});

function reset(event: MouseEvent, statName: IChampionStatName) {
	updateStat(
		statName,
		props.damageSource.stats.value.initial[statName] * (CHAMPION_STAT_META[statName] ? 100 : 1),
		(event.currentTarget as HTMLElement).previousElementSibling as HTMLInputElement,
	);
}

function resetAll() {
	for (const [statName, statMeta] of ALL_CHAMPION_STATS_ENTRIES) {
		updateStat(
			statName as IChampionStatName,
			props.damageSource.stats.value.initial[statName as IChampionStatName] * (statMeta.isPercentage ? 100 : 1),
			el.value?.querySelector(`#${props.idPrefix}-${statName}`) as HTMLInputElement,
		);
	}
}

type ICopyFromOption = [id: string, index: number, championName: string | undefined];

function transformToOptions(from: DamageSource[]): ICopyFromOption[] {
	return from
		.map((source, index) => [source, index] as [DamageSource, number])
		.filter(([source]) => source.anythingFilled.value && source.id !== props.damageSource.id)
		.map(([source, index]) => [source.id, index, source.champion.value?.name] as ICopyFromOption);
}

const copyStatsFrom = ref('');
const sourceOptions = computed(() => transformToOptions(damageSources.value));
const targetOptions = computed(() => transformToOptions(damageTargets.value));

watch(() => sourceOptions.value.length || targetOptions.value.length, (value) => {
	if (!value) {
		copyStatsFrom.value = '';
	}
}, { immediate: true });

function copyFrom(event: SubmitEvent) {
	const copyFromId = new FormData(event.target as HTMLFormElement).get('fromId')! as string;
	let stats = event.submitter?.dataset.value as 'baseOnLevel' | 'total';
	if (!stats || !copyFromId) {
		return;
	}
	if (stats !== 'baseOnLevel' && stats !== 'total') {
		stats = 'baseOnLevel';
	}

	const source = damageSources.value.find(source => source.id === copyFromId) ?? damageTargets.value.find(source => source.id === copyFromId);
	if (!source) {
		console.warn(`no damage source with id ${copyFromId} found`);
		return;
	}

	for (const statName of ALL_CHAMPION_STATS) {
		updateStat(
			statName as IChampionStatName,
			formatChampionStatValue(statName, source.stats.value[stats][statName]),
			el.value?.querySelector(`#${props.idPrefix}-${statName}`) as HTMLInputElement,
		);
	}
}

function updateStat(statName: IChampionStatName | undefined, value: number, inputEl?: HTMLInputElement) {
	if (statName) {
		props.damageSource.internalData.value[statName] = value;
	}
	if (inputEl) {
		inputEl.value = value.toString();
		inputEl.setAttribute('value', value.toString());
	}
}
</script>

<template>
	<article ref="el" class="extras-target-dummy-stats">
		<header>
			<form @submit.prevent="copyFrom">
				<label :for="`${idPrefix}-copy-from`">
					copy from
				</label>
				<select
					:id="`${idPrefix}-copy-from`"
					v-model="copyStatsFrom"
					name="fromId"
					:disabled="!(sourceOptions.length || targetOptions.length)"
				>
					<option v-if="!(sourceOptions.length || targetOptions.length)" value="">
						no valid targets
					</option>
					<optgroup v-if="sourceOptions.length" label="sources">
						<option
							v-for="[sourceId, sourceIndex, championName] in sourceOptions"
							:key="sourceId"
							:value="sourceId"
						>
							({{ sourceIndex + 1 }}) {{ championName }}
						</option>
					</optgroup>
					<optgroup v-if="targetOptions.length" label="targets">
						<option
							v-for="[sourceId, sourceIndex, championName] in targetOptions"
							:key="sourceId"
							:value="sourceId"
						>
							({{ sourceIndex + 1 }}) {{ championName }}
						</option>
					</optgroup>
				</select>
				<button
					:disabled="!copyStatsFrom"
					class="pretend-ui-btn"
					type="submit"
					data-value="baseOnLevel"
					title="set to base stats"
				>
					base
				</button>
				<button
					:disabled="!copyStatsFrom"
					class="pretend-ui-btn"
					type="submit"
					data-value="total"
					title="set to total stats"
				>
					total
				</button>
			</form>
			<button
				class="pretend-ui-btn remove"
				@click="resetAll"
			>
				reset all
			</button>
		</header>
		<div
			v-for="([statName, statMeta], statIndex) in ALL_CHAMPION_STATS_ENTRIES"
			:key="statName"
		>
			<label :for="`${idPrefix}-${statName}`" :title="`${statInputs[statIndex]!.name}${statInputs[statIndex]!.label}`">
				<img
					v-bind="statImage(statName)"
					loading="lazy"
				>
				<span>{{ statInputs[statIndex]!.name }}</span>
				{{ statInputs[statIndex]!.label }}
			</label>
			<input
				:id="`${idPrefix}-${statName}`"
				type="number"
				min="0"
				:step="statMeta.decimal && !statMeta.isPercentage ? 0.01 : 1"
				@input="statInputs[statIndex]!.onInput"
			>
			<button class="pretend-ui-btn" @click="reset($event, statName)">
				<span>reset</span>
			</button>
		</div>
	</article>
</template>

<style>
@layer overrides {
	#scoreboard > div > ul > [data-scoreboard-item='TargetDummy'] > details > [data-extras] > .extras-target-dummy-stats {
		--at-apply: 'col-span-full w-full grid grid-cols-5 auto-rows-min gap-x-3.5 gap-y-2.5 py-[--p]';

		> header {
			--at-apply: 'col-span-full flex';

			button {
				--at-apply: 'px-1.5';
			}

			> form {
				--at-apply: 'me-auto';

				> select {
					--at-apply: 'bg-white text-black w-40 py-[--venmbr-input-py] px-[--venmbr-input-px] me-[--venmbr-gap-x]';
					color-scheme: light;

					&:disabled {
						--at-apply: 'text-neutral-700 bg-neutral-200';
					}
				}

				> button {
					&:nth-of-type(1) {
						--at-apply: 'b-e-0';
					}
				}
			}
		}

		> div {
			--at-apply: 'grid grid-rows-[max-content_1fr] grid-cols-[1fr_auto] gap-x-[--venmbr-gap-x] gap-y-1 relative';

			> label {
				--at-apply: 'flex items-center text-sm col-span-full gap-x-[0.5ch]';

				> img {
					--at-apply: 'size-4';
				}

				> span {
					--at-apply: 'truncate';
				}
			}

			> input {
				--at-apply: 'h-min w-full px-[--venmbr-input-px] py-[--venmbr-input-py] bg-white text-black me-[--venmbr-gap-x]';
			}

			> button {
				--at-apply: 'px-1.5';
			}
		}
	}
}
</style>
