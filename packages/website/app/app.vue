<script setup lang="ts">
import { imgUrl, PATCH_VERSION } from '@lolcalc/data';
import { _setupGlobalKeyModifiers } from '~/composables/useGlobalKeyModifiers';

const { saveState, isStateTooLargeForQuery } = useManageCalculatorState(initCalculatorState());
const { vSemver } = PATCH_VERSION;
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
	--masterwork-border-url: url(${imgUrl('game/assets/items/itemmodifiers/bordertreatmentornn.png')});
	--empty-champion-url: url(${imgUrl('plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png')})
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
const navEmailEl = useTemplateRef('emailLinkNav');

onMounted(() => {
	const email = cipheredEmail.map(n => String.fromCharCode(n)).join('');
	emailEl.value?.append(email);
	emailEl.value?.setAttribute('href', `mailto:${email}`);
	navEmailEl.value?.append(email);
	navEmailEl.value?.parentElement?.setAttribute('href', `mailto:${email}`);
});

function closeMenuIfOutside(event: FocusEvent) {
	if (!event.relatedTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)) {
		(event.currentTarget as HTMLElement).hidePopover();
	}
}

function closeNav() {
	document.getElementById('page-nav')?.hidePopover();
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
</script>

<template>
	<button id="menu-btn" title="menu" popovertarget="page-nav">
		<span>menu</span>
		<Icon class="i-ph:list-bold" />
	</button>
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
			<nav id="page-nav" popover @focusout="closeMenuIfOutside">
				<button id="menu-close-btn" title="zamknij menu" popovertargetaction="hide" popovertarget="page-nav">
					<span>zamknij menu</span>
					<Icon class="i-ph:x-bold" />
				</button>
				<button
					v-show="$route.name === 'index'"
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
						{{ hasCopiedShareLink ? 'copied' : 'copy link to the current configuration' }}
						<p v-show="isStateTooLargeForQuery" class="alert warning">
							configuration too large for url, some data will be trimmed
							<Icon class="i-ph:warning-light" />
						</p>
					</div>
				</button>
				<ul>
					<li>
						<NuxtLink to="/" @click="closeNav">
							calculator
						</NuxtLink>
					</li>
					<li>
						<NuxtLink to="/guide" @click="closeNav">
							guide
						</NuxtLink>
					</li>
					<li>
						<NuxtLink to="/about" @click="closeNav">
							about
						</NuxtLink>
					</li>
					<li>
						<button @click="reportAnIssue">
							report an issue
						</button>
					</li>
				</ul>
				<ul>
					<li>
						<a target="_blank">
							<span ref="emailLinkNav" />
							<Icon class="i-logos:google-gmail" />
						</a>
					</li>
					<li>
						<a href="https://www.reddit.com/user/asasinmode/" target="_blank">
							<span>asasinmode</span>
							<Icon class="i-logos:reddit-icon" />
						</a>
					</li>
					<li>
						<a href="https://discord.com/channels/@me" target="_blank">
							<span>asasinmode</span>
							<Icon class="i-logos:discord-icon" />
						</a>
					</li>
					<li>
						<a href="https://x.com/asasinmode" target="_blank">
							<span>asasinmode</span>
							<Icon class="i-logos:x" />
						</a>
					</li>
					<li>
						<a href="https://github.com/asasinmode/lolcalc" target="_blank">
							<span>lolcalc</span>
							<Icon class="i-logos:github-icon" />
						</a>
					</li>
				</ul>
			</nav>
			<span />
		</div>
	</header>
	<NuxtPage />
	<footer>
		<h2>contact</h2>
		<ul>
			<li>
				<a ref="emailLink" target="_blank">
					<Icon class="i-logos:google-gmail" />
				</a>
			</li>
			<li>
				<a href="https://www.reddit.com/user/asasinmode/" target="_blank">
					<Icon class="i-logos:reddit-icon" /> asasinmode
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
			<li>
				<a href="https://github.com/asasinmode/lolcalc" target="_blank">
					<Icon class="i-logos:github-icon" /> lolcalc
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
		<ReportIssueDialog />
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
		--header-logo-size: calc(10 * var(--spacing));
		--header-py: calc(2.5 * var(--spacing));
		--menu-btn-bs: calc(2.75 * var(--spacing));
	}

	#__nuxt {
		#menu-btn {
			--at-apply: 'fixed inset-e-0 inset-bs-[--menu-btn-bs] z-11 ms-auto -translate-x-(--size-page-computed-px) translate-y-[calc(0.5*var(--header-logo-size)-50%)] rounded-[50%] b b-transparent bg-(--mauve-bg) transition-[box-shadow,border]';

			> span:nth-child(2) {
				--at-apply: '-ms-px -mbs-px';
			}

			@media (width >= 680px) {
				& {
					--at-apply: 'hidden';
				}
			}
		}

		#menu-close-btn {
			--at-apply: 'me-(--size-page-px) p-2 col-start-2 row-start-1';

			@media (width >= 680px) {
				& {
					--at-apply: 'hidden';
				}
			}
		}

		#menu-btn,
		#menu-close-btn {
			--at-apply: 'p-2 size-10';

			> span {
				&:nth-child(1) {
					--at-apply: 'sr-only';
				}

				&:nth-child(2) {
					--at-apply: 'size-6';
				}
			}
		}

		#share-configuration {
			--at-apply: 'px-2 py-0.5 col-start-1 inline-max self-center row-start-1';
			anchor-name: --share-configuration;

			@media (width >= 680px) {
				& {
					--at-apply: 'me-1.5';
				}
			}

			> [popover] {
				--at-apply: 'bg-black py-0.5 px-1 text-end b b-[--ui-btn-border-clr]';
				position-anchor: --share-configuration;
				justify-self: anchor-center;
				inset-block-start: calc(anchor(end) + 0.25rem);

				> .alert {
					--at-apply: 'py-1 text-sm mb-1';
				}
			}
		}

		> header {
			--at-apply: 'flex b-b b-neutral-500 grid grid-cols-subgrid py-[--header-py]';
			grid-column: page;

			> div {
				--at-apply: 'flex items-center justify-between relative';
				grid-column: content-start / content-end;

				> nav {
					--at-apply: 'fixed of-x-hidden of-y-auto z-10 grow flex-col items-end inset-bs-0 inset-e-0 max-inline-[80vw] min-inline-60 gap-3';
					--nav-px: calc(var(--size-page-px) + 2 * var(--spacing));

					&:popover-open {
						--at-apply: 'grid grid-cols-[1fr_auto] grid-rows-[auto_max-content_1fr]';
					}

					@media (width >= 680px) {
						& {
							--at-apply: 'flex static py-0 pe-0 bg-transparent flex-row justify-end items-center';
						}
					}

					@media (width < 680px) {
						& {
							--at-apply: 'bg-[--mauve-bg] block-screen shadow-xl shadow-black pbs-[--menu-btn-bs] pbe-[calc(var(--menu-btn-bs)+2*var(--spacing))] ps-[--nav-px]';
						}
					}

					&:popover-open {
						&::backdrop {
							--at-apply: 'bg-black/30';
						}
					}

					> ul:first-of-type {
						--at-apply: 'flex font-500 flex-col col-span-full text-end gap-y-2 py-5';

						@media (width >= 680px) {
							& {
								--at-apply: 'flex-row gap-5 py-0';
							}
						}

						> li {
							> * {
								--at-apply: 'px-[--nav-px] py-2 block float-end leading-none text-xl';

								@media (width >= 680px) {
									& {
										--at-apply: 'px-0 py-0 text-base';
									}
								}
							}
							> *:hover,
							> *:focus-visible,
							> .router-link-active {
								--at-apply: 'text-[--accent]';
							}

							&:nth-child(1) {
								--accent: theme('colors.green.400');
							}

							&:nth-child(2) {
								--accent: theme('colors.blue.400');
							}

							&:nth-child(3) {
								--accent: theme('colors.yellow.400');
							}

							&:nth-child(4) {
								--accent: theme('colors.red.400');
							}
						}
					}

					> ul:last-of-type {
						--at-apply: 'flex gap-1 mbs-auto inline-4/5 mx-auto col-span-full';

						> * {
							--at-apply: 'flex-1 aspect-1';

							&:nth-last-child(1),
							&:nth-last-child(2) {
								span {
									--at-apply: 'invert';
								}
							}

							&:nth-child(2),
							&:nth-last-child(1) {
								span:last-child {
									--at-apply: 'inline-[65%]';
								}
							}
						}

						a {
							--at-apply: 'size-full block relative';

							> span:first-child {
								--at-apply: 'sr-only';
							}

							> span:last-child {
								--at-apply: 'block-full absolute translate-center start-1/2 inset-bs-1/2';
							}
						}

						@media (width >= 680px) {
							& {
								--at-apply: 'hidden';
							}
						}
					}
				}

				/* for eating clicks on nav backdrop */
				> nav:popover-open + span {
					--at-apply: 'fixed inset-0 z-1000';
				}

				@media (width >= 680px) {
					> nav + span {
						--at-apply: 'hidden';
					}
				}

				> h1 {
					--at-apply: 'text-3xl leading-none font-700 tracking-wide';

					> a {
						> img {
							--at-apply: 'inline-block size-[--header-logo-size]';
						}
					}

					> span {
						--at-apply: 'font-mono text-xs align-top -ms-1.5 text-neutral-300';
					}
				}

				> span {
					--at-apply: 'absolute text-xs text-neutral-400 font-600 font-mono start-[calc(var(--header-logo-size)+0.6rem)] -bottom-0.5';
				}
			}
		}

		> footer {
			--at-apply: 'pbs-3 pbe-3 text-neutral-400 grid grid-cols-[subgrid] mbs-auto text-center b-bs b-neutral-500 relative';
			grid-column: page;

			> * {
				grid-column: content;
			}

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

					&:is(:nth-last-child(1), :nth-last-child(2)) > a > .icon {
						--at-apply: 'invert';
					}

					&:is(:nth-child(2), :nth-child(3), :nth-last-child(1)) > a > .icon {
						--at-apply: 'size-4.5';
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
