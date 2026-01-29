<script setup lang="ts">
const props = defineProps<{
	index: number;
	value: DamageSource;
	/** side of the scoreboard it's on, left (damage sources) by default */
	isRight?: boolean;
	canRemove?: boolean;
	canMoveDown?: boolean;
}>();

const emit = defineEmits<{
	clear: [];
	remove: [];
	duplicate: [shift: boolean];
	changeGroup: [alt: boolean];
	move: [toIndex: number, alt: boolean];
	startDrag: [event: MouseEvent, duplicate?: boolean];
}>();

const runes = useRunes();
const ui = useUi();
const { version, minorVersion } = usePatchVersion();
const { selectChampion } = useChampSelect();
const { selectRunes } = useRuneSelect();
const { selectItems } = useItemShop();
const text = useText();
const globalKeyModifiers = useGlobalKeyModifiers();

const group = computed(() => props.isRight ? 'targets' : 'sources');
const otherGroup = computed(() => props.isRight ? 'sources' : 'targets');

const runePathPrimary = computed(() => {
	const { primary, primarySlots } = props.value.runes.value.paths;
	if (primarySlots[0]) {
		const { iconColor } = runes.paths[primary]!;
		const { name } = text.runes.paths[primary]!;
		return {
			icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
			name,
		};
	}
	return undefined;
});

const runePathSecondary = computed(() => {
	const { secondary } = props.value.runes.value.paths;
	if (secondary) {
		const { iconColor } = runes.paths[secondary]!;
		const { name } = text.runes.paths[secondary]!;
		return {
			icon: `https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-collections/global/default/perks/images/${name.toLowerCase()}/${name.toLowerCase()}_icon.svg`,
			iconColor,
			name,
		};
	}
	return undefined;
});

const isFirstAndOnly = computed(() => props.index === 0 && !props.canMoveDown);

function emitClear() {
	emit('clear');
}

function emitRemove() {
	if (globalKeyModifiers.value.shift) {
		emit('clear');
	} else {
		emit('remove');
	}
}

const removeButtonAttrs = computed(() => (isFirstAndOnly.value
	? {
			title: 'clear',
			disabled: !props.value.anythingFilled.value,
			emit: emitClear,
		}
	: {
			title: 'remove, shift+click to clear',
			disabled: !props.canRemove,
			emit: emitRemove,
		}));

const detailsContainer = useTemplateRef('details');

function toggleExpanded() {
	if (detailsContainer.value!.getAttribute('open') === null) {
		detailsContainer.value!.setAttribute('open', '');
	} else {
		detailsContainer.value!.removeAttribute('open');
	}
}

onMounted(() => props.index === 0 && props.value && toggleExpanded());

const championStats = computed(() => calculateChampionStats(props.value));

const minorStats = computed<{
	name: string;
	iconTextureKey: keyof (typeof ui)['playerStats'];
	description: string;
	isPercentage?: boolean;
	values: {
		name: string;
		decimal?: boolean;
		base?: number;
		bonus?: number;
		total: number;
	}[];
	bottomText?: string;
}[]>(() => {
	const { stats } = championStats.value;
	return [
		{
			name: 'Health | Resource Regeneration',
			description: 'The amount of <scalehealth>Health</scalehealth> you regenerate over 5 seconds.<br/><br/>The amount of Ability resource you regenerate over 5 seconds (usually <scalemana>Mana</scalemana> or <energy>Energy</energy>).',
			iconTextureKey: 'healthResourceRegen',
			values: [
				{
					name: 'Health Regen',
					base: stats.base.hpRegen,
					bonus: stats.bonus.hpRegen,
					total: stats.total.hpRegen,
				},
				{
					name: 'Resource Regen',
					base: stats.base.manaRegen,
					bonus: stats.bonus.manaRegen,
					total: stats.total.manaRegen,
				},
			],
		},
		{
			name: 'Heal and Shield Power',
			description: 'Increases the effectiveness of <healing>Heals</healing> and <shields>Shields</shields>.',
			iconTextureKey: 'healShieldPower',
			isPercentage: true,
			values: [
				{
					name: 'Heal and Shield Power',
					base: stats.base.healShieldPower,
					bonus: stats.bonus.healShieldPower,
					total: stats.total.healShieldPower,
				},
			],
		},
		{
			name: 'Lethality | Armor Penetration',
			description: 'Ignores an amount of your target\'s <scalearmor>Armor</scalearmor> when applying <physicaldamage>physical damage</physicaldamage>.<br><br><scalelethality>Lethality</scalelethality> ignores a flat amount, <scalelethality>Armor Penetration</scalelethality> ignores a percentage amount',
			iconTextureKey: 'armorPen',
			isPercentage: true,
			values: [
				{
					name: 'Lethality',
					base: stats.base.lethality,
					bonus: stats.bonus.lethality,
					total: stats.total.lethality,
				},
				{
					name: 'Armor Penetration',
					decimal: true,
					base: stats.base.percentArmorPen,
					bonus: stats.bonus.percentArmorPen,
					total: stats.total.percentArmorPen,
				},
			],
		},
		{
			name: 'Magic Penetration',
			description: 'Ignores an amount of your target\'s <scalemr>Magic Resist</scalemr> when applying <magicdamage>magic damage</magicdamage>.',
			iconTextureKey: 'magicPen',
			isPercentage: true,
			values: [
				{
					name: 'Flat Magic Penetration',
					base: stats.base.flatMagicPen,
					bonus: stats.bonus.flatMagicPen,
					total: stats.total.flatMagicPen,
				},
				{
					name: 'Magic Penetration',
					decimal: true,
					base: stats.base.percentMagicPen,
					bonus: stats.bonus.percentMagicPen,
					total: stats.total.percentMagicPen,
				},
			],
		},
		{
			name: 'Life Steal',
			description: 'Returns a portion of the damage you deal with Attacks as <scalehealth>Health</scalehealth>.',
			iconTextureKey: 'lifeSteal',
			isPercentage: true,
			values: [
				{
					name: 'Life Steal',
					base: stats.base.lifeSteal,
					bonus: stats.bonus.lifeSteal,
					total: stats.total.lifeSteal,
				},
			],
		},
		{
			name: 'Omnivamp',
			description: 'Returns a portion of all damage you deal as <scalehealth>Health</scalehealth>.<br><br>Reduced to 20% effectiveness when dealing damage to minions or monsters.',
			iconTextureKey: 'omnivamp',
			isPercentage: true,
			values: [
				{
					name: 'Omnivamp',
					base: stats.base.omnivamp,
					bonus: stats.bonus.omnivamp,
					total: stats.total.omnivamp,
				},
			],
		},
		{
			name: 'Attack Range',
			description: 'The distance at which you can Attack.',
			iconTextureKey: 'attackRange',
			values: [
				{
					name: 'Attack Range',
					base: stats.base.attackRange,
					bonus: stats.bonus.attackRange,
					total: stats.total.attackRange,
				},
			],
		},
		{
			name: 'Tenacity',
			description: 'Reduces the duration of crowd control debuffs, such as <keyword>Slows</keyword> and <keyword>Stuns</keyword>.<br><br>Does not affect <keyword>Airborne</keyword> and <keyword>Suppression</keyword>.',
			iconTextureKey: 'tenacity',
			isPercentage: true,
			values: [
				{
					name: 'Tenacity',
					base: stats.base.tenacity,
					bonus: stats.bonus.tenacity,
					total: stats.total.tenacity,
				},
			],
		},
	];
});

const el = useTemplateRef('el');

defineExpose({ el });
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
	<li ref="el" data-scoreboard-item="">
		<h3 class="sr-only">
			{{ group.slice(0, -1) }} {{ index + 1 }}
		</h3>
		<button
			title="move up, alt+click to duplicate above"
			class="pretend-ui-button"
			:disabled="index === 0"
			@click="$emit('move', index + (globalKeyModifiers.alt ? 0 : -1), globalKeyModifiers.alt)"
			@mousedown.left="$emit('startDrag', $event)"
		>
			<span class="sr-only">move up, alt+click to duplicate above</span>
			<Icon class="i-ph:arrow-up" />
		</button>
		<button
			title="move down, alt+click to duplicate below"
			class="pretend-ui-button"
			:disabled="!canMoveDown"
			@click="$emit('move', index + 1, globalKeyModifiers.alt)"
			@mousedown.left="$emit('startDrag', $event)"
		>
			<span class="sr-only">move down, alt+click to duplicate below</span>
			<Icon class="i-ph:arrow-down" />
		</button>
		<button
			:title="`move to ${otherGroup}, alt+click to duplicate into ${otherGroup}`"
			class="pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="$emit('changeGroup', globalKeyModifiers.alt)"
			@mousedown.left="$emit('startDrag', $event)"
		>
			<span class="sr-only">move to {{ otherGroup }}, alt+click to duplicate into {{ otherGroup }}</span>
			<Icon :class="isRight ? 'i-ph:arrow-left' : 'i-ph:arrow-right'" />
		</button>
		<button
			:title="`duplicate, shift+click to duplicate into ${otherGroup}`"
			class="pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="$emit('duplicate', globalKeyModifiers.shift)"
			@mousedown.left="$emit('startDrag', $event, true)"
		>
			<span class="sr-only">duplicate, shift+click to duplicate into {{ otherGroup }}</span>
			<Icon class="i-ph:copy" />
		</button>
		<div data-select-champion="">
			<button
				title="select champion"
				@click="selectChampion(value.champion)"
			>
				<span class="sr-only">
					{{ value.champion.value ? `selected champion: ${value.champion.value.name}` : 'select champion' }}
				</span>
				<img
					v-if="value.champion.value"
					:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${value.champion.value.image}`"
					loading="lazy"
					width="128"
					height="128"
					style="--focus-brightness: 1.2"
				>
				<img
					v-else
					:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
					width="256"
					height="256"
					style="--focus-brightness: 1.5"
				>
			</button>
			<label :for="`${group}-${index}-level-select`" class="sr-only">Level</label>
			<select :id="`${group}-${index}-level-select`" v-model="value.level.value" data-select-champion-level="">
				<option v-for="i in 18" :key="i" :value="i">
					{{ i }}
				</option>
			</select>
		</div>
		<button title="runes" data-select-runes="" @click="selectRunes(value.runes)">
			<span class="sr-only">{{ value.runePathsEmpty ? 'select runes' : 'runes' }}</span>
			<span v-show="value.runesInvalid.value" class="text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -right-0.5 -top-0.5">
				<span class="sr-only">(invalid)</span>
				<Icon class="i-ph:exclamation-mark-bold size-2.5" />
			</span>
			<template v-if="runePathPrimary">
				<span class="sr-only">
					primary: {{ runePathPrimary.name }}
				</span>
				<span
					:style="`background-color: ${runePathPrimary.iconColor}; mask: url(${runePathPrimary.icon}) no-repeat center;`"
					aria-hidden="true"
					class="size-5.5 block"
				/>
			</template>
			<img
				v-else
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-fe-lol-champ-select/global/default/images/perks/rune-recommender-icon.png`"
				aria-hidden="true"
				width="32"
				height="32"
				loading="lazy"
				class="size-5"
			>
			<template v-if="runePathSecondary">
				<span class="sr-only">
					secondary: {{ runePathSecondary.name }}
				</span>
				<span
					:style="`background-color: ${runePathSecondary.iconColor}; mask: url(${runePathSecondary.icon}) no-repeat center;`"
					aria-hidden="true"
					data-secondary-path-icon=""
				/>
			</template>
		</button>
		<button
			data-select-items=""
			@click="selectItems(value.items, value.itemDamageCalculationTarget.value)"
		>
			items
			<img
				:src="`https://raw.communitydragon.org/${minorVersion}/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/tft/goldcoinslarge.png`"
				width="32"
				height="28"
				aria-hidden="true"
				loading="lazy"
				class="w-4"
			>
		</button>
		<ul class="flex h-8">
			<li v-for="i in 6" :key="i" class="mr-0.5 last:mr-0">
				<button
					class="bg-black size-8 inline-block"
					:disabled="!value.items.value[i - 1]"
					@click.right.prevent="value.items.value.splice(i - 1, 1)"
				>
					<span class="sr-only">{{ value.items.value[i - 1]?.name || `item ${i}` }}</span>
					<img
						v-if="value.items.value[i - 1]"
						:src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${value.items.value[i - 1]!.image}`"
						width="64"
						height="64"
						loading="lazy"
					>
				</button>
			</li>
		</ul>
		<button
			:title="removeButtonAttrs.title"
			class="pretend-ui-button"
			:disabled="removeButtonAttrs.disabled"
			@click="removeButtonAttrs.emit"
		>
			<span class="sr-only">{{ removeButtonAttrs.title }}</span>
			<Icon class="i-ph:x size-5" />
		</button>
		<button
			title="expand"
			class="pretend-ui-button"
			:disabled="!value.anythingFilled.value"
			@click="toggleExpanded"
		>
			<span class="sr-only">expand</span>
			<Icon class="i-ph:caret-down size-5" />
		</button>
		<details ref="details">
			<summary>
				details
			</summary>
			<dl data-player-stats="">
				<template v-for="(stat, statIndex) in minorStats" :key="statIndex">
					<dt>
						<span>{{ stat.name }}</span>
						<img v-bind="textureBgImageAttrs(ui.playerStats[stat.iconTextureKey], 20)">
					</dt>
					<dd :data-has-bonus="stat.values.some(value => value.bonus) || undefined">
						{{ stat.values.map(value => value.decimal ? roundVariable(value.total, 2) : Math.round(value.total)).join(' | ') }}{{ stat.isPercentage ? '%' : '' }}
					</dd>
					<div popover="hint">
						<h4>{{ stat.name }}</h4>
						<p data-game-description="" v-html="stat.description" />
						<dl>
							<template v-for="(statValue, valueIndex) in stat.values" :key="`${statIndex}-${valueIndex}`">
								<dt>{{ statValue.name }}:</dt>
								<dd>
									<span data-total="">{{ statValue.total }}</span>
									<template v-if="'base' in statValue && 'bonus' in statValue">
										(<span data-base="">{{ statValue.base }}</span> base + <span data-bonus="">{{ statValue.bonus }}</span> bonus)
									</template>
								</dd>
							</template>
						</dl>
						<p v-if="stat.bottomText" v-html="stat.bottomText" />
					</div>
				</template>
			</dl>
		</details>
	</li>
</template>

<style>
@layer components {
	#calculator-scoreboard [data-scoreboard-item] {
		@apply 'grid auto-cols-max grid-flow-col grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_0fr)] of-hidden py-2 px-4';

		--select-champion-size: calc(var(--spacing) * 14);
		--placeholder-champion-bg-clr: #020a13;
		--non-expanded-row-height: calc(var(--select-champion-size) / 2);
		--transition-duration: 150ms;
		grid-template-areas:
			'move-up		move-column	select-champion	select-runes	select-items	items			clear'
			'move-down	duplicate		select-champion	select-runes	select-items	items			expand'
			'expanded		expanded		expanded				expanded			expanded			expanded	expanded';
		grid-template-columns: repeat(5, max-content) 1fr max-content;
		transition-duration: var(--transition-duration);
		transition-timing-function: ease-in-out;
		transition-property: grid-template-rows;

		&:has(> details[open]) {
			@apply 'grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_1fr)]';

			> button:nth-last-of-type(1) {
				@apply 'rotate-180';
			}
		}

		> button {
			&:nth-of-type(1) {
				@apply 'self-end mb-0.5 mr-0.5';
				grid-area: move-up;
			}

			&:nth-of-type(2) {
				@apply 'self-start mt-0.5 mr-0.5';
				grid-area: move-down;
			}

			&:nth-of-type(3) {
				@apply 'self-end mb-0.5 ml-0.5';
				grid-area: move-column;
			}

			&:nth-of-type(4) {
				@apply 'self-start mt-0.5 ml-0.5';
				grid-area: duplicate;
			}

			&:nth-last-of-type(1) {
				@apply 'self-start mt-0.5';
				grid-area: expand;
			}

			&:nth-last-of-type(2) {
				@apply 'self-end mb-0.5';
				grid-area: clear;
			}

			&:nth-of-type(-n + 4),
			&:nth-last-of-type(-n + 2) {
				@apply 'size-5 grid-center';

				.icon {
					@apply 'size-4';
				}
			}
		}

		> [data-select-champion] {
			@apply 'size-[--select-champion-size] mx-3 relative';
			grid-area: select-champion;

			> button {
				@apply 'group b b-2 b-[--ui-button-border-clr] rounded-full size-full of-hidden';

				img {
					@apply 'max-w-none size-[calc(100%_+_var(--spacing)_*_2)] -ml-1 -mt-1';
				}

				&:hover,
				&:focus-visible {
					img {
						@apply 'brightness-[--focus-brightness]';
					}
				}
			}

			> [data-select-champion-level] {
				@apply 'absolute -bottom-1 -right-2';
			}
		}

		> [data-select-runes] {
			@apply 'b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 grid-center size-8 relative self-center';
			--secondary-path-icon-size: calc(var(--spacing) * 3);
			background-color: var(--placeholder-champion-bg-clr);
			grid-area: select-runes;

			[data-secondary-path-icon] {
				@apply 'size-[--secondary-path-icon-size] block -bottom-0.5 z-11 -right-0.5 absolute';
			}

			&:has([data-secondary-path-icon]):before {
				@apply 'content-empty z-10 absolute -right-0.5 -bottom-0.5 bg-inherit b b-[--ui-button-border-clr] size-[calc(var(--secondary-path-icon-size)_+_var(--spacing))] rounded-full translate-x-0.5 translate-y-0.5';
			}
		}

		> [data-select-items] {
			@apply 'mx-2 b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 relative h-8 pl-2.5 pr-2 self-center';
			background-color: var(--placeholder-champion-bg-clr);
			grid-area: select-items;

			img {
				@apply 'inline-block align-middle -mt-0.5';
			}
		}

		> ul {
			@apply 'self-center mr-3';
			grid-area: items;
		}

		/* TODO either accept partial animation or use js for animating the height/check if https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size#browser_compatibility is implemented yet and do the below */
		/* > ::details-content { */
		/* 	@apply '-mt-6'; */
		/* 	interpolate-size: allow-keywords; */
		/* 	height: 0; */
		/* 	overflow: clip; */
		/* 	transition-duration: 2s; */
		/* 	transition-timing-function: ease-in-out; */
		/* 	transition-property: height, content-visibility; */
		/* 	transition-behavior: allow-discrete; */
		/* } */

		/* > [open]::details-content { */
		/* 	height: auto; */
		/* } */

		> details {
			grid-area: expanded;

			&::details-content {
				@apply 'pt-4 -mt-6';
			}

			summary {
				@apply 'list-none invisible pointer-events-none';
			}

			> [data-player-stats] {
				@apply 'grid grid-rows-4 items-center whitespace-nowrap gap-y-1 gap-x-1 bg-cyan-950 b b-[--ui-button-border-clr] p-1.5 w-fit';
				grid-template-columns: max-content 5rem max-content 5rem;

				> dt {
					> :first-child {
						@apply 'sr-only';
					}
				}

				> dd {
					@apply 'leading-[1]';

					&[data-has-bonus] {
						@apply 'text-yellow-200';
					}
				}
			}
		}
	}
}
</style>
