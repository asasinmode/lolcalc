<script setup lang="ts">
defineProps<{
	isSelected?: boolean;
	item: IItem;
}>();

const { version } = usePatchVersion();
</script>

<template>
	<button class="item-shop-item-btn" :class="{ selected: isSelected }" :data-has-components="item.from?.length ? '' : undefined">
		<span class="sr-only">{{ item.name }}</span>
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

	&[data-levels='2'] > button,
	&[data-levels='3'] > button,
	> ul > li > button[data-has-components] {
		@apply 'mb-2.5';

		> span:last-child:after {
			@apply 'pointer-events-none content-empty block absolute w-px h-1.25 -bottom-1.5 z-100 translate-y-full -translate-x-1/2 left-1/2 bg-[var(--build-path-clr)]';
		}
	}

	ul li {
		@apply 'relative';

		button {
			@apply 'mt-5 relative';

			&:after {
				@apply 'pointer-events-none content-empty block absolute w-px h-5 top-0 -translate-y-full -translate-x-1/2 left-1/2 bg-[var(--build-path-clr)]';
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
