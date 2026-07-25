let resolve: (() => void) | undefined;
let openFn: () => void = () => {};

function reportAnIssue(): Promise<void> {
	return new Promise<void>((_resolve) => {
		openFn();
		resolve = _resolve;
	}).finally(() => {
		resolve = undefined;
	});
}

function _setup(open: () => void): () => void {
	openFn = open;
	return () => resolve?.();
};

export function useReportIssueDialog() {
	return {
		_setup,
		reportAnIssue,
	};
}
