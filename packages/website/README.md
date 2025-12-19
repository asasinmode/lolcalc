# Colectormode - League of Legends calculator website

domain: colectormode.com

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
```

## todo

- [x] script for downloading/updating latest patch data
- [x] calculating stats (no item/champ passives)
- [ ] champ select dialog
- [ ] item shop dialog
- [ ] item rarity for shop
- [ ] item groups, only one from group
- [ ] item passives [bin](https://raw.communitydragon.org/pbe/game/items.cdtb.bin.json) `mDataValues`
- [ ] champion passives, abilities, ability levels (`additionalData` in each champion's map)
- [ ] elixir effects (bring back in updateGameData)
- [ ] multiple builds/champions you can switch between
- [ ] some cool graphs
- [ ] sharing, saving/reading data in query
- [ ] [major runes](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] creating a screenshot?
- [ ] disclaimer not endorsed by riot
- [ ] [wiki](https://github.com/asasinmode/colectormode/wiki)
- [ ] build github actions CI/CD
- [ ] per patch versions = see stats/features from older patches

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others

### future features

- [ ] ornnaments stats + gold value
- [ ] migrate senna souls
- [ ] wave gold/xp at minute
- [ ] champion & build guess recaptcha
- [ ] scorch vs gathering storm damage shower, pick champion, show 10, 20, 30... minutes
- [ ] chess like puzzles, guess from screenshot what to do, choose option

## misc

[useful assets](https://raw.communitydragon.org/latest/)
[stats icons](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/)
[or](https://raw.communitydragon.org/latest/game/assets/perks/statmods/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
