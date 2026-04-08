<script setup lang="ts">
const damageSource = defineModel<DamageSource>();

const vDialog = useTemplateRef('vDialog');

function submitAnotherEffect(event: SubmitEvent) {
	const value = new FormData(event.target as HTMLFormElement).get('effectOptionIndex')! as string;
	if (!value) {
		return;
	}

	// const [rawOptionIndex, rawAbilityIndex] = value.split('-');
	console.log('adding', value);
	// (event.target as HTMLFormElement).reset();
	// addResultSectionOption(Number.parseInt(rawOptionIndex!), Number.parseInt(rawAbilityIndex!));
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-effects" ref="vDialog">
		<header>
			<h1>
				effects
			</h1>
			<form method="dialog">
				<button autofocus value="cancel" class="other-ui-btn">
					<span>
						close
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</form>
		</header>
		<ul>
			<li>
				<button>
					remove
				</button>
			</li>
		</ul>
		<form @submit.prevent="submitAnotherEffect">
			<label for="dialog-effects-add-new-effect">
				effect
			</label>
			<select id="dialog-effects-add-new-effect" name="effectOptionIndex" required>
				<option>option 1</option>
			</select>
			<button type="submit" class="">
				add
			</button>
		</form>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-effects {
		--at-apply: 'bg-cyan-950 grid-rows-[auto_1fr] max-h-[80vh] w-[min(90vw,_600px)] shadow-lg px-3 pb-2';

		&[open] {
			--at-apply: 'grid';
		}

		> header {
			--at-apply: 'pt-2 flex';

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
			--at-apply: '';
			
			> button {
				--at-apply: ''
			}
		}
	}
}
</style>
