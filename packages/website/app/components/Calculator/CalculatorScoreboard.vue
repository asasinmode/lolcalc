<script setup lang="ts">
const damageSources = defineModel<DamageSource[]>('sources', { required: true });
const damageTargets = defineModel<DamageSource[]>('targets', { required: true });

const canAddDamageSource = computed(() => !!damageSources.value[0]?.champion.value);
const canAddDamageTarget = computed(() => !!damageTargets.value[0]?.champion.value);
</script>

<template>
	<article id="calculator-scoreboard" class="b grid grid-flow-col grid-rows-[auto_min-content_1fr] grid-cols-2 relative after:(bg-white w-px content-empty bottom-0 left-1/2 top-12 absolute -translate-x-1/2)">
		<header class="text-center b-b col-span-full">
			<h1>&gt;&gt;placeholder title&lt;&lt;</h1>
			<h2>LoL damage calculator</h2>
			<label for="calculator-scoreboard-mirror" class="right-0 top-0 absolute">
				TODO mirror layout
				<input id="calculator-scoreboard-mirror" type="checkbox">
			</label>
		</header>
		<h3>
			damage sources
		</h3>
		<ul>
			<LolScoreboardItem v-for="(value, index) in damageSources" :key="index" :value :index :can-remove="damageSources.length > 1" />
			<li>
				<button :disabled="!canAddDamageSource">
					<Icon name="ph:plus-bold" />
					add damage source
				</button>
			</li>
		</ul>
		<h3>
			damage targets
		</h3>
		<ul>
			<LolScoreboardItem v-for="(value, index) in damageTargets" :key="index" :value :index :can-remove="damageTargets.length > 1" is-right />
			<li>
				<button :disabled="!canAddDamageTarget">
					<Icon name="ph:plus-bold" />
					add damage target
				</button>
			</li>
		</ul>
	</article>
</template>
