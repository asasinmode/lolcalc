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
- [ ] calculating stats (no item/champ passives)
- [ ] item rarity for shop
- [ ] item passives [bin](https://raw.communitydragon.org/pbe/game/items.cdtb.bin.json) `mDataValues`
- [ ] item groups, only one from group
- [ ] [major runes](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
- [ ] champion passives, abilities, ability levels (`additionalData` in each champion's map)
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] elixir effects (bring back in updateGameData)
- [ ] useful assets https://raw.communitydragon.org/latest/
- [ ] multiple builds/champions you can switch between
- [ ] sharing, saving/reading data in query
- [ ] creating a screenshot?
- [ ] some cool graphs
- [ ] misc pages - ornnaments stats + gold value, senna souls, wave gold/xp at minute
- [ ] scorch vs gathering storm damage shower, pick champion, show 10, 20, 30... minutes
- [ ] any cool useful scripts
- [ ] champion & build guess recaptcha
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] per patch versions = see stats/features from older patches
- [ ] [wiki](https://github.com/asasinmode/collector/wiki)
- [ ] disclaimer not endorsed by riot
- [ ] build github actions CI/CD

[stats icons](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/)
[or](https://raw.communitydragon.org/15.24/game/assets/perks/statmods/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
