<template>
   <Modal @closeMe="$emit('closeMe')" >
      <div class="searchbarContainer centered">
         <input type="text" class="searchbar" v-model="textFilter" placeholder="search for champion...">
      </div>
      <div class="imagesContainer">
         <button v-if="showDummy" @click="selectChampion('targetDummy', true)" :class="{ 'target': target === 'targetDummy' }">
            <img :src="dummyURL" loading="lazy">
         </button>
         <button v-for="champion in filteredChampions" :key="champion.key" :class="{ 'main': main?.id === champion.id, 'target': target?.id === champion.id }"
            @click="selectChampion(champion.id, true)" @click.right.prevent="selectChampion(champion.id, false)"
         >
            <img :alt="`${ champion.name } icon`" :title="champion.name" :src="`https://ddragon.leagueoflegends.com/cdn/${ patch }/img/champion/${ champion.image.full }`" loading="lazy">
         </button>
      </div>
   </Modal>
</template>

<script>
import { defineComponent } from "vue";
import { mapState } from "pinia";
import { useMainStore } from "@/stores";
import dummyURL from "@/assets/targetDummy icon.webp";
import Modal from "@/components/Misc/Modal.vue";

export default defineComponent({
   name: "championOverlay",
   props: ['showDummy'],
   components: { Modal },
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
         return Object.keys(this.champions).map(key => ({ key: key, ...this.champions[key] })).sort((a, b) => a.name > b.name ? 1 : -1)
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
.searchbar{
   width: 100%;
}
.imagesContainer{
   display: flex;
   flex-direction: row;
   flex-wrap: wrap;
   padding-inline: 1em;
}
button{
   border: none;
   background: transparent;
   position: relative;
   display: flex;
   vertical-align: middle;
   min-width: 3em;
   width: calc(100% / 6);
   aspect-ratio: 1;
   border-radius: 4px;
   padding: 0;
}
img{
   width: 100%;
   height: 100%;
   filter:brightness(0.6);
}
button:hover img, button.main img, button.target img{
   filter: brightness(1);
}
button.main, button.target{
   z-index: 1;
}
button.main{
   box-shadow: 0 0 0.75em 0.05em hsl(120, 100%, 50%);
}
button.target{
   box-shadow: 0 0 0.75em 0.05em hsl(0, 100%, 50%);
}
button.main.target{
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
   button {
      width: calc(100% / 8);
   }
}
</style>