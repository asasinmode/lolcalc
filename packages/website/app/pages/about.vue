<script setup lang="ts">
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { simpleFormattingGameAbilityImage } from '@lolcalc/core/misc';
import { IMPLEMENTED_CHAMPION_IDS } from '@lolcalc/core/specifics/champion.js';
import { STAT_ICON, CHAMPIONS, CHAMPION_IMAGES } from '@lolcalc/data/index';
import { AbilityType, ITEM_NAME_TO_ID } from '@lolcalc/shared/index';

useHashTargetHighlighting();
const { championImageSize, championImage } = CHAMPION_IMAGES;
const { reportAnIssue } = useReportIssueDialog();

const discrepancyMaxHealthMana = useSimpleDescription(
	'about-discrepancy-1',
	`Max <scalehealth>%i:${STAT_ICON.hp}%health</scalehealth> and <scalemanNuxtLink>%i:${STAT_ICON.mana}%mana</scalemanNuxtLink>/<scaleenergy>ability resource</scaleenergy> have a <span class="error-margin">margin of error of <strong>1</strong></span>. Most of the differences should be coming from floating point arithmetic and the in game ui rounding the displayed <scalehealth>hp</scalehealth> up and <scalemanNuxtLink>mana</scalemanNuxtLink> down. This means that the game displays something like <span class="code-like">2773.0000001</span> as <span class="code-like">2774</span>, even though it's effectively <span class="code-like">2773</span> ([example config](#TODO)).`,
);
const discrepancyAttackRangeRfc = useSimpleDescription(
	'about-discrepancy-2',
	`%i:${STAT_ICON.attackRange}%Attack range with [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rfc))}Rapid Firecannon's](https://wiki.leagueoflegends.com/en-us/Rapid_Firecannon) passive active has a <span class="error-margin">margin of error of <strong>1</strong></span>. I don't know why ([config with chogath with R 6 stacks/rakan from test](#TODO)).`,
);
const discrepancyBloodmailRetribution = useSimpleDescription(
	'about-discrepancy-3',
	`<scalead>%i:${STAT_ICON.attackDamage}%Attack damage</scalead> with [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.overlordsBloodmail))}Overlord's Bloodmail's](https://wiki.leagueoflegends.com/en-us/Overlord's_Bloodmail) [Retribution](https://wiki.leagueoflegends.com/en-us/Named_item_effect#Retribution) passive can be slightly off for high <scalehealth>max hp</scalehealth> values, or might be difficult to exactly verify with the game, since it calculates it &quot;on top&quot; of other stat calculations (as if it was an external effect). For example, if in game you see a champion with <scalehealth>300 %i:${STAT_ICON.hp}%hp</scalehealth>, in that exact moment you are looking at their stats, their displayed <scalead>ad</scalead> might be lagging behind and showing the value for <scalehealth>299 %i:${STAT_ICON.hp}%hp</scalehealth> that was just there, before it regenerated. Because of this, when [Retribution](https://wiki.leagueoflegends.com/en-us/Named_item_effect#Retribution) is a factor, <scalead>%i:${STAT_ICON.attackDamage}%attack damage's</scalead> <span class="error-margin">margin of error is <strong>1</strong> within <strong>+/-0.5%</strong></span> <scalehealth>%i:${STAT_ICON.hp}%current health</scalehealth> (check if <scalead>ad</scalead> is correct within +/-0.5% <scalehealth>hp</scalehealth>).`,
);

const nonPassiveAbilitiesDisclaimer = useSimpleDescription(
	'about-non-passive-abilities-disclaimer',
	`Non-passive abilities (like [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Ambessa', 'r', 0))}Ambessa R passive](https://wiki.leagueoflegends.com/en-us/Ambessa#Public_Execution) or [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Nocturne', 'w', 0))}Nocturne W passive](https://wiki.leagueoflegends.com/en-us/Nocturne#Shroud_of_Darkness) and [rune paths](https://wiki.leagueoflegends.com/en-us/Rune#Rune_paths) <span class="error-margin">are not implemented</span> <i>(yet)</i>. See the [champion/item/rune setup](/guide#test-setup) recommended for verifying the calculations yourself.`,
);
</script>

<template>
	<main id="about">
		<h1>about</h1>

		<p>For instructions on how to use it, check the <NuxtLink to="/guide">guide page</NuxtLink></p>

		<nav>
			<h2>contents</h2>
			<ul>
				<li><NuxtLink to="#what-is-it">what is it?</NuxtLink></li>
				<li><NuxtLink to="#does-it-work">does it work?</NuxtLink></li>
				<li><NuxtLink to="#known-discrepancies">known calculation discrepancies</NuxtLink></li>
				<li><NuxtLink to="#implemented-champions">fully implemented champions</NuxtLink></li>
				<li><NuxtLink to="#support">support</NuxtLink></li>
				<li><NuxtLink to="#roadmap">roadmap</NuxtLink></li>
				<li><NuxtLink to="#acknowledgements">acknowledgements</NuxtLink></li>
				<li><NuxtLink to="#misc">misc</NuxtLink></li>
				<li><NuxtLink to="#privacy-policy">privacy policy</NuxtLink></li>
			</ul>
		</nav>

		<TextPageHeading id="what-is-it" text="what is it?" />
		<p>
			<strong>lolcalc</strong> is intended to be a tool for <NuxtLink to="https://www.leagueoflegends.com/" target="_blank">League of Legends</NuxtLink> that shows the same numbers the game does. The currently aimed for numbers are items,
			runes, champion abilities and their + some other common effects/buffs/debuffs, for any combination of them.
		</p>
		<p><u>It's not a game simulation</u> and there is currently no timeline for implementing one. Something like the damage of a <span class="code-like">Q + W + aa + aa + E + R</span> combo is currently out of the scope of this project.</p>
		<p><u>The main goal is build comparison</u>. <strong>lolcalc</strong> should, fairly accurately, show the difference between the damage and stats of various champion builds, making it easier to find the best one.</p>

		<TextPageHeading id="does-it-work" text="does it work?" />
		<p>
			While it's impossible for me to check all 172+ champions with every item/rune/dragon/quest/buff/debuff combination, I tried my best to make it work and
			<NuxtLink to="/guide#example-configurations">here are some examples of it</NuxtLink>. If you encounter a configuration that's not calculated correctly (<NuxtLink to="#known-discrepancies">known discrepancies</NuxtLink>), please
			<button class="link-like" @click="reportAnIssue">report it</button>
		</p>
		<p class="alert info">
			For now only champion <u>passives</u> (not QWER), items, and rune <u>shards</u> (not paths) calculate properly.
			<Icon class="i-ph:info" />
		</p>
		<p class="game-description" v-html="nonPassiveAbilitiesDisclaimer" />
		<p>For when these and other features will be implemented, check <NuxtLink to="#roadmap">the roadmap</NuxtLink>.</p>

		<TextPageHeading id="known-discrepancies" text="known calculation discrepancies" />
		<ul>
			<li class="game-description" v-html="discrepancyMaxHealthMana" />
			<li class="game-description" v-html="discrepancyAttackRangeRfc" />
			<li class="game-description" v-html="discrepancyBloodmailRetribution" />
		</ul>

		<TextPageHeading id="implemented-champions" :text="`implemented champions (${IMPLEMENTED_CHAMPION_IDS.length}/${Object.keys(CHAMPIONS).length - 1})`" />
		<p>
			These champions have been fully implemented so far. All of their abilities' passives are expected to calculate correctly and their variables in the <i>results table</i> should factor in things like target resists or item passives.
		</p>
		<ul id="implemented-champion-list" v-once>
			<li v-for="championId in IMPLEMENTED_CHAMPION_IDS" :key="championId" :title="CHAMPIONS[championId].name">
				{{ CHAMPIONS[championId].name }}
				<img :src="championImage(CHAMPIONS[championId].image, championId)" alt="" :width="championImageSize(championId)" :height="championImageSize(championId)" aria-hidden="true" />
			</li>
		</ul>

		<TextPageHeading id="support" text="support" />
		<p>
			The best way to support the project is to give me money, which you can do through X, Y or Z. I'd love to be able to work on it full time and I'm thankful for any support. I'm also open to any League/programming related job offers and
			would appreciate recommendations.
		</p>
		<p>
			The second best way is to contribute to the codebase, which you can start with by reading the
			<NuxtLink to="https://github.com/asasinmode/lolcalc/tree/feat/v2?tab=contributing-ov-file" target="_blank">CONTRIBUTING</NuxtLink>
			and <NuxtLink to="https://github.com/asasinmode/lolcalc/" target="_blank">README</NuxtLink> files.
		</p>
		<p>If you have any questions, feel free to contact me through the platforms listed at the bottom of this page.</p>

		<TextPageHeading id="roadmap" text="roadmap" />
		<p>
			Below is the list of <i>a few</i> things that are currently being worked on/will be worked on the soonest. For full list of planned features and ideas, see the
			<NuxtLink to="https://github.com/asasinmode/lolcalc/blob/ROADMAP.md" target="_blank">ROADMAP</NuxtLink> on the project's github page
		</p>
		<ul>
			<li>all champion abilities - their passives, effects, calculating their cooldowns, cleaning up their results <i>(also the target for version 1.0, end of beta)</i></li>
			<li>keyboard navigation improvements</li>
			<li>better screen reader experience</li>
		</ul>

		<TextPageHeading id="acknowledgements" text="acknowledgements" />
		<p>
			This project would not exist without
			<NuxtLink to="https://communitydragon.org/" target="_blank">Community Dragon</NuxtLink> and I want to thank its contributors, as well as people on their discord server that helped me during the development.
		</p>
		<p>Thanks to my homies who helped me test the website and verify the results in game.</p>
		<p>Thanks to Riot Games for not chronobreaking this project (🤞) and for their policy that allowed me to make it. <i>Please add setting your dragon soul in practice tool</i></p>
		<p>
			All of the text that's not from the game itself is written by me. Some of the <u>code</u> in this project was written using LLMs, as well as I have used them in debugging/coming up with solutions. It would've taken me a few more
			months to get to where it is without them. The ability to paste into one the stats/variables and have it guess formulas for what Riot is doing under the hood was very helpful.<br />
			Additionally, up to and including November of 2026 (11 months of work), I used only what's available for free. You are welcome to check the
			<NuxtLink to="https://github.com/asasinmode/lolcalc" target="_blank">project's github repository</NuxtLink> and the commits to judge for yourself if it's slop. I'm open to most improvement suggestions to reduce said slop.
		</p>

		<TextPageHeading id="misc" text="misc" />
		<dl>
			<dt>league new dawn (next)</dt>
			<dd>
				As of writing this (<time datetime="2026-11-15">11.15.2026</time>), a <NuxtLink to="https://youtu.be/vs3p3mNhRXo?si=7V1_qM-P3ocWsVYF" target="_blank">teaser for League of Legends: New Dawn</NuxtLink>. From the looks of it, a lot of
				systems will be updated/reworked. As details of what exactly is being changed come out, I will update <NuxtLink to="#roadmap">the roadmap</NuxtLink> to say which, and in what ways, parts of <strong>lolcalc</strong> are affected.
				Personally, man that's a lot of work
			</dd>
			<dt>alpha/beta/release versions</dt>
			<dd>
				The current <span class="code-like">alpha</span> version will end when the <strong>stats</strong> and <strong>basic attack damage</strong> of all champions and their <u>passives</u> (not QWER) are calculated properly with any
				items/rune shards/dragons/role quests and their effects combination. For more details, check
				<NuxtLink to="#roadmap">the roadmap</NuxtLink>
			</dd>
			<dt>ads and paywalling</dt>
			<dd>
				I will try my best to keep the calculator and all of its features free (+ it's
				<NuxtLink to="https://github.com/asasinmode/lolcalc" target="_blank">open source</NuxtLink>). That said, hosting costs money and maintaining it takes a lot of my time and effort. Please consider
				<NuxtLink to="#support">supporting the project</NuxtLink>
			</dd>
			<dt>discord? telegram? whatsapp group chat?</dt>
			<dd>
				These and other chat platforms are cool but anything discussed there doesn't show up when I google it. If you think other people might find whatever you want to discuss/need help with useful, open a
				<NuxtLink to="https://github.com/asasinmode/lolcalc/discussions" target="_blank">discussion on the project's github page</NuxtLink>. You can message me directly as well, contact info at the bottom of the page.
			</dd>
		</dl>

		<TextPageHeading id="privacy-policy" text="privacy policy" />
		<p>
			<strong>lolcalc</strong> doesn't collect or store any personal data. Your configuration is stored in the browser's local storage and never leaves your device. Configurations can be shared with a link generated by the
			<b>"share"</b> button. If you report an issue, its: title, category, message, your contact information (optional, <span>will be publicly visible</span>), current configuration link (optional) and the <strong>lolcalc</strong> version
			you are using; will be sent to the <NuxtLink to="https://github.com/asasinmode/lolcalc" target="_blank">project's Github repository</NuxtLink> and are subject to
			<NuxtLink to="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" target="_blank">Github's TOS</NuxtLink>.
		</p>
	</main>
</template>

<style>
@layer page {
	#about,
	#guide {
		--at-apply: 'grid grid-cols-[1fr_minmax(0,calc(216*var(--spacing)))_1fr] auto-rows-auto text-lg leading-8 mx-auto pbs-[--fluid-12-32] mbe-[--fluid-28-60] text-neutral-200';

		> * {
			--at-apply: 'col-start-2 col-span-1';
		}

		> h1 {
			--at-apply: 'text-[length:--fluid-24-32] font-700 mbe-[0.75em] text-center text-white';
		}

		> nav {
			--at-apply: 'b b-neutral-800 max-inline-80 px-3 py-2 bg-slate-950 block-max';

			> h2 {
				--at-apply: 'font-600 text-neutral-100 tracking-wide text-xl mbe-1';
			}

			> ul {
				--at-apply: 'ps-3 ms-2 b-s b-neutral-700 list-none';
			}
		}

		i {
			--at-apply: 'text-neutral-400';
		}

		@media (width >= 1504px) {
			> nav {
				--at-apply: 'col-start-3 sticky inset-bs-[--fluid-12-32] row-start-1 -mbe-[calc(100%+var(--fluid-12-32))]';
				translate: calc(2 * var(--size-page-px)) 0px;
			}
		}

		> h2 {
			--at-apply: 'text-[length:--fluid-22-28] font-700 mbs-[--fluid-22-48] mbe-[0.5em] text-white relative scroll-m-bs-5 inline-fit';

			> a {
				--at-apply: 'op-0 inline-block ps-1 pe-2';

				> span:last-child {
					--at-apply: 'sr-only';
				}
			}

			@media (width >= 920px) {
				&::before {
					--at-apply: 'absolute -inset-y-0.25 -inset-s-0 translate-y-0.5 -translate-x-full op-0 z-0 px-1 block';
					content: '#';
				}

				> a {
					--at-apply: 'absolute -inset-s-0 inset-bs-0.5 -translate-x-full z-1';
				}
			}
		}

		> h2 > a:focus-visible,
		> h2:hover > a {
			--at-apply: 'op-100';
		}

		.code-like {
			--at-apply: 'font-mono text-white bg-slate-900 px-1 py-0.5 -mx-0.5 -my-0.5 rounded-sm';
		}

		ul {
			--at-apply: 'list-disc';
		}

		ol {
			--at-apply: 'list-decimal';
		}

		ol,
		ul:not(nav > ul) {
			> li {
				--at-apply: 'ms-5';
			}

			> li + li {
				--at-apply: 'mbs-[0.5em]';
			}
		}

		p + ul,
		p + ol {
			--at-apply: 'mbs-[1em]';
		}

		p + p,
		ul + p,
		ol + p {
			--at-apply: 'mbs-[1em]';
		}

		> h2 + p {
			--at-apply: 'mbs-0';
		}

		a,
		.link-like {
			--at-apply: 'text-blue-400';

			&:not(h2 > a):hover {
				--at-apply: 'underline';
			}
		}

		> dl > dt,
		> details > summary {
			--at-apply: 'text-[length:--fluid-19-22] font-600 text-white';
		}

		> dl {
			> dt {
				--at-apply: 'mbs-[1em] mbe-[0.33em]';
			}

			dl {
				> dt {
					--at-apply: 'text-[length:--fluid-15-18] font-600 text-white mbs-[1em] mbe-[0.25em]';
				}
			}
		}

		> h2 + dl > dt:first-child {
			--at-apply: 'mbs-0';
		}

		> details {
			> summary {
				--at-apply: 'mbs-[--fluid-10-22]';
			}

			&[open] > summary {
				--at-apply: 'mbe-[0.33em]';
			}
		}

		#privacy-policy + p > span {
			--at-apply: 'text-red-600';
		}

		.alert {
			--at-apply: 'mx-auto';
		}

		.error-margin {
			--at-apply: 'underline decoration-2 decoration-red-600';
		}

		.tmp-image {
			--at-apply: 'bg-rose-900 rounded-lg block-12 mx-auto mbs-3 grid place-items-center';

			&::before {
				--at-apply: 'font-600 text-neutral-950 uppercase text-sm';
				content: 'todo image';
			}
		}
	}

	.hash-target {
		--hash-target-opacity: 0%;
		outline: 0.2em solid color-mix(in srgb, var(--ui-btn-border-clr) var(--hash-target-opacity), transparent);
		outline-offset: 0.15em;
		animation: hash-target-highlight-blink 1s ease-in 2;

		@media (prefers-reduced-motion: no-preference) {
			/* this animation is the same one [Adrian Roselli](https://adrianroselli.com/), as of 19.11.2026, has for his links. His blog is awesome, I recommend checking it out */
			animation-name: hash-target-highlight-grow;
			animation-timing-function: ease-out;
		}
	}

	@property --hash-target-opacity {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 0%;
	}

	@keyframes hash-target-highlight-blink {
		0% {
			--hash-target-opacity: 0%;
		}
		100% {
			--hash-target-opacity: 100%;
		}
	}

	@keyframes hash-target-highlight-grow {
		from {
			--hash-target-opacity: 100%;
			outline-width: 0.1em;
			outline-offset: 0;
		}

		to {
			--hash-target-opacity: 0%;
			outline-width: 0.75em;
			outline-offset: 1em;
		}
	}
}

@layer overrides {
	#about,
	#guide {
		.game-description {
			--at-apply: 'text-neutral-200';
		}

		.game-description {
			img:is([title], [aria-hidden]) {
				--at-apply: 'inline-block size-5 me-[0.5ch] -translate-y-px';
			}

			.code-like img:is([title], [aria-hidden]) {
				--at-apply: 'me-0';
			}
		}
	}

	#implemented-champion-list {
		--at-apply: 'flex flex-wrap';

		> li {
			/* not sure why the 1 px less than min supported viewport width (320px) is necessary to make 7 items fit on it */
			--at-apply: 'block m-0 size-[calc((319px-2*var(--size-page-px))/7)] tracking-[0] text-[length:0px] leading-[0] text-transparent';

			> img {
				--at-apply: 'size-full';
			}
		}
	}
}
</style>
