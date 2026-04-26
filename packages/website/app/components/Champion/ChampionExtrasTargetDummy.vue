<script setup lang="ts">
import type { IExtraComponentEmits, IExtraComponentProps } from '~/utils/types';

const props = defineProps<IExtraComponentProps<'champion'>>();

defineEmits<IExtraComponentEmits>();

const { minorVersion } = usePatchVersion();

function statImage(statName: keyof IChampionStats) {
	const icon = STAT_ICON[statName];
	return typeof icon === 'string'
		? {
				src: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon/${icon}.png`,
				width: 20,
				height: 20,
			}
		:	{
				src: icon[0],
				width: icon[1],
				height: icon[2] ?? icon[1],
			};
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<article class="extras-target-dummy-stats">
		<div
			v-for="(stat, statName) in props.damageSource.computed.stats.value"
			:key="statName"
		>
			<label :for="`${idPrefix}-${statName}`" :title="`${CHAMPION_STAT_NAMES[statName]}${stat.isPercentage && !CHAMPION_STAT_NAMES[statName].startsWith('Percent') ? ' %' : ''}`">
				<img
					v-bind="statImage(statName)"
					loading="lazy"
				>
				<span>{{ CHAMPION_STAT_NAMES[statName] }}</span>
				{{ stat.isPercentage && !CHAMPION_STAT_NAMES[statName].startsWith('Percent') ? '%' : '' }}
			</label>
			<input :id="`${idPrefix}-${statName}`" type="number" min="0">
			<button class="pretend-ui-btn">
				<span>reset</span>
			</button>
		</div>
	</article>
</template>

<style>
@layer overrides {
	#scoreboard > div > ul > [data-scoreboard-item='TargetDummy'] > details > [data-extras] > .extras-target-dummy-stats {
		--at-apply: 'col-span-full w-full grid grid-cols-5 grid-rows-5 gap-x-3.5 gap-y-2.5 pt-[calc(0.5*var(--py))] pb-[--py]';

		> div {
			--at-apply: 'grid grid-rows-[max-content_1fr] grid-cols-[1fr_auto] gap-x-[--venmbr-gap-x] gap-y-1 relative';

			> label {
				--at-apply: 'flex items-center text-sm col-span-full gap-x-[0.5ch]';

				> img {
					--at-apply: 'size-4';
				}

				> span {
					--at-apply: 'truncate';
				}
			}

			> input {
				--at-apply: 'h-min w-full px-[--venmbr-input-px] py-[--venmbr-input-py] bg-white text-black me-[--venmbr-gap-x]';
			}

			> button {
				--at-apply: 'px-1.5';
			}
		}
	}
}
</style>
