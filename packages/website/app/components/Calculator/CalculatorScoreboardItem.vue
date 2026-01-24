<script setup lang="ts">
const props = defineProps<{
	index: number;
	value: DamageSource;
	/** side of the scoreboard it's on, left (damage sources) by default */
	isRight?: boolean;
	canRemove?: boolean;
	canMoveDown?: boolean;
}>();

const emit = defineEmits<{
	clear: [];
	remove: [];
	duplicate: [shift: boolean];
	changeGroup: [alt: boolean];
}>();

const runes = useRunes();
const { version, minorVersion } = usePatchVersion();
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelect();
const { selectItems } = useItemShop();
const text = useText();
const globalKeyModifiers = useGlobalKeyModifiers();

const group = computed(() => props.isRight ? 'targets' : 'sources');
const otherGroup = computed(() => props.isRight ? 'sources' : 'targets');

const runePathPrimary = computed(() => {
	const { primary, primarySlots } = props.value.runes.value.paths;
	if (primarySlots[0]) {
		const { iconColor } = runes.paths[primary]!;
		const { name } = text.runes.paths[primary]!;
		return {
			icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
			name,
		};
	}
	return undefined;
});

const runePathSecondary = computed(() => {
	const { secondary } = props.value.runes.value.paths;
	if (secondary) {
		const { iconColor } = runes.paths[secondary]!;
		const { name } = text.runes.paths[secondary]!;
		return {
			icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
			name,
		};
	}
	return undefined;
});

const isFirstAndOnly = computed(() => props.index === 0 && !props.canMoveDown);

function emitClear() {
	emit('clear');
}

function emitRemove() {
	if (globalKeyModifiers.value.shift) {
		emit('clear');
	} else {
		emit('remove');
	}
}

const removeButtonAttrs = computed(() => (isFirstAndOnly.value
	? {
			title: 'clear',
			disabled: !props.value.anythingFilled.value,
			emit: emitClear,
		}
	: {
			title: 'remove, shift+click to clear',
			disabled: !props.canRemove,
			emit: emitRemove,
		}));

const detailsContainer = useTemplateRef('details');

function toggleExpanded() {
	if (detailsContainer.value!.getAttribute('open') === null) {
		detailsContainer.value!.setAttribute('open', '');
	} else {
		detailsContainer.value!.removeAttribute('open');
	}
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<li data-lol-scoreboard-item="">
		<h3 class="sr-only">
			{{ group.slice(0, -1) }} {{ index + 1 }}
		</h3>
		<button
			title="move up, alt+click to duplicate above"
			class="data-pretend-ui-button"
			:disabled="index === 0"
		>
			<span class="sr-only">move up, alt+click to duplicate above</span>
			<Icon name="ph-arrow-up" />
		</button>
		<button
			title="move down, alt+click to duplicate below"
			class="data-pretend-ui-button"
			:disabled="!canMoveDown"
		>
			<span class="sr-only">move down, alt+click to duplicate below</span>
			<Icon name="ph-arrow-down" />
		</button>
		<button
			:title="`move to ${otherGroup}, alt+click to duplicate into ${otherGroup}`"
			class="data-pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="$emit('changeGroup', globalKeyModifiers.alt)"
		>
			<span class="sr-only">move to {{ otherGroup }}, alt+click to duplicate into {{ otherGroup }}</span>
			<Icon :name="isRight ? 'ph-arrow-left' : 'ph-arrow-right'" />
		</button>
		<button
			:title="`duplicate, shift+click to duplicate into ${otherGroup}`"
			class="data-pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="$emit('duplicate', globalKeyModifiers.shift)"
		>
			<span class="sr-only">duplicate, shift+click to duplicate into {{ otherGroup }}</span>
			<Icon name="ph-copy" />
		</button>
		<div data-select-champion="">
			<button
				title="select champion"
				@click="selectChampion(value.champion)"
			>
				<span class="sr-only">
					{{ value.champion.value ? `selected champion: ${value.champion.value.name}` : 'select champion' }}
				</span>
				<img
					v-if="value.champion.value"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${value.champion.value.image}`"
					loading="lazy"
					width="128"
					height="128"
					style="--focus-brightness: 1.2"
				>
				<img
					v-else
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
					width="256"
					height="256"
					style="--focus-brightness: 1.5"
				>
			</button>
			<label :for="`${group}-${index}-level-select`" class="sr-only">Level</label>
			<select :id="`${group}-${index}-level-select`" v-model="value.level.value" class="absolute -bottom-1 -right-2">
				<option v-for="i in 18" :key="i" :value="i">
					{{ i }}
				</option>
			</select>
		</div>
		<button title="runes" data-select-runes="" @click="selectRunes(value.runes)">
			<span class="sr-only">{{ value.runePathsEmpty ? 'select runes' : 'runes' }}</span>
			<span v-show="value.runesInvalid.value" class="text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -right-0.5 -top-0.5">
				<span class="sr-only">(invalid)</span>
				<Icon name="ph-exclamation-mark-bold" class="size-2.5" />
			</span>
			<template v-if="runePathPrimary">
				<span class="sr-only">
					primary: {{ runePathPrimary.name }}
				</span>
				<span
					:style="`background-color: ${runePathPrimary.iconColor}; mask: url(${runePathPrimary.icon}) no-repeat center;`"
					aria-hidden="true"
					class="size-5.5 block"
				/>
			</template>
			<img
				v-else
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
				aria-hidden="true"
				width="32"
				height="32"
				loading="lazy"
				class="size-5"
			>
			<template v-if="runePathSecondary">
				<span class="sr-only">
					secondary: {{ runePathSecondary.name }}
				</span>
				<span
					:style="`background-color: ${runePathSecondary.iconColor}; mask: url(${runePathSecondary.icon}) no-repeat center;`"
					aria-hidden="true"
					data-secondary-path-icon=""
				/>
			</template>
		</button>
		<button
			class="data-pretend-ui-button px-1 flex gap-x-1 items-center"
			data-select-items=""
			@click="selectItems(value.items, value.itemDamageCalculationTarget.value)"
		>
			items
			<img
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`"
				width="32"
				height="28"
				aria-hidden="true"
				loading="lazy"
				class="align-middle w-4 inline-block"
			>
		</button>
		<ul class="flex h-8">
			<li v-for="i in 6" :key="i" class="group mr-1">
				<button
					class="bg-black size-8 inline-block group-last:mr-0"
					:disabled="!value.items.value[i - 1]"
					@click.right.prevent="value.items.value.splice(i - 1, 1)"
				>
					<span class="sr-only">{{ value.items.value[i - 1]?.name || `item ${i}` }}</span>
					<img
						v-if="value.items.value[i - 1]"
						:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${value.items.value[i - 1]!.image}`"
						width="64"
						height="64"
						loading="lazy"
					>
				</button>
			</li>
		</ul>
		<button
			:title="removeButtonAttrs.title"
			class="data-pretend-ui-button"
			:disabled="removeButtonAttrs.disabled"
			@click="removeButtonAttrs.emit"
		>
			<span class="sr-only">{{ removeButtonAttrs.title }}</span>
			<Icon name="ph-x" class="size-5" />
		</button>
		<button
			title="expand"
			class="data-pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="toggleExpanded"
		>
			<span class="sr-only">expand</span>
			<Icon name="ph-caret-down" class="size-5" />
		</button>
		<details ref="details">
			<summary>
				details
			</summary>
			<div>
				expanded info goes here
			</div>
		</details>
	</li>
</template>

<style>
@layer components {
	[data-lol-scoreboard-item] {
		@apply 'grid auto-cols-max grid-flow-col grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_0fr)] of-hidden py-2 px-4';

		--select-champion-size: calc(var(--spacing) * 14);
		--non-expanded-row-height: calc(var(--select-champion-size) / 2);
		--transition-duration: 150ms;
		grid-template-areas:
			'move-up		move-column	select-champion	select-runes	select-items	items			clear'
			'move-down	duplicate		select-champion	select-runes	select-items	items			expand'
			'expanded		expanded		expanded				expanded			expanded			expanded	expanded';
		grid-template-columns: repeat(5, max-content) 1fr max-content;
		transition-duration: var(--transition-duration);
		transition-timing-function: ease-in-out;
		transition-property: grid-template-rows;

		&:has(> details[open]) {
			@apply 'grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_1fr)]';

			> button:nth-last-of-type(1) {
				@apply 'rotate-180';
			}
		}

		> button {
			&:nth-of-type(1) {
				@apply 'self-end mb-0.5 mr-0.5';
				grid-area: move-up;
			}

			&:nth-of-type(2) {
				@apply 'self-start mt-0.5 mr-0.5';
				grid-area: move-down;
			}

			&:nth-of-type(3) {
				@apply 'self-end mb-0.5 ml-0.5';
				grid-area: move-column;
			}

			&:nth-of-type(4) {
				@apply 'self-start mt-0.5 ml-0.5';
				grid-area: duplicate;
			}

			&:nth-last-of-type(1) {
				@apply 'self-start mt-0.5';
				grid-area: expand;
			}

			&:nth-last-of-type(2) {
				@apply 'self-end mb-0.5';
				grid-area: clear;
			}

			&:nth-of-type(-n + 4),
			&:nth-last-of-type(-n + 2) {
				@apply 'size-5 grid-center';

				.iconify {
					@apply 'size-4';
				}
			}
		}

		> [data-select-champion] {
			@apply 'size-[--select-champion-size] mx-3 relative';
			grid-area: select-champion;

			> button {
				@apply 'group b b-2 b-[--ui-button-border-clr] rounded-full size-full of-hidden';

				img {
					@apply 'max-w-none size-[calc(100%_+_var(--spacing)_*_2)] -ml-1 -mt-1';
				}

				&:hover,
				&:focus-visible {
					img {
						@apply 'brightness-[--focus-brightness]';
					}
				}
			}
		}

		> [data-select-runes] {
			@apply 'b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 grid-center size-8 relative self-center';
			--secondary-path-icon-size: calc(var(--spacing) * 3);
			background: #020a13;
			grid-area: select-runes;

			[data-secondary-path-icon] {
				@apply 'size-[--secondary-path-icon-size] block -bottom-0.5 z-11 -right-0.5 absolute';
			}

			&:has([data-secondary-path-icon]):before {
				@apply 'content-empty z-10 absolute -right-0.5 -bottom-0.5 bg-inherit b b-[--ui-button-border-clr] size-[calc(var(--secondary-path-icon-size)_+_var(--spacing))] rounded-full translate-x-0.5 translate-y-0.5';
			}
		}

		> [data-select-items] {
			@apply 'self-center mx-3';
			grid-area: select-items;
		}

		> ul {
			@apply 'self-center mr-3';
			grid-area: items;
		}

		> details {
			grid-area: expanded;

			summary {
				@apply 'list-none invisible pointer-events-none';

				&::-webkit-details-marker {
					@apply 'hidden';
				}
			}

			> :not(summary) {
				@apply '-mt-6';
			}
		}
	}
}
</style>
