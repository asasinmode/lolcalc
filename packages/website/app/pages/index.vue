<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type { IGameImageData } from '@lolcalc/core/misc';
import type { IChampionStatName } from '@lolcalc/shared';
import type { ShallowRef } from 'vue';
import type { CalculatorResultsTable } from '#components';
import type { IDamageResultTableColumn, IDamageResultTableSection } from '~/utils/types';
import { ICON_GOLD, imgUrl, PATCH_VERSION, STAT_ICON } from '@lolcalc/data';
import { ALL_CHAMPION_STATS_ENTRIES, CHAMPION_STAT_META } from '@lolcalc/shared';

const { vMinor } = PATCH_VERSION;

/* expected to have DamageSources added in `restoreState`, shallowRefs because otherwise ref properties inside of classes get messed up */
const damageSources = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;
const damageTargets = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;

provide('damageSources', damageSources);
provide('damageTargets', damageTargets);

const resultColumns = ref<IDamageResultTableColumn[]>([{ id: useId() }]) as unknown as ShallowRef<IDamageResultTableColumn[]>;
const resultSections = ref<IDamageResultTableSection[]>([
	{
		id: 'a-stats',
		abilityId: { type: 'all', id: 'stats' },
		name: 'stats',
		isPermanent: true,
		image: [`https://raw.communitydragon.org/${vMinor}/game/assets/ux/deathrecap/itemdamage.png`, 32],
		rows: markRaw(ALL_CHAMPION_STATS_ENTRIES.map(([statName, statMeta]) => {
			const icon = STAT_ICON[statName as IChampionStatName];
			const image: IGameImageData = typeof icon === 'string'
				? [
						`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`,
						20,
					]
				:	icon;

			return {
				id: statName as string,
				name: statMeta.name,
				image,
			};
		}).concat([
			{
				id: 'eqValue',
				name: 'Inventory Value',
				image: [ICON_GOLD.src, ICON_GOLD.width, ICON_GOLD.height] as Extract<IGameImageData, any[]>,
			},
		])),
		getCellValue(_section, rowId, source, _target) {
			if (!source) {
				return;
			}

			if (rowId === 'eqValue') {
				const numberValue = source.items.value.reduce((acc, item) => acc + (item?.gold.total ?? 0), 0);
				return { numberValue, value: numberValue };
			}

			return {
				numberValue: source.stats.value.total[rowId as IChampionStatName],
				value: `${source.computed.formattedStatTotals.value[rowId as IChampionStatName]}${CHAMPION_STAT_META[rowId as IChampionStatName].isPercentage ? '%' : ''}`,
			};
		},
	},
	{
		id: 'a-aa',
		abilityId: { type: 'all', id: 'basicAttack' },
		name: 'basic attack',
		isPermanent: true,
		image: [imgUrl('game/assets/ux/deathrecap/autoattack.png'), 32],
		rows: markRaw([
			{
				name: 'total',
				id: 'total',
			},
			{
				name: 'physical damage',
				id: 'physicalDamage',
			},
			{
				name: 'magic damage',
				id: 'magicDamage',
			},
			{
				name: 'true damage',
				id: 'trueDamage',
			},
			{
				name: 'DPS',
				id: 'dps',
			},
		]),
		// TODO
		getCellValue() {
			const value = Math.round(Math.random() * 500);
			const numberValue = value;

			return { value, numberValue };
		},
		selectValue: 'normal',
		selectOptions: markRaw([['normal', 'normal'], ['critical', 'critical'], ['average', 'average']]),
		selectLabel: 'attack type',
	},
	{
		id: 'a-cTtl',
		abilityId: { type: 'all', id: 'customTotal' },
		name: 'custom total',
		isPermanent: true,
		isCustomTotal: true,
		image: [imgUrl('game/assets/ux/deathrecap/unknowndamage.png'), 32],
		rows: markRaw([
			{
				id: 'cTtl-total',
				name: 'total',
			},
		]),
		getCellValue() {
			console.warn('results section custom total \'getCellValue\' called, should be handled manually');
			return { value: 0, numberValue: 0 };
		},
	},
]) as unknown as ShallowRef<IDamageResultTableSection[]>;

const resultsTable = useTemplateRef('resultsTable');

const {
	saveState,
	restoreState,
	debouncedSaveState,
} = useCalculatorState(damageSources, damageTargets, resultsTable as ShallowRef<InstanceType<typeof CalculatorResultsTable>>);

const showResults = ref(damageSources.value.some(source => source.anythingFilled.value));
if (!showResults.value) {
	const unwatchShowResults = watch(() => damageSources.value.some(source => source.anythingFilled.value), (anythingFilled) => {
		if (anythingFilled) {
			unwatchShowResults();
			showResults.value = true;
		}
	}, { immediate: true });
}

function saveStateOnVisibilitychange() {
	document.hidden && saveState();
}

onMounted(() => {
	document.addEventListener('visibilitychange', saveStateOnVisibilitychange);
	restoreState();
});

onBeforeUnmount(() => {
	document.removeEventListener('visibilitychange', saveStateOnVisibilitychange);
});
</script>

<template>
	<main id="index">
		<CalculatorScoreboard v-model:sources="damageSources" v-model:targets="damageTargets" />
		<section id="results">
			<h2 id="results-header">
				results
			</h2>
			<p v-show="!showResults">
				configure a damage source to view results
			</p>
			<CalculatorResultsTable
				ref="resultsTable"
				v-model:sections="resultSections"
				v-model:columns="resultColumns"
				:damage-sources
				:damage-targets
				:show-results
				@configuration-changed="debouncedSaveState"
			/>
		</section>
	</main>
</template>

<style>
@layer base {
	#__nuxt {
		> main#index {
			--at-apply: 'relative';

			> label {
				--at-apply: 'absolute';
			}

			> section > h2 {
				--at-apply: 'text-xl font-700 mx-auto text-center';
			}

			#results {
				--at-apply: 'mx-auto text-center relative';

				> h2 {
					--at-apply: 'mb-3 mt-5';
				}

				> p {
					--at-apply: 'absolute z-10 top-16 py-2 start-1/2 -translate-x-1/2 text-center text-xl font-500';
					-webkit-text-stroke: black 0.2em;
					paint-order: stroke fill;
				}
			}
		}
	}
}
</style>
