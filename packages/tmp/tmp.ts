import { xxh3 } from '@node-rs/xxhash';
import fnv1a from '@sindresorhus/fnv1a';

// "{}": "When Kalista winds up her Attacks, issuing a move order will cause her to dash in that direction after she throws.<br><br>Kalista also begins the game with the Black Spear, allowing her to become <keywordMajor>Oathsworn</keywordMajor> to one of her allies permanently.",
// "{3ed91e4ede}": "Kalista teleports the Oathsworn ally to herself. They gain the ability to dash toward a position, knocking enemy champions back.",
// "{0efa1af5cd}": "When Kalista winds up her Attacks, issuing a move order will cause her to dash in that direction after she throws.<br><br>Kalista also begins the game with the Black Spear, allowing her to become <keywordMajor>Oathsworn</keywordMajor> to one of her allies permanently.<br><br><buffedStat>Kalista's <attackSpeed>Attack Speed</attackSpeed> is capped at @ModesASCap@. She converts further <attackSpeed>Attack Speed</attackSpeed> into bonus <physicalDamage>Attack Damage</physicalDamage> (currently: <physicalDamage>@f1.0@</physicalDamage>).</buffedStat> ",

const kalistaTarget = '34fdc9540b';
const zileanTarget = '3ce6b5f53c';
const hecarimTarget = '2d503eb14e';

function hashXXH3(variable: string, bits = 40) {
	const hash = xxh3.Xxh3.withSeed(0n).update(variable.toLowerCase()).digest();
	const value = BigInt(hash) & ((1n << BigInt(bits)) - 1n);

	const hexLen = Math.ceil(bits / 4);
	return value.toString(16).padStart(hexLen, '0');
}

function hashFnv1a(variable: string) {
	const value = fnv1a(variable.toLowerCase(), { size: 32 });
	return `{${value.toString(16)}}`;
}

const things = [
	'Spell_KalistaP_Tooltip_1',
	'Spell_HeightenedLearning_Tooltip_1',
	'buff_desc_SR_2026_S1_RoleBound_Mid_Quest',
	'spell_listtype_hecarimw: resist amount',
];

console.log('== XXH3 ==')
for (const v of things) {
	console.log(hashXXH3(v), v);
}

console.log('== fnv1a ==')
const fnv1aThings = [
	'attackSpeedRatio',
	'spellLevelUpInfo',
	'mRequirements'
];

for (const v of fnv1aThings) {
	console.log(hashFnv1a(v), v);
}
