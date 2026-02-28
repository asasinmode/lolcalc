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

const ORDER_TO_WEAPON_MAP = Object.fromEntries(Object.entries(CHAMPION_SPECIFICS.Aphelios.WEAPON_ORDER_MAP).map(([weapon, order]) => [order, weapon])) as Record<number, IApheliosWeapon>;
</script>

<template>
	<div data-passive="">
		<h5>passive</h5>
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.passive.variants[value.abilityVariants.value.passive]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'passive')"
		>
	</div>
	<div data-aphelios-q="" :data-level="value.level.value >= 2 ? '1' : undefined">
		<h5>main weapon</h5>
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.q]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e')"
		>
		<h5>Q</h5>
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
		<h5>W</h5>
		<h5>offhand weapon</h5>
		<img
			v-show="!isLoading"
			:src="value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.w]?.imageAlt}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e', value.abilityVariants.value.w)"
		>
		<h5>next weapon</h5>
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
		<h5>R</h5>
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
		--ui-button-border-clr: theme('colors.slate.300');

		> [data-passive] {
			--at-apply: 'rounded-1/2 b-2';

			> h5 {
				--at-apply: 'sr-only';
			}
		}

		> [data-aphelios-q] > h5:first-of-type,
		> [data-aphelios-w] > h5:nth-of-type(n + 2) {
			--at-apply: 'sr-only';
		}

		> [data-aphelios-q],
		> [data-aphelios-w],
		> [data-aphelios-r] {
			--at-apply: 'relative h-[calc(var(--ability-size)+1.5*var(--spacing))]';

			> h5 {
				--at-apply: 'absolute uppercase bottom-0 start-0 leading-[1] -translate-x-1/2 translate-y-1/3 pointer-events-none z-1';

				-webkit-text-stroke: black 0.1em;
				paint-order: stroke fill;
			}
		}

		> [data-aphelios-q] > img:nth-of-type(2),
		> [data-aphelios-r] > img {
			--at-apply: 'size-[--ability-size] rounded-[20%/50%] b-2 b-[--ui-button-border-clr]';
		}

		> [data-aphelios-q]:not([data-level]) > img:nth-of-type(2),
		> [data-aphelios-r]:not([data-level]) > img {
			--at-apply: 'b-neutral-300 grayscale-70 brightness-80';
		}

		> [data-aphelios-q] {
			--at-apply: 'flex items-center';

			> h5 {
				--at-apply: 'start-[--ability-size] bottom-auto top-[--ability-size] -translate-y-2/3';
			}

			> img {
				--at-apply: 'b-2 b-[--ui-button-border-clr]';

				&:nth-of-type(1) {
					--at-apply: 'h-full aspect-square w-auto rounded-1/2 z-1';
				}

				&:nth-of-type(2) {
					--at-apply: '-ms-3.5 z-0';
				}
			}
		}

		> [data-aphelios-r] {
			--at-apply: 'grid-center';

			> h5 {
				--at-apply: 'top-[--ability-size] bottom-auto -translate-y-2/3 translate-x-0';
			}
		}
	}
}
</style>
