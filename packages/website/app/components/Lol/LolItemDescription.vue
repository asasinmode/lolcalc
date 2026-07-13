<script setup lang="ts">
import type { IComputedItemDescription } from '@lolcalc/core/DamageSource';
import type { IHypotheticalItemSpecifics } from '@lolcalc/core/specifics/item';
import type { IItemDescriptionProps } from '~/utils/types';
import { computeItemDescription } from '@lolcalc/core/DamageSource';
import { calculateDynamicVariables, specificKnownVariables } from '@lolcalc/core/specifics';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item';
import { ICON_GOLD, PATCH_VERSION } from '@lolcalc/data';
import { ITEM_STAT_META } from '@lolcalc/data/meta';
import { UPGRADED_SUPPORT_ITEMS } from '@lolcalc/shared/index';

const props = defineProps<IItemDescriptionProps>();

defineEmits<{
	headerClick: [event: MouseEvent];
	headerRClick: [event: MouseEvent];
	headerDblClick: [event: MouseEvent];
}>();

const { vSemver, vMinor } = PATCH_VERSION;
const globalKeyModifiers = useGlobalKeyModifiers();

const computedDescription = computed<IComputedItemDescription | undefined>(() => props.precomputedDescription
	|| (props.item && props.damageSource?.computed.items.value.find(item => props.item!.id === item?.item.id))
	|| computeItemDescription(
		props.item,
		props.damageSource,
		{
			replaceWithName: props.replaceVariablesWithNames,
			overrideVariables: props.item && (props.damageSource
				? calculateDynamicVariables(props.damageSource, undefined, (ITEM_SPECIFICS as IHypotheticalItemSpecifics)[props.item.id as keyof IHypotheticalItemSpecifics]?.variables)
				: specificKnownVariables((ITEM_SPECIFICS as IHypotheticalItemSpecifics)[props.item.id as keyof IHypotheticalItemSpecifics]?.variables)),
		},
	),
);

const isMidQuestBoots = computed(() => {
	if (computedDescription.value) {
		const { item } = computedDescription.value;
		return item.isBoots && item.epicness === 7;
	}
	return false;
});

const isSupportItem = computed(() => computedDescription.value?.item && UPGRADED_SUPPORT_ITEMS.includes(computedDescription.value.item.id));

const view = useState<IItemHoverTooltipView>(`itemHoverTooltipView${props.source}`, props.source === 'Shop' ? () => 'Shop' : () => 'Inventory');
const otherView = computed(() => view.value === 'Shop' ? 'Inventory' : 'Shop');

const isInventoryView = computed(() => props.hoverTooltip && view.value === 'Inventory');

const hasMoreInfo = computed(() => !globalKeyModifiers.value.shift && (computedDescription.value?.extended
	|| computedDescription.value?.keywordDefinitions
	|| computedDescription.value?.[`tooltip${view.value}AnyExtendedVInfo`]
	|| (isInventoryView.value && computedDescription.value?.footerLeftAnyExtendedVInfo)
),
);
const hasOtherView = computed(() => props.hoverTooltip && (computedDescription.value?.tooltipInventory || computedDescription.value?.stats.some(stat => stat.increasedBy)));
const showHeaderSubtitles = computed(() => props.headerSubtitles || isInventoryView.value);
const showDynamicValueFooter = computed(() => isInventoryView.value && computedDescription.value?.footerLeft);

const descriptionText = computed(() => {
	const suffix = props.hoverTooltip && globalKeyModifiers.value.shift ? 'Extended' : '';
	return (hasOtherView.value && props.hoverTooltip
		? computedDescription.value?.[`tooltip${view.value}${suffix}`]
		: (computedDescription.value?.[`tooltipShop${suffix}`]))
	?? computedDescription.value?.[`tooltipShop${suffix}`];
});

const header = useTemplateRef<HTMLButtonElement>('header');

defineExpose({ header });
</script>

<template>
	<component
		:is="headerTag || 'div'"
		ref="header"
		class="item-description-header"
		:data-show-subtitles="showHeaderSubtitles || undefined"
		:data-inventory-view="isInventoryView || undefined"
		@click="$emit('headerClick', $event)"
		@click.right="$emit('headerRClick', $event)"
		@dblclick="$emit('headerDblClick', $event)"
	>
		<img
			v-show="computedDescription?.item"
			:src="computedDescription?.item.image ? `https://ddragon.leagueoflegends.com/cdn/${vSemver}/img/item/${computedDescription.item.image}` : ''"
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
				v-bind="ICON_GOLD"
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
	<div class="item-description">
		<p v-if="damageSource && (isMidQuestBoots ? damageSource.roleQuest.value !== 'mid' : isSupportItem ? damageSource.roleQuest.value !== 'support' : false)">
			{{ isMidQuestBoots ? '(Only Mid Lane)' : '(Only Support Role)' }} Locked until Quest is Completed
		</p>
		<ul>
			<li v-for="{ icon, statName, baseValue, totalValue, increasedBy } in computedDescription?.stats" :key="statName">
				<img
					:src="typeof icon === 'string' ? `https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png` : icon[0]"
					:width="typeof icon === 'string' ? 20 : icon[1]"
					:height="typeof icon === 'string' ? 20 : (icon[2] ?? icon[1])"
					aria-hidden="true"
				>
				<span :data-increased="hoverTooltip && isInventoryView && increasedBy ? '' : undefined">
					{{ hoverTooltip && isInventoryView ? totalValue : baseValue }}
				</span>{{ ITEM_STAT_META[statName].isPercentage ? '%' : '' }}
				<span>{{ ITEM_STAT_META[statName].name }}</span>
			</li>
		</ul>
		<template
			v-for="([heading, ...paragraphs], i) in descriptionText"
			:key="i"
		>
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
			<p v-if="showDynamicValueFooter" class="dynamic-value" v-html="isInventoryView && globalKeyModifiers.shift ? computedDescription!.footerLeftExtended : computedDescription!.footerLeft" />
			<p
				v-if="computedDescription?.keywordDefinitions"
				v-show="globalKeyModifiers.shift"
				class="keyword-definitions"
				v-html="computedDescription.keywordDefinitions"
			/>
			<div>
				<p v-show="hasMoreInfo">
					Hold <kbd>[Shift]</kbd> to show more info
				</p>
				<p v-show="hasOtherView || computedDescription?.footerLeft">
					Press <kbd>[Ctrl]</kbd> to toggle to <b>{{ otherView }}</b> view
				</p>
			</div>
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
				--at-apply: 'flex items-center text-neutral-200';

				> img {
					--at-apply: 'size-4.5 me-[0.5ch]';
				}

				> span[data-increased] {
					--at-apply: 'text-orange-400';
				}

				> span:last-child {
					--at-apply: 'capitalize ms-[0.5ch]';
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
			--at-apply: 'mt-4';
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
		}

		> div,
		> p {
			> li {
				--at-apply: 'text-neutral-300 ms-5 list-item list-disc';
			}
		}

		> p.alert {
			--at-apply: 'mt-[--unknown-alert-mt]';
		}

		> p:not(.alert):not(:first-child) {
			--at-apply: 'mt-3.25';
		}

		> footer {
			--at-apply: 'b-t b-[--ui-btn-border-clr] pt-[--footer-pt] mt-[--footer-mt] grid grid-cols-[1fr_min-content] grid-rows-[min-content_min-content] grid-flow-col';

			> div {
				--at-apply: 'row-span-2 col-start-2';

				> p {
					--at-apply: 'whitespace-nowrap';
				}
			}

			p {
				--at-apply: 'text-end';

				&.dynamic-value,
				&.keyword-definitions {
					--at-apply: 'text-start';
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
			--at-apply: 'inline-block align-middle size-4 z-1 relative';
		}

		> li {
			--at-apply: 'ms-5 list-item list-disc';

			&:first-of-type {
				--at-apply: 'mbs-3';
			}
		}

		/* trouble makers to check when changing this: kassadin passive, jhin passive, nidalee passive, viktor passive */
		> li + br,
		> rules > br:first-child:not(:has(~ br)),
		> br + br + br {
			--at-apply: 'hidden';
		}

		> br:nth-last-child(2):not(br + br) {
			&:has(+ rules) {
				--at-apply: 'hidden';
			}

			& + rules {
				--at-apply: 'mt-[1em] block';
			}
		}

		font[size] {
			--at-apply: 'text-[length:inherit]';
		}

		var {
			--at-apply: 'font-500 rounded bg-neutral-800 px-0.75 py-0.25 -mx-0.75 -my-0.25';
			font-style: normal;
		}

		unknown {
			color: var(--unknown-clr);
			font-weight: 700;
		}

		passive {
			--at-apply: 'font-700 text-white';
		}

		scalelevel {
			--at-apply: 'text-white';
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

		scaleenergy {
			--at-apply: 'text-yellow-200';
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

		const {
			--at-apply: 'text-white';
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

		recast {
			/* kind of like a dirty salmon? Based on from Rammus W */
			--at-apply: 'text-[oklch(0.6814_0.1413_36.07)]';
		}
	}

	.game-description {
		> ul {
			--at-apply: 'list-disc';

			> li {
				--at-apply: 'list-item ms-5 text-base';

				&:not(:last-child) {
					--at-apply: 'mbe-[1em]';
				}
			}
		}
	}

	.hover-tooltip.champion-item {
		--at-apply: 'w-160 max-w-screen';
		justify-self: anchor-center;
		position-try: flip-block;
	}

	.hover-tooltip.role-quest {
		--at-apply: 'w-fit max-w-[min(100vw,calc(158*var(--spacing)))]';

		> .game-description {
			--at-apply: 'leading-normal';

			br {
				--at-apply: 'block my-0.5';
			}
		}
	}

	.hover-tooltip.dragon,
	.hover-tooltip.effect {
		> footer {
			--at-apply: 'col-span-full text-end leading-5';

			> kbd {
				--at-apply: 'font-inherit';
			}
		}
	}
}
</style>
