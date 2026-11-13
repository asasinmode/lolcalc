<script setup vapor lang="ts">
import type { ITutorialStepId, ITutorialEvent, TutorialEvents } from '~/utils/tutorial';
import { TUTORIAL_STEP_IDS, attachTutorialSink, saveTutorialState, tutorialRequest, tutorialStepKinds, useTutorialState } from '~/utils/tutorial';
import type { ITutorialStepDef } from './steps';
import { tutorialSteps } from './steps';

const GLOW_CLASS = 'rotating-glow';
const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface IEventCause {
	name: ITutorialEvent;
	data: unknown;
	eventSourceIds: ITutorialEventSourceIds;
}

const tutorialState = useTutorialState();
const el = useTemplateRef<HTMLElement>('el');

const currentStepId = shallowRef<ITutorialStepId>();
const step = computed(() => (currentStepId.value ? tutorialSteps[currentStepId.value] : undefined));
const isGreeting = computed(() => currentStepId.value === 'greeting');

/** general steps that were triggered and aren't done yet to the event that triggered them */
const pending = new Map<ITutorialStepId, IEventCause | undefined>();
let lastInteractedIds: ITutorialEventSourceIds = {};
let forcedId: ITutorialStepId | undefined;
/** <main id="index"> */
let homeParent: ParentNode | null = null;
let anchorEl: Element | null | undefined;
let glowEl: Element | undefined;
let raf = 0;
let focusNext = false;
let detach: (() => void) | undefined;

function isDone(id: ITutorialStepId) {
	return tutorialState.steps[id] === 1;
}

const TUTORIAL_EVENT_TO_STEP_IDS = Object.entries(tutorialSteps).reduce(
	(acc, [currId, currDef]) => {
		if (currDef.completeOn) {
			for (const eventName in currDef.completeOn) {
				acc[eventName as ITutorialEvent] ??= [];
				acc[eventName as ITutorialEvent]!.push(currId as ITutorialStepId);
			}
		}
		if (currDef.showOn) {
			for (const eventName in currDef.showOn) {
				acc[eventName as ITutorialEvent] ??= [];
				acc[eventName as ITutorialEvent]!.push(currId as ITutorialStepId);
			}
		}
		return acc;
	},
	{} as Partial<Record<ITutorialEvent, ITutorialStepId[]>>,
);

function onEvent(name: ITutorialEvent, eventSourceIds: ITutorialEventSourceIds, data: unknown) {
	const cause: IEventCause = { name, data, eventSourceIds };
	const eventStepIds = TUTORIAL_EVENT_TO_STEP_IDS[name];
	if (!eventStepIds?.length) return;

	if (eventStepIds.some((id) => tutorialSteps[id].completeOn?.[name])) {
		lastInteractedIds = { ...lastInteractedIds, ...eventSourceIds };
	}

	for (const id of eventStepIds) {
		if (isDone(id)) continue;
		const def = tutorialSteps[id];
		if (callStepEventCb(def.completeOn, name, data)) {
			completeStep(id);
			continue;
		}

		if (tutorialStepKinds[id] || tutorialState.guided) {
			const show = callStepEventCb(def.showOn, name, data);
			const isPending = pending.has(id);
			if (show) {
				!isPending && pending.set(id, cause);
			} else if (isPending && show === false) {
				pending.delete(id);
			}
		}
	}
	scheduleEvaluate();
}

/** if `undefined`, event was not found in `triggers` (is ignored) */
function callStepEventCb(triggers: ITutorialStepDef['showOn'], name: ITutorialEvent, data: unknown): boolean | undefined {
	const trigger = triggers?.[name];
	if (trigger) {
		return trigger === true || (trigger as (data: unknown) => boolean)(data);
	}
}

function completeStep(id: ITutorialStepId, focus = false) {
	pending.delete(id);
	tutorialState.steps[id] = 1;
	saveTutorialState();
	if (forcedId === id) forcedId = undefined;
	currentStepId.value === id && hide();
	scheduleEvaluate(focus);
}

function ackCurrentStep() {
	currentStepId.value && completeStep(currentStepId.value, true);
}

function selectTutorialMode(isGuided: boolean) {
	tutorialState.guided = isGuided;
	ackCurrentStep();
}

/** for debug / link to a specific tutorial step (`?ttl=step id`): show regardless of mode and triggers */
function forceShow(id: ITutorialStepId) {
	forcedId = id;
	scheduleEvaluate(true);
}

/** as if freshly mounted, after the state was changed from outside */
function reload() {
	hide();
	pending.clear();
	forcedId = undefined;
	if (!isDone('greeting')) pending.set('greeting', undefined);
	scheduleEvaluate();
}

function scheduleEvaluate(focus = false) {
	focusNext ||= focus;
	raf ||= requestAnimationFrame(() => {
		raf = 0;
		evaluate(focusNext);
		focusNext = false;
	});
}

interface IPickedStep {
	id: ITutorialStepId;
	anchor?: Element | null;
	targetParent?: HTMLElement | null;
	tier: number;
}

function evaluate(focus: boolean) {
	if (!el.value) return;
	const modal = document.querySelector<HTMLDialogElement>('dialog:modal');
	/** general (and oldest) first, then guided ones as declared */
	const order = forcedId ? [forcedId] : [...new Set([...pending.keys(), ...TUTORIAL_STEP_IDS])];
	let best: IPickedStep | undefined;

	for (const id of order) {
		if (!forcedId && (isDone(id) || (id !== 'beforeYouStart' && tutorialStepKinds[id] && !pending.has(id)))) {
			continue;
		}

		const def = tutorialSteps[id];
		const targetParent = def.within ? document.getElementById(def.within) : null;
		if (def.within && !targetParent) continue;
		if (modal ? !targetParent || !modal.contains(targetParent) : targetParent?.closest('dialog')) continue;

		let anchor: IPickedStep['anchor'];
		if (def.anchor) {
			if (id === currentStepId.value && anchorEl?.isConnected && anchorEl.checkVisibility()) {
				/* already displayed on an anchor, don't move on subsequent events */
				anchor = anchorEl;
			} else {
				const cause = pending.get(id);
				anchor = def.anchor(cause?.eventSourceIds ?? lastInteractedIds, cause?.name, cause?.data as TutorialEvents[ITutorialEvent]);
			}
			if (!anchor?.isConnected || !anchor.checkVisibility()) {
				console.warn(`[TheTutorial evaluate] anchor for "${id}" not found, skipping`);
				continue;
			}
		}

		/* greeting & before you start > steps inside a dialog > guided chain > general */
		const tier = id === 'greeting' || id === 'beforeYouStart' ? 0 : def.within ? 1 : !tutorialStepKinds[id] ? 2 : 3;
		if (!best || tier < best.tier) {
			best = { id, anchor, targetParent, tier };
		}
	}

	if (!best) {
		hide();
	} else if (currentStepId.value !== best.id || anchorEl !== best.anchor || !el.value.matches(':popover-open')) {
		show(best, focus);
	}
}

function show(pick: IPickedStep, focus: boolean) {
	hide();
	currentStepId.value = pick.id;
	const popover = el.value;
	if (!popover) return;

	const parent = pick.targetParent ?? homeParent;
	if (parent && popover.parentNode !== parent) parent.appendChild(popover);

	popover.toggleAttribute('data-anchored', !!pick.anchor);
	anchorEl = pick.anchor;
	if (pick.anchor) {
		glowEl = tutorialSteps[pick.id].glow?.(pick.anchor) ?? pick.anchor;
		glowEl.classList.add(GLOW_CLASS);
	} else {
		popover.classList.add(GLOW_CLASS);
	}
	// TODO check if needs anchor-name management
	popover.showPopover((pick.anchor ? { source: pick.anchor } : pick.targetParent ? { source: pick.targetParent } : undefined) as ShowPopoverOptions | undefined);

	if (focus || pick.id === 'greeting') popover.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
}

function hide() {
	el.value?.classList.remove(GLOW_CLASS);
	if (el.value?.matches(':popover-open')) el.value.hidePopover();
	glowEl?.classList.remove(GLOW_CLASS);
	glowEl = undefined;
	anchorEl = undefined;
	currentStepId.value = undefined;
}

watch(tutorialRequest, (request) => {
	if (request && request.force) forceShow(request.force);
});

onMounted(() => {
	homeParent = document.getElementById('index');
	reload();
	const request = tutorialRequest.value;
	if (request && request.force) forceShow(request.force);
	detach = attachTutorialSink({ onEvent, forceShow, reload });
});

onBeforeUnmount(() => {
	detach?.();
	cancelAnimationFrame(raf);
	hide();
	if (el.value && homeParent && el.value.parentNode !== homeParent) homeParent.appendChild(el.value);
});
</script>

<template>
	<article id="tutorial-popover" ref="el" popover="manual" class="hover-tooltip custom" :class="{ 'rotating-glow': isGreeting }" :data-current-step="currentStepId">
		<h1>{{ step?.title }}</h1>
		<template v-if="isGreeting">
			<p><strong>lolcalc</strong> can be daunting at first. want an interactive tutorial?</p>
			<button id="tutorial-yes" class="pretend-ui-btn" @click="selectTutorialMode(true)">yes</button>
			<button class="pretend-ui-btn remove" @click="selectTutorialMode(false)">no</button>
			<footer>If you feel lost or something's unclear, visit the <NuxtLink to="/guide">guide page</NuxtLink></footer>
		</template>
		<template v-else>
			<div v-html="step?.text" class="game-description" />
			<button id="tutorial-ok" class="pretend-ui-btn" @click="ackCurrentStep">ok</button>
		</template>
	</article>
</template>

<style>
@layer components {
	#tutorial-popover {
		--at-apply: 'grid-cols-2 auto-rows-min gap-x-3 z-99 shadow-lg';
		--tooltip-max-w: calc(124 * var(--spacing));
		--glow-duration: 3s;

		&:popover-open {
			--at-apply: 'grid';
		}

		> h1 {
			--at-apply: 'text-white font-600';
		}

		&[data-current-step='greeting'] {
			--at-apply: 'grid-cols-2';

			> h1 {
				--at-apply: 'col-span-full mbe-1 text-xl text-center';
			}
		}

		&:not([data-current-step='greeting']) {
			--at-apply: 'grid-cols-[minmax(0,1fr)_max-content] gap-x-6';

			> h1 {
				--at-apply: 'text-lg leading-none self-center text-start';
			}
		}

		> p {
			--at-apply: 'mbe-3 col-span-full text-neutral-200 text-center text-lg';
		}

		> .game-description {
			--at-apply: 'col-span-full b-0 pbs-1 text-neutral-200';

			kbd {
				--at-apply: 'font-inherit';
			}

			> li {
				--at-apply: 'mbs-0';
			}
		}

		> .pretend-ui-btn {
			--at-apply: 'inline-12 text-center text-lg block-8';
		}

		> footer {
			--at-apply: 'col-span-full mbs-3 b-0 pbs-0 text-center';
		}

		#tutorial-yes {
			--at-apply: 'justify-self-end hoverable:bg-green-500';
		}

		#tutorial-ok {
			--at-apply: 'block inline-max block-[--manipulate-btn-size] px-2.5 text-base row-start-1 col-start-2';
		}
	}
}

@layer overrides {
	#tutorial-popover {
		--at-apply: 'absolute pointer-events-auto of-visible';
		position-area: block-end span-inline-end;
		position-try-fallbacks:
			flip-block,
			flip-inline,
			flip-block flip-inline;
		position-visibility: anchors-visible;

		/* &[data-anchored] { */
		/* 	inset: auto; */
		/* 	margin: 0.75rem; */
		/* } */

		/* &[data-docked]:not([data-anchored]) { */
		/* 	inset: auto 1rem 1rem auto; */
		/* 	margin: 0; */
		/* } */
	}
}
</style>
