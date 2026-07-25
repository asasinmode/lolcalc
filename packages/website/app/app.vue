<script setup lang="ts">
import { PATCH_VERSION } from '@lolcalc/data';
import { _setupGlobalKeyModifiers } from '~/composables/useGlobalKeyModifiers';

const { vSemver, vMinor } = PATCH_VERSION;
const enableUnimplementedUi = useEnableUnimplementedUi();
const { reportAnIssue } = useReportIssueDialog();
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

const cipheredEmail = [115, 117, 112, 111, 114, 116, 109, 111, 100, 101, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];
const emailEl = useTemplateRef('emailLink');

onMounted(() => {
	const email = cipheredEmail.map(n => String.fromCharCode(n)).join('');
	emailEl.value?.append(email);
	emailEl.value?.setAttribute('href', `mailto:${email}`);
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
				26{{ vSemver.slice(vSemver.indexOf('.')) }}
			</span>
			<nav>
				<ul>
					<li>
						<NuxtLink to="/">
							calculator
						</NuxtLink>
					</li>
					<li>
						<NuxtLink to="/guide">
							guide
						</NuxtLink>
					</li>
					<li>
						<NuxtLink to="/about">
							about
						</NuxtLink>
					</li>
					<li>
						<button @click="reportAnIssue">
							report an issue
						</button>
					</li>
				</ul>
			</nav>
		</div>
	</header>
	<NuxtPage />
	<ReportIssueDialog />
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
		<label for="scoreboard-enable-unimplemented-ui">
			<input id="scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
			enable unimplemented ui
		</label>
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
@layer base {
	:root {
		/* bg color of the 'plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png' */
		--placeholder-champion-bg-clr: #020a13;
	}

	#__nuxt {
		> header {
			--at-apply: 'flex b-b b-neutral-500 grid grid-cols-subgrid py-2.5';
			grid-column: page;

			> div {
				--at-apply: 'flex items-center justify-between relative';
				--logo-size: calc(10 * var(--spacing));
				grid-column: content-start / content-end;

				> nav {
					> ul {
						--at-apply: 'flex gap-5 font-500';

						> li {
							> *:hover,
							> *:focus-visible,
							> .router-link-active {
								--at-apply: 'text-[--accent]';
							}

							&:nth-child(1) {
								--accent: var(--colors-green-400);
							}

							&:nth-child(2) {
								--accent: var(--colors-blue-400);
							}

							&:nth-child(3) {
								--accent: var(--colors-yellow-400);
							}

							&:nth-child(4) {
								--accent: var(--colors-red-400);
							}
						}
					}
				}

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
			}
		}

		> footer {
			--at-apply: 'pt-3 pb-3 text-neutral-400 mt-auto text-center b-t b-neutral-500 relative';
			grid-column: page;

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

				&:nth-of-type(1) {
					--at-apply: 'bottom-5';
				}

				> input:not(:checked) {
					--at-apply: 'op-40';
				}
			}
		}
	}
}
</style>
