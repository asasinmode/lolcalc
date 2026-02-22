<script setup lang="ts" generic="T">
const props = defineProps<{
	id: string;
	label: string;
	options: [value: T, text: string | number][];
	clearable?: boolean;
}>();

defineEmits<{
	labelMouseenter: [event: MouseEvent];
}>();

const value = defineModel<T>();

function setValue(event: Event) {
	value.value = (event.target as HTMLSelectElement).value as T || undefined;
}

function clear(event: MouseEvent) {
	if (props.clearable) {
		value.value = undefined;
		event.preventDefault();
	}
}
</script>

<template>
	<div class="v-select">
		<select
			:id
			:value
			@change="setValue"
			@click.right="clear"
			@mouseenter="$emit('labelMouseenter', $event)"
		>
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
		<slot name="post" />
	</div>
</template>

<style>
@layer components {
	.v-select {
		--at-apply: 'relative';

		select {
			--at-apply: 'absolute inset-0 of-hidden cursor-pointer z-0';
		}

		select:focus-visible + label {
			outline: auto;
		}

		label {
			--at-apply: 'block relative pointer-events-none z-1';

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
