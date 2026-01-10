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
- [ ] check if can use cdragon cdn instead of raw
- [ ] champ select dialog
- [ ] item shop dialog
  - [x] sorting
  - [x] searching
  - [x] stat filters
  - [x] double click to buy
  - [x] builds into displayed item tree
  - [ ] item hover tooltip `Items/{{id}}.mItemDataClient`
  - [ ] buying mechanism, components into item and so on
  - [ ] item groups, only one from group
- [ ] button tooltips over `:title` where appropriate
  - [ ] LolScoreboardItem buttons
- [ ] multiple builds/champions you can switch between
- [ ] some cool graphs
- [ ] sharing, saving/reading data in query
- [ ] calculations
  - [ ] item passives (+ displaying values in tooltips, check if we know to display level scaling icon like on kraken slayer)
  - [ ] champion passives
  - [ ] runes
  - [ ] s16 quest toggles
- [ ] creating a screenshot?
- [ ] disclaimer not endorsed by riot
- [ ] [wiki](https://github.com/asasinmode/colectormode/wiki)
- [ ] mobile version
- [ ] check with screenreader
- [ ] github issue template
  - champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] submit feedback on page / report issues
- [ ] build github actions CI/CD
- [ ] per patch versions = see stats/features from older patches

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others. Could have one file with `Record<string, [item functions/slots]>` and insert them somehow with `<component>`

### future features

- [ ] champion passives, abilities, ability levels (`additionalData` in each champion's map)
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] [major runes](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
- [ ] elixir effects (bring back in updateGameData)
- [ ] ornnaments stats + gold value
- [ ] migrate senna souls
- [ ] wave gold/xp at minute
- [ ] champion & build guess recaptcha
- [ ] extracting champions and items from screenshots
- [ ] aram
  - item overrides - `DataValuesModeOverride`
- [ ] scorch vs gathering storm damage shower, pick champion, show 10, 20, 30... minutes
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] rewrite css classes to selectors with `@apply` (probably will have to change to tailwind since [unocss is iffy](https://github.com/eslint/csstree/pull/104))

## misc

[useful assets](https://raw.communitydragon.org/latest/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
