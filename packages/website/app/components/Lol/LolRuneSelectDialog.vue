<script setup lang="ts">
import type { StyleValue } from 'vue';

const text = useText();
const runes = useRunes();
const { minorVersion } = usePatchVersion();

const value = defineModel<IChampionRunes>();
const vDialog = useTemplateRef('vDialog');

const defaultRunes: IChampionRunes = {
	paths: {
		primary: undefined,
		primarySlots: [],
		secondary: undefined,
		secondarySlots: [],
	},
	shards: {
		offensive: 'adaptiveForce',
		flex: 'adaptiveForce',
		defensive: 'flatHealth',
	},
};

const pathOptions = Object.values(runes.paths).map((path) => {
	const { name, tooltip } = text.runes.paths[path.name]!;
	return {
		name: path.name,
		text: name,
		icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
		iconColor: path.iconColor,
		tooltip,
	};
});

const primaryRunePathRadioStyle = computed((): StyleValue => {
	if (!value.value?.paths.primary) {
		return;
	}

	const { icon, iconColor } = pathOptions.find(path => path.name === value.value?.paths.primary!)!;
	return {
		'--path-icon': `url(${icon})`,
		'--path-icon-color': iconColor,
	};
});

type PathTuple<T, K extends keyof T = keyof T>
	= | [K]
		| (K extends any ? (T[K] extends object ? [K, ...PathTuple<T[K]>] : [K]) : never);

function updateValue<P extends PathTuple<IChampionRunes>>(
	path: P,
	newValue?: string,
) {
	if (value.value) {
		const lastKey = path.at(-1);
		let reference = value.value[path[0]!];
		for (const key of path.slice(1, -1)) {
			// @ts-expect-error reference navigating should be ok
			reference = reference[key];
		}
		// @ts-expect-error key/value should be fine
		reference[lastKey] = newValue;
	}
}

defineExpose({
	open: () => vDialog.value?.open(),
});
</script>

<template>
	<VDialog id="dialog-rune-select" ref="vDialog" class="px-3 pb-2 bg-cyan-950 grid-flow-col grid-cols-[1fr_auto] grid-rows-[auto_1fr_auto] shadow-lg [&[open]]:grid">
		<header class="py-2 pb-2 bg-inherit flex col-span-full col-span-full items-center top-0 sticky">
			<h1>Runes</h1>
			<form method="dialog" class="ml-auto">
				<button autofocus value="cancel">
					close
				</button>
			</form>
		</header>
		<section class="row-span-2">
			<h2 class="sr-only">
				Primary
			</h2>
			<VButtonRadiogroup
				id="rune-select-primary-path"
				:model-value="value?.paths.primary"
				label="Primary path"
				:options="pathOptions"
				value-key="name"
				title-key="text"
				:style="primaryRunePathRadioStyle"
				@update:model-value="updateValue(['paths', 'primary'], $event)"
			>
				<template #default="{ option: { name, icon, iconColor }, isSelected }">
					<span
						:src="icon"
						:style="`background-color: ${iconColor}; mask: url(${icon}) no-repeat center;`"
						aria-hidden="true"
						width="32"
						height="32"
						class="size-8 block"
					/>
					<span class="sr-only">{{ name }}</span>
				</template>
			</VButtonRadiogroup>
		</section>
		<section>
			<h2>Secondary</h2>
		</section>
		<section>
			<h2>Shards</h2>
			<select
				:value="value?.shards.offensive ?? defaultRunes.shards.offensive"
				class="block"
				@change="updateValue(['shards', 'offensive'], ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="(_, shardName) in runes.shards.offensive" :key="shardName" :value="shardName">
					{{ shardName }}
				</option>
			</select>
			<select
				:value="value?.shards.flex ?? defaultRunes.shards.flex"
				class="block"
				@change="updateValue(['shards', 'flex'], ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="(_, shardName) in runes.shards.flex" :key="shardName" :value="shardName">
					{{ shardName }}
				</option>
			</select>
			<select
				:value="value?.shards.defensive ?? defaultRunes.shards.defensive"
				class="block"
				@change="updateValue(['shards', 'defensive'], ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="(_, shardName) in runes.shards.defensive" :key="shardName" :value="shardName">
					{{ shardName }}
				</option>
			</select>
		</section>
	</VDialog>
</template>

<style>
@layer components {
	#rune-select-primary-path {
		@apply 'flex items-center relative';

		&:before {
			@apply 'content-empty block size-16 mr-2 b b-2 rounded-full';
			border-color: var(--path-icon-color, #000);
		}

		&:after {
			@apply 'content-empty absolute left-8 translate-center top-1/2 size-10';

			background-color: var(--path-icon-color);
			mask: var(--path-icon) no-repeat center;
		}

		button {
			@apply 'rounded-full b-2 b-transparent p-2';

			span {
				@apply 'brightness-80';
			}

			&:hover,
			&:focus-visible {
				span {
					@apply 'brightness-100';
				}
			}
		}

		button[aria-checked='true'] {
			@apply 'b-amber';

			span {
				@apply 'brightness-100';
			}
		}
	}
}
</style>
