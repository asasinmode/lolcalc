<script setup vapor lang="ts">
import type { IGameAbilityId } from '@lolcalc/core/GameAbilityId';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { formatImageAttrs, gameAbilityImage } from '@lolcalc/core/misc';
import { CHAMPIONS, ITEMS } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared/index';

const props = defineProps<{
	abilityId: IGameAbilityId;
	name?: string;
	link?: boolean;
}>();

const { data: attrs } = useAsyncData(`game-ability-img-${GameAbilityId.stringify(props.abilityId)}`, async () => formatImageAttrs(await gameAbilityImage(props.abilityId)));

const name = props.abilityId.type === AbilityType.item ? ITEMS[props.abilityId.id]?.name : props.abilityId.type === AbilityType.champion ? CHAMPIONS[props.abilityId.id].name : undefined;
const Name = () => name ?? h('unknown', 'unknown');

const href = name && props.link ? `https://wiki.leagueoflegends.com/en-us/${name.replaceAll(' ', '_')}` : undefined;
</script>

<template>
	<NuxtLink v-if="href" :to="href" target="_blank">
		<img v-if="attrs" v-bind="attrs" />
		<Name />
	</NuxtLink>
	<template v-else>
		<img v-if="attrs" v-bind="attrs" />
		<Name />
	</template>
</template>
