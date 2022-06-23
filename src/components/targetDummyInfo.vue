<template>
<div class="championContainer target">
   <div class="baseChampionInfoContainer">
      <header class="centered">
         <h1>Target Dummy</h1>
         <img :src="dummyURL">
      </header>
      <main class="centered line">
         <h3>base stats</h3>
         <section class="baseStats">
            <div class="baseStatContainer centered" v-for="(stat, name) in defaultStats" :key="stat.id">
               <label><img :src="iconURL(name)">{{name}}</label>
               <div class="baseStat">
                  {{stat.value}}
               </div>
            </div>
         </section>
      </main>
   </div>
   <article class="targetDummyStatInputsContainer">
      <div class="statInputContainer">
         <label for="dummyHealthInput"><img :src="iconURL('health')">health</label>
         <input id="dummyHealthInput" type="number" class="searchbar" v-model="customStats.health" placeholder="health" @input="handleStatsChange" />
      </div>
      <div class="statInputContainer">
         <label for="dummyArmorInput"><img :src="iconURL('armor')">armor</label>
         <input id="dummyArmorInput" type="number" class="searchbar" v-model="customStats.armor" placeholder="armor" @input="handleStatsChange" />
      </div>
      <div class="statInputContainer">
         <label for="dummyMagicResistsInput"><img :src="iconURL('magicResists')">magicResists</label>
         <input id="dummyMagicResistsInput" type="number" class="searchbar" v-model="customStats.magicResists" placeholder="magic resists" @input="handleStatsChange" />
      </div>
   </article>
</div>
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "../stores";
import { mapActions } from "pinia";
import dummyURL from "../assets/targetDummy splash.webp"

export default defineComponent({
   name: "targetDummyInfo",
   data(){
      return {
         dummyURL,
         defaultStats: {
            health: {
               value: 1000
            },
            armor: {
               value: 0
            },
            magicResists: {
               value: 0
            },
         },
         customStats: {
            health: 1000,
            armor: 0,
            magicResists: 0
         }
      }
   },
   mounted(){
      this.handleStatsChange()
   },
   methods: {
      ...mapActions(useMainStore, ["setCalculatedStats", "setItems"]),
      iconURL(icon) {
         return new URL(`../assets/statIcons/${icon}.webp`, import.meta.url).href;
      },
      handleStatsChange(){
         const transformedHealth = this.customStats.health.length === 0 ? 0 : this.customStats.health
         const transformedArmor = this.customStats.armor.length === 0 ? 0 : this.customStats.armor
         const transformedMagicResists = this.customStats.magicResists.length === 0 ? 0 : this.customStats.magicResists
         const healthArray = Array(18).fill(transformedHealth)
         const armorArray = Array(18).fill(transformedArmor)
         const magicResistsArray = Array(18).fill(transformedMagicResists)
         this.setItems({isMain: false, items: []})
         this.setCalculatedStats({stats: {health: healthArray, armor: armorArray, magicResists: magicResistsArray}, isMain: false})
      }
   }
})
</script>

<style scoped>
.targetDummyStatInputsContainer{
   width: 100%;
   display: flex;
   justify-content: space-evenly;
   align-items: center;
   flex-direction: column;
   padding: 0.7em;
}
.statInputContainer{
   margin-bottom: 1rem;
   display: flex;
   justify-content: center;
   align-items: center;
   flex-direction: column;
}
@media(min-width: 768px){
   .targetDummyStatInputsContainer{
      flex-direction: row;
      flex-wrap: wrap;
   }
}
</style>