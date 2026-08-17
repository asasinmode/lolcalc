import type { IChampionStats, IEffectOntoTargetVars } from '@lolcalc/shared';
import type { DamageSource } from '../DamageSource';
import type { IHypotheticalDragonSpecifics } from '../specifics/dragon.ts';
import type { IItemSpecific } from '../specifics/item.ts';
import { DRAGON_SPECIFICS } from '../specifics/dragon.ts';
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
export function championDamage() {
	// total damage multipliers. known multiplicative - haunting guise and items it builds into. immortal path somewhere
	// actualizer
	// exhaust effect
	// knight's vow damage reduction
	// blessing of the mountain damage reduction
	// abyssal mask dmg amp
	// horizon focus dmg amp
	// imperial mandate dmg amp
	// on hit damage - ardent censer, fiendhunter bolts, nashor's tooth, guinsoo, terminus, botrk, manamune/muramana, recurve bow, wit's end
	// ldr & custom variable from it
	// champion passives - irelia, warwick, volibear
}

/** TODO basic aa calc? not sure about the interface yet */
export function basicAttack() {
	// stuff from championDamage
	// kraken slayer
	// check tiamat items damage
	// randuin's omen
	// warden's mail
	// steelcaps/armored advance
}

export function calculateDamage(
	rawDamage: number,
	type: IDamageType,
	target: IDamageTarget,
	penetration: Pick<IChampionStats, 'lethality' | 'percentArmorPen' | 'flatMagicPen' | 'percentMagicPen'>,
): IDamageResults {
	if (type === 'true') {
		return { postMitigationDamage: rawDamage, effectiveResists: 0 };
	}

	const [resists, flatPen, percentPen] = type === 'physical'
		? [target.stats.armor, penetration.lethality, penetration.percentArmorPen]
		: [target.stats.magicResist, penetration.flatMagicPen, penetration.percentMagicPen];

	const effectiveResists = Math.max(0, (resists * (1 - percentPen)) - flatPen);
	const postMitigationDamage = rawDamage / (1 + effectiveResists / 100);

	return {
		effectiveResists,
		postMitigationDamage,
	};
}

export function calculateResistPercentageReduction(resists: number): number {
	if (resists <= 0) {
		return 0;
	}

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
