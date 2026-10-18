<script setup vapor lang="ts">
defineExpose({
	el: useTemplateRef('el'),
});
</script>

<template>
	<div ref="el" class="damage-source-thumbnail" inert="true" aria-hidden="true">
		<span><img /></span>
		<span />
		<div><img class="primary-path-keystone" /><span class="secondary-path" /></div>
		<ul>
			<li v-for="i in 7" :key="i" :style="i === 7 ? 'display: none' : undefined">
				<img />
			</li>
		</ul>
	</div>
</template>
