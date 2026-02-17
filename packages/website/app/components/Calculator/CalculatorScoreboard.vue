<script setup lang="ts">
const runes = useRunes();
const text = useText();
const { version, minorVersion } = usePatchVersion();
const enableUnimplementedUi = useEnableUnimplementedUi();
const globalKeyModifiers = useGlobalKeyModifiers();

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
			? markRaw(dragging.value.source[dragging.value.index]!.clone())
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
	draggingPopover.value!.style.setProperty('--left', `${event.clientX}px`);
	draggingPopover.value!.style.setProperty('--top', `${event.clientY}px`);
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
		newItem = markRaw(target[index]!.clone());
	} else {
		newItem = target.splice(index, 1)[0]!;
		!target.length && target.push(markRaw(new DamageSource()));
	}
	if (into.length > 1 || into[0]?.anythingFilled.value) {
		into.push(newItem);
	} else {
		into[0] = newItem;
	}
}

function move(index: number, target: DamageSource[], toIndex: number, alt: boolean) {
	const newItem = alt ? markRaw(target[index]!.clone()) : target.splice(index, 1)[0]!;
	target.splice(toIndex, 0, newItem);
}

let draggingFromItemListEl: HTMLUListElement | null;

function startItemDrag(event: DragEvent, source: DamageSource[], index: number, itemIndex: number) {
	draggingFromItemListEl = (event.target as HTMLImageElement).closest('ul');
	event.dataTransfer!.effectAllowed = 'copyMove';
	event.dataTransfer!.setData('source', source === damageSources.value ? 'sources' : 'targets');
	event.dataTransfer!.setData('index', index.toString());
	event.dataTransfer!.setData('item-index', itemIndex.toString());
}

function onItemDragEnter(event: DragEvent) {
	const el = (event.target as HTMLElement)?.closest('ul');
	if (el && el !== draggingFromItemListEl) {
		el.dataset.dropTarget = '';
	}
}

function onItemDragover(event: DragEvent) {
	if (event.dataTransfer?.types.includes('item-index') && !draggingFromItemListEl?.contains(event.target as HTMLElement)) {
		event.preventDefault();
	}
}

function onItemDragLeave(event: DragEvent) {
	if (event.target) {
		delete (event.target as HTMLElement).dataset.dropTarget;
	}
}

function dropItem(event: DragEvent, target: DamageSource[], targetIndex: number) {
	draggingFromItemListEl = null;
	if (event.target) {
		delete (event.target as HTMLElement).dataset.dropTarget;
	}

	const sourceGroup = event.dataTransfer!.getData('source');
	const sourceIndex = event.dataTransfer!.getData('index');
	const itemIndex = event.dataTransfer!.getData('item-index');

	if (target[targetIndex] && !target[targetIndex].inventoryFull.value && sourceGroup && sourceIndex && itemIndex) {
		const source = (sourceGroup === 'sources' ? damageSources : damageTargets).value[Number(sourceIndex)];
		if (!source) {
			throw new Error('move item source no longer exists');
		}
		const parsedItemIndex = Number(itemIndex);
		const item = globalKeyModifiers.value.alt ? source.items.value[parsedItemIndex]! : source.items.value.splice(parsedItemIndex, 1)[0]!;
		if (!item) {
			throw new Error(`move item source no longer has an item at ${parsedItemIndex}`);
		}
		target[targetIndex].items.value.push(item);
	}
}
</script>

<template>
	<article id="calculator-scoreboard" class="mx-auto b grid grid-flow-col grid-rows-[auto_min-content_1fr] grid-cols-2 w-max relative after:(bg-white w-px content-empty start-1/2 bottom-0 top-12 absolute -translate-x-1/2)">
		<header class="text-center b-b col-span-full">
			<h1 class="text-xl font-500">
				lolcalc
			</h1>
			<h2 class="text-sm">
				League of Legends damage calculator
			</h2>
			<label for="calculator-scoreboard-enable-unimplemented-ui" class="start-0 top-0 absolute">
				TMP enable unimplemented ui
				<input id="calculator-scoreboard-enable-unimplemented-ui" v-model="enableUnimplementedUi" type="checkbox">
			</label>
			<label for="calculator-scoreboard-mirror" class="end-0 top-0 absolute">
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
				@item-dragstart="(event, itemIndex) => startItemDrag(event, damageSources, index, itemIndex)"
				@item-list-dragenter="onItemDragEnter"
				@item-list-dragover="onItemDragover"
				@item-list-dragleave="onItemDragLeave"
				@item-list-drop="dropItem($event, damageSources, index)"
			/>
			<li>
				<button
					class="pretend-ui-button"
					:disabled="damageSources.length === 1 && !damageSources[0]?.anythingFilled.value"
					@click="add(damageSources)"
				>
					<Icon class="i-ph:plus-bold" />
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
				@item-dragstart="(event, itemIndex) => startItemDrag(event, damageTargets, index, itemIndex)"
				@item-list-dragenter="onItemDragEnter"
				@item-list-dragover="onItemDragover"
				@item-list-dragleave="onItemDragLeave"
				@item-list-drop="dropItem($event, damageTargets, index)"
			/>
			<li>
				<button
					class="pretend-ui-button"
					:disabled="damageTargets.length === 1 && !damageTargets[0]?.anythingFilled.value"
					@click="add(damageTargets)"
				>
					<Icon class="i-ph:plus-bold" />
					add damage target
				</button>
			</li>
		</ul>
		<div ref="draggingPopover" data-drag-preview="" popover="hint" inert>
			<img
				v-if="dragging?.value.listedChampion.value"
				:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${dragging.value.listedChampion.value.image}`"
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
		</div>
	</article>
</template>

<style>
@layer components {
	#calculator-scoreboard {
		> h3 {
			--at-apply: 'text-center';
		}

		> ul {
			> li:last-child {
				--at-apply: 'grid-center';

				> button {
					--at-apply: 'p-1';

					.icon {
						--at-apply: 'align-sub size-4 me-0.5';
					}
				}
			}
		}

		> [data-drag-preview] {
			--at-apply: 'pointer-events-none bg-cyan-950 items-center p-1 b b-[--ui-button-border-clr] gap-1 absolute start-[--left] top-[--top]';

			&:popover-open {
				--at-apply: 'flex';
			}

			> :nth-child(1) {
				--at-apply: 'size-12 rounded-full b b-[--ui-button-border-clr]';
			}

			> :nth-child(2) {
				--at-apply: 'absolute bg-black rounded-full top-11 start-11 translate-center text-xs size-5 text-center grid-center b b-[--ui-button-border-clr]';
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
</style>
