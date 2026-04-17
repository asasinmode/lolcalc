<script setup lang="ts">
const emit = defineEmits<{
	open: [];
	close: [isCancelled: boolean];
}>();

const dialogEl = useTemplateRef('dialogEl');

function closeDialog() {
	const { returnValue } = dialogEl.value!;
	emit('close', !returnValue || returnValue === 'cancel');
	dialogEl.value!.returnValue = '';
}

function closeOnClickOutside(event: MouseEvent) {
	const rect = dialogEl.value!.getBoundingClientRect();
	const clickedOutside = event.clientX < rect.left
		|| event.clientX > rect.right
		|| event.clientY < rect.top
		|| event.clientY > rect.bottom;

	if (clickedOutside && event.target === dialogEl.value) {
		dialogEl.value?.close();
		document.removeEventListener('click', closeOnClickOutside);
	}
}

onBeforeUnmount(() => {
	document.removeEventListener('click', closeOnClickOutside);
});

defineExpose({
	open() {
		dialogEl.value?.showModal();
		emit('open');
		setTimeout(() => document.addEventListener('click', closeOnClickOutside), 0);
	},
	close(returnValue?: string) {
		dialogEl.value?.close(returnValue);
		document.removeEventListener('click', closeOnClickOutside);
	},
});
// TODO add aria-labelledby and title to all dialogs
</script>

<template>
	<dialog ref="dialogEl" class="m-auto" @close="closeDialog">
		<slot />
	</dialog>
</template>

<style>
@layer components {
	dialog {
		--at-apply: 'drop-shadow-xl drop-shadow-black/30';

		&::backdrop {
			--at-apply: 'bg-neutral-950/25';
		}
	}
}
</style>
