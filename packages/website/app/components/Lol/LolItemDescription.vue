<script setup lang="ts">
import type { IItemDescriptionProps } from '~/utils/types';

const props = defineProps<IItemDescriptionProps>();

defineEmits<{
	headerClick: [event: MouseEvent, isRightClick: boolean];
}>();

const text = useText();
const { version, minorVersion } = usePatchVersion();
const globalKeyModifiers = useGlobalKeyModifiers();

const computedDescription = computed<IComputedItemDescription | undefined>(() => props.precomputedDescription
	|| computeItemDescription(
		text,
		minorVersion,
		props.item,
		props.damageSource,
		{ replaceWithName: props.replaceVariablesWithNames },
	));

const isMidQuestBoots = computed(() => {
	if (!computedDescription.value) {
		return false;
	}
	const { item } = computedDescription.value;

	return item.isBoots && item.epicness === 7;
});

const view = useState<IItemHoverTooltipView>(`itemHoverTooltipView${props.source}`, props.source === 'Shop' ? () => 'Shop' : () => 'Inventory');
const otherView = computed(() => view.value === 'Shop' ? 'Inventory' : 'Shop');

const isInventoryView = computed(() => props.hoverTooltip && view.value === 'Inventory');

const hasMoreInfo = computed(() => (computedDescription.value?.extended || computedDescription.value?.keywordDefinitions) && !globalKeyModifiers.value.shift);
const hasOtherView = computed(() => props.hoverTooltip && computedDescription.value?.tooltipInventory);
const showHeaderSubtitles = computed(() => props.headerSubtitles || isInventoryView.value);
const showDynamicValueFooter = computed(() => view.value === 'Inventory' && computedDescription.value?.footerLeft);

const header = useTemplateRef<HTMLButtonElement>('header');

defineExpose({ header });
</script>

<template>
	<component
		:is="headerTag || 'div'"
		ref="header"
		class="item-description-header"
		:class="headerClass"
		:data-show-subtitles="showHeaderSubtitles || undefined"
		:data-inventory-view="isInventoryView || undefined"
		@click="$emit('headerClick', $event, false)"
		@click.right="$emit('headerClick', $event, true)"
	>
		<img
			v-show="computedDescription?.item"
			:src="computedDescription?.item.image ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${computedDescription.item.image}` : ''"
			width="64"
			height="64"
			aria-hidden="true"
			loading="lazy"
		>
		<span>{{ computedDescription?.item.name }}</span>
		<span>
			<span>Sells for:</span>
			<img
				v-show="computedDescription?.item"
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`"
				width="32"
				height="28"
				alt="gold coins"
				loading="lazy"
			>
			{{ isInventoryView ? computedDescription?.item.gold.sell : (gold ?? computedDescription?.item.gold.total) }}
			<span>({{ Math.round((computedDescription?.item.gold.sellBackModifier ?? 0.7) * 100) }}%)</span>
		</span>
		<span>{{ computedDescription?.subtitleLeft }}</span>
		<span>{{ computedDescription?.subtitleRight }}</span>
		<a
			v-if="!hoverTooltip"
			v-show="computedDescription?.item"
			class="wiki-link"
			:href="`https://wiki.leagueoflegends.com/en-us/${computedDescription?.item.name.replaceAll(' ', '_')}`"
			target="_blank"
			@click.stop=""
		>
			wiki
		</a>
	</component>
	<div class="item-description" :class="descriptionClass">
		<p v-if="isMidQuestBoots && damageSource && damageSource.roleQuest.value !== 'mid'">
			(Only Mid Lane) Locked until Quest is Completed
		</p>
		<ul>
			<li v-for="([icon, value, name], i) in computedDescription?.stats" :key="i">
				<img
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`"
					width="20"
					height="20"
					aria-hidden="true"
				>
				<span>{{ value }}</span>
				<span>{{ name }}</span>
			</li>
		</ul>
		<template v-for="([heading, ...paragraphs], i) in hasOtherView && hoverTooltip ? computedDescription?.[`tooltip${view}`] : computedDescription?.tooltipShop" :key="i">
			<h4 v-html="heading" />
			<div v-for="(paragraph, paragraphIndex) in paragraphs" :key="`${i}-${paragraphIndex}`" v-html="paragraph" />
		</template>
		<p
			v-if="computedDescription?.extended"
			v-show="!hoverTooltip || globalKeyModifiers.shift"
			v-html="computedDescription.extended"
		/>
		<UnresolvedVariablesAlert v-if="computedDescription?.unknownVariables.length" />
		<footer v-show="hoverTooltip && (hasMoreInfo || hasOtherView || computedDescription?.footerLeft || computedDescription?.keywordDefinitions)">
			<p v-if="showDynamicValueFooter" class="dynamic-value" v-html="computedDescription!.footerLeft" />
			<p
				v-if="computedDescription?.keywordDefinitions"
				v-show="globalKeyModifiers.shift"
				class="keyword-definitions"
				v-html="computedDescription.keywordDefinitions"
			/>
			<p v-show="hasMoreInfo">
				Hold <kbd>[Shift]</kbd> to show more info
			</p>
			<p v-show="hasOtherView || computedDescription?.footerLeft">
				Press <kbd>[Ctrl]</kbd> to toggle to <b>{{ otherView }}</b> view
			</p>
		</footer>
	</div>
</template>

<style>
@layer components {
	.item-description-header {
		--at-apply: 'grid text-start gap-x-2 text-xl grid-rows-2 items-center font-500 grid-cols-[auto_1fr] w-full mb-2';

		> img {
			--at-apply: 'row-span-full size-(--item-img-size)';
		}

		> span:first-of-type {
			--at-apply: 'text-xl text-white';
		}

		> span:nth-of-type(2) {
			--at-apply: 'text-amber-200 text-start flex items-center justify-start text-lg gap-[0.5ch]';

			img {
				--at-apply: 'h-4 w-auto';
			}

			> span:first-child {
				--at-apply: 'hidden text-yellow-100';
			}

			> span:last-child {
				--at-apply: 'hidden italic text-neutral-400';
			}
		}

		&[data-inventory-view] {
			> span:nth-of-type(2) {
				> span:first-child,
				> span:last-child {
					--at-apply: 'inline';
				}
			}
		}

		> span:nth-of-type(3),
		> span:nth-of-type(4) {
			--at-apply: 'hidden text-lg';
		}

		> span:nth-of-type(4) {
			--at-apply: 'text-end text-neutral-300';
		}

		&[data-show-subtitles],
		:has(> a) {
			--at-apply: 'grid-cols-[auto_1fr_auto]';
		}

		&[data-show-subtitles] > span:nth-of-type(2) {
			--at-apply: 'text-xl text-end justify-end';
		}

		&[data-show-subtitles] > span:nth-of-type(3),
		&[data-show-subtitles] > span:nth-of-type(4) {
			--at-apply: 'inline';
		}

		> a {
			--at-apply: 'row-start-1 col-start-3';
		}
	}

	.item-description {
		> ul {
			> li {
				--at-apply: 'flex items-center gap-[0.5ch] text-neutral-200';

				> img {
					--at-apply: 'size-4.5';
				}

				> span:last-child {
					--at-apply: 'capitalize';
				}
			}
		}

		> :first-child:not(:empty) {
			--at-apply: 'b-t b-[--ui-btn-border-clr] pt-2';
		}

		> p:first-child {
			--at-apply: 'text-red-600 mb-3 italic';
		}

		> * + h4 {
			--at-apply: 'mt-4';
		}

		> ul + h4 {
			--at-apply: 'mt-3';
		}

		> h4 {
			--at-apply: 'text-neutral-300';

			&:has(img) {
				--at-apply: 'flex items-center gap-[0.5ch]';
			}

			> img {
				--at-apply: 'size-4';
			}

			> span {
				> span {
					--at-apply: 'sr-only';
				}
			}
		}

		> div {
			--at-apply: 'text-neutral-300';

			> img {
				--at-apply: 'inline-block size-4 align-middle';
			}

			> li {
				--at-apply: 'ms-5 list-item list-disc';
			}
		}

		> p.alert {
			--at-apply: 'mt-[--unknown-alert-mt]';
		}

		> p:not(.alert):not(:first-child) {
			--at-apply: 'mt-3.25';
		}

		> footer {
			--at-apply: 'b-t b-[--ui-btn-border-clr] pt-1 mt-2';

			> p {
				--at-apply: 'text-end float-end';

				&.dynamic-value,
				&.keyword-definitions {
					--at-apply: 'text-start float-start';
				}

				&:not(.dynamic-value, .keyword-definitions):has(+ p) {
					--at-apply: 'float-none';
				}

				> kbd {
					--at-apply: 'font-inherit';
				}
			}
		}
	}

	.item-description,
	.game-description {
		img {
			--at-apply: 'inline-block align-middle size-4';
		}

		> li {
			--at-apply: 'ms-5 list-item list-disc';

			&:first-of-type {
				--at-apply: 'mt-3';
			}
		}

		> br + br {
			--at-apply: 'hidden';
		}

		font[size] {
			--at-apply: 'text-[length:inherit]';
		}

		var {
			--at-apply: 'font-500';
			font-style: normal;
			text-decoration-line: underline;
			text-decoration-thickness: 0.1em;
			text-decoration-color: var(--unknown-clr);
			text-decoration-skip-ink: auto;
			text-decoration-style: dashed;
		}

		unknown {
			color: var(--unknown-clr);
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
