# lolcalc

Monorepository for everything related to [lolcalc.app](https://lolcalc.app) - damage calculator for League of Legends.

> lolcalc isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends.

## packages

- [core](packages/core) - everything related to the game, its data and calculations used on website
- [data](packages/data) - the game data used by [lolcalc.app](https://lolcalc.app)
- [shared](packages/shared) - utils shared between the packages
- [website](packages/website) - the [lolcalc.app](https://lolcalc.app) website

> original, outdated version can be found on the [v0 branch](https://github.com/asasinmode/collector/tree/v0)

## TODOS

- [ ] CONTRIBUTING.md
- [ ] specific packages' readme, describe core tests

## scripts

### updateTestFixture

Used for updating game data test fixtues with specific properties

```sh
node .\scripts\updateTestFixture.ts [patch] -i [item id or search query] -c [champion id]:[ability keys separated by commas] -d [dragon name]-[stack|soul] -e [effect object name]

# add vladimir and his Q and passive
node .\scripts\updateTestFixture.ts 16.16 -c Vladimir:passive,q

# add shadowflame and randuin
node .\scripts\updateTestFixture.ts 16.16 -i shadowflame -i 3143

# add infernal stack & mountain soul
node .\scripts\updateTestFixture.ts 16.16 -d infernal-stack -d mountain-stack

# add ghost and botrk slow effects
node .\scripts\updateTestFixture.ts 16.16 -e SummonerHaste -e 3153
```
