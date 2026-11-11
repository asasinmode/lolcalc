<script setup vapor lang="ts">
const el = useTemplateRef('el');

const tutorialSteps = [
	'greeting',
	// 'selectChampion',
	// 'openItemShop',
	// 'itemShopFunctionality',
	// 'openRunes',
	// 'changeChampionLevel',
	// 'changeAbilityLevel',
	// 'viewExtraComponent',
	// 'toggleScoreboardItemShortcut',
	// 'dragScoreboardItems',
	// 'addResultSection',
	// 'addResultColumn',
] as const;

type ITutorialStep = (typeof tutorialSteps)[number];

const tutorialProgress = ref(Object.fromEntries(tutorialSteps.map((key) => [key, 0])) as Record<ITutorialStep, number>);
const currentStep = ref<ITutorialStep>();

function saveTutorialProgress() {
	localStorage.setItem('lolcalc-tutorial-progress', Object.values(tutorialProgress.value).join(''));
}

function finishTutorial() {
	localStorage.setItem('lolcalc-tutorial-finished-at', new Date().toJSON());
	el.value?.hidePopover();
	console.log('finishing', el.value);
}

let fullTutorial = false;

function ackStep() {
	if (currentStep.value) {
		tutorialProgress.value[currentStep.value] = 1;
		saveTutorialProgress();
		const currentStepIndex = tutorialSteps.indexOf(currentStep.value);
		if (currentStepIndex === tutorialSteps.length - 1) {
			finishTutorial();
			return;
		}
		// if(fullTutorial){
		// find next applicable and show it or hide and wait for a trigger to happen?
		// } else {
		// just wait for a trigger to happen?
		// 	el.value?.hidePopover();
		// }
		el.value?.hidePopover();
	} else {
		console.warn('[TheTutorial] ack step without current');
		el.value?.hidePopover();
	}
}

function chooseTutorial(full: boolean) {
	fullTutorial = full;
	localStorage.setItem('lolcalc-tutorial-full', `${fullTutorial}`);
	ackStep();
}

const isGreetingStep = computed(() => currentStep.value === 'greeting');

const title = computed(() => {
	return currentStep.value === 'greeting' ? 'first time?' : 'tutorial';
});

onMounted(() => {
	// TODO check what's tutorialed and show appropriate
	const savedProgress = localStorage.getItem('lolcalc-tutorial-progress');
	for (let i = 0; i < tutorialSteps.length; i++) {
		tutorialProgress.value[tutorialSteps[i]!] = savedProgress?.[i] === '1' ? 1 : 0;
		currentStep.value ??= tutorialSteps[i];
	}
	const savedFullTutorial = localStorage.getItem('lolcalc-tutorial-full');
	fullTutorial = !savedFullTutorial || savedFullTutorial === 'true';
});

defineExpose({
	reset() {
		localStorage.removeItem('lolcalc-tutorial-finished-at');
		localStorage.removeItem('lolcalc-tutorial-progress');
		localStorage.removeItem('lolcalc-tutorial-full');
		el.value?.showPopover();
	},
});
</script>

<template>
	<article id="tutorial-popover" ref="el" popover="manual" class="hover-tooltip custom" :class="{ 'rotating-glow': isGreetingStep }" :data-current-step="currentStep">
		<h1>{{ title }}</h1>
		<template v-if="isGreetingStep">
			<p><strong>lolcalc</strong> can be daunting at first. Want an interactive tutorial?</p>
			<button id="tutorial-yes" class="pretend-ui-btn" @click="chooseTutorial(true)">yes</button>
			<button class="pretend-ui-btn remove" @click="chooseTutorial(false)">no</button>
			<p>If you ever feel lost, visit the <NuxtLink to="/guide">guide page</NuxtLink></p>
			<footer>for most tooltips, press [K] when it's visible to pin it</footer>
		</template>
		<button v-show="!isGreetingStep" id="tutorial-ok" class="pretend-ui-btn" @click="ackStep">ok</button>
	</article>
</template>

<style>
@layer components {
	#tutorial-popover {
		--at-apply: 'grid-cols-2 auto-rows-min gap-x-3 z-99 shadow-lg';
		--tooltip-max-w: calc(110 * var(--spacing));
		--glow-duration: 3s;

		&:popover-open {
			--at-apply: 'grid';
		}

		> h1 {
			--at-apply: 'text-white font-600 col-span-full mbe-1 text-center text-xl';
		}

		> p {
			--at-apply: 'col-span-full mbe-3 text-neutral-200';
		}

		> footer {
			--at-apply: 'col-span-full text-end mt-0';
		}

		> .pretend-ui-btn {
			--at-apply: 'px-2 block-[--manipulate-btn-size] inline-max';
		}

		#tutorial-yes {
			--at-apply: 'justify-self-end hoverable:bg-green-500 mbe-3';
		}

		#tutorial-ok {
			--at-apply: 'block self-end';
		}
	}
}

@layer overrides {
	#tutorial-popover {
		--at-apply: 'absolute pointer-events-auto of-visible';
	}
}
</style>
