import type { IChampion, IDragonName } from '@lolcalc/data/types.js';
import type { IChampionAbilityKey, IEffectObjectName } from '@lolcalc/shared';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
import process from 'node:process';
import { CHAMPIONS, EFFECTS, ITEMS, MISC, useChampion } from '@lolcalc/data';
import { ALL_CHAMPION_ABILITY_KEYS } from '@lolcalc/shared';
import { stringifyObject } from './index.ts';

const TEST_ROOT = nodePath.join(import.meta.dirname, '../packages/core/test');

function isAbilityKey(value: string): value is IChampionAbilityKey {
	return (ALL_CHAMPION_ABILITY_KEYS as readonly string[]).includes(value);
}

interface IFixtureShape {
	version: string;
	champions: Record<string, Record<string, unknown>>;
	items: Record<string, unknown>;
	effects?: Record<string, unknown>;
	misc?: Record<string, unknown>;
}

function normalizeSemver(version: string): string {
	const parts = version.split('.');
	return parts.length >= 3 ? version : `${version}.1`;
}

interface IParsedArgs {
	version: string;
	champions: string[];
	items: string[];
	effects: string[];
	dragons: string[];
}

const FLAG_MAP: Record<string, keyof Omit<IParsedArgs, 'version'>> = {
	'-c': 'champions',
	'-i': 'items',
	'-e': 'effects',
	'-d': 'dragons',
};

function parseArgs(argv: string[]): IParsedArgs {
	const result: IParsedArgs = { version: '', champions: [], items: [], effects: [], dragons: [] };

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]!;

		if (arg in FLAG_MAP) {
			const value = argv[++i];
			if (value === undefined) {
				console.warn(`[parseArgs] flag ${arg} given without a value, skipping`);
				continue;
			}
			result[FLAG_MAP[arg]!].push(value);
		} else if (!result.version) {
			result.version = arg;
		} else {
			console.warn(`[parseArgs] unexpected argument "${arg}", ignoring`);
		}
	}

	return result;
}

async function applyChampion(fixture: IFixtureShape, raw: string): Promise<void> {
	const [name, abilityListRaw] = raw.split(';');
	if (!name || !(name in CHAMPIONS)) {
		console.warn(`[applyChampion] unknown champion "${name}", skipping`);
		return;
	}

	const champion = await useChampion(name);
	const existing = fixture.champions[name] ?? {};

	existing.stats = champion.stats;

	if (abilityListRaw) {
		const existingAbilities = (existing.abilities as Record<string, unknown>) ?? {};

		for (const key of abilityListRaw.split(',').map(k => k.trim()).filter(Boolean)) {
			if (isAbilityKey(key)) {
				existingAbilities[key] = champion.abilities[key];
			} else if (key in champion) {
				existing[key] = champion[key as keyof IChampion];
			} else {
				console.warn(`[applyChampion] "${key}" is not an ability or champion field, skipping`);
			}
		}

		existing.abilities = existingAbilities;
	}

	fixture.champions[name] = existing;
}

function findItem(search: string) {
	const words = search.toLocaleLowerCase().replaceAll(/[^a-z ]/g, '').split(' ').filter(Boolean);
	return Object.values(ITEMS).find(item => words.every(word => item.searchString.includes(word)));
}

function applyItem(fixture: IFixtureShape, search: string): void {
	const item = findItem(search);

	if (item) {
		fixture.items[item.id] = {
			searchString: item.searchString,
			stats: item.stats,
			dataValues: item.dataValues,
			stringCalculations: item.stringCalculations,
			itemCalculations: item.itemCalculations,
			effectAmount: item.effectAmount,
		};
	} else {
		console.warn(`[applyItem] no item found for "${search}", skipping`);
	}
}

function findEffectKey(search: string): IEffectObjectName | undefined {
	search = search.toLocaleLowerCase();
	return Object.entries(EFFECTS).find(([key, effect]) => {
		const searchStrings = [
			key,
			(effect as { dataKey?: string }).dataKey,
			(effect as { objectName?: string }).objectName,
			(effect as { sharedSpellObjectKey?: string }).sharedSpellObjectKey,
		];
		return searchStrings.some(candidate => candidate?.toLocaleLowerCase().includes(search));
	})?.[0] as IEffectObjectName;
}

function applyEffect(fixture: IFixtureShape, search: string): void {
	const key = findEffectKey(search);

	if (key) {
		fixture.effects ??= {};
		fixture.effects[key] = EFFECTS[key];
	} else {
		console.warn(`[applyEffect] no effect found for "${search}", skipping`);
	}
}

function applyDragon(fixture: IFixtureShape, raw: string): void {
	const [dragonName, type] = raw.split('-');

	if (!dragonName || !(type === 'soul' || type === 'stack')) {
		console.warn(`[applyDragon] dragon arg "${raw}" must be of format 'IDragonName-[soul|stack]'`);
		return;
	}

	const dragon = MISC.dragons[dragonName as IDragonName];
	if (!dragon) {
		console.warn(`[applyDragon] invalid dragon name`, dragonName);
		return;
	}

	fixture.misc ??= {};
	fixture.misc[dragonName] = Object.assign((fixture.misc[dragonName] as Record<string, unknown>) ?? {}, {
		[type]: dragon[type],
	});
}

const args = parseArgs(process.argv.slice(2));

if (!args.version) {
	console.error('missing patch version argument');
	process.exit(1);
}

const version = normalizeSemver(args.version);
const fixturePath = `${TEST_ROOT}/fixtures/${version}.fixture.json`;

let fixture: IFixtureShape;

try {
	fixture = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
} catch {
	fixture = { version, champions: {}, items: {} };
}

for (const raw of args.champions) {
	await applyChampion(fixture, raw);
}
for (const raw of args.items) {
	applyItem(fixture, raw);
}
for (const raw of args.effects) {
	applyEffect(fixture, raw);
}
for (const raw of args.dragons) {
	applyDragon(fixture, raw);
}

await fs.mkdir(nodePath.dirname(fixturePath), { recursive: true });
await fs.writeFile(fixturePath, `${stringifyObject(fixture)}\n`);

console.log(`wrote ${fixturePath}`);
