<script setup lang="ts">
const props = defineProps<{
	item?: IItem;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
	headerSubtitles?: boolean;
}>();

defineEmits<{
	headerClick: [isRightClick: boolean];
}>();

const text = useText();
const { version, minorVersion } = usePatchVersion();

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
		const headingCooldown = itemDescriptionVariableValue('Cooldown', item) || '<unknown>UNKNOWN</unknown>';
		const { replaced: replacedHeading, unknownVariables: headingUnknown } = replaceItemDescriptionVariables(
			heading!
				.replace('{{ Item_Cooldown }}', `${cooldownIcon}(${headingCooldown}s<span> cooldown</span>)`)
				.replace('%i:cooldown%', cooldownIcon)
				.replace('(', '<span>(')
				.replace(')', ')</span>'),
			item,
		);
		anyUnknownExtraVariables ||= !!headingUnknown.length;

		return [
			replacedHeading,
			...paragraphs.map((paragraph) => {
				const { replaced: replacedParagraph, unknownVariables: paragraphUnknown } = replaceItemDescriptionVariables(
					paragraph!.replace('{{ Item_Keyword_OnHit }}', `${onHitIcon} <onhit>On-Hit</onhit>`),
					item,
				);

				anyUnknownExtraVariables ||= !!paragraphUnknown.length;
				return replacedParagraph;
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

defineExpose({ header });
// TODO extra elements style colors, any unknown style
// TODO lean style, no subtitile left and right, just gold below name in shop right section + search right panel details
</script>

<template>
	<component
		:is="headerTag || 'div'"
		ref="header"
		class="item-description-header"
		:class="headerClass"
		:data-show-subtitles="headerSubtitles || undefined"
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
		<span>
			<img
				v-show="item"
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`"
				width="32"
				height="28"
				aria-hidden="true"
				loading="lazy"
			>
			{{ item?.gold.total }} <span class="sr-only">gold</span>
		</span>
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
	@apply 'grid text-start gap-x-2 text-xl grid-rows-2 items-center font-500 grid-cols-[auto_1fr_auto] w-full';

	> img {
		@apply 'row-span-full size-(--item-img-size)';
	}

	span:first-of-type {
		@apply 'text-xl';
	}

	span:nth-of-type(2) {
		@apply 'text-amber text-end flex items-center justify-end gap-[0.5ch]';

		img {
			@apply 'h-4 w-auto';
		}
	}

	span:nth-of-type(4) {
		@apply 'text-end text-neutral-300';
	}

	span:nth-of-type(3),
	span:nth-of-type(4) {
		@apply 'text-lg';
	}

	&[data-show-subtitles] {
		@apply 'grid-cols-[auto_1fr]';

		span:nth-of-type(2) {
			@apply 'text-lg';
		}
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

	unknown {
		color: #ff00ff;
		font-weight: 700;
	}

	h4 {
		@apply 'flex items-center gap-[0.5ch] font-700';

		img {
			@apply 'size-4';
		}

		span {
			@apply 'text-neutral-300 font-400';

			> span {
				@apply 'sr-only';
			}
		}
	}

	p {
		@apply 'text-neutral-300';

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
