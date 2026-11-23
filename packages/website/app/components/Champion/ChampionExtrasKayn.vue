<script setup vapor lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { AbilityType } from '@lolcalc/shared';
import type { IExtraComponentProps } from '~/utils/types';

const props = defineProps<IExtraComponentProps>();

const DmgAmpComponent = booleanConfigEl(
	GameAbilityId.build(AbilityType.champion, 'Kayn', 'passive', 0),
	'shadowDmgAmp',
	'Shadow Assassin additional dmg',
	false,
	undefined,
	"Used in the basic attack damage results. Abilities' values do not factor it in. (TODO - not implemented yet)",
	{ variantImgIndex: [() => void 0, () => 1] },
);

const disabled = computed(() => (props.damageSource as DamageSource<'Kayn'>).internalData.value.form !== CHAMPION_SPECIFICS.Kayn.passive.formOptions.assassin);
</script>

<template>
	<DmgAmpComponent v-bind="$props" :disabled>
		<p>needs <b>Shadow Asassin</b> form</p>
	</DmgAmpComponent>
</template>

<style>
@layer overrides {
	[data-scoreboard-item='Kayn'] .config-els > :nth-child(2) {
		> img {
			--at-apply: 'col-start-1 row-start-1 col-span-1';
		}

		> input {
			--at-apply: 'col-start-2 row-start-1 col-span-1';
		}

		> label {
			--at-apply: 'col-start-3 row-start-1 col-span-1';
		}

		> p {
			--at-apply: 'col-start-1 row-start-1 col-span-3 z-1 relative text-center block-full flex-center gap-[0.5ch] flex-wrap bg-black/20 backdrop-blur-2 -mx-1 font-500 leading-none';
			paint-order: stroke fill;
			-webkit-text-stroke: 0.15em black;
		}

		&:not(:has(> input:disabled), :has(> select:disabled)) > p {
			--at-apply: 'hidden';
		}
	}
}
</style>
