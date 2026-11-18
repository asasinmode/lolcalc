# @lolcalc/website

[lolcalc.app](https://lolcalc.app) website source code

## dev

For more specific instructions, see [contributing.md](CONTRIBUTING.md)

```bash
# install dependencies
pnpm install

# fetch latest game data
node ./scripts/updateGameData.ts

# start dev server
pnpm dev

# build
pnpm generate
```

## todo

- [ ] results ui, table like the post game one, grouped by ability type, like AA or selected abilities. So all chosen caitlyn Qs are in the same section and so on
  - [ ] basic attack hover tooltip, note that it already includes everything and might not make sense in custom total
- [ ] calculations
  - [ ] basic attack damage
    - [ ] related items/passives/effects
  - [x] heal and shield power affecting known shields & heals
    - [ ] heal & shield mult actualizer - will need outgoing/incoming heal & shield distinction?
  - [ ] damage multipliers (immortal path, haunting guise items, chemtech soul - try to merge vars)
- [ ] try to prefetch images for buttons
  - [ ] role quests
  - [ ] dragons
- [ ] guide/about page
  - [ ] screenshots showing it accurately calculating things
  - [ ] items going from X to Y based on level showing 1-18 despite lvl 19 & 20 top quest affecting the displayed value like echoes of helia heal `270 (80 - 250 i:level)`, also mention that solari/redemption/helia/mikael/shieldbow do indeed to above 20 (tested)
  - [ ] describe item description inventory/shop view
  - [ ] serpent's fang displayed values don't match up, probably test more (was tested on shieldbow, assumedly shieldbow "puts back" hp to the threshold then gives shield and that shield is then reduced)
  - [ ] effect from champion overrides external one (also tries to remove it if present, like Nami)
  - [ ] results effects applied from target to source override the ones present on source (W from nasus applied to target overrides the Wither effect already present on target)
  - [ ] no individual interactions like belveth/jax or aatrox/kayle+morgana
  - [ ] heal values shown on top of character can lie? 16.16 amumu redemption/visage/immortal path screen?
- [ ] contributing.md
- [ ] roadmap
- [ ] github readme
- [ ] submit feedback on page / report issues
  - [ ] rust wasm cloudflare worker server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] build github actions CI/CD
- [ ] check if can use cdragon cdn instead of raw
- [x] service worker for caching stuff
  - [ ] cache lolcalc files too
