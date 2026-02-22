<template>
	<p class="alert warning">
		<Icon class="i-ph:warning-light" />
		Some variables weren't resolved correctly. Please <a href="#">TODO report this issue</a>
	</p>
</template>

<style>
@layer components {
	.alert {
		--at-apply: 'b relative w-fit rounded-md py-2 ps-2 text-wrap of-hidden';

		a {
			--at-apply: 'inline font-600';
		}

		&::before {
			--at-apply: 'block float-end -mt-2 ms-[0.5ch] content-empty z-0 size-4 rounded-es-sm';
		}

		.icon {
			--at-apply: 'size-3.5 z-10 absolute end-0.125 top-0.125';
		}

		&.warning {
			--at-apply: 'b-amber-600 bg-amber-900/10 text-amber-400';

			&::before {
				--at-apply: 'bg-amber-400';
			}

			.icon {
				--at-apply: 'text-amber-950';
			}
		}

		&.error {
			--at-apply: 'b-red-600 bg-red-900/10 text-red-400';

			&::before {
				--at-apply: 'bg-red-400';
			}

			.icon {
				--at-apply: 'text-red-950';
			}
		}
	}
}
</style>
