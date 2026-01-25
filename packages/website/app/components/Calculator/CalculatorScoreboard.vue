<script setup lang="ts">
const runes = useRunes();
const text = useText();
const { version, minorVersion } = usePatchVersion();
const enableUnimplementedUi = useEnableUnimplementedUi();

const damageSources = defineModel<DamageSource[]>('sources', { required: true });
const damageTargets = defineModel<DamageSource[]>('targets', { required: true });

const draggingPopover = useTemplateRef('draggingPopover');
const dragging = shallowRef<{
	index: number;
	source: DamageSource[];
	value: DamageSource;
	duplicate?: boolean;
	runePathPrimaryKeystone?: string;
	runePathSecondary?: { icon: string; iconColor: string };
}>();
let isDragging = false;
let dragTimeout: ReturnType<typeof setTimeout> | undefined;

function startDrag(event: MouseEvent, index: number, source: DamageSource[], duplicate?: boolean) {
	console.log('dragging', event, duplicate, index, source);
	const value = source[index]!;

	let runePathPrimaryKeystone;
	let runePathSecondary;
	const { primary, primarySlots, secondary } = value.runes.value.paths;
	if (primary && primarySlots[0]) {
		const { icon } = runes.paths[primary].slots[0]![primarySlots[0]]!;
		runePathPrimaryKeystone = `https://raw.communitydragon.org/${minorVersion}/game/${icon}`;
	}
	if (secondary) {
		const { iconColor } = runes.paths[secondary]!;
		const { name } = text.runes.paths[secondary]!;
		runePathSecondary = {
			icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
		};
	}

	dragging.value = {
		index,
		source,
		duplicate,
		value,
		runePathPrimaryKeystone,
		runePathSecondary,
	};
	// isDragging = false;
	// dragTimeout && clearTimeout(dragTimeout);
	// dragTimeout = setTimeout(() => {
	// 	isDragging = true;
	// 	dragTimeout = undefined;
	// }, 500);

	// window.addEventListener('mouseup', finishDrag, { once: true });
}

function finishDrag() {
	// dragTimeout && clearTimeout(dragTimeout);
	// dragTimeout = undefined;
}

function clear(index: number, target: DamageSource[]) {
	target[index] = markRaw(new DamageSource());
}

function remove(index: number, target: DamageSource[]) {
	target.splice(index, 1);
}

function add(target: DamageSource[]) {
	target.push(markRaw(new DamageSource()));
}

function duplicate(index: number, target: DamageSource[], shift: boolean) {
	const newItem = markRaw(target[index]!.clone());
	if (shift) {
		const into = target === damageSources.value ? damageTargets.value : damageSources.value;
		if (into[0]?.anythingFilled.value) {
			into.push(newItem);
		} else {
			into[0] = newItem;
		}
	} else {
		target.splice(index + 1, 0, newItem);
	}
}

function changeGroup(index: number, target: DamageSource[], alt: boolean) {
	const into = target === damageSources.value ? damageTargets.value : damageSources.value;
	let newItem: DamageSource;
	if (alt) {
		newItem = markRaw(target[index]!.clone());
	} else {
		newItem = target.splice(index, 1)[0]!;
		!target.length && target.push(markRaw(new DamageSource()));
	}
	if (into[0]?.anythingFilled.value) {
		into.push(newItem);
	} else {
		into[0] = newItem;
	}
}

function move(index: number, target: DamageSource[], toIndex: number, alt: boolean) {
	const newItem = alt ? markRaw(target[index]!.clone()) : target.splice(index, 1)[0]!;
	target.splice(toIndex, 0, newItem);
}

onBeforeUnmount(() => {
	window.removeEventListener('mouseup', finishDrag);
});
</script>

<template>
	<article id="calculator-scoreboard" class="mx-auto b grid grid-flow-col grid-rows-[auto_min-content_1fr] grid-cols-2 w-max relative after:(bg-white w-px content-empty bottom-0 left-1/2 top-12 absolute -translate-x-1/2)">
		<header class="text-center b-b col-span-full">
			<h1 class="text-xl font-500">
				lolcalc
			</h1>
			<h2 class="text-sm">
				League of Legends damage calculator
			</h2>
			<label for="calculator-scoreboard-enable-unimplemented-ui" class="left-0 top-0 absolute">
				TMP enable unimplemented ui
				<input id="calculator-scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
			</label>
			<label for="calculator-scoreboard-mirror" class="right-0 top-0 absolute">
				TODO mirror layout
				<input id="calculator-scoreboard-mirror" type="checkbox">
			</label>
		</header>
		<h3>
			damage sources
		</h3>
		<ul>
			<CalculatorScoreboardItem
				v-for="(value, index) in damageSources"
				:key="value.id"
				:value
				:index
				:can-remove="damageSources.length > 1"
				:can-move-down="index !== damageSources.length - 1"
				@clear="clear(index, damageSources)"
				@remove="remove(index, damageSources)"
				@duplicate="duplicate(index, damageSources, $event)"
				@change-group="changeGroup(index, damageSources, $event)"
				@move="(toIndex, alt) => move(index, damageSources, toIndex, alt)"
				@start-drag="(event, duplicate) => startDrag(event, index, damageSources, duplicate)"
			/>
			<li>
				<button
					class="pretend-ui-button"
					:disabled="!damageSources[0]?.anythingFilled.value"
					@click="add(damageSources)"
				>
					<Icon name="ph:plus-bold" />
					add damage source
				</button>
			</li>
		</ul>
		<h3>
			damage targets
		</h3>
		<ul>
			<CalculatorScoreboardItem
				v-for="(value, index) in damageTargets"
				:key="value.id"
				:value
				:index
				:can-remove="damageTargets.length > 1"
				:can-move-down="index !== damageTargets.length - 1"
				is-right
				@clear="clear(index, damageTargets)"
				@remove="remove(index, damageTargets)"
				@duplicate="duplicate(index, damageTargets, $event)"
				@change-group="changeGroup(index, damageTargets, $event)"
				@move="(toIndex, alt) => move(index, damageTargets, toIndex, alt)"
				@start-drag="(event, duplicate) => startDrag(event, index, damageTargets, duplicate)"
			/>
			<li>
				<button
					class="pretend-ui-button"
					:disabled="!damageTargets[0]?.anythingFilled.value"
					@click="add(damageTargets)"
				>
					<Icon name="ph:plus-bold" />
					add damage target
				</button>
			</li>
		</ul>
		<li ref="draggingPopover" data-drag-preview="" popover="hint" inert>
			<div>
				<img
					v-if="dragging?.value.champion.value"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${dragging.value.champion.value.image}`"
					loading="lazy"
					width="128"
					height="128"
				>
				<img
					v-else
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
					width="256"
					height="256"
				>
				<span>{{ dragging?.value.level.value }}</span>
			</div>
			<div>
				<img
					:src="dragging?.runePathPrimaryKeystone || `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
					aria-hidden="true"
					width="32"
					height="32"
					loading="lazy"
					data-primary-path-keystone=""
				>
				<span
					v-show="dragging?.runePathSecondary"
					:style="dragging?.runePathSecondary ? `background-color: ${dragging.runePathSecondary.iconColor}; mask: url(${dragging.runePathSecondary.icon}) no-repeat center;` : ''"
					data-secondary-path=""
				/>
			</div>
			<ul>
				<li v-for="i in 6" :key="i">
					<img
						v-if="dragging?.value.items.value[i - 1]"
						:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${dragging?.value.items.value[i - 1]!.image}`"
						width="64"
						height="64"
						loading="lazy"
					>
				</li>
			</ul>
		</li>
	</article>
</template>

<style>
@layer components {
	#calculator-scoreboard {
		> h3 {
			@apply 'text-center';
		}

		> ul {
			> li:last-child {
				@apply 'grid-center';

				> button {
					@apply 'p-1';

					.iconify {
						@apply 'align-sub size-4 mr-0.5';
					}
				}
			}
		}

		> [data-drag-preview] {
			@apply 'bg-cyan-950 flex p-1 b b-[--ui-button-border-clr] gap-1';

			> :nth-child(1) {
				@apply 'row-span-full size-10 rounded-full overflow-hidden b b-[--ui-button-border-clr]';
			}

			> :nth-child(2) {
				@apply 'flex flex-col items-center self-center gap-1';

				[data-primary-path-keystone] {
					@apply 'size-4.5';
				}

				[data-secondary-path] {
					@apply 'size-3.5';
				}
			}

			> :nth-child(3) {
				@apply 'row-span-full grid grid-cols-3 grid-rows-2 gap-0.5';

				li {
					@apply 'size-5 bg-black';
				}
			}
		}
	}
}
</style>
