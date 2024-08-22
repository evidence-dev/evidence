import { CodeMapping, VirtualCode } from '@volar/language-core';
import { IScriptSnapshot } from 'typescript';

export class EvidenceCode implements VirtualCode {
	id = 'root';

	languageId = 'evidence';

	embeddedCodes: VirtualCode[] = [];

	mappings: CodeMapping[] = [];

	snapshot: IScriptSnapshot;

	constructor(snapshot: IScriptSnapshot) {
		this.mappings = [
			{
				sourceOffsets: [0],
				generatedOffsets: [0],
				lengths: [snapshot.getLength()],
				data: {
					completion: true,
					format: true,
					navigation: true,
					semantic: true,
					structure: true,
					verification: true
				}
			}
		];
		this.snapshot = snapshot;
		this.onSnapshotUpdated();
	}

	update(newSnapshot: IScriptSnapshot) {
		this.snapshot = newSnapshot;
		this.onSnapshotUpdated();
	}

	onSnapshotUpdated() {
		this.embeddedCodes = EvidenceCode.getEmbeddedCodes(this.snapshot);
	}

	static getEmbeddedCodes(snapshot: IScriptSnapshot): VirtualCode[] {
		return [
			{
				id: 'something',
				languageId: 'svelte',
				mappings: [
					{
						sourceOffsets: [0],
						generatedOffsets: [0],
						lengths: [snapshot.getLength()],
						data: {
							completion: true,
							format: true,
							navigation: true,
							semantic: true,
							structure: true,
							verification: true
						}
					}
				],
				snapshot
			}
		];
	}
}
