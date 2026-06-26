import type { IReplaceGameVariablesRV } from '@lolcalc/core/variables/game.ts';
import type { TText } from '@lolcalc/data';
import assert from 'node:assert';
import test from 'node:test';
import { DamageSource } from '@lolcalc/core/DamageSource.ts';
import { specificKnownVariables } from '@lolcalc/core/specifics/index.ts';
import { ITEM_SPECIFICS } from '@lolcalc/core/specifics/item.ts';
import { replaceGameVariables } from '@lolcalc/core/variables/game.ts';
import { ITEMS_BY_NAME, TEXT } from '@lolcalc/data';
import { ITEM_NAME_TO_ID } from '@lolcalc/shared';
import fixture from '../fixtures/16.12.1.fixture.json' with { type: 'json' };
import { setupDamageSource, setupPatchFixture } from '../utils.ts';

function assertMetaSuffix(variableName: string, expected: string, replaceResult: IReplaceGameVariablesRV) {
	return assert.strictEqual(replaceResult.variables.get(variableName)?.metaSuffix, ` = (${expected})`);
}

test.before(() => {
	setupPatchFixture(fixture);
});

test('extended equals', async (t) => {
	const meleeDamageSource = await setupDamageSource(fixture, 'Aatrox', {
		items: [ITEMS_BY_NAME.ravenousHydra],
	});
	const rangedDamageSource = await setupDamageSource(fixture, 'Ahri', {
		items: [ITEMS_BY_NAME.eclipse, ITEMS_BY_NAME.stridebreaker],
	});
	const championlessDamageSource = new DamageSource({ items: [ITEMS_BY_NAME.eclipse] });

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
		const duskAndDawn = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.duskAndDawn].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.duskAndDawn }, undefined, { isExtended: true });
		assertMetaSuffix('SpellbladeDamage', '<scalead>75% base %i:scalead%</scalead> <scaleap>+ 10%%i:scaleap%</scaleap>', duskAndDawn);
		assertMetaSuffix('SpellbladeHealing', '<scaleap>10%%i:scaleap%</scaleap> <scalehealth>+ 3% bonus %i:scalehealth%</scalehealth>', duskAndDawn);

		const essenceReaver = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.essenceReaver].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.essenceReaver, dynamicVariables: specificKnownVariables(ITEM_SPECIFICS[ITEM_NAME_TO_ID.essenceReaver].variables) }, undefined, { isExtended: true });
		assertMetaSuffix('SpellbladeDamage', '<scalead>125% base %i:scalead%</scalead> + 50%%i:scalecrit%', essenceReaver);
		assertMetaSuffix('TotalManaRefund', '50% <var>Spellblade damage</var>', essenceReaver);

		const lichBane = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.lichBane].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.lichBane }, undefined, { isExtended: true });
		assertMetaSuffix('SpellbladeDamage', '<scalead>75% base %i:scalead%</scalead> <scaleap>+ 45%%i:scaleap%</scaleap>', lichBane);
	});

	t.test('melee', () => {
		const hexdrinker = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.hexdrinker].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.hexdrinker, isRanged: false }, undefined, { isExtended: true });
		assertMetaSuffix('MeleeRangedSplit', '<const>110 - 280</const>%i:scalelevel%', hexdrinker);

		const bastionBreaker = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.bastionBreaker].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.bastionBreaker, isRanged: false }, undefined, { isExtended: true });
		assertMetaSuffix('AbilityDamageCalc', '<const>30</const> <scalelethality>+ 150%%i:scaleapen%</scalelethality>', bastionBreaker);

		const krakenSlayer = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.krakenSlayer].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.krakenSlayer, isRanged: false }, undefined, { isExtended: true });
		assertMetaSuffix('DamageAmount', '<const>150 - 200</const>%i:scalelevel%', krakenSlayer);

		const endlessHunger = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.endlessHunger].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.endlessHunger, isRanged: false }, undefined, { isExtended: true });
		assertMetaSuffix('HasteFromAD', '<const>5</const> <scalead>+ 13% bonus</scalead> %i:scalead%', endlessHunger);

		const ravenousHydra = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.ravenousHydra].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.ravenousHydra, isRanged: false, dynamicVariables: meleeDamageSource.computed.variables.value.items[ITEM_NAME_TO_ID.ravenousHydra] }, undefined, { isExtended: true });
		assertMetaSuffix('lolcalcChampRange', '<scalead>40%</scalead>%i:scalead%', ravenousHydra);
	});

	t.test('ranged', () => {
		const profaneHydra = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.profaneHydra].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.profaneHydra, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('CleaveDamage', '<scalead>20%</scalead>%i:scalead%', profaneHydra);

		const eclipse = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.eclipse].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.eclipse, isRanged: true, dynamicVariables: rangedDamageSource.computed.variables.value.items[ITEM_NAME_TO_ID.eclipse] }, undefined, { isExtended: true });
		assertMetaSuffix('lolcalcChampRange', '<const>80</const> <scalead>+ 20% bonus</scalead> %i:scalead%', eclipse);

		const hullbreaker1 = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.hullbreaker].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.hullbreaker, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('MaxStackDamage', '<scalead>84% base %i:scalead%</scalead> <scalehealth>+ 3.5%%i:scalehealth%</scalehealth>', hullbreaker1);
		const hullbreaker2 = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.hullbreaker].tooltipShop[1]![1]!, 'item', { item: ITEMS_BY_NAME.hullbreaker, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('BonusMinionResists', '<const>35 - 65</const>%i:scalelevel%', hullbreaker2);

		const immortalShieldbow = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.immortalShieldbow].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.immortalShieldbow, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('ShieldAmount', '<const>320 - 560</const>%i:scalelevel%', immortalShieldbow);

		const titanicHydra = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.titanicHydra].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.titanicHydra, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('OnHitDamageCalc', '<scalehealth>0.5%</scalehealth>%i:scalehealth%', titanicHydra);

		const stridebreaker = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.stridebreaker].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.stridebreaker, isRanged: true, dynamicVariables: rangedDamageSource.computed.variables.value.items[ITEM_NAME_TO_ID.stridebreaker] }, undefined, { isExtended: true });
		assertMetaSuffix('lolcalcChampRange', '<scalead>20%</scalead>%i:scalead%', stridebreaker);
	});

	t.test('melee ranged', () => {
		const bastionBreaker = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.bastionBreaker].tooltipShop[1]![1]!, 'item', { item: ITEMS_BY_NAME.bastionBreaker }, undefined, { isExtended: true });
		assertMetaSuffix('DamageCalc', '<const>300</const> <scalelethality>+ 2500%%i:scaleapen%</scalelethality> <const>|</const> <const>240</const> <scalelethality>+ 2000%%i:scaleapen%</scalelethality>', bastionBreaker);

		const krakenSlayer = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.krakenSlayer].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.krakenSlayer }, undefined, { isExtended: true });
		assertMetaSuffix('MaximumDamage', '<const>263 - 350</const> <const>|</const> <const>210 - 280</const>%i:scalelevel%', krakenSlayer);

		const eclipse = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.eclipse].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.eclipse, dynamicVariables: championlessDamageSource.computed.variables.value.items[ITEM_NAME_TO_ID.eclipse] }, undefined, { isExtended: true });
		assertMetaSuffix('lolcalcChampRange', '<const>160</const> <scalead>+ 40% bonus %i:scalead%</scalead> <const>|</const> <const>80</const> <scalead>+ 20% bonus %i:scalead%</scalead>', eclipse);

		const hullbreaker1 = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.hullbreaker].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.hullbreaker }, undefined, { isExtended: true });
		assertMetaSuffix('MaxStackDamageVSStructures', '<scalead>300% base %i:scalead%</scalead> <scalehealth>+ 10%%i:scalehealth%</scalehealth> <const>|</const> <scalead>210% base %i:scalead%</scalead> <scalehealth>+ 7%%i:scalehealth%</scalehealth>', hullbreaker1);
		const hullbreaker2 = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.hullbreaker].tooltipShop[1]![1]!, 'item', { item: ITEMS_BY_NAME.hullbreaker }, undefined, { isExtended: true });
		assertMetaSuffix('BonusMinionResists', '<const>70 - 130</const> <const>|</const> <const>35 - 65</const>%i:scalelevel%', hullbreaker2);

		const titanicHydra = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.titanicHydra].tooltipShop[1]![1]!, 'item', { item: ITEMS_BY_NAME.titanicHydra, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('CalcValueD', '<scalehealth>4.5%</scalehealth>%i:scalehealth%', titanicHydra);
	});

	t.test('misc', () => {
		const protoplasmHarness = replaceGameVariables((TEXT as unknown as TText).items[ITEM_NAME_TO_ID.protoplasmHarness].tooltipShop[0]![1]!, 'item', { item: ITEMS_BY_NAME.protoplasmHarness, isRanged: true }, undefined, { isExtended: true });
		assertMetaSuffix('TotalHealthRegen', '<const>200 - 400%i:scalelevel%</const> <scalearmor>+ 175% bonus %i:scalearmor%</scalearmor> <scalemr>+ 175% bonus %i:scalemr%</scalemr>', protoplasmHarness);
	});
});
