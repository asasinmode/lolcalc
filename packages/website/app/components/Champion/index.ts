import type { IChampionId } from '@lolcalc/data/types';
import type { ISpecificComponents } from '~/utils/types';
import { GameAbilityId } from '@lolcalc/core/GameAbilityId';
import { CHAMPION_SPECIFICS } from '@lolcalc/core/specifics/champion';
import { EFFECT_SPECIFICS_OBJECT_ENTRIES } from '@lolcalc/core/specifics/effect';
import { AbilityType } from '@lolcalc/shared';
import { ChampionExtrasAphelios, ChampionExtrasOrnn, ChampionExtrasTargetDummy, ChampionExtrasViktor } from '#components';

export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	TargetDummy: {
		extras: ChampionExtrasTargetDummy,
	},
	Ambessa: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Ambessa', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Amumu: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Amumu', 'passive', 0), 'applyPassive', 'Cursed Touch', undefined, true),
	},
	Anivia: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Anivia', 'passive', 0), 'isEgg', 'is egg', false),
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
	AurelionSol: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'AurelionSol', 'passive', 0), 'passiveStacks', 'Cosmic Creator stacks'),
	},
	Bard: {
		extras: [
			await numberExtra(GameAbilityId.build(AbilityType.champion, 'Bard', 'passive', 0), 'passiveStacks', 'Chimes collected'),
			await numberExtra(GameAbilityId.build(AbilityType.champion, 'Bard', 'passive', 0), 'chimeMoveSpeed', 'Chime move speed', 0, CHAMPION_SPECIFICS.Bard.MAX_CHIME_MS),
		],
	},
	Belveth: {
		extras: [
			await numberExtra(GameAbilityId.build(AbilityType.champion, 'Belveth', 'passive', 0), 'passiveStacks', 'Lavender stacks'),
			await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Belveth', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
		],
	},
	Darius: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Darius', 'passive', 0), 'isChampionAtMaxBleed', 'is champion at max bleed stacks', false),
	},
	Diana: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Diana', 'passive', 0), 'isPassiveEmpowered', 'is passive empowered (from using ability)', false),
	},
	Draven: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Draven', 'passive', 0), 'passiveStacks', 'League of Draven stacks'),
	},
	Ekko: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Ekko', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (3 hits)', false),
	},
	Ezreal: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Ezreal', 'passive', 0), 'passiveStacks', 'Spell Force stacks', 0, CHAMPION_SPECIFICS.Ezreal.MAX_PASSIVE_STACKS),
	},
	Fiora: {
		extras: await progressExtra(GameAbilityId.build(AbilityType.champion, 'Fiora', 'passive', 0), 'passiveMSProgress', 'Duelist\'s Dance move speed', CHAMPION_SPECIFICS.Fiora.PASSIVE_BONUS_MS),
	},
	Garen: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Garen', 'passive', 0), 'isPassiveActive', 'is passive active (not hit recently)', false),
	},
	Heimerdinger: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Heimerdinger', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (close to turret)', false),
	},
	Irelia: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Irelia', 'passive', 0), 'passiveStacks', 'Ionian Fervor stacks', 0, CHAMPION_SPECIFICS.Irelia.MAX_PASSIVE_STACKS),
	},
	Jax: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Jax', 'passive', 0), 'passiveStacks', 'Relentless Assault stacks', 0, CHAMPION_SPECIFICS.Jax.MAX_PASSIVE_STACKS),
	},
	Jhin: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Jhin', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (after crit)', false),
	},
	Jinx: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Jinx', 'passive', 0), 'passiveStacks', 'Get Excited stacks', 0, CHAMPION_SPECIFICS.Jinx.MAX_PASSIVE_STACKS),
	},
	Kayle: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Kayle', 'passive', 0), 'passiveStacks', 'Divine Ascent stacks', 0, CHAMPION_SPECIFICS.Kayle.MAX_PASSIVE_STACKS),
	},
	Kaisa: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Kaisa', 'passive', 0), 'passiveStacksOnTarget', 'Plasma stacks on target', 0, CHAMPION_SPECIFICS.Kaisa.MAX_PASSIVE_STACKS),
	},
	Kayn: {
		extras: await enumExtra(GameAbilityId.build(AbilityType.champion, 'Kayn', 'passive', 0), 'form', 'Form', Object.fromEntries(Object.entries(CHAMPION_SPECIFICS.Kayn.FORM_OPTIONS).map(([key, value]) => [value, key]))),
	},
	Kindred: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Kindred', 'passive', 0), 'passiveStacks', 'Marks collected'),
	},
	Kled: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Kled', 'passive', 0), 'isDismounted', 'is dismounted', false),
	},
	LeeSin: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'LeeSin', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Mordekaiser: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Mordekaiser', 'passive', 0), 'isPassiveMSActive', 'is passive active (3 hits)', false),
	},
	Naafiri: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Naafiri', 'passive', 0), 'passiveStacks', 'Packmates', 0, CHAMPION_SPECIFICS.Naafiri.MAX_PASSIVE_STACKS),
	},
	Nami: {
		extras: await progressExtra(GameAbilityId.build(AbilityType.champion, 'Nami', 'passive', 0), 'passiveMSProgress', 'Surging Tides move speed', CHAMPION_SPECIFICS.Nami.passive.derivedMS, { effectControlsProps: CHAMPION_SPECIFICS.Nami.passive.effectControls, derivedSymbolSuffix: '' }),
	},
	Nasus: {
		extras: await progressExtra(GameAbilityId.build(AbilityType.champion, 'Nasus', 'w', 0), 'wProgress', 'apply Wither slow on target', CHAMPION_SPECIFICS.Nasus.WITHER_MS_SLOW),
	},
	Nidalee: {
		extras: await enumExtra(GameAbilityId.build(AbilityType.champion, 'Nidalee', 'passive', 0), 'passiveVariantActive', 'passive bonus MS', {
			[CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.none]: 'none',
			[CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.justBush]: 'in bush',
			[CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.towardsChampion]: 'towards champions',
		}),
	},
	Nunu: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Nunu', 'passive', 0), 'isPassiveActive', 'is passive active (hit champion/structure/monster)', false),
	},
	Orianna: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Orianna', 'passive', 0), 'passiveStacksOnTarget', 'Windup stacks on target', 0, CHAMPION_SPECIFICS.Orianna.MAX_PASSIVE_STACKS),
	},
	Ornn: {
		extras: ChampionExtrasOrnn,
	},
	Rammus: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Rammus', 'w', 0), 'defensiveCurl', 'Defensive Curl'),
	},
	Rell: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Rell', 'passive', 0), 'passiveStacksOnTarget', 'Break the Mold stacks on target', 0, CHAMPION_SPECIFICS.Rell.MAX_PASSIVE_STACKS),
	},
	Rengar: {
		extras: [
			await numberExtra(GameAbilityId.build(AbilityType.champion, 'Rengar', 'passive', 0), 'passiveStacks', 'Bonetooth Necklace stacks', 0, CHAMPION_SPECIFICS.Rengar.MAX_PASSIVE_STACKS),
			await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Rengar', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (after empowered ability)', false),
		],
	},
	Rumble: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Rumble', 'passive', 0), 'isOverheated', 'is overheated', false),
	},
	Samira: {
		extras: await enumExtra(GameAbilityId.build(AbilityType.champion, 'Samira', 'passive', 0), 'passiveStacks', 'Grade', Object.fromEntries(
			Object.entries(CHAMPION_SPECIFICS.Samira.PASSIVE_OPTIONS).map(([grade, value]) => [value, value ? grade.toUpperCase() : grade]),
		)),
	},
	Sejuani: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Sejuani', 'passive', 0), 'isPassiveActive', 'is Fury of the North active', false),
	},
	Senna: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Senna', 'passive', 0), 'passiveStacks', 'Absolution stacks'),
	},
	Seraphine: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Seraphine', 'passive', 0), 'passiveStacks', 'Notes collected', 0, CHAMPION_SPECIFICS.Seraphine.MAX_PASSIVE_STACKS),
	},
	Shyvana: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Shyvana', 'passive', 0), 'passiveStacks', 'Scalemail stacks'),
	},
	Singed: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Singed', 'passive', 0), 'passiveStacks', 'Slipstream stacks', 0, CHAMPION_SPECIFICS.Singed.MAX_PASSIVE_STACKS),
	},
	Sivir: {
		extras: await progressExtra(GameAbilityId.build(AbilityType.champion, 'Sivir', 'passive', 0), 'passiveMSProgress', 'Fleet of Foot move speed', CHAMPION_SPECIFICS.Sivir.PASSIVE_BONUS_MS, { derivedSymbolSuffix: '' }),
	},
	Smolder: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Smolder', 'passive', 0), 'passiveStacks', 'Dragon Practice stacks'),
	},
	Sona: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Sona', 'passive', 0), 'passiveStacks', 'Accelerando stacks', 0, CHAMPION_SPECIFICS.Sona.MAX_PASSIVE_STACKS),
	},
	Soraka: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Soraka', 'passive', 0), 'isPassiveMSActive', 'is moving towards low health ally', false),
	},
	Swain: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Swain', 'passive', 0), 'passiveStacks', 'Soul Fragments collected'),
	},
	Sylas: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Sylas', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Syndra: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Syndra', 'passive', 0), 'passiveStacks', 'Splinters collected', 0, CHAMPION_SPECIFICS.Sona.MAX_PASSIVE_STACKS),
	},
	Taliyah: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Taliyah', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (next to wall ooc)', false),
	},
	Taric: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Taric', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Teemo: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Teemo', 'passive', 0), 'isPassiveASActive', 'is passive AS active (exiting invisibility)', false),
	},
	Thresh: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Thresh', 'passive', 0), 'passiveStacks', 'Souls collected'),
	},
	Udyr: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Udyr', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Varus: {
		extras: await enumExtra(GameAbilityId.build(AbilityType.champion, 'Varus', 'passive', 0), 'passiveVariantActive', 'passive buff from enemy', Object.fromEntries(Object.entries(CHAMPION_SPECIFICS.Varus.PASSIVE_OPTIONS).map(([key, value]) => [value, key]))),
	},
	Vayne: {
		extras: await booleanExtra(GameAbilityId.build(AbilityType.champion, 'Vayne', 'passive', 0), 'isPassiveMSActive', 'is moving towards enemy', false),
	},
	Veigar: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Veigar', 'passive', 0), 'passiveStacks', 'Phenomenal Evil stacks'),
	},
	Viktor: {
		extras: ChampionExtrasViktor,
	},
	Volibear: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Volibear', 'passive', 0), 'passiveStacks', 'Relentless Storm stacks', 0, CHAMPION_SPECIFICS.Volibear.MAX_PASSIVE_STACKS),
	},
	MonkeyKing: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'MonkeyKing', 'passive', 0), 'passiveStacks', 'Stone Skin stacks', 0, CHAMPION_SPECIFICS.MonkeyKing.MAX_PASSIVE_STACKS),
	},
	Zaahen: {
		extras: await numberExtra(GameAbilityId.build(AbilityType.champion, 'Zaahen', 'passive', 0), 'passiveStacks', 'Determination stacks', 0, CHAMPION_SPECIFICS.Zaahen.MAX_PASSIVE_STACKS),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === AbilityType.champion) {
		const abilityId = GameAbilityId.build(AbilityType.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1, enumOptions, deriveProgressValue } = effectSpecific;

		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]!.effects
			??= enumOptions
				? await enumExtra(abilityId, 0, label, Object.fromEntries(Object.entries(enumOptions).map(([key, value]) => [value, key])))
				: deriveProgressValue
					? await progressExtra(abilityId, 0, label, deriveProgressValue, {
							selectEffectSourceProps: effectSpecific.sourceControls,
							effectControlsProps: effectSpecific.effectControls,
							derivedSymbolSuffix: effectSpecific.progressComponentSymbol,
						})
					: maxValue !== 1
						? await numberExtra(abilityId, 0, label, minValue, maxValue)
						: await booleanExtra(abilityId, 0, label, false);
	}
}

for (const key in CHAMPION_COMPONENTS) {
	const { extras, effects } = CHAMPION_COMPONENTS[key as keyof typeof CHAMPION_COMPONENTS]!;
	extras && (Array.isArray(extras) ? extras.forEach(component => markRaw(component)) : markRaw(extras));
	effects && (Array.isArray(effects) ? effects.forEach(component => markRaw(component)) : markRaw(effects));
}
