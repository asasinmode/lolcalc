<template>
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

	<h2>how do I use it?</h2>
	<p>check out the tutorial library and read on for some of the features described in-depth</p>

	<h2>contact</h2>
	<p>to report any issues, use <button>the report issue form</button> or go directly to <a>github [external link icon]</a></p>
	<p>for any other inquiries or general contact, you can reach out through any of these</p>
	<ul>
		<li>email</li>
		<li>discord</li>
		<li>twitter (use the other 2, I don't check it often)</li>
	</ul>
</template>
