<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type Aphelios from '@lolcalc/data/files/champion/Aphelios.json';
import type { IExtraComponentEmits } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { CHAMPION_IMAGES } from '@lolcalc/data';

type IAphelios = typeof Aphelios;

const props = defineProps<{
	value: DamageSource<'Aphelios'>;
	isLoading: boolean;
	idPrefix: string;
}>();

const emit = defineEmits<{
	abilityHover: IExtraComponentEmits['imgMouseenter'];
}>();

const enableUnimplementedUi = useEnableUnimplementedUi();
const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

const passiveAbilityId = GameAbilityId.build('champion', 'Aphelios', 'passive', 0);
const rAbilityId = GameAbilityId.build('champion', 'Aphelios', 'r', 0);

const abilitySize = abilityImageSize('Aphelios');

const { WEAPON_VARIANT_INDEX_TO_NAME, WEAPON_NAME_TO_STRINGTABLE_INDEX } = CHAMPION_SPECIFICS.Aphelios;

const weaponNames = computed(() => {
	if (!props.value.champion.value) {
		return {};
	}

	const { q, w, e } = props.value.abilityVariantsIndexes.value;
	const { stringtable } = props.value.champion.value as IAphelios;
	const stringtableKeyPrefix = 'apheliosgun_name_';

	return {
		main: stringtable[`${stringtableKeyPrefix}${WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[q]!]}` as keyof typeof stringtable],
		offhand: stringtable[`${stringtableKeyPrefix}${WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[w]!]}` as keyof typeof stringtable],
		next: stringtable[`${stringtableKeyPrefix}${WEAPON_NAME_TO_STRINGTABLE_INDEX[WEAPON_VARIANT_INDEX_TO_NAME[e]!]}` as keyof typeof stringtable],
	};
});

function switchMainOffhand(event: MouseEvent) {
	const abilityVariantsIndexes = props.value.abilityVariantsIndexes.value;
	abilityVariantsIndexes.q += abilityVariantsIndexes.w;
	abilityVariantsIndexes.w = abilityVariantsIndexes.q - abilityVariantsIndexes.w;
	abilityVariantsIndexes.q -= abilityVariantsIndexes.w;
	emit('abilityHover', event, GameAbilityId.build('champion', 'Aphelios', 'e', abilityVariantsIndexes.w));
}

function replaceMainWithNext(event: MouseEvent) {
	const abilityVariantsIndexes = props.value.abilityVariantsIndexes.value;

	abilityVariantsIndexes.q = abilityVariantsIndexes.e;

	let next = (abilityVariantsIndexes.q + 1) % WEAPON_VARIANT_INDEX_TO_NAME.length;
	while (next === abilityVariantsIndexes.q || next === abilityVariantsIndexes.w) {
		next = (next + 1) % WEAPON_VARIANT_INDEX_TO_NAME.length;
	}

	abilityVariantsIndexes.e = next;
	emit('abilityHover', event, GameAbilityId.build('champion', 'Aphelios', 'e', abilityVariantsIndexes.e));
}
</script>

<template>
	<div data-ability="passive">
		<h5>passive</h5>
		<img
			:src="!isLoading && value.champion.value ? abilityImage(value.champion.value.abilities.passive.variants[value.abilityVariantsIndexes.value.passive]!.image, 'Aphelios') : undefined"
			:width="abilitySize"
			:height="abilitySize"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, passiveAbilityId)"
		>
		<a
			v-show="value.champion.value"
			class="wiki-link"
			:href="`https://wiki.leagueoflegends.com/en-us/${value.champion.value?.name.replaceAll(' ', '_')}`"
			target="_blank"
		>
			wiki
		</a>
	</div>
	<ComingSoonCover feature="abilities" class="text-white end-0 start-[calc(var(--ability-size-passive)+0.25*var(--abilities-gap))] bottom-0 absolute -top-2" />
	<div class="aphelios-q" :data-level="value.level.value >= 2 ? 1 : undefined" :inert="!enableUnimplementedUi">
		<h5 v-html="`main weapon: ${weaponNames.main}`" />
		<img
			:src="!isLoading && value.champion.value ? abilityImage((value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariantsIndexes.value.q]!.image, 'Aphelios') : undefined"
			:width="abilitySize"
			:height="abilitySize"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, GameAbilityId.build('champion', 'Aphelios', 'e', 0))"
		>
		<h5>Q</h5>
		<img
			:src="!isLoading && value.champion.value ? abilityImage(value.champion.value.abilities.q.variants[value.abilityVariantsIndexes.value.q]!.image, 'Aphelios') : undefined"
			:width="abilitySize"
			:height="abilitySize"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, GameAbilityId.build('champion', 'Aphelios', 'q', value.abilityVariantsIndexes.value.q))"
		>
	</div>
	<div class="aphelios-w" :inert="!enableUnimplementedUi">
		<h5>W</h5>
		<h5 v-html="`offhand weapon: ${weaponNames.offhand}`" />
		<button
			title="switch with main"
			@click="switchMainOffhand"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, GameAbilityId.build('champion', 'Aphelios', 'e', value.abilityVariantsIndexes.value.w))"
		>
			<span>switch with main</span>
			<img
				:src="!isLoading && value.champion.value ? abilityImage((value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariantsIndexes.value.w]!.imageAlt, 'Aphelios') : undefined"
				:width="abilitySize"
				:height="abilitySize"
				aria-hidden="true"
			>
		</button>
		<h5 v-html="`next weapon: ${weaponNames.next}`" />
		<button
			title="replace offhand"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, GameAbilityId.build('champion', 'Aphelios', 'e', value.abilityVariantsIndexes.value.e))"
			@click="replaceMainWithNext"
		>
			<span>replace offhand</span>
			<img
				:src="!isLoading && value.champion.value ? abilityImage((value.champion.value as unknown as IAphelios).abilities.e.variants[value.abilityVariantsIndexes.value.e]!.imageAlt, 'Aphelios') : undefined"
				:width="abilitySize"
				:height="abilitySize"
				aria-hidden="true"
			>
		</button>
	</div>
	<div class="aphelios-r" :data-level="value.abilityLevels.value.r || undefined" :inert="!enableUnimplementedUi">
		<h5>R</h5>
		<img
			:src="!isLoading && value.champion.value ? abilityImage(value.champion.value.abilities.r.variants[value.abilityVariantsIndexes.value.r]!.image, 'Aphelios') : undefined"
			:width="abilitySize"
			:height="abilitySize"
			aria-hidden="true"
			@mouseenter="value.champion.value && $emit('abilityHover', $event, rAbilityId)"
		>
		<div class="pretend-level-radiogroup">
			<span>r level: {{ value.abilityLevels.value.r }}</span>
			<div v-for="i in 3" :key="i" aria-hidden="true" :data-checked="i === value.abilityLevels.value.r" />
		</div>
	</div>
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Aphelios'] {
		--aphelios-ui-clr: theme('colors.slate.300');
	}

	[data-scoreboard-item='Aphelios'] .abilities {
		--at-apply: 'gap-x-0';
		/* radius of the funny border */
		--funny-rounded: 20% / 50%;
		/* radius of the image inside of the funny border, its overflow is not clipped in any way so it needs to be the smallest it can be to still not go outside of the border around it */
		--image-funny-rounded: 17.5% / 50%;
		--funny-ability-w: calc(var(--ability-size) * 10 / 9);
		--q-ability-size: calc(var(--ability-size) + 1.5 * var(--spacing));

		@media (width < 1680px) and ((width >= 1079px) or (width < 840px)) {
			& {
				margin-block-end: calc(
					var(--ability-level-buttons-size) - (var(--q-ability-size) - var(--ability-size)) / 2 - 1px
				);
			}
		}

		> [data-ability='passive'] {
			--at-apply: 'b-none size-auto pe-2';

			> h5 {
				--at-apply: 'sr-only';
			}

			> img {
				--at-apply: 'size-[--ability-size-passive] rounded-1/2 b-2 b-[--aphelios-ui-clr]';
			}
		}

		> .aphelios-q > h5:first-of-type,
		> .aphelios-w > button > span,
		> .aphelios-w > h5:nth-of-type(n + 2) {
			--at-apply: 'sr-only';
		}

		> .aphelios-q,
		> .aphelios-w,
		> .aphelios-r {
			--at-apply: 'relative h-[--ability-size]';

			> h5 {
				--at-apply: 'absolute start-0 bottom-0 leading-[1] -translate-x-1/2 translate-y-1/3 pointer-events-none z-2';

				-webkit-text-stroke: black 0.1em;
				paint-order: stroke fill;
			}
		}

		> .aphelios-q,
		> .aphelios-r {
			&::after,
			&::before {
				--at-apply: 'content-empty block w-[--funny-ability-w] h-[--ability-size] rounded-[--funny-rounded] absolute end-0 top-0 top-1/2 -translate-y-1/2 pointer-events-none';
			}

			&::before {
				--at-apply: 'z-0 bg-black';
			}

			&::after {
				--at-apply: 'z-1 b b-2 b-[--aphelios-ui-clr]';
			}
		}

		> .aphelios-q,
		> .aphelios-r {
			&:not([data-level])::after {
				--at-apply: 'b-neutral-400';
			}
		}

		> .aphelios-q > img:nth-of-type(2),
		> .aphelios-r > img {
			--at-apply: 'size-[--ability-size] rounded-[--image-funny-rounded] b-2 b-transparent';
		}

		> .aphelios-q:not([data-level]) > img:nth-of-type(2),
		> .aphelios-r:not([data-level]) > img {
			--at-apply: 'grayscale-70 brightness-80';
		}

		> .aphelios-q {
			--at-apply: 'flex items-center z-1 pe-[calc((var(--funny-ability-w)-var(--ability-size))/2)]';

			> h5 {
				--at-apply: 'start-[--ability-size]';
			}

			> img {
				&:nth-of-type(1) {
					--at-apply: 'b-2 b-[--aphelios-ui-clr] size-[--q-ability-size] -my-0.75 rounded-1/2 z-2 -me-3.5';
				}

				&:nth-of-type(2) {
					--at-apply: 'z-0';
				}
			}
		}

		> .aphelios-w {
			--at-apply: 'grid grid-cols-[auto_1fr_auto] place-items-center grid-rows-1';

			> h5:first-of-type {
				--at-apply: 'text-center static -mx-1 h-5.5 w-6 bg-black b-y b-[--aphelios-ui-clr] text-sm translate-0 z-0 leading-5 relative';

				&::before,
				&::after {
					--at-apply: 'absolute content-empty h-1.25 w-1.75 bg-[--aphelios-ui-clr]';
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

			> button {
				&:nth-of-type(1) {
					--at-apply: 'z-1 size-[calc(var(--ability-size)*0.7)] rounded-1/2 grid-center bg-black b b-[--aphelios-ui-clr]';

					> img {
						--at-apply: 'size-[calc(var(--ability-size)*0.55)]';
					}
				}

				&:nth-of-type(2) {
					--at-apply: 'b b-[--aphelios-ui-clr] rounded-1/2 self-start -mt-1/3 -ms-1/3';

					> img {
						--at-apply: 'size-[calc(var(--ability-size)*0.45)] rounded-inherit';
					}
				}
			}
		}

		> .aphelios-r {
			--at-apply: 'grid-center w-[--funny-ability-w] ms-auto';

			> h5 {
				--at-apply: 'translate-x-0';
			}

			> img {
				--at-apply: 'z-1';
			}

			> .pretend-level-radiogroup {
				--at-apply: 'flex gap-0.5 py-[--ability-level-btn-py]';

				> span {
					--at-apply: 'sr-only';
				}

				> div {
					--at-apply: 'block b b-[--ui-btn-border-clr] size-[--ability-level-btn-indicator-size] rounded-full bg-black';

					&[data-checked='true'],
					&:has(~ [data-checked='true']) {
						--at-apply: 'bg-[--ui-btn-border-clr]';
					}
				}
			}
		}
	}
}
</style>
