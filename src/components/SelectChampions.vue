<template>
   <header class="container centered">
      <button class="button selectButton" @click="openChampionOverlay(true)">select champion</button>
      <button class="button infoIcon" @click="showInfo = true" title="info">
         <FontAwesomeIcon icon="info-circle" size="2xl" />
      </button>
      <button class="button selectButton" @click="openChampionOverlay(false)">select target</button>
   </header>
   <Teleport to="body">
      <Info v-show="showInfo" @closeMe="showInfo = false" />
      <ChampionOverlay v-show="showChampionOverlay" @closeMe="showChampionOverlay = false" @selectChampion="selectChampion" :showDummy="!ownChampion" />
   </Teleport>
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "../stores";
import { mapActions } from "pinia";
import ChampionOverlay from "@/components/Overlays/Champion.vue";
import Info from "@/components/Info/Info.vue";

export default defineComponent({
   name: "SelectChampions",
   components: { ChampionOverlay, Info },
   data(){
      return{
         showInfo: false,
         showChampionOverlay: false,
         ownChampion: undefined
      }
   },
   methods: {
      ...mapActions(useMainStore, ["setMainChampion", "setTargetChampion"]),
      selectChampion(champion, isMain){
         if(champion === 'targetDummy'){
            this.setTargetChampion({ champion: 'targetDummy' })
         } else{
            this[this.ownChampion ? isMain ? 'setMainChampion' : 'setTargetChampion' : isMain ? 'setTargetChampion' : 'setMainChampion']({ champion: champion })
         }
      },
      openChampionOverlay(own){
         this.showChampionOverlay = true
         this.ownChampion = own
      }
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
</style>