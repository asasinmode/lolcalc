<script setup lang="ts">
const { _setup } = useReportIssueDialog();

const vDialog = useTemplateRef('vDialog');

function open() {
	vDialog.value?.open();
}

const composableClose = _setup(() => open());

function onClose() {
	composableClose();
}

const category = ref('calculations');

function submitIssue(_event: SubmitEvent) {
	console.log('submitting', window.sessionStorage.getItem(STATE_SESSION_STORAGE_KEY));
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
				<button value="cancel" title="close" class="other-ui-btn" autofocus>
					<span>
						close
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</form>
		</header>
		<form @submit.prevent="submitIssue">
			<div>
				<label for="issue-title">title<span>*</span></label>
				<input id="issue-title" placeholder="Cassiopeia swiftmarch" required>
			</div>
			<div>
				<label for="issue-category">category<span>*</span></label>
				<select id="issue-category" v-model="category" required>
					<option selected value="calculations">
						calculations wrong
					</option>
					<option value="ui">ui broken/bad</option>
					<option value="feature">feature suggestion</option>
					<option value="other">something else</option>
				</select>
			</div>
			<p v-show="category === 'calculations'" class="alert info">
				calculation issues without an image/video showcasing the incorrect setup in game will be ignored. Learn how to attach images by reading the checkbox at the end of this form
				<Icon class="i-ph:info" />
			</p>
			<div>
				<label for="issue-message">message<span>*</span></label>
				<textarea id="issue-message" placeholder="level 5 Cassiopeia with swiftmarch, movement speed rune shard and cloud dragon shows wrong movement speed. Game shows 420, the linked configuration 415" rows="8" required />
			</div>
			<div>
				<label for="issue-contact">where can I contact you?</label>
				<input id="issue-contact" placeholder="discord: username, email: example@email.com">
			</div>
			<label for="issue-configuration">
				<input id="issue-configuration" type="checkbox" checked>
				include link to the current configuration
			</label>
			<label for="issue-disclaimer">
				<input id="issue-disclaimer" type="checkbox" required>
				<span>*</span>I understand that submitting this form will open an issue on the <a href="https://github.com/asasinmode/lolcalc/issues" target="_blank">project's github page</a>. Images or further comments can be added there later, but require an account. If you already have an account, consider opening an issue on github directly.
			</label>
			<button class="other-ui-btn">
				submit
			</button>
		</form>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-report-issue {
		--at-apply: 'bg-[--cyan-bg] flex-col inline-200 min-inline-[min(90vw,768px)] block-max shadow-lg px-3 pb-2 b b-[--ui-btn-border-clr] h-200 of-y-auto';
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

		> form {
			--at-apply: 'pbs-3 grid grid-cols-3 auto-rows-auto gap-x-5 text-lg gap-y-2.5';

			.alert {
				--at-apply: 'bg-blue-950 text-blue-300';
			}

			@media (width < 640px) {
				& {
					--at-apply: 'grid-cols-2';
				}
			}

			@media (width < 540px) {
				& {
					--at-apply: 'grid-cols-1';
				}
			}

			> * {
				--at-apply: 'col-span-full';

				> label {
					--at-apply: 'block';
				}

				> input:not([type='checkbox']),
				> select,
				> textarea {
					--at-apply: 'inline-full px-1 py-0.5';
				}
			}

			textarea {
				--at-apply: 'bg-black text-white';
			}

			select {
				--at-apply: 'block-8';
			}

			> div {
				&:nth-child(1) {
					--at-apply: 'col-span-2';

					@media (width < 640px) {
						& {
							--at-apply: 'col-span-1';
						}
					}
				}

				&:nth-child(2) {
					--at-apply: 'col-span-1';
				}

				> label {
					--at-apply: 'mb-1';
				}
			}

			> div > label,
			> label {
				--at-apply: 'text-neutral-200';

				> span {
					--at-apply: 'text-red-500';
				}
			}

			> label {
				> span {
					--at-apply: 'mx-[0.5ch]';
				}
				> a {
					--at-apply: 'text-blue-400';

					&:hover {
						--at-apply: 'underline';
					}
				}
			}

			> button {
				--at-apply: 'w-max justify-self-end px-2 py-1';
			}
		}
	}
}
</style>
