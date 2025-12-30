<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' } });
useSeoMeta({
	title: 'Collector - League of Legends Damage Calculator',
});

const champions = useChampions();
const { version } = usePatchVersion();

const itemShopDialog = useTemplateRef('itemShopDialog');
const champSelectDialog = useTemplateRef('champSelectDialog');
const runeDialog = useTemplateRef('runeDialog');
const sourceChampionStats = useTemplateRef('sourceChampionStats');

const sourceChampionId = ref<IChampionId>();
const sourceChampionLevel = ref(1);
const sourceChampionItems = ref<IItem[]>([]);
const sourceChampionRunes = ref<IChampionRunes>({
	shards: {
		offensive: 'adaptiveForce',
		flex: 'adaptiveForce',
		defensive: 'flatHealth',
	},
});

const sourceChampion = computed(() =>
	sourceChampionId.value ? champions[sourceChampionId.value] : undefined,
);

function addItem(item: IItem) {
	if (sourceChampionItems.value.length < 6) {
		sourceChampionItems.value.push(markRaw(item));
	}
}

const targetDummy = ref<IDamageTarget>({
	stats: { hp: 1000, armor: 0, magicResist: 0 },
});
</script>

<template>
	<main class="grid auto-rows-min grid-cols-2">
		<p class="col-span-full">
			current patch: {{ version }}
		</p>

		<div>
			<button @click="champSelectDialog?.open()">
				<img
					v-if="sourceChampion"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${sourceChampion.image}`"
					loading="lazy"
					width="128"
					height="128"
					class="size-10 inline-block"
				>
				<!-- TODO use patch version, cdn seems to be down atm -->
				<img
					v-else
					src="https://cdn.communitydragon.org/latest/champion/generic/square"
					width="256"
					height="256"
					class="size-10 inline-block"
				>
			</button>
			<DialogChampionSelect
				ref="champSelectDialog"
				v-model="sourceChampionId"
			/>
			<label for="source-champion-level">Level: </label>
			<select id="source-champion-level" v-model="sourceChampionLevel">
				<option v-for="i in 18" :key="i" :value="i">
					{{ i }}
				</option>
			</select>
			<button @click="itemShopDialog?.open()">
				item shop
			</button>
			<DialogItemShop ref="itemShopDialog" @buy-item="addItem" />
			<button
				v-for="i in 6"
				:key="i"
				class="border-gray-7 border size-8 inline-block"
				@click.right.prevent="sourceChampionItems.splice(i - 1, 1)"
			>
				<span v-if="sourceChampionItems[i - 1]" class="sr-only">{{ sourceChampionItems[i - 1]!.name }}</span>
				<img
					v-if="sourceChampionItems[i - 1]"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${sourceChampionItems[i - 1]!.image}`"
					width="64"
					height="64"
					loading="lazy"
				>
			</button>
			<button @click="runeDialog?.open()">
				runes {{ Object.values(sourceChampionRunes.shards) }}
			</button>
			<DialogRunes ref="runeDialog" v-model="sourceChampionRunes" />
		</div>

		<TargetDummy v-model="targetDummy" />

		<ChampionStats
			ref="sourceChampionStats"
			class="col-span-full"
			:champion="sourceChampion"
			:level="sourceChampionLevel"
			:items="sourceChampionItems"
			:runes="sourceChampionRunes"
		/>

		<AADamage
			v-if="sourceChampionStats?.value"
			class="mt-3 col-span-full"
			:source="{ stats: sourceChampionStats!.value!.totalStats }"
			:target="targetDummy"
		/>
	</main>
</template>
