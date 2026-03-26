<script setup lang="ts">
import type { IChampionAbilityHoverTooltipProps } from '~/utils/types';

const props = defineProps<IChampionAbilityHoverTooltipProps>();

const { minorVersion } = usePatchVersion();
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

const hoveredAbility = computed(() => {
	if (!isLoading.value && props.abilityKey && props.abilityVariant !== undefined && champion.value) {
		return champion.value.abilities[props.abilityKey];
	}
	return undefined;
});

const hoveredAbilityVariant = computed(() =>
	props.abilityVariant !== undefined ? hoveredAbility.value?.variants[props.abilityVariant] : undefined,
);

const championAllAbilityVariants = computed(() => allChampionAbilityVariants(champion.value));

const onHitIcon = `<img src="https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON_NAMES.OnHit}.png" width="20" height="20" aria-hidden="true">`;

const hoveredAbilityTooltipText = computed(() => {
	if (!hoveredAbilityVariant.value) {
		return undefined;
	}

	const abilityLevel = props.abilityKey !== 'passive' ? props.abilityLevel || 1 : undefined;

	const { replaced: nameReplaced, unknownStringtableVariables: nameUnknownSV } = replaceGameDescriptionStringtableVariables(
		hoveredAbilityVariant.value.name,
		champion.value?.stringtable,
	);

	const {
		replaced: tooltipReplaced,
		unknownSV: tooltipUnknownSV,
		unknownV: tooltipUnknownV,
		variablesAllValues: tooltipVariablesAV,
	} = abilityVariantText(
		onHitIcon,
		championAllAbilityVariants.value,
		hoveredAbilityVariant.value.tooltip || '<unknown>UNKNOWN</unknown>',
		hoveredAbilityVariant.value,
		abilityLevel,
		champion.value?.stringtable,
	);
	const {
		replaced: tooltipExtendedReplaced,
		unknownSV: tooltipExtendedUnknownSV,
		unknownV: tooltipExtendedUnknownV,
		variablesAllValues: tooltipExtendedVariablesAV,
	} = abilityVariantText(
		onHitIcon,
		championAllAbilityVariants.value,
		hoveredAbilityVariant.value.tooltipExtended || '',
		hoveredAbilityVariant.value,
		abilityLevel,
		champion.value?.stringtable,
	);
	const {
		replaced: tooltipExtendedBelowLineReplaced,
		unknownSV: tooltipExtendedBelowLineUnknownSV,
		unknownV: tooltipExtendedBelowLineUnknownV,
	} = abilityVariantText(
		onHitIcon,
		championAllAbilityVariants.value,
		hoveredAbilityVariant.value.tooltipExtendedBelowLine || '',
		hoveredAbilityVariant.value,
		abilityLevel,
		champion.value?.stringtable,
	);

	const cooldown = hoveredAbilityVariant.value.cooldownTime?.[abilityLevel ?? 1];
	const cost = hoveredAbilityVariant.value.mana?.[abilityLevel ?? 1];
	const lastExtendedVariableIndex = hoveredAbility.value!.maxLevel + 1;

	let extendedVariables: {
		name: string;
		values?: number[];
		isNameUnknown?: boolean;
	}[] | undefined = hoveredAbilityVariant.value.extendedVariables?.map((variable) => {
		let isNameUnknown = false;
		let name;

		if (variable.nameOverride) {
			name = champion.value?.stringtable[variable.nameOverride];
			if (!name) {
				isNameUnknown = true;
			}
		}

		name ||= variable.type;

		return {
			name,
			values: (tooltipVariablesAV.get(variable.type) || tooltipExtendedVariablesAV.get(variable.type))?.slice(1, lastExtendedVariableIndex),
			isNameUnknown,
		};
	});

	if (cooldown) {
		extendedVariables ||= [];
		extendedVariables.push({
			name: 'Cooldown',
			values: hoveredAbilityVariant.value.cooldownTime!.slice(1, lastExtendedVariableIndex),
		});
	}

	// TODO detect unknown cost/cooldown
	const anyUnknownVariables = nameUnknownSV.size || tooltipUnknownSV.size || tooltipUnknownV.length || tooltipExtendedUnknownSV.size || tooltipExtendedUnknownV.length || tooltipExtendedBelowLineUnknownSV.size || tooltipExtendedBelowLineUnknownV.length;

	return {
		name: nameReplaced,
		tooltip: tooltipReplaced,
		tooltipExtended: tooltipExtendedReplaced,
		tooltipExtendedBelowLine: tooltipExtendedBelowLineReplaced,
		anyUnknownVariables,
		cooldown,
		cost,
		extendedVariables,
	};
});

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<div ref="el" popover="hint" class="hover-tooltip champion-ability">
		<img
			v-show="!isLoading"
			:src="!isLoading && hoveredAbilityVariant ? `https://raw.communitydragon.org/${minorVersion}/game/${hoveredAbilityVariant.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
		>
		<h5
			class="game-description"
			v-html="isLoading
				? 'loading...'
				: `${
					!abilityKey || abilityKey === 'passive' || (championId === 'Aphelios' && abilityKey !== 'q' && abilityKey !== 'r') ? '' : `[${abilityKey.toUpperCase()}] `
				} ${hoveredAbilityTooltipText?.name}`"
		/>
		<span v-show="!isLoading" :class="{ unknown: abilityKey !== 'passive' && !hoveredAbilityTooltipText?.cooldown }">
			<template v-if="abilityKey !== 'passive'">
				{{ hoveredAbilityTooltipText?.cooldown ? `${hoveredAbilityTooltipText.cooldown}s` : 'unknown' }}
				<img
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png`"
					width="20"
					height="20"
					aria-hidden="true"
				>
			</template>
		</span>
		<span v-show="!isLoading">
			{{ abilityKey === 'passive' ? '' : hoveredAbilityTooltipText?.cost ? `${hoveredAbilityTooltipText.cost} ${champion?.partype}` : 'No Cost' }}
		</span>
		<div v-show="!isLoading" class="game-description" v-html="globalKeyModifiers.shift && hoveredAbilityTooltipText?.tooltipExtended || hoveredAbilityTooltipText?.tooltip" />
		<UnresolvedVariablesAlert v-if="hoveredAbilityTooltipText?.anyUnknownVariables" />
		<footer v-if="hoveredAbilityTooltipText?.tooltipExtended || hoveredAbilityTooltipText?.tooltipExtendedBelowLine || hoveredAbilityTooltipText?.extendedVariables?.length">
			<div
				v-if="hoveredAbilityTooltipText?.tooltipExtendedBelowLine"
				v-show="globalKeyModifiers.shift"
				v-html="hoveredAbilityTooltipText.tooltipExtendedBelowLine"
			/>
			<dl v-show="globalKeyModifiers.shift && hoveredAbilityTooltipText?.extendedVariables">
				<template v-for="{ name, values, isNameUnknown } in hoveredAbilityTooltipText?.extendedVariables" :key="name">
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
			--at-apply: 'row-span-2';
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
