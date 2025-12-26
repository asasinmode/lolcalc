<script setup lang="ts" generic="T, ValueKey extends keyof T">
const props = defineProps<{
	id: string;
	label: string;
	options: T[];
	valueKey: ValueKey;
	titleKey?: keyof T;
	required?: boolean;
}>();

const value = defineModel<T[ValueKey]>();
const tabButtons = useTemplateRef('tabButton');

function onKeydown(e: KeyboardEvent) {
	const currentOption = e.target;
	const currentIndex = tabButtons.value!.indexOf(currentOption as HTMLButtonElement);

	if (currentIndex === -1) {
		return;
	}

	const tabLength = tabButtons.value!.length;
	let newIndex = 0;
	switch (e.key) {
		case 'ArrowDown':
		case 'ArrowRight':
			newIndex = (currentIndex + 1) % tabLength;
			break;
		case 'ArrowUp':
		case 'ArrowLeft':
			newIndex = (currentIndex - 1 + tabLength) % tabLength;
			break;
		default:
			return;
	}

	e.preventDefault();
	e.stopPropagation();
	value.value = props.options[newIndex]![props.valueKey];
	tabButtons.value![newIndex]?.focus();
}

function selectOption(tab: T[ValueKey]) {
	value.value = !props.required && value.value === tab ? undefined : tab;
}
</script>

<template>
	<div :id role="radiogroup" :aria-labelledby="`${id}-lbl`" @keydown="onKeydown">
		<span :id="`${id}-lbl`" class="sr-only">{{ label }}</span>
		<button
			v-for="(option, index) in options"
			:key="option[valueKey] as string"
			ref="tabButton"
			role="radio"
			:title="option[titleKey || valueKey] as string"
			:tabindex="(!value && index === 0) || value === option[valueKey] ? 0 : -1"
			:aria-checked="value === option[valueKey]"
			@click="selectOption(option[valueKey])"
		>
			<slot :option :is-selected="value === option[valueKey]" />
		</button>
	</div>
</template>
