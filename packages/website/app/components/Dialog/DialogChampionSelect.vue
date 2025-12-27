<script setup lang="ts">
const value = defineModel<string>();

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
		class="bg-cyan-950 grid-cols-[repeat(auto-fit,_minmax(var(--fluid-48-90),_1fr))] max-h-[80vh] w-[min(90vw,_600px)] shadow-lg of-y-auto [&[open]]-grid"
		@close="closeCleanup"
	>
		<header
			class="bg-inherit flex col-span-full items-center top-0 sticky"
		>
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
						width="34"
						height="34"
						class="size-5"
					>
					<span class="sr-only">{{ role }}</span>
				</template>
			</VButtonRadiogroup>
			<div class="relative">
				<input
					id="champ-select-search"
					v-model="search"
					autofocus
					class="ml-2 bg-black"
					placeholder="Search"
					@update:model-value="selectedRole = undefined"
				>
				<label for="champ-select-search">Search</label>
			</div>
			<form method="dialog" class="ml-auto">
				<button value="cancel">
					close
				</button>
			</form>
		</header>
		<button
			v-for="champion in computedChampions"
			:key="champion.id"
			class="leading-tight text-center min-w-0 block hyphens-auto"
			@click="value = champion.id"
		>
			<img
				:title="champion.name"
				:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`"
				:style="`background-image: url(https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full})`"
				class="b aspect-1"
				width="128"
				height="128"
				loading="lazy"
			>
			{{ champion.name }}
		</button>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-champion-select > button img {
		object-fit: none;
		object-position: 100px 100px;
		background-repeat: no-repeat;
		background-size: 108%;
		background-position: center;
	}
}
</style>
