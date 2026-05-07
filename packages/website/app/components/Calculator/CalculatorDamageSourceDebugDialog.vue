<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';

const damageSource = defineModel<DamageSource>();

const vDialog = useTemplateRef('vDialog');

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog
		id="dialog-damage-source-debug"
		ref="vDialog"
	>
		<h1>debug <span>{{ damageSource?.champion.value?.name }} ({{ damageSource?.id }})</span></h1>
		<h2>stats</h2>
		<div>
			<details v-for="(stats, statGroup) in damageSource?.stats.value" :key="statGroup" open>
				<summary>{{ statGroup }}</summary>
				<div>
					<code class="whitespace-pre">
						{{ JSON.stringify(stats, null, 2) }}
					</code>
				</div>
			</details>
		</div>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-damage-source-debug {
		--at-apply: 'bg-mauve-900 b b-[--ui-btn-border-clr] shadow-lg of-x-auto p-4';

		> h1 {
			--at-apply: 'text-xl mb-3';

			> span {
				--at-apply: 'font-500';
			}
		}

		> h2 {
			--at-apply: 'text-lg mb-1';
		}

		> div {
			--at-apply: 'flex divide-x divide-neutral-500';

			> details {
				--at-apply: 'me-4 pe-4';

				&:last-child {
					--at-apply: 'me-0 pe-0';
				}

				> div {
					--at-apply: 'bg-black rounded-lg px-2 py-1';
				}
			}
		}
	}
}
</style>
