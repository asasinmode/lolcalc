<script setup lang="ts">
import type { IShopItem } from '@lolcalc/data/types';
import { PATCH_VERSION } from '@lolcalc/data';

defineProps<{
	component?: boolean;
	shopItem: IShopItem;
}>();

const { vSemver } = PATCH_VERSION;
</script>

<template>
	<button
		class="item-shop-item-btn"
		:data-has-components="shopItem.item.from?.length ? '' : undefined"
		:data-buyability="shopItem.buyability"
		:data-bought="shopItem.isBought ? '' : undefined"
	>
		<span>{{ shopItem.item.name }}</span>
		<img
			:src="`https://ddragon.leagueoflegends.com/cdn/${vSemver}/img/item/${shopItem.item.image}`"
			width="64"
			height="64"
			aria-hidden="true"
			loading="lazy"
		>
		<span class="sr-status">
			{{ component ? `checked${shopItem.srStatus ? ', ' : ''}` : '' }}
			{{ shopItem.srStatus }}
		</span>
		<span>{{ shopItem.calculatedPrice }}</span>
	</button>
</template>

<style>
#item-shop-build-path {
	--build-path-clr: theme('colors.neutral.500');

	button[data-has-components] {
		--at-apply: 'mb-[--item-mb] relative';

		&:before {
			--at-apply: 'pointer-events-none content-empty block absolute w-px h-1.25 -bottom-0.5 z-100 translate-y-full -translate-x-1/2 start-1/2 bg-[var(--build-path-clr)]';
		}
	}

	ul li {
		--at-apply: 'relative';

		button {
			--at-apply: 'mt-[--item-mt] relative';

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
