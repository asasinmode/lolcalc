<script setup lang="ts">
import type Aphelios from '../../../../public/data/champion/Aphelios.json';

type IAphelios = typeof Aphelios;

defineProps<{
	value: DamageSource;
	isLoading: boolean;
}>();

defineEmits<{
	abilityHover: [event: MouseEvent, ability: keyof IChampion['abilities'], variant?: number];
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
	<div data-aphelios-q="">
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.q]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e')"
		>
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.q.variants[value.abilityVariants.value.q]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'q')"
		>
	</div>
	<div data-aphelios-w="">
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.w]?.imageAlt}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e', value.abilityVariants.value.w)"
		>
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.e]?.imageAlt}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e', value.abilityVariants.value.e)"
		>
	</div>
	<div data-aphelios-r="">
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.r.variants[value.abilityVariants.value.r]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'r')"
		>
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
