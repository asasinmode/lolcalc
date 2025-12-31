<script setup lang="ts">
defineProps<{
	isSelected?: boolean;
	item: IItem;
}>();

const { version } = usePatchVersion();
</script>

<template>
	<button class="item-shop-item-btn" :class="{ selected: isSelected }" :data-has-components="item.from?.length ? '' : undefined">
		<span>{{ item.name }}</span>
		<img
			:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`"
			width="64"
			height="64"
			aria-hidden="true"
			loading="lazy"
		>
		<span>{{ item.gold.total }}</span>
	</button>
</template>

<style>
#item-shop-build-path {
	--build-path-clr: theme('colors.amber.100');

	button[data-has-components] {
		@apply 'mb-1.5 relative';

		&:before {
			@apply 'pointer-events-none content-empty block absolute w-px h-1.25 -bottom-0.5 z-100 translate-y-full -translate-x-1/2 left-1/2 bg-[var(--build-path-clr)]';
		}
	}

	ul li {
		@apply 'relative';

		button {
			@apply 'mt-4 relative';

			&:after {
				@apply 'pointer-events-none content-empty block absolute w-px h-5 top-1 -translate-y-full -translate-x-1/2 left-1/2 bg-[var(--build-path-clr)]';
			}
		}

		&:before {
			@apply 'pointer-events-none content-empty block absolute left-0 right-0 h-px top-0 bg-[var(--build-path-clr)]';
		}

		&:first-child:before {
			@apply 'left-1/2';
		}

		&:last-child:before {
			@apply 'right-1/2';
		}
	}
}
</style>
