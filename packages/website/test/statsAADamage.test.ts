import { describe, expect, it } from 'bun:test';
import { calculateChampionStats } from '../app/utils/calculateChampionStats';
import draven_15_24_1 from './fixtures/15-24-1_draven.json';
import { buildItems, numberRuneShards } from './util';

describe('15.24.1 draven shards 111', () => {
	const shards = numberRuneShards(1, 1, 1);
	it('level 1, no items', () => {
		const { totalStats } = calculateChampionStats(draven_15_24_1, 1, [], { shards });

		expect(totalStats).toBeDisplayedStats({
			hp: 740,
			attackDamage: 73,
		});
	});

	it('misc items', () => {
		const { totalStats } = calculateChampionStats(
			draven_15_24_1,
			1,
			buildItems(['bloodthirster', 'cosmic drive', 'knights vow', 'mikael', 'axiom arc', 'unending despair']),
			{ shards },
		);

		expect(totalStats).toBeDisplayedStats({
			hp: 1940,
			hpRegen: 8,
			manaRegen: 16,
			healShieldPower: 0.12,
			lethality: 18,
			lifeSteal: 0.15,
			attackDamage: 208,
			abilityPower: 70,
			armor: 94,
			magicResists: 55,
			abilityHaste: 80,
			moveSpeed: 343,
		});
	});

	it('crit items', () => {
		const items = ['infinity edge', 'phantom dancer', 'berserker greaves', 'lord dominik', 'axiom arc'];

		const { totalStats: stats1 } = calculateChampionStats(
			draven_15_24_1,
			1,
			buildItems(items),
			{ shards },
		);

		expect(stats1).toBeDisplayedStats({
			hp: 740,
			lethality: 18,
			attackDamage: 228,
			attackSpeed: 1.29,
			abilityHaste: 20,
			critChance: 0.75,
			critDamageMultiplier: 2.15,
		});

		const { totalStats: stats2 } = calculateChampionStats(
			draven_15_24_1,
			12,
			buildItems(items),
			{ shards: numberRuneShards(1, 1, 1) },
		);

		expect(stats2).toBeDisplayedStats({
			hp: 1764,
			lethality: 18,
			attackDamage: 263,
			armor: 73,
			magicResists: 43,
			attackSpeed: 1.47,
			abilityHaste: 20,
			critChance: 0.75,
			critDamageMultiplier: 2.15,
		});
	});
});
