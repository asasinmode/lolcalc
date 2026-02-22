<script setup lang="ts" generic="T">
defineProps<{
	id: string;
	label: string;
	options: [value: T, text: string | number][];
	clearable?: boolean;
}>();

const value = defineModel<T>();

function setValue(event: Event) {
	value.value = (event.target as HTMLSelectElement).value as T || undefined;
}
</script>

<template>
	<div class="v-select">
		<select :id :value @change="setValue" @click.right.prevent="value = undefined">
			<option v-if="clearable" value="">
				&lt;none&gt;
			</option>
			<option v-for="[optionValue, text] in options" :key="text" :value="optionValue">
				{{ text }}
			</option>
		</select>
		<label :for="id">
			<span>{{ label }}</span>
			<slot />
		</label>
	</div>
</template>

<style>
@layer components {
	.v-select {
		--at-apply: 'relative';

		select {
			--at-apply: 'absolute size-full of-hidden rounded-full cursor-pointer z-0';
		}

		select:focus-visible + label {
			outline: auto;
		}

		label {
			--at-apply: 'block relative pointer-events-none';

			> :first-child {
				--at-apply: 'sr-only';
			}

			> button {
				--at-apply: 'size-full';
			}
		}
	}
}
</style>
