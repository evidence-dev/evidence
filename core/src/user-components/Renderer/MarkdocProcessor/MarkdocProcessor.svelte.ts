import Markdoc, { type Node, type RenderableTreeNode, type ValidateError } from '@markdoc/markdoc';
import type { ValidationContext } from '../../validators/types';
import { fenceQueryName, parseFenceMeta } from '../../common/fence-meta';
import assign from 'lodash/assign';
import isEqual from 'lodash/isEqual';
import { untrack } from 'svelte';
import { parse, transform, validate } from './process-markdoc';
import { parseFrontmatter } from '../../../utils/parseFrontmatter';
import { Debounced } from 'runed';
import type { TranslationMap } from '../../../types/translations';
import type { AccountVariables } from '../../../types/account-variables';
import { TRANSLATIONS_KEY, USER_KEY, ORGANIZATION_KEY } from '../../../constants/variable-keys';
import {
	buildCustomComponentRegistry,
	parseCustomComponentAttributes,
	parseCustomComponentAttributesWithErrors,
	detectMisnestedAttributeDeclarations,
	findSelfReferences,
	tagNameForComponentPath,
	ATTRIBUTE_TYPES,
	type CustomComponentMeta
} from '../../custom-components';
import { tags as builtInTags, nodes as builtInNodes } from '../../..';
import type { Schema } from '@markdoc/markdoc';

const reservedTagNames = new Set<string>([
	...Object.keys(builtInTags),
	...Object.keys(builtInNodes)
]);

type MarkdocRendererArgs = {
	content?: string;
	validationContext?: ValidationContext;
	partials?: Record<string, string>;
	customComponents?: Record<string, string>;
	debounceMs?: number;
	translations?: TranslationMap;
	account?: AccountVariables;
	userVariables?: Record<string, unknown>;
	/**
	 * The file kind the processor is being used to render. Surfaces the
	 * "this is a standalone partial/component, not a page" signal to the
	 * validator so it can drop the false-positive errors that depend on
	 * caller-injected context (attribute values, request-time account
	 * variables, translation keys). `'page'` is the default and means
	 * "validate everything" — the editor wires the actual `data.page.type`
	 * here when editing a partial or component file.
	 */
	standaloneFileType?: 'page' | 'partial' | 'component';
};

/**
 * Error IDs that depend on caller-injected context and can't be evaluated
 * when a PARTIAL is validated standalone. Partials carry no schema — a call
 * site can pass any `variables={…}` map — so the validator has no
 * "expected" set to check against; flagging caller-injected refs produces
 * false positives on every well-formed partial.
 *
 * Components do NOT use this list. They declare their inputs in the
 * `attributes:` frontmatter block, so the validator CAN check against the
 * declared set — a typo like `{{ $titel }}` (when `title` is declared)
 * still squiggles as undefined. Blanket-suppressing components would lose
 * the typo-detection value entirely; the right answer for them is to
 * inject the declared attribute names into the known-variables set so the
 * normal validator runs against an accurate schema.
 *
 * Mirrors the commit-gate suppression in `validate-markdown-files.ts`.
 * Kept in sync deliberately — the lists must match or the editor and the
 * publish gate disagree about what a "valid" partial is.
 */
export const PARTIAL_STANDALONE_SUPPRESSED_ERROR_IDS = new Set([
	'undefined-frontmatter-variable',
	'undefined-translation-key',
	'undefined-account-variable'
]);

/**
 * Suppressed while editing a COMPONENT file standalone. A body referencing a
 * page filter by name (`{{ region.value }}`) is a by-design coupling the
 * file alone can't satisfy — the check moves to where it's decidable: every
 * CALL SITE validates the body's filter refs against that page's actual
 * inputs (componentBodyErrorsAtCallSite), so a page missing the filter
 * errors there with the fix. Same trade partials make for caller variables.
 */
export const COMPONENT_STANDALONE_SUPPRESSED_ERROR_IDS = new Set(['invalid-filter-variable']);

// `partials` and `translations` are re-pushed on every SvelteKit data
// invalidation (the editor page wires `data.partials` / `data.translationsData`
// into setters on each `$effect` flush). Without a value-equality guard,
// each redundant assignment fires `#updateAst()` → reparses the entire
// markdown → invalidates every Markdoc-derived `$derived` → cascades into
// `Query`'s `dataQuery`/`pivotCheckQuery` re-evaluation → aborts in-flight
// query fetches via `runed`'s `AbortController`. On content-heavy pages
// (many inline queries) the cascade saturates the microtask queue and
// queries never settle, freezing the editor preview. `TranslationMap` is
// recursive (`string | Record<string, TranslationValue>`) so a shallow
// comparison would miss nested object values whose references change on
// every reload — `isEqual` handles arbitrary nesting correctly.

export class MarkdocProcessor {
	get markdown() {
		return this.#markdown;
	}

	set markdown(newMarkdown: string) {
		if (this.#markdown === newMarkdown) return;
		this.#markdown = newMarkdown;
		this.#updateAst();
	}

	get partials() {
		return this.#partials;
	}

	set partials(newPartials: Record<string, string>) {
		if (isEqual(this.#partials, newPartials)) return;
		this.#partials = newPartials;
		this.#updateAst();
	}

	get customComponents() {
		return this.#customComponents;
	}

	// Same value-equality guard as `partials` setter: SvelteKit data
	// invalidations re-push the same object every flush, so a shallow
	// reference compare would force a full reparse + query cascade.
	set customComponents(newComponents: Record<string, string>) {
		if (isEqual(this.#customComponents, newComponents)) return;
		this.#customComponents = newComponents;
		this.#updateAst();
	}

	get standaloneFileType() {
		return this.#standaloneFileType;
	}

	// No AST update on this setter — the file type only changes the
	// validator's post-filter, not what parse/transform produce. Updating
	// the AST here would force an unnecessary reparse on every file switch.
	set standaloneFileType(newType: 'page' | 'partial' | 'component') {
		this.#standaloneFileType = newType;
	}

	get translations() {
		return this.#translations;
	}

	set translations(newTranslations: TranslationMap) {
		if (isEqual(this.#translations, newTranslations)) return;
		this.#translations = newTranslations;
		this.#updateAst();
	}

	get validationContext() {
		return this.#validationContext;
	}

	get ast() {
		return this.#ast;
	}

	get tree() {
		return this.#debouncedTree.current;
	}

	get validationErrors() {
		return this.#validationErrors;
	}

	/**
	 * Per-tag-name schema + meta for the project's custom components, derived
	 * reactively from `customComponents`. Surfaced on the processor so
	 * downstream consumers (Monaco tokenizer, attribute autocomplete, the
	 * sidebar's "what attributes does this component take" hover) don't
	 * have to re-run the registry build or care about the path → tag-name
	 * mapping. `customComponents` is keyed by full project-root path
	 * (`components/my_bar`); this getter is keyed by tag name (`my_bar`).
	 */
	get customComponentTags(): Record<string, Schema> {
		return this.#customComponentRegistry.tags;
	}

	get customComponentMeta(): Record<string, CustomComponentMeta> {
		return this.#customComponentRegistry.meta;
	}

	#baseVariables(): Record<string, unknown> {
		const { frontmatter } = parseFrontmatter(this.#ast.attributes?.frontmatter as string);
		return {
			...frontmatter,
			[TRANSLATIONS_KEY]: this.#translations,
			...(this.#account
				? { [USER_KEY]: this.#account.user, [ORGANIZATION_KEY]: this.#account.organization }
				: {}),
			...(this.#userVariables ?? {})
		};
	}

	/**
	 * Variables safe to INTERPOLATE with (the SQL console's compiled view, any
	 * VariableProcessor consumer). Differs from `variables` below on component
	 * files: only declared DEFAULTS are real values — an attribute without a
	 * default has no value while editing the file standalone, so it's absent
	 * here and interpolation leaves its `{{ $attr }}` token visible (the
	 * honest "value comes from the call site" answer). The `variables` getter
	 * falls back to description/type text for its autocomplete PREVIEWS;
	 * feeding that to interpolation put attribute descriptions into compiled
	 * SQL (`from Source query with columns date, …`).
	 */
	get interpolationVariables(): Record<string, unknown> {
		const base = this.#baseVariables();
		if (this.#standaloneFileType !== 'component') return base;
		const fmString = this.#ast.attributes?.frontmatter as string | undefined;
		if (!fmString) return base;
		const { frontmatter: fm } = parseFrontmatter(fmString);
		const attrs = parseCustomComponentAttributes(fm.attributes);
		const preview =
			fm.preview && typeof fm.preview === 'object' ? (fm.preview as Record<string, unknown>) : {};
		const augmented: Record<string, unknown> = { ...base };
		for (const [name, decl] of Object.entries(attrs)) {
			const value = preview[name] ?? decl.default;
			if (value !== undefined) augmented[name] = value;
		}
		return augmented;
	}

	get variables() {
		const base = this.#baseVariables();

		// When editing a custom component standalone, surface each declared
		// attribute's BODY-PROPERTY shape so the editor's `{{ $attr.prop }}`
		// autocomplete can list the available properties. Read-only and
		// autocomplete-only — the actual rendered values come from
		// `#componentDeclaredAttributes` (defaults) via transform()'s
		// config.variables, not from this getter. Keeping the two paths
		// independent lets us hand the variable-suggestion code an object
		// shape it can walk with lodash `get`, without affecting render.
		if (this.#standaloneFileType !== 'component') return base;
		const fmString = this.#ast.attributes?.frontmatter as string | undefined;
		if (!fmString) return base;
		const { frontmatter: fm } = parseFrontmatter(fmString);
		const attrs = parseCustomComponentAttributes(fm.attributes);
		const augmented: Record<string, unknown> = { ...base };
		for (const [name, decl] of Object.entries(attrs)) {
			const props = ATTRIBUTE_TYPES[decl.type]?.bodyProperties;
			if (props && props.length > 0) {
				// Complex types: a synthetic object shape — keys feed the
				// `{{ $attr.prop }}` autocomplete, values are example strings so
				// the suggestion `detail` shows a preview ("start: 2024-01-01").
				const shape: Record<string, string> = {};
				for (const p of props) shape[p.name] = p.example ?? p.description;
				augmented[name] = shape;
			} else {
				// Scalar types (string/column/query/…): surface the bare name so
				// typing `{{` suggests `$name`. The value is only the suggestion
				// preview — declared default first, else the description/type.
				augmented[name] = String(decl.default ?? decl.description ?? decl.type);
			}
		}
		return augmented;
	}

	#markdown = $state('');
	#partials = $state<Record<string, string>>({});
	#customComponents = $state<Record<string, string>>({});
	#validationContext?: ValidationContext = $state();
	#translations = $state<TranslationMap>({});
	#account = $state<AccountVariables | undefined>(undefined);
	// User variables are set once at construction; SSR re-renders handle updates.
	// No public setter needed — pages don't receive updated attributes client-side.
	#userVariables = $state<Record<string, unknown> | undefined>(undefined);
	// Defaults to 'page' (full validation). The editor flips this to
	// 'partial'/'component' when the user opens one of those file kinds so
	// the validator drops standalone-context false positives.
	#standaloneFileType = $state<'page' | 'partial' | 'component'>('page');

	// Declared AFTER `#customComponents` so the $derived's first run reads the
	// initialized field (Svelte 5 surfaces a 'used before initialization' error
	// otherwise). Re-runs reactively as `customComponents` changes.
	#customComponentRegistry = $derived(
		buildCustomComponentRegistry(this.#customComponents, reservedTagNames)
	);

	#ast: Node = $state(Markdoc.parse(''));

	// Declared attributes for the component file currently being edited —
	// map of name → declared `default:` value (or '' when no default). Empty
	// for pages, partials, and when the basePath isn't a component.
	//
	// Plumbed into parse/validate/transform as caller-injected variables so:
	//   (a) `{{ $title }}` VALIDATES when `title` is declared in the file's
	//       `attributes:` block (typo like `$titel` still squiggles)
	//   (b) `{{ $title }}` RENDERS to the declared `default:` value in the
	//       preview pane while editing standalone — so an author iterates
	//       on their component with realistic stand-in values instead of
	//       blanks. Setting `default: 'orders'` on a query attribute means
	//       the preview shows the component as it would render at a call
	//       site that didn't override `data`.
	//
	// Reactively rebuilds when the file content (and thus its frontmatter)
	// changes — typing a new attribute or changing a default updates the
	// preview without a reload.
	#componentDeclaredAttributes = $derived.by(() => {
		if (this.#standaloneFileType !== 'component') return {} as Record<string, unknown>;
		const fmString = this.#ast.attributes?.frontmatter as string | undefined;
		if (!fmString) return {} as Record<string, unknown>;
		const { frontmatter: fm } = parseFrontmatter(fmString);
		const attrs = parseCustomComponentAttributes(fm.attributes);
		// `preview:` supplies AUTHORING-ONLY values for standalone rendering —
		// the fixture for attributes whose real value comes from call sites.
		// Precedence: preview > default > ABSENT. Absent (not '') matters: an
		// empty string used to flow into fence SQL and produce raw warehouse
		// parse errors (`from  where category = ''`); leaving the `{{ $attr }}`
		// token unresolved lets the query gate skip execution and explain
		// instead. Call sites are untouched — preview never leaves this path.
		const preview =
			fm.preview && typeof fm.preview === 'object' ? (fm.preview as Record<string, unknown>) : {};
		const out: Record<string, unknown> = {};
		for (const [name, decl] of Object.entries(attrs)) {
			const value = preview[name] ?? decl.default;
			if (value !== undefined) out[name] = value;
		}
		return out;
	});

	/**
	 * Every declared attribute name with a '' placeholder — validation needs
	 * PRESENCE for the whole schema (so `{{ $attr }}` refs validate and typos
	 * still error), independent of whether a preview/default VALUE exists.
	 */
	#declaredAttributePlaceholders = $derived.by(() => {
		if (this.#standaloneFileType !== 'component') return {} as Record<string, unknown>;
		const fmString = this.#ast.attributes?.frontmatter as string | undefined;
		if (!fmString) return {} as Record<string, unknown>;
		const { frontmatter: fm } = parseFrontmatter(fmString);
		const attrs = parseCustomComponentAttributes(fm.attributes);
		const out: Record<string, unknown> = { ...this.#componentDeclaredAttributes };
		for (const name of Object.keys(attrs)) {
			if (!(name in out)) out[name] = '';
		}
		return out;
	});

	#validationErrors = $derived(
		(() => {
			const raw = validate(
				this.#ast,
				this.#validationContext,
				this.#partials,
				this.#translations,
				this.#account,
				this.#userVariables,
				this.#customComponents,
				this.#declaredAttributePlaceholders
			);

			// Partials have no declared schema → blanket-suppress the three
			// caller-injected-variable error IDs (matches the commit gate
			// in validate-markdown-files.ts). Components are handled
			// differently — see #componentDeclaredAttributes above; the
			// validator runs normally against the schema-derived known set,
			// so a real typo in an `$attr` ref still squiggles.
			const suppressed =
				this.#standaloneFileType === 'partial'
					? raw.filter((e) => !PARTIAL_STANDALONE_SUPPRESSED_ERROR_IDS.has(e.error?.id ?? ''))
					: this.#standaloneFileType === 'component'
						? raw.filter((e) => !COMPONENT_STANDALONE_SUPPRESSED_ERROR_IDS.has(e.error?.id ?? ''))
						: raw;

			// When the user is editing a custom component file itself, surface
			// any collision the registry detected for THIS file. A collision
			// silently drops the tag from `config.tags`, so the body validates
			// fine but every page that calls the tag silently does nothing —
			// the only place to tell the author is here, on the component file.
			if (this.#standaloneFileType !== 'component') return suppressed;
			const basePath = this.#validationContext?.basePath;
			if (!basePath) return suppressed;

			const collisionErrors: ValidateError[] = [];
			for (const collision of this.#customComponentRegistry.collisions) {
				if (collision.fullPath !== basePath) continue;
				const message =
					collision.collidesWith === 'builtin'
						? `Component tag "${collision.tagName}" collides with a built-in tag. Rename this file so it doesn't shadow the built-in (which always wins).`
						: `Component tag "${collision.tagName}" is already defined by another file. Rename this file so the basename is unique across the project.`;
				// NOTE: file-level synthetic errors must be `type: 'text'` with a
				// real line + non-empty character range — the editor's decoration
				// pipeline (ValidationModel) only paints node-anchored errors or
				// `text`-typed standalone ones, and a zero-width range draws
				// nothing. Anchor to the first line of the file.
				collisionErrors.push(this.#fileLevelError('custom-component-name-collision', message));
			}

			// Catch the YAML-indentation footgun: an author types
			//   attributes:
			//     data: query
			//   color:                ← at column 0, not nested
			//     type: string
			// and YAML parses `color` as a top-level frontmatter key, so the
			// component just doesn't see it. The component renders without
			// `color` and the author has no idea why. Walk the top-level keys
			// and warn on anything that LOOKS like an attribute declaration
			// (value matches a known type, OR is an object with a `type:`
			// field) but isn't nested under `attributes:`. We only flag
			// strong signals — random top-level user variables (legal for
			// partial-style body defaults) don't trip this.
			collisionErrors.push(...this.#detectMisnestedAttributeDeclarations());

			// Surface invalid attribute DECLARATIONS on the component file
			// itself. A bad entry (e.g. `value: total` — "total" is not a type;
			// the author meant a default) silently drops the attribute, so
			// `$value` refs go undefined and the failure shows up as a confusing
			// downstream SQL error. Error here, at the source, with the teaching
			// message.
			{
				const { frontmatter: fm } = parseFrontmatter(
					this.#ast.attributes?.frontmatter as string | undefined
				);
				const { errors: attrErrors } = parseCustomComponentAttributesWithErrors(fm.attributes);
				for (const { name, message } of attrErrors) {
					collisionErrors.push(this.#fileLevelError('invalid-component-attribute', message, name));
				}
			}

			// Nudge: an attribute consumed by the component's SQL with neither a
			// preview: value nor a default: means the standalone query preview
			// cannot run (the resolvability gate skips it with an explanation).
			// Point at the declaration with the fix so authors set their
			// fixture up front instead of meeting the gate message per-query.
			{
				const { frontmatter: fm } = parseFrontmatter(
					this.#ast.attributes?.frontmatter as string | undefined
				);
				const attrs = parseCustomComponentAttributes(fm.attributes);
				const preview =
					fm.preview && typeof fm.preview === 'object'
						? (fm.preview as Record<string, unknown>)
						: {};
				const fenceContents: string[] = [];
				const collect = (node: Node): void => {
					if (node.type === 'fence' && typeof node.attributes?.content === 'string') {
						fenceContents.push(node.attributes.content);
					}
					for (const child of node.children ?? []) collect(child);
				};
				collect(this.#ast);
				for (const [name, decl] of Object.entries(attrs)) {
					if (decl.default !== undefined || preview[name] !== undefined) continue;
					const used = fenceContents.some((sql) => new RegExp(`\\{\\{\\s*\\$${name}\\b`).test(sql));
					if (!used) continue;
					collisionErrors.push(
						this.#fileLevelError(
							'component-attribute-needs-preview',
							`"${name}" is used in this component's SQL but has no value while editing the file standalone — the query preview can't run. Add an authoring fixture: \`preview:\n  ${name}: <sample value>\` in the frontmatter (used ONLY here, never at call sites), or a \`default:\` on the attribute if call sites may omit it.`,
							name,
							'warning'
						)
					);
				}
			}

			// A component using its OWN tag renders one level and then the
			// render cycle-guard silently truncates — always an authoring bug.
			const ownTagName = tagNameForComponentPath(basePath);
			for (const node of findSelfReferences(this.#ast, ownTagName)) {
				collisionErrors.push({
					type: 'tag',
					lines: node.lines ?? [0, 0],
					location: node.location ?? { start: { line: 0 }, end: { line: 0 } },
					error: {
						id: 'self-referencing-component',
						level: 'error',
						message: `Component "${ownTagName}" cannot use its own tag — recursive rendering stops after one level, so this can never render fully. Extract the shared part into another component.`
					}
				});
			}

			return [...suppressed, ...collisionErrors];
		})()
	);

	/**
	 * Walks the component file's top-level frontmatter keys looking for
	 * misnested attribute declarations — entries that should live under
	 * `attributes:` but are at column 0 because the author forgot to indent.
	 * Returns a synthetic warning per offender so the editor surfaces it on
	 * the component file with a clear "did you mean to nest under
	 * attributes:?" hint. No-op when not editing a component file.
	 */
	#detectMisnestedAttributeDeclarations(): ValidateError[] {
		const fmString = this.#ast.attributes?.frontmatter as string | undefined;
		if (!fmString) return [];
		const { frontmatter: fm } = parseFrontmatter(fmString);

		return detectMisnestedAttributeDeclarations(fm).map(({ key, type }) =>
			this.#fileLevelError(
				'misnested-component-attribute',
				`Frontmatter key "${key}" looks like an attribute declaration but isn't nested under \`attributes:\`. Indent it under \`attributes:\` so the component sees it — e.g.\n\nattributes:\n  ${key}:\n    type: ${type}`,
				key,
				'warning'
			)
		);
	}

	/**
	 * Build a synthetic error the editor can actually PAINT. The decoration
	 * pipeline (ValidationModel) renders errors either anchored to an AST node's
	 * line, or — for everything else — only when `type === 'text'` with real
	 * `lines` and a non-empty character range. Frontmatter problems have no AST
	 * node, so they take the second path: when `frontmatterKey` is given, the
	 * squiggle lands on that key's line inside the frontmatter block; otherwise
	 * on the file's first line.
	 */
	#fileLevelError(
		id: string,
		message: string,
		frontmatterKey?: string,
		level: 'error' | 'warning' = 'error'
	): ValidateError {
		let line = 0;
		let length = 3; // the `---` opener, when we can't do better
		if (frontmatterKey) {
			const fmString = this.#ast.attributes?.frontmatter as string | undefined;
			if (fmString) {
				const escaped = frontmatterKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const re = new RegExp(`^\\s*${escaped}\\s*:`);
				const fmLines = fmString.split(/\r?\n/);
				const idx = fmLines.findIndex((l) => re.test(l));
				if (idx !== -1) {
					// Document line 0 is the opening `---`; frontmatter content
					// starts at document line 1.
					line = idx + 1;
					length = Math.max(fmLines[idx].length, 1);
				}
			}
		}
		return {
			type: 'text',
			lines: [line, line],
			location: {
				start: { line, character: 0 },
				end: { line, character: length }
			},
			error: { id, level, message }
		};
	}

	#debouncedTree: Debounced<RenderableTreeNode>;

	constructor(args: MarkdocRendererArgs = {}) {
		this.#debouncedTree = new Debounced(
			() =>
				transform(
					this.#ast,
					this.#validationContext,
					this.#partials,
					this.#translations,
					this.#account,
					this.#userVariables,
					this.#customComponents,
					this.#componentDeclaredAttributes
				),
			args.debounceMs
		);

		this.#validationContext = args.validationContext;
		this.#translations = args.translations ?? {};
		this.#account = args.account;
		this.#userVariables = args.userVariables;
		this.#standaloneFileType = args.standaloneFileType ?? 'page';
		this.partials = args.partials ?? {};
		this.customComponents = args.customComponents ?? {};
		this.markdown = args.content ?? '';
	}

	// #updateAst isn't debounced because editor suggestions need it immediately
	// This has to happen in this function rather than a $derived because `parse` modifies validationContext.filters
	// We could (and probably should) restructure this to make `parse` pure - it could return the filters rather than modifying its argument
	#updateAst(): void {
		untrack(() => {
			this.#ast = parse(
				this.#markdown,
				this.#validationContext,
				this.#partials,
				this.#translations,
				this.#account,
				this.#userVariables,
				this.#customComponents,
				// Read via untrack-safe getter: #componentDeclaredAttributes is
				// $derived from #ast, which we're about to mutate — Svelte 5
				// allows the read inside the untrack closure (the derived will
				// re-run after the assignment).
				this.#componentDeclaredAttributes
			);
			const inlineQueries = this.#validationContext?.inlineQueries;
			if (inlineQueries) {
				// Query execution reads this map before the debounced transform completes, but
				// only that transform sees partial and component queries — so removals can't
				// be reconciled against this AST.
				for (const node of this.#ast.walk()) {
					if (
						node.type === 'fence' &&
						node.attributes.language === 'sql' &&
						fenceQueryName(node.attributes.meta as string)
					) {
						const { name, attrs } = parseFenceMeta(node.attributes.meta as string);
						inlineQueries.set(name, node.attributes.content as string, attrs.connection);
					}
				}
			}
		});
	}

	updateValidationContext(toUpdate: Partial<ValidationContext>): void {
		// Filters are registered as a side effect of `parse`, so a store swapped in here starts
		// empty — without a reparse the file's own filters validate as missing.
		const filtersChanged =
			'filters' in toUpdate && toUpdate.filters !== this.#validationContext?.filters;
		untrack(() => {
			assign(this.#validationContext, toUpdate);
		});
		if (filtersChanged) this.#updateAst();
	}
}
