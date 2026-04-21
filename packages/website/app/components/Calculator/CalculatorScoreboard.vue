<script setup lang="ts">
const runes = useRunes();
const text = useText();
const items = useItems();
const { championImage } = useChampionImages();
const { version, minorVersion } = usePatchVersion();
const globalKeyModifiers = useGlobalKeyModifiers();
const enableUnimplementedUi = useEnableUnimplementedUi();

const damageSources = defineModel<DamageSource[]>('sources', { required: true });
const damageTargets = defineModel<DamageSource[]>('targets', { required: true });

const sourceElements = useTemplateRef('sourceElements');
const targetElements = useTemplateRef('targetElements');

const draggingPopover = useTemplateRef('draggingPopover');
const dragging = shallowRef<{
	index: number;
	source: DamageSource[];
	value: DamageSource;
	duplicate?: boolean;
	runePathPrimaryKeystone?: string;
	runePathSecondary?: { icon: string; iconColor: string };
	element: HTMLElement | null;
}>();
let dragTimeout: ReturnType<typeof setTimeout> | undefined;
let disableDragTargetPointerEventsTimeout: ReturnType<typeof setTimeout> | undefined;
let droppedAt: { target: DamageSource[]; index: number; dropDirection: 'above' | 'below' } | undefined;

// TODO try to see if drag and drop API is easier, especially for mobile?
function startDrag(event: MouseEvent, source: DamageSource[], index: number, duplicate?: boolean) {
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

	const element = (event.target as HTMLElement).closest('[data-scoreboard-item]') as HTMLElement | null;

	if (!element) {
		console.warn('startDrag called but no scoreboard item found in event.target parents');
	}

	dragging.value = {
		index,
		source,
		duplicate,
		value,
		runePathPrimaryKeystone,
		runePathSecondary,
		element,
	};
	dragTimeout && clearTimeout(dragTimeout);
	dragTimeout = setTimeout(() => {
		draggingPopover.value!.showPopover();
		updateDragPreviewPosition(event);
		document.addEventListener('mousemove', updateDragPreviewPosition, { passive: true });
	}, 150);
	disableDragTargetPointerEventsTimeout = setTimeout(() => {
		if (element) {
			element.style.pointerEvents = 'none';
		}
	}, 300);

	window.addEventListener('mouseup', finishDrag, { once: true });

	for (const el of (sourceElements.value || []).concat(targetElements.value)) {
		el?.el?.addEventListener('mouseenter', setCurrentDropTarget);
		el?.el?.addEventListener('mouseleave', cleanupCurrentDropTarget);
	}
}

function finishDrag(event: MouseEvent) {
	dragTimeout && clearTimeout(dragTimeout);
	disableDragTargetPointerEventsTimeout && clearTimeout(disableDragTargetPointerEventsTimeout);
	draggingPopover.value!.hidePopover();
	document.removeEventListener('mousemove', updateDragPreviewPosition);

	for (const el of (sourceElements.value || []).concat(targetElements.value)) {
		el?.el?.removeEventListener('mouseenter', setCurrentDropTarget);
		el?.el?.removeEventListener('mouseleave', cleanupCurrentDropTarget);
		el?.el?.removeEventListener('mousemove', updateCurrentDropTarget);
	}

	const element = (event.target as HTMLElement).closest('[data-scoreboard-item]') as HTMLElement;
	if (element) {
		removeDropIndicator(element);
	}
	if (dragging.value?.element) {
		dragging.value.element.style.pointerEvents = '';
	}

	if (droppedAt && dragging.value) {
		const duplicate = dragging.value.duplicate || event.altKey || globalKeyModifiers.value.alt;
		const item = duplicate
			? dragging.value.source[dragging.value.index]!.clone()
			: dragging.value.source.splice(dragging.value.index, 1)[0]!;

		if (droppedAt.target.length === 1 && droppedAt.index === 0 && !droppedAt.target[droppedAt.index]?.anythingFilled.value) {
			droppedAt.target[droppedAt.index] = item;
		} else if (droppedAt.target === dragging.value.source) {
			let index = droppedAt.index + (droppedAt.dropDirection === 'above' ? 0 : 1);
			if (!duplicate && index > dragging.value.index) {
				index -= 1;
			}
			droppedAt.target.splice(index, 0, item);
		} else {
			const index = droppedAt.index + (droppedAt.dropDirection === 'above' ? 0 : 1);
			droppedAt.target.splice(index, 0, item);
		}

		if (!dragging.value.source.length) {
			add(dragging.value.source);
		}
	}

	dragTimeout = undefined;
	disableDragTargetPointerEventsTimeout = undefined;
	dragging.value = undefined;
	droppedAt = undefined;
}

function updateDragPreviewPosition(event: MouseEvent) {
	draggingPopover.value!.style.setProperty('--left', `${event.pageX}px`);
	draggingPopover.value!.style.setProperty('--top', `${event.pageY}px`);
}

function setCurrentDropTarget(event: MouseEvent) {
	const target = event.target as HTMLElement;
	target.addEventListener('mousemove', updateCurrentDropTarget, { passive: true });
	updateCurrentDropTarget(event);
}

function cleanupCurrentDropTarget(event: MouseEvent) {
	const target = event.target as HTMLElement;
	target.removeEventListener('mousemove', updateCurrentDropTarget);
	removeDropIndicator(target);
	droppedAt = undefined;
}

function removeDropIndicator(element: HTMLElement) {
	const currentDropDirection = element.dataset.dropDirection;
	const secondIndicator = currentDropDirection === 'above'
		? element.previousElementSibling
		: currentDropDirection === 'below' ? element.nextElementSibling : null;
	delete element.dataset.dropDirection;
	if (secondIndicator) {
		delete (secondIndicator as HTMLElement).dataset.dropDirection;
	}
}

function updateCurrentDropTarget(event: MouseEvent) {
	if (!dragging.value) {
		console.warn('updateCurrentDropTarget called without anything being dragged');
		return;
	}

	const element = (event.target as HTMLElement).closest('[data-scoreboard-item]') as HTMLElement;
	if (!element) {
		console.warn('updateCurrentDropTarget event no target', event);
		return;
	}

	const index = Number.parseInt(element.dataset.index!);
	const target = element.dataset.group === 'sources' ? damageSources.value : damageTargets.value;
	if (dragging.value.source === target && index === dragging.value.index) {
		return;
	}

	const rect = element.getBoundingClientRect();
	const currentDropDirection = element.dataset.dropDirection;
	let dropDirection: 'above' | 'below' = event.clientY < (rect.y + rect.height / 2) ? 'above' : 'below';

	if (currentDropDirection && currentDropDirection !== dropDirection) {
		const previousSecondIndicator = currentDropDirection === 'above'
			? element.previousElementSibling
			: currentDropDirection === 'below' ? element.nextElementSibling : null;
		if (previousSecondIndicator) {
			delete (previousSecondIndicator as HTMLElement).dataset.dropDirection;
		}
	}

	if (target === dragging.value.source) {
		if (index === dragging.value.index - 1) {
			dropDirection = 'above';
		} else if (index === dragging.value.index + 1) {
			dropDirection = 'below';
		}
	}

	const secondIndicator = dropDirection === 'above'
		? element.previousElementSibling
		: dropDirection === 'below' ? element.nextElementSibling : null;

	element.dataset.dropDirection = dropDirection;
	if ((secondIndicator as HTMLElement) && 'scoreboardItem' in (secondIndicator as HTMLElement)?.dataset) {
		(secondIndicator as HTMLElement).dataset.dropDirection = dropDirection === 'below' ? 'above' : 'below';
	}
	droppedAt = {
		index,
		target,
		dropDirection,
	};
}

onBeforeUnmount(() => {
	window.removeEventListener('mouseup', finishDrag);
	document.removeEventListener('mousemove', finishDrag);
});

function clear(index: number, target: DamageSource[]) {
	target[index]!.clear();
}

function remove(index: number, target: DamageSource[]) {
	const [damageSource] = target.splice(index, 1);
	for (const unwatch of damageSource!.watchHandles) {
		unwatch();
	}
	for (const unwatch of damageSource!.internalData.value._watchHandles || []) {
		unwatch();
	}
}

function add(target: DamageSource[]) {
	target.push(new DamageSource());
}

function duplicate(index: number, target: DamageSource[], shift: boolean) {
	const newItem = target[index]!.clone();
	if (shift) {
		const into = target === damageSources.value ? damageTargets.value : damageSources.value;
		if (into.length > 1 || into[0]?.anythingFilled.value) {
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
		newItem = target[index]!.clone();
	} else {
		newItem = target.splice(index, 1)[0]!;
		!target.length && target.push(new DamageSource());
	}
	if (into.length > 1 || into[0]?.anythingFilled.value) {
		into.push(newItem);
	} else {
		into[0] = newItem;
	}
}

function move(index: number, target: DamageSource[], toIndex: number, alt: boolean) {
	const newItem = alt ? target[index]!.clone() : target.splice(index, 1)[0]!;
	target.splice(toIndex, 0, newItem);
}

let itemDragData: {
	source: DamageSource;
	itemIndex: number;
	item: IItem;
} | undefined;

function startItemDrag(event: DragEvent, source: DamageSource, itemIndex: number) {
	event.dataTransfer!.effectAllowed = globalKeyModifiers.value.alt ? 'copy' : 'move';
	itemDragData = {
		source,
		itemIndex,
		item: source.items.value[itemIndex]!,
	};
}

function onItemDragEnter(event: DragEvent, target: DamageSource) {
	if (itemDragData && target !== itemDragData.source) {
		(event.currentTarget as HTMLElement).dataset.dropBuyability = itemBuyability(itemDragData.item, target, items, false).toString();
	}
}

function onItemDragover(event: DragEvent, target: DamageSource) {
	if (itemDragData && itemDragData.source !== target && itemBuyability(itemDragData.item, target, items, false) === 1) {
		event.preventDefault();
	}
}

function onItemDragLeave(event: DragEvent) {
	if (
		!event.currentTarget || !event.relatedTarget
		|| !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)
	) {
		delete (event.currentTarget as HTMLElement).dataset.dropBuyability;
	}
}

function dropItem(event: DragEvent, target: DamageSource) {
	if (event.target) {
		delete (event.target as HTMLElement).dataset.dropBuyability;
	}

	if (itemDragData && itemBuyability(itemDragData.item, target, items, false) === 1) {
		const { source, itemIndex } = itemDragData;
		const item = globalKeyModifiers.value.alt ? source.items.value[itemIndex]! : source.removeItem(itemIndex)!;
		target.addItem(item, items, false);
	}
	itemDragData = undefined;
}

const mirrorLayout = ref(false);

onMounted(() => {
	mirrorLayout.value = localStorage.getItem('lolcalc-mirror-scoreboard-layout') === 'true';
});

function setLocalMirrorLayout() {
	localStorage.setItem('localc-mirror-scoreboard-layout', mirrorLayout.value.toString());
}
</script>

<template>
	<section
		id="scoreboard"
		:data-mirrored="mirrorLayout || undefined"
		:style="`--masterwork-border-url: url(https://raw.communitydragon.org/${minorVersion}/game/assets/items/itemmodifiers/bordertreatmentornn.png)`"
	>
		<h2>
			configuration scoreboard
		</h2>
		<label for="scoreboard-mirror-layout">
			<input id="scoreboard-mirror-layout" v-model="mirrorLayout" type="checkbox" @update:model-value="setLocalMirrorLayout">
			mirror layout
		</label>
		<label for="scoreboard-enable-unimplemented-ui">
			enable unimplemented ui
			<input id="scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
		</label>
		<div>
			<h3>
				damage sources
			</h3>
			<ul>
				<CalculatorScoreboardItem
					v-for="(value, index) in damageSources"
					ref="sourceElements"
					:key="value.id"
					:value
					:index
					:can-remove="damageSources.length > 1"
					:can-move-down="index !== damageSources.length - 1"
					:data-index="index"
					data-group="sources"
					@clear="clear(index, damageSources)"
					@remove="remove(index, damageSources)"
					@duplicate="duplicate(index, damageSources, $event)"
					@change-group="changeGroup(index, damageSources, $event)"
					@move="(toIndex, alt) => move(index, damageSources, toIndex, alt)"
					@start-drag="(event, duplicate) => startDrag(event, damageSources, index, duplicate)"
					@item-dragstart="(event, itemIndex) => startItemDrag(event, value, itemIndex)"
					@item-list-dragenter="onItemDragEnter($event, value)"
					@item-list-dragover="onItemDragover($event, value)"
					@item-list-dragleave="onItemDragLeave"
					@item-list-drop="dropItem($event, value)"
				/>
				<li>
					<button
						class="pretend-ui-btn"
						:disabled="damageSources.length === 1 && !damageSources[0]?.anythingFilled.value"
						@click="add(damageSources)"
					>
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
					ref="targetElements"
					:key="value.id"
					:value
					:index
					:can-remove="damageTargets.length > 1"
					:can-move-down="index !== damageTargets.length - 1"
					:data-index="index"
					data-group="targets"
					is-right
					@clear="clear(index, damageTargets)"
					@remove="remove(index, damageTargets)"
					@duplicate="duplicate(index, damageTargets, $event)"
					@change-group="changeGroup(index, damageTargets, $event)"
					@move="(toIndex, alt) => move(index, damageTargets, toIndex, alt)"
					@start-drag="(event, duplicate) => startDrag(event, damageTargets, index, duplicate)"
					@item-dragstart="(event, itemIndex) => startItemDrag(event, value, itemIndex)"
					@item-list-dragenter="onItemDragEnter($event, value)"
					@item-list-dragover="onItemDragover($event, value)"
					@item-list-dragleave="onItemDragLeave"
					@item-list-drop="dropItem($event, value)"
				/>
				<li>
					<button
						class="pretend-ui-btn"
						:disabled="damageTargets.length === 1 && !damageTargets[0]?.anythingFilled.value"
						@click="add(damageTargets)"
					>
						add damage target
					</button>
				</li>
			</ul>
			<div ref="draggingPopover" data-drag-preview="" popover="hint" inert>
				<span>
					<img
						v-if="dragging?.value.listedChampion.value"
						:src="championImage(dragging.value.listedChampion.value!.image, dragging.value.listedChampion.value!.id)"
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
				</span>
				<span>{{ dragging?.value.level.value }}</span>
				<div>
					<img
						:src="dragging?.runePathPrimaryKeystone || `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
						aria-hidden="true"
						:width="dragging?.runePathPrimaryKeystone ? 256 : 80"
						:height="dragging?.runePathPrimaryKeystone ? 256 : 80"
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
			</div>
		</div>
	</section>
</template>

<style>
@layer components {
	#scoreboard {
		--at-apply: 'b-b b-neutral-500 mt-5 relative w-max mx-auto';

		> h2 {
			--at-apply: 'mb-3';
		}

		> label {
			--at-apply: 'whitespace-nowrap absolute top-0.5';

			&:nth-of-type(1) {
				--at-apply: 'end-0';
			}

			&:nth-of-type(2) {
				--at-apply: 'start-0';
			}
		}

		> div {
			--at-apply: 'mx-auto gap-x-10 grid grid-flow-col grid-rows-[min-content_1fr] grid-cols-2 w-max relative pb-2';

			&::after {
				--at-apply: 'bg-neutral-500 w-px content-empty start-1/2 top-2 bottom-0 absolute -translate-x-1/2';
			}

			> h3 {
				--at-apply: 'text-center text-lg font-500 text-neutral-200 text-start';

				&:nth-of-type(2) {
					--at-apply: 'text-end';
				}
			}

			> ul {
				> li:last-child {
					--at-apply: 'grid-center h-18';

					> button {
						--at-apply: 'py-1 px-2';
					}
				}
			}

			> [data-drag-preview] {
				--at-apply: 'pointer-events-none bg-[--cyan-bg] items-center p-1 b b-[--ui-btn-border-clr] gap-1 absolute start-[--left] top-[--top]';

				&:popover-open {
					--at-apply: 'flex';
				}

				> :nth-child(1) {
					--at-apply: 'size-12 of-hidden rounded-full relative b b-[--ui-btn-border-clr]';

					> img {
						--at-apply: 'size-14 -ms-1 -mt-1 max-w-none';
					}
				}

				> :nth-child(2) {
					--at-apply: 'absolute bg-black rounded-full top-11 start-11.5 translate-center text-xs/3 size-5 text-center grid-center b b-[--ui-btn-border-clr]';
				}

				> :nth-child(3) {
					--at-apply: 'flex flex-col items-center self-center gap-1';

					[data-primary-path-keystone] {
						--at-apply: 'size-5';
					}

					[data-secondary-path] {
						--at-apply: 'size-4';
					}
				}

				> :nth-child(4) {
					--at-apply: 'grid grid-cols-3 grid-rows-2 gap-0.5';

					li {
						--at-apply: 'size-5.5 bg-black';
					}
				}
			}

			[data-drop-direction] {
				--at-apply: 'relative';
				--drop-indicator-bg-direction: 180deg;

				&::before,
				&::after {
					--at-apply: 'content-empty absolute z-10';
				}

				&::before {
					--at-apply: 'inset-0';
					background-image: linear-gradient(
						var(--drop-indicator-bg-direction),
						hsl(0 100% 100%) 0px,
						hsl(0 100% 100%) 0.5px,
						hsl(0 100% 100% / 0.2) 0.5px,
						transparent 1.5rem
					);
				}

				&::after {
					--at-apply: 'top-0.5 start-1/2 -translate-x-1/2 size-4 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}
			}

			[data-drop-direction='below'] {
				--drop-indicator-bg-direction: 0deg;

				&::after {
					--at-apply: 'bottom-0.5 top-auto rotate-180';
				}
			}
		}
	}
}
</style>
