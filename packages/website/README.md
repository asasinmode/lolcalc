# The Collector - League of Legends calculator website

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

- [ ] calculating stats
- [ ] champion passives
- [ ] item passives [bin](https://raw.communitydragon.org/pbe/game/items.cdtb.bin.json) `mDataValues`
- [ ] script for downloading/updating latest patch data
- [ ] useful assets https://raw.communitydragon.org/latest/
- [ ] multiple builds/champions you can switch between
- [ ] some cool graphs
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] misc pages - ornnaments stats + gold value, senna souls, wave gold/xp at minute
- [ ] scorch damage calculator
- [ ] any cool useful scripts
- [ ] champion & build guess recaptcha
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] per patch versions = see stats/features from older patches
- [ ] [wiki](https://github.com/asasinmode/collector/wiki)
- [ ] disclaimer not endorsed by riot
- [ ] build github actions CI/CD

[stats icons](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
