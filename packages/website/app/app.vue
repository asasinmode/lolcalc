<script setup lang="ts">
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
const champions = useChampions();
const { _component: ChampSelect } = useChampSelect();
const { _component: ItemShop } = useItemShop();
const { _component: RuneSelect } = useRuneSelect();

_setupGlobalKeyModifiers();

// TMP as unknown as..., can't put it in v-model or it doesn't build atm
const damageSources = ref<DamageSource[]>([
	markRaw(new DamageSource(useId(), { champion: champions.Caitlyn })),
	markRaw(new DamageSource(useId(), { champion: champions.Zaahen, level: 12, abilityLevels: { q: 2 } })),
	markRaw(new DamageSource(useId(), { champion: champions.Gnar })),
]) as unknown as DamageSource[];
const damageTargets = ref<DamageSource[]>([markRaw(new DamageSource(useId()))]) as unknown as DamageSource[];
</script>

<template>
	<header>
		current patch: {{ version }}
	</header>
	<main>
		<CalculatorScoreboard v-model:sources="damageSources" v-model:targets="damageTargets" />
	</main>
	<ChampSelect />
	<ItemShop />
	<RuneSelect />
</template>
