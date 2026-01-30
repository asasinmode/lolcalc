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

interface IChampionStat {
	name: string;
	iconTextureKey: keyof (typeof ui)['playerStats'];
	description: string;
	values: {
		name: string;
		decimal?: boolean;
		isPercentage?: boolean;
		base?: number;
		bonus: number;
		total: number;
	}[];
	displayedValue: string;
	bottomText?: string;
}

const minorStats = computed<IChampionStat[]>(() => {
	const { stats } = championStats.value;
	const minorStats = [
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
			values: [
				{
					name: 'Heal and Shield Power',
					total: stats.total.healShieldPower,
					bonus: stats.total.healShieldPower,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Lethality | Armor Penetration',
			description: 'Ignores an amount of your target\'s <scalearmor>Armor</scalearmor> when applying <physicaldamage>physical damage</physicaldamage>.<br><br><scalelethality>Lethality</scalelethality> ignores a flat amount, <scalelethality>Armor Penetration</scalelethality> ignores a percentage amount',
			iconTextureKey: 'armorPen',
			values: [
				{
					name: 'Lethality',
					bonus: stats.bonus.lethality,
					total: stats.total.lethality,
				},
				{
					name: 'Armor Penetration',
					decimal: true,
					bonus: stats.bonus.percentArmorPen,
					total: stats.total.percentArmorPen,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Magic Penetration',
			description: 'Ignores an amount of your target\'s <scalemr>Magic Resist</scalemr> when applying <magicdamage>magic damage</magicdamage>.',
			iconTextureKey: 'magicPen',
			values: [
				{
					name: 'Flat Magic Penetration',
					bonus: stats.bonus.flatMagicPen,
					total: stats.total.flatMagicPen,
				},
				{
					name: 'Magic Penetration',
					decimal: true,
					bonus: stats.bonus.percentMagicPen,
					total: stats.total.percentMagicPen,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Life Steal',
			description: 'Returns a portion of the damage you deal with Attacks as <scalehealth>Health</scalehealth>.',
			iconTextureKey: 'lifeSteal',
			values: [
				{
					name: 'Life Steal',
					bonus: stats.bonus.lifeSteal,
					total: stats.total.lifeSteal,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Omnivamp',
			description: 'Returns a portion of all damage you deal as <scalehealth>Health</scalehealth>.<br><br>Reduced to 20% effectiveness when dealing damage to minions or monsters.',
			iconTextureKey: 'omnivamp',
			values: [
				{
					name: 'Omnivamp',
					bonus: stats.bonus.omnivamp,
					total: stats.total.omnivamp,
					isPercentage: true,
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
			values: [
				{
					name: 'Tenacity',
					bonus: stats.bonus.tenacity,
					total: stats.total.tenacity,
					isPercentage: true,
				},
			],
		},
	] as IChampionStat[];

	for (const stat of minorStats) {
		stat.displayedValue = stat.values.map(
			(value) => {
				const multiplier = value.isPercentage ? 100 : 1;
				return `${value.decimal
					? roundVariable(value.total * multiplier, 2)
					: Math.round(value.total * multiplier)}${value.isPercentage ? '%' : ''}`;
			},
		)
			.join(' | ');
	}

	return minorStats;
});

const majorStats = computed<IChampionStat[]>(() => {
	const { stats } = championStats.value;
	const majorStats = [
		{
			name: 'Attack Damage',
			description: 'The amount of <physicaldamage>physical damage</physicaldamage> your Attack deal.<br><br>Also increases the amount of damage you deal with certain Abilities.',
			iconTextureKey: 'attackDamage',
			values: [
				{
					name: 'Attack Damage',
					base: stats.base.attackDamage,
					bonus: stats.bonus.attackDamage,
					total: stats.total.attackDamage,
				},
			],
		},
		{
			name: 'Ability Power',
			description: 'Increases the amount of damage you deal with most Abilities.',
			iconTextureKey: 'abilityPower',
			values: [
				{
					name: 'Ability Power',
					bonus: stats.bonus.abilityPower,
					total: stats.total.abilityPower,
				},
			],
		},
		{
			name: 'Armor',
			description: 'Reduces the amount of <physicaldamage>magic damage</physicaldamage> you take.',
			iconTextureKey: 'armor',
			values: [
				{
					name: 'Armor',
					base: stats.base.armor,
					bonus: stats.bonus.armor,
					total: stats.total.armor,
				},
			],
			bottomText: `You take <span data-base="">${Math.round(calculateResistPercentageReduction(stats.total.magicResist) * 100)}</span>% reduced physical damage`,
		},
		{
			name: 'Magic Resist',
			description: 'Reduces the amount of <magicdamage>magic damage</magicdamage> you take.',
			iconTextureKey: 'magicResist',
			values: [
				{
					name: 'Magic Resist',
					base: stats.base.magicResist,
					bonus: stats.bonus.magicResist,
					total: stats.total.magicResist,
				},
			],
			bottomText: `You take <span data-base="">${Math.round(calculateResistPercentageReduction(stats.total.magicResist) * 100)}</span>% reduced magic damage`,
		},
		{
			name: 'Attack Speed',
			description: 'Increases the rate at which you can Attack.<br><br>Ratio determines the effectiveness of bonus Attack Speed.',
			iconTextureKey: 'attackSpeed',
			values: [
				{
					name: 'Bonus Attack Speed',
					bonus: stats.bonus.bonusAttackSpeedPercent,
					total: stats.total.bonusAttackSpeedPercent,
					isPercentage: true,
				},
				{
					name: 'Attacks per second',
					total: stats.total.attackSpeed,
				},
				{
					name: 'Ratio',
					total: stats.total.attackSpeedRatio,
					isPercentage: true,
				},
			],
			displayedValue: stats.total.attackSpeed.toFixed(2),
		},
		{
			name: 'Ability Haste',
			description: 'Allows you to cast your Abilities more often',
			iconTextureKey: 'abilityHaste',
			values: [
				{
					name: 'Current Ability Haste',
					bonus: stats.bonus.abilityHaste,
					total: stats.total.abilityHaste,
				},
			],
			bottomText: `Equivalent to reducing your Ability cooldowns by <span data-total="">${Math.round(cooldownReductionPercentageFromHaste(stats.total.abilityHaste))}</span>%`,
		},
		{
			name: 'Critical Strike Chance',
			description: 'Grants a change to deal 100% increased damage on each Attack.',
			iconTextureKey: 'crit',
			values: [
				{
					name: 'Critical Strike Chance',
					bonus: stats.bonus.critChance,
					total: stats.total.critChance,
					isPercentage: true,
				},
			],
		},
		{
			name: 'Move Speed',
			description: 'The speed at which you travel.',
			iconTextureKey: 'moveSpeed',
			values: [
				{
					name: 'Move Speed',
					base: stats.base.moveSpeed,
					bonus: stats.bonus.moveSpeed,
					total: stats.total.moveSpeed,
				},
			],
		},
	] as IChampionStat[];

	for (const stat of majorStats) {
		stat.displayedValue ||= stat.values.map(
			value => value.decimal ? roundVariable(value.total * (value.isPercentage ? 100 : 1), 2) : Math.round(value.total * (value.isPercentage ? 100 : 1)) + (value.isPercentage ? '%' : ''),
		)
			.join(' | ');
	}

	return majorStats;
});

const hoveredStat = shallowRef<IChampionStat>();
const hoveredStatTooltip = useTemplateRef('championStatTooltip');

function showStatTooltip(event: MouseEvent, stat: IChampionStat) {
	hoveredStat.value = stat;
	// @ts-expect-error source is ok
	hoveredStatTooltip.value?.showPopover({ source: event.target });
}

function hideStatTooltip() {
	hoveredStatTooltip.value?.hidePopover();
}

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
			<span v-show="value.runesInvalid.value" class="text-white outline-2 outline-red-600 outline-offset-1 rounded-full bg-red-600 grid-center absolute -end-0.5 -top-0.5">
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
			<li v-for="i in 6" :key="i" class="me-0.5 last:me-0">
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
			<dl
				v-for="(stats, statKindIndex) in [minorStats, majorStats]"
				:key="statKindIndex"
				data-champion-stats=""
			>
				<template v-for="(stat, statIndex) in stats" :key="`${statKindIndex}-${statIndex}`">
					<dt @mouseenter="showStatTooltip($event, stat)" @mouseleave="hideStatTooltip">
						<span>{{ stat.name }}</span>
						<img v-bind="textureBgImageAttrs(ui.playerStats[stat.iconTextureKey], 20)">
					</dt>
					<dd
						:data-has-bonus="stat.values.some(value => value.bonus) || undefined"
						@mouseenter="showStatTooltip($event, stat)"
						@mouseleave="hideStatTooltip"
					>
						{{ stat.displayedValue }}
					</dd>
				</template>
			</dl>
			<div id="champion-stat-hover-tooltip" ref="championStatTooltip" popover="hint">
				<h4>{{ hoveredStat?.name }}</h4>
				<p data-game-description="" v-html="hoveredStat?.description" />
				<dl>
					<template v-for="(statValue, valueIndex) in hoveredStat?.values" :key="valueIndex">
						<dt>{{ statValue.name }}:</dt>
						<dd>
							<span data-total="">{{ statValue.total }}</span>
							<template v-if="'base' in statValue">
								(<span data-base="">{{ statValue.base }}</span> base + <span data-bonus="">{{ statValue.bonus }}</span> bonus)
							</template>
						</dd>
						<br v-if="valueIndex !== ((hoveredStat?.values.length || 1) - 1)">
					</template>
				</dl>
				<p v-if="hoveredStat?.bottomText" v-html="hoveredStat?.bottomText" />
			</div>
		</details>
	</li>
</template>

<style>
@layer components {
	#calculator-scoreboard [data-scoreboard-item] {
		--at-apply: 'grid auto-cols-max grid-flow-col grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_0fr)] of-hidden py-2 px-4';

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
			--at-apply: 'grid-rows-[var(--non-expanded-row-height)_var(--non-expanded-row-height)_minmax(0,_1fr)]';

			> button:nth-last-of-type(1) {
				--at-apply: 'rotate-180';
			}
		}

		> button {
			&:nth-of-type(1) {
				--at-apply: 'self-end mb-0.5 me-0.5';
				grid-area: move-up;
			}

			&:nth-of-type(2) {
				--at-apply: 'self-start mt-0.5 me-0.5';
				grid-area: move-down;
			}

			&:nth-of-type(3) {
				--at-apply: 'self-end mb-0.5 ms-0.5';
				grid-area: move-column;
			}

			&:nth-of-type(4) {
				--at-apply: 'self-start mt-0.5 ms-0.5';
				grid-area: duplicate;
			}

			&:nth-last-of-type(1) {
				--at-apply: 'self-start mt-0.5';
				grid-area: expand;
			}

			&:nth-last-of-type(2) {
				--at-apply: 'self-end mb-0.5';
				grid-area: clear;
			}

			&:nth-of-type(-n + 4),
			&:nth-last-of-type(-n + 2) {
				--at-apply: 'size-5 grid-center';

				.icon {
					--at-apply: 'size-4';
				}
			}
		}

		> [data-select-champion] {
			--at-apply: 'size-[--select-champion-size] mx-3 relative';
			grid-area: select-champion;

			> button {
				--at-apply: 'group b b-2 b-[--ui-button-border-clr] rounded-full size-full of-hidden';

				img {
					--at-apply: 'max-w-none size-[calc(100%_+_var(--spacing)_*_2)] -ms-1 -mt-1';
				}

				&:hover,
				&:focus-visible {
					img {
						--at-apply: 'brightness-[--focus-brightness]';
					}
				}
			}

			> [data-select-champion-level] {
				--at-apply: 'absolute -bottom-1 -end-2';
			}
		}

		> [data-select-runes] {
			--at-apply: 'b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 grid-center size-8 relative self-center';
			--secondary-path-icon-size: calc(var(--spacing) * 3);
			background-color: var(--placeholder-champion-bg-clr);
			grid-area: select-runes;

			[data-secondary-path-icon] {
				--at-apply: 'size-[--secondary-path-icon-size] block -bottom-0.5 z-11 -end-0.5 absolute';
			}

			&:has([data-secondary-path-icon]):before {
				--at-apply: 'content-empty z-10 absolute -end-0.5 -bottom-0.5 bg-inherit b b-[--ui-button-border-clr] size-[calc(var(--secondary-path-icon-size)_+_var(--spacing))] rounded-full translate-x-0.5 translate-y-0.5';
			}
		}

		> [data-select-items] {
			--at-apply: 'mx-2 b b-[--ui-button-border-clr] rounded-full hoverable:bg-neutral-800 relative h-8 ps-2.5 pe-2 self-center';
			background-color: var(--placeholder-champion-bg-clr);
			grid-area: select-items;

			img {
				--at-apply: 'inline-block align-middle -mt-0.5';
			}
		}

		> ul {
			--at-apply: 'self-center me-3';
			grid-area: items;
		}

		/* TODO either accept partial animation or use js for animating the height/check if https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size#browser_compatibility is implemented yet and do the below */
		/* > ::details-content { */
		/* 	--at-apply: '-mt-6'; */
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
			/* anchor-name: --scoreboard-item-details; */
			anchor-scope: --champion-stats-minor;
			grid-area: expanded;

			&::details-content {
				--at-apply: 'pt-4 -mt-6';
			}

			summary {
				--at-apply: 'list-none invisible pointer-events-none';
			}

			> [data-champion-stats] {
				--at-apply: 'grid grid-rows-4 items-center whitespace-nowrap bg-cyan-950 b b-[--ui-button-border-clr] p-0.5 w-fit';

				&:first-of-type {
					anchor-name: --champion-stats-minor;
				}

				grid-template-columns: 1.25rem 5rem 1.25rem 5rem;

				&:nth-of-type(2) {
					--at-apply: 'b-t-0';
				}

				> dt {
					--at-apply: 'py-0.5 ps-0.5';

					> :first-child {
						--at-apply: 'sr-only';
					}
				}

				> dd {
					--at-apply: 'leading-5 h-full w-max ps-1.5 py-0.5 pe-0.5';

					&[data-has-bonus] {
						--at-apply: 'text-yellow-200';
					}
				}
			}

			#champion-stat-hover-tooltip {
				--at-apply: 'bg-neutral-950 max-w-screen pointer-events-none absolute p-1 b b-[--ui-button-border-clr]';
				inset: unset;
				position-anchor: --champion-stats-minor;
				bottom: calc(anchor(top) - 1px);
				justify-self: anchor-center;

				dt,
				dd {
					--at-apply: 'inline';
				}

				dd {
					--at-apply: 'ms-[0.5ch]';
				}
			}
		}
	}
}
</style>
