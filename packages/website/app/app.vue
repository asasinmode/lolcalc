<script setup lang="ts">
import type { IGlobalKeyModifiers } from '~/types';

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

const damageSources = ref<DamageSource[]>([markRaw(new DamageSource(useId(), { champion: champions.Aatrox }))]);
const damageTargets = ref<DamageSource[]>([markRaw(new DamageSource(useId()))]);

const globalKeyModifiers: IGlobalKeyModifiers = ref({
	shift: false,
	alt: false,
});

provide('globalKeyModifiers', globalKeyModifiers);

function pressShift(event: KeyboardEvent) {
	if (event.key === 'Shift') {
		globalKeyModifiers.value.shift = true;
	} else if (event.key === 'Alt') {
		globalKeyModifiers.value.alt = true;
	}
}

function releaseShift(event: KeyboardEvent) {
	if (event.key === 'Shift') {
		globalKeyModifiers.value.shift = false;
	} else if (event.key === 'Alt') {
		globalKeyModifiers.value.alt = false;
	}
}

onMounted(() => {
	window.addEventListener('keydown', pressShift, { passive: true });
	window.addEventListener('keyup', releaseShift, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', pressShift);
	window.removeEventListener('keyup', releaseShift);
});
</script>

<template>
	<header>
		current patch: {{ version }}
	</header>
	<main>
		<CalculatorScoreboard
			v-model:sources="damageSources as unknown as DamageSource[]"
			v-model:targets="damageTargets as unknown as DamageSource[]"
		/>
	</main>
	<ChampSelect />
	<ItemShop />
	<RuneSelect />
</template>

<style>
@layer components {
	:root {
		--ui-button-border-clr: hsl(40 59% 61%);
		--ui-pretend-button-icon-clr: hsl(37 81% 71%);
	}

	.data-pretend-ui-button {
		@apply 'b b-[--ui-button-border-clr] bg-cyan-950 hoverable:bg-cyan-900 disabled:hoverable:bg-cyan-950 disabled:brightness-60';

		.iconify {
			@apply 'text-[--ui-pretend-button-icon-clr]';
		}
	}
}
</style>
