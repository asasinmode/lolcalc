<script setup lang="ts">
const enableUnimplementedUi = useEnableUnimplementedUi();

const damageSources = defineModel<DamageSource[]>('sources', { required: true });
const damageTargets = defineModel<DamageSource[]>('targets', { required: true });

function clear(index: number, target: DamageSource[]) {
	target[index] = markRaw(new DamageSource());
}

function remove(index: number, target: DamageSource[]) {
	target.splice(index, 1);
}

function add(target: DamageSource[]) {
	target.push(markRaw(new DamageSource()));
}

function duplicate(index: number, target: DamageSource[], shift: boolean) {
	const newItem = markRaw(target[index]!.clone());
	if (shift) {
		const into = target === damageSources.value ? damageTargets.value : damageSources.value;
		if (into[0]?.anythingFilled.value) {
			into.push(newItem);
		} else {
			into[0] = newItem;
		}
	} else {
		target.splice(index + 1, 0, newItem);
	}
}

function changeGroup(index: number, target: DamageSource[], alt: boolean) {
	const into = target === damageSources.value ? damageTargets.value : damageSources.value;
	let newItem: DamageSource;
	if (alt) {
		newItem = markRaw(target[index]!.clone());
	} else {
		newItem = target.splice(index, 1)[0]!;
		!target.length && target.push(markRaw(new DamageSource()));
	}
	if (into[0]?.anythingFilled.value) {
		into.push(newItem);
	} else {
		into[0] = newItem;
	}
}

function move(index: number, target: DamageSource[], toIndex: number, alt: boolean) {
	const newItem = alt ? markRaw(target[index]!.clone()) : target.splice(index, 1)[0]!;
	target.splice(toIndex, 0, newItem);
}
</script>

<template>
	<article id="calculator-scoreboard" class="mx-auto b grid grid-flow-col grid-rows-[auto_min-content_1fr] grid-cols-2 w-max relative after:(bg-white w-px content-empty bottom-0 left-1/2 top-12 absolute -translate-x-1/2)">
		<header class="text-center b-b col-span-full">
			<h1 class="text-xl font-500">
				lolcalc
			</h1>
			<h2 class="text-sm">
				League of Legends damage calculator
			</h2>
			<label for="calculator-scoreboard-enable-unimplemented-ui" class="left-0 top-0 absolute">
				TMP enable unimplemented ui
				<input id="calculator-scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
			</label>
			<label for="calculator-scoreboard-mirror" class="right-0 top-0 absolute">
				TODO mirror layout
				<input id="calculator-scoreboard-mirror" type="checkbox">
			</label>
		</header>
		<h3>
			damage sources
		</h3>
		<ul>
			<CalculatorScoreboardItem
				v-for="(value, index) in damageSources"
				:key="value.id"
				:value
				:index
				:can-remove="damageSources.length > 1"
				:can-move-down="index !== damageSources.length - 1"
				@clear="clear(index, damageSources)"
				@remove="remove(index, damageSources)"
				@duplicate="duplicate(index, damageSources, $event)"
				@change-group="changeGroup(index, damageSources, $event)"
				@move="(toIndex, alt) => move(index, damageSources, toIndex, alt)"
			/>
			<li>
				<button
					class="data-pretend-ui-button"
					:disabled="!damageSources[0]?.anythingFilled.value"
					@click="add(damageSources)"
				>
					<Icon name="ph:plus-bold" />
					add damage source
				</button>
			</li>
		</ul>
		<h3>
			damage targets
		</h3>
		<ul>
			<CalculatorScoreboardItem
				v-for="(value, index) in damageTargets"
				:key="value.id"
				:value
				:index
				:can-remove="damageTargets.length > 1"
				:can-move-down="index !== damageTargets.length - 1"
				is-right
				@clear="clear(index, damageTargets)"
				@remove="remove(index, damageTargets)"
				@duplicate="duplicate(index, damageTargets, $event)"
				@change-group="changeGroup(index, damageTargets, $event)"
				@move="(toIndex, alt) => move(index, damageTargets, toIndex, alt)"
			/>
			<li>
				<button
					class="data-pretend-ui-button"
					:disabled="!damageTargets[0]?.anythingFilled.value"
					@click="add(damageTargets)"
				>
					<Icon name="ph:plus-bold" />
					add damage target
				</button>
			</li>
		</ul>
	</article>
</template>

<style>
@layer components {
	#calculator-scoreboard {
		> h3 {
			@apply 'text-center';
		}

		> ul {
			> li:last-child {
				@apply 'grid-center';

				> button {
					@apply 'p-1';

					.iconify {
						@apply 'align-sub size-4 mr-0.5';
					}
				}
			}
		}
	}
}
</style>
