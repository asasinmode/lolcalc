<template>
   <div class="modalOverlay" @click.self="$emit('closeMe')" @keydown.esc="$emit('closeMe')">
      <article class="modalContainer">
         <slot />
      </article>
   </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
   name: "Modal"
})
</script>

<style scoped>
.modalOverlay{
   position: fixed;
   inset: 0;
   z-index: 10;
   background: var(--lowlight1);
   display: flex;
   justify-content: center;
   padding-bottom: 5em;
}
.modalContainer{
   position: fixed;
   left: 50%;
   top: 2.5rem;
   transform: translateX(-50%);
   background: var(--bg1);
   width: 100%;
   max-width: calc(100% - 4rem);
   height: 100%;
   max-height: calc(100% - 6rem);
   overflow-x: hidden;
   overflow-y: scroll;
}
.modalContainer h1{
   text-align: center;
}
.modalContainer b{
   color: var(--accent1);
}
@media (min-width: 768px) {
   .modalContainer{
      max-width: 40rem;
      max-height: 30rem;
   }
}
</style>