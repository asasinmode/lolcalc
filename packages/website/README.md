# lolcalc.app - League of Legends damage calculator website

## setup

```bash
# install dependencies
pnpm install

# fetch game data
node ./scripts/updateGameData.ts

# start dev server
pnpm dev

# build
pnpm generate
```

## todo

lightningcss getting mad at unocss @property inside of a layer should be resolved when a release with https://github.com/parcel-bundler/lightningcss/issues/968 is out

- [x] favicon 🇱🖩
- [x] script for downloading/updating latest patch data
- [x] calculating stats (no item/champ passives)
- [x] item rarity for shop
- [x] change `champion/item.image` to just string if no need for object or find the spritesheet
- [x] remove dialog/champ dialog search placeholders, only label
- [ ] scoreboard ui
  - [x] red exclamation mark next to runes when incorrect
  - [x] buttons functionality
    - [x] alt + move = duplicate
    - [x] shift + click remove = clear
    - [x] dragging
  - [x] items
    - [x] drag between inventories
    - [x] hover tooltip
    - [ ] move with keyboard, shift + arrows?
  - [ ] expanded
    - [x] stats
    - [x] current health/mana
    - [x] slider drag health/mana
    - [x] champion data loading indicator
    - [x] passive with tooltip
    - [ ] abilities ui (only passive implemented)
    - [ ] ability tooltip shift variables
    - [x] runes (only shards implemented)
    - [x] dragons/souls
    - [x] choose role quest
    - [ ] extras ui (items and champion passives for now)
      - [ ] aphelios ability levels
      - [x] veigar
      - [ ] volibear
      - [ ] zaahen
      - [ ] kai'sa
      - [ ] kraken slayer
    - [ ] confirm removing/clearing row
  - [ ] mirror layout
- [ ] results ui, table like the post game one, grouped by ability type, like AA or selected abilities. So all chosen caitlyn Qs are in the same section and so on
  - [ ] source vs target column headers
  - [ ] unique sections, basic attack, item or ability
  - [ ] damage type row, use the actual calculated value in the cells
  - [ ] column header functionality - choose source/target, remove
  - [ ] section header functionality - add new, expand/collapse, remove
  - [ ] cleanup results when source/target is moved/deleted or champion changes
  - [ ] color coded/matching results with scoreboard
  - [ ] row/column hover/focus style
  - [ ] compare item proc damage, something like `ITEM_SPECIFICS.luden.proc` that would return damageresults[] then can be chosen for damage compare and whatever it spits out is added to the table
  - [ ] ability rows not implemented yet, coming soon
  - [ ] per damage results row unknown variables, add exclamation that results are incorrect
  - [ ] aphelios ability variants
- [ ] rune dialog
  - [x] layout
  - [x] secondary path unset layout
  - [x] hover tooltips
  - [x] rune paths not implemented alert
- [ ] champ select dialog
- [ ] item shop dialog
  - [x] sorting
  - [x] searching
  - [x] stat filters
  - [x] double click to buy
  - [x] builds into displayed item tree
  - [x] item hover tooltip `Items/{{id}}.mItemDataClient`
  - [x] inventory panel or list in the footer
  - [x] buying mechanism, components into item and so on
  - [x] item groups, only one from group
  - [ ] show inventory total value
- [ ] target dummy damage source
- [ ] mobile version and make look better
- [ ] sharing, saving/reading data in query
- [ ] calculations [check out](https://github.com/OsOmE1/leaguebuilder)
  - [ ] stats from rune shards
  - [ ] dragons/souls
  - [ ] implement role quests
  - [ ] resolve game variables
  - [ ] item passives
  - [ ] champion passives
    - [ ] level breakpoint calculations
    - [ ] use extras passive data
  - [ ] DamageSource.internalData set from utils/champion.ts
  - [ ] maybe dynamic variables can be cached on damage source under a key then reused
  - [ ] think of something other than spread copying `{...champion, dynamicValues: ...}`
  - [ ] check if can always lowercase match variables
  - [ ] check if can save only gold cost, not whole object
- [ ] try to prefetch images for buttons
  - [ ] champ select roles
  - [ ] role quests
  - [ ] dragons
- [ ] disclaimer not endorsed by riot
- [ ] alerts and info texts for stuff not implemented yet
- [ ] tutorial popups with helpful info
  - [ ] dragging scoreboard elements
  - [ ] dragging items
  - [ ] right click to sell items
  - [ ] right click to clear ability level/soul/role quest/others
- [ ] keyboard navigation
  - [ ] show tooltips when navigated to with keyboard
- [ ] check with screenreader (check if tooltips are read when navigated to even when not visible)
- [ ] update browser alert to make sure everything works properly alert, add [browserslist](https://github.com/browserslist/browserslist) to nuxt/lightningcss targets
- [ ] [wiki](https://github.com/asasinmode/lolcalc/wiki)
  - [ ] help/faq page
  - [ ] github readme
- [ ] submit feedback on page / report issues
  - [ ] probably a rust server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] build github actions CI/CD
- [ ] check if can use cdragon cdn instead of raw
- [ ] service worker for caching cdragon images
- [ ] future features in github project page thingy?
- [ ] result graphs, probably future feature, maybe in style of post match graphs?

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others. Could have one file with `Record<string, [item functions/slots]>` and insert them somehow with `<component>`

### future features

- [ ] champion abilities
  - [ ] cooldown/resource cost in tooltip (also aphelios' cooldown shows range X-Y when shift)
  - [ ] list of variable values when holding shift, maybe is `mClientData`.`mTooltipData`.`mLists`.`LevelUp`.`Elements`?
  - [ ] ability variant swapping, shapeshifters + aphelios, jayce has 1 lvl
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] explicit calculation formulas you can look at
- [ ] [major runes](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
  - [ ] components for stuff like manaflow band or precision legends for setting values
- [ ] elixir effects (bring back in updateGameData)
- [ ] extracting champions and items from screenshots
- [ ] per patch versions = see stats/features from older patches
- [ ] rewrite css classes to selectors with `@apply` (probably will have to change to tailwind since [unocss is iffy](https://github.com/eslint/csstree/pull/104))

#### very future

- [ ] combo damage, choose spells/aas in order, apply them to target, show damage
- [ ] aram
  - item overrides - `DataValuesModeOverride`
- [ ] creating a screenshot? [getDisplayMedia](https://github.com/webrtc/samples/tree/gh-pages/src/content/getusermedia/getdisplaymedia)

#### misc pages

- [ ] ornnaments stats + gold value
- [ ] migrate senna souls
- [ ] wave gold/xp at minute
- [ ] champion & build guess recaptcha
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] scorch vs gathering storm damage shower, pick champion, show 10, 20, 30... minutes

## misc

[useful assets](https://raw.communitydragon.org/latest/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
