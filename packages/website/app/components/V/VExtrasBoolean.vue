<script setup lang="ts">
defineProps<{
	idPrefix: string;
	imgSrc: string;
	imgSize: string | number;
	label: string;
}>();

defineEmits<{
	imgMouseenter: [event: MouseEvent];
}>();

const value = defineModel<number>({ required: true });
</script>

<template>
	<article class="v-extras-boolean">
		<img
			:src="imgSrc"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<input
			:id="`vebln-${idPrefix}`"
			v-model="value"
			type="checkbox"
			:true-value="1"
			:false-value="0"
		>
		<label :for="`vebln-${idPrefix}`">
			apply {{ label }}
		</label>
		<slot />
	</article>
</template>

<style>
@layer components {
	.v-extras-boolean {
		--at-apply: 'grid grid-cols-[auto_max-content_1fr] grid-rows-1 items-center relative';

		> input {
			--at-apply: 'me-[0.5ch] mt-px';
		}

		> label {
			--at-apply: 'leading-[1.1]';
		}
	}
}
</style>
