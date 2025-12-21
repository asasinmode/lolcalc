import { expect } from 'bun:test';

const red = '\x1B[31m';
const green = '\x1B[32m';
const yellow = '\x1B[33m';
const reset = '\x1B[0m';

const LITERAL_STATS: IChampionStatName[] = ['healShieldPower', 'lifeSteal', 'critChance', 'critDamageMultiplier', 'percentArmorPen', 'percentMagicPen', 'attackSpeed'];

expect.extend({
	toBeDisplayedStats(received: any, expected: Partial<IChampionStats>) {
		let pass = true;
		const wrongStats: [stat: string, received: number, rounded: number, isLiteral: boolean][] = [];

		for (const [stat, value] of Object.entries(expected) as [IChampionStatName, number][]) {
			const isLiteral = LITERAL_STATS.includes(stat);
			const isEqual = isLiteral ? (Math.abs(value - received[stat]) < 0.005) : (Math.round(received[stat]) === value);
			if (!isEqual) {
				pass = false;
				wrongStats.push([stat, received[stat], value, isLiteral]);
			}
		}

		return {
			pass,
			message: () => {
				const to = pass ? 'not to' : 'to';
				return wrongStats.map(([stat, received, rounded, isLiteral]) =>
					`Expected stat ${yellow}${stat}${reset} ${red}${received}${reset} ${to} ${isLiteral ? 'be' : 'round to'} ${green}${rounded}${reset}`,
				).join('\n');
			},
		};
	},
});

interface CustomMatchers {
	/**
	 * Used to check if a champion stat value is what's displayed in game
	 * @example
	 * ```ts
	 * expect(stats).toBeDisplayedStats({
	 *   health: 740,
	 *   hpRegen: 4,
	 *   attackDamage: 73,
	 * })
	 * ```
	 */
	toBeDisplayedStats: (stats: Partial<IChampionStats>) => void;
}

declare module 'bun:test' {
	// eslint-disable-next-line unused-imports/no-unused-vars
	interface Matchers<T> extends CustomMatchers {}
}
