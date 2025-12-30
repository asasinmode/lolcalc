<script setup lang="ts">
defineProps<{
	item?: IItem;
	headerClass?: string;
	descriptionClass?: string;
}>();

const { version } = usePatchVersion();
</script>

<template>
	<div class="grid grid-flow-col grid-cols-[auto_1fr] grid-rows-2" :class="headerClass">
		<img
			v-if="item"
			:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`"
			width="64"
			height="64"
			class="row-span-full"
			aria-hidden="true"
			loading="lazy"
		>
		{{ item?.name }}
		<span>{{ item?.gold.total }}</span>
	</div>
	<p :class="descriptionClass">
		<template v-for="(statValue, statName) in item?.stats" :key="statName">
			<span>{{ statName }}: {{ statValue }}</span>
			<br>
		</template>
	</p>
</template>
