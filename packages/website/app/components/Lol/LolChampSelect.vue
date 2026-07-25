<script setup lang="ts">
import type { IListedChampion } from '@lolcalc/data/types';
import type { IChampionRole } from '@lolcalc/shared/types';
import { CHAMPION_IMAGES, CHAMPIONS, PATCH_VERSION } from '@lolcalc/data';

const value = defineModel<IListedChampion>();
const selectedChampion = shallowRef<IListedChampion | undefined>();

watch(value, (c) => {
	selectedChampion.value = c;
}, { immediate: true });

const { vMinor } = PATCH_VERSION;
const { championImage } = CHAMPION_IMAGES;

const ALL_ROLES: [IChampionRole, string ][] = [
	['top', 'top'],
	['jungle', 'jungle'],
	['mid', 'middle'],
	['bot', 'bottom'],
	['support', 'utility'],
];
const ALL_CHAMPIONS = Object.values(CHAMPIONS);

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
		? ALL_CHAMPIONS.filter(champion =>
				splitSearch.every(word =>
					champion.name.replaceAll(/['. ]/g, '').toLocaleLowerCase().includes(word),
				),
			)
		: ALL_CHAMPIONS;

	return selectedRole.value ? searchFiltered.filter(champion => champion.roles[selectedRole.value!]) : searchFiltered;
});

function closeCleanup() {
	search.value = '';
	value.value = selectedChampion.value;
}

const longestName = ALL_CHAMPIONS.reduce((lName, champ) => champ.name.length > lName.length ? champ.name : lName, '');

defineExpose({
	open: () => {
		vDialog.value?.open();
		nextTick(() => {
			const ul = vDialog.value?.el?.querySelector('ul');
			const selected = ul?.querySelector('.selected') as HTMLElement;
			if (ul && selected) {
				ul.scrollTop = selected.offsetTop - ul.offsetHeight / 2;
			}
		});
	},
});
</script>

<template>
	<VDialog
		id="dialog-champ-select"
		ref="vDialog"
		@close="closeCleanup"
	>
		<header>
			<h1>
				champ select
			</h1>
			<VButtonRadiogroup
				id="champ-select-role"
				v-model="selectedRole"
				label="Role"
				:options="ALL_ROLES.map(([role, icon]) => ({ role, icon }))"
				value-key="role"
			>
				<template #default="{ option: { role, icon } }">
					<img
						:src="`https://raw.communitydragon.org/${vMinor}/plugins/rcp-fe-lol-static-assets/global/default/svg/position-${icon}-light.svg`"
						aria-hidden="true"
						width="34"
						height="34"
					>
					<span>{{ role }}</span>
				</template>
			</VButtonRadiogroup>
			<div class="inline-search-label">
				<input
					id="champ-select-search"
					v-model="search"
					autofocus
					type="text"
					:data-empty="!search"
					@update:model-value="selectedRole = undefined"
				>
				<label for="item-shop-search">
					<Icon class="i-ph:magnifying-glass-bold" />
					Search
				</label>
				<button title="clear" @mousedown.prevent="search = ''">
					<span>
						clear
					</span>
					<Icon class="i-ph:x-bold" />
				</button>
			</div>
			<form method="dialog">
				<button value="cancel" title="close" autofocus>
					<Icon class="i-ph:x-bold" />
					<span>
						close
					</span>
				</button>
			</form>
		</header>
		<ul :data-longest-name="longestName">
			<li
				v-for="champion in computedChampions"
				:key="champion.id"
				:class="{ selected: selectedChampion === champion }"
			>
				<button
					class="leading-tight text-center min-w-0 block hyphens-auto"
					@click="(selectedChampion = champion) && vDialog?.el?.close()"
				>
					<img
						:title="champion.name"
						:src="championImage(champion.image, champion.id)"
						:style="`background-image: url(${championImage(champion.image, champion.id)})`"
						width="128"
						height="128"
						aria-hidden="true"
						loading="lazy"
					>
					{{ champion.name }}
				</button>
			</li>
		</ul>
	</VDialog>
</template>

<style>
@layer components {
	#dialog-champ-select {
		--at-apply: 'bg-[--cyan-bg] b b-[--ui-btn-border-clr] grid-rows-[auto_1fr] h-200 shadow-lg of-visible';
		--px: calc(8 * var(--spacing));

		&[open] {
			--at-apply: 'grid';
		}

		> header {
			--at-apply: 'bg-inherit flex col-span-full items-end b-b b-[--ui-btn-border-clr] mx-[--px] mt-[--mt] relative';
			--mt: calc(4 * var(--spacing));

			> h1 {
				--at-apply: 'sr-only';
			}

			> form {
				--at-apply: 'end-0 -top-[--mt] absolute translate-x-full';

				> button {
					--at-apply: 'p-1 text-neutral-200 block-8 hoverable:text-white';

					> span:first-child {
						--at-apply: 'size-6';
					}

					> span:last-child {
						--at-apply: 'sr-only';
					}
				}
			}

			#champ-select-role {
				height: calc(var(--btn-size) + var(--btn-pb) + var(--btn-b-b));
				--btn-size: calc(7 * var(--spacing));
				--btn-pb: calc(0.25 * var(--spacing));
				--btn-b-b: 3px;

				> button {
					--at-apply: 'me-3 last:me-0 pb-[--btn-pb] relative b-b-[length:--btn-b-b] b-transparent';

					> img {
						--at-apply: 'brightness-50 size-[--btn-size]';
					}

					> span {
						--at-apply: 'sr-only';
					}

					&[aria-checked='true'],
					&:focus-visible,
					&:hover {
						> img {
							--at-apply: 'brightness-100';
						}
					}

					&[aria-checked='true'] {
						--at-apply: 'b-b-[--ui-btn-border-clr]';
					}
				}
			}

			> .inline-search-label {
				--at-apply: 'ms-auto mb-1';
				--py: calc(0.25 * var(--spacing));
			}
		}

		> ul {
			--at-apply: 'grid grid-cols-[repeat(6,minmax(max-content,1fr))] auto-rows-min of-y-auto py-3 px-[--px] gap-x-2 gap-y-[--gap-y] w-max min-w-full';
			--img-size: calc(20 * var(--spacing));
			--gap-y: calc(3 * var(--spacing));

			> li {
				--at-apply: 'flex justify-center h-min';

				> button {
					--at-apply: 'whitespace-nowrap flex flex-col items-center text-neutral-200 text-center h-min relative';

					> img {
						--at-apply: 'b b-neutral-600 aspect-1 size-[--img-size] mx-3 mb-1';
						object-fit: none;
						object-position: 100px 100px;
						background-repeat: no-repeat;
						background-size: 108%;
						background-position: center;
					}

					&:hover,
					&:focus-visible {
						> img {
							--at-apply: 'brightness-115';
						}
					}
				}

				&.selected > button {
					--at-apply: 'of-visible';

					> img {
						--at-apply: 'saturate-0';
					}

					&::before,
					&::after {
						--at-apply: 'absolute size-[--img-size] top-0 start-1/2 -translate-x-1/2 content-empty z-1';
					}

					&::before {
						--at-apply: 'size-[calc(var(--img-size)+2*var(--b-w))] -top-[--b-w]';
						--b-w: calc(0.5 * var(--spacing));
						--corner-size: calc(3 * var(--spacing));
						--clr: var(--ui-btn-border-clr);

						background:
							linear-gradient(var(--clr) 0 0) top left / var(--corner-size) var(--b-w) no-repeat,
							linear-gradient(var(--clr) 0 0) top left / var(--b-w) var(--corner-size) no-repeat,
							linear-gradient(var(--clr) 0 0) top right / var(--corner-size) var(--b-w) no-repeat,
							linear-gradient(var(--clr) 0 0) top right / var(--b-w) var(--corner-size) no-repeat,
							linear-gradient(var(--clr) 0 0) bottom left / var(--corner-size) var(--b-w) no-repeat,
							linear-gradient(var(--clr) 0 0) bottom left / var(--b-w) var(--corner-size) no-repeat,
							linear-gradient(var(--clr) 0 0) bottom right / var(--corner-size) var(--b-w) no-repeat,
							linear-gradient(var(--clr) 0 0) bottom right / var(--b-w) var(--corner-size) no-repeat;
					}

					&::after {
						--at-apply: 'rounded-1/2 b-3 b-[--ui-btn-border-clr] outline -outline-offset-3.5 outline-black';
					}
				}
			}

			&::after {
				--at-apply: 'invisible whitespace-nowrap h-0 select-none';
				content: attr(data-longest-name);
			}
		}
	}
}
</style>
