# @lolcalc/website

[lolcalc.app](https://lolcalc.app) website

## dev

For more specific instructions, see [contributing.md](contributing.md)

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
    - [x] [alternate ability resources](https://wiki.leagueoflegends.com/en-us/Ability_resource) when adding passives, like energy, zaahen, fury
    - [x] champion data loading indicator
    - [x] passive with tooltip
    - [x] abilities ui (only passive implemented)
    - [x] list of variable values when holding shift
    - [x] debounce updating health/ability resource value on drag
    - [x] runes (only shards implemented)
    - [x] dragons/souls
    - [x] choose role quest
    - [x] extras ui champions
    - [x] extras ui items
    - [x] extras target dummy
    - [x] other "internal" effects like movement speed (bc, trinity, cosmic drive)
    - [x] shapeshifting champions
    - [x] aphelios q rotating
    - [ ] extras shared component like is out combat (youmuu, cloud stack isooc) try to scan internal properties then if detected override component, ideally list the things affected
  - [x] mirror layout
  - [x] expand scoreboard item double click to expand/collapse
  - [ ] drag indicator next to buttons?
  - [ ] drag with champion icon?
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
  - [x] per damage results row unknown variables style
  - [x] moving columns left/right
  - [x] moving sections up/down
  - [x] mark rows to count towards total and sum them for easier comparison of something like aa + kraken proc or spell + item
  - [x] wider columns initially, shrink slightly as more are added
  - [x] move add section to the top
  - [x] effect sections with actual calculated values
  - [ ] add option to remove stats/basic attack sections if more feedback
  - [ ] custom total rows hover tooltips?
  - [ ] choosing column source/target sometimes doesn't happen?
  - [ ] custom value row, choose type input own value
  - [x] stats inventory value row
  - [x] basic attack section info that it already includes stuff, ideally list what's added (custom total might not make sense)
  - [ ] basic attack section normal/crit/average
  - [ ] basic attack hover tooltip, note that it already includes everything and might not make sense in custom total
  - [ ] source indicator, similar to the drag one in scoreboard, when hovering over column
  - [x] friendlier variable names?
  - [x] try to filter out simple variables like 5 more dmg to minions?
  - [x] whether/what to round in results like manamune awe ad
- [ ] rune dialog
  - [x] layout
  - [x] secondary path unset layout
  - [x] hover tooltips
  - [x] rune paths not implemented alert
  - [x] save button? Changes are saved instantly so it doesn't really make sense
  - [x] alert that configuration is incorrect
  - [x] maybe open dialog on panel click
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
  - [x] ctrl toggle between shop/inventory extras & sell value
  - [x] extended item hover tooltips, like swiftmarch showing adaptive force gained (\<rules\>)
  - [x] item hover tooltip sell value when inventory
- [ ] effects
  - [x] dialog
  - [x] apply effects like black cleaver, abyssal mask, amumu passive
  - [x] item effects options ui
  - [x] champion passive effects options ui
  - [x] other effects options ui, like slow, stun, grievous wounds
  - [x] hover tooltips
  - [x] show source ability tooltip on shift
- [x] item/champion extras that apply effect, like every "current" target is affected by amumu passive or has X stacks of bc/is slowed by rylai
- [x] close dialogs on click outside
- [x] target dummy damage source
- [x] sharing, saving/reading data in query
- [x] confirm removing/clearing row/scoreboard item, ideally undo
- [x] header, footer, contact info
- [x] implement role quests (midlane add red `(Only Mid Lane) Locked until Quest is Completed`)
- [ ] mobile version and make look better
  - [ ] results sticky horizontal headers, probably unwanted on mobile, headers might be unwanted too with `@media (height < ...)`
- [ ] calculations
  - [x] try to use values from actual champion ability data (like `Ezreal.abilities.passive[0].dataValues.MaxStacks`)
  - [x] stats from rune shards
  - [x] items passives
  - [ ] heal and shield power affecting known shields & heals
    - [ ] `applyHSMult` spirit visage immortal path actualizer
  - [ ] cap attack speed
  - [?] item effects & their result sections like frozen heart or zeke's convergence
  - [?] resolved item passives values for target like randuin/tabi
  - [x] hook priorities in one file for easier precedence management
  - [ ] grievous wounds affecting all heal type things
  - [x] dragons/souls
  - [ ] champion passives
    - [x] results table hover tooltips, try to not unknown/resolve dynamic variables
  - [ ] champion effects
  - [ ] other effects
  - [ ] basic attack damage
  - [ ] damage multipliers (immortal path, haunting guise items - try to merge vars)
  - [x] level breakpoint calculations (in some passives make sure it works, like xin zhao heal)
  - [x] cap (low and high) movespeed https://wiki.leagueoflegends.com/en-us/Movement_speed#Movement_speed_caps
  - [x] DamageSource.internalData set from utils/champion.ts
  - [x] `{{ Item_Melee_Ranged_Split_Dynamic }}` and `@lolcalcChampRange@` try to do what doran's shield does
  - [ ] resolve game variables
  - [x] maybe dynamic variables can be cached on damage source under a key then reused
  - [x] think of something other than spread copying `{...champion, dynamicValues: ...}`
  - [x] check redemption and other level calculations if they keep scaling past lvl 18 for toplaners
  - [ ] check if can always lowercase match variables. Probably can, not sure if worth it because it would have to navigate whole object instead of trying to dot access? If implemented, check renaming variables resolved with different case like cosmic drive `MoveSpeedAmount`
  - [x] check if can save only gold cost, not whole object
  - [x] are health/ability resource rounded? in ui they are probably ceiled (see ahri 16.9.1 test) so maybe to match UI you could `Math.ceil(value + Number.EPSILON)` / note in help page the discrepancy
  - [ ] moonstone/nilah passive, probably just add disclaimers in about. Maybe try to cheekily insert in detected heals/shields + `[moonstone icon] $value`?
  - [ ] calculate static % values like liandry burn or GA health to?
- [x] update hover tooltips with more calculation info (`= X - Y`) when holding shift
- [ ] defineSpecific functions for better types
  - [x] effects
  - [ ] champions
- [ ] try to prefetch images for buttons
  - [ ] champ select roles
  - [ ] role quests
  - [ ] dragons
- [x] disclaimer not endorsed by riot
- [ ] alerts and info texts for stuff not implemented yet
- [ ] tutorial popups with helpful info
  - [ ] dragging scoreboard elements
  - [ ] dragging items
  - [ ] right click to sell items
  - [ ] right click to clear ability level/soul/role quest/others
  - [ ] difference between "internal effects" (item extras) and "applied effects" (effects dialog)
  - [ ] in/decrement effects in scoreboard item
  - [ ] "tutorial library" to review info
  - [ ] item/passive extra popped up, look here it is, use it
  - [ ] double click to select & close champ select
  - [ ] double click expand/collapse scoreboard item/results section
- [ ] update browser alert to make sure everything works properly alert, add [browserslist](https://github.com/browserslist/browserslist) to nuxt/lightningcss targets
- [ ] [wiki](https://github.com/asasinmode/lolcalc/wiki)
  - [ ] help/faq page
    - [ ] is it accurate? yes except for: no rune paths; no non-passive abilities; displayed health 1 diff due to floating point arithmetics and ceiling (actually might not have to be 1 diff, but probably add disclaimer and settle on acceptable margin of error)
    - [ ] screenshots showing it accurately calculating things
    - [ ] decaying move speed bonuses
    - [ ] grievous wounds applies to all heal values detected, like redemption "ally" heal will be reduced by grievous on source, same for shields
    - [ ] items going from X to Y based on level showing 1-18 despite lvl 19 & 20 top quest affecting the displayed value like echoes of helia heal `270 (80 - 250 i:level)`, also mention that solari/redemption/helia/mikael/shieldbow do indeed to above 20 (and test it)
    - [ ] describe item description inventory/shop view, possibly add it for runes too
    - [ ] serpent's fang displayed values don't match up, probably test more (was tested on shieldbow, assumedly shieldbow "puts back" hp to the threshold then gives shield and that shield is then reduced)
    - [ ] no individual interactions like belveth/jax or aatrox/kayle+morgana
  - [ ] github readme
- [ ] submit feedback on page / report issues
  - [ ] go server
  - [ ] github issue template
  - [ ] champion stats/damage is off (make sure to check no passives, runes, and so on...)
- [ ] cleanup code
  - [ ] try not to use global/composables in calculations related stuff (`onHitIcon`)
- [ ] build github actions CI/CD
- [ ] check if can use cdragon cdn instead of raw
- [ ] future features in github project page thingy?
- [ ] rewrite css classes to selectors with `@apply`
- [ ] try to generate specific components from data in specific, like effect are?
- [ ] consider used images "locally" / service worker for caching stuff
- [ ] try to put the css `url()` using `minorVersion` in one place, as well as urls to other repeated images like gold
- [ ] automatically generate extended equals, ideally on ITEM_SPECIFICS so it doesn't have to do it on every replace, based on itemCalculations/stringCalculations r smth
- [ ] kind of a code documentation where yap about
  - [ ] how to use game texture `textureBgImageAttrs`
- [ ] configuration "profiles" in local storage (multiple saved configurations), when loading new shared config, put it in new profile? maybe future feature

`extras` window with stuff like veigar stacks, gathering storm minutes, manaflow stacks and others. Could have one file with `Record<string, [item functions/slots]>` and insert them somehow with `<component>`

### future features

- [ ] kind of data driven champion/item components? Parse specifics in util, based on that create components, overrides with dynamic `import()` to stay compatible with node
- [ ] graph results in style of post game ones, table data but graph?
- [ ] detect invalid ability levels
- [ ] decaying movement speed stuff like fiora/nami/sivir passive/stridebreaker/solstice sleigh active /hextech dragon slow. Theoretically it affects stuff like swiftmarch passive adaptive force = rest of damage
- [ ] champion abilities
  - [ ] cooldown/resource cost in tooltip (also aphelios' cooldown shows range X-Y when shift), `mSpell.{210f9ec0}` instead of `mSpell.mana`?
  - [ ] ability variant swapping, shapeshifters + aphelios, jayce has 1 lvl
  - [ ] extendedVariable values, resolve cooldown & cost
  - [ ] result row variable values
  - [ ] result variant sections
  - [ ] abilities that give effects like attack speed and scale with champion stats - add possibility to link a source to use for stats
- [ ] aps (ability damage per second) - champions scaling with AH/AP/AD
- [ ] more visual effects dialog ui, instead of a select with add listed everything with images kind of like item shop looks
- [ ] [item haste](https://wiki.leagueoflegends.com/en-us/Haste#Item_haste) & affect displayed item cooldowns
- [ ] more custom/other effects - root, silence, any needed
- [ ] explicit calculation formulas you can look at
- [ ] [rune paths](https://raw.communitydragon.org/15.24/plugins/rcp-be-lol-game-data/global/default/v1/perks.json) [or](https://raw.communitydragon.org/15.24/game/perks.cdtb.bin.json)
  - [ ] choose shield source to get shield bash value for
  - [ ] components for stuff like manaflow band or precision legends for setting values
  - [ ] results section, hover tooltip, extract variables
- [ ] overriding stats like target dummy
- [ ] elixir effects (bring back in updateGameData)
- [ ] baron buff (red/blue?)
- [ ] extracting champions and items from screenshots
- [ ] per patch versions = see stats/features from older patches
- [ ] kr/cn translations
- [ ] color blind mode
- [ ] item shop champion specific consumables like gp ult
- [ ] consumables panel
- [ ] alternative mode of configuration, step by step choose champion -> runes -> items -> level...
- [ ] dorans shield full calculation? It's based on melee/ranged + missing hp
- [ ] monster damage values in results table. They are supposed to be affected by resists so they'd be hit by target resists but you could use that to make a target dummy with monster stats then see how much it will deal?
- [ ] keyboard navigation
  - [ ] somehow right clicks, like clearing selects/removing items
  - [ ] show hover tooltips when navigated to with keyboard
  - [ ] skip links around busy areas (scoreboard, item shop?)
- [ ] check with screenreader (check if tooltips are read when navigated to even when not visible)
- [ ] useX dialog composables don't work on hotReload because component ref is lost (`dialogRef.value` is `undefined`)
- [ ] calculate variables function maybe accept a const for purely static ones

#### very future

- [ ] combo damage / sequence of things, choose spells/aas in order, apply them to target, show damage
- [ ] aram
  - item overrides - `DataValuesModeOverride`
  - partial map code removed shortly after `986acda`;
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

### effect/spell icons

https://raw.communitydragon.org/latest/game/assets/shared/spells/icons2d/
https://raw.communitydragon.org/latest/game/assets/spells/icons2d/
https://raw.communitydragon.org/16.8/game/data/spells/icons2d/
