<script setup lang="ts">
const props = defineProps<{
	item?: IItem;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
	headerSubtitles?: boolean;
	target?: IGameVariableCalculationTarget;
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

	const { subtitleLeft = '', subtitleRight = '', extra = [] } = text.items[item.id]?.tooltipShop || {};
	const stats = Object.entries(item.stats)
		.filter(([statName]) => (statName as IItemStat) !== 'FlatHPRegenMod')
		.sort((a, b) => ITEM_STAT_META[b[0] as IItemStat].order - ITEM_STAT_META[a[0] as IItemStat].order)
		.map(([statName, value]) => {
			const { name, displayMultiplier, isPercentage } = ITEM_STAT_META[statName as IItemStat];
			return [
				ITEM_STAT_ICON_NAMES[statName as IItemStat],
				displayMultiplier ? Math.round(value * displayMultiplier) : isPercentage ? `${Math.round(value * 100)}%` : value,
				name,
			] as [string, number, string];
		});

	let anyUnknownExtraVariables = false;
	const extraFormatted = extra?.map(([heading, ...paragraphs]) => {
		const { replaced: replacedHeading, unknownVariables: headingUnknown } = replaceGameDescriptionVariables(
			heading!
				.replace(/\{\{ ?Item_Cooldown ?\}\}/g, () => {
					const { value } = itemVariableValue('Cooldown', item, props.target);
					anyUnknownExtraVariables ||= !value;
					return `${cooldownIcon}(${value || '<unknown>UNKNOWN</unknown>'}s<span> cooldown</span>)`;
				})
				.replace('(', '<span>(')
				.replace(')', ')</span>'),
			'item',
			[item, props.target],
		);
		anyUnknownExtraVariables ||= !!headingUnknown.length;

		return [
			replaceGameDescriptionIcons(replacedHeading),
			...paragraphs.map((paragraph) => {
				const { replaced: replacedParagraph, unknownVariables: paragraphUnknown } = replaceGameDescriptionVariables(
					paragraph!.replace(/\{\{ ?Item_Keyword_OnHit ?\}\}/g, `${onHitIcon} <onhit>On-Hit</onhit>`),
					'item',
					[item, props.target],
				);

				anyUnknownExtraVariables ||= !!paragraphUnknown.length;
				return replaceGameDescriptionIcons(replacedParagraph);
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
	<div class="item-description" :class="descriptionClass">
		<UnresolvedVariablesAlert v-if="contents.anyUnknownExtraVariables" />
		<ul>
			<li v-for="([icon, value, name], i) in contents.stats" :key="i">
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
			<div v-for="(paragraph, paragraphIndex) in paragraphs" :key="`${i}-${paragraphIndex}`" v-html="paragraph" />
		</template>
	</div>
</template>

<style>
@layer components {
	.item-description-header {
		--at-apply: 'grid text-start gap-x-2 text-xl grid-rows-2 items-center font-500 grid-cols-[auto_1fr] w-full';

		> img {
			--at-apply: 'row-span-full size-(--item-img-size)';
		}

		span:first-of-type {
			--at-apply: 'text-xl';
		}

		span:nth-of-type(2) {
			--at-apply: 'text-amber text-start flex items-center justify-start text-lg gap-[0.5ch]';

			img {
				--at-apply: 'h-4 w-auto';
			}
		}

		span:nth-of-type(3),
		span:nth-of-type(4) {
			--at-apply: 'hidden text-lg';
		}

		span:nth-of-type(4) {
			--at-apply: 'text-end text-neutral-300';
		}

		&[data-show-subtitles] {
			--at-apply: 'grid-cols-[auto_1fr_auto]';
		}

		&[data-show-subtitles] span:nth-of-type(2) {
			--at-apply: 'text-xl text-end justify-end';
		}

		&[data-show-subtitles] span:nth-of-type(3),
		&[data-show-subtitles] span:nth-of-type(4) {
			--at-apply: 'inline';
		}
	}

	.item-description {
		ul li {
			--at-apply: 'flex items-center gap-[0.5ch]';

			img {
				--at-apply: 'size-4.5';
			}

			span:last-child {
				--at-apply: 'capitalize text-neutral-300';
			}
		}

		h4 {
			--at-apply: 'text-neutral-300';

			&:has(img) {
				--at-apply: 'flex items-center gap-[0.5ch]';
			}

			img {
				--at-apply: 'size-4';
			}

			span {
				> span {
					--at-apply: 'sr-only';
				}
			}
		}

		div {
			--at-apply: 'text-neutral-300';

			img {
				--at-apply: 'inline-block size-4 align-text-middle';
			}

			li {
				--at-apply: 'ms-5';
			}
		}
	}

	.item-description,
	.game-description {
		unknown {
			color: #ff00ff;
			font-weight: 700;
		}

		passive {
			--at-apply: 'font-700 text-white';
		}

		scaleap {
			--at-apply: 'text-indigo-400';
		}

		scalead {
			--at-apply: 'text-orange';
		}

		scalehealth {
			--at-apply: 'text-emerald-600';
		}

		scalemana {
			--at-apply: 'text-blue';
		}

		scalearmor {
			--at-apply: 'text-orange-300';
		}

		scalemr {
			--at-apply: 'text-cyan-300';
		}

		scalelethality {
			--at-apply: 'text-red';
		}

		attackspeed {
			--at-apply: 'text-yellow-200';
		}

		onhit {
			--at-apply: 'text-white';
		}

		physicaldamage {
			--at-apply: 'text-orange-600';
		}

		magicdamage {
			--at-apply: 'text-cyan';
		}

		truedamage {
			--at-apply: 'text-cyan-50';
		}

		healing {
			--at-apply: 'text-green-300';
		}

		shield {
			--at-apply: 'text-sky-400';
		}

		lifesteal,
		omnivamp {
			--at-apply: 'text-red-700';
		}

		speed {
			--at-apply: 'text-yellow-50';
		}

		gold {
			--at-apply: 'text-amber';
		}

		status {
			--at-apply: 'text-purple';
		}

		attention {
			--at-apply: 'text-neutral-50';
		}

		raritygeneric {
			--at-apply: 'text-neutral-100';
		}

		raritylegendary {
			--at-apply: 'text-white';
		}

		rules {
			--at-apply: 'text-neutral-400';
		}

		keyword {
			--at-apply: 'text-pink-300';
		}

		keywordmajor {
			--at-apply: 'text-yellow-100';
		}

		keywordstealth {
			--at-apply: 'text-pink-300';
		}

		active {
			--at-apply: 'font-500 text-orange-200';
		}
	}
}
</style>
