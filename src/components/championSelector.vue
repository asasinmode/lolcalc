<template>
   <div class="container centered">
      <button class="button selectButton" @click="openChampionOverlay(true)">select champion</button>
      <button class="button infoIcon" @click="showInfoModal = true" title="info">
         <FontAwesomeIcon icon="info-circle" size="2xl" />
      </button>
      <button class="button selectButton" @click="openChampionOverlay(false)">select target</button>
   </div>
   <div class="modalOverlay" v-show="showInfoModal" @click.self="showInfoModal = !showInfoModal">
      <div class="modalContainer">
         <div class="infoButtonsContainer">
            <button class="button infoButton" :class="{selected: infoIndex === 0}" @click="infoIndex = 0">general</button>
            <button class="button infoButton" :class="{selected: infoIndex === 1}" @click="infoIndex = 1">disclaimers</button>
            <button class="button infoButton" :class="{selected: infoIndex === 2}" @click="infoIndex = 2">graph</button>
            <button class="button infoButton" :class="{selected: infoIndex === 3}" @click="infoIndex = 3">formulas</button>
            <button class="button infoButton" :class="{selected: infoIndex === 4}" @click="infoIndex = 4">toggles</button>
            <button class="button infoButton" :class="{selected: infoIndex === 5}" @click="infoIndex = 5">about</button>
         </div>
         <div class="infoContent" v-if="infoIndex === 0">
            <p>This site was made to help visualize damage difference between <b>Lord Dominik's Regards</b> and <b>The Collector</b>.</p>
            <p class="indent">It's best experienced on desktop but I tried to make it look presentable on phone as well.</p><br/>
            <p>It calculates stats of selected champions and items, then displays the graph that shows the damage you can expect (see the <b>disclaimers</b> tab) to see in game when you auto attack target champion.</p><br/>
            <p>The graph has 2 settings. If you want to learn more about it visit the <b>graph</b> tab.</p>
            <p class="indent">If you have either <b>Lord Dominik's Regards</b> or <b>The Collector</b> selected on your main champion the graph will automatically show both of their their respective damage outputs. To compare other builds with each other I recommend opening this app in multiple browser tabs.</p><br/>
            <p>To manually set stats of the <b>target</b> champion click the <b>select target</b> button then choose <b>Target Dummy's</b> icon.</p><br/>
            <p>If you want to request a feature visit the <b>about</b> tab to see where you can contact me.</p><br/>
            <p>Visit the <b>toggles</b> tab to toggle tooltips on graph settings or item groups.</p><br/>
            <div class="centered">
               <strong style="color: hsl(0, 100%, 45%);">There are no major updates planned.</strong></div><br/>
            <div class="centered">
               Current patch:<b style="margin-left: 0.5em;">{{patch}}</b>
            </div>
         </div>
         <div class="infoContent" v-else-if="infoIndex === 1">
            <div class="centered"><strong style="color: hsl(0, 100%, 45%);">Not everything that's present in the game is accounted for in calculations.</strong></div><br/>
            <p>I'm a student and at the moment I can't afford to put in the time and work that's required to make this an accurate simulation of the game as complicated as League.</p>
            <p class="indent">Besides that, the site wasn't made with the intention of being a 100% accurate simulation. First and foremost I wanted it to visualize the damage difference between the same build with <b>The Collector</b> and <b>Lord's Dominik Regards</b>.</p><br/>
            <p>That being said, the numbers you see on the graph are <b>99.9% accurate</b> in situations where all variables are accounted for.</p><br/>
            <p><i>If you have any questions that aren't answered below visit the <b>about</b> tab to see where you can contact me.</i></p><br/>
            <h3 class="centered">what is accounted for</h3>
            <p><strong>Mini runes</strong>, with attack speed, adaptive force and armor being selected for both main and target champion (+10% attack speed, +9 adaptive force, +6 armor). At the moment there is no way of changing them, if it's a heavily requested feature I'll consider adding the option to do so.</p><br/>
            <p><strong>Champion innate passives</strong>, like <a href="https://leagueoflegends.fandom.com/wiki/Ornn/LoL#Living_Forge" target="_blank">Ornn's Passive</a>, <a href="https://leagueoflegends.fandom.com/wiki/Vladimir/LoL#Crimson_Pact" target="_blank">Vladimir's Passive</a>, <a href="https://leagueoflegends.fandom.com/wiki/Jhin/LoL#Whisper" target="_blank">Jhin's Passive</a>.</p><p class="indent">This however <b>does not include</b> basic/ultimate ability passives like <a href="https://leagueoflegends.fandom.com/wiki/Poppy/LoL#Steadfast_Presence" target="_blank">Poppy's W</a>, <a href="https://leagueoflegends.fandom.com/wiki/Garen/LoL#Courage" target="_blank">Garen's W</a>, <a href="https://leagueoflegends.fandom.com/wiki/Malphite/LoL#Thunderclap" target="_blank">Malphite's W</a>.</p>
            <p>List of champion passives accounted for</p>
               <p class="fakeList">Bel'Veth</p>
               <p class="fakeList">Corki</p>
               <p class="fakeList">Jhin</p>
               <p class="fakeList">Kalista</p>
               <p class="fakeList">Kayle</p>
               <p class="fakeList">Ornn</p>
               <p class="fakeList">Orianna</p>
               <p class="fakeList">Pyke</p>
               <p class="fakeList">Rammus (without W active)</p>
               <p class="fakeList">Ryze</p>
               <p class="fakeList">Vladimir</p>
               <p class="fakeList">Warwick</p>
               <p class="fakeList">Yasuo/Yone</p><br/>
            <p><strong>Item/mythic passives</strong>. If the item displays little black square in it's top right corner with letter "P" inside, it means it's passive is included in calculations.</p>
            <p class="indent">General idea is simple passives, like <i>Plated Steelcaps'</i> 12% damage reduction or passives with major impact, like <i>Infinity Edge's</i> are accounted for.</p>
            <p class="indent">More complex passives, for example stacking ones <b>are not</b> taken into consideration. <i>Rock Solid</i> passive (items built with <i>Warden's Mail</i> ) isn't accounted for, as I don't think it has a major impact on the calculations' outcome. See <strong>what isn't accounted for</strong> section below to learn more.</p><br/>
            <p><strong>On-hit</strong>. The on-hit damage <strong>from items</strong> is calculated, with 3 exceptions being:</p>
            <p class="fakeList"><b>Guinsoo's Rageblade's</b> <i>Seething Strike</i> passive that makes every third basic attack apply your on-hit effects. Including it would make showing the damage on graph needlessly complicated.</p>
            <p class="fakeList"><b>Blade of the Ruined King's</b> <i>Mist's Edge</i> and <i>Siphon</i> passives as they are target's health-dependant, which simply put makes things very complicated.</p>
            <p class="fakeList"><b>Kraken Slayer's</b> <i>Bring It Down</i> passive that deals (60 + 45% bonus attack damage) true damage every third basic attack. Don't see a point in including it.</p><br/>
            <h3 class="centered">what isn't accounted for</h3>
            <p><strong>Any health-dependant</strong> effects, for example <i>Kai'Sa's</i> passive or <i>Blade of the Ruined King's</i> passives aren't included in calculations with the exception being <b>Lord Dominik's Regards</b>.</p><br/>
            <p><strong>Major runes</strong>, like <i>Conqueror</i>, <i>Coup de Grave</i>, <i>Absolute Focus</i>. Some of them change with level, some of them scale with main/target champion's hp, most of them are complicated and vary from game to game and don't have a huge, lasting impact on calculations.</p><br/>
            <p>Some <strong>champion innate passives</strong> that didn't strike to me as having a big impact on calculations or they seemed too complicated to implement. If you think they matter, consider visiting the <b>about</b> tab to see where you can contact me.</p>
            <p>List of champion passives <strong>not</strong> accounted for (that I think matter)</p>
               <p class="fakeList">Akshan</p>
               <p class="fakeList">Aphelios</p>
               <p class="fakeList">Fizz</p>
               <p class="fakeList">Graves</p>
               <p class="fakeList">Hecarim</p>
               <p class="fakeList">Kassadin</p>
               <p class="fakeList">Master Yi</p>
               <p class="fakeList">Sett</p><br/>
            <p><strong>Item/mythic passives</strong> that are complex, stacking, or proc occasionally (energized/spellblade effects). Examples being <i>Trinity Force</i>, <i>Black Cleaver</i>, <i>Force of Nature</i>, <i>Phantom Dancer</i>, <i>Warden's Mail</i>, <i>Stormrazor</i>, <i>Rapid Firecannon</i>.</p><br/>
            <p><strong>On-hit</strong>. 3 item exceptions listed above in <strong>what is accounted for</strong> section and champion innate passive on-hit effects like Orianna's <i>Clockwork Windup</i> or Tahm Kench's <i>An Acquired Taste</i> <strong>are not</strong> accounted for.</p>
         </div>
         <div class="infoContent" v-else-if="infoIndex === 2">
            <p>The graph shows lines for both the basic attack damage (labelled <b>damage</b>) and the dps (labelled <b>dps</b>) for the calculated damage and attack speed.</p>
            <p class="indent">Both lines show a point for levels 1-18, each point representing their values at respective level. Since the damage changes only every whole level, the lines between points don't mean anything.</p><br/>
            <p>The <b>damage</b> values represent the total (<strong>physical</strong> + <strong>magical</strong>, with target's resists taken into account) damage your <b>selected champion's</b> <strong>basic attack</strong> is going to deal (see <b>disclaimers</b> tab) to the <b>target</b> at specific level.</p>
            <p class="indent">The <b>dps</b> values represent the damage per second your <b>selected champion</b> deals to the <b>target</b> at specific level. <b>DPS</b> is calculated as the <strong>basic attack damage</strong> * <strong>attack speed</strong>.</p><br/>
            <p>Using the buttons above the graph you can choose what values it should show.</p>
            <p class="indent">First set of buttons lets you select what strike type the damage should be calculated for, the options being <b>average</b>, <b>non-critical</b> and <b>critical</b>. Average treats critical strike chance as damage multiplier using the formula found on <a href="https://leagueoflegends.fandom.com/wiki/Critical_strike#Critical_strike_chance" target="_blank">wiki</a>.</p>
            <p class="indent">Second set of buttons lets you select what levels the damage should be calculated for, options being <b>equal</b>, <b>selected/changing</b> and <b>changing/selected</b>.</p>
            <p class="fakeList" style="padding-top: 0.2em;"><b>Equal</b> means the damage is calculated as if the champions were on the same level. For example 1 vs 1, 2 vs 2, 3 vs 3 and so on.</p>
            <p class="fakeList" style="padding-top: 0.2em;"><b>Selected/changing</b> means the damage is calculated as if the <b>main</b> champion was on the level chosen by user (default 1) and the <b>target</b> champion's level changed from 1 to 18. For example 1 vs 1, 1 vs 2, 1 vs 3 and so on.</p>
            <p class="fakeList" style="padding-top: 0.2em;"><b>Changing/selected</b> means the damage is calculated as if the <b>main</b> champion's level changed from 1 to 18 and the <b>target</b> champion was on the level chosen by user (default 1). For examples 1 vs 1, 2 vs 1, 3 vs 1 and so on.</p><br/>
            <p>If you want to turn off the tooltips above graph settings buttons visit the <b>toggles</b> tab.</p>
         </div>
         <div class="infoContent" v-else-if="infoIndex === 3">
            <p>Unless it's heavily requested I won't put up the calculation formulas, since making them readable is going to take a lot of time (and most of them aren't pretty looking).</p><br/>
            <p>I verified the damage shown by the site and it seems to be almost <b>100% accurate</b> (in situations where all variables are accounted for), but if you notice something's not right visit the <b>about</b> tab to see where you can contact me.</p><br/>
            <p>To see what stuff I accounted for in calculations visit the <b>disclaimers</b> tab.</p><br/>
            <p><i>That being said you can look around the source code <a href="https://github.com/asasinmode/collector/" target="_blank">here</a>.</i></p>
         </div>
         <div class="infoContent" v-else-if="infoIndex === 4">
         <div class="infoToggleContainer line">
               <h3 class="centered">toggle ap/magic penetration/mana visibility</h3>
               <div class="infoToggleButtonContainer centered">
                  <button class="button infoToggleButton" @click="setApVisibility">
                     <div>on</div>
                     <div>off</div>
                     <div class="infoToggleButtonHighlight" :class="{on: apVisibility}" />
                  </button>
               </div>
               <p>Toggles the visibility of ability power and magic penetration on main champion and mana on target champion.</p>
            </div>
            <div class="infoToggleContainer line">
               <h3 class="centered">toggle item stats visibility</h3>
               <div class="infoToggleButtonContainer centered">
                  <button class="button infoToggleButton" @click="setItemStatsVisibility">
                     <div>on</div>
                     <div>off</div>
                     <div class="infoToggleButtonHighlight" :class="{on: itemStatsVisibility}" />
                  </button>
               </div>
               <p>Toggles the visibility of item stats in item overlay.</p>
            </div>
            <div class="infoToggleContainer line">
               <h3 class="centered">toggle graph settings tooltips</h3>
               <div class="infoToggleButtonContainer centered">
                  <button class="button infoToggleButton" @click="toggleShowModeTooltips">
                     <div>on</div>
                     <div>off</div>
                     <div class="infoToggleButtonHighlight" :class="{on: showModeTooltips}" />
                     <span v-if="showModeTooltips" class="showcaseTooltip">this button changes my visibility.</span>
                  </button>
               </div>
               <p>Toggles the visibility of graph settings tooltips.</p>
            </div>
            <div class="infoToggleContainer">
               <h3 class="centered">toggle item groups</h3>
               <div class="infoToggleButtonContainer centered">
                  <button class="button infoToggleButton" @click="setItemGroupsCheck">
                     <div>on</div>
                     <div>off</div>
                     <div class="infoToggleButtonHighlight" :class="{on: itemGroupsCheck}" />
                  </button>
               </div>
               <p>Makes item selection ignore <a href="https://leagueoflegends.fandom.com/wiki/Item_group#Item_restrictions_and_groups" target="_blank">item group</a> limitations normally present in-game. Calculations for items that aren't designed to be shipped together are most likely <b>incorrect</b>.</p>
            </div>
         </div>
         <div class="infoContent" v-else-if="infoIndex === 5">
            <p>If you notice something's not working correctly, have any feedback, feature requests or questions contact me on discord <b>asasinmode#0058</b>.</p><br/>
            <p>Also if you enjoy the app consider following me on <a href="https://twitter.com/asasinmode" target="_blank">Twitter</a> or <a href="https://www.twitch.tv/asasinmode" target="_blank">Twitch</a>.</p>
         </div>
      </div>
   </div>
   <championOverlay v-show="showChampionOverlay" @closeMe="showChampionOverlay = false" @selectChampion="selectChampion" :showDummy="!ownChampion" />
</template>

<script>
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { useMainStore } from "@/stores";
import championOverlay from "@/components/championOverlay.vue"

export default defineComponent({
   name: "championSelector",
   components: {
      championOverlay
   },
   data(){
      return{
         showInfoModal: false,
         showChampionOverlay: false,
         ownChampion: undefined,
         infoIndex: 0
      }
   },
   methods: {
      ...mapActions(useMainStore, ["setShowModeTooltips", "setItemGroupsCheck", "setApVisibility", "setMainChampion", "setTargetChampion", "setItemStatsVisibility"]),
      selectChampion(champion, isMain){
         if(champion === 'targetDummy'){
            this.setTargetChampion({champion: 'targetDummy'})
         } else{
            this[this.ownChampion ? isMain ? 'setMainChampion' : 'setTargetChampion' : isMain ? 'setTargetChampion' : 'setMainChampion']({champion: champion})
         }
      },
      openChampionOverlay(own){
         this.showChampionOverlay = true
         this.ownChampion = own
      },
      toggleShowModeTooltips(){
         this.setShowModeTooltips(!this.showModeTooltips)
      }
   },
   computed:{
      ...mapState(useMainStore, ["itemGroupsCheck", "showModeTooltips", "apVisibility", "patch", "itemStatsVisibility"])
   }
})
</script>

<style scoped>
.container{
   width: 100%;
   position: relative;
}
.selectButton, .infoIcon{
   height: 100%;
}
.selectButton{
   flex: 1;
   padding-block: 1.2em;
}
.infoIcon{
   background: var(--bg1);
   height: 3.6em;
   width: 3.6em;
   display: flex;
   justify-content: center;
   align-items: center;
   padding: 0 !important;
}
.infoButtonsContainer{
   display: flex;
   flex-wrap: wrap;
}
.infoButton{
   flex: 1;
   position: relative;
   z-index: 1;
}
.infoButton.selected::before{
   position: absolute;
   content: "";
   inset: 0;
   background: var(--highlight1);
   z-index: 0;
}
.infoContent{
   padding-inline: 1em;
   padding-bottom: 1em;
}
.infoToggleContainer:not(:last-child){
   padding-bottom: 1.5em;
}
.infoToggleButton{
   width: 100%;
   display: flex;
   flex-direction: row;
   position: relative;
   margin-block: 0.4em;
   max-width: 20rem;
}
.infoToggleButton > div{
   width: 50%;
}
.infoToggleButton > div:first-child{
   padding-right: 0.7em;
}
.infoToggleButton > div:nth-child(2){
   padding-left: 0.7em;
}
.infoToggleButtonHighlight{
   top: 0;
   left: 50%;
   width: 50%;
   height: 100%;
   background: var(--highlight1);
   position: absolute;
}
.infoToggleButtonHighlight.on{
   left: 0;
}
.showcaseTooltip{
   width: 10em;
   margin-left: -5em;
   font-size: 0.9rem;
}
.infoToggleButton:hover .showcaseTooltip{
   visibility: visible
}
.infoToggleContainer.line::after{
   bottom: 1em;
   left: 0;
   right: 0;
   background: var(--highlight2);
}
</style>