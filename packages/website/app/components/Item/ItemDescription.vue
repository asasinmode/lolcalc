<script setup lang="ts">
const props = defineProps<{
	item?: IItem;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
	headerSubtitles?: boolean;
	target?: IDamageSource;
}>();

defineEmits<{
	headerClick: [isRightClick: boolean];
}>();

const text = useText();
const { version, minorVersion } = usePatchVersion();

const header = useTemplateRef<HTMLButtonElement>('header');

const cooldownIcon = '<img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/gameplay/cooldown.png" width="20" height="20" aria-hidden="true">';
const onHitIcon = `<img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${ITEM_STAT_ICON_NAMES.OnHit}.png" width="20" height="20" aria-hidden="true">`;

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
		const { replaced: replacedHeading, unknownVariables: headingUnknown } = replaceItemDescriptionVariables(
			heading!
				.replace(/\{\{ ?Item_Cooldown ?\}\}/g, () => {
					const { value } = itemVariableValue('Cooldown', item, props.target);
					anyUnknownExtraVariables ||= !value;
					return `${cooldownIcon}(${value || '<unknown>UNKNOWN</unknown>'}s<span> cooldown</span>)`;
				})
				.replace('(', '<span>(')
				.replace(')', ')</span>'),
			item,
			props.target,
		);
		anyUnknownExtraVariables ||= !!headingUnknown.length;

		return [
			replaceItemDescriptionIcons(replacedHeading),
			...paragraphs.map((paragraph) => {
				const { replaced: replacedParagraph, unknownVariables: paragraphUnknown } = replaceItemDescriptionVariables(
					paragraph!.replace('{{ Item_Keyword_OnHit }}', `${onHitIcon} <onhit>On-Hit</onhit>`),
					item,
					props.target,
				);

				anyUnknownExtraVariables ||= !!paragraphUnknown.length;
				return replaceItemDescriptionIcons(replacedParagraph);
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
	<div class="item-description-content" :class="descriptionClass">
		<p v-if="contents.anyUnknownExtraVariables" class="unknown-variables-alert">
			<Icon name="ph:warning-light" />
			Some variables weren't resolved correctly. Please <b>report this issue</b>
		</p>
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
	@apply 'grid text-start gap-x-2 text-xl grid-rows-2 items-center font-500 grid-cols-[auto_1fr] w-full';

	> img {
		@apply 'row-span-full size-(--item-img-size)';
	}

	span:first-of-type {
		@apply 'text-xl';
	}

	span:nth-of-type(2) {
		@apply 'text-amber text-start flex items-center justify-start text-lg gap-[0.5ch]';

		img {
			@apply 'h-4 w-auto';
		}
	}

	span:nth-of-type(3),
	span:nth-of-type(4) {
		@apply 'hidden text-lg';
	}

	span:nth-of-type(4) {
		@apply 'text-end text-neutral-300';
	}

	&[data-show-subtitles] {
		@apply 'grid-cols-[auto_1fr_auto]';
	}

	/* unocss failes to parse these if they are nested above, maybe if this merged can override css-tree */
	/* https://github.com/eslint/csstree/pull/104 */
	&[data-show-subtitles] span:nth-of-type(2) {
		@apply 'text-xl text-end justify-end';
	}

	&[data-show-subtitles] span:nth-of-type(3),
	&[data-show-subtitles] span:nth-of-type(4) {
		@apply 'inline';
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
		@apply 'text-neutral-300';

		&:has(img) {
			@apply 'flex items-center gap-[0.5ch]';
		}

		img {
			@apply 'size-4';
		}

		span {
			> span {
				@apply 'sr-only';
			}
		}
	}

	p {
		@apply 'text-neutral-300';

		img {
			@apply 'inline-block size-4 align-text-middle';
		}

		li {
			@apply 'ml-5';
		}
	}

	unknown {
		color: #ff00ff;
		font-weight: 700;
	}

	passive {
		@apply 'font-700 text-white';
	}

	scaleap {
		@apply 'text-indigo-400';
	}

	scalead {
		@apply 'text-orange';
	}

	scalehealth {
		@apply 'text-emerald-600';
	}

	scalemana {
		@apply 'text-blue';
	}

	scalearmor {
		@apply 'text-orange-300';
	}

	scalemr {
		@apply 'text-cyan-300';
	}

	scalelethality {
		@apply 'text-red';
	}

	attackspeed {
		@apply 'text-yellow-200';
	}

	onhit {
		@apply 'text-white';
	}

	physicaldamage {
		@apply 'text-orange-600';
	}

	magicdamage {
		@apply 'text-cyan';
	}

	truedamage {
		@apply 'text-cyan-50';
	}

	healing {
		@apply 'text-green-300';
	}

	shield {
		@apply 'text-sky-400';
	}

	lifesteal,
	omnivamp {
		@apply 'text-red-700';
	}

	speed {
		@apply 'text-white';
	}

	gold {
		@apply 'text-amber';
	}

	status {
		@apply 'text-purple';
	}

	attention {
		@apply 'text-neutral-50';
	}

	raritygeneric {
		@apply 'text-neutral-100';
	}

	raritylegendary {
		@apply 'text-white';
	}

	rules {
		@apply 'text-neutral-400';
	}

	keyword {
		@apply 'text-pink-300';
	}

	keywordmajor {
		@apply 'text-yellow-100';
	}

	keywordstealth {
		@apply 'text-pink-300';
	}

	.unknown-variables-alert {
		@apply 'b b-amber-600 relative pl-9.5 rounded-md bg-amber-900/10 p-2 text-amber-400';

		&:before {
			@apply 'absolute content-empty left-2 top-1/2 -translate-y-1/2 z-0 bg-amber-400 size-6 rounded-full';
		}

		.iconify {
			@apply 'size-4.5 z-10 absolute left-2.75 top-1/2 -translate-y-1/2 align-middle text-amber-950';
		}
	}
}
</style>
