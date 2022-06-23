<template>
   <div class="baseChampionInfoContainer">
      <header class="centered">
         <h1>{{champion.name}}</h1>
         <img :src="`http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`" >
      </header>
      <main class="centered line">
         <h3>base stats</h3>
         <section class="baseStats">
            <div class="baseStatContainer centered" v-for="(stat, name) in filteredStats" :key="stat.id">
               <label><img :src="iconURL(name)">{{name}}</label>
               <div class="baseStat">
                  {{stat.value}} (+{{stat.growth}})
               </div>
            </div>
         </section>
      </main>
   </div>
</template>

<script>
import { mapState } from "pinia";
import { useMainStore } from "@/stores";
import { defineComponent } from "vue";

export default defineComponent({
   name: "baseChampionInfo",
   props: ["target", "isMain"],
   methods: {
      iconURL(icon) {
         return new URL(`../assets/statIcons/${icon}.webp`, import.meta.url).href;
      }
   },
   computed: {
      ...mapState(useMainStore, ["getChampion"]),
      champion() {
         return this.getChampion(this.target);
      },
      baseStats() {
         return {
            attackDamage: this.isMain ? {
               value: this.champion.stats.attackdamage,
               growth: this.champion.stats.attackdamageperlevel,
            } : undefined,
            health: this.isMain ? undefined : {
               value: this.champion.stats.hp,
               growth: this.champion.stats.hpperlevel,
            },
            armor: this.isMain ? undefined : {
               value: this.champion.stats.armor,
               growth: this.champion.stats.armorperlevel,
            },
            magicResists: this.isMain ? undefined : {
               value: this.champion.stats.spellblock,
               growth: this.champion.stats.spellblockperlevel
            },
            attackSpeed: this.isMain ? {
               value: this.champion.stats.attackspeed,
               growth: this.champion.id === "Jhin" ? 3 : this.champion.stats.attackspeedperlevel
            } : undefined
         };
      },
      filteredStats() {
         return Object.keys(this.baseStats).filter(key => {
            return this.baseStats[key] != undefined;
         }).reduce((obj, key) => { return { ...obj, [key]: this.baseStats[key] }; }, {});
      }
   }
})
</script>

<style scoped>
</style>