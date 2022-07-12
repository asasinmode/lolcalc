<template>
   <div class="modalOverlay" @click.self="$emit('closeMe')">
      <div class="modalContainer" @keydown.esc="$emit('closeMe')">
         <div class="searchbarContainer centered">
            <input type="text" class="searchbar" v-model="textFilter" placeholder="search for item..." />
         </div>
         <div class="imagesContainer">
            <button class="itemImageContainer" v-for="item in filteredItems" :key="item.id" @click="selectItem(item.id, isMain)" @click.right.prevent="selectItem(item.id, !isMain)" :class="{selected: selectedItems(isMain).includes(item.id)}"  @mouseover="hoveredItem = item" @mouseout="hoveredItem = undefined">
               <img :title="item.name" :src="`https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${item.image.full}`" loading="lazy">
            </button>
         </div>
      </div>
      <div class="itemTooltip" v-if="hoveredItem && itemStatsVisibility">
         <h3>{{prettifiedHoveredItem.name}}</h3>
         <div class="itemGoldCostContainer">
            <img :src="goldIconURL"><span class="goldCost">{{prettifiedHoveredItem.gold}}</span>
         </div>
         <div class="itemStatContainer" v-for="(stat, name) in prettifiedHoveredItem.stats">
            <img :src="iconURL(stat.icon)"><span class="statValue">{{stat.value}}</span> <span class="statName">{{name}}</span>
         </div>
      </div>
   </div>
</template>

<script>
import goldIconURL from "../assets/gold.webp"
import { defineComponent } from "vue";
import { mapActions, mapState } from "pinia";
import { useMainStore } from "@/stores";

export default defineComponent({
   name: 'itemOverlay',
   emits: ['closeMe'],
   props: ['isMain'],
   data(){
      return {
         goldIconURL,
         selected: [],
         itemGroups: [],
         textFilter: "",
         hoveredItem: undefined,
         statRenames: {
            FlatHPPoolMod: {name: 'health', icon: 'health'},
            FlatMPPoolMod: {name: 'mana', icon: 'mana'},
            FlatMovementSpeedMod: {name: 'move speed', icon: 'movementSpeed'},
            FlatMagicDamageMod: {name: 'ability power', icon: 'abilityPower'},
            FlatPhysicalDamageMod: {name: 'attack damage', icon: 'attackDamage'},
            FlatCritChanceMod: {name: 'critical strike chance', icon: 'criticalStrike'},
            FlatArmorMod: {name: 'armor', icon: 'armor'},
            FlatSpellBlockMod: {name: 'magic resists', icon: 'magicResists'},
            PercentAttackSpeedMod: {name: 'attack speed', icon: 'attackSpeed'},
            PercentLifeStealMod: {name: 'life steal', icon: 'lifesteal'},
            PercentMovementSpeedMod: {name: 'move speed', icon: 'movementSpeed'},
            FlatArmorPenetrationMod: {name: 'lethality', icon: 'armorPenetration'},
            PercentageArmorPenetrationMod: {name: 'armor penetration', icon: 'armorPenetration'},
            FlatMagicPenetrationMod: {name: 'magic penetration', icon: 'magicPenetration'},
            PercentageMagicPenetrationMod: {name: 'magic penetration', icon: 'magicPenetration'}
         }
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
            if(this.itemGroupsCheck){this.itemGroups.forEach(group => {
               if(group.includes(itemName) && tempCopy.some(item => group.includes(item))){
                  tempCopy = tempCopy.filter(item => !group.includes(item))
               }
            })}
            tempCopy.push(itemName)

            if(tempCopy.length > 6){
               tempCopy.shift()
            }
         }
         this.setItems({isMain: isForMe, items: tempCopy})
      },
      iconURL(icon) {
         return new URL(`../assets/statIcons/${icon}.webp`, import.meta.url).href;
      }
   },
   computed: {
      ...mapState(useMainStore, ["patch", "mythics", "allItems", "itemGroupsCheck", "itemStatsVisibility", "getSelectedItems", "getTargetChampion", "getItem", "filterArmorPenItems"]),
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
      },
      prettifiedHoveredItem(){
         return {
            name: this.hoveredItem.name,
            gold: this.hoveredItem.gold.total,
            stats: Object.keys(this.hoveredItem.stats).filter(key => !['FlatHPRegenMod'].includes(key)).reduce((obj, key) => {
            const originalStat = this.hoveredItem.stats[key]
            const convertedStat = originalStat < 1 && originalStat > 0 ? `${~~(originalStat * 100)}%` : originalStat
            return {
               ...obj,
               [this.statRenames[key].name]: {value: convertedStat, icon: this.statRenames[key].icon}
            }
         }, {})
         }
      }
   }
})
</script>

<style scoped>
.modalContainer{
   display: flex;
   flex-direction: column;
   padding: 1em;
}
.imagesContainer{
   display: flex;
   flex-direction: row;
   flex-wrap: wrap;
}
button{
   border: none;
   background: transparent;
   position: relative;
   display: inline-block;
   vertical-align: middle;
   min-width: 3em;
   width: calc((100% / 6) - 0.2em);
   aspect-ratio: 1;
   margin: 0.1em;
   padding: 0;
}
.imagesContainer img{
   border-radius: 4px;
   width: 100%;
   height: 100%;
   filter:brightness(0.6);
}
.imagesContainer button:hover img{
   filter: brightness(1);
}
button.selected{
   z-index: 1;
}
button.selected img{
   filter: brightness(1);
   outline: 2px solid var(--accent1);
}
.searchbar{
   width: 100%;
}
.itemTooltip{
   display: none;
   position: absolute;
   left: 50%;
   top: 2.5em;
   max-width: calc(((100% - 41em) / 2) - 0.5em);
   transform: translate(calc(-100% - 20.5em), 0);
   z-index: 10;
   background: var(--bg1);
   padding: 0.5em;
   flex-direction: column;
}
.itemTooltip h3{
   color: var(--accent1);
}
.itemStatContainer, .itemGoldCostContainer{
   margin-top: 0.1em;
   display: flex;
   flex-direction: row;
   align-items: center;
}
.itemStatContainer > span, .itemGoldCostContainer span{
   margin-left: 0.25em;
}
.itemGoldCostContainer span{
   color: hsl(60, 90%, 50%);
   font-weight: 700;
}
.itemStatContainer .statName{
   color: var(--main2);
}
.itemTooltip img{
   margin-right: 0.1em;
}
@media (min-width: 768px) {
   button{
      width: calc((100% / 8) - 0.2em);
   }
}
@media (min-width: 58em){
   .itemTooltip{
      display: flex;
   }
}
</style>