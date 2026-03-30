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

/* expected to have DamageSources added in `restoreState` */
const damageSources = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;
const damageTargets = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;

const resultsTable = useTemplateRef('resultsTable');

const {
	saveState,
	restoreState,
	debouncedSaveState,
	isStateTooLargeForQuery,
} = useCalculatorState(damageSources, damageTargets, resultsTable as ShallowRef<InstanceType<typeof CalculatorResultsTable>>);

restoreState();

const showResults = ref(false);
const unwatchShowResults = watch(() => damageSources.value.some(source => source.anythingFilled.value), (anythingFilled) => {
	if (anythingFilled) {
		unwatchShowResults();
		showResults.value = true;
	}
}, { immediate: true });

const hasCopiedShareLink = ref(false);
const shareTextPopover = useTemplateRef('shareTextPopover');

function copyShareLink() {
	hasCopiedShareLink.value = true;
	saveState();
	navigator.clipboard.writeText(location.href);
}

function showSharePopover() {
	shareTextPopover.value?.showPopover();
}

function hideSharePopover() {
	hasCopiedShareLink.value = false;
	shareTextPopover.value?.hidePopover();
}

function saveStateOnVisibilitychange() {
	document.hidden && saveState();
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
				configure a damage source to view results
			</p>
			<CalculatorResultsTable
				ref="resultsTable"
				:damage-sources
				:damage-targets
				:show-results
				@configuration-changed="debouncedSaveState"
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
		<strong>lolcalc</strong> was created under Riot Games' <a href="https://www.riotgames.com/en/legal" target="_blank" rel="noreferrer noopener">"<span>Legal Jibber Jabber</span>"</a> policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.
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
		--at-apply: 'mx-auto text-center relative';

		> p {
			--at-apply: 'absolute z-10 top-16 py-2 start-1/2 -translate-x-1/2 text-center text-xl font-medium';
			-webkit-text-stroke: black 0.2em;
			paint-order: stroke fill;
		}
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
			--at-apply: 'pt-8 pb-3 text-neutral-400 mt-auto text-center';

			> a {
				--at-apply: 'hoverable:text-white';

				> span {
					--at-apply: 'underline';
				}
			}
		}
	}
}
</style>
