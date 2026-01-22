<script setup lang="ts">
defineProps<{
	feature: string;
}>();
</script>

<template>
	<div class="font-600 text-center bg-neutral-950/30 grid grid-center cursor-default z-50">
		<span class="sr-only">{{ feature }}</span>
		<p class="uppercase">
			not implemented <br>
			coming soon
		</p>
	</div>
</template>
