<script setup lang="ts">
const props = defineProps<{
	index: number;
	value: DamageSource;
	/** side of the scoreboard it's on, left by default */
	isRight?: boolean;
	canRemove?: boolean;
}>();

const { version, minorVersion } = usePatchVersion();
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelectDialog();
const { selectItems } = useItemShop();

const group = computed(() => props.isRight ? 'targets' : 'sources');
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<li class="grid auto-cols-max grid-flow-col grid-rows-2 *:row-span-full">
		<button class="grid-center !row-span-1" :title="`move to ${group}`">
			<span class="sr-only">move to {{ group }}</span>
			<Icon :name="isRight ? 'ph-arrow-left' : 'ph-arrow-right'" class="size-5" />
		</button>
		<button class="grid-center !row-span-1" title="duplicate">
			<span class="sr-only">duplicate</span>
			<Icon name="ph-copy" class="size-5" />
		</button>
		<button class="grid-center !row-span-1" title="move up">
			<span class="sr-only">move up</span>
			<Icon name="ph-arrow-up" class="size-5" />
		</button>
		<button class="grid-center !row-span-1" title="move down">
			<span class="sr-only">move down</span>
			<Icon name="ph-arrow-down" class="size-5" />
		</button>
		<button @click="selectRunes(value.runes)">
			<span class="sr-only">runes</span>
			<img
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
				width="32"
				height="32"
				loading="lazy"
				class="size-5"
			>
		</button>
		<div class="relative">
			<button @click="selectChampion(value.champion)">
				<img
					v-if="value.champion.value"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${value.champion.value.image}`"
					loading="lazy"
					width="128"
					height="128"
					class="size-10 inline-block"
				>
				<!-- TODO use patch version, cdn seems to be down atm -->
				<img
					v-else
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
					width="256"
					height="256"
					class="size-10 inline-block"
				>
			</button>
			<label :for="`${group}-${index}-level-select`" class="sr-only">Level</label>
			<select :id="`${group}-${index}-level-select`" v-model="value.level.value" class="bottom-0 right-0 absolute">
				<option v-for="i in 18" :key="i" :value="i">
					{{ i }}
				</option>
			</select>
		</div>
		<button @click="selectItems(value.items, value.itemDamageCalculationTarget.value)">
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
		<ul class="flex">
			<li v-for="i in 6" :key="i">
				<button
					class="border-gray-7 border size-8 inline-block"
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
		<button class="grid-center !row-span-1" title="remove" :disabled="!canRemove">
			<span class="sr-only">remove</span>
			<Icon name="ph-x" class="size-5" />
		</button>
		<button class="grid-center !row-span-1" title="expand">
			<span class="sr-only">expand</span>
			<Icon name="ph-caret-down" class="size-5" />
		</button>
	</li>
</template>
