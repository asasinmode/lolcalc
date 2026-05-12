<template>
	<main id="help">
		<h1>help</h1>

		<h2>what is it?</h2>
		<p>
			<a>lolcalc.app</a> is intended to be a fully fledged, all-included <a>League of Legends</a> damage calculator (WIP at the moment). You should be able to choose any champion/item/rune combination and see the same* numbers you will find in game. See <a href="#does-it-work">does it work?</a> section for examples.
		</p>
		<p>* with known discrepancies being</p>
		<ul>
			<li>
				displayed max health can be off by 1 due to floating point arithmetic and the in game ui rounding the displayed value up. This means that the game displays something like <b>2773.0000001</b> (<a>example config</a>), which is effectively <b>2773></b> as <b>2774</b>. Only the displayed value is inaccurate, the calculations are correct.
			</li>
		</ul>

		<h2 id="does-it-work">
			does it work?
		</h2>
		<p>
			while it's impossible for me to check all 172+ champions with every item combination, I tried my best to make it work and here are some examples of it working
		</p>
		<p>!IMPORTANT for now only champions, their passives, items and their passives, and rune shards are taken into account.</p>
		<p>non-passive abilities (like <a>Ambessa R passive</a> or <a>Nocturne W passive</a>) and major runes <strong>are not considered</strong> in the calculations. See the <a>champion/item/rune setup</a> recommended for verifying the calculations yourself</p>
		<p>for when these and other features will be implemented, see the <a>roadmap</a></p>

		<h2>how do I use it?</h2>

		<h3>definitions</h3>
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
		<p>Check out the tutorial library and read on for some of the features described in-depth</p>

		<details>
			<summary><h3>"apply X on target" items</h3></summary>
			<p>
				Some items, like <b>Serpent's Fang</b> can apply effects to every <i>target</i> the <i>source</i>. These effects are then applied to the values shown in the <i>results</i>. Since the results allow you to toggle between displaying values for <i>source</i> or <i>target</i>, it's important to note that <strong>items applying an effect work only in one direction</strong>.
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

		<h2>contact</h2>
		<p>to report any issues, use <button>the report issue form</button> or go directly to <a>github [external link icon]</a></p>
		<p>for any other inquiries or general contact, you can reach out through any of these</p>
		<ul>
			<li>email</li>
			<li>discord</li>
			<li>twitter (use the other 2, I don't check it often)</li>
		</ul>
	</main>
</template>
