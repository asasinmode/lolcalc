<script setup lang="ts">
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { linkedFormattedItemImage, linkedFormattedChampionImage, simpleFormattingGameAbilityImage } from '@lolcalc/core/misc';
import { STAT_ICON } from '@lolcalc/data/index';
import { AbilityType } from '@lolcalc/shared/index';
import { resetTutorialStep } from '~/utils/tutorial';

useHashTargetHighlighting();

function resetTutorial(event: MouseEvent) {
	const button = event.currentTarget as HTMLElement;
	if (button.hasAttribute('data-clicked')) {
		button.removeAttribute('data-clicked');
	} else {
		button.setAttribute('data-clicked', '');
		button.addEventListener('mouseleave', clearResetTutorialButton);
		button.addEventListener('blur', clearResetTutorialButton);
		resetTutorialStep('all');
	}
}

function clearResetTutorialButton(event: Event) {
	const button = event.currentTarget as HTMLElement;
	button.removeEventListener('mouseleave', clearResetTutorialButton);
	button.removeEventListener('blur', clearResetTutorialButton);
	button.removeAttribute('data-clicked');
}

const guideDefinitionConfigElSource = useSimpleDescription(
	'guide-definition-config-el-source',
	`Some effects support configuring their source. For example, ${linkedFormattedChampionImage('Ashe', "Ashe's")} passive effect - ${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Ashe', 'passive', 0))}<b>Frost Shot</b> scales with her level. You can select an Ashe you've configured and the effect will be applied as if it was from her (using her configured level).`,
);
const guideDefinitionConfigElSnapshot = useSimpleDescription(
	'guide-definition-config-el-snapshow',
	`Other effects scale with a value that <strong>lolcalc</strong> cannot deterministically calculate. They allow you to snapshot what they scale off of and <u>must be manually refreshed</u> when its <i>source</i> changes. For example, ${linkedFormattedChampionImage('Nami', "Nami's")} passive effect - ${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Nami', 'passive', 0))}<b>Surging Tides</b> scales with her <scaleap>ability power %i:${STAT_ICON.abilityPower}%</scaleap>. When the effect's <i>source</i> is selected, its current <scaleap>AP</scaleap> will be saved and the effect will be calculated using it. If at any point the <scaleap>AP</scaleap> changes, it must be manually refreshed using the rotating arrow button in the top right corner. Hovering (or long pressing when using a touch device) the buttons shows the underlying values currently used by the effect.`,
);

const tutorialApplyEffectSelectEffect = useSimpleDescription(
	'tutorial-apply-effect-select-effect',
	`Either search for or find ${linkedFormattedItemImage('frozenHeart', "Frozen Heart's")} passive effect - <b>Winter's Caress</b>. Check to apply it, then find ${linkedFormattedItemImage('blackCleaver', "Black Cleaver's")} <b>Carve</b> and set a non-0 number of stacks. Close the dialog and the applied effects' icons will appear above the stats panel.`,
);
const tutorialApplyEffectChampionModified = useSimpleDescription(
	'tutorial-apply-effect-champion-modified',
	`At this point, the champion's modified <attackspeed>%i:${STAT_ICON.attackSpeed}%attack speed</attackspeed> and <scalearmor>%i:${STAT_ICON.armor}%armor</scalearmor> should already be visible. If you're not sure, toggle the effects on and off or adjust their strength (like number of <b>Carve</b> stacks) and watch for changes. You could also make a copy of the champion you are working with without any effects and put it on the other side of the <i>scoreboard</i> for easier comparison. `,
);
const tutorialExternalEffectExtraExample = useSimpleDescription(
	'guide-tutorial-external-effect-extra-example',
	`For example, if you give a champion ${linkedFormattedChampionImage('Ornn', "Ornn's")} passive effect - ${simpleFormattingGameAbilityImage(GameAbilityId.build(AbilityType.champion, 'Ornn', 'passive', 0))}<b>Masterwork item slot</b> and set the value to <span class="code-like">1</span>, but then make the champion ${linkedFormattedChampionImage('Ornn')} themselves, changing the slot on his dedicated <i>config element</i> will override the one set from the external effect. If the result values don't look right, make sure no unwanted effect is being applied.`,
);
const tutorialBasicAttackDoubleCounting = useSimpleDescription(
	'guide-tutorial-basic-attack-double-counting',
	`Adding basic attack rows to <i>custom total</i> section (with the checkbox on the left) should be done carefully. The values shown here already include some of the variables you could independently sum. For example, if you add to <i>custom total</i> ${linkedFormattedItemImage('witsEnd', "Wit's End's")} <span class="code-like">OnHitDamage</span> and <i>basic attack total</i>, the <b>Wit's End's</b> damage would be double counted.`,
);

const exampleSpellCrit = useSimpleDescription(
	'guide-example-shadowflame-ie-randuin',
	`showcasing the interaction between ${linkedFormattedItemImage('shadowflame')}, ${linkedFormattedItemImage('infinityEdge')} and ${linkedFormattedItemImage('randuinsOmen')}`,
);
const example2026WorldsAkali = useSimpleDescription(
	'guide-example-2026-worlds-akali',
	`during his costream, LS asked which 4th item would deal more damage on Akali - ${linkedFormattedItemImage('voidStaff')} (which Chovy chose) or ${linkedFormattedItemImage('rabadon')}. The configuration has champion builds from this moment of the game and 2 ${linkedFormattedChampionImage('Akali')} builds for comparison. <a href="https://youtu.be/TfdHzkOyQ7w?t=25001" target="_blank">VOD</a>, <a href="https://gol.gg/game/stats/83725/page-game/" target="_blank">game's gol.gg</a>. <rules>Neither runes nor dragons are set, but none of them should be impactful (no Mountain/Conditioning was in the game)</rules>`,
);

const qaItemsScalingWithLevels = useSimpleDescription(
	'guide-qa-items-scaling-with-levels',
	`Some items, like ${linkedFormattedItemImage('solariLocket')}, ${linkedFormattedItemImage('immortalShieldbow')} or ${linkedFormattedItemImage('redemption')}, in their description show their current value and the min/max it goes to depending on the champion level. As of patch 26.17, all of them have been tested to scale up to level 20 (that can be reached with the top lane role quest). If you see something like <span class="code-like">Restore <healing>374 = (<scalelevel>150 - 350</scalelevel>) (ally %i:${STAT_ICON.level}%) Health</healing></span>, while it looks weird, it's normal.`,
);

const applyExternalEffectsStepConfigs = {
	sourceWithEffects: '/?v=1&src=31_1__0___644_270_0000_00000___0___15*1l21*2_',
	targetForComparison: '/?v=1&src=31_1__0___644_270_0000_00000___0___15*1l21*2_&tgt=31_1__0___644_270_0000_00000___0____',
};

const applyXOnTargetStepConfigs = {
	serpentSource: '/?v=1&src=799_1_6695_0___650_0_0000_00000____sVenom-1___',
	configuredTarget: '/?v=1&src=799_1_6695_0___630_200_0000_00000___0_sVenom-1___&tgt=_1_3110-3053_0___400_400_0000_00000____wCaress-1___',
	configuredColumns: '/?v=1&src=799_1_6695_0___630_200_0000_00000___0_sVenom-1___&tgt=_1_3110-3053_0___400_400_0000_00000____wCaress-1___&tblCol=0-0&tblCol=-0',
	addedSterakSection: '/?v=1&src=799_1_6695_0___630_200_0000_00000___0_sVenom-1___&tgt=_1_3110-3053_0___400_400_0000_00000____wCaress-1___&tblCol=0-0&tblCol=-0&tblSct=1-3053_1',
	resultsFlipped: '/?v=1&src=799_1_6695_0___630_200_0000_00000___0_sVenom-1___&tgt=_1_3110-3053_0___400_400_0000_00000____wCaress-1___&flpTbl=&tblCol=0-0&tblCol=-0&tblSct=1-3053_1',
	sourceStatsAttackSpeed: '/?v=1&src=799_1_6695_0___630_200_0000_00000___0_sVenom-1___&tgt=_1_3110-3053_0___400_400_0000_00000____wCaress-1___&tblCol=0-0&tblCol=-0&tblSct=a-stats_1',
};
</script>

<template>
	<main id="guide">
		<h1>guide</h1>
		<p>
			Instructions on how to use it, for info about what it is, check the <a href="/about">about page</a>. Also I recommend using <strong>lolcalc</strong> on PC. I tried to make it usable on small screens but it's really hard to fit
			everything
		</p>

		<nav>
			<h2>contents</h2>
			<ul>
				<li><NuxtLink to="#qol-tips">qol tips</NuxtLink></li>
				<li><NuxtLink to="#ui-guide">UI guide</NuxtLink></li>
				<li><NuxtLink to="#tutorials">tutorials</NuxtLink></li>
				<li><NuxtLink to="#example-configurations">example configurations</NuxtLink></li>
				<li><NuxtLink to="#q-a">q&a</NuxtLink></li>
			</ul>
		</nav>

		<TextPageHeading id="qol-tips" text="qol tips" />
		<ul>
			<li>pin a tooltip by pressing [<kbd>K</kbd>] when it's visible</li>
			<li><i>scoreboard items</i> can be expanded/collapsed by double clicking the background. The same works for <i>result sections</i> but you need to click on their header row</li>
			<li>
				in/decrement an effect's value from scoreboard by left/right clicking its icon. Holding [<kbd>Ctrl</kbd>] while doing so changes the value by 10 (when possible). Note that the text that's displayed on some effect icons might not
				always update 1:1 with the value
			</li>
			<li>drag <i>scoreboard items</i> by their champion images or manipulate buttons (the arrows for moving it)</li>
			<li>items can be dragged between <i>damage sources</i></li>
			<li>hold alt while dragging an item or a <i>scoreboard item</i> to duplicate it when dropped</li>
			<li>right click an item, dragon stack/soul, role quest or ability levels to clear them</li>
		</ul>

		<TextPageHeading id="ui-guide" text="UI guide" />
		<p>
			List and short description of the <strong>lolcalc</strong> UI elements. Throughout the website, they will be referred to by the names used here. The next section, <b>tutorials</b>, has more hands-on guides that showcase their usage.
		</p>
		<dl>
			<dt>configuration scoreboard</dt>
			<dd>
				The first section of the calculator where you can configure <i>damage sources</i> and <i>damage targets</i>. If you want to change something, do it here. The <i>results</i> (described below) should be thought of as
				<b>"view only"</b> - no changes to champions can be made in them.
				<div class="tmp-image" />
			</dd>
			<dt>scoreboard item (damage source/target)</dt>
			<dd>
				The elements inside the <i>scoreboard</i>. They have everything pertaining to a champion - their level, abilities, items, runes, active effects, dragons and role quest. A whole of champion and everything they can have configured
				might be referred to as a <i>source</i>. <i>Note that the layout shifts considerably on small screens to fit everything</i>
				<div class="tmp-image" />
			</dd>
			<dt id="config-element">config element</dt>
			<dd>
				<p>
					These appear both in <i>scoreboard items</i> and the <i>effects dialog</i>. If an ability, item or an effect can be configured (and is implemented, beware that most champion abilities are not as of now), a dedicated
					<i>config element</i> will appear at the bottom of a <i>scoreboard item</i>. These could be grouped into 2 categories. Ones that directly affect the <i>source</i> they are on, and ones that affect the <i>target</i> the source will
					be hitting. For the latter, the effects will be visible in the <i>results</i>. Read the <NuxtLink to="#apply-x-on-target">apply x on target</NuxtLink> tutorial for more details
				</p>
				<!-- image showcasing different kinds of config els -->
				<div class="tmp-image" />
				<p v-html="guideDefinitionConfigElSource" class="game-description" />
				<p v-html="guideDefinitionConfigElSnapshot" class="game-description" />
				<!-- image showcasing source config el + one with snapshot and the snapshot value tooltip -->
				<div class="tmp-image" />
			</dd>
			<dt>results table (results)</dt>
			<dd>
				The table found below the <i>configuration scoreboard</i> where you can see and compare most of the calculated values
				<div class="tmp-image" />
				<dl>
					<dt>results table column (results column)</dt>
					<dd>
						The <i>results table</i> lets you add any number of columns. Each one has a <i>damage source</i> and a <i>damage target</i>. The values in the columns are displayed for the respective column's <i>source</i> vs (hitting)
						<i>target</i>
					</dd>
					<dt>results table section (results section)</dt>
					<dd>
						In the table you can compare variables found in any number of things like <b>items</b>, <b>champion abilities</b>, <b>effects</b> and <b>runes</b> (coming soon). These can be added by selecting a section in the
						<i>new section select</i> and pressing the <b>"add"</b> button in the top left corner of the table
					</dd>
					<dt>flip target vs source (flip results)</dt>
					<dd>
						In the top left corner of the table there's a checkbox saying <b>"flip target vs source"</b>. It can be very useful, but might be a bit unintuitive. Make sure to read its tooltip and the
						<b><NuxtLink to="#apply-x-on-target">"apply X on target"</NuxtLink></b> guide that showcases using it.
					</dd>
				</dl>
			</dd>
			<dt>champ select, item shop, runes dialog</dt>
			<dd>All of these function roughly the same way their in-game counterparts do</dd>
			<dt id="effects-dialog">effects dialog</dt>
			<dd>
				All effects currently implemented in <strong>lolcalc</strong> can be applied in the <i>effects dialog</i>, opened with the <b>"effects"</b> button found next to the <i>stats panel</i>. Inside, you will find
				<i><NuxtLink to="#config-element">config elements</NuxtLink></i> of every effect. Effects that have been configured will be duplicated at the top of the dialog for quicker access
				<div class="tmp-image" />
			</dd>
		</dl>

		<TextPageHeading id="tutorials" text="tutorials" />
		<p>
			A few step by step guides to doing things in <strong>lolcalc</strong>. Additionally, you can use the "reset tutorial" button to do <i>you-won't-guess-what</i> (will take effect when you visit the <NuxtLink to="/">main page</NuxtLink>)
		</p>
		<button id="reset-tutorial" class="pretend-ui-btn remove" @click="resetTutorial" aria-live="polite">
			<span>reset tutorial</span>
			<span>reset done <Icon class="i-ph:check-bold" /></span>
		</button>
		<details>
			<summary id="apply-external-effect">applying external effects</summary>
			<ol>
				<li>Select a champion, then press the <b>"effects"</b> button to open the <i>effects dialog</i>.</li>
				<li>
					<span class="game-description" v-html="tutorialApplyEffectSelectEffect" /> <NuxtLink :to="applyExternalEffectsStepConfigs.sourceWithEffects" target="_blank">config</NuxtLink>
					<!-- configured effects in the effects dialog -->
					<div class="tmp-image" />
				</li>
				<li>
					<span class="game-description" v-html="tutorialApplyEffectChampionModified" />
					<NuxtLink :to="applyExternalEffectsStepConfigs.sourceWithEffects" target="_blank">config</NuxtLink>
					<p class="alert info">
						The effects can be quickly (but in limited manner) modified by clicking on their icons above the stat panel. Left click increments the effect's value, right click decrements it. Holding [<kbd>Ctrl</kbd>] while clicking changes
						the value by +/- 10 (if possible).
						<Icon class="i-ph:info" />
					</p>
				</li>
				<li>
					A few effects have their own <i>result sections</i>. If you scroll down to the <i>results table</i>, you should be able to find both <b>Winter's Caress</b> and <b>Carve</b> in the <i>new section select</i>. Add them to see how
					much of their corresponding stats they reduce on your configured champion.
					<!-- image of both effect values in results -->
					<div class="tmp-image" />
				</li>
			</ol>
			<p class="alert warning">
				An effect set with its dedicated <i>config element</i> will override that same effect applied through the <i>effects dialog</i>, if it's set to a non-empty value.
				<Icon class="i-ph:warning-light" />
			</p>
			<p v-html="tutorialExternalEffectExtraExample" class="game-description" />
			<!-- image showing ornn overriding its effect -->
			<div class="tmp-image" />
		</details>
		<details>
			<summary id="apply-x-on-target">"apply X on target" items or abilities and "flip results"</summary>
			<p>
				Some items, like <b>Serpent's Fang</b> can apply effects to every <i>target</i>. These effects are then applied to the values shown in the <i>results</i>. While the results allow you to toggle between displaying values for
				<i>source</i> or <i>target</i>, it's important to note that
			</p>
			<p class="alert info">
				<strong>applying an effect works only in one direction</strong>. Checking "apply to target" on a <i>scoreboard damage target</i> won't apply that effect onto the source, regardless of if the results are flipped
				<Icon class="i-ph:info" />
			</p>
			<p>For example, both <b>Serpent's Fang</b> and <b>Frozen Heart</b> allow for applying its effect to the target. If you were to:</p>
			<ol>
				<li>
					Configure a <i>damage source</i> with any champion and <b>Serpent's Fang</b>, then check the <b>"apply Serpent's Venom on target"</b>. <NuxtLink :to="applyXOnTargetStepConfigs.serpentSource" target="_blank">config</NuxtLink>
				</li>
				<li>
					Configure a <i>damage target</i> with <b>Frozen Heart</b> and <b>Sterak's Gage</b> (so we can see reduced shield value), then check its <b>"apply Winter's Caress on target"</b>.
					<NuxtLink :to="applyXOnTargetStepConfigs.configuredTarget" target="_blank">config</NuxtLink>
					<!-- image of both source and the target configured, maybe source in its own image in first step if hard to see -->
					<div class="tmp-image" />
				</li>
				<li>
					In the <i>results table</i>, make sure the <i>results table column</i> has the <i>source</i> set to the one with <b>Serpent's Fang</b> and the <i>target</i> set to the one with <b>Frozen Heart</b> and <b>Sterak's Gage</b>.
					Additionally, add a second column and set <u>only its target</u> to the same one the first column has. <NuxtLink :to="applyXOnTargetStepConfigs.configuredColumns" target="_blank">config</NuxtLink>
				</li>
				<li>
					<p>Use the <i>new section select</i> to add <b>Sterak's Gage</b>. <NuxtLink :to="applyXOnTargetStepConfigs.addedSterakSection" target="_blank">config</NuxtLink></p>
					<!-- results with 2 columns and sterak section -->
					<div class="tmp-image" />
					<p>
						While the <i>flip results</i> is <u>unchecked</u>, the <span class="code-like">ShieldSize</span> variable's value in the first column will be <span class="code-like">n/a</span>, as the results are being shown for the
						<i>damage source</i>, which only has <b>Serpent's Fang</b>. In the second column, the value will be <span class="code-like">-</span> as it has no <i>source</i> set.
					</p>
				</li>
				<li>
					<u>Check</u> the <i>flip results</i> in the top left corner. The value of <span class="code-like">ShieldSize</span> in the first column with <b>Serpent's Fang</b> will be smaller than the one in the second. The first column has a
					<i>source</i> actively applying <b>Serpent's Venom</b>, the second is the original, unmodified <b>Lifeline</b> shield. <NuxtLink :to="applyXOnTargetStepConfigs.resultsFlipped" target="_blank">config</NuxtLink>
					<!-- same image as the previous one but flipped, hovering over the shieldsize var -->
					<div class="tmp-image" />
				</li>
				<li>
					Finally, <u>uncheck</u> the <i>flip results</i> checkbox, then add the <strong>stats</strong> <i>results section</i>. Find the <b>Attack Speed</b> row. The value it shows is the same one the <i>stats panel</i> of the configured
					<i>damage source</i> has, even though the <i>target</i> has <b>Frozen Heart's</b> passive checked to apply. <NuxtLink :to="applyXOnTargetStepConfigs.sourceStatsAttackSpeed" target="_blank">config</NuxtLink>
					<!-- only stats section scrolled to attack speed, arrow pointing to ambesa having the same -->
					<div class="tmp-image" />
				</li>
			</ol>
			<p>
				Again, this is because <strong>applying an effect on target works only in one direction</strong>. A <i>source</i> can apply its items' and abilities' effects to every <i>target</i> it's being calculated against.
				<i>Target's</i> "apply X to target" are ignored, even with <i>table results</i> flipped.
			</p>
			<p class="alert info">
				<span id="tutorial-apply-x-takeaway">Think of <i>flip target vs source</i> as a quick look into what the target looks like while being hit by the source.</span>
				For example if your <i>source</i> applies <b>Winter's Caress</b>, flip the results and check the <b>stats</b> section to see the <i>target's</i> reduced attack speed
				<Icon class="i-ph:info" />
			</p>
		</details>
		<details id="tutorial-custom-result-sections">
			<summary>custom result sections</summary>
			<p>There are 4 custom <i>result section</i> options. TODO describe each section, basic attack link to next tutorial</p>
		</details>
		<details id="tutorial-basic-attack">
			<summary>basic attacks</summary>
			<p class="game-description" v-html="tutorialBasicAttackDoubleCounting" />
			TODO
		</details>
		<details>
			<summary>Rell passive resist drain</summary>
			<p>TODO it's complicated</p>
		</details>

		<TextPageHeading id="example-configurations" text="example configurations" />
		<p>A couple of configurations that could be interesting to look at. The list is rather short for now. More entries will be added as I come across things worth sharing.</p>
		<p>
			Note that the links to the configurations will be for the current patch. The results shown may not be applicable to the situation they are for anymore. Right now the only way to view <strong>lolcalc</strong> for a different patch
			version is to run the source code yourself. Either an older version of it, or with manually updated underlying values.
		</p>
		<ul>
			<li>
				<NuxtLink
					to="/?v=1&src=8_1_4645_0__000_841_2_0000_00000_______&src=8_1_4645-3031_0__000_841_2_0000_00000_______&tgt=-1_1__0___1000_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tgt=-1_1__0___97_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tgt=-1_1_3143_0___1350_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tgt=-1_1_3143_0___199_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tblCol=1-0&tblCol=1-1&tblCol=1-2&tblCol=1-3&tblSct=0-8-1-0_1&tblSct=a-stats_&tblSct=a-ba_1&tblSct=a-cTtl_1"
					target="_blank"
				>
					spell crit</NuxtLink
				>
				- <span class="game-description" v-html="exampleSpellCrit" />
			</li>
			<li>
				<NuxtLink
					to="/?v=1&src=84_18_3157-4645-3152-3135-3173-1082_0__000_3088_200_0000_00000___0*0*0_glory-2___2&src=84_18_3157-4645-3152-3089-3173-1082_0__000_3088_200_0000_00000___0*0*0_glory-2___2&tgt=887_20_3157-4633-2510-3111-1058_0___3532_1116_0000_00000_______0&tgt=56_17_6631-3026-3073-3155-3111_0___3254_825_0000_00000____sBShockwave-100___&tgt=4_18_3157-3100-3094-6657-2065-3173_0___2890_1796_0000_00000____eternity-10___2&tgt=804_18_3156-3033-6672-2523-3085-3008_0___2460_1040_0000_00000____slay-7___3&tgt=518_13_3152-3110-3158-1057-3067-3869_0___2499_1178_0000_00000_______4&tblCol=0-0&tblCol=1-0&tblCol=0-1&tblCol=1-1&tblCol=0-2&tblCol=1-2&tblCol=0-3&tblCol=1-3&tblCol=0-4&tblCol=1-4&tblSct=a-cTtl_1&tblSct=0-84-4-0_1&tblSct=0-84-1-0_1&tblSct=0-84-3-0_1&tblSct=0-84-0-0_1&tblCTtl=3-1*3-0*2-0*1-0*1-2*1-1*4-1"
					target="_blank"
				>
					worlds 2026 finals Akali Rabadon vs Void Staff</NuxtLink
				>
				- <span class="game-description" v-html="example2026WorldsAkali" />
			</li>
		</ul>

		<TextPageHeading id="q-a" text="q&a" />
		<dl>
			<dt>how can I save multiple configurations?</dt>
			<dd>
				At the moment the recommended way is to, after setting one up, copy the url in the browser (or use the <b>"Share"</b> button) and save it in a notepad or something similar. Then you should be able to revisit it whenever. Adding a
				built-in way of managing multiple configurations is planned, see the <NuxtLink to="/about#roadmap">roadmap</NuxtLink>.
			</dd>
			<dt>there's an ability that slows, but it doesn't have a thing I can click</dt>
			<dd>
				There are a lot of slows in the game and they vary mostly by strength and duration. A few common ones have a dedicated <i>config element</i> for applying them - mostly items and champion passives. Adding them for every slow would be
				too much work (for now). <strong>Arbitrary slow values can be applied in the <i>effects dialog</i>.</strong>
			</dd>
			<dt>Azir/Zeri/Xayah ability levels</dt>
			<dd>
				These and other champions start with a specific ability leveled on level 1, or cannot level an ability X until they leveled ability Y (<NuxtLink
					to="https://wiki.leagueoflegends.com/en-us/Champion_ability#Ranking_order_&_rules"
					target="_blank"
					>wiki</NuxtLink
				>). At the moment <strong>lolcalc</strong> doesn't implement these restrictions and adding them is not a priority.
			</dd>
			<dt>how can I delete the last results column?</dt>
			<dd>It's a puzzle.</dd>
			<dt>why are the stun/slow duration and values in the results table? They don't change</dt>
			<dd>They are affected by target's tenacity and slow resists.</dd>
			<dt>items scaling with levels 1-18</dt>
			<dd class="game-description" v-html="qaItemsScalingWithLevels" />
		</dl>
	</main>
</template>

<style>
@layer page {
	#guide {
		> dl {
			> dd {
				> strong {
					--at-apply: 'font-500 text-white';
				}
			}
		}

		#tutorial-apply-x-takeaway {
			--at-apply: 'text-center block mbe-[0.33em] text-blue-100';
		}
	}
}

@layer overrides {
	#reset-tutorial {
		--at-apply: 'inline-32 mx-auto text-center mbs-[1em] mbe-[0.4em]';

		> span:last-child {
			--at-apply: 'hidden';

			> .icon {
				--at-apply: 'align-[-3px] ms-[0.25ch]';
			}
		}

		&[data-clicked] {
			--at-apply: 'bg-green-950';

			> span {
				&:first-child {
					--at-apply: 'hidden';
				}

				&:last-child {
					--at-apply: 'inline';
				}
			}
		}
	}
}
</style>
