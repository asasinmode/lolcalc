<script setup lang="ts">
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { gameAbilityImgAttrs } from '@lolcalc/core/misc';
import { AbilityType } from '@lolcalc/shared/index';

const { reportAnIssue } = useReportIssueDialog();

const ambessaRImg = await gameAbilityImgAttrs(GameAbilityId.build(AbilityType.champion, 'Ambessa', 'r', 0));
const nocturneWImg = await gameAbilityImgAttrs(GameAbilityId.build(AbilityType.champion, 'Nocturne', 'w', 0));
</script>

<template>
	<main id="about">
		<h1>about</h1>

		<p>
			For instructions on how to use it, visit the <NuxtLink to="/guide">
				guide page
			</NuxtLink>
		</p>

		<h2>what is it?</h2>
		<p>
			<strong>lolcalc</strong> is intended to be a fully fledged, all-included <a href="https://www.leagueoflegends.com/" target="_blank">League of Legends</a> damage calculator (WIP at the moment). You should be able to choose any champion/item/rune combination and see the same* numbers you will find in game. See the "<a href="#does-it-work">does it work?</a>" section for examples.
		</p>
		<p>*with known discrepancies being</p>
		<ul>
			<li>
				max health and mana/ability resource have a margin of error of <strong>1</strong>. Most of the differences should be coming from floating point arithmetic and the in game ui rounding the displayed value up. This means that the game displays something like <span class="code-like">2773.0000001</span> as <span class="code-like">2774</span>, even though it's effectively <span class="code-like">2773</span> (<a href="#TODO">example config</a>)
			</li>
		</ul>

		<h2 id="does-it-work">
			does it work?
		</h2>
		<p>
			while it's impossible for me to check all 172+ champions with every item combination, I tried my best to make it work and <NuxtLink to="/guide#guide-examples">
				here are some examples
			</NuxtLink> of it working. If you encounter a configuration that's not correctly calculated, please <button class="link-like" @click="reportAnIssue">
				report it
			</button>
		</p>
		<p class="alert info">
			for now only champions, their passives, items (with passives), and rune shards are expected to calculate properly!
			TODO icon
		</p>
		<p>
			non-passive abilities (like <a href="https://wiki.leagueoflegends.com/en-us/Ambessa#Public_Execution" target="_blank"><img v-bind="ambessaRImg" alt="Ambessa R icon"> Ambessa R passive</a> or <a href="https://wiki.leagueoflegends.com/en-us/Nocturne#Shroud_of_Darkness" target="_blank"><img v-bind="nocturneWImg" alt="Nocturne W icon"> Nocturne W passive</a>) and <a href="https://wiki.leagueoflegends.com/en-us/Rune#Rune_paths" target="_blank">rune paths</a> <strong>are not implemented</strong> <i>(yet)</i> in the calculations. See the <NuxtLink to="/guide#test-setup">champion/item/rune setup</NuxtLink> recommended for verifying the calculations yourself
		</p>
		<p>for when these and other features will be implemented, see the <a href="#TODO">roadmap</a></p>
		<p>
			To verify the calculator results in game, make sure there isn't anything the calculator doesn't implement yet. The following rune page is recommended because it doesn't have any runes impacting stats/damage.
		</p>
		<p>TODO image</p>
	</main>
</template>

<style>
@layer components {
	#about {
		--at-apply: 'text-lg';

		.code-like {
			--at-apply: 'font-mono bg-slate-900 px-1 py-0.5 -mx-0.5 -my-0.5 rounded-sm';
		}

		a,
		.link-like {
			--at-apply: 'text-blue-400';

			&:hover {
				--at-apply: 'underline';
			}
		}

		img {
			--at-apply: 'inline-block size-5 -translate-y-px';
		}
	}
}
</style>
