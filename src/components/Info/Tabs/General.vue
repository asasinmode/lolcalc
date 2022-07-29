<template>
   <div class="infoContent">
      <p>This site was made to help visualize damage difference between <b>Lord Dominik's Regards</b> and <b>The Collector</b>.</p>
      <p class="indent">It's best experienced on desktop but I tried to make it look presentable on phone as well.</p><br/>
      <p>After selecting main and target champions and (optionally) their items, you can see the stats calculated for chosen build below the <strong>select item</strong> and <strong>level</strong> buttons.</p>
      <p class="indent">Below the calculated stats you can see a graph that shows the damage you can expect (see the <b>disclaimers</b> tab) to see in game when you auto attack the target champion.</p><br/>
      <p>The graph has 2 settings. If you want to learn more about it visit the <b>graph</b> tab.</p>
      <p class="indent">If you have either <b>Lord Dominik's Regards</b> or <b>The Collector</b> selected on your main champion the graph will automatically show both of their their respective damage outputs. To compare other builds with each other I recommend opening this app in multiple browser tabs.</p><br/>
      <p>To manually set stats of the <b>target</b> champion click the <b>select target</b> button then choose <b>Target Dummy's</b> icon.</p><br/>
      <p>If you want to request a feature visit the <b>about</b> tab to see where you can contact me.</p><br/>
      <p>Visit the <b>toggles</b> tab to toggle tooltips on graph settings or item groups.</p><br/>
      <div class="centered">
         <strong style="color: hsl(0, 100%, 45%);">There are no major updates planned.</strong></div><br/>
      <div class="centered">
         Current patch:<b style="margin-left: 0.5em;">{{ patch }}</b>
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapState } from "pinia";
import { useMainStore } from "@/stores";

export default defineComponent({
   name: "General",
   computed:{
      ...mapState(useMainStore, ["patch"])
   }
})
</script>

<style scoped>

</style>