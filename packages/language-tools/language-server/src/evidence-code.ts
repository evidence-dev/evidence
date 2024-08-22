import { CodeMapping, VirtualCode } from '@volar/language-core';
import { IScriptSnapshot } from 'typescript';
import { parse as parseSvelte } from 'svelte/compiler';

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
		const snapshotContent = snapshot.getText(0, snapshot.getLength());
		const svelteAst = parseSvelte(snapshotContent);
		const svelteComponents = svelteAst.html.children?.filter(
			(node) => node.type === 'InlineComponent'
		);

		const embeddedSvelteCodes = svelteComponents?.map((component, index) => ({
			id: `svelte-${index}`,
			languageId: 'svelte',
			snapshot: {
				getText: (start: number, end: number) =>
					snapshotContent.substring(component.start + start, component.start + end),
				getLength: () => component.end - component.start,
				getChangeRange: () => undefined
			},
			mappings: [
				{
					sourceOffsets: [component.start],
					generatedOffsets: [0],
					lengths: [component.end - component.start],
					data: {
						completion: true,
						format: true,
						navigation: true,
						semantic: true,
						structure: true,
						verification: true
					}
				}
			]
		}));

		return [...(embeddedSvelteCodes ?? [])];
	}
}
