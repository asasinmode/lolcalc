<script setup lang="ts">
import type { StyleValue, UnwrapRef } from 'vue';

const text = useText();
const runes = useRunes();
const { minorVersion } = usePatchVersion();

const value = defineModel<IChampionRunes>();
const vDialog = useTemplateRef('vDialog');

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
		return { '--path-options-length': pathOptions.length - 1 };
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

const shardSlots = computed(() =>
	Object.fromEntries(Object.entries(runes.shards).map(([shardName, shardSlots]) =>
		[shardName, Object.entries(shardSlots).map(([name, shardValue]) => {
			const { name: title, tooltip } = text.runes.shards.slotValues[name]!;
			return {
				name,
				title,
				tooltip,
				icon: shardValue.icon,
			};
		})],
	)) as Record<IRuneShardSlotName, { name: string; title: string; tooltip: string; icon: string }[]>,
);

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
			const sameSlotOptionIndex = value.value.paths.secondarySlots.findIndex(slot => secondaryRunePathSlots.value![lastKey as number]!.some(option => option.name === slot));
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

let runeDescriptionTooltipAnchor: undefined | HTMLElement;
const runeDescriptionTooltip = useTemplateRef('runeDescriptionTooltip');
const isHoldingShift = ref(false);
const hoveredRune = ref<{
	title: string;
	description: string;
	expandedDescription?: string;
}>();

type IHoveredRuneOption = (typeof pathOptions)[number] | NonNullable<UnwrapRef<typeof primaryRunePathSlots>>[number][number] | NonNullable<UnwrapRef<typeof secondaryRunePathSlots>>[number][number] | UnwrapRef<typeof shardSlots>[IRuneShardSlotName][number];

function enterTooltipableElement(event: MouseEvent | FocusEvent, rune: IHoveredRuneOption) {
	const { target } = event as unknown as { target: HTMLElement };
	runeDescriptionTooltip.value?.showPopover();
	runeDescriptionTooltipAnchor = target;
	runeDescriptionTooltipAnchor?.addEventListener('mouseleave', leaveTooltipableElement, { passive: true });
	window.addEventListener('resize', updateTooltipPosition, { passive: true });
	hoveredRune.value = 'tooltipLong' in rune ? { title: rune.title, description: rune.tooltipShort, expandedDescription: rune.tooltipLong } : { title: rune.title, description: rune.tooltip };
	nextTick(() => updateTooltipPosition());
}

function leaveTooltipableElement() {
	runeDescriptionTooltip.value?.hidePopover();
	runeDescriptionTooltipAnchor?.removeEventListener('mouseleave', leaveTooltipableElement);
	runeDescriptionTooltipAnchor = undefined;
}

function updateTooltipPosition() {
	const { left, top, width } = runeDescriptionTooltipAnchor!.getBoundingClientRect();
	runeDescriptionTooltip.value!.style.setProperty('--left', `${left + width / 2}px`);
	runeDescriptionTooltip.value!.style.setProperty('--top', `${top}px`);
	runeDescriptionTooltip.value!.style.setProperty('--height', `${runeDescriptionTooltip.value!.clientHeight}px`);
}

function holdShift(event: KeyboardEvent) {
	if (event.key === 'Shift') {
		isHoldingShift.value = true;
		nextTick(() => {
			runeDescriptionTooltipAnchor && updateTooltipPosition();
		});
	}
}

function releaseShift() {
	isHoldingShift.value = false;
	nextTick(() => {
		runeDescriptionTooltipAnchor && updateTooltipPosition();
	});
}

onMounted(() => {
	window.addEventListener('keydown', holdShift, { passive: true });
	window.addEventListener('keyup', releaseShift, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateTooltipPosition);
	window.removeEventListener('keydown', holdShift);
	window.removeEventListener('keyup', releaseShift);
});

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-rune-select" ref="vDialog" class="px-3 pb-2 bg-cyan-950 gap-x-12 grid-flow-col grid-cols-[auto_auto] grid-rows-[auto_max-content_1fr] shadow-lg [&[open]]:grid">
		<header class="py-2 pb-2 bg-inherit flex col-span-full col-span-full items-center top-0 sticky z-20">
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
				title-key=""
				data-path=""
				:on-option-mouseenter="enterTooltipableElement"
				:on-option-focus="enterTooltipableElement"
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
				title-key=""
				:on-option-mouseenter="enterTooltipableElement"
				:on-option-focus="enterTooltipableElement"
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
				title-key=""
				data-path=""
				:on-option-mouseenter="enterTooltipableElement"
				:on-option-focus="enterTooltipableElement"
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
			<template v-if="!secondaryRunePathSlots?.length">
				<div v-for="i in 2" :key="i" data-placeholder-secondary-slot-row="">
					<h3>Secondary</h3>
					<p>Select your secondary rune path above to choose runes</p>
				</div>
			</template>
			<VButtonRadiogroup
				v-for="(slots, slotIndex) in secondaryRunePathSlots"
				:id="`rune-select-secondary-slot-${slotIndex}`"
				:key="slotIndex"
				:model-value="secondarySlotValue(slots)"
				:label="`Slot ${slotIndex + 1}`"
				:options="Object.values(slots)"
				value-key="name"
				title-key=""
				:on-option-mouseenter="enterTooltipableElement"
				:on-option-focus="enterTooltipableElement"
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
		<section id="rune-select-shards" :style="`--path-icon-clr: hsl(from ${runes.paths.Precision.iconColor} h calc(s * 1.3) l); --path-options-length: ${secondaryPathOptions.length}`">
			<h2 class="sr-only">
				Shards
			</h2>
			<VButtonRadiogroup
				v-for="(slots, slotName) in shardSlots"
				:id="`rune-select-shards-slot-${slotName}`"
				:key="slotName"
				:model-value="value?.shards[slotName]"
				:label="`Slot ${slotName}`"
				:options="slots"
				value-key="name"
				title-key=""
				:on-option-mouseenter="enterTooltipableElement"
				:on-option-focus="enterTooltipableElement"
				@update:model-value="updateValue(['shards', slotName], $event)"
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
		<div id="rune-select-dialog-hover-tooltip" ref="runeDescriptionTooltip" popover="hint" data-game-description="">
			<h4>{{ hoveredRune?.title }}</h4>
			<div v-html="isHoldingShift && hoveredRune?.expandedDescription || hoveredRune?.description" />
		</div>
	</VDialog>
</template>

<style>
@layer components {
	#rune-select-primary,
	#rune-select-secondary,
	#rune-select-shards {
		:where([role='radiogroup']),
		:where([data-placeholder-secondary-slot-row]) {
			@apply 'flex items-center relative';
			--selected-indicator-width: var(--selected-slot-width);
			--selected-slot-checked-width: calc(var(--spacing) * 2);

			&[data-path] {
				@apply 'py-[--path-row-py] mb-[--path-row-mb] gap-x-[--path-options-gap-x]';
			}

			> button {
				@apply 'mx-auto';
			}

			&:before {
				@apply 'content-empty z-10 bg-[--slot-bg] block size-[--selected-slot-width] b b-2 rounded-full ml-[calc((var(--selected-path-width)_-_var(--selected-indicator-width))_/_2)] mr-[calc((var(--selected-path-width)_-_var(--selected-indicator-width))_/_2_+_var(--selected-path-to-options-gap))]';
				border-color: var(--path-icon-clr, var(--slot-border-clr));
			}

			&:after {
				@apply 'absolute z-10 block size-[--selected-slot-checked-width] rounded-full top-1/2 -translate-y-1/2 left-[calc((var(--selected-path-width)_-_var(--selected-slot-checked-width))_/_2)] bg-[--path-icon-clr]';
				box-shadow:
					0 0 6px 1px hsl(0 100% 100% / 0.8),
					inset 2px 3px 5px hsl(0 100% 100% / 0.6),
					inset -2px 3px 5px hsl(0 100% 100% / 0.6);
			}

			&:not([data-path]):not([data-keystone]) > button > img,
			&[data-keystone] > button {
				@apply 'b b-[--path-icon-clr] b-2 rounded-full';
			}

			&:not([data-path]) {
				@apply 'py-[--slot-row-py]';

				> button {
					@apply 'bg-[--slot-bg] rounded-full outline-3 outline-offset-8';
					--outline-op: 0;
					outline-color: hsl(from var(--path-icon-clr) h s l / var(--outline-op));
					transition-property: outline-offset, outline-color, border-color;
					transition-duration: var(--transition-duration);
					transition-timing-function: var(--transition-timing-function);

					&:hover,
					&:focus-visible {
						@apply 'outline-offset-5';
						--outline-op: 0.5;
					}

					> img {
						@apply 'block size-[--slot-row-button-size] max-w-unset';
						transition: filter var(--transition-duration) var(--transition-timing-function);
					}
				}

				&:has(button[aria-checked='true']) {
					&[data-keystone] > button[aria-checked='false']:not(:hover) {
						@apply 'b-[--slot-border-clr]';
					}

					> button[aria-checked='false']:not(:hover) > img {
						@apply 'grayscale';
					}

					&:after {
						@apply 'content-empty';
					}
				}
			}

			&[data-keystone] > button {
				@apply 'relative';

				> img {
					@apply 'absolute translate-center left-1/2 top-1/2';
				}
			}

			&:nth-last-of-type(-n + 2) {
				> button:last-child:after {
					@apply 'absolute pointer-events-none content-empty h-px left-[calc(var(--selected-path-width)_+_var(--selected-path-to-options-gap))] right-0 top-0 -translate-y-1/2 bg-yellow-800/60';
				}
			}

			&[data-keystone] {
				--selected-indicator-width: var(--selected-keystone-width);
				--selected-slot-checked-width: calc(var(--spacing) * 2.5);

				> button {
					@apply 'size-[--keystone-row-button-size]';

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
			@apply 'mr-[calc(var(--selected-path-to-options-gap)_-_var(--path-options-gap-x))] ml-0 bg-transparent';
		}

		&:after {
			@apply 'content-empty left-8 translate-center size-9 shadow-none';
			background-color: var(--path-icon-clr);
			mask: var(--path-icon, linear-gradient(transparent 0 0)) no-repeat center;
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
				@apply 'op-60 -outline-offset-2';
			}

			span {
				@apply 'brightness-100';
			}
		}
	}

	#rune-select-primary,
	#rune-select-secondary,
	#rune-select-shards {
		--transition-duration: 150ms;
		--transition-timing-function: ease-in-out;
		--path-button-size: calc(var(--spacing) * 13);
		--path-options-width: calc(var(--path-button-size) * var(--path-options-length));
		--path-row-py: calc(var(--spacing) * 2);
		--path-options-gap-x: calc(var(--spacing) * 1);
		--selected-path-width: calc(var(--spacing) * 16);
		--selected-path-to-options-gap: calc(var(--spacing) * 6);
		--selected-keystone-width: calc(var(--spacing) * 5.5);
		--selected-slot-width: calc(var(--spacing) * 4.5);
		--keystone-row-py: calc(var(--spacing) * 9.5);
		--keystone-row-button-size: calc(var(--spacing) * 12);
		--keystone-row-height: calc(var(--keystone-row-button-size) + 2 * var(--keystone-row-py));
		--slot-bg: theme('colors.neutral.900');
		--slot-border-clr: theme('colors.neutral.500');
		--slot-row-button-size: calc(var(--spacing) * 11);
		--slot-row-height: calc(var(--slot-row-button-size) + 2 * var(--slot-row-py));

		--primary-slot-row-button-size: calc(var(--spacing) * 11);
		--primary-path-row-mb: calc(var(--spacing) * 12);
		--primary-slot-row-py: calc(var(--spacing) * 6);
		--primary-slot-row-height: calc(var(--primary-slot-row-button-size) + 2 * var(--primary-slot-row-py));

		--secondary-slot-row-button-size: calc(var(--spacing) * 11);
		--secondary-path-row-mb: calc(var(--spacing) * 8.5);
		--secondary-slot-row-py: calc(var(--spacing) * 5);
		--secondary-slot-row-height: calc(var(--secondary-slot-row-button-size) + 2 * var(--secondary-slot-row-py));

		--selected-dots-column-clr: var(--path-icon-clr, var(--slot-border-clr));
		--selected-dots-column-lining-clr: hsl(0 100% 100% / 0.6);
		--selected-dots-column-lining-clr: hsl(
			from var(--path-icon-clr, var(--slot-border-clr)) h calc(s * 1.4) calc(l * 1.2)
		);

		@apply 'relative h-max';

		&:before {
			@apply 'absolute left-[calc(var(--selected-path-width)_/_2)] top-[calc(var(--selected-path-width)_+_var(--path-row-py))] bottom-[calc(var(--slot-row-height)_/_2)] bg-[--selected-dots-column-clr] w-1 -translate-x-1/2 op-60';
			box-shadow:
				0 0 6px 0 var(--path-icon-clr),
				inset 1px 0 0 var(--selected-dots-column-lining-clr),
				inset -1px 0 0 var(--selected-dots-column-lining-clr);
		}

		&:before {
			@apply 'content-empty';
		}

		:where([role='radiogroup']),
		:where([data-placeholder-secondary-slot-row]) {
			&[data-keystone] {
				@apply 'py-[--keystone-row-py] b-y b-[--path-icon-clr]';
				border-image: linear-gradient(
						90deg,
						transparent 0%,
						var(--path-icon-clr) 20%,
						var(--path-icon-clr) 80%,
						transparent 100%
					)
					1;

				> span {
					@apply 'absolute size-auto m-unset text-xs tracking-widest font-300 uppercase text-[--path-icon-clr] left-[calc(var(--selected-path-width)_+_var(--selected-path-to-options-gap))] -top-1 -translate-y-full';
					clip: unset;
				}
			}
		}
	}

	#rune-select-primary {
		--path-row-mb: var(--primary-path-row-mb);
		--slot-row-py: var(--primary-slot-row-py);
	}

	#rune-select-secondary {
		--path-row-mb: var(--secondary-path-row-mb);
		--slot-row-py: var(--secondary-slot-row-py);
		--selected-dot-mt-translate: calc(var(--primary-path-row-mb) - var(--secondary-path-row-mb));

		@apply 'min-h-[calc(var(--selected-path-width)_+_2_*_var(--path-row-py)_+_var(--path-row-mb)_+_3_*_var(--slot-row-height))]';

		&:before {
			@apply 'bottom-[calc(var(--slot-row-height)_-_var(--selected-dot-mt-translate))]';
		}

		--path-icon-clr: var(--slot-border-clr);

		[role='radiogroup'],
		[data-placeholder-secondary-slot-row] {
			&:nth-of-type(4) {
				&:before,
				&:after {
					@apply 'op-0';
				}
			}
			--secondary-slot-first-dot-translate-y: calc(
				(var(--keystone-row-height) - var(--slot-row-height)) / 2 + var(--selected-dot-mt-translate)
			);
			--secondary-slot-second-dot-translate-y: calc(
				var(--keystone-row-height) - var(--secondary-slot-row-height) +
					(var(--primary-slot-row-height) - var(--secondary-slot-row-height)) / 2 + var(--selected-dot-mt-translate) +
					1px
			);

			&:nth-of-type(n + 2) {
				--selected-dot-translate-y: var(--secondary-slot-first-dot-translate-y);

				&:before {
					@apply 'translate-y-[--selected-dot-translate-y]';
				}

				&:after {
					@apply 'translate-y-[calc(-50%_+_var(--selected-dot-translate-y))]';
				}
			}

			&:nth-of-type(3) {
				--selected-dot-translate-y: var(--secondary-slot-second-dot-translate-y);

				&:before {
					@apply 'translate-y-[--selected-dot-translate-y]';
				}

				&:after {
					@apply 'translate-y-[calc(-50%_+_var(--selected-dot-translate-y))]';
				}
			}

			&:nth-of-type(n + 2):after {
				@apply 'hidden';
			}
		}

		&[data-slots-filled='1'],
		&[data-slots-filled='2'] {
			[role='radiogroup']:nth-of-type(2):after {
				@apply 'content-empty block';
			}
		}

		&[data-slots-filled='2'] {
			[role='radiogroup'] {
				&:nth-of-type(3):after {
					@apply 'content-empty block';
				}

				&:nth-of-type(n + 2):not(:has(button[aria-checked='true'])) {
					> button:not(:hover):not(:focus-visible) {
						@apply 'b-[--slot-border-clr]';

						img {
							@apply 'grayscale';
						}
					}
				}
			}
		}

		[data-placeholder-secondary-slot-row] {
			@apply 'box-content h-[calc(var(--secondary-slot-row-button-size)_+_2_*_var(--slot-row-py))] py-0 grid grid-cols-[auto_1fr] grid-rows-[auto_auto]';

			&:nth-of-type(2) {
				@apply 'pt-[--selected-dot-translate-y]';
			}

			&:nth-of-type(3) {
				@apply 'pt-[calc(var(--secondary-slot-second-dot-translate-y)_-_var(--secondary-slot-first-dot-translate-y))]';
			}

			&:before {
				@apply 'row-span-full';
				--selected-dot-translate-y: 0px;
			}

			h3 {
				@apply 'uppercase tracking-wider self-end text-sm';
			}

			p {
				@apply 'text-neutral-400 text-xs max-w-[--path-options-width] leading-4.25 self-start';
			}
		}
	}

	#rune-select-shards {
		--button-size-share: 0.6;
		--padding-size-share: 0.4;
		--slot-row-button-size: calc(var(--primary-slot-row-height) * var(--button-size-share) / 2);
		--slot-row-py: calc(var(--primary-slot-row-height) * var(--padding-size-share) / 4);

		@apply 'mt-auto mb-[calc(var(--primary-slot-row-height)_/_2_-_var(--slot-row-height)_/_2)]';

		&:before {
			@apply 'top-[calc(var(--slot-row-height)_/_2)]';
		}
	}

	#rune-select-dialog-hover-tooltip {
		@apply 'bg-neutral-950 b-2 b-[--ui-button-border-clr] w-(--width) pointer-events-none fixed -translate-x-1/2 -translate-y-[calc(100%_+_1rem)] p-7';

		--width: 20rem;
		left: clamp(calc(var(--width) / 2), var(--left), calc(100vw - min(100vw, var(--width) / 2)));
		top: clamp(var(--height), var(--top), 100vh);

		h4 {
			@apply 'font-600 uppercase mb-1 tracking-wide';
		}

		> div {
			@apply 'text-neutral-400';

			lol-uikit-tooltipped-keyword,
			lol-uikit-tooltipped-keyword font {
				@apply 'text-white';
			}
		}
	}
}
</style>
