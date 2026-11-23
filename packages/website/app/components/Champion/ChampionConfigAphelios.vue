<script setup vapor lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { CHAMPION_IMAGES } from '@lolcalc/data';
import type { IChampionAbilityKey, INonPassiveAbilityKey } from '@lolcalc/shared';
import { AbilityType } from '@lolcalc/shared';
import type { IExtraComponentProps } from '~/utils/types';

const props = defineProps<IExtraComponentProps>();

const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

const imgSize = abilityImageSize('Aphelios');

function resetAbilityLevel(event: MouseEvent, ability: INonPassiveAbilityKey) {
	event.preventDefault();
	props.damageSource.abilityLevels.value[ability] = 0;
}

const { gravitum: gravitumVariantIndex } = CHAMPION_SPECIFICS.Aphelios.WEAPON_NAME_TO_VARIANT_INDEX;
const showGravitumComponent = computed(() => props.damageSource.abilityVariantsIndexes.value.q === gravitumVariantIndex || props.damageSource.abilityVariantsIndexes.value.w === gravitumVariantIndex);

const GravitumSlowComponent = progressConfigEl(GameAbilityId.build(AbilityType.champion, 'Aphelios', 'e', gravitumVariantIndex), 'gravitumSlowProgress', 'apply Gravitum slow on target', CHAMPION_SPECIFICS.Aphelios.q.derivedGravitumSlow);

const gravitumDamageSource = shallowRef<DamageSource>(props.damageSource);

watch(
	props.damageSource.getWatchable(),
	() => {
		gravitumDamageSource.value = props.damageSource.clone(
			{
				abilityVariants: {
					q: gravitumVariantIndex,
				},
			},
			true,
		);
		gravitumDamageSource.value.champion.value = props.damageSource.champion.value;
	},
	{ immediate: true },
);

const tooltipTriggerBind = (props.tooltipTriggerAttrs as Extract<IExtraComponentProps['tooltipTriggerAttrs'], Function>)?.(GameAbilityId.build(AbilityType.champion, 'Aphelios', 'passive', 0));
</script>

<template>
	<article class="config-el-aphelios-ability-levels">
		<img :src="abilityImage(damageSource.computed.abilities.value.passive[damageSource.abilityVariantsIndexes.value.passive]!.image, 'Aphelios')" :width="imgSize" :height="imgSize" aria-hidden="true" v-bind="tooltipTriggerBind" />
		<h5>"ability" levels</h5>
		<VButtonRadiogroup
			v-for="abilityKey in ['q', 'w', 'e'] satisfies IChampionAbilityKey[]"
			:id="`ability-${abilityKey}-${idSuffix}`"
			:key="abilityKey"
			v-model="damageSource.abilityLevels.value[abilityKey]"
			:label="`&quot;${abilityKey}&quot; level`"
			:options="
				Array.from({ length: damageSource.maxAbilityLevels.value[abilityKey] }, (_, index) => ({
					level: index + 1,
				}))
			"
			value-key="level"
			:data-ability-key="abilityKey"
			:clear-value="0"
			:style="`--btns-count: ${damageSource.maxAbilityLevels.value[abilityKey]}`"
			@option-right-click="(event) => resetAbilityLevel(event, abilityKey)"
		>
			<template #default="{ option }">
				<span>{{ option.level }}</span>
			</template>
		</VButtonRadiogroup>
		<span aria-hidden="true">ability levels</span>
	</article>
	<GravitumSlowComponent v-if="showGravitumComponent" v-bind="$props" :override-damage-source="gravitumDamageSource" class="config-el-aphelios-gravitum-slow" />
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Aphelios'] {
		.config-el-aphelios-ability-levels {
			--at-apply: 'grid grid-cols-[auto_max-content_minmax(0,1fr)] grid-rows-[1fr_auto_1fr] gap-y-0.75 relative grid-flow-col';

			> img {
				--at-apply: 'b-2 b-[--aphelios-ui-clr] rounded-1/2';
			}

			> h5 {
				--at-apply: 'sr-only';
			}

			> [role='radiogroup'] {
				--at-apply: 'grid grid-flow-col grid-cols-[2rem] grid-rows-1 justify-start items-center h-min';

				&::before {
					--at-apply: 'block uppercase leading-none';
					content: '"' attr(data-ability-key) '": ';
					paint-order: stroke fill;
					-webkit-text-stroke: black 0.15em;
				}

				&:nth-of-type(1) {
					--at-apply: 'self-end';
				}
			}

			> span {
				--at-apply: 'max-inline-11 self-center justify-self-center pointer-events-none font-500 text-neutral-400 leading-tight row-span-full -me-[--p] select-none';
				word-spacing: 2rem;
			}
		}

		.config-el-aphelios-gravitum-slow {
			> img {
				--at-apply: 'rounded-full';
			}
		}
	}
}
</style>
