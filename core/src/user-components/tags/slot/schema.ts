import Markdoc, { type Config, type Node } from '@markdoc/markdoc';
import type { UserComponentSchema } from '../../types';

/**
 * Placeholder Tag name the slot transforms into. The enclosing custom
 * component's transform replaces these with the call-site children (see
 * build-custom-tags.ts); a final pass in process-markdoc dissolves any
 * survivors (slot used outside a component, or a component previewed
 * standalone) into their fallback children so nothing reaches the renderer.
 */
export const SLOT_PLACEHOLDER = '__ev_slot';

export const schema = {
	// `render` doubles as the registry key (the author-facing tag name); the
	// transform below emits the internal placeholder Tag instead.
	render: 'slot',
	category: 'ui',
	selfClosing: false,
	description:
		'Marks where a custom component renders its call-site children. Only meaningful inside a components/*.md file: rendering {% slot /%} in a component body turns the component tag into a container — everything the caller writes between {% my_component %} and {% /my_component %} (markdown, built-in components, other custom components, {% html %} blocks) renders at the slot position, evaluated in the CALLER\'s scope (its queries and inputs are the page\'s, not the component\'s). Give a slot a name ({% slot name="figure" /%}) to define multiple regions the caller fills with {% fill slot="figure" %}…{% /fill %}; call-site content outside any {% fill %} flows into the unnamed default slot. Content between {% slot %} and {% /slot %} is fallback content, rendered only when the caller provides nothing for that slot.',
	attributes: {
		name: {
			type: String,
			required: false,
			description:
				'Optional slot name. A named slot is filled at the call site with {% fill slot="<name>" %}…{% /fill %}; the unnamed slot receives all call-site content outside any fill block.'
		}
	},
	examples: [
		{
			hero: true,
			title: 'Default slot — a component that wraps caller content',
			example: `
<!-- components/warning_box.md -->
---
type: component
attributes:
    tone:
        type: string
        default: info
        options: [info, success, warning, error]
---

{% callout type="{{$tone}}" %}
{% slot /%}
{% /callout %}

<!-- On a page -->
{% warning_box tone="warning" %}
Revenue fell **12%** in EMEA. {% big_value data="emea" value="rev" /%}
{% /warning_box %}
`
		},
		{
			title: 'Named slots with fallback content',
			example: `
<!-- components/metric_card.md -->
{% grid cols=2 %}
{% slot name="figure" /%}
{% slot name="detail" %}_No detail provided._{% /slot %}
{% /grid %}

<!-- On a page -->
{% metric_card %}
{% fill slot="figure" %}{% big_value data="kpis" value="rev" /%}{% /fill %}
{% fill slot="detail" %}{% line_chart data="monthly" x="month" y="rev" /%}{% /fill %}
{% /metric_card %}
`
		}
	],
	// Render a placeholder Tag carrying the transformed fallback children —
	// the component transform (or the final dissolving pass) replaces it.
	transform(node: Node, config: Config) {
		return new Markdoc.Tag(
			SLOT_PLACEHOLDER,
			{ name: node.attributes.name },
			node.transformChildren(config),
			node.location,
			node.lines
		);
	},
	componentWrapper: false,
	undocumented: true
} as const satisfies UserComponentSchema;
