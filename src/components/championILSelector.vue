<template>
   <div class="ILSelectorcontainer">
      <div class="ilButtonContainer">
         <button class="button flexCentered" @click="$emit('openOverlay', isMain)">select items</button>
      </div>
      <div class="ilButtonContainer levelSelect">
         <label for="levelSelect" >level</label>
         <select id="levelSelect" ref="levelSelect" @change="changeLevel">
            <option v-for="i in 18" :value="i" :key="`levelOption${i}`">{{i}}</option>
         </select>
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapActions } from "pinia";
import { useMainStore } from "@/stores";

export default defineComponent({
   name: 'championILSelector',
   props: ['isMain'],
   methods: {
      ...mapActions(useMainStore, ["setLevel"]),
      changeLevel(){
         this.setLevel({isMain: this.isMain, level: parseInt(this.$refs.levelSelect.value)})
      }
   }
})
</script>

<style scoped>
.ILSelectorcontainer{
   width: 100%;
   display: flex;
   flex-direction: row;
}
.ilButtonContainer{
   flex: 1;
}
.button{
   width: 100%;
   height: 100%;
}
.levelSelect{
   position: relative;
}
.levelSelect > label{
   position: absolute;
   font-size: 0.75em;
   transform: translateX(-50%);
   left: 50%;
}
.levelSelect > select{
   width: 100%;
   height: 100%;
   border: none;
   background: transparent;
   text-align: center;
   font-size: 1.8rem;
   appearance: none;
   padding-top: 0.4em;
}
.levelSelect:hover > select{
   background: var(--highlight1);
}
.levelSelect:active > select{
   background: var(--highlight2);
}
.levelSelect > select > option{
   font-size: 1rem;
   color: var(--bg1);
}
</style>