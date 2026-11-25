import type { IEffectOntoTargetVars, IDamageIOVars, IBasicAttackVars } from '@lolcalc/shared';
import { AbilityType, ITEM_NAME_TO_ID, VariableType } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import { GameAbilityId } from '../GameAbilityId.ts';
import type { IGameAbilityId } from '../GameAbilityId.ts';
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

// damage multipliers
//  passive
//   riftmaker, liandry, haunting guise - "deal % bonus damage up to X"
//   immortal path - "deal % increased damage"
//   shojin - "increases your champion's ability and passive damage by %"
//   chemtech soul - "deal % increased damage"
//  conditional
//   LDR - "deal up to % bonus damage against champions"
//   hexoptics - "deal up to % increased damage with attacks" (assuming bacis attacks)
//  active
//   horizon focus - "deal % increased damage to enemies"
//   actualizer - "you gain % increased ability damage"
// damage taken multipliers
//   abyssal mask - "nearby enemy champions take % more magic damage"
//   mandate - "mark as % vulnerable" vulnerable desc: "take % increased damage from all sources"
//   bloodsong - "they take % increased damage"
//   amumu passive - "curse his enemies [...] causing them to take an additional 10% true damage from all magic damage they take"
// damage taken reductions
//   knight's vow - "paraphrased[while near an ally marked by this item], take 14% of the damage they receive"
//   celestial opposition - "reduce incoming champion damage by %"
//   chemtech soul - "gain % damage resist"
// flat dmg reduction
//   fizz passive - "takes [flat number] reduced damage from all sources"
//   amumu E - "takes [flat number] reduced physical damage"
// damage dealt reductions
//   exhaust - "reduces their damage dealt by 40%"
// aa specific
//   randuin - reduces crits by % (works both for basic attack and ability crits)
//   steelcaps - "reduces incoming damage from attacks by %" (assuming basic attacks)

// TODO check how item variables are accessed, if there isn't a circular dependency
/** everything related to source damage output */
export function sourceDamageIOVars(self: DamageSource): IDamageIOVars {
	// check if crit damage multiplier stat should be reduced & used for jhin/senna on shadowflame crit
	const rv: IDamageIOVars = {
		totalDamageMult: 1,
		tracking: {},
	};

	for (const hook of self.damageIOVarsHooks.all.value) {
		hook(self, rv, self.calculationDamageTarget.value);
	}

	return rv;
}

// stuff from calculateDamageIOVars
// warden's mail
// item on hit
//   kraken slayer
//   ardent censer, fiendhunter bolts, nashor's tooth, guinsoo, terminus, botrk, manamune/muramana, recurve bow, wit's end
//   check tiamat items damage
// champions
//   sion passive, ashe passive, akshan passive, braum passive, corki passive, graves passive, irelia passive, jinx Q, locke passive, orianna passive, tahm kench passive, volibear passive, warwick passive, ekko W, elise passive
//   jhin passive, senna passive
//   kayn passive assassin at the start of combat
/** everything needed for basic attacks results section */
export function sourceDamageBasicAttackVars(self: DamageSource): IBasicAttackVars {
	const target = self.calculationDamageTarget.value;
	const { total: totalStats } = self.stats.value;

	const raw: IBasicAttackVars['raw'] = {
		total: 0,
		physical: totalStats.attackDamage,
		magic: 0,
		true: 0,
		dps: 0,
	};

	for (const hook of self.basicAttackHooks.all.value) {
		hook(self, raw, target);
	}

	raw.total = raw.physical + raw.magic + raw.true;
	raw.dps = raw.total / totalStats.attackSpeed;

	/** not used for anything currently, maybe also shouldn't be shared between different aa type calls */
	const meta: IBasicAttackVars['meta'] = {
		physical: {},
		magic: {},
		true: {},
	};

	const normal: IBasicAttackVars['normal'] = {
		physical: GLOBAL_MODIFY_VARIABLE_FNS[VariableType.physical]!(raw.physical, meta.physical, self, target),
		magic: GLOBAL_MODIFY_VARIABLE_FNS[VariableType.magic]!(raw.magic, meta.magic, self, target),
		true: raw.true,
		total: 0,
		dps: 0,
	};

	const crit: IBasicAttackVars['crit'] = {
		physical: GLOBAL_MODIFY_VARIABLE_FNS[VariableType.physical]!(raw.physical * totalStats.critDamageMultiplier, meta.physical, self, target),
		magic: normal.magic,
		true: normal.true,
		total: 0,
		dps: 0,
	};

	const average: IBasicAttackVars['average'] = {
		physical: normal.physical * (1 - totalStats.critChance) + crit.physical * totalStats.critChance,
		magic: normal.magic,
		true: normal.true,
		total: 0,
		dps: 0,
	};

	for (const obj of [normal, crit, average]) {
		obj.total = obj.physical + obj.magic + obj.true;
		obj.dps = obj.total * totalStats.attackSpeed;
	}

	return { raw, meta, normal, crit, average };
}

export const IMPLEMENTED_BASIC_ATTACK_THINGS: IGameAbilityId[] = [GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.witsEnd), GameAbilityId.build(AbilityType.item, ITEM_NAME_TO_ID.nashorsTooth)];

export function calculateResistPercentageReduction(resists: number): number {
	return resists / (resists + 100);
}
