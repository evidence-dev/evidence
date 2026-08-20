# UserComponentModel

`UserComponentModel` is the **foundation** for all of our user-facing data components (tables, dimensions, measures, pivots, etc).  
Think of it like the **blueprint** for every component: it defines the rules for how components talk to each other, what data they hold, and how they can be serialized/deserialized during SSR.

## Why is it abstract?

An **abstract class** is like a "template" that you can't use directly.  
You don't create a `UserComponentModel` on its own—you only create _subclasses_ like `TableModel` or `DimensionModel` that **fill in the blanks**.

This lets us:

- Define **shared rules** once (e.g. parent/child validation, attribute reactivity, serialization).
- Ensure every subclass plays by the same rules, while still giving them the freedom to customize.

Analogy:

- Abstract class = "You must have wheels, but you can decide if you're a car, a bike, or a skateboard."

## Attributes

Every UserComponentModel accepts a `MaybeGetter` for the component's attributes in its constructor argument. `MaybeGetter` is used to allow the attributes to be either a plain value (`Record<string, unknown>`) or a function that returns a value (a _getter_: `() => Record<string, unknown>`). Accepting a function is necessary for [reactivity when passing state around](https://svelte.dev/docs/svelte/$state#Passing-state-into-functions). Reactivity isn't always necessary (like on the server during SSR)
so its a *Maybe*Getter.

In the constructor, the attributes use something called `useStable`. This prevents reactivity churn when the user is typing in the editor. When the user types, a new Markdoc RenderableTree is generated with every keystroke (after a debounce). This means that every model gets a brand new attributes object each time, which would cause all of the queries to re-run. To prevent this, `useStable` only returns a new value if the state has _actually changed_ by doing a recursive comparison of values all the way down objects and arrays.

## Parents and Children

2. **Parent**

   - The "container" this model lives inside.
   - Example: A `DimensionModel` can only exist _inside_ a `TableModel`.

3. **Children**
   - Models that live _inside_ this one.
   - Example: A `TableModel` can contain multiple `DimensionModel` and `MeasureModel` children.

This creates a **tree structure** with our models that mimics the RenderableTree from markdoc. It enables parents and children to depend on and interact with each other to run queries.

### Why we check parent/child at runtime

Even though TypeScript checks parent/child relationships at compile time, we also validate them at runtime (`isValidParent` and `isValidChild`). This is necessary because the user's input is completely dynamic and they could build components with invalid parent/child relationships, which would result in us creating models with invalid parent/child relationships. By checking the types of parents/children, we make sure we _fail fast_ with a clear error rather than something failing obscurely down the line.

```ts
const dimension = new DimensionModel(...);
table.addChild(dimension); // ✅ Works

const measure = new MeasureModel(...);
dimension.addChild(measure); // ❌ Throws runtime error
```

## Serialization and SSR

Serialization and Deserialization is the process of converting a complex object into a JSON representation and then back again. This process is necessary because only JSON can be sent from the server to the client, not classes, functions, or other complex entities.

If a component needs to be serializable, it should specify its serialized type via the `Serialized` generic, implement the `toSerialized` function to return its serialized data, and perform necessary deserialization using the `serialized` data in the model constructor.

_Note: We don't have to serialize all the way down to JSON! SvelteKit uses [devalue](https://github.com/rich-harris/devalue) under the hood which supports some more complex types like `Date` and `Map`._

## Generics

### What even are generics?

Generics are a way of writing code that is flexible but still type-safe.

Think of them as placeholders for types. Instead of hard-coding "this must always be a string" or "this must always be a number," we say "this can work with any type, but once you pick the type, it stays consistent."

For example, imagine we need a function that ensures something is always an array. We can pass it an argument that may or may not be an array, and it will ensure that what is returned is an array. This kind of function doesn't care if we're dealing with an array of strings, numbers, or anything else. We can use generics to make the types behave nicely with any kind of input.

```ts
function makeArray<T>(input: T | T[]): T[] {
	return Array.isArray(input) ? input : [input];
}

const example1 = makeArray(1); // -> number[]
const example2 = makeArray(['a', 'b', 'c']); // -> string[]
const example3 = makeArray(new SomeClass()); // -> SomeClass[]
```

UserComponentModel's generic types work fundamentally the same. They ensure consistency between the types of attributes, parents, children, and the serialized version of a model.

### Why do they look weird/extra complex for UserComponentModel?

You'll notice the type definition uses a **big object of options** rather than simple type parameters:

```ts
type TableModelGenerics = WithDefaults<{
	Attributes: TableAttributes;
	Serialized: SerializedTableModel;
	ValidChildren: [typeof DimensionModel, typeof MeasureModel, typeof PivotModel];
}>;
```

Why?

1. **Clarity** - Instead of positional generics (`<A, S, P, C>`), we structure them in an object where each type has an explicit name from its key. This is more readable when there are a lot of generic types.
2. **Flexibility** - You don't always need to set all options. Using the `WithDefaults` helper, you can override just the parts you need, and leave the rest at defaults.

## State in models

For reactivity, use `$state` and `$derived` (or `$derived.by`) for models' member variables.

Use `$state` for data that is changed during reactivity (e.g. `page`, `search`, `order` in `TableModel`)

Use `$derived` (or `$derived.by`) for state that is computed (derived) from other state like `$state` declarations, the model's attributes, etc (e.g. `queryConfig` in `TableModel`)

_Note: Use `$derived` or `derived.by` for computed state, NOT getters (`get myField() { }`). Getters will be re-executed whenever they are read resulting in performance issues._
