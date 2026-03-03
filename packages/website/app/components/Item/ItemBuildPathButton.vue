<script setup lang="ts">
import type { IShopItem } from '~/utils/types';

defineProps<{
	isSelected?: boolean;
	shopItem: IShopItem<boolean>;
}>();

const { version } = usePatchVersion();
</script>

<template>
	<button
		class="item-shop-item-btn"
		:class="{ selected: isSelected }"
		:data-has-components="shopItem[0].from?.length ? '' : undefined"
		:data-buyability="shopItem[1]"
	>
		<span>{{ shopItem[0].name }}</span>
		<img
			:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${shopItem[0].image}`"
			width="64"
			height="64"
			aria-hidden="true"
			loading="lazy"
		>
		{{ shopItem[2] }}
	</button>
</template>

<style>
#item-shop-build-path {
	--build-path-clr: theme('colors.amber.100');

	button[data-has-components] {
		--at-apply: 'mb-1.5 relative';

		&:before {
			--at-apply: 'pointer-events-none content-empty block absolute w-px h-1.25 -bottom-0.5 z-100 translate-y-full -translate-x-1/2 start-1/2 bg-[var(--build-path-clr)]';
		}
	}

	ul li {
		--at-apply: 'relative';

		button {
			--at-apply: 'mt-4 relative';

			&:after {
				--at-apply: 'pointer-events-none content-empty block absolute w-px h-5 top-1 -translate-y-full -translate-x-1/2 start-1/2 bg-[var(--build-path-clr)]';
			}
		}

		&:before {
			--at-apply: 'pointer-events-none content-empty block absolute start-0 end-0 h-px top-0 bg-[var(--build-path-clr)]';
		}

		&:first-child:before {
			--at-apply: 'start-1/2';
		}

		&:last-child:before {
			--at-apply: 'end-1/2';
		}
	}
}
</style>
