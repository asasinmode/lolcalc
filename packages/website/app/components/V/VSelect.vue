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
	<label :for="id" class="sr-only">{{ label }}</label>
	<select :id :value @change="setValue">
		<option v-if="clearable" value="">
			&lt;none&gt;
		</option>
		<option v-for="[optionValue, text] in options" :key="text" :value="optionValue">
			{{ text }}
		</option>
	</select>
</template>
