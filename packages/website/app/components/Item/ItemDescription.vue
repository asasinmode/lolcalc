<script setup lang="ts">
const props = defineProps<{
	item?: IItem;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
}>();

defineEmits<{
	headerClick: [isRightClick: boolean];
}>();

const text = useText();
const { version } = usePatchVersion();

const header = useTemplateRef<HTMLButtonElement>('header');

const contents = computed<{
	subtitleLeft?: string;
	subtitleRight?: string;
	stats: [iconName: string, value: number, name: string][];
	extra?: string[][];
}>(() => {
	const { item } = props;
	if (!item) {
		return {
			stats: [],
		};
	}

	const { subtitleLeft, subtitleRight, extra } = text.items[item.id]!.tooltipShop;
	const stats = Object.entries(item.stats)
		.filter(([statName]) => (statName as IItemStat) !== 'FlatHPRegenMod')
		.sort((a, b) => ITEM_STAT_META[b[0] as IItemStat].order - ITEM_STAT_META[a[0] as IItemStat].order)
		.map(([statName, value]) => {
			const { name, displayMultiplier, isPercentage } = ITEM_STAT_META[statName as IItemStat];
			return [
				ITEM_STAT_ICON_NAMES[statName as IItemStat],
				displayMultiplier ? value * displayMultiplier : isPercentage ? `${Math.round(value * 100)}%` : value,
				name,
			] as [string, number, string];
		});

	// replace `Item_Keyword_OnHit` text with img?
	return {
		subtitleLeft,
		subtitleRight,
		stats,
		extra,
	};
});

defineExpose({ header });
</script>

<template>
	<component
		:is="headerTag || 'div'"
		ref="header"
		class="item-description-header"
		:class="headerClass"
		@click="$emit('headerClick', false)"
		@click.right="$emit('headerClick', true)"
	>
		<img
			v-if="item"
			:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`"
			width="64"
			height="64"
			aria-hidden="true"
			loading="lazy"
		>
		<span>{{ item?.name }}</span>
		<span>{{ item?.gold.total }} <span class="sr-only">gold</span></span>
		<span>{{ contents.subtitleLeft }}</span>
		<span>{{ contents.subtitleRight }}</span>
	</component>
	<div class="item-description-content" :class="descriptionClass">
		<ul>
			<li v-for="[icon, value, name] in contents.stats" :key="icon">
				<img
					:src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`"
					width="20"
					height="20"
					aria-hidden="true"
				>
				<span>{{ value }}</span>
				<span>{{ name }}</span>
			</li>
		</ul>
		<template v-for="([heading, paragraph], i) in contents.extra" :key="i">
			<h4 v-html="heading" />
			<p v-html="paragraph" />
		</template>
	</div>
</template>

<style>
.item-description-header {
	@apply 'grid grid-rows-2 grid-cols-[auto_1fr_auto] w-full';

	img {
		@apply 'row-span-full size-(--item-img-size)';
	}

	span {
		@apply 'text-start';
	}

	span:nth-of-type(2),
	span:nth-of-type(4) {
		@apply 'text-end';
	}
}

.item-description-content {
	ul li {
		@apply 'flex items-center gap-[0.5ch]';

		img {
			@apply 'size-4.5';
		}

		span:last-child {
			@apply 'capitalize text-neutral-200';
		}
	}
}
</style>
