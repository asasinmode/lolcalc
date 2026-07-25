<script setup lang="ts">
const { _setup } = useReportIssueDialog();
const vDialog = useTemplateRef('vDialog');

const composableClose = _setup(() => vDialog.value?.open());

function onClose() {
	composableClose();
}
</script>

<template>
	<VDialog
		id="dialog-report-issue"
		ref="vDialog"
		@close="onClose"
	>
		<header>
			<h1>report an issue</h1>
			<form method="dialog">
				<button value="cancel" title="close" class="other-ui-btn">
					<span>
						close
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</form>
		</header>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-report-issue {
		--at-apply: 'bg-[--cyan-bg] flex-col w-max min-w-[min(90vw,768px)] shadow-lg px-3 pb-2 b b-[--ui-btn-border-clr] h-200 of-y-auto';
		anchor-scope: all;
		--pt: calc(2 * var(--spacing));
		--ability-size: calc(14 * var(--spacing));

		&[open] {
			--at-apply: 'flex';
		}

		> header {
			--at-apply: 'pt-[--pt] flex items-center pb-2 sticky top-0 gap-3 z-2 bg-inherit b-b b-[--ui-btn-border-clr]';

			> h1 {
				--at-apply: 'leading-7 text-neutral-200 font-700 uppercase text-lg';
			}

			> form {
				--at-apply: 'ms-auto';

				> button {
					--at-apply: 'grid place-items-center size-7 rounded-1/2';

					> span:first-child {
						--at-apply: 'sr-only';
					}

					> .icon {
						--at-apply: 'size-4';
					}
				}
			}
		}
	}
}
</style>
