<script setup lang="ts">
defineProps<{
	feature: string;
}>();

const enableUnimplementedUi = useEnableUnimplementedUi();
</script>

<template>
	<div v-if="!enableUnimplementedUi" class="coming-soon-cover">
		<span>{{ feature }}</span>
		<p>
			not implemented <br>
			coming soon
		</p>
	</div>
</template>

<style>
@layer components {
	.coming-soon-cover {
		--at-apply: 'font-600 text-center bg-neutral-950/30 grid grid-center cursor-default z-50';

		> span {
			--at-apply: 'sr-only';
		}

		> p {
			--at-apply: 'uppercase text-wrap';
		}
	}
}
</style>
