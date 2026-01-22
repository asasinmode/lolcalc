<script setup lang="ts">
const enableUnimplementedUi = useEnableUnimplementedUi();

const damageSources = defineModel<DamageSource[]>('sources', { required: true });
const damageTargets = defineModel<DamageSource[]>('targets', { required: true });
</script>

<template>
	<article id="calculator-scoreboard" class="b grid grid-flow-col grid-rows-[auto_min-content_1fr] grid-cols-2 relative after:(bg-white w-px content-empty bottom-0 left-1/2 top-12 absolute -translate-x-1/2)">
		<header class="text-center b-b col-span-full">
			<h1 class="text-xl font-500">
				lolcalc
			</h1>
			<h2 class="text-sm">
				League of Legends damage calculator
			</h2>
			<label for="calculator-scoreboard-enable-unimplemented-ui" class="left-0 top-0 absolute">
				TMP enable unimplemented ui
				<input id="calculator-scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
			</label>
			<label for="calculator-scoreboard-mirror" class="right-0 top-0 absolute">
				TODO mirror layout
				<input id="calculator-scoreboard-mirror" type="checkbox">
			</label>
		</header>
		<h3>
			damage sources
		</h3>
		<ul>
			<LolScoreboardItem v-for="(value, index) in damageSources" :key="index" :value :index :can-remove="damageSources.length > 1" :can-move-down="index !== damageSources.length - 1" />
			<li>
				<button data-pretend-ui-button="" :disabled="!damageSources[0]?.anythingFilled.value">
					<Icon name="ph:plus-bold" />
					add damage source
				</button>
			</li>
		</ul>
		<h3>
			damage targets
		</h3>
		<ul>
			<LolScoreboardItem v-for="(value, index) in damageTargets" :key="index" :value :index :can-remove="damageTargets.length > 1" :can-move-down="index !== damageSources.length - 1" is-right />
			<li>
				<button data-pretend-ui-button="" :disabled="!damageTargets[0]?.anythingFilled.value">
					<Icon name="ph:plus-bold" />
					add damage target
				</button>
			</li>
		</ul>
	</article>
</template>

<style>
@layer components {
	#calculator-scoreboard {
		> h3 {
			@apply 'text-center';
		}

		> ul {
			> li:last-child {
				@apply 'grid-center';

				> button {
					@apply 'p-1';

					.iconify {
						@apply 'align-sub size-4 mr-0.5';
					}
				}
			}
		}
	}
}
</style>
