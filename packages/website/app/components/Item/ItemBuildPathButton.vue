<script setup lang="ts">
defineProps<{
	isSelected?: boolean;
	item: IItem;
}>();

const { version } = usePatchVersion();
</script>

<template>
	<button class="item-shop-item-btn" :class="{ selected: isSelected }">
		<span class="sr-only">{{ item.name }}</span>
		<img
			:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`"
			width="64"
			height="64"
			aria-hidden="true"
			loading="lazy"
		>
		<span>{{ item.gold.total }}</span>
	</button>
</template>
