<script setup vapor lang="ts">
import type { ITutorialStepId, ITutorialEvent } from '~/utils/tutorial';
import { TUTORIAL_STEP_IDS, attachTutorialSink, saveTutorialState, tutorialStepKinds, useTutorialState } from '~/utils/tutorial';
import type { ITutorialStepDef } from './steps';
import { tutorialSteps, TUTORIAL_EVENT_TO_STEP_IDS, TUTORIAL_STEP_PRIORITIES } from './steps';

const GLOW_CLASS = 'rotating-glow';
const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const tutorialState = useTutorialState();
const el = useTemplateRef<HTMLElement>('el');

const currentStepId = shallowRef<ITutorialStepId>();
const step = computed(() => (currentStepId.value ? tutorialSteps[currentStepId.value] : undefined));
const isGreeting = computed(() => currentStepId.value === 'greeting');

const notDoneGuidedStepIds = new Set<ITutorialStepId>();
/** general steps that are ready to be shown when tutorial is freed up */
const pendingGeneralSteps: ITutorialStepId[] = [];
let lastInteractedIds: ITutorialEventSourceIds = {};
/** <main id="index"> */
let originalParent: ParentNode | null = null;
let highlightedEl: Element | undefined;
let currentAnchor: HTMLElement | null | undefined;
let raf = 0;
let focusNext = false;

function isDone(id: ITutorialStepId) {
	return tutorialState.steps[id] === 1;
}

function onEvent(name: ITutorialEvent, eventSourceIds: ITutorialEventSourceIds, data: any) {
	const completeStepIds = TUTORIAL_EVENT_TO_STEP_IDS.completeOn[name];
	if (completeStepIds?.length) {
		if ('damageSource' in eventSourceIds) lastInteractedIds.damageSource = eventSourceIds.damageSource;
		if ('resultColumn' in eventSourceIds) lastInteractedIds.resultColumn = eventSourceIds.resultColumn;
		if ('resultSection' in eventSourceIds) lastInteractedIds.resultSection = eventSourceIds.resultSection;

		let stepCompleted = false;
		for (const stepId of completeStepIds) {
			if (!isDone(stepId)) {
				completeStep(stepId);
				stepCompleted = true;
			}
		}
		stepCompleted && saveTutorialState();
	}

	if (currentStepId.value && (['damageSourceAdjusted', 'damageSourceExpanded'] as ITutorialEvent[]).includes(name) && tutorialSteps[currentStepId.value].type === 'damageSource') {
		repositionCurrentStep();
	}

	const showableStepIds = TUTORIAL_EVENT_TO_STEP_IDS.showOn[name]?.filter((stepId) => !isDone(stepId));
	if (!showableStepIds?.length) {
		if (pendingGeneralSteps.length || (tutorialState.guided && notDoneGuidedStepIds.size)) scheduleUpdate();
		return;
	}

	for (const stepId of showableStepIds) {
		if (tutorialStepKinds[stepId] || tutorialState.guided) {
			const stepDef = tutorialSteps[stepId];
			const pendingIndex = pendingGeneralSteps.indexOf(stepId);
			const showOn = stepDef.showOn![name];
			const show = typeof showOn === 'function' ? showOn(data as never) : showOn;
			if (show) {
				pendingIndex === -1 && pendingGeneralSteps.push(stepId);
			} else if (~pendingIndex && show === false) {
				pendingGeneralSteps.splice(pendingIndex, 1);
			}
		}
	}
	scheduleUpdate();
}

function completeStep(id: ITutorialStepId, focus = false) {
	notDoneGuidedStepIds.delete(id);
	const pendingStepIndex = pendingGeneralSteps.indexOf(id);
	~pendingStepIndex && pendingGeneralSteps.splice(pendingStepIndex, 1);
	tutorialState.steps[id] = 1;
	currentStepId.value === id && hide();
	scheduleUpdate(focus);
}

function ackCurrentStep() {
	if (currentStepId.value) {
		completeStep(currentStepId.value, true);
		saveTutorialState();
	}
}

function selectTutorialMode(isGuided: boolean) {
	tutorialState.guided = isGuided;
	if (isGuided) {
		for (const id of TUTORIAL_STEP_IDS) {
			!tutorialStepKinds[id] && notDoneGuidedStepIds.add(id);
		}
	}
	ackCurrentStep();
}

function scheduleUpdate(focus = false) {
	focusNext ||= focus;
	raf ||= requestAnimationFrame(() => {
		raf = 0;
		updatePopup(focusNext);
		focusNext = false;
	});
}

interface IPickedStep {
	id: ITutorialStepId;
	anchor?: HTMLElement | null;
	targetParent?: HTMLElement | null;
}

function updatePopup(focus: boolean) {
	const candidateIds = [...pendingGeneralSteps, ...notDoneGuidedStepIds.values()].filter((stepId) => !isDone(stepId));
	let stepToDisplayId: ITutorialStepId | undefined = currentStepId.value;
	let currentStepPriority = stepToDisplayId ? TUTORIAL_STEP_PRIORITIES[stepToDisplayId] : Number.POSITIVE_INFINITY;

	do {
		const candidateId = candidateIds.shift()!;
		const candidatePriority = TUTORIAL_STEP_PRIORITIES[candidateId];
		if (candidatePriority < currentStepPriority) {
			stepToDisplayId = candidateId;
			currentStepPriority = candidatePriority;
		}
	} while (candidateIds.length);
	if (!stepToDisplayId || stepToDisplayId === currentStepId.value) return;

	const stepDef = tutorialSteps[stepToDisplayId];

	const openDialog = document.querySelector('dialog:modal');
	if (openDialog && (!stepDef.within || stepDef.within !== openDialog.id)) return;

	let targetParent: IPickedStep['targetParent'];
	if (stepDef.within) {
		targetParent = document.getElementById(stepDef.within);
		if (!targetParent) {
			console.warn("[TheTutorial updatePopup] failed to find step's wanted parent", stepToDisplayId, stepDef);
			return;
		}
	}

	const anchor = findStepAnchor(stepDef);
	if (anchor !== false) show({ id: stepToDisplayId, targetParent, anchor }, focus);
}

let scoreboardEl: HTMLElement | null = null;
let scoreboardSources: HTMLElement | null = null;
let scoreboardTargets: HTMLElement | null = null;

/** returned `false` means step wanted an anchor but it wasn't found. Most likely shouldn't be displayed */
function findStepAnchor(stepDef: ITutorialStepDef): IPickedStep['anchor'] | false {
	if (!stepDef.anchor) return;
	let queryTarget: HTMLElement | Document | null = null;
	if (stepDef.type === 'damageSource') {
		// TODO needs to be updated when scoreboard's isDisplayingTarget or damage sources are moved/removed
		queryTarget = lastInteractedIds.damageSource ? document.getElementById(`si-${lastInteractedIds.damageSource}`) : null;
		queryTarget ??= scoreboardEl;
	} else {
		console.warn('TODO anchor of', stepDef);
		return;
	}

	queryTarget ??= document;
	if (typeof stepDef.anchor === 'string') {
		const targets = queryTarget.querySelectorAll<HTMLElement>(stepDef.anchor);
		for (const target of targets) {
			if (target.checkVisibility()) {
				return target;
			}
		}
	} else {
		const targets = queryTarget.querySelectorAll<HTMLElement>(stepDef.anchor[0]);
		for (const target of targets) {
			const refinedTarget = stepDef.anchor[1](target);
			if (refinedTarget?.checkVisibility()) {
				return refinedTarget;
			}
		}
	}
	return false;
}

function show(pick: IPickedStep, focus: boolean) {
	hide();
	currentStepId.value = pick.id;
	if (!el.value) return;

	const parent = pick.targetParent ?? originalParent;
	if (parent && el.value.parentNode !== parent) parent.appendChild(el.value);

	el.value.toggleAttribute('data-anchored', !!pick.anchor);
	if (pick.anchor) {
		highlightedEl = pick.anchor;
		highlightedEl.classList.add(GLOW_CLASS);
	} else {
		el.value.classList.add(GLOW_CLASS);
	}
	el.value.showPopover((pick.anchor ? { source: pick.anchor } : pick.targetParent ? { source: pick.targetParent } : undefined) as ShowPopoverOptions | undefined);
	currentAnchor = pick.anchor;

	// TODO check scrolling
	if (focus || pick.id === 'greeting' || pick.id === 'beforeYouStart') el.value.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
}

function hide() {
	el.value?.classList.remove(GLOW_CLASS);
	if (el.value?.matches(':popover-open')) el.value.hidePopover();
	highlightedEl?.classList.remove(GLOW_CLASS);
	highlightedEl = undefined;
	currentStepId.value = undefined;
}

function repositionCurrentStep() {
	if (!currentStepId.value || currentAnchor?.checkVisibility()) return;

	const stepDef = tutorialSteps[currentStepId.value];
	const viableAnchor = findStepAnchor(stepDef);
	if (viableAnchor === false) {
		hide();
		return;
	}

	/* preferrably would be done using position-anchor manipulation on current/viable anchors but I couldn't get it to work. Will have to be revisited, especially if it causes keyboard nav/screen reader issues */
	if (viableAnchor && viableAnchor !== currentAnchor) {
		el.value?.hidePopover();
		el.value?.showPopover({ source: viableAnchor });
	}
}

function reset() {
	hide();
	notDoneGuidedStepIds.clear();
	pendingGeneralSteps.length = 0;
	if (tutorialState.guided) {
		for (const id of TUTORIAL_STEP_IDS) {
			if (!tutorialStepKinds[id] && !isDone(id)) {
				notDoneGuidedStepIds.add(id);
			}
		}
	}
	if (!isDone('greeting')) pendingGeneralSteps.unshift('greeting');
	if (!isDone('beforeYouStart')) pendingGeneralSteps.splice(pendingGeneralSteps[0] === 'greeting' ? 1 : 0, 0, 'beforeYouStart');
	scheduleUpdate();
}

let detach: (() => void) | undefined;

onMounted(() => {
	originalParent = document.getElementById('index');
	scoreboardEl = document.getElementById('scoreboard');
	scoreboardSources = document.getElementById('scoreboard-sources');
	scoreboardTargets = document.getElementById('scoreboard-targets');
	reset();
	detach = attachTutorialSink({ onEvent, reload: reset });
});

onBeforeUnmount(() => {
	detach?.();
	cancelAnimationFrame(raf);
	hide();
	if (el.value && originalParent && el.value.parentNode !== originalParent) originalParent.appendChild(el.value);
});
</script>

<template>
	<article id="tutorial-popover" ref="el" popover="manual" class="hover-tooltip custom" :class="{ 'rotating-glow': isGreeting }" :data-current-step="currentStepId">
		<h1>{{ step?.title }}</h1>
		<template v-if="isGreeting">
			<p><strong>lolcalc</strong> can be daunting at first. want an interactive tutorial?</p>
			<div>
				<button class="pretend-ui-btn" @click="selectTutorialMode(true)">yes <i>(recommended)</i></button>
				<button class="pretend-ui-btn remove" @click="selectTutorialMode(false)">no</button>
			</div>
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
		--at-apply: 'auto-rows-min z-99 shadow-lg';
		--tooltip-max-w: calc(124 * var(--spacing));
		--glow-duration: 3s;

		&:popover-open {
			--at-apply: 'grid';
		}

		> h1 {
			--at-apply: 'text-white font-600';
		}

		&[data-current-step='greeting'] {
			> h1 {
				--at-apply: 'mbe-1 text-xl text-center';
			}

			> div {
				--at-apply: 'flex justify-center gap-x-3';

				> .pretend-ui-btn {
					--at-apply: 'min-inline-12 inline-fit px-3 text-center text-lg block-8';

					&:first-of-type {
						--at-apply: 'hoverable:bg-green-500';
					}
				}
			}

			> footer {
				--at-apply: 'mbs-3 b-0 pbs-0 text-center';
			}
		}

		&:not([data-current-step='greeting']) {
			--at-apply: 'grid-cols-[minmax(0,1fr)_max-content] gap-x-6';

			> h1 {
				--at-apply: 'text-lg leading-none self-center text-start';
			}
		}

		> p {
			--at-apply: 'mbe-3 text-neutral-200 text-center text-lg';
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

		#tutorial-ok {
			--at-apply: 'inline-max block-[--manipulate-btn-size] px-2.5 text-base row-start-1 col-start-2';
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
