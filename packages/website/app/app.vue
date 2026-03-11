<script setup lang="ts">
import type { IDamageResultTableColumn, IDamageResultTableSection } from './utils/types';
import { _setupGlobalKeyModifiers } from './composables/useGlobalKeyModifiers';

useHead({
	htmlAttrs: { lang: 'en' },
	link: [
		{ rel: 'icon', href: 'favicon.png' },
		{ rel: 'icon', href: 'favicon_dark.png', media: 'prefers-color-scheme: dark' },
	],
});
useSeoMeta({
	title: 'Damage Calculator for League of Legends - lolcalc',
	description: 'Accurate champion stats calculation, damage and build comparison and more',
});

const { version } = usePatchVersion();
const { _component: ChampSelect } = useChampSelect();
const { _component: ItemShop } = useItemShop();
const { _component: RuneSelect } = useRuneSelect();

_setupGlobalKeyModifiers();

// TMP as unknown as..., can't put it in v-model or it doesn't build atm
const damageSources = ref<DamageSource<any>[]>([
	markRaw(new DamageSource(useId())),
]) as unknown as DamageSource[];
const damageTargets = ref<DamageSource<any>[]>([markRaw(new DamageSource(useId()))]) as unknown as DamageSource[];

const showResults = computed(() => (damageSources as unknown as Ref<DamageSource[]>).value.some(
	source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id),
),
);

const tableResultSections = ref<IDamageResultTableSection[]>([
	{
		id: 'basicAttack',
		name: 'basic attack',
		rows: [
			{
				name: 'total',
				property: 'total',
			},
			{
				name: 'physical damage',
				property: 'physicalDamage',
			},
			{
				name: 'magic damage',
				property: 'magicDamage',
			},
			{
				name: 'true damage',
				property: 'trueDamage',
			},
		],
	},
]);
const tableResultColumns = ref<IDamageResultTableColumn[]>([]);
</script>

<template>
	<header>
		current patch: {{ version }}
	</header>
	<main>
		<CalculatorScoreboard v-model:sources="damageSources" v-model:targets="damageTargets" />
		<section id="calculator-results">
			<p v-show="!showResults">
				configure a damage source champion to view results
			</p>
			<CalculatorResultsTable
				v-model:sections="tableResultSections"
				v-model:columns="tableResultColumns"
				:damage-sources
				:damage-targets
				:show-results
			/>
		</section>
	</main>
	<ChampSelect />
	<ItemShop />
	<RuneSelect />
</template>

<style>
#calculator-results {
	p:first-child {
		--at-apply: 'sticky z-10 top-12 -mb-11 py-2 text-center text-xl font-medium backdrop-blur-2';
		-webkit-text-stroke: black 0.2em;
		paint-order: stroke fill;
	}
}
</style>
