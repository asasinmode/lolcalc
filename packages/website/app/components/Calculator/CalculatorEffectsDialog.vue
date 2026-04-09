<script setup lang="ts">
import type { IChampionAbilityHoverTooltipProps, IItemDescriptionProps } from '~/utils/types';

const damageSource = defineModel<DamageSource>();

const text = useText();
const items = useItems();
const { minorVersion } = usePatchVersion();

const vDialog = useTemplateRef('vDialog');

interface IEffectOptionGroup {
	type: 'champion' | 'item';
	label: string;
	options: {
		championOrItemId: string;
		name: string;
		abilityKey?: IChampionAbilityKey;
		abilityVariantIndex?: number;
		hoverTooltipData: IChampionAbilityHoverTooltipProps | Pick<IItemDescriptionProps, 'precomputedDescription'>;
	}[];
}

const itemEffects: IEffectOptionGroup['options'] = Object
	.entries(ITEM_SPECIFICS)
	.filter(([, specific]) => 'setupEffectData' in specific)
	.map(([itemId]): IEffectOptionGroup['options'][number] => {
		const item = items[itemId]!;
		const precomputedDescription = computedItemDescription(text, minorVersion, item, undefined, { replaceWithName: true })!;

		return {
			championOrItemId: item.id,
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
				appliedEffect.type === 'champion' && appliedEffect.championOrItemId === effect.championOrItemId && appliedEffect.abilityKey === effect.abilityKey && appliedEffect.abilityVariantIndex === effect.abilityVariantIndex,
			)),
		},
		{
			type: 'item',
			label: 'items',
			options: itemEffects.filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
				appliedEffect.type === 'item' && appliedEffect.championOrItemId === effect.championOrItemId,
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
				const abilitySpecific = (specific as IChampionSpecificsWithAbilities)[abilityKey];
				if (abilitySpecific) {
					for (const [abilityVariantIndex, variantSpecific] of Object.entries(abilitySpecific) as unknown as [number, IChampionAbilityVariantSpecific][]) {
						if ('setupEffectData' in variantSpecific) {
							champion ||= await useChampion(championId);

							const precomputedDescription = computedAbilityDescription(minorVersion, champion, abilityKey!, abilityVariantIndex as unknown as number);

							effects.push({
								championOrItemId: championId,
								abilityVariantIndex,
								abilityKey,
								name: `${champion.name} ${abilityKey === 'passive' ? 'P' : abilityKey.toUpperCase()} - ${champion.abilities[abilityKey]!.variants[abilityVariantIndex as unknown as number]!.name}`,
								hoverTooltipData: {
									precomputedDescription,
									championId: championId as IChampionId,
									abilityKey,
									abilityVariantIndex: abilityVariantIndex as unknown as number,
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
	damageSource.value?.addEffect({
		type: group.type,
		championOrItemId: option.championOrItemId,
		abilityKey: option.abilityKey,
		abilityVariantIndex: option.abilityVariantIndex,
	});
	(event.target as HTMLFormElement).reset();
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
			<li v-for="effect in damageSource?.appliedEffects.value" :key="effect.id">
				{{ effect.id }}
				<button @click="damageSource?.removeEffect(effect.id)">
					remove
				</button>
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
						:key="`${group.type}-${option.championOrItemId}-${option.abilityKey ?? ''}-${option.abilityVariantIndex ?? ''}`"
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
		--at-apply: 'bg-cyan-950 grid-rows-[auto_1fr] max-h-[80vh] w-[min(90vw,_600px)] shadow-lg px-3 pb-2';

		&[open] {
			--at-apply: 'grid';
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

		> form {
			--at-apply: 'grid grid-cols-[auto_1fr] auto-rows-min gap-x-2';

			> label {
				--at-apply: 'col-span-full text-start text-lg';
			}

			> select {
				--at-apply: 'w-64 px-1';

				&:disabled {
					--at-apply: 'text-neutral-400';
				}
			}

			> button {
				--at-apply: 'w-fit px-1 h-6';
			}
		}
	}
}
</style>
