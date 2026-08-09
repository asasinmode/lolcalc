<script setup lang="ts">
import type { IChampionAbilityKey, INonPassiveAbilityKey } from '@lolcalc/shared';
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_IMAGES } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';

const props = defineProps<IExtraComponentProps>();

defineEmits<IExtraComponentEmits>();

const { abilityImage, abilityImageSize } = CHAMPION_IMAGES;

const imgSize = abilityImageSize('Aphelios');

function resetAbilityLevel(event: MouseEvent, ability: INonPassiveAbilityKey) {
	event.preventDefault();
	// eslint-disable-next-line vue/no-mutating-props
	props.damageSource.abilityLevels.value[ability] = 0;
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<article class="extras-aphelios-ability-levels">
		<img
			:src="abilityImage(props.damageSource.champion.value!.abilities.passive.variants[props.damageSource.abilityVariantsIndexes.value.passive]!.image, 'Aphelios')"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event, GameAbilityId.build(AbilityType.champion, 'Aphelios', 'passive', 0))"
		>
		<h5>"ability" levels</h5>
		<VButtonRadiogroup
			v-for="abilityKey in ['q', 'w', 'e'] satisfies IChampionAbilityKey[]"
			:id="`ability-${abilityKey}-${idSuffix}`"
			:key="abilityKey"
			v-model="damageSource.abilityLevels.value[abilityKey]"
			:label="`&quot;${abilityKey}&quot; level`"
			:options="Array.from({ length: damageSource.maxAbilityLevels.value[abilityKey] }, (_, index) => ({ level: index + 1 }))"
			value-key="level"
			:data-ability-key="abilityKey"
			:style="`--btns-count: ${damageSource.maxAbilityLevels.value[abilityKey]}`"
			@option-right-click="(event) => resetAbilityLevel(event, abilityKey)"
		>
			<template #default="{ option }">
				<span>{{ option.level }}</span>
			</template>
		</VButtonRadiogroup>
	</article>
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Aphelios'] .extras-aphelios-ability-levels {
		--at-apply: 'grid grid-cols-[auto_1fr] grid-rows-[1fr_auto_1fr] gap-y-0.75';

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
	}
}
</style>
