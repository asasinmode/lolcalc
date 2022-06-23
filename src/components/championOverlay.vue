<template>
   <div class="modalOverlay" @click.self="$emit('closeMe')">
      <div class="modalContainer" @keydown.esc="$emit('closeMe')">
         <div class="searchbarContainer centered">
            <input type="text" class="searchbar" v-model="textFilter" placeholder="search for champion..." />
         </div>
         <img v-if="showDummy" :src="dummyURL" @click="selectChampion('targetDummy', true)" loading="lazy" :class="{'target': target === 'targetDummy'}">
         <img v-for="champion in filteredChampions" :key="champion.key" @click="selectChampion(champion.id, true)" @click.right.prevent="selectChampion(champion.id, false)" :class="{'main': main?.id === champion.id, 'target': target?.id === champion.id}" :src="`http://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${champion.image.full}`" loading="lazy">
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapState } from "pinia";
import { useMainStore } from "@/stores";
import dummyURL from "../assets/targetDummy icon.webp"

export default defineComponent({
   name: "championOverlay",
   props: ['showDummy'],
   data(){
      return {
         textFilter: "",
         dummyURL
      }
   },
   methods: {
      selectChampion(champion, isMain){
         this.$emit('selectChampion', champion, isMain)
      }
   },
   computed: {
      ...mapState(useMainStore, ["patch", "champions", "getMainChampion", "getTargetChampion"]),
      sortedChampions(){
         return Object.keys(this.champions).map(key => {return {key: key, ...this.champions[key]}}).sort((a, b) => a.name > b.name ? 1 : -1)
      },
      main(){
         return this.getMainChampion
      },
      target(){
         return this.getTargetChampion
      },
      filteredChampions(){
         return this.textFilter != "" ? this.sortedChampions.filter(champion => {
            let rv = false
            rv = champion.name.toLowerCase().replace(/( |')/g, "").indexOf(this.textFilter.toLowerCase().replace(/( |')/g, "")) != -1
            champion.tags.forEach(tag => {
               rv = rv ? true : tag.toLowerCase().replace(/( |')/g, "").indexOf(this.textFilter.toLowerCase().replace(/( |')/g, "")) != -1
            })
            return rv
         }) : this.sortedChampions
      }
   }
})
</script>

<style scoped>
.modalContainer{
   overflow-y: auto;
   overflow-x: hidden;
}
.searchbar{
   width: 100%;
}
img{
   cursor: pointer;
   display: inline-block;
   width: calc((100% / 6));
   height: auto;
   padding-bottom: 0;
   margin-top: -0.25em;
   border-radius: 4px;
   filter:brightness(0.6);
}
img:hover{
   filter: brightness(1);
}
img.main, img.target{
   z-index: 1;
   position: relative;
   filter: brightness(1);
}
img.main{
   box-shadow: 0 0 0.75em 0.05em hsl(120, 100%, 50%);
}
img.target{
   box-shadow: 0 0 0.75em 0.05em hsl(0, 100%, 50%);
}
img.main.target{
   animation: both 750ms ease infinite alternate;
}
@keyframes both{
   0%{
      box-shadow: 0 0 0.75em 0.05em hsl(120, 100%, 50%);
   }
   100%{
      box-shadow: 0 0 0.75em 0.05em hsl(0, 100%, 50%);
   }
}
@media (min-width: 768px) {
   img{
      width: calc((100% / 8));
   }
   .modalContainer{
      width: 40em;
   }
}
</style>