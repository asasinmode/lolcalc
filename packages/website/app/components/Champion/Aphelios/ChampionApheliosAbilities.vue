<script setup lang="ts">
defineProps<{
	value: DamageSource;
	isLoading: boolean;
}>();

defineEmits<{
	abilityHover: [event: MouseEvent, ability: keyof IChampion['abilities']];
}>();

const { minorVersion } = usePatchVersion();
</script>

<template>
	<div data-passive="">
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.passive.variants[value.abilityVariants.value.passive]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'passive')"
		>
		<span>passive</span>
	</div>
</template>

<style>
@layer overrides {
	#calculator-scoreboard > ul > [data-scoreboard-item='Aphelios'] > details > [data-abilities] {
		> [data-passive] {
			--at-apply: 'rounded-full';
		}
	}
}
</style>
