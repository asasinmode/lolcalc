<template>
   <Modal @closeMe="$emit('closeMe')" >
      <div class="infoButtonsContainer">
         <button class="button infoButton" :class="{ selected: infoIndex === 0 }" @click="infoIndex = 0">general</button>
         <button class="button infoButton" :class="{ selected: infoIndex === 1 }" @click="infoIndex = 1">disclaimers</button>
         <button class="button infoButton" :class="{ selected: infoIndex === 2 }" @click="infoIndex = 2">graph</button>
         <button class="button infoButton" :class="{ selected: infoIndex === 3 }" @click="infoIndex = 3">formulas</button>
         <button class="button infoButton" :class="{ selected: infoIndex === 4 }" @click="infoIndex = 4">toggles</button>
         <button class="button infoButton" :class="{ selected: infoIndex === 5 }" @click="infoIndex = 5">about</button>
      </div>
      <General v-if="infoIndex === 0" />
      <Disclaimers v-else-if="infoIndex === 1" />
      <Graph v-else-if="infoIndex === 2" />
      <Formulas v-else-if="infoIndex === 3" />
      <Toggles v-else-if="infoIndex === 4" />
      <div class="infoContent" v-else>
         <p>If you notice something's not working correctly, have any feedback, feature requests or questions contact me on discord <b>asasinmode#0058</b> or <a href="https://twitter.com/asasinmode" target="_blank">Twitter</a>.</p><br/>
      </div>
   </Modal>
</template>

<script>
import { defineComponent } from "vue";
import General from "./Tabs/General.vue";
import Disclaimers from "./Tabs/Disclaimers.vue";
import Graph from "./Tabs/Graph.vue";
import Formulas from "./Tabs/Formulas.vue";
import Toggles from "./Tabs/Toggles.vue";
import Modal from "@/components/Misc/Modal.vue";

export default defineComponent({
   name: "Info",
   components: { Modal, General, Disclaimers, Graph, Formulas, Toggles },
   data(){
      return {
         infoIndex: 0
      }
   }
})
</script>

<style>
.infoButtonsContainer{
   display: flex;
   flex-wrap: wrap;
}
.infoButton{
   flex: 1;
   position: relative;
   z-index: 1;
}
.infoButton.selected::before{
   position: absolute;
   content: "";
   inset: 0;
   background: var(--highlight1);
   z-index: 0;
}
.infoContent{
   padding-inline: 1em;
   padding-bottom: 1em;
}
.infoToggleContainer:not(:last-child){
   padding-bottom: 1.5em;
}
.infoToggleButton{
   width: 100%;
   display: flex;
   flex-direction: row;
   position: relative;
   margin-block: 0.4em;
   max-width: 20rem;
}
.infoToggleButton > div{
   width: 50%;
}
.infoToggleButton > div:first-child{
   padding-right: 0.7em;
}
.infoToggleButton > div:nth-child(2){
   padding-left: 0.7em;
}
.infoToggleButtonHighlight{
   top: 0;
   left: 50%;
   width: 50%;
   height: 100%;
   background: var(--highlight1);
   position: absolute;
}
.infoToggleButtonHighlight.on{
   left: 0;
}
.showcaseTooltip{
   width: 10em;
   margin-left: -5em;
   font-size: 0.9rem;
}
.infoToggleButton:hover .showcaseTooltip{
   visibility: visible
}
.infoToggleContainer.line::after{
   bottom: 1em;
   left: 0;
   right: 0;
   background: var(--highlight2);
}
.infoContent b{
   color: var(--accent1);
}
</style>