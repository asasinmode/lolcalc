<script setup lang="ts">
import type { DamageSource } from '@lolcalc/core/DamageSource';
import type { IChampionStatName } from '@lolcalc/shared';
import type { ShallowRef } from 'vue';
import type { CalculatorResultsTable } from '#components';
import type { IDamageResultTableColumn, IDamageResultTableSection } from './utils/types';
import { ICON_GOLD, PATCH_VERSION } from '@lolcalc/data';
import { STAT_ICON } from '@lolcalc/data/meta';
import { ALL_CHAMPION_STATS_ENTRIES, CHAMPION_STAT_META } from '@lolcalc/shared';
import { _setupGlobalKeyModifiers } from './composables/useGlobalKeyModifiers';

const { vSemver, vMinor } = PATCH_VERSION;
const { _component: ChampSelect } = useChampSelect();
const { _component: ItemShop } = useItemShop();
const { _component: RuneSelect } = useRuneSelect();
const { _component: EffectsDialog } = useEffectsDialog();
const { _component: DamageSourceDebugDialog } = useDamageSourceDebug();

useHead({
	htmlAttrs: { lang: 'en' },
	link: [
		{ rel: 'icon', href: 'favicon.png' },
		{ rel: 'icon', href: 'favicon_dark.png', media: 'prefers-color-scheme: dark' },
	],
	style: [
		{
			textContent: `:root {
	--masterwork-border-url: url(https://raw.communitydragon.org/${vMinor}/game/assets/items/itemmodifiers/bordertreatmentornn.png)
}`,
		},
	],
});
useSeoMeta({
	title: 'lolcalc - Damage Calculator for League of Legends',
	description: 'Accurate champion stats calculation, damage and build comparison and more',
});

const iconButtonsShowText = useIconButtonsShowText();
if (import.meta.client) {
	watch(iconButtonsShowText, (value) => {
		if (value) {
			document.body.dataset.iconBtnsShowText = '';
		} else {
			document.body.removeAttribute('data-icon-btns-show-text');
		}
	}, { immediate: true });
}

_setupGlobalKeyModifiers();

/* expected to have DamageSources added in `restoreState`, shallowRefs because otherwise ref properties inside of classes get messed up */
const damageSources = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;
const damageTargets = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;

provide('damageSources', damageSources);
provide('damageTargets', damageTargets);

const resultColumns = ref<IDamageResultTableColumn[]>([{ id: useId() }]) as unknown as ShallowRef<IDamageResultTableColumn[]>;
const resultSections = ref<IDamageResultTableSection[]>([
	{
		id: 'a-stats',
		abilityId: { type: 'all', id: 'stats' },
		name: 'stats',
		isPermanent: true,
		image: `https://raw.communitydragon.org/${vMinor}/game/assets/ux/deathrecap/itemdamage.png`,
		imageSize: 32,
		rows: markRaw(ALL_CHAMPION_STATS_ENTRIES.map(([statName, statMeta]) => {
			const icon = STAT_ICON[statName as IChampionStatName];
			const image = typeof icon === 'string'
				? {
						src: `https://raw.communitydragon.org/${vMinor}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`,
						width: 20,
						height: 20,
					}
				:	{
						src: icon[0],
						width: icon[1],
						height: icon[2] ?? icon[1],
					};

			return {
				id: statName as string,
				name: statMeta.name,
				image,
			};
		}).concat([
			{
				id: 'eqValue',
				name: 'Inventory Value',
				image: ICON_GOLD,
			},
		])),
		getCellValue(_section, rowId, source, _target) {
			if (!source) {
				return;
			}

			if (rowId === 'eqValue') {
				const numberValue = source.items.value.reduce((acc, item) => acc + (item?.gold.total ?? 0), 0);
				return { numberValue, value: numberValue };
			}

			return {
				numberValue: source.stats.value.total[rowId as IChampionStatName],
				value: `${source.computed.formattedStatTotals.value[rowId as IChampionStatName]}${CHAMPION_STAT_META[rowId as IChampionStatName].isPercentage ? '%' : ''}`,
			};
		},
	},
	{
		id: 'a-aa',
		abilityId: { type: 'all', id: 'basicAttack' },
		name: 'basic attack',
		isPermanent: true,
		image: `https://raw.communitydragon.org/${vMinor}/game/assets/ux/deathrecap/autoattack.png`,
		imageSize: 32,
		rows: markRaw([
			{
				name: 'total',
				id: 'total',
			},
			{
				name: 'physical damage',
				id: 'physicalDamage',
			},
			{
				name: 'magic damage',
				id: 'magicDamage',
			},
			{
				name: 'true damage',
				id: 'trueDamage',
			},
			{
				name: 'DPS',
				id: 'dps',
			},
		]),
		// TODO
		getCellValue() {
			const value = Math.round(Math.random() * 500);
			const numberValue = value;

			return { value, numberValue };
		},
		selectValue: 'normal',
		selectOptions: markRaw([['normal', 'normal'], ['critical', 'critical'], ['average', 'average']]),
		selectLabel: 'attack type',
	},
	{
		id: 'a-cTtl',
		abilityId: { type: 'all', id: 'customTotal' },
		name: 'custom total',
		isPermanent: true,
		isCustomTotal: true,
		image: `https://raw.communitydragon.org/${vMinor}/game/assets/ux/deathrecap/unknowndamage.png`,
		imageSize: 32,
		rows: markRaw([
			{
				id: 'cTtl-total',
				name: 'total',
			},
		]),
		getCellValue() {
			// TODO return 0
			console.warn('results section custom total \'getCellValue\' called, should be handled manually');
			const value = Math.round(Math.random() * 500);
			const numberValue = value;

			return { value: numberValue, numberValue };
		},
	},
]);

const resultsTable = useTemplateRef('resultsTable');

const {
	saveState,
	restoreState,
	debouncedSaveState,
	isStateTooLargeForQuery,
} = useCalculatorState(damageSources, damageTargets, resultsTable as ShallowRef<InstanceType<typeof CalculatorResultsTable>>);

const showResults = ref(damageSources.value.some(source => source.anythingFilled.value));
if (!showResults.value) {
	const unwatchShowResults = watch(() => damageSources.value.some(source => source.anythingFilled.value), (anythingFilled) => {
		if (anythingFilled) {
			unwatchShowResults();
			showResults.value = true;
		}
	}, { immediate: true });
}

const hasCopiedShareLink = ref(false);
const shareTextPopover = useTemplateRef('shareTextPopover');

function copyShareLink() {
	hasCopiedShareLink.value = true;
	saveState();
	navigator.clipboard.writeText(location.href);
}

function showSharePopover() {
	shareTextPopover.value?.showPopover();
}

function hideSharePopover() {
	hasCopiedShareLink.value = false;
	shareTextPopover.value?.hidePopover();
}

function saveStateOnVisibilitychange() {
	document.hidden && saveState();
}

const cipheredEmail = [115, 117, 112, 111, 114, 116, 109, 111, 100, 101, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];
const emailEl = useTemplateRef('emailLink');

onMounted(() => {
	document.addEventListener('visibilitychange', saveStateOnVisibilitychange);
	const email = cipheredEmail.map(n => String.fromCharCode(n)).join('');
	emailEl.value?.append(email);
	emailEl.value?.setAttribute('href', `mailto:${email}`);
	restoreState();
});

onBeforeUnmount(() => {
	document.removeEventListener('visibilitychange', saveStateOnVisibilitychange);
});
</script>

<template>
	<header>
		<div>
			<h1>
				<a :href="$config.app.baseURL">
					<img
						src="/logo_dark.webp"
						width="192"
						height="192"
					>
					lolcalc
				</a>
				<span>alpha</span>
			</h1>
			<span>
				{{ vSemver }}
			</span>
			<button
				id="share-configuration"
				class="pretend-ui-btn"
				@click="copyShareLink"
				@mouseenter="showSharePopover"
				@focus="showSharePopover"
				@mouseleave="hideSharePopover"
				@blur="hideSharePopover"
			>
				share
				<div ref="shareTextPopover" popover="manual">
					{{ hasCopiedShareLink ? 'copied' : 'copy link to current configuration' }}
					<p v-show="isStateTooLargeForQuery" class="alert warning">
						configuration too large for url, some will data will be trimmed
						<Icon class="i-ph:warning-light" />
					</p>
				</div>
			</button>
		</div>
	</header>
	<main>
		<CalculatorScoreboard v-model:sources="damageSources" v-model:targets="damageTargets" />
		<section id="results">
			<h2 id="results-header">
				results
			</h2>
			<p v-show="!showResults">
				configure a damage source to view results
			</p>
			<CalculatorResultsTable
				ref="resultsTable"
				v-model:sections="resultSections"
				v-model:columns="resultColumns"
				:damage-sources
				:damage-targets
				:show-results
				@configuration-changed="debouncedSaveState"
			/>
		</section>
	</main>
	<footer>
		<h2>contact</h2>
		<ul>
			<li>
				<a href="https://github.com/asasinmode/lolcalc" target="_blank">
					<Icon class="i-logos:github-icon" /> lolcalc
				</a>
			</li>
			<li>
				<a ref="emailLink" target="_blank">
					<Icon class="i-logos:google-gmail" />
				</a>
			</li>
			<li>
				<a href="https://discord.com/channels/@me" target="_blank">
					<Icon class="i-logos:discord-icon" /> asasinmode
				</a>
			</li>
			<li>
				<a href="https://x.com/asasinmode" target="_blank">
					<Icon class="i-logos:x" /> asasinmode
				</a>
			</li>
		</ul>
		<p>
			<strong>lolcalc</strong> was created under Riot Games' <a href="https://www.riotgames.com/en/legal" target="_blank" rel="noreferrer noopener">"<span>Legal Jibber Jabber</span>"</a> policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.
		</p>
		<label for="TMP-toggle-button-style">
			<input id="TMP-toggle-button-style" v-model="iconButtonsShowText" type="checkbox">
			TMP icon buttons show text
		</label>
	</footer>
	<ClientOnly>
		<ChampSelect />
		<ItemShop />
		<RuneSelect />
		<EffectsDialog />
		<DamageSourceDebugDialog />
	</ClientOnly>
</template>

<style>
@layer components {
	:root {
		/* bg color of the 'plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png' */
		--placeholder-champion-bg-clr: #020a13;
	}

	#__nuxt {
		> header {
			--at-apply: 'flex b-b b-neutral-500 grid grid-cols-subgrid py-2.5';
			grid-column: page-start / page-end;

			> div {
				--at-apply: 'flex items-center justify-between relative';
				--logo-size: calc(10 * var(--spacing));
				grid-column: content-start / content-end;

				> h1 {
					--at-apply: 'text-3xl leading-[1] font-700 tracking-wide';

					> a {
						> img {
							--at-apply: 'inline-block size-[--logo-size]';
						}
					}

					> span {
						--at-apply: 'font-mono text-xs align-top -ms-1.5 text-neutral-300';
					}
				}

				> span {
					--at-apply: 'absolute text-xs text-neutral-400 font-600 font-mono start-[calc(var(--logo-size)+0.6rem)] -bottom-0.5';
				}

				> #share-configuration {
					--at-apply: 'px-2 py-0.5';
					anchor-name: --share-configuration;

					> [popover] {
						--at-apply: 'bg-black py-0.5 px-1 text-end b b-[--ui-btn-border-clr]';
						position-anchor: --share-configuration;
						inset-block-start: calc(anchor(end) + 0.25rem);
						inset-inline-end: calc(anchor(end));

						> .alert {
							--at-apply: 'py-1 text-sm mb-1';

							&::after {
								--at-apply: '-mt-1';
							}
						}
					}
				}
			}
		}

		> main {
			--at-apply: 'relative';

			> label {
				--at-apply: 'absolute';
			}

			> section > h2 {
				--at-apply: 'text-xl font-700 mx-auto text-center';
			}

			#results {
				--at-apply: 'mx-auto text-center relative';

				> h2 {
					--at-apply: 'mb-3 mt-5';
				}

				> p {
					--at-apply: 'absolute z-10 top-16 py-2 start-1/2 -translate-x-1/2 text-center text-xl font-500';
					-webkit-text-stroke: black 0.2em;
					paint-order: stroke fill;
				}
			}
		}

		> footer {
			--at-apply: 'pt-3 pb-3 text-neutral-400 mt-auto text-center b-t b-neutral-500 relative';

			> h2 {
				--at-apply: 'text-lg font-700 text-neutral-300 mb-0.5';
			}

			> ul {
				--at-apply: 'flex flex-wrap justify-center gap-x-8 gap-y-2 mb-5';

				> li {
					> a {
						--at-apply: 'hoverable:text-white grid grid-cols-[auto_1fr] gap-x-1.5 items-center';

						> .icon {
							--at-apply: 'size-4';
						}
					}

					&:is(:first-child, :last-child) > a > .icon {
						--at-apply: 'invert';
					}
				}
			}

			> p {
				> a {
					--at-apply: 'hoverable:text-white';

					> span {
						--at-apply: 'underline';
					}
				}
			}

			> label {
				--at-apply: 'absolute end-0 bottom-0 text-neutral-700';

				> input:not(:checked) {
					--at-apply: 'op-40';
				}
			}
		}
	}
}
</style>
