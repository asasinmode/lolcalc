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

- [ ] script for downloading/updating latest patch data
- [ ] useful assets https://raw.communitydragon.org/latest/
- [ ] calculating stats
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

```
found out how to do this properly, so writing to maybe help someone out in the future:

Inside the binary items file (https://raw.communitydragon.org/pbe/game/items.cdtb.bin.json),
look for mItemAttributes field for a given item.
It's value is a list with bit flags, for example: [2, 16]. Each of these flags translates to recommended classes as follows:

1 - fighter
2 - marksman
4 - assassin
8 - tank
16 - mage
32 - support
```
