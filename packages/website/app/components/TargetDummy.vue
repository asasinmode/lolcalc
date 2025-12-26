<script setup lang="ts">
const value = defineModel<IDamageTarget>({ required: true });
const { minorVersion } = usePatchVersion();
</script>

<template>
	<div class="gap-x-2 grid grid-flow-col grid-cols-[max-content_auto_1fr] grid-rows-3">
		target:
		<img
			class="row-span-full inline-block"
			:src="`https://raw.communitydragon.org/${minorVersion}/game/assets/maps/particles/tft/item_icons/consumables/tft_item_consumable_dummy.png`"
			width="64"
			height="64"
		>
		<label for="target-dummy-hp">
			hp:
			<input id="target-dummy-hp" v-model.number="value.stats.hp">
		</label>
		<label for="target-dummy-armor">
			armor:
			<input id="target-dummy-armor" v-model.number="value.stats.armor">
		</label>
		<label for="target-dummy-magicResists">
			magicResists:
			<input id="target-dummy-magicResists" v-model.number="value.stats.magicResists">
		</label>
	</div>
</template>
