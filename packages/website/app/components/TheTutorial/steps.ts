import { EFFECT_SPECIFICS } from '@lolcalc/core/specifics/effect.ts';
import type { IHypotheticalEffectSpecifics } from '@lolcalc/core/specifics/effect.ts';
import { CHAMPION_COMPONENTS } from '~/components/Champion/index.ts';
import type { ITutorialStepId, TutorialEvents } from '~/utils/tutorial';

type ITutorialStepTriggers = {
	[K in ITutorialEvent]?: true | ((data: TutorialEvents[K]) => boolean);
};

export interface ITutorialStepDef {
	title: string;
	/** used for selecting el.querySelector targets, as well as updating the popup's position when a destructive event happens to something the type is associated with (like damage source moved = need to reposition tutorial) */
	type: 'global' | 'damageSource' | 'resultColumn' | 'resultSection' | 'effectsDialog';
	/** will be v-htmled into a `div.game-description` of TheTutorial */
	text?: string;
	/** element the tutorial should call `showPopover({ source })` with. If tuple, will run the selector then refine function on each of its results, until it finds one that's `checkVisibility()` */
	anchor?: string | [query: string, refine: (element: HTMLElement) => HTMLElement | undefined | null];
	/** id of an element the tutorial should move to be a child of (like when the step is inside a dialog) */
	within?: string;
	/** general steps: any of these will try to show the step when it returns `true` */
	showOn?: ITutorialStepTriggers;
	/** these mark the step `done` when any of these returns `true` */
	completeOn?: ITutorialEvent[];
	/** check for step (only general steps) to be marked as pending. Runs on tutorial mounted/reset */
	pendingIf?: (calculatorState: ICalculatorState) => void;
}

export const tutorialSteps: Record<ITutorialStepId, ITutorialStepDef> = {
	greeting: {
		title: 'welcome',
		type: 'global',
		pendingIf: () => true,
	},
	beforeYouStart: {
		title: "don't get skill issued",
		type: 'global',
		text: "<li>if you're using a phone, long press something to show its tooltip (if it has one)</li> <li>press [<kbd>K</kbd>] to pin a tooltip that's currently visible (not needed on phones)</li><li>change page's zoom using <kbd>ctrl +/-</kbd> to find the scale you like best</li>",
		pendingIf: () => true,
	},
	openChampSelect: {
		title: 'select a champion',
		type: 'damageSource',
		text: 'open champ select by clicking on the portrait',
		anchor: '.select-champion',
		completeOn: ['champSelectClosed', 'champSelectOpened'],
	},
	viewExtraComponent: {
		title: 'configuring passives',
		type: 'damageSource',
		text: 'some abilities, items or effects are configurable through elements that will be shown below the general configuration',
		anchor: '.extras > :first-child',
		pendingIf: (calculatorState) =>
			calculatorState.damageSources.some((source) => source.champion.value?.id && source.champion.value.id in CHAMPION_COMPONENTS) ||
			calculatorState.damageTargets.some((source) => source.champion.value?.id && source.champion.value.id in CHAMPION_COMPONENTS),
		showOn: {
			scoreboardItemExpanded([championId]) {
				return championId ? championId in CHAMPION_COMPONENTS : false;
			},
			damageSourceChampionLoaded(championId) {
				return championId in CHAMPION_COMPONENTS;
			},
		},
		completeOn: ['extraComponentFocused'],
	},
	changeChampionLevel: {
		title: 'champion level',
		type: 'damageSource',
		text: 'can be changed by clicking the number next to their portrait',
		anchor: '.select-champion-level',
		completeOn: ['sourceLevelSelectFocused'],
	},
	openRunesDialog: {
		title: 'runes',
		type: 'damageSource',
		text: 'open rune select by clicking on the runes icon<br> <rules>note that at the moment only rune shards are implemented</rules>',
		anchor: '.select-runes',
		completeOn: ['runeSelectOpened'],
	},
	openItemShop: {
		title: 'items',
		type: 'damageSource',
		text: 'to buy items, open the item shop with the "items" button or by clicking on the inventory next to it',
		anchor: '.select-items',
		completeOn: ['itemShopOpened'],
	},
	itemShopFunctionality: {
		title: 'item shop',
		type: 'global',
		text: 'works the same way the game\'s does. <span class="mouse-only">Right or double click items to buy them, right click in the inventory panel to sell</span><span class="touch-only">Double tap to buy items, select one in inventory then press "sell" button to sell</span>',
		within: 'dialog-item-shop',
		showOn: {
			itemShopOpened: true,
		},
		completeOn: ['itemShopClosed'],
	},
	rightClickDragItems: {
		title: 'manipulating items',
		type: 'damageSource',
		text: 'items can be sold by right clicking. You can also drag them between different <i>damage sources</i> (hold [<kbd>Alt</kdb>] while dragging to duplicate)',
		anchor: ['.items', (itemsContainer) => itemsContainer.querySelector('button') && itemsContainer],
		pendingIf: (state) => state.damageSources.some((source) => source.items.value.length) || state.damageTargets.some((source) => source.items.value.length),
		showOn: {
			itemShopClosed(damageSource) {
				return !!damageSource.items.value.length;
			},
		},
		completeOn: ['scoreboardItemsInteracted'],
	},
	changeAbilityLevel: {
		title: 'ability levels',
		type: 'damageSource',
		text: 'can be changed with the dots below their icons',
		anchor: '[data-ability] .v-button-radiogroup',
		showOn: {
			damageSourceChampionLoaded(currentChampionId) {
				return !!currentChampionId;
			},
			scoreboardItemExpanded(championId) {
				return !!championId;
			},
		},
		completeOn: ['abilityLevelFocused'],
	},
	changeHPAbilityResource: {
		title: 'current health and mana',
		type: 'damageSource',
		text: 'can be changed either directly in the inputs or by clicking on the bar itself',
		anchor: '.health-ability-resource',
		showOn: {
			itemShopClosed(damageSource) {
				return !!(damageSource.stats.value.total.hp || damageSource.stats.value.total.mana);
			},
			damageSourceChampionLoaded(currentChampionId) {
				return !!currentChampionId;
			},
			scoreboardItemExpanded([championId, damageSource]) {
				return !!(championId || damageSource.stats.value.total.hp || damageSource.stats.value.total.mana);
			},
		},
		completeOn: ['hpAbilityResourceBarsInteracted'],
	},
	viewRoleQuests: {
		title: 'role quest',
		type: 'damageSource',
		text: 'can be set below HP and mana bars',
		anchor: '.role-quest > .v-select',
		completeOn: ['roleQuestFocused'],
	},
	viewDragons: {
		title: 'dragons',
		type: 'damageSource',
		text: 'stacks and soul can be changed next to role quest',
		anchor: '.dragons',
		completeOn: ['dragonsFocused'],
	},
	applyEffect: {
		title: 'external effects',
		type: 'damageSource',
		text: 'open the <i>effects dialog</i> by clicking the "effects" button to apply buffs or debuffs from external sources',
		anchor: '.effects > .other-ui-btn',
		completeOn: ['effectsDialogOpened'],
	},
	viewEffectSourceControls: {
		title: 'effect source',
		type: 'effectsDialog',
		within: 'dialog-effects',
		text: "some effects' strength depends on who's applying them. If applicable, the source of the effect can be selected by clicking on the champion icon in the corner of the effect's image",
		anchor: '.effect-src-select',
		showOn: {
			effectDialogExtraEntered(effectObjectName) {
				return !!(EFFECT_SPECIFICS as IHypotheticalEffectSpecifics)[effectObjectName].sourceControls;
			},
		},
		completeOn: ['effectDialogSourceControlsFocused'],
	},
	modifyEffectIcons: {
		title: 'modify effects',
		type: 'damageSource',
		text: "applied effects can be modified through their icons, displayed next to the stats panel. Left click an icon to increment the effect's value (like increase Black Cleaver stacks) or right click to decrement it <br><rules>Holding [<kbd>Ctrl</kbd>] while clicking changes the value by 10 instead of 1</rules>",
		anchor: '.effects > ul',
		pendingIf: (calculatorState) => calculatorState.damageSources.some((source) => source.appliedEffects.value.length) || calculatorState.damageTargets.some((source) => source.appliedEffects.value.length),
		showOn: {
			scoreboardItemExpanded([, damageSource]) {
				return !!damageSource.appliedEffects.value.length;
			},
			effectsDialogClosed(damageSource) {
				return !!damageSource.appliedEffects.value.length;
			},
		},
		completeOn: ['scoreboardEffectModified'],
	},
	manipulateScoreboardItem: {
		title: 'manipulate scoreboard item',
		type: 'damageSource',
		text: '<i>scoreboard items</i> can be moved around the scoreboard with the manipulate button<span class="not-si-manipulate-only">s</span> found on their side<span class="not-si-manipulate-only">. Some of them have alternative action when a key is held - hover over a button to see its description</span><span class="mouse-only">.<br><b>You can also move a <i>scoreboard item</i> by dragging the buttons or the champion image</b></span>',
		anchor: '.manipulate-mask, .manipulate',
		completeOn: ['scoreboardItemMoved', 'scoreboardItemDuplicated'],
	},
	doubleClickToggleDamageSource: {
		title: 'toggle scoreboard item',
		type: 'damageSource',
		text: '<i>scoreboard items</i> can also be collapsed/expanded by double clicking their background. The same goes for <i>result sections</i>',
		anchor: '.header',
		showOn: {
			scoreboardItemButtonToggled: true,
		},
		completeOn: ['scoreboardItemDblclickToggled'],
	},
	addResultsSection: {
		title: 'result sections',
		type: 'global',
		text: 'you can compare the numbers between different <i>damage sources</i> in the <i>results table</i>. Start by adding a <i>results section</i>',
		anchor: '#add-section',
		showOn: {
			scoreboardItemButtonToggled: true,
		},
		completeOn: ['resultsSectionAdded'],
	},
	resultsSectionTooltip: {
		title: 'result hover tooltips',
		type: 'resultSection',
		text: 'result sections have modified hover tooltips<span class="touch-only"> (long press section title to show them)</span>. Values that can be compared (like an ability\'s <magicdamage>magic damage</magicdamage>) have their names displayed instead and the values for each <i>column source</i> can be found below<br> <rules>The names of the <i>variables</i> are currently extracted from game data. Row names might not make what they are describing obvious, reference where they are in the tooltip to make sense of them</rules>',
		anchor: "th[scope='colgroup'] > [data-tooltip-trigger]",
		pendingIf: (calculatorState) => !!calculatorState.resultSections.length,
		showOn: {
			resultsSectionAdded: true,
		},
	},
	addResultsColumn: {
		title: 'result columns',
		type: 'resultColumn',
		text: "multiple <i>damage sources</i> can be added for comparison. Press the \"add column\" button to add a new one, then click on champion image to select <i>column's source</i> and <i>target</i> from your configured <i>damage sources</i><br> <rules>The values displayed below should be interpreted as the <i>column's source</i> (left) hitting the <i>column's target</i> (right)</rules>",
		anchor: '#add-column',
		completeOn: ['resultsColumnAdded'],
	},
	flipResults: {
		title: 'flip results',
		type: 'global',
		text: 'values in <i>result columns</i> can be flipped when "flip target vs source" is checked. Instead of <i>column\'s source</i> hitting <i>column\'s target</i>, the other way around - target hitting source - will be shown.<br> <rules>note that this is not equivalent with swapping <i>scoreboard\'s</i> <i>sources</i> with the <i>targets</i>. The main difference is that anything that applies an effect onto the target won\'t do so (like Black Cleaver stacks or Frozen Heart effect).<br> <b>If you want to check the damage of X on Y, just put the X in <i>scoreboard sources</i> and Y in <i>scoreboard targets</i>.</b><br> Check the <a href="guide#apply-x-on-target" target="_blank">guide page</a> for a more detailed explanation</rules>',
		anchor: "[for='results-table-values-for']",
		showOn: {
			flipResultsEntered: true,
		},
	},
};

export const TUTORIAL_EVENT_TO_STEP_IDS = {
	completeOn: Object.entries(tutorialSteps).reduce(
		(acc, [currId, currDef]) => {
			if (currDef.completeOn) {
				for (const eventName of currDef.completeOn) {
					acc[eventName] ??= [];
					acc[eventName]!.push(currId as ITutorialStepId);
				}
			}
			return acc;
		},
		{} as Partial<Record<ITutorialEvent, ITutorialStepId[]>>,
	),
	showOn: Object.entries(tutorialSteps).reduce(
		(acc, [currId, currDef]) => {
			if (currDef.showOn) {
				for (const eventName in currDef.showOn) {
					acc[eventName as ITutorialEvent] ??= [];
					acc[eventName as ITutorialEvent]!.push(currId as ITutorialStepId);
				}
			}
			return acc;
		},
		{} as Partial<Record<ITutorialEvent, ITutorialStepId[]>>,
	),
};

/** used to decide which step should be shown when popover is available. The lower the number, the higher the priority */
export const TUTORIAL_STEP_PRIORITIES = Object.fromEntries(
	TUTORIAL_STEP_IDS.map((id) => {
		if (id === 'greeting' || id === 'beforeYouStart') {
			return [id, 0];
		}
		const def = tutorialSteps[id];
		return [id, def.within ? 1 : !tutorialStepKinds[id] ? 2 : 3];
	}),
) as Record<ITutorialStepId, number>;
