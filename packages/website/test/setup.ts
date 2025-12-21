import { expect } from 'bun:test';

const red = '\x1B[31m';
const green = '\x1B[32m';
const yellow = '\x1B[33m';
const reset = '\x1B[0m';

expect.extend({
	toBeDisplayedStats(received: any, expected: Partial<IChampionStats>) {
		let pass = true;
		const wrongStats: [stat: string, received: number, rounded: number][] = [];

		for (const [stat, value] of Object.entries(expected)) {
			if (Math.round(received[stat]) !== value) {
				pass = false;
				wrongStats.push([stat, received[stat], value]);
			}
		}

		return {
			pass,
			message: () => {
				const to = pass ? 'not to' : 'to';
				return wrongStats.map(([stat, received, rounded]) =>
					`Expected stat ${yellow}${stat}${reset} ${red}${received}${reset} ${to} round to ${green}${rounded}${reset}`,
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
	 *   manaRegen: 8,
	 * })
	 * ```
	 */
	toBeDisplayedStats: (stats: Partial<IChampionStats>) => void;
}

declare module 'bun:test' {
	// eslint-disable-next-line unused-imports/no-unused-vars
	interface Matchers<T> extends CustomMatchers {}
}
