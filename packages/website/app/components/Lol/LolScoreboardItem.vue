<script setup lang="ts">
const props = defineProps<{
	index: number;
	value: DamageSource;
	/** side of the scoreboard it's on, left by default */
	isRight?: boolean;
	canRemove?: boolean;
	canMoveDown?: boolean;
}>();

const runes = useRunes();
const { version, minorVersion } = usePatchVersion();
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelectDialog();
const { selectItems } = useItemShop();
const text = useText();

const group = computed(() => props.isRight ? 'targets' : 'sources');

const runePathPrimary = computed(() => {
	const { primary } = props.value.runes.value.paths;
	if (primary) {
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
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<li data-lol-scoreboard-item="">
		<button title="move up" :disabled="index === 0" data-pretend-ui-button="">
			<span class="sr-only">move up</span>
			<Icon name="ph-arrow-up" />
		</button>
		<button title="move down" :disabled="!canMoveDown" data-pretend-ui-button="">
			<span class="sr-only">move down</span>
			<Icon name="ph-arrow-down" />
		</button>
		<button :title="`move to ${group}`" data-pretend-ui-button="" :disabled="!value.anythingFilled.value">
			<span class="sr-only">move to {{ isRight ? 'sources' : 'targets' }}</span>
			<Icon :name="isRight ? 'ph-arrow-left' : 'ph-arrow-right'" />
		</button>
		<button title="duplicate" data-pretend-ui-button="" :disabled="!value.anythingFilled.value">
			<span class="sr-only">duplicate</span>
			<Icon name="ph-copy" />
		</button>
		<button
			class=""
			title="runes"
			data-select-runes=""
			@click="selectRunes(value.runes)"
		>
			<span class="sr-only">{{ value.runePathsEmpty ? 'select runes' : 'runes' }}</span>
			<span v-show="value.runesInvalid.value" class="text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -right-0.5 -top-0.5">
				<span class="sr-only">(invalid)</span>
				<Icon name="ph-exclamation-mark-bold" class="size-3" />
			</span>
			<template v-if="runePathPrimary">
				<span class="sr-only">
					primary: {{ runePathPrimary.name }}
				</span>
				<span
					:style="`background-color: ${runePathPrimary.iconColor}; mask: url(${runePathPrimary.icon}) no-repeat center;`"
					aria-hidden="true"
					width="32"
					height="32"
					class="size-5 block"
				/>
			</template>
			<img
				v-else
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
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
					width="32"
					height="32"
					class="size-3 block bottom-0 right-0 absolute"
				/>
			</template>
		</button>
		<div class="size-14 relative">
			<button
				class="group b b-2 b-[--ui-button-border-clr] rounded-full size-full of-hidden *:size-full"
				:title="value.champion.value ? value.champion.value.name : 'champion'"
				data-select-champion=""
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
			<select :id="`${group}-${index}-level-select`" v-model="value.level.value" class="bottom-0 right-0 absolute">
				<option v-for="i in 18" :key="i" :value="i">
					{{ i }}
				</option>
			</select>
		</div>
		<button class="px-1 flex gap-x-1 items-center" data-pretend-ui-button="" @click="selectItems(value.items, value.itemDamageCalculationTarget.value)">
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
					:disabled="!value.items.value[i]"
					@click.right.prevent="value.items.value.splice(i - 1, 1)"
				>
					<span v-if="value.items.value[i - 1]" class="sr-only">{{ value.items.value[i - 1]!.name }}</span>
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
		<button class="grid-center !row-span-1" title="remove" :disabled="!canRemove" data-pretend-ui-button="">
			<span class="sr-only">remove</span>
			<Icon name="ph-x" class="size-5" />
		</button>
		<button class="grid-center !row-span-1" title="expand" data-pretend-ui-button="" :disabled="!value.anythingFilled.value">
			<span class="sr-only">expand</span>
			<Icon name="ph-caret-down" class="size-5" />
		</button>
	</li>
</template>

<style>
@layer components {
	[data-lol-scoreboard-item] {
		@apply 'gap-x-2 gap-y-1 grid auto-cols-max grid-flow-col grid-rows-2 items-center *:row-span-full';

		> button {
			&:nth-of-type(-n + 4),
			&:nth-last-of-type(-n + 2) {
				@apply 'size-5 grid-center row-span-1';

				.iconify {
					@apply 'size-4';
				}

				&:nth-of-type(odd) {
					@apply 'self-end';
				}

				&:nth-of-type(even) {
					@apply 'self-start';
				}
			}

			&:nth-of-type(3),
			&:nth-of-type(4) {
				@apply '-ml-1';
			}
		}

		button[data-select-runes] {
			@apply 'b b-[--ui-button-border-clr] rounded-full bg-neutral-900 hoverable:bg-neutral-700 grid-center size-8 relative';
		}

		button[data-select-champion] {
			&:hover,
			&:focus-visible {
				img {
					@apply 'brightness-[--focus-brightness]';
				}
			}
		}
	}
}
</style>
