# aphelios

use root spells for filtering out non Q spells from `mAbilities`

- root spells
  - Characters/Aphelios/Spells/ApheliosQ_ClientTooltipWrapper / ignore (maybe cooldown/mana cost?)
  - Characters/Aphelios/Spells/ApheliosWAbility/ApheliosW / use for mAbilities ignore
  - Characters/Aphelios/Spells/ApheliosE_ClientTooltipWrapper / ignore
  - Characters/Aphelios/Spells/ApheliosRAbility/ApheliosR / handle normally
- passive - handle normally
- root mAbilties
  - `Characters/Aphelios/Spells/ApheliosWAbility` = W / same as spell\[1\], ignore
  - `{611a52de}`.rootSpell = `{21df6123}` = E / gun swap icons from here
  - `Characters/Aphelios/Spells/ApheliosRAbility` = R / same as spell\[3\], ignore
  - `{8539480b}`.rootSpell = `{267f31a5}` = passive / same as root `mCharacterPassiveSpell`, ignore
  - `{baa56313}`.rootSpell = `{9501e989}` = Q calibrum / save as Q variant
  - `{c55635b7}`.rootSpell = `{ad4cfba9}` = Q crescendum / -||-
  - `{73071dbb}`.rootSpell = `{b3ce4169}` = Q gravitum / -||-
  - `{12d50a5a}`.rootSpell = `{d29e7023}` = Q infernum / -||-
  - `{3cc24f7f}`.rootSpell = `{c872c72d}` = Q severum / -||-
- q seem to use Q calibrum tooltip
- mLocKeys.keyName is `{{ Spell_ApheliosQ_Name_@f7@ }}` with stringtable having

```
	"spell_apheliosq_name_12": "Resurgent Moonshot",
	"spell_apheliosq_name_13": "Incendiary Moonshot",
	"spell_apheliosq_name_14": "Arcing Moonshot",
...
	"spell_apheliosq_name_21": "Precision Onslaught",
	"spell_apheliosq_name_23": "Incendiary Onslaught",
	"spell_apheliosq_name_24": "Arcing Onslaught",
```

being a combination of main weapon index and off weapon index. a lot of variables reference other stringtable stuff there, probably need to handle it before moving on. try saving stringtable on the champion themselves?
