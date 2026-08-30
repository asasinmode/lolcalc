import fs from 'node:fs/promises';
import { addTemplate, defineNuxtModule, resolveFiles, updateTemplates } from '@nuxt/kit';

interface IFluidVariablesConfig {
	/**
	 * default min _horizontal_ viewport in px
	 * @default 320
	 */
	minViewport?: number;
	/**
	 * default max _horizontal_ viewport in px
	 * @default 1440
	 */
	maxViewport?: number;
	/**
	 * default min _vertical_ viewport in px
	 * @default 320
	 */
	minVerticalViewport?: number;
	/**
	 * default max _vertical_ viewport in px
	 * @default 720
	 */
	maxVerticalViewport?: number;
	/**
	 * should be the same as page's `:root { font-size }` property
	 * note that it **doesn't apply to breakpoints**, just values, so with root's `font-size: 14px` `--fluid-f768-16-32-t1024` would mean at `768px` the value is `14px` and at `1024px` it grows to `28px`
	 * @default 16;
	 */
	remInPx?: number;
	/**
	 * used for `variableRegexp` and created variable names. Should match the regexp if it's overriden
	 * @default --fluid
	 */
	variablePrefix?: string;
	/**
	 * same as `variablePrefix` but vertical
	 * @default --vfluid
	 */
	verticalVariablePrefix?: string;
	/**
	 * created based on the `variablePrefix` option, this overrides it
	 * the regexp should return 4 matches where `[minViewport, sizeFrom, sizeTo, maxViewport]`
	 * @default --fluid-(?:f(\\d+)-)?(\\d+)-(\\d+)(?:-t(\\d+))?
	 */
	variableRegexp?: RegExp;
	/** same as `variableRegexp` but vertical */
	verticalVariableRegexp?: RegExp;
}

export default defineNuxtModule<IFluidVariablesConfig>({
	meta: {
		name: 'fluid-variables',
		configKey: 'fluidVariables',
	},
	async setup(options, nuxt) {
		options.minViewport ??= 320;
		options.maxViewport ??= 1440;
		options.minVerticalViewport ??= 320;
		options.maxVerticalViewport ??= 720;
		options.remInPx ??= 16;
		options.variablePrefix ??= '--fluid';
		options.verticalVariablePrefix ??= '--vfluid';
		options.variableRegexp ??= new RegExp(`${options.variablePrefix}-(?:f(\\d+)-)?(\\d+)-(\\d+)(?:-t(\\d+))?`, 'g');
		options.verticalVariableRegexp ??= new RegExp(`${options.verticalVariablePrefix}-(?:f(\\d+)-)?(\\d+)-(\\d+)(?:-t(\\d+))?`, 'g');

		const variablesByFile: Map<string, [IFileVariables, IFileVariables]> = new Map();
		let generatedCss = '';

		const files = await resolveFiles(nuxt.options.srcDir, ['**/*.css', '**/*.vue'], {
			ignore: ['node_modules/**', '.nuxt/**', 'dist/**', '**/node_modules/**', '**/.git/**'],
		});

		await Promise.all(files.map(file => processFile(file)));

		generatedCss = generateCss(variablesByFile, options);

		const template = 'fluid-variables.css';
		addTemplate({
			filename: template,
			getContents: () => generatedCss,
		});

		async function processFile(file: string) {
			variablesByFile.set(file, await extractFluidVariables(file, options));
		}

		nuxt.options.css.push('#build/fluid-variables.css');

		nuxt.hook('builder:watch', async (_event, path) => {
			if (path.endsWith('.css') || path.endsWith('.vue')) {
				await processFile(path);
				generatedCss = generateCss(variablesByFile, options);
				updateTemplates({ filter: t => t.filename === template });
			}
		});
	},
});

type IFileVariables = Map<string, IFluidVariable>;

interface IFluidVariable {
	sizeFrom: number;
	sizeTo: number;
	fromViewport?: number;
	toViewport?: number;
}

const defaultRemInPx = 16;

function generateClamp(
	sizeFrom: number,
	sizeTo: number,
	minScreenWidth: number,
	maxScreenWidth: number,
	remInPx: number,
	viewportUnit: 'w' | 'h',
): string {
	const slope = (sizeTo - sizeFrom) / (maxScreenWidth - minScreenWidth);
	const yAxisIntersection = -minScreenWidth * slope + sizeFrom;

	const minSize = Math.min(sizeFrom, sizeTo);
	const maxSize = Math.max(sizeFrom, sizeTo);

	return `clamp(${formatNumber(minSize / defaultRemInPx)}rem, ${formatNumber(yAxisIntersection / remInPx)}rem + ${formatNumber(slope * 100)}v${viewportUnit}, ${formatNumber(maxSize / defaultRemInPx)}rem)`;
}

function formatNumber(number: number) {
	return Number.parseFloat(number.toFixed(4));
}

async function extractFluidVariables(filePath: string, config: IFluidVariablesConfig): Promise<[ horizontal: IFileVariables, vertical: IFileVariables ]> {
	const hVars: IFileVariables = new Map();
	const vVars: IFileVariables = new Map();
	const content = await fs.readFile(filePath, 'utf-8');

	setMatchedVariables(hVars, content, config.variableRegexp!);
	setMatchedVariables(vVars, content, config.verticalVariableRegexp!);

	return [hVars, vVars];
}

function setMatchedVariables(variables: IFileVariables, content: string, regex: RegExp) {
	for (const match of content.matchAll(regex)) {
		const fromViewport = match[1] ? Number(match[1]) : undefined;
		const sizeFrom = Number(match[2]);
		const sizeTo = Number(match[3]);
		const toViewport = match[4] ? Number(match[4]) : undefined;

		const prefix = fromViewport ? `f${fromViewport}-` : '';
		const suffix = toViewport ? `-t${toViewport}` : '';

		if (
			!Number.isNaN(sizeFrom)
			&& !Number.isNaN(sizeTo)
			&& !variables.has(`${prefix}${sizeFrom}-${sizeTo}${suffix}`)
		) {
			variables.set(`${prefix}${sizeFrom}-${sizeTo}${suffix}`, {
				sizeFrom,
				sizeTo,
				fromViewport,
				toViewport,
			});
		}
	}
}

function generateCss(variablesByFile: Map<string, [horizontal: IFileVariables, vertical: IFileVariables]>, config: IFluidVariablesConfig) {
	const wantedHVariables: IFileVariables = new Map();
	const wantedVVariables: IFileVariables = new Map();

	for (const [horizontalVars, verticalVars] of variablesByFile.values()) {
		for (const [key, variable] of horizontalVars.entries()) {
			if (!wantedHVariables.has(key)) {
				wantedHVariables.set(key, variable);
			}
		}
		for (const [key, variable] of verticalVars.entries()) {
			if (!wantedVVariables.has(key)) {
				wantedVVariables.set(key, variable);
			}
		}
	}

	let css = ':root {\n';

	for (const [key, { sizeFrom, sizeTo, fromViewport, toViewport }] of wantedHVariables.entries()) {
		css += `\t${config.variablePrefix!}-${key}: ${generateClamp(sizeFrom, sizeTo, fromViewport || config.minViewport!, toViewport || config.maxViewport!, config.remInPx!, 'w')};\n`;
	}
	for (const [key, { sizeFrom, sizeTo, fromViewport, toViewport }] of wantedVVariables.entries()) {
		css += `\t${config.verticalVariablePrefix!}-${key}: ${generateClamp(sizeFrom, sizeTo, fromViewport || config.minVerticalViewport!, toViewport || config.maxVerticalViewport!, config.remInPx!, 'h')};\n`;
	}

	css += '}';

	return css;
}
