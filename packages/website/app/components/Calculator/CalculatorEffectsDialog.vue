<script setup lang="ts">
const damageSource = defineModel<DamageSource>();

const items = useItems();

const vDialog = useTemplateRef('vDialog');

const itemsWithEffects = Object.entries(ITEM_SPECIFICS).filter(([,specific]) => 'setupEffectData' in specific).map(([itemId]) => items[itemId]!).sort((itemA, itemB) => itemA.name.localeCompare(itemB.name));

interface IEffectOptionGroup {
	type: 'champion' | 'item';
	label: string;
	options: {
		championOrItemId: string;
		name: string;
		abilityKey?: IChampionAbilityKey;
		abilityVariant?: number;
	}[];
}

const effectOptionGroups = computed(() => {
	const groups: IEffectOptionGroup[] = [];

	groups.push({
		type: 'item',
		label: 'items',
		options: itemsWithEffects.map((item): IEffectOptionGroup['options'][number] => ({
			championOrItemId: item.id,
			name: item.name,
		})).filter(effect => !damageSource.value?.appliedEffects.value.some(appliedEffect =>
			appliedEffect.type === 'item' && appliedEffect.championOrItemId === effect.championOrItemId
		)),
	});

	return groups.filter(group => group.options.length);
});

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
		abilityVariant: option.abilityVariant
	});
	(event.target as HTMLFormElement).reset();
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-effects" ref="vDialog">
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
		<ul>
			<li v-for="effect in damageSource?.appliedEffects.value" :key="effect.id">
				{{ effect.id }}
				<button @click="damageSource?.removeEffect(effect.id)">
					remove
				</button>
			</li>
		</ul>
		<form @submit.prevent="submitAnotherEffect">
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
						:key="`${group.type}-${option.championOrItemId}-${option.abilityKey}-${option.abilityVariant}`"
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
