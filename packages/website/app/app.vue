<script setup lang="ts">
import type { CalculatorResultsTable } from '#components';
import type { ShallowRef } from 'vue';
import type { IDamageResultTableColumn, IDamageResultTableSection } from './utils/types';
import { _setupGlobalKeyModifiers } from './composables/useGlobalKeyModifiers';

useHead({
	htmlAttrs: { lang: 'en' },
	link: [
		{ rel: 'icon', href: 'favicon.png' },
		{ rel: 'icon', href: 'favicon_dark.png', media: 'prefers-color-scheme: dark' },
	],
});
useSeoMeta({
	title: 'lolcalc - Damage Calculator for League of Legends',
	description: 'Accurate champion stats calculation, damage and build comparison and more',
});

const { version, minorVersion } = usePatchVersion();
const { _component: ChampSelect } = useChampSelect();
const { _component: ItemShop } = useItemShop();
const { _component: RuneSelect } = useRuneSelect();
const { _component: EffectsDialog } = useEffectsDialog();
const enableUnimplementedUi = useEnableUnimplementedUi();

_setupGlobalKeyModifiers();

/* expected to have DamageSources added in `restoreState` */
const damageSources = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;
const damageTargets = ref<DamageSource[]>([]) as unknown as ShallowRef<DamageSource[]>;

const resultColumns = ref<IDamageResultTableColumn[]>([{ id: useId() }]) as unknown as ShallowRef<IDamageResultTableColumn[]>;
const resultSections = ref<IDamageResultTableSection[]>([
	{
		id: 'a-stats',
		abilityId: { type: 'all', id: 'stats' },
		name: 'stats',
		isPermanent: true,
		image: `https://raw.communitydragon.org/${minorVersion}/game/assets/ux/deathrecap/itemdamage.png`,
		imageSize: 32,
		rows: markRaw(Object.entries(CHAMPION_STAT_NAMES).map(([championStat, statName]) => {
			return {
				id: championStat,
				name: statName,
				image: {
					src: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${STAT_ICON_NAMES[championStat as IChampionStatName]}.png`,
					width: 20,
					height: 20,
				},
			};
		}).concat([{
			id: 'eqValue',
			name: 'Inventory value',
			image: {
				src: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`,
				width: 32,
				height: 28,
			},
		}])),
		getCellValue(_section, rowId, source, _target) {
			if (!source) {
				return;
			}

			if (rowId === 'eqValue') {
				const numberValue = source.items.value.reduce((acc, item) => acc + (item?.gold.total ?? 0), 0);
				return { numberValue, value: numberValue };
			}

			const stat = source.computed.stats.value[rowId as IChampionStatName];
			return {
				numberValue: stat.total,
				value: `${stat.formattedTotal}${stat.isPercentage ? '%' : ''}`,
			};
		},
	},
	{
		id: 'a-aa',
		abilityId: { type: 'all', id: 'basicAttack' },
		name: 'basic attack',
		isPermanent: true,
		image: `https://raw.communitydragon.org/${minorVersion}/game/assets/ux/deathrecap/autoattack.png`,
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
		image: `https://raw.communitydragon.org/${minorVersion}/game/assets/ux/deathrecap/unknowndamage.png`,
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

if (import.meta.dev) {
	onMounted(restoreState);
} else {
	restoreState();
}

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
});

onBeforeUnmount(() => {
	document.removeEventListener('visibilitychange', saveStateOnVisibilitychange);
});
</script>

<template>
	<header>
		<h1>
			lolcalc
		</h1>
		<h2>
			League of Legends damage calculator
		</h2>
		<p>
			current patch: {{ version }}
			<br>
		</p>
		<label for="scoreboard-enable-unimplemented-ui">
			TMP enable unimplemented ui
			<input id="scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
		</label>
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
			<div ref="shareTextPopover" popover="hint">
				{{ hasCopiedShareLink ? 'copied' : 'copy link to current configuration' }}
				<p v-show="isStateTooLargeForQuery" class="alert warning">
					configuration too large for url, some will data will be trimmed
					<Icon class="i-ph:warning-light" />
				</p>
			</div>
		</button>
	</main>
	<footer>
		<h2>contact</h2>
		<ul>
			<li>
				<a href="https://discord.com/channels/@me" target="_blank">
					<Icon class="i-logos:discord-icon" /> asasinmode
				</a>
			</li>
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
				<a href="https://x.com/asasinmode" target="_blank">
					<Icon class="i-logos:x" /> asasinmode
				</a>
			</li>
		</ul>
		<p>
			<strong>lolcalc</strong> was created under Riot Games' <a href="https://www.riotgames.com/en/legal" target="_blank" rel="noreferrer noopener">"<span>Legal Jibber Jabber</span>"</a> policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.
		</p>
	</footer>
	<ClientOnly>
		<ChampSelect />
		<ItemShop />
		<RuneSelect />
		<EffectsDialog />
	</ClientOnly>
</template>

<style>
@layer components {
	:root {
		/* bg color of the 'plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png' */
		--placeholder-champion-bg-clr: #020a13;
	}

	#results {
		--at-apply: 'mx-auto text-center relative';

		> p {
			--at-apply: 'absolute z-10 top-16 py-2 start-1/2 -translate-x-1/2 text-center text-xl font-500';
			-webkit-text-stroke: black 0.2em;
			paint-order: stroke fill;
		}
	}

	#__nuxt {
		> main {
			--at-apply: 'relative';

			> #share-configuration {
				--at-apply: 'px-2 py-0.5 absolute top-0 end-0';
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

		> footer {
			--at-apply: 'pt-12 pb-3 text-neutral-400 mt-auto text-center';

			> p {
				> a {
					--at-apply: 'hoverable:text-white';

					> span {
						--at-apply: 'underline';
					}
				}
			}

			> h2 {
				--at-apply: 'text-lg uppercase font-700 text-neutral-300';
			}

			> ul {
				--at-apply: 'flex flex-wrap justify-center gap-x-8 gap-y-2 mb-4';

				> li {
					--at-apply: '';

					> a {
						--at-apply: 'hoverable:text-white grid grid-cols-[auto_1fr] gap-x-1.5 items-center';

						> .icon {
							--at-apply: 'size-4';
						}
					}

					&:nth-child(even) {
						> a {
							> .icon {
								--at-apply: 'invert';
							}
						}
					}
				}
			}
		}
	}
}
</style>
