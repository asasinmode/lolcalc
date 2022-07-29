<template>
   <div class="infoContent">
      <div class="centered"><strong style="color: hsl(0, 100%, 45%);">Not everything that's present in the game is accounted for in calculations.</strong></div><br/>
      <p>I'm a student and at the moment I can't afford to put in the time and work that's required to make this a 100% accurate simulation of a game as complicated as League.</p>
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
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
   name: "Disclaimers",

})
</script>

<style scoped>

</style>