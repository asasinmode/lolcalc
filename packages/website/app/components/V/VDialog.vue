<script setup lang="ts">
const emit = defineEmits<{
	close: [isCancelled: boolean];
}>();

const dialogEl = useTemplateRef('dialogEl');

function closeDialog() {
	if (dialogEl.value) {
		emit('close', dialogEl.value.returnValue === 'cancel');
	} else {
		console.warn('dialog closed without ref value');
		emit('close', false);
	}
}

defineExpose({
	open() {
		dialogEl.value?.showModal();
	},
	close(returnValue?: 'save' | 'cancel') {
		dialogEl.value?.close(returnValue);
	},
});
// TODO add aria-labelledby and title to all dialogs
</script>

<template>
	<dialog ref="dialogEl" class="m-auto" @close="closeDialog">
		<slot />
	</dialog>
</template>
