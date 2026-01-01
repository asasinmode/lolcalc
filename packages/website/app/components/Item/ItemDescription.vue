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

const cooldownIcon = '<img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png" width="20" height="20" aria-hidden="true">';
const onHitIcon = `<img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${ITEM_STAT_ICON_NAMES.onHit}.png" width="20" height="20" aria-hidden="true">`;

const contents = computed<{
	subtitleLeft?: string;
	subtitleRight?: string;
	stats: [iconName: string, value: number, name: string][];
	extra?: string[][];
	anyUnknownExtraVariables?: boolean;
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

	let anyUnknownExtraVariables = false;
	const extraFormatted = extra?.map(([heading, ...paragraphs]) => {
		const { replaced: replacedHeading, anyUnknown: headingUnknown } = replaceExtraVariables(
			heading!
				.replace('{{ Item_Cooldown }}', `${cooldownIcon}<span>(${item.dataValues?.Cooldown}s<span> cooldown</span>)</span>`)
				.replace('%i:cooldown%', cooldownIcon)
				.replace('(', '<span>(')
				.replace(')', ')</span>'),
			item,
		);
		anyUnknownExtraVariables ||= headingUnknown;

		return [
			replacedHeading,
			...paragraphs.map((paragraph) => {
				const { replaced: replacedParagraph, anyUnknown: paragraphUnknown } = replaceExtraVariables(
					paragraph!.replace('{{ Item_Keyword_OnHit }}', `${onHitIcon} <onhit>On-Hit</onhit>`),
					item,
				);

				anyUnknownExtraVariables ||= paragraphUnknown;
				return replacedParagraph
				;
			},
			),
		];
	});

	return {
		anyUnknownExtraVariables,
		subtitleLeft,
		subtitleRight,
		stats,
		extra: extraFormatted,
	};
});

// TODO add item.stringCalculations and item.itemCalculations handling
function replaceExtraVariables(text: string, item: IItem): { replaced: string; anyUnknown: boolean } {
	let anyUnknown = false;

	const replaced = text.replace(/@([\w*]+)@/g, (_, name) => {
		const multiplierIndex = name.indexOf('*');
		const multiplier = ~multiplierIndex ? Number.parseInt(name.slice(multiplierIndex + 1)) : 1;

		const dataValue = item.dataValues?.[name];
		if (dataValue) {
			return Math.round((dataValue * multiplier)).toString();
		}

		if (name.startsWith('Effect')) {
			const index = name.slice(6);
			const effectAmount = item.effectAmount?.[index];
			if (effectAmount !== undefined) {
				return Math.round(effectAmount * multiplier).toString();
			}
		}

		anyUnknown ||= true;
		return `<unknown>@${name}@</unknown>`;
	});

	return { replaced, anyUnknown };
}

defineExpose({ header });
// TODO extra elements style colors, any unknown style
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
	<div class="item-description-content" :class="[descriptionClass, { 'b b-red': contents.anyUnknownExtraVariables }]">
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
		<template v-for="([heading, ...paragraphs], i) in contents.extra" :key="i">
			<h4 v-html="heading" />
			<p v-for="(paragraph, paragraphIndex) in paragraphs" :key="`${i}-${paragraphIndex}`" v-html="paragraph" />
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
			@apply 'capitalize text-neutral-300';
		}
	}

	h4 {
		@apply 'flex items-center gap-[0.5ch] font-700';

		img {
			@apply 'size-4';
		}

		span {
			@apply 'text-neutral-300 font-400';

			span {
				@apply 'sr-only';
			}
		}
	}

	p {
		@apply 'text-neutral-300';

		unknown {
			color: #ff00ff;
			font-weight: 700;
		}

		scalemana {
			@apply 'text-blue';
		}

		healing {
			@apply 'text-green';
		}

		physicaldamage {
			@apply 'text-orange';
		}

		onhit {
			@apply 'text-white';
		}

		status {
			@apply 'text-purple';
		}

		gold {
			@apply 'text-amber';
		}

		img {
			@apply 'inline-block size-4 align-text-middle';
		}
	}
}
</style>
