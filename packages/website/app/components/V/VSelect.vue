<script setup lang="ts" generic="T extends string">
type IOption = [value: T | number, text: MaybeRef<string | number>, isDisabled?: boolean];

const props = defineProps<{
	id: string;
	label: string;
	options: IOption[] | Record<string, IOption[]>;
	name?: string;
	clearable?: boolean;
	required?: boolean;
	ariaErrormessage?: string;
}>();

defineEmits<{
	labelMouseenter: [event: MouseEvent];
}>();

const value = defineModel<T>();

function clear(event: MouseEvent) {
	if (props.clearable) {
		value.value = undefined;
		event.preventDefault();
	}
}
</script>

<template>
	<div class="v-select">
		<select
			:id
			:value
			:required
			:name
			:aria-errormessage
			:aria-invalid="ariaErrormessage ? true : undefined"
			@input="value = ($event.target as HTMLSelectElement).value as T || undefined"
			@click.right="clear"
			@mouseenter="$emit('labelMouseenter', $event)"
		>
			<option v-if="clearable" value="">
				&lt;none&gt;
			</option>
			<template v-if="Array.isArray(options)">
				<option v-for="[optionValue, text, isDisabled] in options" :key="optionValue" :value="optionValue" :disabled="isDisabled">
					{{ text }}
				</option>
			</template>
			<template v-else>
				<optgroup v-for="(optionsList, groupLabel, index) in options" :key="index" :label="groupLabel">
					<option v-for="[optionValue, text, isDisabled] in optionsList" :key="`${index}-${optionValue}`" :value="optionValue" :disabled="isDisabled">
						{{ text }}
					</option>
				</optgroup>
			</template>
		</select>
		<label :for="id">
			<span>{{ label }}</span>
			<slot />
		</label>
		<slot name="post" />
	</div>
</template>

<style>
@layer components {
	.v-select {
		--at-apply: 'relative';

		select {
			--at-apply: 'absolute inset-0 of-hidden cursor-pointer z-100 op-0 text-xl';
		}

		select:focus-visible + label {
			outline: auto;
		}

		label {
			--at-apply: 'block relative pointer-events-none z-1';

			> :first-child {
				--at-apply: 'sr-only';
			}

			> button {
				--at-apply: 'size-full';
			}
		}
	}
}
</style>
