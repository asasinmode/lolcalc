<script setup lang="ts">
defineProps<{
	damageSources: DamageSource[];
	damageTargets: DamageSource[];
}>();

const results = defineModel();
</script>

<template>
	<table id="calculator-scoreboard">
		<caption>
			results / TODO please configure a source and a target
		</caption>
		<thead>
			<tr>
				<th scope="col">
					damage type
				</th>
				<th scope="col">
					Aatrox 1 vs Dummy
				</th>
				<th scope="col">
					Aatrox 2 vs Dummy
				</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th scope="row">
					AA physical damage
				</th>
				<td>
					12
				</td>
				<td>
					24
				</td>
			</tr>
			<tr>
				<th scope="row">
					AA magic damage
				</th>
				<td>
					0
				</td>
				<td>
					0
				</td>
			</tr>
			<tr>
				<th scope="row">
					AA true damage
				</th>
				<td>
					0
				</td>
				<td>
					0
				</td>
			</tr>
		</tbody>
	</table>
</template>

<style>
@layer components {
	#calculator-scoreboard {
		--at-apply: 'mx-auto';
	}
}
</style>
