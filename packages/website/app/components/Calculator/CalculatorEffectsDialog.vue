<script setup lang="ts">
import type { IChampionAbilityHoverTooltipProps, IGameAbilityId, IItemDescriptionProps } from '~/utils/types';
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
		abilityId: IGameAbilityId;
		name: string;
		hoverTooltipData: IChampionAbilityHoverTooltipProps | Pick<IItemDescriptionProps, 'precomputedDescription'>;
	}[];
}

const itemEffects: IEffectOptionGroup['options'] = Object
	.entries(ITEM_SPECIFICS)
	.filter(([, specific]) => 'setupEffectData' in specific)
	.map(([itemId]): IEffectOptionGroup['options'][number] => {
		const item = items[itemId]!;
		const precomputedDescription = computeItemDescription(text, minorVersion, item, undefined, { replaceWithName: true })!;

		return {
			abilityId: GameAbilityId.build(ABILITY_TYPE.item, 'effects', itemId),
			name: item.name,
			hoverTooltipData: {
				precomputedDescription,
			},
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
				appliedEffect.abilityId.type === 'champion'
				&& appliedEffect.abilityId.type === effect.abilityId.type
				&& appliedEffect.abilityId.abilityKey === effect.abilityId.abilityKey
				&& appliedEffect.abilityId.abilityVariantIndex === effect.abilityId.abilityVariantIndex,
			)),
		},
		{
			type: 'item',
			label: 'items',
			options: itemEffects.filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				appliedEffect.abilityId.type === 'item'
				&& appliedEffect.abilityId.type === effect.abilityId.type
				&& appliedEffect.abilityId.id === effect.abilityId.id,
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

	championEffects.value = (await Promise.all(Object.entries(CHAMPION_SPECIFICS)
		.map(async ([championId, specific]): Promise<IEffectOptionGroup['options']> => {
			const effects: IEffectOptionGroup['options'] = [];
			let champion: IChampion;

			for (const abilityKey of ALL_CHAMPION_ABILITY_KEYS) {
				const abilitySpecific = (specific as IChampionSpecific)[abilityKey];
				if (abilitySpecific) {
					for (const [rawAbilityVariantIndex, variantSpecific] of Object.entries(abilitySpecific) as unknown as [number, IChampionAbilityVariantSpecific][]) {
						if ('setupEffectData' in variantSpecific) {
							const abilityVariantIndex = Number(rawAbilityVariantIndex);
							champion ||= await useChampion(championId);

							const precomputedDescription = computeAbilityDescription(minorVersion, champion, abilityKey!, abilityVariantIndex as unknown as number);

							effects.push({
								abilityId: GameAbilityId.build(ABILITY_TYPE.champion, 'effects', championId as IChampionId, abilityKey, abilityVariantIndex),
								name: `${champion.name} ${abilityKey === 'passive' ? 'P' : abilityKey.toUpperCase()} - ${champion.abilities[abilityKey]!.variants[abilityVariantIndex]!.name}`,
								hoverTooltipData: {
									precomputedDescription,
									championId: championId as IChampionId,
									abilityKey,
									abilityVariantIndex: Number(abilityVariantIndex),
								},
							});
						}
					}
				}
			}

			return effects;
		}))).filter(effects => effects.length).flatMap(effects => effects);

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

function effectComponent(effect: IDamageSourceEffect): Component | undefined {
	if (effect.abilityId.type === 'item') {
		return ITEM_COMPONENTS[effect.abilityId.id]?.effects;
	}
	return CHAMPION_COMPONENTS[effect.abilityId.id]?.effects;
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
		<ul v-show="damageSource?.appliedEffects.value.length" :inert="isLoading">
			<li v-for="effect in damageSource?.appliedEffects.value" :key="effect.id">
				<component
					:is="effectComponent(effect)"
					:ability-id="effect.abilityId"
					:damage-source
					id-prefix="effects-dialog"
				>
					<button
						class="pretend-ui-btn remove"
						title="remove"
						@click="damageSource?.removeEffect(effect.id)"
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
	</VDialog>
</template>

<style>
@layer components {
	#dialog-effects {
		--at-apply: 'bg-cyan-950 grid-rows-[auto_1fr] max-h-[80vh] w-max min-w-[min(90vw,768px)] shadow-lg px-3 pb-2';

		&[open] {
			--at-apply: 'grid';
		}

		> header {
			--at-apply: 'mb-2';

			> h1 {
				--at-apply: 'leading-7';
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
			--at-apply: 'grid grid-cols-[repeat(3,minmax(0,240px))] auto-rows-min gap-x-3 gap-y-2 justify-items-center mb-3';
			--ability-size: calc(14 * var(--spacing));

			> li {
				> article {
					--at-apply: '';
				}
			}
		}

		> form {
			--at-apply: 'grid grid-cols-[auto_1fr] grids-rows-[auto_1fr] gap-x-2';

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
	}
}
</style>
