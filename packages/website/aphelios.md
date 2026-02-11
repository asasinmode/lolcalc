# aphelios

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

stub `@f7@` variable, I think it corresponds to the current guns like calibrum + severum would be `12`. in `updateGameData` either have to go through all variants to save proper keys to stringtable or do something else
maybe something like `dynamicVariable: ['f7']` that will be resolved in app and `updateGameData` ignores them?
