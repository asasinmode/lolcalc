<template>
   <div class="itemsPreviewContainer">
      <div class="itemPreview" v-for="itemName in items" :key="itemName.id" :class="{ passive: passives.find(passive => passive.id === itemName) }">
         <img :src="`https://ddragon.leagueoflegends.com/cdn/${ patch }/img/item/${ item(itemName).image.full }`" :title="item(itemName).name"/>
         <span v-if="passives.find(passive => passive.id === itemName)">
            {{ passive(itemName).description }}
         </span>
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "@/stores";
import { mapState } from "pinia";

export default defineComponent({
   name: "ItemsPreview",
   props: ["items"],
   methods: {
      passive(item){
         return this.passives.find(passive => passive.id === item)
      },
      item(name){
         return this.getItem(name)
      }
   },
   computed: {
      ...mapState(useMainStore, ["patch", "passives", "getItem"])
   }
})
</script>

<style scoped>
.itemsPreviewContainer{
   display: flex;
   justify-content: center;
   flex-wrap: wrap;
   padding-block: 1em;
}
.itemPreview{
   position: relative;
}
.itemPreview.passive::after{
   content: 'P';
   font-size: 12px;
   font-weight: 700;
   justify-content: center;
   align-items: center;
   display: flex;
   width: 1.2em;
   height: 1.2em;
   color: var(--main1);
   border-radius: 0 0 0 4px;
   background: var(--bg1);
   right: 0;
   top: 0;
   position: absolute;
}
.itemPreview span{
   width: 9rem;
   margin-left: -4.5rem;
}
.itemPreview:hover span{
   visibility: visible;
}
@media (min-width: 768px) {
   .itemPreview span{
      width: 14rem;
      margin-left: -7rem;
   }
}
</style>
