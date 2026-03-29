<script setup lang="ts">
import type { CalculatorResultsTable } from '#components';
import type { ShallowRef } from 'vue';
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

const damageSources = ref<DamageSource<any>[]>(import.meta.dev
	? [
			markRaw(new DamageSource({ champion: useChampions().Aatrox, items: [useItems()['3155']] })),
			markRaw(new DamageSource({ champion: useChampions().Veigar })),
			markRaw(new DamageSource({ champion: useChampions().Kalista })),
			markRaw(new DamageSource({ champion: useChampions().AurelionSol })),
		]
	: [
			markRaw(new DamageSource()),
		],
) as unknown as ShallowRef<DamageSource<any>[]>;
const damageTargets = ref<DamageSource<any>[]>(import.meta.dev
	? [
			markRaw(new DamageSource({ champion: useChampions().Hecarim })),
			markRaw(new DamageSource({ champion: useChampions().Veigar })),
			markRaw(new DamageSource({ champion: useChampions().Aphelios })),
		]
	: [markRaw(new DamageSource())],
) as unknown as ShallowRef<DamageSource<any>[]>;

const showResults = computed(() => (damageSources as unknown as Ref<DamageSource[]>).value.some(
	source => source.champion.value && (source.listedChampion.value?.id === source.champion.value.id),
),
);

const resultsTable = useTemplateRef('resultsTable');

const { calculatorStateString } = useCalculatorState(damageSources, damageTargets, resultsTable as ShallowRef<InstanceType<typeof CalculatorResultsTable>>);

const hasCopiedShareLink = ref(false);
const isStateTooLargeForQuery = ref(false);
const shareTextPopover = useTemplateRef('shareTextPopover');

function copyShareLink() {
	hasCopiedShareLink.value = true;
	saveStateInUrl(calculatorStateString());
	navigator.clipboard.writeText(location.href);
}

function showSharePopover() {
	shareTextPopover.value?.showPopover();
}

function hideSharePopover() {
	hasCopiedShareLink.value = false;
	shareTextPopover.value?.hidePopover();
}

function saveStateInUrl(data: ReturnType<typeof calculatorStateString>) {
	history.replaceState(null, '', `${location.pathname}?${data[1]}`);
}

function saveStateInLocalStorage(data: ReturnType<typeof calculatorStateString>) {
	localStorage.setItem('localc-calculator-state', data[0]);
}

function saveStateOnVisibilitychange() {
	if (document.hidden) {
		const state = calculatorStateString();
		saveStateInUrl(state);
		saveStateInLocalStorage(state);
	};
}

onMounted(() => {
	document.addEventListener('visibilitychange', saveStateOnVisibilitychange);
});

onBeforeUnmount(() => {
	document.removeEventListener('visibilitychange', saveStateOnVisibilitychange);
});
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
				ref="resultsTable"
				:damage-sources
				:damage-targets
				:show-results
			/>
		</section>
		<button
			id="share-configuration"
			class="pretend-ui-button"
			@click="copyShareLink"
			@mouseenter="showSharePopover"
			@focus="showSharePopover"
			@mouseleave="hideSharePopover"
			@blur="hideSharePopover"
		>
			share
			<div ref="shareTextPopover" popover="hint">
				{{ hasCopiedShareLink ? 'copied' : 'copy link to current configuration' }}
				<p v-show="isStateTooLargeForQuery" class="alert warning">
					configuration too large for url, some will data will be trimmed
					<Icon class="i-ph:warning-light" />
				</p>
			</div>
		</button>
	</main>
	<footer>
		<b>lolcalc</b> was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.
	</footer>
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

	#__nuxt {
		> main {
			--at-apply: 'relative';

			> #share-configuration {
				--at-apply: 'px-2 py-0.5 absolute top-0 end-0';
				anchor-name: --share-configuration;

				> [popover] {
					--at-apply: 'bg-black py-0.5 px-1 text-end b b-[--ui-button-border-clr]';
					position-anchor: --share-configuration;
					inset-block-start: calc(anchor(end) + 0.25rem);
					inset-inline-end: calc(anchor(end));

					> .alert {
						--at-apply: 'py-1 text-sm mb-1';

						&::after {
							--at-apply: '-mt-1';
						}
					}
				}
			}
		}

		> footer {
			--at-apply: 'pt-8 text-neutral-400';
		}
	}
}
</style>
