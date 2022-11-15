<template>
   <Modal @closeMe="$emit('closeMe')">
      <div class="searchbarContainer centered">
         <input type="text" class="searchbar" v-model="textFilter" placeholder="search for item...">
      </div>
      <div class="imagesContainer">
         <button class="itemImageContainer" v-for="item in filteredItems" :key="item.id" :class="{ selected: selectedItems(isMain).includes(item.id) }"
            @click="selectItem(item.id, isMain)" @click.right.prevent="selectItem(item.id, !isMain)" @mouseover="hoveredItem = item" @mouseout="hoveredItem = undefined"
         >
            <img :alt="`${ item.name } icon`" :title="item.name" :src="`https://ddragon.leagueoflegends.com/cdn/${ patch }/img/item/${ item.image.full }`" loading="lazy">
         </button>
      </div>
      <Teleport to="body">
         <ItemStats v-if="hoveredItem && itemStatsVisibility" :item="prettifiedHoveredItem" />
      </Teleport>
   </Modal>
</template>

<script>
import { defineComponent } from "vue";
import { mapActions, mapState } from "pinia";
import { useMainStore } from "@/stores";
import Modal from "@/components/Misc/Modal.vue";
import ItemStats from "./ItemStats.vue";

export default defineComponent({
   name: "itemOverlay",
   components: { Modal, ItemStats },
   props: ["isMain"],
   data() {
      return {
         selected: [],
         itemGroups: [],
         textFilter: "",
         hoveredItem: undefined,
         statRenames: {
            FlatHPPoolMod: { name: "health", icon: "health" },
            FlatMPPoolMod: { name: "mana", icon: "mana" },
            FlatMovementSpeedMod: { name: "move speed", icon: "movementSpeed" },
            FlatMagicDamageMod: { name: "ability power", icon: "abilityPower" },
            FlatPhysicalDamageMod: { name: "attack damage", icon: "attackDamage" },
            FlatCritChanceMod: { name: "critical strike chance", icon: "criticalStrike" },
            FlatArmorMod: { name: "armor", icon: "armor" },
            FlatSpellBlockMod: { name: "magic resists", icon: "magicResists" },
            PercentAttackSpeedMod: { name: "attack speed", icon: "attackSpeed" },
            PercentLifeStealMod: { name: "life steal", icon: "lifesteal" },
            PercentMovementSpeedMod: { name: "move speed", icon: "movementSpeed" },
            FlatArmorPenetrationMod: { name: "lethality", icon: "armorPenetration" },
            PercentageArmorPenetrationMod: { name: "armor penetration", icon: "armorPenetration" },
            FlatMagicPenetrationMod: { name: "magic penetration", icon: "magicPenetration" },
            PercentageMagicPenetrationMod: { name: "magic penetration", icon: "magicPenetration" }
         }
      };
   },
   mounted() {
      this.itemGroups = [
         [...this.mythics, 3802, 4635, 6029, 6660, 6670],  // mythics and their components
         [1001, 2422, 3006, 3009, 3020, 3047, 3111, 3117, 3158],  // boots
         [3031, 3124, 6677],  // crit modifiers
         [1082, 3041], // dark seal and mejai
         [2051, 3112, 3177, 3184],  // aram starting items
         [3074, 3077, 3748],  // tiamat
         [3850, 3851, 3853, 3854, 3855, 3857, 3858, 3859, 3860, 3862, 3863, 3864],  // support items
         [3035, 3036, 6694],  // armor pen
         [3053, 3155, 3156, 6673],  //lifeline
         [3003, 3004, 3040, 3042, 3070, 3119, 3121],   // tear items
         [3139, 3140, 6035],  // qss
         [3135, 4630] // magic pen
      ];
   },
   methods: {
      ...mapActions(useMainStore, ["setItems"]),
      selectedItems(isMain) {
         return this.getSelectedItems(isMain);
      },
      selectItem(itemId, isForMe) {
         const id = parseInt(itemId)
         
         if (this.isMain && this.getTargetChampion === "targetDummy" && !isForMe) {
            return;
         }

         let tempCopy = [...this.selectedItems(isForMe)];

         if (tempCopy.includes(id)) {
            tempCopy = tempCopy.filter(item => item != id);
         } else {
            if (this.itemGroupsCheck) {
               this.itemGroups.forEach(group => {
                  if (group.includes(id) && tempCopy.some(item => group.includes(item))) {
                        tempCopy = tempCopy.filter(item => !group.includes(item));
                  }
               });
            }

            tempCopy.push(id);

            if (tempCopy.length > 6) {
               tempCopy.shift();
            }
         }
         this.setItems({ isMain: isForMe, items: tempCopy });
      }
   },
   computed: {
      ...mapState(useMainStore, ["patch", "mythics", "allItems", "itemGroupsCheck", "itemStatsVisibility", "getSelectedItems", "getTargetChampion", "getItem"]),
      sortedItems() {
         return Object.keys(this.allItems).map(key => ({ id: key, ...this.allItems[key] })).sort((a, b) => a.gold.total - b.gold.total);
      },
      filteredItems() {
         return this.textFilter != "" ? this.sortedItems.filter(item => {
            let rv = false;
            rv = item.name.toLowerCase().replace(/( |')/g, "").indexOf(this.textFilter.toLowerCase().replace(/( |')/g, "")) != -1;
            item.tags.forEach(tag => {
               rv = rv ? true : tag.toLowerCase().replace(/( |')/g, "").indexOf(this.textFilter.toLowerCase().replace(/( |')/g, "")) != -1;
            });
            return rv;
         }) : this.sortedItems;
      },
      prettifiedHoveredItem() {
         return {
            name: this.hoveredItem.name,
            gold: this.hoveredItem.gold.total,
            stats: Object.keys(this.hoveredItem.stats).filter(key => !["FlatHPRegenMod"].includes(key)).reduce((obj, key) => {
               const originalStat = this.hoveredItem.stats[key];
               const convertedStat = originalStat < 1 && originalStat > 0 ? `${ ~~(originalStat * 100) }%` : originalStat;
               return {
                  ...obj,
                  [this.statRenames[key].name]: { value: convertedStat, icon: this.statRenames[key].icon }
               };
            }, {})
         };
      }
   }
})
</script>

<style scoped>
.imagesContainer{
   display: flex;
   flex-direction: row;
   flex-wrap: wrap;
   padding-inline: 1em;
   padding-bottom: 1em;
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
@media (min-width: 768px) {
   button{
      width: calc((100% / 8) - 0.2em);
   }
}
</style>
