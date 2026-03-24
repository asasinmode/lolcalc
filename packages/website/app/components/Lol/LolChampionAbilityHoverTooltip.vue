<script setup lang="ts">
const props = defineProps<{
	championId?: IChampionId;
	abilityKey?: IChampionAbilityKey;
	abilityVariant?: number;
	abilityLevel?: number;
}>();

const { minorVersion } = usePatchVersion();
const globalKeyModifiers = useGlobalKeyModifiers();

const champion = shallowRef<IChampion>();
const isLoading = ref(false);

watch(() => props.championId, async (id) => {
	isLoading.value = true;
	champion.value = id && await useChampion(id);
	isLoading.value = false;
}, { immediate: true });

const hoveredAbility = computed(() => {
	if (props.abilityKey && props.abilityVariant !== undefined && champion.value) {
		return champion.value.abilities[props.abilityKey];
	}
	return undefined;
});

const hoveredAbilityVariant = computed(() =>
	props.abilityVariant !== undefined ? hoveredAbility.value?.variants[props.abilityVariant] : undefined,
);

const championAllAbilityVariants = computed(() => allChampionAbilityVariants(champion.value));

const hoveredAbilityTooltipText = computed(() => {
	if (!hoveredAbilityVariant.value) {
		return undefined;
	}

	const abilityLevel = props.abilityKey !== 'passive' ? props.abilityLevel : undefined;

	const { replaced: nameReplaced, unknownStringtableVariables: nameUnknownSV } = replaceGameDescriptionStringtableVariables(
		hoveredAbilityVariant.value.name,
		champion.value?.stringtable,
	);

	const { replaced: tooltipReplaced, unknownSV: tooltipUnknownSV, unknownV: tooltipUnknownV } = abilityText(
		hoveredAbilityVariant.value.tooltip || '<unknown>UNKNOWN</unknown>',
		hoveredAbilityVariant.value,
		champion.value?.stringtable,
		abilityLevel,
	);
	const { replaced: tooltipExtendedReplaced, unknownSV: tooltipExtendedUnknownSV, unknownV: tooltipExtendedUnknownV } = abilityText(
		hoveredAbilityVariant.value.tooltipExtended || '',
		hoveredAbilityVariant.value,
		champion.value?.stringtable,
		abilityLevel,
	);
	const { replaced: tooltipExtendedBelowLineReplaced, unknownSV: tooltipExtendedBelowLineUnknownSV, unknownV: tooltipExtendedBelowLineUnknownV } = abilityText(
		hoveredAbilityVariant.value.tooltipExtendedBelowLine || '',
		hoveredAbilityVariant.value,
		champion.value?.stringtable,
		abilityLevel,
	);

	const cooldown = hoveredAbilityVariant.value.cooldownTime?.[abilityLevel ?? 1];
	const cost = hoveredAbilityVariant.value.mana?.[abilityLevel ?? 1];

	const extendedVariableInfo: [string, number[]][] = [];

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
		extendedVariableInfo,
	};
});

function abilityText(value: string, variant: IChampionAbilityVariant, stringtable?: Record<string, string>, level?: number) {
	const { replaced: stringtableReplaced, unknownStringtableVariables } = replaceGameDescriptionStringtableVariables(
		value,
		stringtable,
	);

	const { replaced, unknownVariables } = replaceGameDescriptionVariables(
		stringtableReplaced,
		'championAbility',
		[variant, level, championAllAbilityVariants.value],
	);

	return { replaced: replaceGameDescriptionIcons(replaced), unknownSV: unknownStringtableVariables, unknownV: unknownVariables };
}

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<template>
	<div ref="el" popover="hint" class="hover-tooltip champion-ability">
		<img
			v-show="!isLoading"
			:src="!isLoading && hoveredAbilityVariant ? `https://raw.communitydragon.org/${minorVersion}/game/${hoveredAbilityVariant?.image}` : undefined"
			width="64"
			height="64"
			aria-hidden="true"
		>
		<h5
			class="game-description"
			v-html="`${!abilityKey || abilityKey === 'passive' || (championId === 'Aphelios' && abilityKey !== 'q' && abilityKey !== 'r') ? '' : `[${abilityKey.toUpperCase()}] `} ${hoveredAbilityTooltipText?.name}`"
		/>
		<span>
			<template v-if="abilityKey !== 'passive'">
				<template v-if="hoveredAbilityTooltipText?.cooldown">
					{{ hoveredAbilityTooltipText?.cooldown }}s
				</template>
				<Unknown v-else>UNKNOWN</Unknown>
				<img
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png`"
					width="20"
					height="20"
					aria-hidden="true"
				>
			</template>
		</span>
		<span>
			{{ abilityKey === 'passive' ? '' : hoveredAbilityTooltipText?.cost ? `${hoveredAbilityTooltipText.cost} ${champion?.partype}` : 'No Cost' }}
		</span>
		<div class="game-description" v-html="globalKeyModifiers.shift && hoveredAbilityTooltipText?.tooltipExtended || hoveredAbilityTooltipText?.tooltip" />
		<UnresolvedVariablesAlert v-if="hoveredAbilityTooltipText?.anyUnknownVariables" class="col-span-full" />
		<footer v-if="hoveredAbilityTooltipText?.tooltipExtended || hoveredAbilityTooltipText?.tooltipExtendedBelowLine || hoveredAbilityTooltipText?.extendedVariableInfo.length">
			<div
				v-if="hoveredAbilityTooltipText?.tooltipExtendedBelowLine"
				v-show="globalKeyModifiers.shift"
				v-html="hoveredAbilityTooltipText.tooltipExtendedBelowLine"
			/>
			<dl v-show="globalKeyModifiers.shift && hoveredAbilityTooltipText?.extendedVariableInfo">
				<template v-for="[variableName, variableValues] in hoveredAbilityTooltipText?.extendedVariableInfo" :key="variableName">
					<dt>
						{{ variableName }}
					</dt>
					<dd>
						[
						<template
							v-for="(variable, variableIndex) in variableValues"
							:key="`${variableName}-${variableIndex}`"
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
							{{ variableIndex === (variableValues.length - 1) ? '' : ' / ' }}
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
	.hover-tooltip.champion-ability {
		--at-apply: 'max-w-160 relative grid-cols-[auto_1fr_auto] auto-rows-min';
		justify-self: anchor-center;
		position-anchor: --scoreboard-item-abilities;
		position-try: flip-block;
		top: calc(anchor(bottom) - 1px);

		&:popover-open {
			--at-apply: 'grid';
		}

		> img {
			--at-apply: 'row-span-2';
		}

		> h5 {
			--at-apply: 'row-span-2';
		}

		> span {
			--at-apply: 'text-end text-lg';

			&:first-of-type {
				--at-apply: 'flex gap-[0.5ch] justify-end items-center text-yellow-100';

				img {
					--at-apply: '';
				}
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

		> footer {
			--at-apply: 'col-span-full';

			> p {
				--at-apply: 'text-end';
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
