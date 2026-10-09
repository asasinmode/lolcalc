<script setup vapor lang="ts">
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

const trigger = useTemplateRef('trigger');
const menu = useTemplateRef('menu');

let pendingFocus: 'first' | 'last' = 'first';

function getEnabledItems(menu: HTMLElement) {
	return [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
}

function focusItem(menu: HTMLElement, which: 'first' | 'last') {
	const items = getEnabledItems(menu);
	(which === 'first' ? items[0] : items.at(-1))?.focus();
}

function onMenuToggle(event: ToggleEvent) {
	if (event.newState === 'open') {
		focusItem(event.target as HTMLElement, pendingFocus);
		pendingFocus = 'first';
	}
}

function onTriggerKeydown(event: KeyboardEvent) {
	if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
		return;
	}

	event.preventDefault();
	const el = menu.value!;
	const which = event.key === 'ArrowUp' ? 'last' : 'first';

	if (el.matches(':popover-open')) {
		focusItem(el, which);
	} else {
		pendingFocus = which;
		el.showPopover();
	}
}

function onMenuKeydown(event: KeyboardEvent) {
	const items = getEnabledItems(event.currentTarget as HTMLElement);
	const index = items.indexOf(document.activeElement as HTMLButtonElement);
	if (index === -1) {
		return;
	}

	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			items[(index + 1) % items.length]!.focus();
			break;
		case 'ArrowUp':
			event.preventDefault();
			items[(index - 1 + items.length) % items.length]!.focus();
			break;
		case 'Home':
			event.preventDefault();
			items[0]!.focus();
			break;
		case 'End':
			event.preventDefault();
			items.at(-1)!.focus();
			break;
	}
}

function onMenuFocusout(event: FocusEvent) {
	const menuEl = event.currentTarget as HTMLElement;
	if (event.target !== trigger.value && !menuEl.contains(event.relatedTarget as Node | null)) {
		menuEl.hidePopover();
	}
}

function selectOption(event: MouseEvent, callback: () => unknown) {
	callback();
	(event.currentTarget as HTMLElement).closest<HTMLElement>('[popover]')?.hidePopover();
}
</script>

<template>
	<button
		v-bind="$attrs"
		ref="trigger"
		class="v-menu-trigger"
		aria-haspopup="menu"
		:aria-controls="`menu-${id}`"
		:popovertarget="`menu-${id}`"
		@keydown="onTriggerKeydown"
	>
		<slot />
	</button>
	<div
		:id="`menu-${id}`"
		ref="menu"
		class="v-menu"
		popover="auto"
		role="menu"
		:aria-label="label"
		@toggle="onMenuToggle"
		@keydown="onMenuKeydown"
		@focusout="onMenuFocusout"
	>
		<button
			v-for="(item, index) in items"
			:key="index"
			role="menuitem"
			tabindex="-1"
			:disabled="item[2]"
			@click="selectOption($event, item[1])"
		>
			{{ item[0] }}
		</button>
	</div>
</template>

<style>
@layer components {
	.v-menu-trigger {
		--at-apply: '';
		anchor-name: --v-menu-trigger;
	}

	.v-menu {
		--at-apply: 'bg-[--placeholder-champion-bg-clr] b b-[--ui-btn-border-clr] flex-col';
		position-anchor: --v-menu-trigger;

		&:popover-open {
			--at-apply: 'flex';
		}

		> * {
			--at-apply: 'py-2.5 px-3 text-neutral-200';

			@media (pointer: fine) {
				& {
					--at-apply: 'py-1.5 px-2.5';
				}
			}

			&:hover,
			&:focus-visible {
				--at-apply: 'bg-white/10';
			}

			&:disabled {
				--at-apply: 'text-neutral-500';

				&:hover,
				&:focus-visible {
					--at-apply: 'bg-transparent';
				}
			}
		}
	}
}
</style>
