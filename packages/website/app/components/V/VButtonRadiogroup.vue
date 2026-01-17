<script setup lang="ts" generic="T, ValueKey extends keyof T">
const props = defineProps<{
	id: string;
	label: string;
	options: T[];
	valueKey: ValueKey;
	titleKey?: keyof T | '';
	required?: boolean;
	onOptionMouseenter?: (event: MouseEvent, option: T) => void;
	onOptionFocus?: (event: FocusEvent, option: T) => void;
}>();

const value = defineModel<T[ValueKey]>();
// TODO could use ref on `v-for` but the order isn't guaranteed https://github.com/vuejs/core/issues/4010
const container = useTemplateRef('container');

function onKeydown(e: KeyboardEvent) {
	const currentOption = e.target;
	const tabButtons = Array.from(container.value!.querySelectorAll('button'));
	const currentIndex = tabButtons.indexOf(currentOption as HTMLButtonElement);

	if (currentIndex === -1) {
		return;
	}

	const tabLength = tabButtons!.length;
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
	tabButtons![newIndex]?.focus();
}

function selectOption(tab: T[ValueKey]) {
	value.value = !props.required && value.value === tab ? undefined : tab;
}
</script>

<template>
	<div :id ref="container" role="radiogroup" :aria-labelledby="`${id}-lbl`" @keydown="onKeydown">
		<span :id="`${id}-lbl`" class="sr-only">{{ label }}</span>
		<button
			v-for="(option, index) in options"
			:key="option[valueKey] as string"
			role="radio"
			:title="titleKey !== '' ? option[titleKey || valueKey] as string : undefined"
			:tabindex="(!value && index === 0) || value === option[valueKey] ? 0 : -1"
			:aria-checked="value === option[valueKey]"
			@mouseenter="onOptionMouseenter?.($event, option)"
			@focus="onOptionFocus?.($event, option)"
			@click="selectOption(option[valueKey])"
		>
			<slot :option :is-selected="value === option[valueKey]" />
		</button>
	</div>
</template>
