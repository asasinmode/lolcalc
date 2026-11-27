# @lolcalc/website

[lolcalc.app](https://lolcalc.app) website source code

## dev

For more about the codebase see [contributing.md](CONTRIBUTING.md)

```bash
# start dev server
pnpm dev

# build
pnpm generate
```

## todo

### before submitting to riot

- [ ] damage multipliers
  - [ ] warwick heal mult calculates off of multed/non multed dmg?
  - [ ] actualizer
    - [ ] separate in/out going heal & shield
    - [ ] item damage? says only ability
- [ ] item shop filters TODO check if tenacity counts to movement speed
- [ ] guide/about page
  - [ ] guide/about add subheadings to toc
  - [ ] finish ui guide
  - [ ] more examples (corki crit/bruiser)
  - [ ] add screenshots
  - [ ] heal values shown on top of character can lie? 16.16 amumu redemption/visage/immortal path screen?
  - [ ] tutorials
- [ ] readme.md
- [ ] contributing.md
- [ ] submit feedback on page / report issues
  - [ ] rust wasm cloudflare worker server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] cleanup git history
- [ ] check if .md links work
- [ ] start doing releases

### after submitting

- [ ] auto attack modifiers (on hit, passives, etc.)
- [ ] service worker cache lolcalc files too
- [ ] PWA
- [ ] move to lolcalc.app
- [ ] build github actions CI/CD
- [ ] example images
- [ ] vladimir hemoplague effect
- [ ] corki, gragas, katarina, sion, volibear ability vars
