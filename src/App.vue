<template>
   <SelectChampions />
   <ChampionsShowcase />
   <results v-if="showResults" />
</template>

<script>
import { defineComponent } from "vue";
import { mapActions, mapState } from "pinia";
import { useMainStore } from "@/stores";
import SelectChampions from "@/components/SelectChampions.vue"; import ChampionsShowcase from '@/components/ChampionsShowcase.vue'; import results from '@/components/results.vue'

export default defineComponent({
   name: 'App',
   components: {
      SelectChampions, ChampionsShowcase, results
   },
   mounted(){
      if(localStorage.getItem('tooltipsVisibility') != "null"){
         this.setShowModeTooltips(localStorage.getItem('tooltipsVisibility'))
      } else{
         localStorage.setItem('tooltipsVisibility', this.showModeTooltips)
      }
   },
   methods: {
      ...mapActions(useMainStore, ["setShowModeTooltips"])
   },
   computed: {
      ...mapState(useMainStore, ["getMainChampion", "getTargetChampion", "getCalculatedStats", "showModeTooltips", "patch"]),
      showResults(){
         return this.areChampionsDefined && this.areStatsCalculated
      },
      areChampionsDefined(){
         return this.getMainChampion !== undefined && this.getTargetChampion !== undefined
      },
      areStatsCalculated(){
         return this.getCalculatedStats(true)[0]?.stats.attackDamage !== undefined && this.getCalculatedStats(false).armor !== undefined
      }
   }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
:root{
   --bg1: hsl(0, 0%, 0%);
   --main1: hsl(0, 0%, 100%);
   --main2: hsl(0, 0%, 80%);
   --accent1: hsla(265, 100%, 65%, 1);
   --highlight1: hsla(0, 100%, 100%, 0.1);
   --highlight2: hsla(0, 100%, 100%, 0.25);
   --lowlight1: hsla(0, 0%, 0%, 0.3);
   --border-inactive: hsl(0, 0%, 75%);
   --border-active: hsl(0, 0%, 100%);
}
*, *::before, *::after{
   font-family: 'Roboto', sans-serif;
   box-sizing: border-box;
   margin: 0;
   padding: 0;
   transition: all 100ms ease;
   color: var(--main1);
   -webkit-tap-highlight-color: transparent;
}
html, body{
   width: 100%;
   height: 100%;
   overflow-x: hidden;
   overflow-y: auto;
}
body{
   background: var(--bg1);
   background-attachment: fixed;
}
#app{
   display: flex;
   flex-direction: column;
   width: 100%;
}
a{
   text-decoration: underline;
   color: var(--main2);
}
a:hover{
   color: var(--main1);
}
p{
   line-height: 1.35;
   text-align: justify;
   hyphens: auto;
}
p.indent{
   text-indent: 2em;
}
.centered{
   display: flex;
   justify-content: center;
   align-items: center;
}
.button{
   background: transparent;
   border: none;
   padding: 0.7em;
   font-weight: 700;
   font-size: 1em;
}
button{
   cursor: pointer;
}
.button:hover{
   background: var(--highlight1);
   border-color: var(--border-active);
}
.button:active{
   background: var(--highlight2);
}
.itemTooltip, .modalContainer{
   box-shadow: 0 0 0.25em 0 var(--highlight1), 0 0 0.75em 0 var(--highlight2);
}
.line{
   position: relative;
}
.line::after{
   content: '';
   position: absolute;
   left: 10%;
   right: 10%;
   bottom: 0.4em;
   height: 2px;
   background: var(--main2);
   border-radius: 4px;
}
.levelTooltip, .strikeTooltip, .itemPreview span, .showcaseTooltip{
   position: absolute;
   visibility: hidden;
   padding-block: 0.2em;
   padding-inline: 0.35em;
   z-index: 1;
   background: var(--bg1);
   color: var(--main1);
   text-align: center;
   bottom: 120%;
   left: 50%;
   border-radius: 4px;
   box-shadow: 0 0 0.25em 0 var(--highlight1), 0 0 0.75em 0 var(--highlight2);
}
.levelTooltip::after, .strikeTooltip::after, .itemPreview span::after, .showcaseTooltip::after{
   content: " ";
   position: absolute;
   top: 100%;
   left: 50%;
   margin-left: -5px;
   border-width: 5px;
   border-style: solid;
   border-color: var(--bg1) transparent transparent transparent;
}
.fakeList{
   position: relative;
   padding-left: 2em;
}
.fakeList::before{
   content: "";
   position: absolute;
   top: 0.6em;
   left: 1.3em;
   width: 5px;
   height: 5px;
   border-radius: 50%;
   background: var(--accent1);
}
.searchbarContainer{
   padding: 1em;
}
.searchbar{
   background: transparent;
   color: var(--main1);
   border: 1.5px solid var(--main2);
   border-radius: 4px;
   padding: 0.5em 0.5em 0.55em 0.5em;
}
.searchbar:hover{
   border-color: var(--main1);
}
.searchbar:focus{
   border-color: var(--main1);
   outline: 0.25px solid var(--main1);
}
.baseChampionInfoContainer{
   width: 100%;
}
.baseChampionInfoContainer header{
   flex-direction: column;
   margin-bottom: 1em;
}
.baseChampionInfoContainer h1, h3{
   text-align: center;
}
.baseChampionInfoContainer header img{
   width: 100%;
   height: auto;
   border-radius: 4px;
}
.baseChampionInfoContainer main{
   flex-direction: column;
   padding-bottom: 1em;
}
.baseChampionInfoContainer main h3{
   margin-bottom: 0.25em;
}
.baseChampionInfoContainer .baseStats{
   display: flex;
   flex-direction: column;
}
.baseChampionInfoContainer .baseStatContainer{
   flex-direction: column;
   padding-bottom: 0.5em;
}
.baseChampionInfoContainer .baseStatContainer label, .statInputContainer label{
   display: flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   color: var(--accent1);
   padding-bottom: 0.2em;
}
.baseStatContainer label img, .statInputContainer label img, .itemTooltip img{
   width: 17px;
   height: 17px;
}
.baseStatContainer label img, .statInputContainer label img{
margin-right: 0.5em;
}
@media (min-width: 768px) {
   .modalContainer{
      max-width: 40rem;
      max-height: 30rem;
   }
   .baseChampionInfoContainer header img{
      width: 50%;
   }
   .baseChampionInfoContainer .baseStats{
      flex-direction: row;
   }
   .baseStatContainer{
      margin-inline: 1em;
   }
}
</style>