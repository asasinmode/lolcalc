<script setup vapor lang="ts">
withDefaults(
	defineProps<{
		tag?: string;
		id: string;
		text: string;
	}>(),
	{
		tag: 'h2',
	},
);
</script>

<template>
	<component :is="tag" :id>
		{{ text }}
		<a :href="`#${id}`"
			><span aria-hidden="true">#</span><span>link to the "{{ text }}" section</span></a
		>
	</component>
</template>
