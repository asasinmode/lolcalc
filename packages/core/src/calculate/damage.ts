import type { IChampionStats } from '@lolcalc/shared';

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
