<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' } });
useSeoMeta({
	title: 'Colector.lol - League of Legends Damage Calculator',
	description: 'Accurate champion stats calculation, damage and build comparison and more',
});

const { version } = usePatchVersion();
const { _component: ChampSelect } = useChampSelect();
const { _component: ItemShop } = useItemShop();
const { _component: RuneSelectDialog } = useRuneSelectDialog();

const damageSources = shallowRef<DamageSource[]>([new DamageSource()]);
const damageTargets = shallowRef<DamageSource[]>([new DamageSource()]);
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
	<RuneSelectDialog />
</template>

<style>
@layer components {
	:root {
		--ui-button-border-clr: hsl(40 59% 61%);
		--ui-pretend-button-icon-clr: hsl(37 81% 71%);
	}

	[data-pretend-ui-button] {
		@apply 'b b-[--ui-button-border-clr] bg-cyan-950 hoverable:bg-cyan-900 disabled:hoverable:bg-cyan-950 disabled:brightness-60';

		.iconify {
			@apply 'text-[--ui-pretend-button-icon-clr]';
		}
	}
}
</style>
