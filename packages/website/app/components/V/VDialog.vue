<script setup lang="ts">
const emit = defineEmits<{
	close: [isCancelled: boolean];
}>();

const dialogEl = useTemplateRef('dialogEl');

function closeDialog() {
	const { returnValue } = dialogEl.value!;
	emit('close', !returnValue || returnValue === 'cancel');
	dialogEl.value!.returnValue = '';
}

defineExpose({
	open() {
		dialogEl.value?.showModal();
	},
	close(returnValue?: string) {
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
