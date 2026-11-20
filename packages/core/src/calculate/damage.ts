import { type IChampionStats, type IEffectOntoTargetVars, type IDamageOutputVars, type IBasicAttackVars, VariableType } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import type { IHypotheticalDragonSpecifics } from '../specifics/dragon.ts';
import { DRAGON_SPECIFICS } from '../specifics/dragon.ts';
import { GLOBAL_MODIFY_VARIABLE_FNS } from '../specifics/index.ts';
import type { IItemSpecific } from '../specifics/item.ts';
import { ITEM_SPECIFICS } from '../specifics/item.ts';

export function calculateEffectsOntoTargetVars(self: DamageSource): IEffectOntoTargetVars {
	const rv: IEffectOntoTargetVars = {};

	self.championSpecific.value?.effectOntoTargetVars?.(self, rv);
	if (self.dragonSoul.value) {
		(DRAGON_SPECIFICS as IHypotheticalDragonSpecifics)[self.dragonSoul.value]?.soul?.effectOntoTargetVars?.(self, rv);
	}
	for (const item of self.items.value) {
		item && (ITEM_SPECIFICS as Record<string, IItemSpecific>)[item.id]?.effectOntoTargetVars?.(self, rv);
	}

	return rv;
}

/** TODO intended to be a computed with everything related to source (and maybe takes in the target too, or that might be another separate thing) damage dealing */
export function calculateSourceDamageOuputVars(self: DamageSource): IDamageOutputVars {
	// total damage multipliers. known multiplicative - haunting guise and items it builds into. immortal path somewhere
	// actualizer
	// exhaust effect
	// knight's vow damage reduction
	// blessing of the mountain damage reduction
	// abyssal mask dmg amp
	// horizon focus dmg amp
	// imperial mandate dmg amp
	// bloodsong dmg amp
	// on hit damage - ardent censer, fiendhunter bolts, nashor's tooth, guinsoo, terminus, botrk, manamune/muramana, recurve bow, wit's end
	// ldr & custom variable from it
	// champion passives - ashe, akshan, braum, corki, graves, irelia, jinx, locke, orianna, tahm kench, volibear, warwick
	// sion passive
	// amumu passive
	// jhin passive
	// senna passive
	// kayn passive assassin at the start of combat
	// fizz passive
	// elise spider form aa
	// amumu E, can be marked as fully implemented then
	// ekko W, Jinx Q
	// check if crit damage multiplier stat should be reduced & used for jhin/senna on shadowflame crit
	const rv: IDamageOutputVars = {};

	for (const item of self.items.value) {
		item && (ITEM_SPECIFICS as Record<string, IItemSpecific>)[item.id]?.damageOutputVars?.(self, rv, self.calculationDamageTarget.value);
	}

	return rv;
}

export function sourceDamageBasicAttackVars(self: DamageSource): IBasicAttackVars {
	const raw: IBasicAttackVars['raw'] = {
		total: 0,
		physical: 0,
		magic: 0,
		true: 0,
	};
	const meta: IBasicAttackVars['meta'] = {
		physical: {},
		magic: {},
		true: {},
	};
	// stuff from calculateSourceDamageOuputVars
	// kraken slayer
	// check tiamat items damage
	// randuin's omen
	// warden's mail
	// steelcaps/armored advance

	const normal: IBasicAttackVars['normal'] = {
		physical: GLOBAL_MODIFY_VARIABLE_FNS[VariableType.physical]!(raw.physical, meta.physical, self, self.calculationDamageTarget.value),
		magic: GLOBAL_MODIFY_VARIABLE_FNS[VariableType.magic]!(raw.physical, meta.physical, self, self.calculationDamageTarget.value),
		true: raw.true,
		total: 0,
	};
	const crit: IBasicAttackVars['normal'] = {
		physical: 1,
		magic: 2,
		true: 3,
		total: 4,
	};
	const average: IBasicAttackVars['normal'] = {
		physical: 4,
		magic: 3,
		true: 2,
		total: 1,
	};

	for (const obj of [normal, crit, average]) {
		obj.total = obj.physical + obj.magic + obj.true;
	}

	return { raw, meta, normal, crit, average };
}

export function calculateDamage(rawDamage: number, type: IDamageType, target: IDamageTarget, penetration: Pick<IChampionStats, 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen'>): IDamageResults {
	if (type === 'true') {
		return { postMitigationDamage: rawDamage, effectiveResists: 0 };
	}

	const [resists, flatPen, percentPen] = type === 'physical' ? [target.stats.armor, penetration.lethality, penetration.percentArmorPen] : [target.stats.magicResist, penetration.flatMagicPen, penetration.percentMagicPen];

	const effectiveResists = Math.max(0, resists * (1 - percentPen) - flatPen);
	const postMitigationDamage = rawDamage / (1 + effectiveResists / 100);

	return {
		effectiveResists,
		postMitigationDamage,
	};
}

export function calculateResistPercentageReduction(resists: number): number {
	return resists / (resists + 100);
}

interface IDamageResults {
	postMitigationDamage: number;
	effectiveResists: number;
}

type IDamageType = 'physical' | 'magical' | 'true';

export interface IDamageTarget {
	stats: Pick<IChampionStats, 'hp' | 'armor' | 'magicResist'>;
}
