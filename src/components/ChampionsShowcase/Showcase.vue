<template>
   <div class="container">
      <div class="championContainer main" v-if="main !== undefined">
         <Base :target="main.id" :isMain="true" />
         <ItemsLevelSelector :isMain="true" @openOverlay="handleItemOverlay" />
         <ItemsPreview v-if="mainItems.length > 0" :items="mainItems" />
         <CalculatedStats :isMain="true" :items="mainItems" />
      </div>
      <div class="championContainer target" v-if="target !== undefined && target !== 'targetDummy'">
         <Base :target="target.id" :isMain="false" />
         <ItemsLevelSelector :isMain="false" @openOverlay="handleItemOverlay" />
         <ItemsPreview v-if="targetItems.length > 0" :items="targetItems" />
         <CalculatedStats :isMain="false" />
      </div>
      <TargetDummyShowcase v-if="target === 'targetDummy'" />
   </div>
   <Teleport to="body">
      <ItemOverlay v-show="showItemOverlay" :isMain="isMainItemOverlay" @closeMe="showItemOverlay = false" />
   </Teleport>
</template>

<script>
import { defineComponent } from "vue";
import { mapState } from "pinia";
import { useMainStore } from "@/stores";
import Base from '@/components/ChampionsShowcase/Base.vue';
import ItemsLevelSelector from '@/components/ChampionsShowcase/ItemsLevelSelector.vue';
import CalculatedStats from '@/components/ChampionsShowcase/CalculatedStats.vue';
import TargetDummyShowcase from "@/components/ChampionsShowcase/TargetDummy.vue";
import ItemOverlay from "@/components/Overlays/Item.vue";
import ItemsPreview from "@/components/ChampionsShowcase/Items.vue";

export default defineComponent({
   name: 'Showcase',
   components: {
      Base,
      ItemsLevelSelector,
      CalculatedStats,
      TargetDummyShowcase,
      ItemOverlay,
      ItemsPreview,
   },
   data(){
      return{
         showItemOverlay: false,
         isMainItemOverlay: true
      }
   },
   methods:{
      handleItemOverlay(isMain){
         this.showItemOverlay = true
         this.isMainItemOverlay = isMain
      }
   },
   computed:{
      ...mapState(useMainStore, ["getMainChampion", "getTargetChampion", "getSelectedItems"]),
      main(){
         return this.getMainChampion
      },
      target(){
         return this.getTargetChampion
      },
      mainItems(){
         return this.getSelectedItems(true)
      },
      targetItems(){
         return this.getSelectedItems(false)
      }
   }
})
</script>

<style scoped>
.container{
   display: flex;
   flex-direction: row;
}
.championContainer{
   flex: 1 0 50%;
   max-width: 50%;
}
.main{
   background: hsla(120, 100%, 50%, 0.035);
}
.target{
   background: hsla(0, 100%, 50%, 0.035);
}
</style>