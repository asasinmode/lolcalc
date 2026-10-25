const owners = new Map<HTMLElement, boolean>();
let eater: HTMLElement | undefined;

function syncEating() {
	eater?.toggleAttribute('data-eat', [...owners.values()].some(Boolean));
}

/** self-heal: owners removed from the DOM or closed without us hearing about it (e.g. dialog closed with a tooltip open) */
function prune() {
	for (const owner of owners.keys()) {
		if (!owner.isConnected || !owner.matches(':popover-open')) owners.delete(owner);
	}
}

/** call BEFORE showing `owner`. Top layer order is open order, so the eater has to open first to sit below it */
export function acquireClickEater(owner: HTMLElement, eat = false) {
	prune();
	if (!eater) {
		eater = document.createElement('div');
		eater.id = 'click-eater';
		eater.setAttribute('popover', 'manual');
		eater.setAttribute('aria-hidden', 'true');
		eater.ontouchstart = (event) => event.preventDefault();
	}
	if (!owners.size) {
		/* a modal dialog makes everything outside it inert, top layer included, so the eater must live inside the one containing the owner */
		const host = owner.closest('dialog:modal') ?? document.body;
		eater.parentElement !== host && host.append(eater);
	}
	owners.set(owner, eat);
	syncEating();
	!eater.matches(':popover-open') && eater.showPopover();
}

export function releaseClickEater(owner: HTMLElement) {
	owners.delete(owner);
	prune();
	syncEating();
	!owners.size && eater?.matches(':popover-open') && eater.hidePopover();
}

/** pinned tooltips block pointer events, plain hover ones don't */
export function setClickEaterEating(owner: HTMLElement, eat: boolean) {
	owners.has(owner) && owners.set(owner, eat);
	syncEating();
}
