<template>
	<p data-unknown-variables-alert="">
		<Icon class="i-ph:warning-light" />
		Some variables weren't resolved correctly. Please <a href="#">TODO report this issue</a>
	</p>
</template>

<style>
@layer components {
	[data-unknown-variables-alert] {
		--at-apply: 'b b-amber-600 relative rounded-md bg-amber-900/10 p-2 text-amber-400 of-hidden';

		a {
			--at-apply: 'inline font-600';
		}

		&:before {
			--at-apply: 'absolute top-0 end-0 content-empty z-0 bg-amber-400 size-4 rounded-bs-md';
		}

		.icon {
			--at-apply: 'size-3.5 z-10 absolute end-0.125 top-0.125 text-amber-950';
		}
	}
}
</style>
