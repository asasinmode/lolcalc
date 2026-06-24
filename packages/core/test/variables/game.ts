import type { IReplaceGameVariablesRV } from '@lolcalc/core/variables/game.ts';
import type { TText } from '@lolcalc/data';
import assert from 'node:assert';
import test from 'node:test';
import { replaceGameVariables } from '@lolcalc/core/variables/game.ts';
import { ITEMS_BY_NAME, TEXT } from '@lolcalc/data';
import { ITEM_NAME_TO_ID } from '@lolcalc/shared';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupPatchFixture } from '../utils.ts';

function assertMetaSuffix(variableName: string, expected: string, replaceResult: IReplaceGameVariablesRV) {
	return assert.strictEqual(replaceResult.variables.get(variableName)?.metaSuffix, ` = (${expected})`);
}

test.before(() => {
	setupPatchFixture(fixture);
});

test.only('extended equals', async (t) => {
	t.test('single stat scaling', () => {
		const runaan = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.runaan].tooltipShop[0]![2]!, 'item', { item: ITEMS_BY_NAME.runaan }, undefined, { isExtended: true });
		assertMetaSuffix('BoltDamage', '<scalead>55%</scalead>%i:scalead%', runaan);

		const manamune = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.manamune].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.manamune }, undefined, { isExtended: true });
		assertMetaSuffix('BonusADFromMana', '<scalemana>2%</scalemana>%i:scalemana%', manamune);

		const unendingDespair = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.unendingDespair].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.unendingDespair }, undefined, { isExtended: true });
		assertMetaSuffix('DrainCalc', '<scalehealth>3% bonus</scalehealth> %i:scalehealth%', unendingDespair);

		const icebornGauntlet = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.icebornGauntlet].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.icebornGauntlet }, undefined, { isExtended: true });
		assertMetaSuffix('SpellbladeDamage', '<scalead>150% base</scalead> %i:scalead%', icebornGauntlet);
	});

	t.test('const + single stat scaling', () => {
		const zazzak = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.zazZakRealmspike].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.zazZakRealmspike }, undefined, { isExtended: true });
		assertMetaSuffix('TooltipDamage', '<const>10</const> <scaleap>+ 15%</scaleap>%i:scaleap%', zazzak);

		const thornmail = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.thornmail].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.thornmail }, undefined, { isExtended: true });
		assertMetaSuffix('TotalDamage', '<const>20</const> <scalearmor>+ 10% bonus</scalearmor> %i:scalearmor%', thornmail);

		const sunfireAegis = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.sunfireAegis].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.sunfireAegis }, undefined, { isExtended: true });
		assertMetaSuffix('DPS', '<const>20</const> <scalehealth>+ 1% bonus</scalehealth> %i:scalehealth%', sunfireAegis);

		const axiomArc = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.axiomArc].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.axiomArc }, undefined, { isExtended: true });
		assertMetaSuffix('UltimateRefund', '<const>10</const> <scalelethality>+ 25%</scalelethality>%i:scaleapen%', axiomArc);

		const deadMansPlate = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.deadMansPlate].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.deadMansPlate }, undefined, { isExtended: true });
		assertMetaSuffix('MaxDamageCalc', '<const>40</const> <scalead>+ 100% base</scalead> %i:scalead%', deadMansPlate);

		const actualizer = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.actualizer].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.actualizer }, undefined, { isExtended: true });
		assertMetaSuffix('ManaCalc', '<const>15</const> <scalemana>+ 0.005% bonus</scalemana> %i:scalemana%', actualizer);
	});

	t.test('level', () => {
		const dreamMaker = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.dreamMaker].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.dreamMaker }, undefined, { isExtended: true });
		assertMetaSuffix('ProcDmg', '<const>40 - 160</const>%i:scalelevel%', dreamMaker);

		const solariLocket = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.solariLocket].tooltipInventory[0]![1]!, 'item', { item: ITEMS_BY_NAME.solariLocket }, undefined, { isExtended: true });
		assertMetaSuffix('ShieldAmount', '<const>290 - 360</const>%i:scalelevel%', solariLocket);

		const statikkShiv = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.statikkShiv].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.statikkShiv }, undefined, { isExtended: true });
		assertMetaSuffix('BounceCount', '<const>4 - 7</const>%i:scalelevel%', statikkShiv);

		const hextechGunblade = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.hextechGunblade].tooltipShop[0]![2]!, 'item', { item: ITEMS_BY_NAME.hextechGunblade }, undefined, { isExtended: true });
		assertMetaSuffix('ActiveDamage', '<const>175 - 253%i:scalelevel%</const> <scaleap>+ 30%%i:scaleap%</scaleap>', hextechGunblade);

		const terminus = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.terminus].tooltipShop[1]![1]!, 'item', { item: ITEMS_BY_NAME.terminus }, undefined, { isExtended: true });
		assertMetaSuffix('ARMRPerHitScaling', '<const>6 - 8</const>%i:scalelevel%', terminus);

		const bloodthirster = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.bloodthirster].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.bloodthirster }, undefined, { isExtended: true });
		assertMetaSuffix('OvershieldCalc', '<const>165 - 315</const>%i:scalelevel%', bloodthirster);
	});

	t.test('multiple stats', () => {
		// dusk and dawn, essence reaver, lich bane
	})

	t.test('melee', () => {
		// hexdrinker, bastionbreaker, kraken slayer, endless hunger, ravenous hydra
	})

	t.test('ranged', () => {
		// profane hydra, eclipse, hullbreaker, shieldbow, titanic hydra, stridebreaker
	})

	t.test('melee ranged', () => {
		// bastionbreaker, hullbreaker, kraken slayer, endless hunger, stridebreaker
	})

	t.test('misc', () => {
		// protoplasm harness
	})
});
