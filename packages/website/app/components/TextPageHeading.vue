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
		<NuxtLink :to="`#${id}`">
			<span aria-hidden="true">#</span><span>link to the "{{ text }}" section</span>
		</NuxtLink>
	</component>
</template>
