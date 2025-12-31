<script setup lang="ts">
defineProps<{
	item?: IItem;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
}>();

defineEmits<{
	headerClick: [isRightClick: boolean];
}>();

const header = useTemplateRef<HTMLButtonElement>('header');
const { version } = usePatchVersion();

defineExpose({ header });
</script>

<template>
	<component
		:is="headerTag || 'div'"
		ref="header"
		class="text-start grid grid-flow-col grid-cols-[auto_1fr] grid-rows-2 w-full"
		:class="headerClass"
		@click="$emit('headerClick', false)"
		@click.right="$emit('headerClick', true)"
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
