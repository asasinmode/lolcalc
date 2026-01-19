# Colector - League of Legends calculator website

domain: colector.lol

## setup

```bash
# install dependencies
bun install

# fetch game data
bun ./scripts/updateGameData.ts

# start dev server
bun dev

# build
bun generate

# run tests
bun test
```

## todo

- [x] script for downloading/updating latest patch data
- [x] calculating stats (no item/champ passives)
- [x] item rarity for shop
- [x] change `champion/item.image` to just string if no need for object or find the spritesheet
- [x] remove dialog/champ dialog search placeholders, only label
- [ ] scoreboard ui
  - [x] red exclamation mark next to runes when incorrect
  - [ ] buttons functionality
    - [ ] alt + move = duplicate
    - [ ] shift + click remove = clear
  - [ ] expand for stats
  - [ ] mirror layout
  - [ ] first source/target is what's used in damage results
- [ ] results ui
  - [ ] multiple builds/champions you can switch between
  - [ ] some cool graphs
  - [ ] choose damage for: passive, aa, abilities (grayed out with "coming in a future update" tooltip); columns
- [ ] damage compare mode, no mirror mode = both sources and targets available, check which ones to use, check which ability to compare the damage of
- [ ] rune dialog
  - [x] layout
  - [x] secondary path unset layout
  - [ ] hover tooltips, check styles with reference_images/rune hovers.mp4
  - [ ] rune paths not implemented alert
- [ ] champ select dialog
- [ ] item shop dialog
  - [x] sorting
  - [x] searching
  - [x] stat filters
  - [x] double click to buy
  - [x] builds into displayed item tree
  - [x] item hover tooltip `Items/{{id}}.mItemDataClient`
  - [ ] inventory panel or list in the footer
  - [ ] buying mechanism, components into item and so on
  - [ ] item groups, only one from group
- [ ] sharing, saving/reading data in query
- [ ] calculations
  - [ ] item passives (+ displaying values in tooltips)
  - [ ] champion passives
  - [ ] role quests
- [ ] mobile version
- [ ] check with screenreader (check if tooltips are read when navigated to even when not visible)
- [ ] creating a screenshot?
- [ ] disclaimer not endorsed by riot
- [x] favicon 🇱🖩
- [ ] [wiki](https://github.com/asasinmode/colectormode/wiki)
  - [ ] any other FAQ on page
  - [ ] github readme
- [ ] submit feedback on page / report issues
  - [ ] probably a rust server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] build github actions CI/CD
- [ ] check if can use cdragon cdn instead of raw
- [ ] alerts and info texts for stuff not implemented yet

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others. Could have one file with `Record<string, [item functions/slots]>` and insert them somehow with `<component>`

### future features

- [ ] champion, abilities, ability levels (`additionalData` in each champion's map)
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] [major runes](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
- [ ] elixir effects (bring back in updateGameData)
- [ ] extracting champions and items from screenshots
- [ ] aram
  - item overrides - `DataValuesModeOverride`
- [ ] per patch versions = see stats/features from older patches
- [ ] rewrite css classes to selectors with `@apply` (probably will have to change to tailwind since [unocss is iffy](https://github.com/eslint/csstree/pull/104))

#### misc pages

- [ ] ornnaments stats + gold value
- [ ] migrate senna souls
- [ ] wave gold/xp at minute
- [ ] champion & build guess recaptcha
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] scorch vs gathering storm damage shower, pick champion, show 10, 20, 30... minutes

## misc

[useful assets](https://raw.communitydragon.org/latest/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
