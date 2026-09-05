<template>
	<main id="guide">
		<h1>guide</h1>

		<h2>definitions</h2>
		<dl>
			<dt>configuration scoreboard</dt>
			<dd>the first section of the calculator where you can configure <i>damage sources</i> and <i>damage targets</i></dd>
			<dt>source / damage source</dt>
			<dd>the champion configured on the <b>left</b> side of the <i>configuration scoreboard</i></dd>
			<dt>target / damage target</dt>
			<dd>the champion configured on the <b>right</b> side of the <i>configuration scoreboard</i></dd>
			<dt>results table</dt>
			<dd>the table found below the <i>configuration scoreboard</i> where you can see and compare most of the calculated values</dd>
			<dt>results table column / results column</dt>
			<dd>the <i>results table</i> allows for adding multiple columns. Each of these can contain a <i>damage source</i> and a <i>damage target</i>. The values in the columns are displayed for the respective column's <i>source</i> vs (hitting) <i>target</i></dd>
			<dt>results table section / results section</dt>
			<dd>the <i>results table</i> can display variables found in any number of things like <b>items</b>, <b>champion abilities</b>, <b>effects</b> and <b>runes</b> (coming soon). These can be added on-demand using the <i>add section</i> form in the top left corner of the table</dd>
		</dl>
		<p>Check out the TODO tutorial library and read on for some of the features described in-depth</p>

		<h2>
			q&a
		</h2>
		<dl>
			<dt>how can I save multiple configurations?</dt>
			<dd>At the moment the recommended way is to, after setting one up, copy the url in the browser (or use the <b>Share</b> button) and save it in a notepad or something similar. Then you should be able to revisit it whenever. Adding a builtin way of managing multiple configuration is planned, see <a href="#TODO">roadmap</a></dd>
			<dt>how can I delete the last results column?</dt>
			<dd>it's a puzzle</dd>
		</dl>

		<h2 id="guide-examples">
			examples
		</h2>
		<ul>
			<li>
				<NuxtLink to="/?v=1&src=8_1_4645_0__000_841_2_0000_00000_______&src=8_1_4645-3031_0__000_841_2_0000_00000_______&tgt=-1_1__0___1000_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tgt=-1_1__0___97_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tgt=-1_1_3143_0___1350_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tgt=-1_1_3143_0___199_500_1111_00000___1000*500*0*0*0*0*0*0*0*0*0*200*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0____&tblCol=1-0&tblCol=1-1&tblCol=1-2&tblCol=1-3&tblSct=0-8-1-0_1&tblSct=a-stats_&tblSct=a-ba_1&tblSct=a-cTtl_1" target="_blank">vladimir shadowflame randuin</NuxtLink>
			</li>
		</ul>

		<details>
			<summary><h3>"apply X on target" items</h3></summary>
			<p>
				Some items, like <b>Serpent's Fang</b> can apply effects to every <i>target</i> the <i>source</i>. These effects are then applied to the values shown in the <i>results</i>. Since the results allow you to toggle between displaying values for <i>source</i> or <i>target</i>, it's important to note that <strong>applying an effect works only in one direction</strong>. Checking "apply to target" on a <i>damage target</i>, won't apply that effect onto the source, regardless of if the results are flipped. TODO check/document if the same makes sense for resists (don't set calculationTarget on computedTarget in results)
			</p>
			<p>
				For example, both <b>Serpent's Fang</b> and <b>Frozen Heart</b> allow for applying its effect to the target. If you were to
			</p>
			<ol>
				<li>
					configure a <i>damage source</i> with any champion and <b>Serpent's Fang</b>, then check the <b>apply Shield Reave on target</b>
				</li>
				<li>
					configure a <i>damage target</i> with <b>Frozen Heart</b> and <b>Sterak's Gage</b> (so we can see reduced shield value), then similarly check <b>apply Winter's Caress</b>
				</li>
				<li>
					in the <i>results table</i>, make sure the <i>results table column</i> has the <i>source</i> set to the one with <b>Serpent's Fang</b> and the <i>target</i> set to the one with <b>Frozen Heart</b> and <b>Sterak's Gage</b>
				</li>
				<li>
					use the <i>add section</i> form to add <b>Sterak's Gage</b>
				</li>
				<li>
					while the <i>flip results</i> is <strong>unchecked</strong>, the <b>ShieldSize</b> variable's value will be <span>n/a</span> as the results are being shown for our <i>damage source</i>, which only has <b>Serpent's Fang</b>
				</li>
				<li>
					now <strong>check</strong> the <i>flip results</i> in the top left corner and the displayed <b>ShieldSize</b> value is the one <strong>reduced</strong> by the <i>damage target's</i> <b>Serpent's Fang</b>. If you go back to the <i>configuration scoreboard</i> and uncheck the <b>apply Shield Reave on target</b> you should see the <b>ShieldSize</b> change to its base value
				</li>
				<li>
					finally, <strong>uncheck</strong> the <i>flip results</i> checkbox and find and expand the <strong>stats</strong> <i>results section</i>. Find the <b>Attack Speed</b> row and the value there should be the same as the one in the <i>stats panel</i> of our configured <i>damage source</i>, even though the <i>target</i> has <b>Frozen Heart</b> with its passive, <b>Winter's Caress</b> checked to apply
				</li>
			</ol>
			<p>
				Again, this is because <strong>items applying an effect work only in one direction</strong>. <i>Source</i> can apply its items' and abilities' effects to every <i>target</i> it's being calculated against. <i>Target's</i> effects that affect <u>other champions</u> (have "apply ... to target"), not the <i>target</i> itself, take no effect when <i>flipping results</i>.
				<br>
				Effects that affect the <i>target</i> itself, like <b>Force of Nature's</b> passive, <b>Steadfast</b>, would grant its effect to the <i>target</i> when checked to apply.
			</p>
			<p>
				To see how you can apply <b>Winter's Caress</b> to a <i>damage source</i>, see <a>applying external effects</a>.
			</p>
		</details>
		<details>
			<summary><h3>applying external effects</h3></summary>
			<p>
				Effects can be applied using the <button>effects</button> button
			</p>
		</details>
		<details>
			<summary><h3>Rell passive resist drain</h3></summary>
			<p>
				It's complicated
			</p>
		</details>
	</main>
</template>
