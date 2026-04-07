<script setup lang="ts" generic="T, ValueKey extends keyof T">
const props = defineProps<{
	id: string;
	label: string;
	options: T[];
	valueKey: ValueKey;
	titleKey?: keyof T | '';
	required?: boolean;
}>();

defineEmits<{
	optionMouseenter: [event: MouseEvent, option: T];
	optionFocus: [event: FocusEvent, option: T];
	optionRightClick: [event: MouseEvent, option: T];
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
	<div
		:id
		ref="container"
		class="v-button-radiogroup"
		role="radiogroup"
		:aria-labelledby="`${id}-lbl`"
		@keydown="onKeydown"
	>
		<span :id="`${id}-lbl`">{{ label }}</span>
		<button
			v-for="(option, index) in options"
			:key="option[valueKey] as string"
			role="radio"
			:title="titleKey !== '' ? option[titleKey || valueKey] as string : undefined"
			:tabindex="(!value && index === 0) || value === option[valueKey] ? 0 : -1"
			:aria-checked="value === option[valueKey]"
			@mouseenter="$emit('optionMouseenter', $event, option)"
			@focus="$emit('optionFocus', $event, option)"
			@click="selectOption(option[valueKey])"
			@click.right="$emit('optionRightClick', $event, option)"
		>
			<slot :option :is-selected="value === option[valueKey]" />
		</button>
	</div>
</template>

<style>
@layer components {
	.v-button-radiogroup {
		> span {
			--at-apply: 'sr-only';
		}
	}
}
</style>
