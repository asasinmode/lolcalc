<script setup lang="ts">
import type Aphelios from '../../../public/data/champion/Aphelios.json';

type IAphelios = typeof Aphelios;

defineProps<{
	value: DamageSource<'Aphelios'>;
	isLoading: boolean;
}>();

defineEmits<{
	abilityHover: [event: MouseEvent, ability: IChampionAbilityKey, variant?: number];
}>();

const { minorVersion } = usePatchVersion();
</script>

<template>
	<div data-passive="">
		<h5>passive</h5>
		<img
			:src="!isLoading && value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.passive.variants[value.abilityVariants.value.passive]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'passive')"
		>
	</div>
	<div data-aphelios-q="" :data-level="value.level.value >= 2 ? 1 : undefined">
		<h5>main weapon</h5>
		<img
			:src="!isLoading && value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.q]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e')"
		>
		<h5>Q</h5>
		<img
			:src="!isLoading && value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.q.variants[value.abilityVariants.value.q]?.image}` : undefined"
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
			:src="!isLoading && value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.w]?.imageAlt}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e', value.abilityVariants.value.w)"
		>
		<h5>next weapon</h5>
		<img
			:src="!isLoading && value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${(value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariants.value.e]?.imageAlt}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'e', value.abilityVariants.value.e)"
		>
	</div>
	<div data-aphelios-r="" :data-level="value.level.value >= 6 ? 1 : undefined">
		<h5>R</h5>
		<img
			:src="!isLoading && value.champion.value ? `https://raw.communitydragon.org/${minorVersion}/game/${value.champion.value.abilities.r.variants[value.abilityVariants.value.r]?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, 'r')"
		>
	</div>
</template>

<style>
@layer overrides {
	#scoreboard > div > ul > [data-scoreboard-item='Aphelios'] > details > [data-abilities] {
		--at-apply: 'gap-x-0';
		--aphelios-border-clr: theme('colors.slate.300');
		/* radius of the funny border */
		--funny-rounded: 20% / 50%;
		/* radius of the image inside of the funny border, its overflow is not clipped in any way so it needs to be the smallest it can be to still not go outside of the border around it */
		--image-funny-rounded: 15% / 15%;
		--funny-ability-w: calc(var(--ability-size) * 10 / 9);

		> [data-passive] {
			--at-apply: 'b-none size-auto pe-2';
			--ui-button-border-clr: var(--aphelios-border-clr);

			> h5 {
				--at-apply: 'sr-only';
			}

			> img {
				--at-apply: 'size-[--ability-size-passive] rounded-1/2 b-2 b-[--ui-button-border-clr]';
			}
		}

		> [data-aphelios-q] > h5:first-of-type,
		> [data-aphelios-w] > h5:nth-of-type(n + 2) {
			--at-apply: 'sr-only';
		}

		> [data-aphelios-q],
		> [data-aphelios-w],
		> [data-aphelios-r] {
			--ui-button-border-clr: var(--aphelios-border-clr);
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
			--at-apply: 'flex items-center z-1 pe-[calc((var(--funny-ability-w)-var(--ability-size))/2)]';

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
			--at-apply: 'grid grid-cols-[auto_1fr_auto] place-items-center grid-rows-1';

			&::after {
				--at-apply: 'z-0 content-empty bg-black col-start-2 row-start-1 b b-[--ui-button-border-clr] size-[calc(var(--ability-size)*0.7)] rounded-1/2';
			}

			> h5:first-of-type {
				--at-apply: 'text-center static -mx-1 h-5.5 w-6 bg-black b-y b-[--ui-button-border-clr] text-sm translate-0 z-0 leading-5 relative';

				&::before,
				&::after {
					--at-apply: 'absolute content-empty h-1.25 w-1.75 bg-[--ui-button-border-clr]';
				}

				&::before {
					--at-apply: '-translate-y-full top-0 end-0 -translate-x-0.25';
					clip-path: polygon(0% 0%, 100% 100%, 0% 100%);
				}

				&::after {
					--at-apply: 'translate-y-full bottom-0 start-0 translate-x-0.5';
					clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
				}
			}

			> img {
				&:nth-of-type(1) {
					--at-apply: 'size-[calc(var(--ability-size)*0.55)] col-start-2 row-start-1 z-1';
				}

				&:nth-of-type(2) {
					--at-apply: 'size-[calc(var(--ability-size)*0.45)] b b-[--ui-button-border-clr] rounded-1/2 self-start -mt-1/3 -ms-1/3';
				}
			}
		}

		> [data-aphelios-r] {
			--at-apply: 'grid-center w-[--funny-ability-w] ms-auto';

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
