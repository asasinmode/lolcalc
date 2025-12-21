import { describe, expect, it } from 'bun:test';
import { calculateChampionStats } from '../app/utils/calculateChampionStats';
import draven_15_24_1 from './fixtures/15-24-1_draven.json';
import { numberRuneShards } from './util';

describe('[15-24-1_draven] level, items, runes, no passives', () => {
	it('level 1, no items, shards 111', () => {
		const { totalStats } = calculateChampionStats(draven_15_24_1, 1, [], { shards: numberRuneShards(1, 1, 1) });

		expect(totalStats).toBeDisplayedStats({
			hp: 740,
			hpRegen: 4,
			manaRegen: 8,
			attackDamage: 73,
		});
	});
});
