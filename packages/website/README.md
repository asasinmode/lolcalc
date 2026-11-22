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

### before submitting to riot

- [ ] damage multipliers (immortal path, haunting guise items, chemtech soul - try to merge vars)
- [ ] actualizer, might need separate in/out going heal & shield
- [ ] minimal basic attack damage implementation
- [ ] basic attack hover tooltip
- [ ] guide/about page
  - [ ] guide/about add subheadings to toc
  - [ ] finish ui guide
  - [ ] more examples
  - [ ] add screenshots to examples
  - [ ] heal values shown on top of character can lie? 16.16 amumu redemption/visage/immortal path screen?
  - [ ] tutorials
- [ ] readme.md
- [ ] contributing.md
- [ ] submit feedback on page / report issues
  - [ ] rust wasm cloudflare worker server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] cleanup git history
- [ ] start doing releases

### after submitting

- [ ] auto attack modifiers (on hit, passives, etc.)
- [ ] service worker cache lolcalc files too
- [ ] PWA
- [ ] move to lolcalc.app
- [ ] build github actions CI/CD
