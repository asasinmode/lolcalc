/**
 * tags that appear in game descriptions, like item shop hover tooltip or champ select rune hover
 * they should have appropriate styles (like font color) set in `ItemDescription.vue`
 */
export const KNOWN_GAME_DESCRIPTION_TAGS: string[] = [
	'passive',	// item heading
	'scalead', // bloodmail, sterak
	'scaleap',	// rabadon, riftmaker
	'scalehealth', // roa, heartsteel
	'scalemana',	// manamune, archangel
	'scalearmor',	// hullbreaker, terminus
	'scalemr',	// malignance, force of nature
	'scalelethality',	// voltaic cyclosword, aphelios passive
	'attackspeed',	// yuntal, experimental hexplate
	'onhit',	// iceborn, statik
	'physicaldamage',	// heartsteel, titanic
	'magicdamage',	// bami, thornmail
	'truedamage',	// cosmic drive, shadowflame
	'health',	// protoplasm harness, no styles
	'healing',	// guardian angel, warmog
	'shield',	// fimbulwinter, hexdrinker
	'lifesteal', // maw of malmortius
	'omnivamp',	// riftmaker
	'speed',	// slightly magical footwear, youmuu
	'gold',	// world atlas, collector
	'status',	// botrk, iceborn
	'attention',	// statikk, knight's vow
	'raritygeneric',	// world atlas
	'raritylegendary',	// archangel, manamune
	'rules',	// crimson lucidity
	'keyword',	// phantom dancer, zeke's convergence
	'keywordmajor',	// terminus
	'keywordstealth',	// horizon focus
	'slow',	// voltaic cyclosword, no styles
	'active', // seeker's armguard, mercurial scimitar
	'lol-uikit-tooltipped-keyword', // in many runes
	'scalelevel', // long first strike, guardian, shield bash
	'statgood', // long precision legends
	'spellname', // aatrox passive, ahri R
	'spellpassive', // aatrox E, ashe Q
	'spellactive', // aatrox E, ashe Q
	'unique', // pyke passive
	'recast', // ahri R, rammus W
	'level', // anivia passive, no styles
	'danger', // pyke R, syndra R
	'evolve', // syndra Q, yunara Q
	'onlyshowingame', // yasuo/yone passive, no styles but block (new line)
	'heal', // yuumi passive, no styles
	'font',
	'b',
	'i',
	'hr',
	'ul', // kayle passive
	'li',
	'titleleft', // dragon stack descriptions
	'maintext', // dragon stack descriptions
	'stattracking', // veigar passive, draven passive
	'release', // irelia W, no styles
	'charge', // irelia W, no styles
	'activerank', // volibear E rules text
];
