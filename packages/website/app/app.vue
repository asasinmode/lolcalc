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
const enableUnimplementedUi = useEnableUnimplementedUi();

_setupGlobalKeyModifiers();

// TMP as unknown as..., can't put it in v-model or it doesn't build atm
const damageSources = ref<DamageSource<any>[]>(import.meta.dev
	? [
			markRaw(new DamageSource({ champion: useChampions().Aatrox })),
			markRaw(new DamageSource({ champion: useChampions().Ambessa })),
			markRaw(new DamageSource({ champion: useChampions().Annie })),
			markRaw(new DamageSource({ champion: useChampions().AurelionSol })),
		]
	: [
			markRaw(new DamageSource()),
		],
) as unknown as DamageSource[];
const damageTargets = ref<DamageSource<any>[]>(import.meta.dev
	? [
			markRaw(new DamageSource({ champion: useChampions().Zaahen })),
			markRaw(new DamageSource({ champion: useChampions().Zed })),
			markRaw(new DamageSource({ champion: useChampions().Zac })),
		]
	: [markRaw(new DamageSource())],
) as unknown as DamageSource[];

const showResults = computed(() => (damageSources as unknown as Ref<DamageSource[]>).value.some(
	source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id),
),
);

const tableResultSections = ref<IDamageResultTableSection[]>([
	{
		id: 'basicAttack',
		name: 'basic attack',
		championId: 'all',
		image: 'assets/ux/deathrecap/autoattack.png',
		rows: [
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
		],
	},
]);
const tableResultColumns = ref<IDamageResultTableColumn[]>(import.meta.dev
	? [
			{
				id: useId(),
				source: (damageSources as unknown as Ref).value[0],
				target: (damageTargets as unknown as Ref).value[2],
			},
			{
				id: useId(),
				source: (damageSources as unknown as Ref).value[3],
				target: (damageTargets as unknown as Ref).value[0],
			},
			{
				id: useId(),
				source: (damageSources as unknown as Ref).value[2],
				target: (damageTargets as unknown as Ref).value[1],
			},
			{
				id: useId(),
				source: (damageSources as unknown as Ref).value[1],
			},
		]
	: [],
	// TMP
) as unknown as IDamageResultTableColumn[];
</script>

<template>
	<header>
		<h1>
			lolcalc
		</h1>
		<h2>
			League of Legends damage calculator
		</h2>
		<p>
			current patch: {{ version }}
			<br>
		</p>
		<label for="scoreboard-enable-unimplemented-ui">
			TMP enable unimplemented ui
			<input id="scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
		</label>
	</header>
	<main>
		<CalculatorScoreboard v-model:sources="damageSources" v-model:targets="damageTargets" />
		<section id="results">
			<h2 id="results-header">
				results
			</h2>
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
@layer components {
	:root {
		/* bg color of the 'plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png' */
		--placeholder-champion-bg-clr: #020a13;
	}

	#results {
		--at-apply: 'mx-auto text-center';
	}

	#results + p {
		--at-apply: 'sticky z-10 top-12 -mb-11 py-2 text-center text-xl font-medium backdrop-blur-2';
		-webkit-text-stroke: black 0.2em;
		paint-order: stroke fill;
	}
}
</style>
