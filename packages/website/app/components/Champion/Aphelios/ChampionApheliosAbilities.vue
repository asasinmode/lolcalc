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
	<div data-aphelios-q="" :data-level="value.level.value >= 2 ? 1 : undefined">
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
	<div data-aphelios-r="" :data-level="value.level.value >= 6 ? 1 : undefined">
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
		--at-apply: 'gap-x-0';
		--ui-button-border-clr: theme('colors.slate.300');
		/* radius of the funny border */
		--funny-rounded: 20% / 50%;
		/* radius of the image inside of the funny border, its overflow is not clipped in any way so it needs to be the smallest it can be to still not go outside of the border around it */
		--image-funny-rounded: 15% / 15%;
		--funny-ability-w: calc(var(--ability-size) * 10 / 9);

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
			--at-apply: 'relative h-[--ability-size]';

			> h5 {
				--at-apply: 'absolute start-0 bottom-0 leading-[1] -translate-x-1/2 translate-y-1/3 pointer-events-none z-2';

				-webkit-text-stroke: black 0.1em;
				paint-order: stroke fill;
			}
		}

		> [data-aphelios-q],
		> [data-aphelios-r] {
			&::after,
			&::before {
				--at-apply: 'content-empty block w-[--funny-ability-w] h-[--ability-size] rounded-[--funny-rounded] absolute end-0 top-0 top-1/2 -translate-y-1/2 pointer-events-none';
			}

			&::before {
				--at-apply: 'z-0 bg-black';
			}

			&::after {
				--at-apply: 'z-1 b b-2 b-[--ui-button-border-clr]';
			}
		}

		> [data-aphelios-q],
		> [data-aphelios-r] {
			&:not([data-level])::after {
				--at-apply: 'b-neutral-400';
			}
		}

		> [data-aphelios-q] > img:nth-of-type(2),
		> [data-aphelios-r] > img {
			--at-apply: 'size-[--ability-size] rounded-[--image-funny-rounded] b-2 b-transparent';
		}

		> [data-aphelios-q]:not([data-level]) > img:nth-of-type(2),
		> [data-aphelios-r]:not([data-level]) > img {
			--at-apply: 'grayscale-70 brightness-80';
		}

		> [data-aphelios-q] {
			--at-apply: 'flex items-center z-1';

			&::before,
			&::after {
				--at-apply: 'translate-x-[calc((var(--funny-ability-w)-var(--ability-size))/2)]';
			}

			> h5 {
				--at-apply: 'start-[--ability-size]';
			}

			> img {
				&:nth-of-type(1) {
					--at-apply: 'b-2 b-[--ui-button-border-clr] size-[calc(var(--ability-size)+1.5*var(--spacing))] -my-0.75 rounded-1/2 z-2 -me-3.5';
				}

				&:nth-of-type(2) {
					--at-apply: 'z-0';
				}
			}
		}

		> [data-aphelios-w] {
			--at-apply: 'grid grid-cols-[auto_1fr] grid-rows-1';
			--bridge-w: calc(6 * var(--spacing));
			--bridge-mx: calc(-1 * var(--spacing));

			&::before {
				--at-apply: 'z-0 content-empty mx-[--mx] h-5.5 w-[--bridge-w] bg-black b-y b-[--ui-button-border-clr]';
			}

			&::after {
				--at-apply: 'z-0 content-empty bg-black col-start-2 b b-[--ui-button-border-clr] size-[calc(var(--ability-size)*0.8)] rounded-1/2';
			}

			> h5:first-of-type {
				--at-apply: 'top-1/2 start-[calc(0.5*var(--ps))] bottom-auto text-sm translate-center';
			}

			> img {
				&:nth-of-type(1) {
					--at-apply: 'size-[calc(var(--ability-size)*0.65)] col-start-2 z-1';
				}

				&:nth-of-type(2) {
					--at-apply: 'absolute top-0 end-0 size-[calc(var(--ability-size)*0.45)]';
				}
			}
		}

		> [data-aphelios-r] {
			--at-apply: 'grid-center w-[--funny-ability-w]';

			> h5 {
				--at-apply: 'translate-x-0';
			}

			> img {
				--at-apply: 'z-1';
			}
		}
	}
}
</style>
