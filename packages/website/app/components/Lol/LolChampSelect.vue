<script setup lang="ts">
const value = defineModel<IChampion>();
const champions = useChampions();
const { version, minorVersion } = usePatchVersion();

const ALL_ROLES: IChampionRole[] = ['top', 'jungle', 'middle', 'bottom', 'support'];
const ALL_CHAMPION = Object.values(champions);

const vDialog = useTemplateRef('vDialog');
const search = ref('');
const selectedRole = ref<IChampionRole>();

const computedChampions = computed(() => {
	const splitSearch = search.value
		.toLocaleLowerCase()
		.replaceAll(/[^a-z]/g, '')
		.split(' ')
		.filter(v => v);

	const searchFiltered = search.value
		? ALL_CHAMPION.filter(champion =>
				splitSearch.every(word =>
					champion.name.replaceAll(/['. ]/g, '').toLocaleLowerCase().includes(word),
				),
			)
		: ALL_CHAMPION;

	return selectedRole.value ? searchFiltered.filter(champion => champion.roles[selectedRole.value!]) : searchFiltered;
});

function closeCleanup() {
	search.value = '';
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog
		id="dialog-champion-select"
		ref="vDialog"
		class="bg-cyan-950 grid-rows-[auto_1fr] max-h-[80vh] w-[min(90vw,_600px)] shadow-lg of-visible [&[open]]-grid"
		@close="closeCleanup"
	>
		<header class="bg-inherit flex col-span-full items-center">
			<VButtonRadiogroup
				id="champ-select-role"
				v-model="selectedRole"
				label="Role"
				:options="ALL_ROLES.map(role => ({ role }))"
				value-key="role"
			>
				<template #default="{ option: { role }, isSelected }">
					<img
						:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-static-assets/global/default/svg/position-${role === 'support' ? 'utility' : role}${isSelected ? '' : '-light'}.svg`"
						aria-hidden="true"
						width="34"
						height="34"
						class="size-5"
					>
					<span class="sr-only">{{ role }}</span>
				</template>
			</VButtonRadiogroup>
			<div data-inline-search-label="">
				<input
					id="champ-select-search"
					v-model="search"
					autofocus
					type="text"
					placeholder=" "
					class="py-0.5 pl-8 pr-2 b bg-black"
					:data-empty="!search"
					@update:model-value="selectedRole = undefined"
				>
				<label for="item-shop-search" class="px-2 py-0.5 b b-transparent">
					<Icon class="i-ph:magnifying-glass-bold mr-2 size-4" />
					<span>
						Search
					</span>
				</label>
			</div>
			<form method="dialog" class="ml-auto">
				<button value="cancel">
					close
				</button>
			</form>
		</header>
		<section class="grid grid-cols-[repeat(auto-fit,_minmax(var(--fluid-48-90),_1fr))] of-y-auto">
			<button
				v-for="champion in computedChampions"
				:key="champion.id"
				class="leading-tight text-center min-w-0 block hyphens-auto"
				@click="value = champion"
			>
				<img
					:title="champion.name"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image}`"
					:style="`background-image: url(https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image})`"
					class="b aspect-1"
					width="128"
					height="128"
					aria-hidden="true"
					loading="lazy"
				>
				{{ champion.name }}
			</button>
		</section>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-champion-select > section button img {
		object-fit: none;
		object-position: 100px 100px;
		background-repeat: no-repeat;
		background-size: 108%;
		background-position: center;
	}
}
</style>
