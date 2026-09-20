<script setup lang="ts">
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { simpleFormattingGameAbilityImage } from '@lolcalc/core/misc';
import { STAT_ICON } from '@lolcalc/data/index';
import { AbilityType, ITEM_NAME_TO_ID } from '@lolcalc/shared/index';

const { reportAnIssue } = useReportIssueDialog();

const discrepancyMaxHealthMana = useSimpleDescription('about-discrepancy-1', `Max <scalehealth>%i:${STAT_ICON.hp}%health</scalehealth> and <scalemana>%i:${STAT_ICON.mana}%mana</scalemana>/<scaleenergy>ability resource</scaleenergy> have a <span class="error-margin">margin of error of <strong>1</strong></span>. Most of the differences should be coming from floating point arithmetic and the in game ui rounding the displayed <scalehealth>hp</scalehealth> up and <scalemana>mana</scalemana> down. This means that the game displays something like <span class="code-like">2773.0000001</span> as <span class="code-like">2774</span>, even though it's effectively <span class="code-like">2773</span> ([example config](#TODO)).`);
const discrepancyAttackRangeRfc = useSimpleDescription('about-discrepancy-2', `%i:${STAT_ICON.attackRange}%Attack range with [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.rfc))}Rapid Firecannon's](https://wiki.leagueoflegends.com/en-us/Rapid_Firecannon) passive active has a <span class="error-margin">margin of error of <strong>1</strong></span>. I don't know why ([config with chogath with R 6 stacks/rakan from test](#TODO)).`);
const discrepancyBloodmailRetribution = useSimpleDescription('about-discrepancy-3', `<scalead>%i:${STAT_ICON.attackDamage}%Attack damage</scalead> with [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.overlordsBloodmail))}Overlord's Bloodmail's](https://wiki.leagueoflegends.com/en-us/Overlord's_Bloodmail) [Retribution](https://wiki.leagueoflegends.com/en-us/Named_item_effect#Retribution) passive can be slightly off for high <scalehealth>max hp</scalehealth> values, or might be difficult to exactly verify with the game, since it calculates it &quot;on top&quot; of other stat calculations (as if it was an external effect). For example, if in game you see a champion with <scalehealth>300 %i:${STAT_ICON.hp}%hp</scalehealth>, in that exact moment you are looking at their stats, their displayed <scalead>ad</scalead> might be lagging behind and showing the value for <scalehealth>299 %i:${STAT_ICON.hp}%hp</scalehealth> that was just there, before it regenerated. Because of this, when [Retribution](https://wiki.leagueoflegends.com/en-us/Named_item_effect#Retribution) is a factor, <scalead>%i:${STAT_ICON.attackDamage}%attack damage's</scalead> <span class="error-margin">margin of error is <strong>1</strong> within <strong>+/-0.5%</strong></span> <scalehealth>%i:${STAT_ICON.hp}%current health</scalehealth> (check if <scalead>ad</scalead> is correct within +/-0.5% <scalehealth>hp</scalehealth>).`);

const nonPassiveAbilitiesDisclaimer = useSimpleDescription('about-non-passive-abilities-disclaimer', `Non-passive abilities (like [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Ambessa', 'r', 0))}Ambessa R passive](https://wiki.leagueoflegends.com/en-us/Ambessa#Public_Execution) or [${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Nocturne', 'w', 0))}Nocturne W passive](https://wiki.leagueoflegends.com/en-us/Nocturne#Shroud_of_Darkness) and [rune paths](https://wiki.leagueoflegends.com/en-us/Rune#Rune_paths) <span class="error-margin">are not implemented</span> <i>(yet)</i>. See the [champion/item/rune setup](/guide#test-setup) recommended for verifying the calculations yourself.`);
</script>

<template>
	<main id="about">
		<h1>about</h1>

		<p>
			For instructions on how to use it, check the <NuxtLink to="/guide">
				guide page
			</NuxtLink>
		</p>

		<h2 id="what-is-it">
			what is it?
			<a href="#what-is-it"><span aria-hidden="true">#</span><span>link to the "what is it?" section</span></a>
		</h2>
		<p>
			<strong>lolcalc</strong> is intended to be a fully fledged, all-included <a href="https://www.leagueoflegends.com/" target="_blank">League of Legends</a> damage calculator (WIP). The goal is to show the same stats and damage numbers the game does for any champion/item/rune/buff/debuff combination.
		</p>

		<h2 id="does-it-work">
			does it work?
			<a href="#does-it-work"><span aria-hidden="true">#</span><span>link to the "does it work?" section</span></a>
		</h2>
		<p>
			While it's impossible for me to check all 172+ champions with every item/rune/dragon/quest/buff/debuff combination, I tried my best to make it work and <NuxtLink to="/guide#guide-examples"> here are some examples of it </NuxtLink>. If you encounter a configuration that's not calculated correctly (<a href="#known-discrepancies">known discrepancies</a>), please <button class="link-like" @click="reportAnIssue">report it</button>
		</p>
		<p class="alert info">
			For now only champion <u>passives</u> (not QWER), items, and rune <u>shards</u> (not paths) calculate properly.
			<Icon class="i-ph:info" />
		</p>
		<p class="game-description" v-html="nonPassiveAbilitiesDisclaimer" />
		<p>For when these and other features will be implemented, check <a href="#TODO">the roadmap</a>.</p>

		<h2 id="known-discrepancies">
			currently known calculation discrepancies
			<a href="#known-discrepancies"><span aria-hidden="true">#</span><span>link to the "known discrepancies" section</span></a>
		</h2>
		<ul>
			<li class="game-description" v-html="discrepancyMaxHealthMana" />
			<li class="game-description" v-html="discrepancyAttackRangeRfc" />
			<li class="game-description" v-html="discrepancyBloodmailRetribution" />
		</ul>

		<h2 id="support">
			support
			<a href="#support"><span aria-hidden="true">#</span><span>link to the "support" section</span></a>
		</h2>
		<p>TODO</p>

		<h2 id="acknowledgements">
			acknowledgements
			<a href="#acknowledgements"><span aria-hidden="true">#</span><span>link to the "acknowledgements" section</span></a>
		</h2>
		<p>This project would not exist without <a href="https://communitydragon.org/" target="_blank">Community Dragon</a> and I want to thank its contributors, as well as people on their discord server that helped me during the development.</p>
		<p>Some of the <strong>code</strong> in this project was written using LLMs. I'd estimate LLM generated code to be less than 10% of the code base, however I do want to say that it would've taken me a few more months to get to where it is without them. The ability to paste it the stats/variables and have it guess formulas for what Riot is doing under the hood was very helpful.</p>
		<p>Thanks to my homies who helped me test both the website and the various champion configurations in game.</p>
		<p>Thanks to Riot Games for not chronobreaking this project 🤞</p>

		<h2 id="misc">
			misc
			<a href="#misc"><span aria-hidden="true">#</span><span>link to the "misc" section</span></a>
		</h2>
		<dl>
			<dt>alpha/beta/release versions</dt>
			<dd>
				The current <strong>alpha</strong> version will end when the <strong>stats</strong> of all champions and their <u>passives</u> (not QWER) are calculated properly with any items/rune shards/dragons/role quests and their effects combination. For more details, check <a href="#TODO">the roadmap</a>
			</dd>
			<dt>ads and paywalling</dt>
			<dd>
				I will try my best to keep the calculator and all of its features free (+ it's <a href="https://github.com/asasinmode/lolcalc" target="_blank">open source</a>). That said, hosting costs money and maintaining it takes a lot of my time and effort. Please consider <a href="#support">supporting the project</a>
			</dd>
		</dl>
	</main>
</template>

<style>
@layer page {
	#about,
	#guide {
		--at-apply: 'text-lg leading-8 max-inline-216 mx-auto pbs-[--fluid-12-32] mbe-[--fluid-28-40] text-neutral-200';

		> h1 {
			--at-apply: 'text-[length:--fluid-24-32] font-700 mbe-[0.75em] text-center text-white';
		}

		> h2 {
			--at-apply: 'text-[length:--fluid-22-28] font-700 mbs-[1em] mbe-[0.5em] text-white relative scroll-m-bs-5';

			> a {
				--at-apply: 'op-0 inline-block px-1';

				> span:last-child {
					--at-apply: 'sr-only';
				}
			}

			@media (width >= 920px) {
				&::before {
					--at-apply: 'absolute -inset-y-0.25 inset-s-0 translate-y-0.5 -translate-x-full op-0 z-0 px-1 block';
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

		> ul {
			--at-apply: 'list-disc';

			> li {
				--at-apply: 'ms-5 my-[0.5em]';
			}
		}

		> p {
			--at-apply: 'my-[1em]';
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

		.alert {
			--at-apply: 'my-6';
		}

		.error-margin {
			--at-apply: 'underline decoration-2 decoration-red-600';
		}
	}
}

@layer overrides {
	#about,
	#guide {
		img {
			--at-apply: 'inline-block size-5 me-[0.5ch] -translate-y-px';
		}

		.game-description {
			--at-apply: 'text-neutral-200';
		}
	}
}
</style>
