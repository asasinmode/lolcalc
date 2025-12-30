<script setup lang="ts">
defineProps<{
	item?: IItem;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
}>();

defineEmits<{
	headerClick: [MouseEvent];
}>();

const { version } = usePatchVersion();
</script>

<template>
	<component
		:is="headerButton ? 'button' : 'div'"
		class="text-start grid grid-flow-col grid-cols-[auto_1fr] grid-rows-2 w-full"
		:class="headerClass"
		@click="$emit('headerClick', $event)"
	>
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
	</component>
	<p :class="descriptionClass">
		<template v-for="(statValue, statName) in item?.stats" :key="statName">
			<span>{{ statName }}: {{ statValue }}</span>
			<br>
		</template>
	</p>
</template>
