<script setup lang="ts">
import type { ShallowRef } from 'vue';
import type { CalculatorResultsTable } from '#components';

const { damageSources } = useCalculatorState();

const resultsTable = useTemplateRef('resultsTable');

const {
	saveState,
	restoreState,
} = useManageCalculatorState();

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

	callOnce(() => {
		restoreState(resultsTable as ShallowRef<InstanceType<typeof CalculatorResultsTable>>);
	});
});

onBeforeUnmount(() => {
	document.removeEventListener('visibilitychange', saveStateOnVisibilitychange);
});
</script>

<template>
	<main id="index">
		<CalculatorScoreboard />
		<section id="results">
			<h2 id="results-header">
				results
			</h2>
			<p v-show="!showResults">
				configure a damage source to view results
			</p>
			<CalculatorResultsTable ref="resultsTable" :show-results />
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
