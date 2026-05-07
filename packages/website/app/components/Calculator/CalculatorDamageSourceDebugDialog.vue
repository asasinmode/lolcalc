<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';

const damageSource = defineModel<DamageSource>();

const vDialog = useTemplateRef('vDialog');

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog
		id="damage-source-debug"
		ref="vDialog"
	>
		debug {{ damageSource?.id }}
	</VDialog>
</template>
