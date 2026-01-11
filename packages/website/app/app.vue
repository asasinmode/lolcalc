<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' } });
useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
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
#calculator-scoreboard {
	> h3 {
		@apply 'text-center';
	}

	> ul > li:last-child {
		@apply 'grid-center';

		> button {
			@apply 'p-1 bg-black';

			&:disabled {
				@apply 'op-50';
			}

			.iconify {
				@apply 'align-sub size-4';
			}
		}
	}
}
</style>
