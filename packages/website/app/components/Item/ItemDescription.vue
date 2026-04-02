<script setup lang="ts">
const props = defineProps<{
	item?: IItem;
	gold?: number;
	headerTag?: string;
	headerButton?: boolean;
	headerClass?: string;
	descriptionClass?: string;
	headerSubtitles?: boolean;
	damageSource?: DamageSource;
	replaceVariablesWithNames?: boolean;
	precomputedDescription?: IComputedItemDescription;
}>();

defineEmits<{
	headerClick: [event: MouseEvent, isRightClick: boolean];
}>();

const text = useText();
const { version, minorVersion } = usePatchVersion();

const computedDescription = computed<IComputedItemDescription>(() => props.precomputedDescription
	|| computedItemDescription(
		text,
		minorVersion,
		props.item,
		props.damageSource,
		{ replaceWithName: props.replaceVariablesWithNames },
	));

const header = useTemplateRef<HTMLButtonElement>('header');

defineExpose({ header });
</script>

<template>
	<component
		:is="headerTag || 'div'"
		ref="header"
		class="item-description-header"
		:class="headerClass"
		:data-show-subtitles="headerSubtitles || undefined"
		@click="$emit('headerClick', $event, false)"
		@click.right="$emit('headerClick', $event, true)"
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
				alt="gold coins"
				loading="lazy"
			>
			{{ gold ?? item?.gold.total }}
		</span>
		<span>{{ computedDescription.subtitleLeft }}</span>
		<span>{{ computedDescription.subtitleRight }}</span>
	</component>
	<div class="item-description" :class="descriptionClass">
		<UnresolvedVariablesAlert v-if="computedDescription.anyUnknownExtraVariables" />
		<ul>
			<li v-for="([icon, value, name], i) in computedDescription.stats" :key="i">
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
		<template v-for="([heading, ...paragraphs], i) in computedDescription.extra" :key="i">
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
			--at-apply: 'text-xl text-white';
		}

		span:nth-of-type(2) {
			--at-apply: 'text-amber-200 text-start flex items-center justify-start text-lg gap-[0.5ch]';

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
				--at-apply: 'inline-block size-4 align-middle';
			}

			li {
				--at-apply: 'ms-5';
			}
		}
	}

	.item-description,
	.game-description {
		img {
			--at-apply: 'inline-block align-middle size-4';
		}

		variablename {
			--at-apply: 'font-500';
			text-decoration-line: underline;
			text-decoration-thickness: 0.1em;
			text-decoration-color: #ff00ff;
			text-decoration-skip-ink: auto;
			text-decoration-style: dashed;
		}

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

		stattracking {
			--at-apply: 'text-orange-400';
		}
	}

	.hover-tooltip.champion-item {
		--at-apply: 'w-160 max-w-screen';
		justify-self: anchor-center;
		position-try: flip-block;
	}
}
</style>
