import { CodeMapping, VirtualCode } from '@volar/language-core';
import { IScriptSnapshot } from 'typescript';

export class EvidenceCode implements VirtualCode {
	id = 'root';

	languageId = 'evidence';

	embeddedCodes: VirtualCode[] = [];

	mappings: CodeMapping[] = [];

	snapshot: IScriptSnapshot;

	constructor(snapshot: IScriptSnapshot) {
		this.snapshot = snapshot;
		this.onSnapshotUpdated();
	}

	update(newSnapshot: IScriptSnapshot) {
		this.snapshot = newSnapshot;
		this.onSnapshotUpdated();
	}

	onSnapshotUpdated() {
		// Do something with the snapshot
	}
}
