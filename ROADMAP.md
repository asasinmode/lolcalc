# roadmap

This file is basically a to-do list of everything I thought might be cool to add. There is no timeline for any of these, mostly for keeping track. For things that are currently being worked on/are planned to be implemented first, check the [roadmap section on the about page](https://lolcalc.app/about#roadmap).

Most of the features listed here aren't set in stone and may be discarded. If you'd like to suggest a feature, feel free to contact me/open a [discussion on github](https://github.com/asasinmode/lolcalc/discussions). Make sure it's not already listed here/mentioned on the [lolcalc about page](https://lolcalc.app/about#roadmap).

## finish beta (first release)

With these done, `v1.0.0` will release and the beta will end.

- [ ] champion abilities
  - [ ] cooldown/resource cost in tooltip (also aphelios' cooldown shows range X-Y when shift), `mSpell.{210f9ec0}` instead of `mSpell.mana`? Maybe passives can have cd? Check gragas
  - [ ] extendedVariable values, resolve cooldown & cost
  - [ ] `updateData` script report unknown CD/cost
  - [ ] aphelios abilities
- [ ] keyboard navigation
  - [ ] somehow right clicks, like clearing selects/removing items
  - [ ] show hover tooltips when navigated to with keyboard
  - [ ] skip links around busy areas (scoreboard, item shop?, results)
- [ ] check with screenreader (check if tooltips are read when navigated to even when not visible)

## definitely not planned ATM

- combos, like full damage of a `Q + W + aa + aa + R`. Most likely will not be implemented, they are out of the scope for this project
- [nemesis quests](https://wiki.leagueoflegends.com/en-us/Nemesis_Quest). Might be implemented but not before anything below

## future features

No clear timeline on any of these and order is random, more of a to-do list.

### game/feature related

- [ ] graph results in style of post game ones, table data but graph?
- [ ] configuration "profiles" in local storage (multiple saved configurations), when loading new shared config, put it in new profile? maybe future feature
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] more custom/other effects - root, silence, any needed
- [ ] [item haste](https://wiki.leagueoflegends.com/en-us/Haste#Item_haste) & affect displayed item cooldowns
- [ ] [rune paths](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
  - [ ] choose shield source to get shield bash value for
  - [ ] comet & electrocute [adaptive damage](https://wiki.leagueoflegends.com/en-us/Adaptive_force#Adaptive_damage)
  - [ ] components for stuff like manaflow band or precision legends for setting values
  - [ ] results section, hover tooltip, extract variables
- [ ] extracting champions and items from screenshots
- [ ] translations, kr/cn first
- [ ] baron buff (red/blue?)
- [ ] per patch versions = see stats/features from older patches
- [ ] item shop champion specific consumables like gp ult
- [ ] item shop consumables panel
- [ ] elixir effects (bring back in updateGameData)
- [ ] detect invalid ability levels

### code upgrades/refactors

- [ ] explicit calculation formulas you can look at
- [ ] color blind mode
- [ ] alternative mode of configuration, step by step choose champion -> runes -> items -> level...
- [ ] kind of data driven champion/item components? Parse specifics in util, based on that create components like effects are

## more future features

Stuff I vaguely thought about but is definitely not being prioritized before the first future features.

- [ ] overriding stats like target dummy
- [ ] aram
  - item overrides - `DataValuesModeOverride`
  - partial map code removed shortly after `986acda`;
- [ ] creating a screenshot? [getDisplayMedia](https://github.com/webrtc/samples/tree/gh-pages/src/content/getusermedia/getdisplaymedia)

## misc pages

Additional, dedicated pages I'd like to add

- [ ] migrate & update [senna souls](https://asasinmode.github.io/lolmode/champions/senna-souls.html)
- [ ] wave gold/xp at minute
- [ ] champion & build guess recaptcha
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] scorch vs gathering storm damage comparison, pick champion, show 10, 20, 30... minutes
- [ ] ad/ap damage needed to kill melee/cannon/ranged minion over game time

Maybe [nuxt multiapp](https://nuxt.com/docs/4.x/guide/going-further/features#multiapp) would be appropriate
