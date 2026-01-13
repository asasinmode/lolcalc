<script setup lang="ts">
import type { StyleValue, UnwrapRef } from 'vue';

const text = useText();
const runes = useRunes();
const { minorVersion } = usePatchVersion();

const value = defineModel<IChampionRunes>();
const vDialog = useTemplateRef('vDialog');

const defaultRunes: IChampionRunes = {
	paths: {
		primary: undefined,
		primarySlots: [],
		secondary: undefined,
		secondarySlots: [],
	},
	shards: {
		offensive: 'adaptiveForce',
		flex: 'adaptiveForce',
		defensive: 'flatHealth',
	},
};

const pathOptions = Object.values(runes.paths).map((path) => {
	const { name, tooltip } = text.runes.paths[path.name]!;
	return {
		name: path.name,
		title: name,
		icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
		iconColor: path.iconColor,
		tooltip,
	};
});

const primaryRunePathStyle = computed((): StyleValue => {
	if (!value.value?.paths.primary) {
		return;
	}

	const { icon, iconColor } = pathOptions.find(path => path.name === value.value?.paths.primary!)!;
	return {
		'--path-icon': `url(${icon})`,
		'--path-icon-clr': iconColor,
		'--path-options-length': pathOptions.length,
	};
});

const primaryRunePathSlots = computed(() => {
	if (value.value?.paths.primary) {
		return runes.paths[value.value.paths.primary].slots.map(slots => Object.values(slots).map((slot) => {
			const texts = text.runes.slots[slot.name]!;
			if (!texts) {
				console.warn(`text for ${slot.name} not found`);
			}
			const { name, tooltipShort, tooltipLong } = texts;
			return {
				name: slot.name,
				icon: slot.icon,
				title: name,
				tooltipShort,
				tooltipLong,
			};
		}));
	}
	return undefined;
});

const secondaryPathOptions = computed(() => {
	return (value.value?.paths.primary
		? pathOptions.filter(path => path.name !== value.value?.paths.primary)
		: pathOptions.slice(0, 4));
});

const secondaryRunePathStyle = computed((): StyleValue => {
	if (!value.value?.paths.secondary) {
		return;
	}

	const { icon, iconColor } = pathOptions.find(path => path.name === value.value?.paths.secondary!)!;
	return {
		'--path-icon': `url(${icon})`,
		'--path-icon-clr': iconColor,
		'--path-options-length': secondaryPathOptions.value.length,
	};
});

const secondaryRunePathSlots = computed(() => {
	if (value.value?.paths.secondary) {
		return runes.paths[value.value.paths.secondary].slots.slice(1).map(slots => Object.values(slots).map((slot) => {
			const texts = text.runes.slots[slot.name]!;
			if (!texts) {
				console.warn(`text for ${slot.name} not found`);
			}
			const { name, tooltipShort, tooltipLong } = texts;
			return {
				name: slot.name,
				icon: slot.icon,
				title: name,
				tooltipShort,
				tooltipLong,
			};
		}));
	}
	return undefined;
});

function secondarySlotValue(options: NonNullable<UnwrapRef<typeof secondaryRunePathSlots>>[number]) {
	const relevantSecondarySlotIndex = value.value?.paths.secondarySlots.findIndex(slot => options.some(option => option.name === slot));
	if (relevantSecondarySlotIndex !== undefined && ~relevantSecondarySlotIndex) {
		return value.value!.paths.secondarySlots[relevantSecondarySlotIndex];
	}
	return undefined;
};

type PathTuple<T, K extends keyof T = keyof T>
	= | [K]
		| (K extends any ? (T[K] extends object ? [K, ...PathTuple<T[K]>] : [K]) : never);

let currentSecondarySlotReplaceTargetIndex = 0;

function updateValue<P extends PathTuple<IChampionRunes>>(
	path: P,
	newValue?: string,
) {
	if (newValue && value.value) {
		const lastKey = path.at(-1);
		let reference = value.value[path[0]!];
		for (const key of path.slice(1, -1)) {
			// @ts-expect-error reference navigating should be ok
			reference = reference[key];
		}
		if (path[0] === 'paths' && path[1] === 'secondarySlots') {
			const newValueSlotOptions = secondaryRunePathSlots.value!.find(slots => slots.some(slot => slot.name === newValue))!;
			const sameSlotOptionIndex = value.value.paths.secondarySlots.findIndex(slot => newValueSlotOptions.some(option => option.name === slot));
			if (~sameSlotOptionIndex) {
				value.value.paths.secondarySlots[sameSlotOptionIndex] = newValue as IRuneSlotName;
			} else {
				value.value.paths.secondarySlots[currentSecondarySlotReplaceTargetIndex] = newValue as IRuneSlotName;
				currentSecondarySlotReplaceTargetIndex = (currentSecondarySlotReplaceTargetIndex + 1) % 2;
			}
		} else {
			// @ts-expect-error key/value should be fine
			reference[lastKey] = newValue;
		}

		if (path[0] === 'paths') {
			if (path[1] === 'primary') {
				value.value.paths.primarySlots = [];
				if (value.value.paths.secondary === newValue) {
					value.value.paths.secondary = undefined;
					value.value.paths.secondarySlots = [];
				}
			} else if (path[1] === 'secondary') {
				value.value.paths.secondarySlots = [];
				currentSecondarySlotReplaceTargetIndex = 0;
			}
		}
	}
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-rune-select" ref="vDialog" class="px-3 pb-2 bg-cyan-950 gap-x-12 grid-flow-col grid-cols-[1fr_auto] grid-rows-[auto_1fr_auto] shadow-lg [&[open]]:grid">
		<header class="py-2 pb-2 bg-inherit flex col-span-full col-span-full items-center top-0 sticky">
			<h1>Runes</h1>
			<form method="dialog" class="ml-auto">
				<button autofocus value="cancel">
					close
				</button>
			</form>
		</header>
		<section id="rune-select-primary" class="row-span-2" :style="primaryRunePathStyle">
			<h2 class="sr-only">
				Primary
			</h2>
			<VButtonRadiogroup
				id="rune-select-primary-path"
				:model-value="value?.paths.primary"
				label="Primary path"
				:options="pathOptions"
				value-key="name"
				title-key="title"
				@update:model-value="updateValue(['paths', 'primary'], $event)"
			>
				<template #default="{ option: { title, icon, iconColor } }">
					<span
						:style="`background-color: ${iconColor}; mask: url(${icon}) no-repeat center;`"
						aria-hidden="true"
						width="32"
						height="32"
						class="size-7 block"
					/>
					<span class="sr-only">{{ title }}</span>
				</template>
			</VButtonRadiogroup>
			<VButtonRadiogroup
				v-for="(slots, slotIndex) in primaryRunePathSlots"
				:id="`rune-select-primary-slot-${slotIndex}`"
				:key="slotIndex"
				:model-value="value?.paths.primarySlots[slotIndex]"
				:label="slotIndex === 0 ? 'Keystones' : `Slot ${slotIndex + 1}`"
				:options="Object.values(slots)"
				:data-keystone="slotIndex === 0 ? '' : undefined"
				value-key="name"
				title-key="title"
				@update:model-value="updateValue(['paths', 'primarySlots', slotIndex], $event)"
			>
				<template #default="{ option: { title, icon } }">
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/game/${icon}`"
						aria-hidden="true"
						:width="slotIndex === 0 ? 256 : 64"
						:height="slotIndex === 0 ? 256 : 64"
					>
					<span class="sr-only">{{ title }}</span>
				</template>
			</VButtonRadiogroup>
		</section>
		<section id="rune-select-secondary" :style="secondaryRunePathStyle" :data-slots-filled="value?.paths.secondarySlots.length">
			<h2 class="sr-only">
				Secondary
			</h2>
			<VButtonRadiogroup
				id="rune-select-secondary-path"
				:model-value="value?.paths.secondary"
				label="Secondary path"
				:options="secondaryPathOptions"
				value-key="name"
				title-key="title"
				@update:model-value="updateValue(['paths', 'secondary'], $event)"
			>
				<template #default="{ option: { title, icon, iconColor } }">
					<span
						:style="`background-color: ${iconColor}; mask: url(${icon}) no-repeat center;`"
						aria-hidden="true"
						width="32"
						height="32"
						class="size-7 block"
					/>
					<span class="sr-only">{{ title }}</span>
				</template>
			</VButtonRadiogroup>
			<VButtonRadiogroup
				v-for="(slots, slotIndex) in secondaryRunePathSlots"
				:id="`rune-select-secondary-slot-${slotIndex}`"
				:key="slotIndex"
				:model-value="secondarySlotValue(slots)"
				:label="`Slot ${slotIndex + 1}`"
				:options="Object.values(slots)"
				value-key="name"
				title-key="title"
				@update:model-value="updateValue(['paths', 'secondarySlots', slotIndex], $event)"
			>
				<template #default="{ option: { title, icon } }">
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/game/${icon}`"
						aria-hidden="true"
						width="64"
						height="64"
					>
					<span class="sr-only">{{ title }}</span>
				</template>
			</VButtonRadiogroup>
		</section>
		<section>
			<h2>Shards</h2>
			<select
				:value="value?.shards.offensive ?? defaultRunes.shards.offensive"
				class="block"
				@change="updateValue(['shards', 'offensive'], ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="(_, shardName) in runes.shards.offensive" :key="shardName" :value="shardName">
					{{ shardName }}
				</option>
			</select>
			<select
				:value="value?.shards.flex ?? defaultRunes.shards.flex"
				class="block"
				@change="updateValue(['shards', 'flex'], ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="(_, shardName) in runes.shards.flex" :key="shardName" :value="shardName">
					{{ shardName }}
				</option>
			</select>
			<select
				:value="value?.shards.defensive ?? defaultRunes.shards.defensive"
				class="block"
				@change="updateValue(['shards', 'defensive'], ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="(_, shardName) in runes.shards.defensive" :key="shardName" :value="shardName">
					{{ shardName }}
				</option>
			</select>
		</section>
	</VDialog>
</template>

<style>
@layer components {
	#rune-select-primary,
	#rune-select-secondary {
		:where([role='radiogroup']) {
			@apply 'flex items-center relative';
			--selected-indicator-width: var(--selected-slot-width);
			--selected-slot-checked-width: calc(var(--spacing) * 2);

			&:first-of-type {
				@apply 'py-[--path-row-py] mb-6';
			}

			> button {
				@apply 'mx-auto';
			}

			&:before {
				@apply 'content-empty z-10 bg-[--slot-bg] block size-[--selected-slot-width] b b-2 rounded-full ml-[calc((var(--selected-path-width)_-_var(--selected-indicator-width))_/_2)] mr-[calc((var(--selected-path-width)_-_var(--selected-indicator-width))_/_2_+_var(--selected-to-options-gap))]';
				border-color: var(--path-icon-clr, var(--slot-border-clr));
			}

			&:after {
				@apply 'absolute z-10 block size-[--selected-slot-checked-width] rounded-full top-1/2 -translate-y-1/2 left-[calc((var(--selected-path-width)_-_var(--selected-slot-checked-width))_/_2)] bg-[--path-icon-clr]';
				box-shadow:
					0 0 6px 1px hsl(0 100% 100% / 0.8),
					inset 2px 3px 5px hsl(0 100% 100% / 0.6),
					inset -2px 3px 5px hsl(0 100% 100% / 0.6);
			}

			&:nth-of-type(n + 2) {
				@apply 'py-[--slot-row-py]';

				> button {
					@apply 'relative bg-[--slot-bg] size-[--slot-row-button-size] block rounded-full b b-[--path-icon-clr] b-2';

					&:before {
						@apply 'absolute content-empty rounded-full inset-0 outline-3 outline-offset-8 op-0';
						outline-color: var(--path-icon-clr);
						transition-property: outline-offset, opacity;
						transition-duration: var(--transition-duration);
						transition-timing-function: var(--transition-timing-function);
					}

					&:hover:before,
					&:focus-visible:before {
						@apply 'outline-offset-6 op-50';
					}

					> img {
						@apply 'block size-10 absolute max-w-unset translate-center left-1/2 top-1/2';
						transition: filter var(--transition-duration) var(--transition-timing-function);
					}
				}

				&:has(button[aria-checked='true']) {
					> button[aria-checked='false']:not(:hover) {
						@apply 'b-[--slot-border-clr]';

						> img {
							@apply 'grayscale';
						}
					}

					&:after {
						@apply 'content-empty';
					}
				}
			}

			&:nth-last-of-type(-n + 2) {
				> button:last-child:after {
					@apply 'absolute content-empty h-px w-[--path-options-width] bg-yellow-700 right-0 -top-[--slot-row-py]';
				}
			}

			&[data-keystone] {
				--selected-indicator-width: var(--selected-keystone-width);
				--selected-slot-checked-width: calc(var(--spacing) * 2.5);

				> button {
					@apply 'size-12';

					> img {
						@apply 'size-21 pointer-events-none';
					}
				}

				&:before {
					@apply 'size-[--selected-keystone-width]';
				}
			}
		}
	}

	#rune-select-primary-path,
	#rune-select-secondary-path {
		--selected-slot-width: var(--selected-path-width);

		&:before {
			@apply 'mr-[--selected-to-options-gap] ml-0 bg-transparent';
		}

		&:after {
			@apply 'content-empty left-8 translate-center size-10 shadow-none';
			background-color: var(--path-icon-clr);
			mask: var(--path-icon) no-repeat center;
		}

		button {
			@apply 'rounded-full b-2 b-transparent grid-center size-[--path-button-size] relative';

			&:before {
				@apply 'absolute content-empty rounded-full inset-0 outline-2 outline-offset-1 op-0';
				outline-color: theme('colors.yellow.600');
				transition-property: outline-offset, opacity;
				transition-duration: var(--transition-duration);
				transition-timing-function: var(--transition-timing-function);
			}

			span {
				@apply 'brightness-80';
			}

			&:hover,
			&:focus-visible {
				span {
					@apply 'brightness-100';
				}
			}
		}

		button[aria-checked='true'] {
			&:before {
				@apply 'op-100 -outline-offset-2';
			}

			span {
				@apply 'brightness-100';
			}
		}
	}

	#rune-select-primary,
	#rune-select-secondary {
		--transition-duration: 150ms;
		--transition-timing-function: ease-in-out;
		--path-button-size: calc(var(--spacing) * 12);
		--selected-path-width: calc(var(--spacing) * 16);
		--selected-to-options-gap: calc(var(--spacing) * 8);
		--selected-keystone-width: calc(var(--spacing) * 5.5);
		--selected-slot-width: calc(var(--spacing) * 4.5);
		--path-row-py: calc(var(--spacing) * 2);
		--slot-row-button-size: calc(var(--spacing) * 11);
		--slot-row-py: calc(var(--spacing) * 4);
		--slot-row-height: calc(var(--slot-row-button-size) + 2 * var(--slot-row-py));
		--slot-bg: theme('colors.neutral.900');
		--slot-border-clr: theme('colors.neutral.500');
		--path-options-width: calc(var(--path-button-size) * var(--path-options-length));

		@apply 'relative';

		&:before {
			--selected-dots-column-clr: var(--path-icon-clr, var(--slot-border-clr));
			@apply 'content-empty absolute left-[calc(var(--selected-path-width)_/_2)] top-[calc(var(--selected-path-width)_+_var(--path-row-py))] bottom-[calc(var(--slot-row-height)_/_2)] bg-[--selected-dots-column-clr] w-1 -translate-x-1/2 op-60';
			box-shadow:
				0 0 6px 0 var(--path-icon-clr),
				inset 1px 0 0 hsl(0 100% 100% / 0.6),
				inset -1px 0 0 hsl(0 100% 100% / 0.6);
		}

		:where([role='radiogroup']) {
			&[data-keystone] {
				@apply 'py-8 b-y b-[--path-icon-clr]';
				border-image: linear-gradient(
						90deg,
						transparent 0%,
						var(--path-icon-clr) 20%,
						var(--path-icon-clr) 80%,
						transparent 100%
					)
					1;

				> span {
					@apply 'absolute size-auto m-unset text-xs tracking-widest uppercase text-[--path-icon-clr] left-[calc(var(--selected-path-width)_+_var(--selected-to-options-gap))] -top-1 -translate-y-full';
					clip: unset;
				}
			}
		}
	}

	#rune-select-secondary {
		&[data-slots-filled='2'] {
			[role='radiogroup']:nth-of-type(n + 2):not(:has(button[aria-checked='true'])) {
				> button:not(:hover):not(:focus-visible) {
					@apply 'b-[--slot-border-clr]';

					img {
						@apply 'grayscale';
					}
				}
			}
		}
	}
}
</style>
