<script setup lang="ts">
import type { IChampionAbilityHoverTooltipProps } from '~/utils/types';

const props = defineProps<IChampionAbilityHoverTooltipProps>();

const { minorVersion } = usePatchVersion();
const { abilityImage, abilityImageSize } = useChampionImages();
const globalKeyModifiers = useGlobalKeyModifiers();

const champion = shallowRef<IChampion>();
const isLoading = ref(false);

watch(() => props.championId, async (id) => {
	if (id) {
		isLoading.value = true;
		useChampion(id).then((usedChampion) => {
			if (props.championId === usedChampion.id) {
				champion.value = usedChampion;
			}
			isLoading.value = false;
		});
	} else {
		champion.value = undefined;
	}
}, { immediate: true });

const ability = computed(() => {
	if (!isLoading.value && props.abilityKey && props.abilityVariant !== undefined && champion.value) {
		return champion.value.abilities[props.abilityKey];
	}
	return undefined;
});

const variant = computed(() =>
	props.abilityVariant !== undefined ? ability.value?.variants[props.abilityVariant] : undefined,
);

const computedDescription = computed<IComputedAbilityDescription | undefined>(() =>
	props.precomputedDescription || (champion.value && props.abilityKey && props.abilityVariant !== undefined
		? computedAbilityDescription(
				minorVersion,
				champion.value!,
				props.abilityKey,
				props.abilityVariant,
				props.abilityLevel,
				undefined,
				{ replaceWithName: props.replaceVariablesWithNames },
			)
		: undefined),
);

const abilitySize = computed(() => props.championId ? abilityImageSize(props.championId) : 64);

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<div ref="el" popover="hint" class="hover-tooltip champion-ability">
		<img
			v-show="!isLoading"
			:src="!isLoading && variant ? abilityImage(variant.image, championId!, group) : undefined"
			:width="abilitySize"
			:height="abilitySize"
			aria-hidden="true"
		>
		<h5
			class="game-description"
			v-html="isLoading
				? 'loading...'
				: `${
					!abilityKey || abilityKey === 'passive' || (championId === 'Aphelios' && abilityKey !== 'q' && abilityKey !== 'r') ? '' : `[${abilityKey.toUpperCase()}] `
				} ${computedDescription?.name}`"
		/>
		<span v-show="!isLoading" :class="{ unknown: abilityKey !== 'passive' && !computedDescription?.cooldown }">
			<template v-if="abilityKey !== 'passive'">
				{{ computedDescription?.cooldown ? `${computedDescription.cooldown}s` : 'unknown' }}
				<img
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png`"
					width="20"
					height="20"
					aria-hidden="true"
				>
			</template>
		</span>
		<span v-show="!isLoading">
			{{ abilityKey === 'passive' ? '' : computedDescription?.cost ? `${computedDescription.cost} ${champion?.partype}` : 'No Cost' }}
		</span>
		<div v-show="!isLoading" class="game-description" v-html="globalKeyModifiers.shift && computedDescription?.tooltipExtended || computedDescription?.tooltip" />
		<UnresolvedVariablesAlert v-if="computedDescription?.anyUnknownVariables" />
		<footer v-if="computedDescription?.tooltipExtended || computedDescription?.tooltipExtendedBelowLine || computedDescription?.extendedVariables?.length">
			<div
				v-if="computedDescription?.tooltipExtendedBelowLine"
				v-show="globalKeyModifiers.shift"
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
										: abilityLevel || 1)) ? '' : undefined
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
				Press [Shift] to show more info
			</p>
		</footer>
	</div>
</template>

<style>
@layer components {
	.hover-tooltip.champion-stat,
	.hover-tooltip.champion-rune,
	.hover-tooltip.champion-ability,
	.hover-tooltip.dragon-thing,
	.hover-tooltip.role-quest {
		--at-apply: 'p-2';

		> h5 {
			--at-apply: 'text-lg/6 font-500 text-white';
		}

		> :where(:is(div, p).game-description) {
			--at-apply: 'mt-0.5 b-b b-t b-[--ui-button-border-clr] pt-1.5 pb-1 mb-1.25 leading-4.5';
		}
	}

	.hover-tooltip.champion-item {
		--at-apply: 'p-2';
	}

	.hover-tooltip > .game-description:last-child {
		--at-apply: 'b-b-0 pb-0 mb-0';
	}

	.hover-tooltip.champion-ability {
		--at-apply: 'max-w-160 relative grid-cols-[auto_1fr_auto] auto-rows-min';
		justify-self: anchor-center;
		position-try: flip-block;
		inset-block-start: calc(anchor(end) - 1px);

		&:popover-open {
			--at-apply: 'grid';
		}

		> img {
			--at-apply: 'row-span-2 size-16';
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
			--at-apply: 'col-span-full mt-2';

			rules {
				--at-apply: 'italic';
			}
		}

		> p.alert {
			--at-apply: 'col-span-full';
		}

		> span.unknown,
		> footer > dl > :where(dt, dd).unknown {
			color: #ff00ff;
			font-weight: 700;
		}

		> footer {
			--at-apply: 'col-span-full';

			> p {
				--at-apply: 'text-end leading-5';
			}

			> div {
				--at-apply: 'italic';
			}

			> dl {
				--at-apply: 'grid grid-cols-[1fr_auto] leading-5';

				&:not(:first-child) {
					--at-apply: 'mt-1.5';
				}

				> dd {
					--at-apply: 'text-end';

					> span {
						--at-apply: 'text-neutral-400';
					}

					[data-current] {
						--at-apply: 'text-white font-medium';
					}
				}
			}
		}
	}
}
</style>
