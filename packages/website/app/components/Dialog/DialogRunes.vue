<script setup lang="ts">
const miniRunes = defineModel<IMiniRunes>({ required: true });

const vDialog = useTemplateRef('vDialog');

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog ref="vDialog" class="px-3 pb-2 bg-cyan-950 shadow-lg">
		<header class="py-2 pb-2 bg-inherit flex col-span-full items-center top-0 sticky">
			<form method="dialog" class="ml-auto">
				<button autofocus value="cancel">
					close
				</button>
			</form>
		</header>
		<select v-model="miniRunes.slot1" class="block">
			<option value="adaptive">
				adaptive force
			</option>
			<option value="attackSpeed">
				attack speed
			</option>
			<option value="abilityHaste">
				ability haste
			</option>
		</select>
		<select v-model="miniRunes.slot2" class="block">
			<option value="adaptive">
				adaptive force
			</option>
			<option value="moveSpeed">
				moveSpeed
			</option>
			<option value="scalingHealth">
				scaling health
			</option>
		</select>
		<select v-model="miniRunes.slot3" class="block">
			<option value="instantHealth">
				instant health
			</option>
			<option value="tenacity">
				teancity
			</option>
			<option value="scalingHealth">
				scaling health
			</option>
		</select>
	</VDialog>
</template>
