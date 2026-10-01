<script setup lang="ts">
defineOptions({
	inheritAttrs: false,
});

defineProps<{
	id: string;
	label: string;
	items: [
		text: string,
		callback: () => unknown,
		disabled?: boolean,
	][];
}>();

function onColumnMenuToggle(event: ToggleEvent) {
	if (event.newState !== 'open') {
		return;
	}

	nextTick(() => {
		for (const child of (event.currentTarget as HTMLElement).children) {
			if (child.getAttribute('disabled') !== 'true') {
				(child as HTMLElement).focus();
			}
		}
	});
}

function onColumnMenuKeydown(event: KeyboardEvent) {
	const menu = event.currentTarget as HTMLElement;
	const items = [...menu.querySelectorAll<HTMLButtonElement>(':not(:disabled)')];
	if (!items.length) {
		return;
	}

	const index = items.indexOf(document.activeElement as HTMLButtonElement);
	if (!~index) {
		return;
	}

	console.log('keying');
	switch (event.key) {
		case 'ArrowDown': {
			event.preventDefault();
			items[(index + 1) % items.length]!.focus();
			break;
		}
		case 'ArrowUp': {
			event.preventDefault();
			items[(index - 1 + items.length) % items.length]!.focus();
			break;
		}
		case 'Home': {
			event.preventDefault();
			items[0]!.focus();
			break;
		}
		case 'End': {
			event.preventDefault();
			items[items.length - 1]!.focus();
			break;
		}
	}
}

function selectOption(event: MouseEvent, callback: () => unknown) {
	callback();
	((event.currentTarget as HTMLElement)?.closest('[popover]') as HTMLElement)?.hidePopover();
}
</script>

<template>
	<button
		v-bind="$attrs"
		aria-haspopup="menu" :aria-controls="`menu-${id}`" :popovertarget="`menu-${id}`"
	>
		<slot />
	</button>
	<div
		:id="`menu-${id}`"
		popover="auto"
		role="menu"
		:aria-label="label"
		@toggle="onColumnMenuToggle($event)"
		@keydown="onColumnMenuKeydown($event)"
	>
		<button
			v-for="(item, index) in items"
			:key="index"
			role="menuitem"
			:disabled="toValue(item[2])"
			@click="selectOption($event, item[1])"
		>
			{{ item[0] }}
		</button>
	</div>
</template>

<style>
@layer components {
}
</style>
