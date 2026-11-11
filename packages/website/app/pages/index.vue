<script setup lang="ts">
import type { ComponentExposed } from 'vue-component-type-helpers';
import type { TheTutorial } from '#components';

const { damageSources } = useCalculatorState();
const { saveState } = useManageCalculatorState();

const showResults = ref(damageSources.some((source) => source.anythingFilled.value));
if (!showResults.value) {
	const unwatchShowResults = watch(
		() => damageSources.some((source) => source.anythingFilled.value),
		(anythingFilled) => {
			if (anythingFilled) {
				unwatchShowResults();
				showResults.value = true;
			}
		},
		{ immediate: true },
	);
}

function saveStateOnVisibilitychange() {
	document.hidden && saveState();
}

const showTutorial = ref(false);
const tutorialChangedAt = new Date(2026, 11, 10);

onMounted(() => {
	document.addEventListener('visibilitychange', saveStateOnVisibilitychange);

	const tutorialFinishedAt = localStorage.getItem('lolcalc-tutorial-finished-at');
	if (!tutorialFinishedAt || new Date(tutorialFinishedAt) > tutorialChangedAt) {
		showTutorial.value = true;
	}
});

onBeforeUnmount(() => {
	document.removeEventListener('visibilitychange', saveStateOnVisibilitychange);
});

const resultsTable = useTemplateRef('resultsTable');
const tutorialEl = useTemplateRef('theTutorial');

const resetTutorial = import.meta.dev
	? () => {
			if (!tutorialEl.value) {
				showTutorial.value = true;
			} else if (tutorialEl.value) {
				(tutorialEl.value as unknown as ComponentExposed<typeof TheTutorial>).reset();
			}
		}
	: undefined;

defineExpose({ resultsTable });
</script>

<template>
	<main id="index">
		<LazyTheTutorial v-if="showTutorial" ref="theTutorial" />
		<DevOnly>
			<button id="tmp-reset-tutorial" class="pretend-ui-btn" @click="resetTutorial">TMP</button>
		</DevOnly>
		<CalculatorScoreboard />
		<section id="results">
			<h2 id="results-header">results</h2>
			<div id="results-table-scroll-wrapper">
				<p v-show="!showResults">configure a damage source to view results</p>
				<CalculatorResultsTable ref="resultsTable" :show-results />
			</div>
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
				--at-apply: 'mx-auto text-center';
				/* h2 mbs + mbe */
				--section-header-my: calc(8 * var(--spacing));

				> h2 {
					--at-apply: 'mbs-5 mbe-3';
				}

				#results-table-scroll-wrapper > p {
					--at-apply: 'absolute z-10 py-2 start-1/2 inset-bs-1/2 translate-center text-center text-xl font-500';
					-webkit-text-stroke: black 0.2em;
					paint-order: stroke fill;
				}
			}
		}

		#tmp-reset-tutorial {
			--at-apply: 'absolute px-2 block-[--manipulate-btn-size] inset-s-1/2 inset-bs-12 -translate-x-1/2 z-98';
		}
	}
}

@layer overrides {
	#results-table-scroll-wrapper:has(> table[inert]) {
		--at-apply: 'of-clip';
	}
}
</style>
