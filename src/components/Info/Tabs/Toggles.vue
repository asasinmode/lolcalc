<template>
   <div class="infoContent">
   <div class="infoToggleContainer line">
         <h3 class="centered">toggle ap/magic penetration/mana visibility</h3>
         <div class="infoToggleButtonContainer centered">
            <button class="button infoToggleButton" @click="setApVisibility">
               <div>on</div>
               <div>off</div>
               <div class="infoToggleButtonHighlight" :class="{ on: apVisibility }" />
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
               <div class="infoToggleButtonHighlight" :class="{ on: itemStatsVisibility }" />
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
               <div class="infoToggleButtonHighlight" :class="{ on: showModeTooltips }" />
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
               <div class="infoToggleButtonHighlight" :class="{ on: itemGroupsCheck }" />
            </button>
         </div>
         <p>Makes item selection ignore <a href="https://leagueoflegends.fandom.com/wiki/Item_group#Item_restrictions_and_groups" target="_blank">item group</a> limitations normally present in-game. Calculations for items that aren't designed to be shipped together are most likely <b>incorrect</b>.</p>
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { useMainStore } from "@/stores/index.js";

export default defineComponent({
   name: "Toggles",
   methods: {
      ...mapActions(useMainStore, ["setShowModeTooltips", "setItemGroupsCheck", "setApVisibility", "setMainChampion", "setTargetChampion", "setItemStatsVisibility"]),
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

</style>