<template>
   <div class="modalOverlay" @click.self="$emit('closeMe')">
      <div class="modalContainer" @keydown.esc="$emit('closeMe')">
         <div class="searchbarContainer centered">
            <input type="text" class="searchbar" v-model="textFilter" placeholder="search for item..." />
         </div>
         <img v-for="item in filteredItems" :key="item.id" @click="selectItem(item.id, isMain)" @click.right.prevent="selectItem(item.id, !isMain)" :title="item.name" :class="{selected: selectedItems(isMain).includes(item.id)}" :src="`http://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${item.image.full}`" loading="lazy">
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapActions, mapState } from "pinia";
import { useMainStore } from "@/stores";

export default defineComponent({
   name: 'itemOverlay',
   emits: ['closeMe'],
   props: ['isMain'],
   data(){
      return {
         selected: [],
         itemGroups: [],
         textFilter: ""
      }
   },
   mounted(){
      this.itemGroups = [
         [...this.mythics, "3802", "4635", "6029", "6660", "6670"],  // mythics
         ["1001", "2422", "3006", "3009", "3020", "3047", "3111", "3117", "3158"],  // boots
         ["3031", "3124", "6677"],  // crit modifiers
         ["1082", "3041"], // glory
         ["2051", "3112", "3177", "3184"],   // guardian
         ["3074", "3077", "3748"],  // hydra
         ["3850", "3851", "3853", "3854", "3855", "3857", "3858", "3859", "3860", "3862", "3863", "3864"],  // support
         ["3035", "3036", "6694"],  // last whisper
         ["3053", "3155", "3156", "6673"],   // lifeline
         ["3003", "3004", "3040", "3042", "3070", "3119", "3121"], // mana charge
         ["3139", "3140", "6035"],  // quicksilver
         ["3135", "4630"]  // void pen
      ]
   },
   methods: {
      ...mapActions(useMainStore, ["setItems"]),
      selectedItems(isMain){
         return this.getSelectedItems(isMain)
      },
      selectItem(itemName, isForMe){
         if(this.isMain && this.getTargetChampion === "targetDummy" && !isForMe){
            return
         }
         let tempCopy = [...this.selectedItems(isForMe)]
         if(tempCopy.includes(itemName)){
            tempCopy = tempCopy.filter(item => item != itemName)
         } else{
            tempCopy.push(itemName)

            if(this.itemGroupsCheck){this.itemGroups.forEach(group => {
               if(tempCopy.filter(item => group.includes(item)).length > 1){
                  tempCopy.some(item => {
                     if(group.includes(item)){
                        tempCopy = tempCopy.filter(element => element !== item);
                        return
                     }
                  })
               }
            })}

            if(tempCopy.length > 6){
               tempCopy.shift()
            }
         }
         this.setItems({isMain: isForMe, items: tempCopy})
      },
   },
   computed: {
      ...mapState(useMainStore, ["patch", "mythics", "allItems", "itemGroupsCheck", "getSelectedItems", "getTargetChampion"]),
      sortedItems(){
         return Object.keys(this.allItems).map(key => {return {id: key, ...this.allItems[key]}}).sort((a, b) => a.gold.total - b.gold.total)
      },
      filteredItems(){
         return this.textFilter != "" ? this.sortedItems.filter(item => {
            let rv = false
            rv = item.name.toLowerCase().replace(/( |')/g, "").indexOf(this.textFilter.toLowerCase().replace(/( |')/g, "")) != -1
            item.tags.forEach(tag => {
               rv = rv ? true : tag.toLowerCase().replace(/( |')/g, "").indexOf(this.textFilter.toLowerCase().replace(/( |')/g, "")) != -1
            })
            return rv
         }
         ) : this.sortedItems
      }
   }
})
</script>

<style scoped>
.modalContainer{
   overflow-y: auto;
   overflow-x: hidden;
}
img{
   cursor: pointer;
   display: inline-block;
   width: calc((100% / 6) - 0.2em);
   height: auto;
   margin: 0.1em;
   margin-block: 0;
   padding-bottom: 0;
   border-radius: 4px;
   filter:brightness(0.6);
}
img:hover{
   filter: brightness(1);
}
img.selected{
   z-index: 1;
   position: relative;
   filter: brightness(1);
   outline: 2px solid var(--accent1);
}
.searchbar{
   width: 100%;
}
@media (min-width: 768px) {
   img{
      width: calc((100% / 8) - 0.2em);
   }
   .modalContainer{
      width: 40em;
   }
}
</style>