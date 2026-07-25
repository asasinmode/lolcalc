<script setup lang="ts">
import type { DamageSource, IDamageSourceEffect } from '@lolcalc/core/DamageSource';
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from '@lolcalc/core/GameAbilityId';
import type { IEffectObjectName, TAbilityType } from '@lolcalc/shared';
import { computeAbilityDescription, computeEffectDescription } from '@lolcalc/core/DamageSource';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { EFFECT_SPECIFICS, EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { ITEMS, useChampion } from '@lolcalc/data';
import { AbilityType } from '@lolcalc/shared';
import { CHAMPION_COMPONENTS } from '~/components/Champion';
import { DRAGON_COMPONENTS } from '~/components/Dragon';
import { EFFECT_COMPONENTS } from '~/components/Effect';
import { ITEM_COMPONENTS } from '~/components/Item';

const damageSource = defineModel<DamageSource>();

const vDialog = useTemplateRef('vDialog');

interface IEffectOptionGroup {
	type: TAbilityType;
	label: string;
	options: {
		abilityId: IEffectAbilityId;
		sourceAbilityId: IGameAbilityId;
		/** used for sorting */
		name: string;
		searchString: string;
	}[];
}

const effectSearchStrings = new Map<IEffectObjectName, string>();

function createSearchString(value?: string) {
	return (value ?? '').toLocaleLowerCase().replaceAll(/[^a-z;]/g, '');
}

const itemEffects: IEffectOptionGroup['options'] = EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, specific]) => specific.sourceAbility.type === AbilityType.item)
	.map(([effectObjectName, effectSpecific]): IEffectOptionGroup['options'][number] => {
		const sourceAbilityId = effectSpecific.sourceAbility as IItemAbilityId;
		const item = ITEMS[sourceAbilityId.id]!;

		const searchString = createSearchString(`${effectSpecific.label};${createSearchString(computeEffectDescription(effectObjectName).description)};`).concat(item.searchString);
		effectSearchStrings.set(effectObjectName, searchString);

		return {
			abilityId: GameAbilityId.build(AbilityType.effect, effectObjectName),
			sourceAbilityId,
			name: item.name,
			searchString,
		};
	})
	.sort((effectA, effectB) => effectA.name.localeCompare(effectB.name));

const otherEffects: IEffectOptionGroup['options'] = EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, specific]) => specific.sourceAbility.type === AbilityType.effect)
	.map(([effectObjectName, effectSpecific]): IEffectOptionGroup['options'][number] => {
		const sourceAbilityId = effectSpecific.sourceAbility as IEffectAbilityId;

		const searchString = createSearchString(`${effectSpecific.label};${computeEffectDescription(effectObjectName).description}`);
		effectSearchStrings.set(effectObjectName, searchString);

		return {
			abilityId: GameAbilityId.build(AbilityType.effect, effectObjectName),
			sourceAbilityId,
			name: effectSpecific.label,
			searchString,
		};
	})
	/* special case sort to have all 4 summoner spells together */
	.sort((effectA, effectB) => effectA.name === 'Heal' && effectB.name.startsWith('Grievous') ? -1 : effectA.name.localeCompare(effectB.name));

const championEffects = shallowRef<IEffectOptionGroup['options']>();

const isLoading = ref(false);

const effectOptionGroups = computed((): IEffectOptionGroup[] => {
	const groups: IEffectOptionGroup[] = [
		{
			type: AbilityType.item,
			label: 'items',
			options: itemEffects.filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				GameAbilityId.isSame(appliedEffect.abilityId, effect.abilityId),
			)),
		},
		{
			type: AbilityType.champion,
			label: 'champions',
			options: (championEffects.value ?? []).filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				GameAbilityId.isSame(appliedEffect.abilityId, effect.abilityId),
			)),
		},
		{
			type: AbilityType.effect,
			label: 'other',
			options: otherEffects.filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				GameAbilityId.isSame(appliedEffect.abilityId, effect.abilityId),
			)),
		},
	];

	return groups.filter(group => group.options.length);
});

const htmlTagRegex = /<(\/)?[a-z ="0-9]+>/gi;

async function loadChampionEffects() {
	if (championEffects.value || isLoading.value) {
		return;
	}
	isLoading.value = true;

	championEffects.value = (await Promise.all(EFFECT_SPECIFICS_OBJECT_ENTRIES
		.filter(([, specific]) => specific.sourceAbility.type === AbilityType.champion)
		.map(async ([effectObjectName, effectSpecific]): Promise<IEffectOptionGroup['options'][number]> => {
			const sourceAbilityId = effectSpecific.sourceAbility as IChampionAbilityId;
			const champion = await useChampion(sourceAbilityId.id);
			const precomputedSourceAbilityDesc = computeAbilityDescription(champion, sourceAbilityId);

			const searchString = createSearchString(`${effectSpecific.label};${champion.name};${precomputedSourceAbilityDesc.tooltip.replaceAll(htmlTagRegex, '')}`);
			effectSearchStrings.set(effectObjectName, searchString);

			return {
				abilityId: GameAbilityId.build(AbilityType.effect, effectObjectName),
				sourceAbilityId,
				name: `${champion.name} ${sourceAbilityId.abilityKey === 'passive' ? 'P' : sourceAbilityId.abilityKey.toUpperCase()} - ${precomputedSourceAbilityDesc.name}`,
				searchString,
			};
		})));

	isLoading.value = false;
}

const UnknownComponent = () => h('article', { class: 'unknown' }, ['UNKNOWN']);

function effectComponent(effectId: IEffectAbilityId): Component | undefined {
	const effectSpecific = EFFECT_SPECIFICS[effectId.id];
	if (!effectSpecific) {
		console.warn(`[CalculatorEffectsDialog effectComponent] failed to find specific for`, effectId);
		return;
	}

	return effectSpecific.sourceAbility.type === AbilityType.item
		? ITEM_COMPONENTS[effectSpecific.sourceAbility.id]?.effects
		: effectSpecific.sourceAbility.type === AbilityType.champion
			? CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]?.effects
			: effectSpecific.sourceAbility.type === AbilityType.dragon
				? DRAGON_COMPONENTS[effectSpecific.sourceAbility.id]?.[effectSpecific.sourceAbility.subtype]?.effects
				: EFFECT_COMPONENTS[effectSpecific.sourceAbility.id]?.effects;
}

const { addItemTooltipViewListeners, removeItemTooltipViewListeners } = useItemHoverTooltipView('Inventory');
const hoveredEffectId = shallowRef<IEffectAbilityId>();
const effectHoverTooltipEl = useTemplateRef('effectHoverTooltip');

function showEffectTooltip(event: MouseEvent, effectId: IEffectAbilityId) {
	hoveredEffectId.value = effectId;
	event.target?.addEventListener('mouseleave', hideEffectTooltip, { passive: true, once: true });
	EFFECT_SPECIFICS[effectId.id].sourceAbility.type === AbilityType.item && addItemTooltipViewListeners();
	effectHoverTooltipEl.value?.el?.showPopover();
}

function hideEffectTooltip() {
	effectHoverTooltipEl.value?.el?.hidePopover();
	removeItemTooltipViewListeners();
}

const search = ref('');
const splitSearch = computed(() => search.value.toLocaleLowerCase().replaceAll(/[^a-z ]/g, '').split(' ').filter(v => v));

interface IAppliedEffectWithSearchString {
	effect: IDamageSourceEffect;
	searchString?: string;
}

const appliedEffectsWithSearchStrings = computed((): IAppliedEffectWithSearchString[] | undefined =>
	damageSource.value?.appliedEffects.value.map((effect): IAppliedEffectWithSearchString => ({
		effect,
		searchString: effectSearchStrings.get(effect.abilityId.id),
	})),
);

function searchFilteredEffects<T extends { searchString?: string }>(options?: T[]): T[] | undefined {
	if (search.value) {
		return options?.filter(option =>
			splitSearch.value.every(word => !option.searchString || option.searchString.includes(word)));
	}
	return options;
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog
		id="dialog-effects"
		ref="vDialog"
		:aria-busy="isLoading"
		:data-is-searched="search ? '' : undefined"
		@open="loadChampionEffects"
	>
		<header>
			<h1>
				effects
			</h1>
			<div class="inline-search-label">
				<input
					id="champ-select-search"
					v-model="search"
					autofocus
					type="text"
					:data-empty="!search"
				>
				<label for="item-shop-search">
					<Icon class="i-ph:magnifying-glass-bold" />
					Search
				</label>
				<button title="clear" @mousedown.prevent="search = ''">
					<span>
						clear
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</div>
			<form method="dialog">
				<button value="cancel" title="close" class="other-ui-btn">
					<span>
						close
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</form>
			<h2>loading...</h2>
		</header>
		<ul :inert="isLoading">
			<li
				v-for="{ effect } in searchFilteredEffects(appliedEffectsWithSearchStrings)"
				:key="effect.abilityId.id"
				:style="`anchor-name: --effect-${effect.abilityId.id}`"
			>
				<component
					:is="effectComponent(effect.abilityId) ?? UnknownComponent"
					:ability-id="effect.abilityId"
					:damage-source
					id-prefix="effects-dialog"
					@img-mouseenter="(event: MouseEvent) => damageSource && showEffectTooltip(event, effect.abilityId)"
				>
					<button
						class="pretend-ui-btn remove"
						title="remove"
						@click="damageSource?.removeEffect(effect.abilityId)"
					>
						<span>remove</span>
						<Icon class="i-ph:trash" />
					</button>
				</component>
			</li>
		</ul>
		<template v-for="group in effectOptionGroups" :key="group.type">
			<h2>{{ group.label }}</h2>
			<ul :inert="isLoading">
				<li
					v-for="effect in damageSource && searchFilteredEffects(group.options)"
					:key="`${group.type}-${effect.abilityId.id}`"
					:style="`anchor-name: --effect-${effect.abilityId.id}`"
				>
					<component
						:is="effectComponent(effect.abilityId) ?? UnknownComponent"
						:ability-id="effect.abilityId"
						:damage-source
						id-prefix="effects-dialog"
						@img-mouseenter="(event: MouseEvent) => showEffectTooltip(event, effect.abilityId)"
					/>
				</li>
			</ul>
		</template>
		<!-- deliberately not passing damageSource here because these effects are applied by a different champion. Effects from own items are applied with item extras -->
		<LolEffectHoverTooltip
			ref="effectHoverTooltip"
			:ability-id="hoveredEffectId"
			:style="hoveredEffectId && `position-anchor: --effect-${hoveredEffectId.id}`"
		/>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-effects {
		--at-apply: 'bg-[--cyan-bg] flex-col w-max min-w-[min(90vw,768px)] shadow-lg px-3 pb-2 b b-[--ui-btn-border-clr] h-200 of-y-auto';
		anchor-scope: all;
		--pt: calc(2 * var(--spacing));
		--ability-size: calc(14 * var(--spacing));

		&[open] {
			--at-apply: 'flex';
		}

		> header {
			--at-apply: 'pt-[--pt] flex items-center pb-2 sticky top-0 gap-3 z-2 bg-inherit b-b b-[--ui-btn-border-clr]';

			> h1 {
				--at-apply: 'leading-7 text-neutral-200 font-700 uppercase text-lg';
			}

			> div {
				--at-apply: 'ms-auto';
			}

			> form {
				> button {
					--at-apply: 'grid place-items-center size-7 rounded-1/2';

					> span:first-child {
						--at-apply: 'sr-only';
					}

					> .icon {
						--at-apply: 'size-4';
					}
				}
			}

			> h2:first-of-type {
				--at-apply: 'hidden z-1 text-center absolute inset-x-0 inset-t-12 pt-[calc(var(--ability-size)/2)] font-600 text-2xl';
				-webkit-text-stroke: black 0.1em;
				paint-order: stroke fill;
			}
		}

		> h2 {
			--at-apply: 'mt-auto mb-0.5';
		}

		&[aria-busy='true'] > header > h2 {
			--at-apply: 'block';
		}

		> ul {
			--at-apply: 'grid grid-cols-[repeat(4,minmax(0,240px))] auto-rows-min gap-x-3 gap-y-2 mb-3 h-min last-of-type:mb-0';

			&::before {
				--at-apply: 'col-span-full text-neutral-300 font-500 text-lg';
			}

			&:first-of-type {
				--at-apply: 'min-h-[max(40%,20rem)] pt-2';

				&:empty::before {
					--at-apply: 'text-center mt-[calc((var(--ability-size))/2-var(--spacing)*1.75)]';
					content: 'select effects to apply';
				}
			}

			&:not(:first-of-type):empty::before {
				--at-apply: 'text-start py-1';
				content: 'no effects left';
			}

			> li {
				--at-apply: 'w-full';
			}
		}

		> ul[inert],
		> h2:has(+ ul[inert]) {
			--at-apply: 'blur-2';
		}

		&[data-is-searched] > ul:not(:first-of-type):empty::before {
			content: 'no effects matching search';
		}

		> .effect-hover-tooltip-container {
			--at-apply: 'items-center';
			inset-block-start: calc(anchor(end) - 1px);
			justify-self: anchor-center;
		}
	}
}
</style>
