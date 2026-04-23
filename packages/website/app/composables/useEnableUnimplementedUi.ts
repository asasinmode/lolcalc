export function useEnableUnimplementedUi() {
	return useState('enableUnimplementedUi', () => true);
}

export function useIconButtonsShowText() {
	return useState('tmpIconButtonsShowText', () => false);
}
