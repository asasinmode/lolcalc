<template>
   <div class="itemTooltip">
      <h3>{{ item.name }}</h3>
      <div class="itemGoldCostContainer">
         <img alt="gold icon" title="gold" :src="goldIconURL"><span class="goldCost">
            {{ item.gold }}
         </span>
      </div>
      <div class="itemStatContainer" v-for="(stat, name) in item.stats">
         <img :alt="`${ name } icon`" :title="name" :src="iconURL(stat.icon)">
         <span class="statValue">{{ stat.value }}</span> <span class="statName">{{ name }}</span>
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import goldIconURL from "@/assets/gold.webp"

export default defineComponent({
   name: "ItemStats",
   props: ["item"],
   data(){
      return {
         goldIconURL,
      }
   },
   methods: {
      iconURL(icon) {
         return new URL(`../../assets/statIcons/${ icon }.webp`, import.meta.url).href;
      }
   }
})
</script>

<style scoped>
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
@media (min-width: 58em){
   .itemTooltip{
      display: flex;
   }
}
</style>