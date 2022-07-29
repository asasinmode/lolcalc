<template>
   <div class="infoContent">
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
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
   name: "Graph"
})
</script>

<style scoped>

</style>