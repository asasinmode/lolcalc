<script setup vapor lang="ts">
const el = useTemplateRef('el');

onMounted(() => {
	// TODO check what's tutorialed and show appropriate
});

function finishTutorial() {
	localStorage.setItem('lolcalc-tutorial-finished-at', new Date().toJSON());
	el.value?.hidePopover();
}

defineExpose({
	reset() {
		localStorage.removeItem('lolcalc-tutorial-finished-at');
		el.value?.showPopover();
	},
});
</script>

<template>
	<article id="tutorial-popover" ref="el" popover="manual" class="hover-tooltip custom">
		<h1>tutorial popover</h1>
		<p>and its contents</p>
		<button class="pretend-ui-btn" @click="finishTutorial">finish</button>
	</article>
</template>

<style>
@layer components {
	#tutorial-popover {
		> h1 {
			--at-apply: 'text-white font-600';
		}
	}
}

@layer overrides {
	#tutorial-popover {
		--at-apply: 'pointer-events-auto';
	}
}
</style>
