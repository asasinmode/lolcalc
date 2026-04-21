import type { ISpecificComponents } from '~/utils/types';
import { ChampionExtrasAphelios } from '#components';

export const CHAMPION_COMPONENTS: Partial<Record<IChampionId, ISpecificComponents>> = {
	Ambessa: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Ambessa', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Amumu: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Amumu', 'passive', 0), 'applyPassive', 'Cursed Touch', undefined, true),
	},
	Anivia: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Anivia', 'passive', 0), 'isEgg', 'is egg', false),
	},
	Aphelios: {
		extras: ChampionExtrasAphelios,
	},
	AurelionSol: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'AurelionSol', 'passive', 0), 'passiveStacks', 'Cosmic Creator stacks'),
	},
	Bard: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Bard', 'passive', 0), 'passiveStacks', 'Chimes collected'),
	},
	Belveth: {
		extras: [
			await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Belveth', 'passive', 0), 'passiveStacks', 'Lavender stacks'),
			await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Belveth', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
		],
	},
	Darius: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Darius', 'passive', 0), 'isChampionAtMaxBleed', 'is champion at max bleed stacks', false),
	},
	Diana: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Diana', 'passive', 0), 'isPassiveEmpowered', 'is passive empowered (from using ability)', false),
	},
	Draven: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Draven', 'passive', 0), 'passiveStacks', 'League of Draven stacks'),
	},
	Ekko: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Ekko', 'passive', 0), 'isPassiveActive', 'is passive active (3 hits)', false),
	},
	Ezreal: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Ezreal', 'passive', 0), 'passiveStacks', 'Spell Force stacks', 0, CHAMPION_SPECIFICS.Ezreal.MAX_PASSIVE_STACKS),
	},
	Garen: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Garen', 'passive', 0), 'isPassiveActive', 'is passive active (not hit recently)', false),
	},
	Heimerdinger: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Heimerdinger', 'passive', 0), 'isPassiveActive', 'is passive active (close to turret)', false),
	},
	Irelia: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Irelia', 'passive', 0), 'passiveStacks', 'Ionian Fervor stacks', 0, CHAMPION_SPECIFICS.Irelia.MAX_PASSIVE_STACKS),
	},
	Jax: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Jax', 'passive', 0), 'passiveStacks', 'Ionian Fervor stacks', 0, CHAMPION_SPECIFICS.Jax.MAX_PASSIVE_STACKS),
	},
	Jhin: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Jhin', 'passive', 0), 'isPassiveMSActive', 'is passive MS active (after crit)', false),
	},
	Jinx: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Jinx', 'passive', 0), 'passiveStacks', 'Get Excited stacks', 0, CHAMPION_SPECIFICS.Jinx.MAX_PASSIVE_STACKS),
	},
	Kaisa: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Kaisa', 'passive', 0), 'passiveStacksOnTarget', 'Plasma stacks on target', 0, CHAMPION_SPECIFICS.Kaisa.MAX_PASSIVE_STACKS),
	},
	Kayn: {
		extras: await enumExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Kayn', 'passive', 0), 'form', 'Form', {
			[CHAMPION_SPECIFICS.Kayn.FORM_OPTIONS.base]: 'base',
			[CHAMPION_SPECIFICS.Kayn.FORM_OPTIONS.assassin]: 'assassin',
			[CHAMPION_SPECIFICS.Kayn.FORM_OPTIONS.rhaast]: 'rhaast',
		}),
	},
	Kindred: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Kindred', 'passive', 0), 'passiveStacks', 'Marks collected'),
	},
	Kled: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Kled', 'passive', 0), 'isDismounted', 'is dismounted', false),
	},
	LeeSin: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'LeeSin', 'passive', 0), 'hasPassiveStack', 'has passive stack (from using ability)', false),
	},
	Mordekaiser: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Mordekaiser', 'passive', 0), 'isPassiveActive', 'is passive active (3 hits)', false),
	},
	Nidalee: {
		extras: await enumExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Nidalee', 'passive', 0), 'passiveVariantActive', 'Passive bonus MS', {
			[CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.none]: 'none',
			[CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.justBush]: 'in bush',
			[CHAMPION_SPECIFICS.Nidalee.PASSIVE_OPTIONS.towardsChampion]: 'towards champions',
		}),
	},
	Nunu: {
		extras: await booleanExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Nunu', 'passive', 0), 'isPassiveActive', 'is passive active (hit champion/structure/monster)', false),
	},
	Orianna: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Orianna', 'passive', 0), 'passiveStacksOnTarget', 'Windup stacks on target', 0, CHAMPION_SPECIFICS.Orianna.MAX_PASSIVE_STACKS),
	},
	Veigar: {
		extras: await numberExtra(GameAbilityId.build(ABILITY_TYPE.champion, 'Veigar', 'passive', 0), 'passiveStacks', 'Phenomenal Evil stacks'),
	},
};

for (const [effectObjectName, effectSpecific] of EFFECT_SPECIFICS_OBJECT_ENTRIES) {
	if (effectSpecific.sourceAbility.type === ABILITY_TYPE.champion) {
		const abilityId = GameAbilityId.build(ABILITY_TYPE.effect, effectObjectName);
		const { label, minValue = 0, maxValue = 1 } = effectSpecific;

		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id] ??= {};
		// TODO if effect data will have multiple values, this needs to be changed as it only sets the first value. same with , it works only on first value
		CHAMPION_COMPONENTS[effectSpecific.sourceAbility.id]!.effects ??= maxValue > 1
			? await numberExtra(abilityId, 0, label, minValue, maxValue)
			: await booleanExtra(abilityId, 0, label);
	}
}
