<script setup lang="ts">
defineProps<{
	idPrefix: string;
	img: string;
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
			:src="img"
			:width="imgSize"
			:height="imgSize"
			aria-hidden="true"
			@mouseenter="$emit('imgMouseenter', $event)"
		>
		<input
			:id="`vebln-${idPrefix}-input`"
			v-model="value"
			type="checkbox"
			:true-value="1"
			:false-value="0"
		>
		<label :for="`vebln-${idPrefix}-input`">
			activate {{ label }}
		</label>
	</article>
</template>

<style>
@layer components {
	.v-extras-boolean {
		--at-apply: 'grid grid-cols-[auto_max-content_1fr] grid-rows-1 items-center relative';

		&:before {
			--at-apply: 'size-2.5 rounded-1/2 bg-green-400 outline outline-black z-1 absolute top-1/2 start-[calc(var(--p)+var(--ability-size)-0.75*var(--spacing))] -translate-x-full -translate-y-[calc(0.5*var(--ability-size)-1*var(--spacing))] pointer-events-none';
		}

		&:has(input:checked)::before {
			content: '';
		}

		> input {
			--at-apply: 'me-[0.5ch] mt-px';
		}

		> label {
			--at-apply: 'leading-[1.1]';
		}
	}
}
</style>
