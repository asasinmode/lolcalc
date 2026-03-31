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
  - [x] toggle button aria-controls, aria-expanded
  - [ ] expanded
    - [x] stats
    - [x] current health/mana
    - [x] slider drag health/mana
    - [ ] [alternate ability resources](https://wiki.leagueoflegends.com/en-us/Ability_resource) like energy, zaahen, fury
    - [x] champion data loading indicator
    - [x] passive with tooltip
    - [x] abilities ui (only passive implemented)
    - [x] list of variable values when holding shift
    - [x] debounce updating health/ability resource value on drag
    - [x] runes (only shards implemented)
    - [x] dragons/souls
    - [x] choose role quest
    - [ ] extras ui champions
      - [ ] aphelios ability levels
      - [x] veigar
      - [ ] volibear
      - [ ] zaahen
      - [ ] kai'sa
      - [ ] ornn
      - [ ] senna
      - [ ] thresh
      - [ ] jax
      - [ ] target dummy stats
    - [ ] extras ui items
      - [ ] guinsoo
      - [ ] terminus
      - [ ] heartsteel
      - [ ] hubris
      - [ ] mejai's
      - [ ] dark seal
      - [ ] kraken slayer
      - [ ] yun tal wildarrows
    - [ ] shapeshifting champions choose shape, switch abilities since it can affect stats
  - [x] mirror layout
- [ ] results ui, table like the post game one, grouped by ability type, like AA or selected abilities. So all chosen caitlyn Qs are in the same section and so on
  - [x] cleanup sections/columns button. Remove column with both source/target empty? Remove sections without champions present?
  - [x] source vs target column headers
  - [x] unique sections, basic attack, item or ability
  - [x] compare stats section
  - [x] column header functionality - choose source/target, remove
  - [x] section header functionality - add new, expand/collapse, remove
  - [x] cleanup results when source/target is moved/deleted or champion changes
  - [x] color coded/matching results with scoreboard
  - [x] row/column hover/focus style
  - [x] cell have number values, then color them red/green depending on if higher or lower than others
  - [x] stats section show for source/target
  - [x] compare item variables
  - [x] section image appropriate ability/item hover tooltip with variable names instead of values
  - [x] ability rows not implemented yet, coming soon
  - [x] add all of source's items/abilities to damage results
  - [x] ability rows actual description variables
  - [x] one select to switch between sources/targets?
  - [ ] damage type row, use the actual calculated value in the cells
  - [ ] basic attack section normal/crit/average
  - [ ] friendlier variable names? Try to filter out simple variables like 5 more dmg to minions?
  - [x] per damage results row unknown variables style
  - [x] moving columns left/right
  - [x] moving sections up/down
- [ ] rune dialog
  - [x] layout
  - [x] secondary path unset layout
  - [x] hover tooltips
  - [x] rune paths not implemented alert
  - [x] save button? Changes are saved instantly so it doesn't really make sense
  - [x] alert that configuration is incorrect
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
  - [x] show inventory total value
  - [x] try not to intercept all right clicks
- [x] close dialogs on click outside
- [x] target dummy damage source
- [?] sharing, saving/reading data in query
- [ ] mobile version and make look better
- [ ] calculations
  - [ ] stats from rune shards
  - [ ] dragons/souls
  - [ ] implement role quests
  - [ ] resolve game variables
  - [ ] items
  - [ ] champion passives
  - [ ] use everything that has extra ui (and internalData on source)
  - [ ] level breakpoint calculations
  - [x] DamageSource.internalData set from utils/champion.ts
  - [ ] maybe dynamic variables can be cached on damage source under a key then reused
  - [ ] think of something other than spread copying `{...champion, dynamicValues: ...}`
  - [ ] check if can always lowercase match variables
  - [ ] check if can save only gold cost, not whole object
- [ ] try to prefetch images for buttons
  - [ ] champ select roles
  - [ ] role quests
  - [ ] dragons
- [ ] extended item hover tooltips, like swiftmarch showing adaptive force gained
- [x] disclaimer not endorsed by riot
- [ ] alerts and info texts for stuff not implemented yet
- [ ] tutorial popups with helpful info
  - [ ] dragging scoreboard elements
  - [ ] dragging items
  - [ ] right click to sell items
  - [ ] right click to clear ability level/soul/role quest/others
- [ ] keyboard navigation
  - [ ] somehow right clicks, like clearing selects/removing items
  - [ ] show hover tooltips when navigated to with keyboard
  - [ ] skip links around busy areas (scoreboard, item shop?)
- [ ] check with screenreader (check if tooltips are read when navigated to even when not visible)
- [ ] update browser alert to make sure everything works properly alert, add [browserslist](https://github.com/browserslist/browserslist) to nuxt/lightningcss targets
- [ ] [wiki](https://github.com/asasinmode/lolcalc/wiki)
  - [ ] help/faq page
  - [ ] github readme
- [ ] confirm removing/clearing row/scoreboard item, ideally undo + dismiss
- [ ] submit feedback on page / report issues
  - [ ] rust/go server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] cleanup code
  - [ ] try not to use global/composables in calculations related stuff (`onHitIcon`)
- [ ] build github actions CI/CD
- [ ] check if can use cdragon cdn instead of raw
- [ ] service worker for caching cdragon images
- [ ] future features in github project page thingy?
- [ ] rewrite css classes to selectors with `@apply` (probably will have to change to tailwind since [unocss is iffy](https://github.com/eslint/csstree/pull/104))
- [ ] consider used images "locally"

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others. Could have one file with `Record<string, [item functions/slots]>` and insert them somehow with `<component>`

### future features

- [ ] graph results in style of post game ones, table data but graph?
- [ ] champion abilities
  - [ ] cooldown/resource cost in tooltip (also aphelios' cooldown shows range X-Y when shift)
  - [ ] ability variant swapping, shapeshifters + aphelios, jayce has 1 lvl
  - [ ] extendedVariable values, resolve cooldown & cost
  - [ ] result row variable values
  - [ ] result variant sections
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] explicit calculation formulas you can look at
- [ ] [major runes](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
  - [ ] components for stuff like manaflow band or precision legends for setting values
  - [ ] results section, hover tooltip, extract variables
- [ ] overriding stats like target dummy
- [ ] apply effects like black cleaver, abyssal mask
- [ ] elixir effects (bring back in updateGameData)
- [ ] extracting champions and items from screenshots
- [ ] per patch versions = see stats/features from older patches
- [ ] kr/cn translations

#### very future

- [ ] combo damage / sequence of things, choose spells/aas in order, apply them to target, show damage
- [ ] aram
  - item overrides - `DataValuesModeOverride`
- [ ] creating a screenshot? [getDisplayMedia](https://github.com/webrtc/samples/tree/gh-pages/src/content/getusermedia/getdisplaymedia)

#### misc pages

https://nuxt.com/docs/4.x/guide/going-further/features#multiapp

- [ ] ornnaments stats + gold value
- [ ] migrate senna souls
- [ ] wave gold/xp at minute
- [ ] champion & build guess recaptcha
- [ ] chess like puzzles, guess from screenshot what to do, choose option
- [ ] scorch vs gathering storm damage comparison, pick champion, show 10, 20, 30... minutes

## misc

[useful assets](https://raw.communitydragon.org/latest/)
https://hextechdocs.dev/resolving-variables-in-spell-textsa/
