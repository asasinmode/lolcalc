<script setup lang="ts">
import type { IChampionAbilityId, IEffectAbilityId, IGameAbilityId, IItemAbilityId } from '~/utils/types';
import { CHAMPION_COMPONENTS } from '~/components/Champion';
import { ITEM_COMPONENTS } from '~/components/Item';

const damageSource = defineModel<DamageSource>();

const text = useText();
const items = useItems();
const { minorVersion } = usePatchVersion();

const vDialog = useTemplateRef('vDialog');

interface IEffectOptionGroup {
	type: 'champion' | 'item';
	label: string;
	options: {
		abilityId: IEffectAbilityId;
		sourceAbilityId: IGameAbilityId;
		name: string;
		precomputedSourceAbilityDesc: IComputedAbilityDescription | IComputedItemDescription;
	}[];
}

const itemEffects: IEffectOptionGroup['options'] = EFFECT_SPECIFICS_OBJECT_ENTRIES
	.filter(([, specific]) => specific.sourceAbility.type === ABILITY_TYPE.item)
	.map(([effectObjectName, effectSpecific]): IEffectOptionGroup['options'][number] => {
		const sourceAbilityId = effectSpecific.sourceAbility as IItemAbilityId;
		const item = items[sourceAbilityId.id]!;

		return {
			abilityId: GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName),
			sourceAbilityId,
			name: item.name,
			precomputedSourceAbilityDesc: computeItemDescription(text, minorVersion, item, undefined, { replaceWithName: true })!,
		};
	})
	.sort((effectA, effectB) => effectA.name.localeCompare(effectB.name));

const championEffects = shallowRef<IEffectOptionGroup['options']>();

const isLoading = ref(false);

const effectOptionGroups = computed((): IEffectOptionGroup[] => {
	const groups: IEffectOptionGroup[] = [
		{
			type: 'champion',
			label: 'champions',
			options: (championEffects.value ?? []).filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				GameAbilityId.isSame(appliedEffect.abilityId, effect.abilityId),
			)),
		},
		{
			type: 'item',
			label: 'items',
			options: itemEffects.filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				GameAbilityId.isSame(appliedEffect.abilityId, effect.abilityId),
			)),
		},
	];

	return groups.filter(group => group.options.length);
});

async function loadChampionEffects() {
	if (championEffects.value || isLoading.value) {
		return;
	}
	isLoading.value = true;

	championEffects.value = (await Promise.all(EFFECT_SPECIFICS_OBJECT_ENTRIES
		.filter(([, specific]) => specific.sourceAbility.type === ABILITY_TYPE.champion)
		.map(async ([effectObjectName, effectSpecific]): Promise<IEffectOptionGroup['options'][number]> => {
			const sourceAbilityId = effectSpecific.sourceAbility as IChampionAbilityId;
			const champion = await useChampion(sourceAbilityId.id);
			const precomputedSourceAbilityDesc = computeAbilityDescription(minorVersion, champion, sourceAbilityId);

			return {
				abilityId: GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName),
				sourceAbilityId,
				name: `${champion.name} ${sourceAbilityId.abilityKey === 'passive' ? 'P' : sourceAbilityId.abilityKey.toUpperCase()} - ${precomputedSourceAbilityDesc.name}`,
				precomputedSourceAbilityDesc,
			};
		})));

	isLoading.value = false;
}

function submitAnotherEffect(event: SubmitEvent) {
	const value = new FormData(event.target as HTMLFormElement).get('optionIndexes')! as string;
	if (!value) {
		return;
	}

	const [rawGroupIndex, rawOptionIndex] = value.split('-');
	const group = effectOptionGroups.value[Number.parseInt(rawGroupIndex!)]!;
	const option = group.options[Number.parseInt(rawOptionIndex!)]!;
	damageSource.value?.addEffect(option.abilityId);
	(event.target as HTMLFormElement).reset();
}

const UnknownComponent = () => h('article', { class: 'unknown' }, ['UNKNOWN']);

function effectComponent(effect: IDamageSourceEffect): Component | undefined {
	const effectSpecific = EFFECT_SPECIFICS[effect.abilityId.id];
	if (!effectSpecific) {
		console.warn(`[CalculatorEffectsDialog effectComponent] failed to find specific for`, effect.abilityId);
		return;
	}

	return effectSpecific.sourceAbility.type === 'item'
		? ITEM_COMPONENTS[effectSpecific.sourceAbility.id]?.effects
		: CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]?.effects;
}

const { addItemTooltipViewListeners, removeItemTooltipViewListeners } = useItemHoverTooltipView('Inventory');
const hoveredEffectId = shallowRef<[ IEffectAbilityId, number ]>();
const effectHoverTooltipEl = useTemplateRef('effectHoverTooltip');

function showEffectTooltip(event: MouseEvent, appliedEffectIndex: number) {
	if (damageSource.value) {
		const effect = damageSource.value.computed.effects.value[appliedEffectIndex]!;
		hoveredEffectId.value = [effect.abilityId, appliedEffectIndex];
		event.target?.addEventListener('mouseleave', hideEffectTooltip, { passive: true, once: true });
		effect.specific.sourceAbility.type === ABILITY_TYPE.item && addItemTooltipViewListeners();
		effectHoverTooltipEl.value?.el?.showPopover();
	}
}

function hideEffectTooltip() {
	effectHoverTooltipEl.value?.el?.hidePopover();
	removeItemTooltipViewListeners();
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-effects" ref="vDialog" :aria-busy="isLoading" @open="loadChampionEffects">
		<header>
			<h1>
				effects
			</h1>
			<form method="dialog">
				<button autofocus value="cancel" class="other-ui-btn">
					<span>
						close
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</form>
		</header>
		<h2>loading...</h2>
		<ul :inert="isLoading">
			<li
				v-for="(effect, i) in damageSource?.appliedEffects.value"
				:key="effect.id"
				:style="`anchor-name: --effect-${effect.id}`"
			>
				<component
					:is="effectComponent(effect) ?? UnknownComponent"
					:ability-id="effect.abilityId"
					:damage-source
					id-prefix="effects-dialog"
					@img-mouseenter="(event: MouseEvent) => damageSource && showEffectTooltip(event, i)"
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
		<form :inert="isLoading" @submit.prevent="submitAnotherEffect">
			<label for="dialog-effects-add-new-effect">
				add effect
			</label>
			<select
				id="dialog-effects-add-new-effect"
				name="optionIndexes"
				required
				:disabled="!effectOptionGroups.length"
			>
				<option v-if="!effectOptionGroups.length">
					no options left
				</option>
				<optgroup v-for="(group, groupIndex) in effectOptionGroups" :key="group.type" :label="group.label">
					<option
						v-for="(option, optionIndex) in group.options"
						:key="GameAbilityId.stringify(option.abilityId)"
						:value="`${groupIndex}-${optionIndex}`"
					>
						{{ option.name }}
					</option>
				</optgroup>
			</select>
			<button
				type="submit"
				class="other-ui-btn"
				:disabled="!effectOptionGroups.length"
			>
				add
			</button>
		</form>
		<LolEffectHoverTooltip
			ref="effectHoverTooltip"
			:ability-id="hoveredEffectId?.[0]"
			:damage-source
			:style="damageSource && hoveredEffectId && `position-anchor: --effect-${damageSource.appliedEffects.value[hoveredEffectId[1]]?.id}`"
		/>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-effects {
		--at-apply: 'bg-[--cyan-bg] grid-rows-[auto_auto_1fr] w-max min-w-[min(90vw,768px)] shadow-lg px-3 pb-2 b b-[--ui-btn-border-clr] h-200 of-y-auto';
		anchor-scope: all;

		&[open] {
			--at-apply: 'grid';
		}

		> header {
			--at-apply: 'mb-2';

			> h1 {
				--at-apply: 'leading-7 text-neutral-200 font-700 uppercase text-lg';
			}
		}

		> h2 {
			--at-apply: 'hidden z-10 text-center absolute inset-0 inset-t-10 font-600 text-2xl backdrop-blur-2';
			-webkit-text-stroke: black 0.1em;
			paint-order: stroke fill;
		}

		&[aria-busy='true'] > h2 {
			--at-apply: 'block';
		}

		> header {
			--at-apply: 'pt-2 flex';

			> form {
				--at-apply: 'ms-auto';

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
		}

		> ul {
			--at-apply: 'grid grid-cols-[repeat(4,minmax(0,240px))] auto-rows-min gap-x-3 gap-y-2 justify-items-center mb-3 h-min';
			--ability-size: calc(14 * var(--spacing));

			> li {
				--at-apply: 'w-full';
			}
		}

		> form {
			--at-apply: 'grid grid-cols-[auto_1fr] grids-rows-[auto_1fr] gap-x-2 h-min';

			> label {
				--at-apply: 'col-span-full text-start text-lg';
			}

			> select {
				--at-apply: 'w-64 px-1 py-1';

				&:disabled {
					--at-apply: 'text-neutral-400';
				}
			}

			> button {
				--at-apply: 'w-fit px-2 h-full';
			}
		}

		> .effect-hover-tooltip-container {
			--at-apply: 'items-center';
			inset-block-start: calc(anchor(end) - 1px);
			justify-self: anchor-center;
		}
	}
}
</style>
