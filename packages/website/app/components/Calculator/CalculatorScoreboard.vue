<script setup lang="ts">
const items = useItems();
const text = useText();
const runes = useRunes();
const { version, minorVersion } = usePatchVersion();
const globalKeyModifiers = useGlobalKeyModifiers();
const enableUnimplementedUi = useEnableUnimplementedUi();
const { championImage, championImageSize } = useChampionImages();

const damageSources = defineModel<DamageSource[]>('sources', { required: true });
const damageTargets = defineModel<DamageSource[]>('targets', { required: true });

const dragDropIndex = ref<number>();
const dragDropTarget = shallowRef<DamageSource[]>();
const dragPreview = useTemplateRef('dragPreview');
const dragging = shallowRef<{
	isDuplicate: boolean;
	index: number;
	source: DamageSource[];
}>();

function onDragstart(event: DragEvent, index: number, source: DamageSource[], isDuplicate: boolean) {
	const damageSource = source[index]!;

	const [champImgContainer, lvlSpan, runeContainer, itemList] = dragPreview.value!.children as unknown as [HTMLSpanElement, HTMLSpanElement, HTMLDivElement, HTMLUListElement];
	const champImg = champImgContainer.firstElementChild as HTMLImageElement;
	const [runePrimary, runeSecondary] = runeContainer.children as unknown as [HTMLImageElement, HTMLSpanElement];

	const champ = damageSource.listedChampion.value;
	if (champ) {
		champImg.src = championImage(champ.image, champ.id);
		const size = championImageSize(champ.id);
		champImg.width = size;
		champImg.height = size;
	} else {
		champImg.src = `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`;
		champImg.width = 256;
		champImg.height = 256;
	}

	lvlSpan.textContent = damageSource.level.value.toString();

	const { primary, primarySlots, secondary } = damageSource.runes.value.paths;
	if (primary && primarySlots[0]) {
		const { icon } = runes.paths[primary].slots[0]![primarySlots[0]]!;
		runePrimary.src = `https://raw.communitydragon.org/${minorVersion}/game/${icon}`;
		runePrimary.width = 256;
		runePrimary.height = 256;
	} else {
		runePrimary.src = `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`;
		runePrimary.width = 80;
		runePrimary.height = 80;
	}

	if (secondary) {
		const { iconColor } = runes.paths[secondary]!;
		const { name } = text.runes.paths[secondary]!;
		runeSecondary.style.display = '';
		runeSecondary.style.backgroundColor = iconColor;
		runeSecondary.style.mask = `url(https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg) no-repeat center`;
	} else {
		runeSecondary.style.display = 'none';
	}

	for (let i = 0; i < 7; i++) {
		const li = itemList.children.item(i) as HTMLLIElement;
		const img = li.firstElementChild as HTMLImageElement;
		const item = damageSource.items.value[i];

		if (item) {
			img.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image}`;
			img.style.display = '';
		} else {
			img.style.display = 'none';
		}
	}

	const lastLi = itemList.lastElementChild as HTMLLIElement;
	if (damageSource.roleQuest.value === 'bot') {
		lastLi.style.display = '';
		itemList.style.paddingInlineEnd = `calc(6 * var(--spacing))`;
	} else {
		lastLi.style.display = 'none';
		itemList.style.paddingInlineEnd = '';
	}

	dragging.value = { index, source, isDuplicate };
	event.dataTransfer!.effectAllowed = isDuplicate ? 'copy' : 'move';
	event.dataTransfer!.setDragImage(dragPreview.value!, 0, 0);
}

function onDragenter(event: DragEvent, index: number, target: DamageSource[]) {
	if (dragging.value) {
		dragDropTarget.value = target;
		([dragDropIndex.value] = getDropTargetIndex(event, index, target, dragging.value.index, dragging.value.source));
	}
}

function onDragover(event: DragEvent, index: number, target: DamageSource[]) {
	if (dragging.value) {
		dragDropTarget.value = target;
		([dragDropIndex.value] = getDropTargetIndex(event, index, target, dragging.value.index, dragging.value.source));
		if (dragDropIndex.value !== undefined) {
			event.preventDefault();
		}
	}
}

function onDragleave(event: DragEvent) {
	if (!dragging.value) {
		if (
			!event.currentTarget || !event.relatedTarget
			|| !(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)
		) {
			dragDropTarget.value = undefined;
			dragDropIndex.value = undefined;
		}
	}
}

function onDrop(event: DragEvent, index: number, target: DamageSource[]) {
	dragDropIndex.value = undefined;
	dragDropTarget.value = undefined;
	if (!dragging.value) {
		return;
	}

	const [toIndex, fromIndex] = getDropTargetIndex(event, index, target, dragging.value.index, dragging.value.source);
	if (toIndex === undefined || fromIndex === undefined) {
		return;
	}

	if (dragging.value.isDuplicate) {
		target.splice(toIndex, 0, dragging.value.source[fromIndex]!.clone());
	} else {
		const [column] = dragging.value.source.splice(fromIndex, 1);
		const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
		target.splice(adjustedIndex, 0, column!);
	}

	dragging.value = undefined;
}

function getDropTargetIndex(
	event: DragEvent,
	index: number,
	target: DamageSource[],
	fromIndex: number,
	source: DamageSource[],
): [toIndex: number | undefined, fromIndex: number | undefined] {
	if (fromIndex === index && source === target) {
		return [undefined, undefined];
	}

	let toIndex;
	if (source === target) {
		if (index === fromIndex - 1) {
			toIndex = index;
		} else if (index === fromIndex + 1) {
			toIndex = index + 1;
		}
	}
	if (toIndex === undefined) {
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		const rectSize = rect.height;
		const posInEl = event.clientY - rect.top;

		toIndex = posInEl < (rectSize / 2) ? index : index + 1;
	}

	return [toIndex, fromIndex];
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

function onItemDragstart(event: DragEvent, source: DamageSource, itemIndex: number) {
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

function onItemDrop(event: DragEvent, target: DamageSource) {
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

const expandOnMounted = computed(() => damageSources.value.length === 1 && damageTargets.value.length === 1);

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
					:key="value.id"
					:value
					:index
					:expand-on-mounted
					:can-remove="damageSources.length > 1"
					:can-move-down="index !== damageSources.length - 1"
					:data-drop-direction="dragDropTarget === damageSources ? dragDropIndex === index ? 'before' : dragDropIndex === index + 1 ? 'after' : undefined : undefined"
					data-group="sources"
					@clear="value.clear()"
					@remove="remove(index, damageSources)"
					@duplicate="duplicate(index, damageSources, $event)"
					@change-group="changeGroup(index, damageSources, $event)"
					@move="(toIndex, alt) => move(index, damageSources, toIndex, alt)"
					@dragstart="(event, isDuplicate) => onDragstart(event, index, damageSources, isDuplicate)"
					@dragenter="onDragenter($event, index, damageSources)"
					@dragover="onDragover($event, index, damageSources)"
					@dragleave="onDragleave"
					@drop="onDrop($event, index, damageSources)"
					@item-dragstart="(event, itemIndex) => onItemDragstart(event, value, itemIndex)"
					@item-list-dragenter="onItemDragEnter($event, value)"
					@item-list-dragover="onItemDragover($event, value)"
					@item-list-dragleave="onItemDragLeave"
					@item-list-drop="onItemDrop($event, value)"
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
					:key="value.id"
					:value
					:index
					:expand-on-mounted
					:can-remove="damageTargets.length > 1"
					:can-move-down="index !== damageTargets.length - 1"
					:data-drop-direction="dragDropTarget === damageTargets ? dragDropIndex === index ? 'before' : dragDropIndex === index + 1 ? 'after' : undefined : undefined"
					data-group="targets"
					is-right
					@clear="value.clear()"
					@remove="remove(index, damageTargets)"
					@duplicate="duplicate(index, damageTargets, $event)"
					@change-group="changeGroup(index, damageTargets, $event)"
					@move="(toIndex, alt) => move(index, damageTargets, toIndex, alt)"
					@dragstart="(event, isDuplicate) => onDragstart(event, index, damageTargets, isDuplicate)"
					@dragenter="onDragenter($event, index, damageTargets)"
					@dragover="onDragover($event, index, damageTargets)"
					@dragleave="onDragleave"
					@drop="onDrop($event, index, damageTargets)"
					@item-dragstart="(event, itemIndex) => onItemDragstart(event, value, itemIndex)"
					@item-list-dragenter="onItemDragEnter($event, value)"
					@item-list-dragover="onItemDragover($event, value)"
					@item-list-dragleave="onItemDragLeave"
					@item-list-drop="onItemDrop($event, value)"
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
			<div ref="dragPreview" data-drag-preview="" inert aria-hidden="true">
				<span><img></span>
				<span />
				<div>
					<img data-primary-path-keystone="">
					<span data-secondary-path="" />
				</div>
				<ul>
					<li v-for="i in 7" :key="i" :style="i === 7 ? 'display: none;' : undefined">
						<img>
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
				--at-apply: 'pointer-events-none bg-[--cyan-bg] items-center p-1 b b-[--ui-btn-border-clr] gap-1 absolute flex -z-1 -start-[9999px] -top-[9999px]';

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

					> :first-child {
						--at-apply: 'size-5';
					}

					> :last-child {
						--at-apply: 'size-4';
					}
				}

				> :nth-child(4) {
					--at-apply: 'grid grid-cols-3 grid-rows-2 gap-0.5 relative';

					> li {
						--at-apply: 'size-5.5 bg-black';

						&:nth-of-type(7) {
							--at-apply: 'rounded-full absolute end-0 top-1/2 -translate-y-1/2';
						}
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
					--b-w: 0.5px;
					background-image: linear-gradient(
						var(--drop-indicator-bg-direction),
						hsl(0 100% 100%) 0px,
						hsl(0 100% 100%) var(--b-w),
						hsl(0 100% 100% / 0.2) var(--b-w),
						transparent 1.5rem
					);
				}

				&::after {
					--at-apply: 'top-0.5 start-1/2 -translate-x-1/2 size-4 bg-neutral-300';
					mask: icon('i-ph:caret-up-bold') center / 100% 100% no-repeat;
				}
			}

			[data-drop-direction='before']:first-child::before {
				--b-w: 1px;
			}

			[data-drop-direction='after'] {
				--drop-indicator-bg-direction: 0deg;

				&::after {
					--at-apply: 'bottom-0.5 top-auto rotate-180';
				}

				&:nth-last-child(2)::before {
					--b-w: 1px;
				}
			}
		}
	}
}
</style>
