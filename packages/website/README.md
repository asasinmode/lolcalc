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
- [ ] change `champion/item.image` to just string if no need for object or find the spritesheet
- [x] remove dialog/champ dialog search placeholders, only label
- [ ] check if can use cdragon cdn instead of raw
- [ ] champ select dialog
- [ ] item shop dialog
  - [x] sorting
  - [ ] searching (TODO search string, aliases)
  - [x] stat filters
  - [ ] item hover tooltip `Items/{{id}}.mItemDataClient`
  - [ ] buying mechanism, components into item and so on
  - [ ] item groups, only one from group
- [ ] multiple builds/champions you can switch between
- [ ] some cool graphs
- [ ] sharing, saving/reading data in query
- [ ] item passives [bin](https://raw.communitydragon.org/pbe/game/items.cdtb.bin.json) `mDataValues` and map overrides `DataValuesModeOverride`
- [ ] creating a screenshot?
- [ ] disclaimer not endorsed by riot
- [ ] [wiki](https://github.com/asasinmode/colectormode/wiki)
- [ ] check with screenreader
- [ ] github issue template
  - champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] submit feedback on page
- [ ] build github actions CI/CD
- [ ] per patch versions = see stats/features from older patches

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others

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
- [ ] scorch vs gathering storm damage shower, pick champion, show 10, 20, 30... minutes
- [ ] chess like puzzles, guess from screenshot what to do, choose option

## misc

[translations](https://raw.communitydragon.org/15.24/game/en_us/data/menu/en_us/)
[useful assets](https://raw.communitydragon.org/latest/)
[stat icons](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/)
[or](https://raw.communitydragon.org/latest/game/assets/perks/statmods/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/

## tests

TODO probably cant have tests

In the `test` folder there are the `calculateChampionStats.test.ts` and `calculateDamage.test.ts` files. Alongside the files inside `test/fixtures`, these are intended to be a snapshot of the numbers seen in game at X point (like patch 15.24.1).

The methodology for making these was

1. Record a video of a champion in practice tool
2. Test various item setups, hovering over the expanded champion stats
3. Create a test with numbers seen in the video. Numbers are concrete, just what the video showed. No calculations in `expect`

Videos were not saved because it would be a lot of work. Fixtures are the `champion.json` stats for that champion on specified patch
