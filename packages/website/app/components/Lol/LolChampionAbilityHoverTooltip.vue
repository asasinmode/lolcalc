<script setup lang="ts">
import type { IComputedAbilityDescription } from '@lolcalc/core/DamageSource';
import type { IChampion } from '@lolcalc/data/types';
import type { IChampionAbilityHoverTooltipProps } from '~/utils/types';
import { computeAbilityDescription } from '@lolcalc/core/DamageSource';
import { CHAMPION_IMAGES, PATCH_VERSION, useChampion } from '@lolcalc/data';

const props = withDefaults(
	defineProps<IChampionAbilityHoverTooltipProps>(),
	{
		group: 'sources',
	},
);

const { vMinor } = PATCH_VERSION;
const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;
const globalKeyModifiers = useGlobalKeyModifiers();

const champion = shallowRef<IChampion>();
const isLoading = ref(false);

watch(() => props.gameAbilityId, async (abilityId) => {
	if (abilityId) {
		isLoading.value = true;
		useChampion(abilityId.id).then((usedChampion) => {
			if (props.gameAbilityId?.id === usedChampion.id) {
				champion.value = usedChampion;
			}
			isLoading.value = false;
		});
	} else {
		champion.value = undefined;
	}
}, { immediate: true });

const computedDescription = computed<IComputedAbilityDescription | undefined>(() =>
	props.precomputedDescription || (champion.value && props.gameAbilityId
		? computeAbilityDescription(
				champion.value!,
				props.gameAbilityId,
				undefined,
				{ replaceWithName: props.replaceVariablesWithNames },
				props.abilityLevel,
			)
		: undefined),
);

const abilityKey = computed(() => computedDescription.value?.gameAbilityId.abilityKey);
const abilitySize = computed(() => props.gameAbilityId ? abilityImageSize(props.gameAbilityId.id) : 64);

const el = useTemplateRef('el');

const anyExtendedInfo = computed(() => computedDescription.value?.tooltipExtended
	|| computedDescription.value?.tooltipExtendedBelowLine
	|| computedDescription.value?.extendedVariables?.length
	|| computedDescription.value?.anyExtendedVariableInfo);

defineExpose({ el });
</script>

<template>
	<article ref="el" popover="manual" class="hover-tooltip champion-ability">
		<img
			v-show="!isLoading"
			:src="!isLoading && computedDescription ? abilityImage(computedDescription.variant.image, computedDescription.gameAbilityId.id, group) : undefined"
			:width="abilitySize"
			:height="abilitySize"
			aria-hidden="true"
		>
		<h5
			class="game-description"
			v-html="isLoading
				? 'loading...'
				: `${
					!computedDescription || abilityKey === 'passive' || (computedDescription.gameAbilityId.id === 'Aphelios' && abilityKey !== 'q' && abilityKey !== 'r') ? '' : `[${abilityKey?.toUpperCase()}] `
				} ${computedDescription?.name}`"
		/>
		<span v-show="!isLoading" :class="{ unknown: abilityKey !== 'passive' && !computedDescription?.cooldown }">
			<template v-if="abilityKey !== 'passive'">
				{{ computedDescription?.cooldown ? `${computedDescription.cooldown}s` : 'unknown' }}
				<img
					:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png`"
					width="20"
					height="20"
					aria-hidden="true"
				>
			</template>
		</span>
		<span v-show="!isLoading">
			{{ abilityKey === 'passive' ? '' : computedDescription?.cost ? `${computedDescription.cost} ${computedDescription.partype}` : 'No Cost' }}
		</span>
		<div v-show="!isLoading" class="game-description" v-html="globalKeyModifiers.shift && computedDescription?.tooltipExtended || computedDescription?.tooltip" />
		<UnresolvedVariablesAlert v-if="computedDescription?.anyUnknownVariables" />
		<footer
			v-if="(computedDescription?.tooltipExtended && computedDescription.tooltipExtended !== computedDescription.tooltip)
				|| anyExtendedInfo"
			v-show="globalKeyModifiers.shift ? (computedDescription?.tooltipExtendedBelowLine || computedDescription?.extendedVariables?.length) : anyExtendedInfo"
		>
			<div
				v-if="computedDescription?.tooltipExtendedBelowLine"
				v-show="globalKeyModifiers.shift"
				class="game-description"
				v-html="computedDescription.tooltipExtendedBelowLine"
			/>
			<dl v-show="globalKeyModifiers.shift && computedDescription?.extendedVariables">
				<template v-for="{ name, values, isNameUnknown } in computedDescription?.extendedVariables" :key="name">
					<dt :class="{ unknown: isNameUnknown }">
						{{ name }}
					</dt>
					<dd :class="{ unknown: !values?.length }">
						[
						{{ !values?.length ? 'unknown' : '' }}
						<template
							v-for="(variable, variableIndex) in values"
							:key="`${name}-${variableIndex}`"
						>
							<span
								:data-current="abilityKey
									? (variableIndex + 1 === (abilityKey === 'passive'
										? 1
										: precomputedDescription?.abilityLevel || 1)) ? '' : undefined
									: undefined"
							>
								{{ variable }}
							</span>
							{{ !values || variableIndex === (values.length - 1) ? '' : ' / ' }}
						</template>
						]
					</dd>
				</template>
			</dl>
			<p v-show="!globalKeyModifiers.shift">
				Hold <kbd>[Shift]</kbd> to show more info
			</p>
		</footer>
	</article>
</template>

<style>
@layer components {
	.hover-tooltip.champion-stat,
	.hover-tooltip.champion-rune,
	.hover-tooltip.champion-ability,
	.hover-tooltip.dragon,
	.hover-tooltip.role-quest,
	.hover-tooltip.custom,
	.hover-tooltip.effect {
		--at-apply: 'p-2';
		--description-pt: calc(2 * var(--spacing));
		--description-mt: calc(2 * var(--spacing));
		--footer-mt: calc(2 * var(--spacing));
		--footer-pt: calc(1.25 * var(--spacing));

		> h5 {
			--at-apply: 'text-lg/6 font-500 text-white';
		}

		> :where(:is(div, p).game-description) {
			--at-apply: 'mbs-0.5 b-t b-[--ui-btn-border-clr] pt-[--description-pt] leading-tight';
		}

		> p.alert {
			--at-apply: 'mbs-[--unknown-alert-mt]';
		}

		> footer {
			--at-apply: 'b-t b-[--ui-btn-border-clr] mbs-[--footer-mt] pt-[--footer-pt]';
		}
	}

	.hover-tooltip.champion-item {
		--at-apply: 'p-2';
	}

	.hover-tooltip.champion-ability,
	.hover-tooltip.effect {
		--gap-x: calc(2 * var(--spacing));
	}

	.hover-tooltip > .game-description:last-child {
		--at-apply: 'b-b-0 pb-0 mb-0';
	}

	.hover-tooltip.champion-ability {
		--at-apply: 'max-w-164 relative grid-cols-[auto_1fr_auto] auto-rows-min gap-x-[--gap-x]';
		justify-self: anchor-center;
		position-try: flip-block;
		inset-block-start: calc(anchor(end) - 1px);

		&:popover-open {
			--at-apply: 'grid';
		}

		> img {
			--at-apply: 'row-span-2 size-[--item-img-size]';
		}

		> h5 {
			--at-apply: 'row-span-2 leading-7';
		}

		> span {
			--at-apply: 'text-end text-lg';

			&:first-of-type {
				--at-apply: 'flex gap-[0.5ch] justify-end items-center text-yellow-100';
			}

			&:nth-of-type(2) {
				--at-apply: 'self-start';
			}
		}

		> div {
			--at-apply: 'col-span-full mbs-[--description-mt]';

			rules {
				--at-apply: 'italic';
			}
		}

		> p.alert {
			--at-apply: 'col-span-full';
		}

		> span.unknown,
		> footer > dl > :where(dt, dd).unknown {
			color: var(--unknown-clr);
			font-weight: 700;
		}

		> footer {
			--at-apply: 'col-span-full';

			> p {
				--at-apply: 'text-end leading-5';

				> kbd {
					--at-apply: 'font-inherit';
				}
			}

			> div {
				--at-apply: 'italic';
			}

			> dl {
				--at-apply: 'grid grid-cols-[1fr_auto] leading-5';

				&:not(:first-child) {
					--at-apply: 'mbs-1.5';
				}

				> dd {
					--at-apply: 'text-end';

					> span {
						--at-apply: 'text-neutral-400';
					}

					[data-current] {
						--at-apply: 'text-white font-500';
					}
				}
			}
		}
	}
}
</style>
